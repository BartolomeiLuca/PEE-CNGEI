-- PEE CNGEI — giri di revisione del Progetto Personale (12 novembre 2026)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca né cancella dati esistenti. Funziona solo con l'anteprima: il sito principale non usa queste tabelle.
--
-- Cosa aggiunge
--   pee_giri          copie congelate (immutabili, eliminabili dal titolare) del Progetto Personale: «Giro 1, 2, 3…», quanti ne servono
--   pee_giri_dest     a chi è stato condiviso un giro in app: revisore (Tutor, ICdF) oppure in copia (Capo Gruppo, CdS)
--   pee_giri_rev      note, stati, check-list ed esiti del revisore; «recepita» lo segna chi ha scritto il progetto
--   pee_revisori_ammessi / pee_config   funzione ancora in prova: vale solo per gli indirizzi in elenco,
--                     oppure per tutti se l'interruttore «revisori_aperto» è su «si»
-- I giri non stanno in pee_versioni: lì le copie vengono sfoltite, qui mai (si eliminano solo se il titolare lo decide).
-- Il revisore NON diventa membro del progetto (pee_membri): vede solo la copia del giro a cui è stato invitato.

-- ══ 1. Interruttore e elenco ammessi (nessun accesso diretto: solo tramite la funzione) ══
create table if not exists public.pee_config (
  chiave  text primary key,
  valore  text not null default ''
);
alter table public.pee_config enable row level security;
insert into public.pee_config(chiave, valore) values ('revisori_aperto', 'no') on conflict (chiave) do nothing;

create table if not exists public.pee_revisori_ammessi (
  email       text primary key check (email = lower(email)),
  created_at  timestamptz not null default now()
);
alter table public.pee_revisori_ammessi enable row level security;
insert into public.pee_revisori_ammessi(email) values ('luca.bartolomei@cngei.it') on conflict (email) do nothing;
-- (nessuna policy: né tester né revisori possono leggere o scrivere queste due tabelle)

-- sì/no: questo indirizzo può ricevere un giro come revisore?
create or replace function public.revisore_abilitato(em text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select valore = 'si' from public.pee_config where chiave = 'revisori_aperto'), false)
      or exists (select 1 from public.pee_revisori_ammessi where email = lower(coalesce(em, '')))
$$;
revoke all on function public.revisore_abilitato(text) from public, anon;
grant execute on function public.revisore_abilitato(text) to authenticated;

-- ══ 2. Giri congelati ══
create table if not exists public.pee_giri (
  id            uuid primary key default gen_random_uuid(),
  archivio_id   uuid not null references public.pee_archivi(id) on delete cascade,
  owner_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  n             int  not null default 0,   -- il database assegna il successivo; l'app può chiedere un numero più alto (giri storici già segnati a mano)
  sezioni       int[] not null default '{}',
  nomi_inclusi  boolean not null default true,
  nota          text not null default '' check (char_length(nota) <= 2000),
  meta          jsonb not null default '{}'::jsonb,   -- intestazione leggera (nome, titolo, Branca) per l'elenco di chi deve rivedere
  data          jsonb not null,
  created_at    timestamptz not null default now(),
  unique (archivio_id, n)
);
alter table public.pee_giri add column if not exists meta jsonb not null default '{}'::jsonb;
create index if not exists pee_giri_arch on public.pee_giri (archivio_id, n);
alter table public.pee_giri enable row level security;

-- numero progressivo assegnato dal database (nessun tetto); copia immutabile
create or replace function public.pee_giri_prima() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('pee_giri:' || new.archivio_id::text));
    select greatest(coalesce(max(n), 0) + 1, coalesce(new.n, 0)) into new.n from public.pee_giri where archivio_id = new.archivio_id;
    return new;
  end if;
  raise exception 'Un giro congelato non si modifica: per cambiare qualcosa crea un nuovo giro';
end $$;
drop trigger if exists pee_giri_ins on public.pee_giri;
create trigger pee_giri_ins before insert on public.pee_giri for each row execute function public.pee_giri_prima();
drop trigger if exists pee_giri_upd on public.pee_giri;
create trigger pee_giri_upd before update on public.pee_giri for each row execute function public.pee_giri_prima();

-- ══ 3. Destinatari ══
create table if not exists public.pee_giri_dest (
  id          uuid primary key default gen_random_uuid(),
  giro_id     uuid not null references public.pee_giri(id) on delete cascade,
  email       text not null check (email = lower(email) and char_length(email) <= 200),
  ruolo       text not null check (ruolo in ('revisore', 'copia')),
  nome        text not null default '' check (char_length(nome) <= 120),
  created_at  timestamptz not null default now(),
  unique (giro_id, email)
);
create index if not exists pee_giri_dest_email on public.pee_giri_dest (email);
alter table public.pee_giri_dest enable row level security;

create or replace function public.pee_giro_is_owner(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pee_giri where id = g and owner_id = auth.uid())
$$;
-- ruolo di chi è collegato rispetto a un giro: 'revisore' (solo se la funzione è aperta a lui), 'copia' o null
create or replace function public.pee_giro_ruolo(g uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select d.ruolo from public.pee_giri_dest d
   where d.giro_id = g and d.email = public.pee_my_email()
     and (d.ruolo = 'copia' or public.revisore_abilitato(d.email))
   limit 1
$$;
revoke all on function public.pee_giro_is_owner(uuid) from public, anon;
revoke all on function public.pee_giro_ruolo(uuid) from public, anon;
grant execute on function public.pee_giro_is_owner(uuid) to authenticated;
grant execute on function public.pee_giro_ruolo(uuid) to authenticated;

-- ══ 4. Regole di accesso: giri ══
drop policy if exists "pee_giri: il titolare crea" on public.pee_giri;
create policy "pee_giri: il titolare crea" on public.pee_giri
  for insert to authenticated
  with check (owner_id = auth.uid() and public.pee_is_owner(archivio_id));

drop policy if exists "pee_giri: lettura" on public.pee_giri;
create policy "pee_giri: lettura" on public.pee_giri
  for select to authenticated
  using (owner_id = auth.uid() or public.pee_giro_ruolo(id) is not null);
-- un giro non si modifica mai (nessuna regola di modifica); il titolare può però eliminarlo: sparisce con la sua copia,
-- le sue note e gli inviti (chi l'aveva ricevuto in app non lo vede più)
drop policy if exists "pee_giri: il titolare elimina" on public.pee_giri;
create policy "pee_giri: il titolare elimina" on public.pee_giri
  for delete to authenticated
  using (owner_id = auth.uid());

-- ══ 5. Regole di accesso: destinatari ══
drop policy if exists "pee_giri_dest: il titolare gestisce" on public.pee_giri_dest;
create policy "pee_giri_dest: il titolare gestisce" on public.pee_giri_dest
  for all to authenticated
  using (public.pee_giro_is_owner(giro_id))
  with check (
    public.pee_giro_is_owner(giro_id)
    and (ruolo <> 'revisore' or public.revisore_abilitato(email))   -- funzione in prova: il database rifiuta gli altri
  );

drop policy if exists "pee_giri_dest: vedo i miei" on public.pee_giri_dest;
create policy "pee_giri_dest: vedo i miei" on public.pee_giri_dest
  for select to authenticated
  using (email = public.pee_my_email());

-- ══ 6. Note, stati, check-list ed esiti ══
create table if not exists public.pee_giri_rev (
  id            uuid primary key default gen_random_uuid(),
  giro_id       uuid not null references public.pee_giri(id) on delete cascade,
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autore_nome   text not null default '' check (char_length(autore_nome) <= 120),
  autore_ruolo  text not null default 'revisore' check (autore_ruolo in ('revisore', 'copia', 'titolare')),
  tipo          text not null check (tipo in ('nota', 'stato', 'check', 'esito')),
  chiave        text not null default '' check (char_length(chiave) <= 160),
  valore        text not null default '' check (char_length(valore) <= 40),
  testo         text not null default '' check (char_length(testo) <= 2000),
  registrata    boolean not null default false,   -- esito registrato a mano dal compilatore («registrata dal compilatore»)
  recepita      boolean not null default false,
  recepita_il   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (tipo <> 'stato' or valore in ('ok', 'rivedere', 'domanda', '')),
  check (tipo <> 'esito' or valore in ('da_integrare', 'chiarimenti', 'approva'))
);
-- check-list: sì / parzialmente / no (se la tabella è già stata creata con la versione precedente, si sostituisce la regola)
do $$ declare r record; begin
  for r in select conname from pg_constraint where conrelid = 'public.pee_giri_rev'::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%''check''%' loop
    execute format('alter table public.pee_giri_rev drop constraint %I', r.conname);
  end loop;
  alter table public.pee_giri_rev add constraint pee_giri_rev_check_val check (tipo <> 'check' or valore in ('si', 'parz', 'no', ''));
end $$;
create index if not exists pee_giri_rev_giro on public.pee_giri_rev (giro_id);
-- stato, check ed esito: una riga per persona e per voce (si aggiorna); le note possono essere più d'una
create unique index if not exists pee_giri_rev_unica on public.pee_giri_rev (giro_id, user_id, tipo, chiave, autore_nome)
  where tipo <> 'nota';
alter table public.pee_giri_rev enable row level security;

drop policy if exists "pee_giri_rev: lettura" on public.pee_giri_rev;
create policy "pee_giri_rev: lettura" on public.pee_giri_rev
  for select to authenticated
  using (public.pee_giro_is_owner(giro_id) or (user_id = auth.uid() and public.pee_giro_ruolo(giro_id) is not null));

-- il revisore scrive tutto; chi è in copia solo note (come un lettore); il titolare solo esiti registrati a mano
drop policy if exists "pee_giri_rev: scrive" on public.pee_giri_rev;
create policy "pee_giri_rev: scrive" on public.pee_giri_rev
  for insert to authenticated
  with check (
    user_id = auth.uid() and recepita = false and (
      (public.pee_giro_ruolo(giro_id) = 'revisore' and autore_ruolo = 'revisore' and registrata = false)
      or (public.pee_giro_ruolo(giro_id) = 'copia' and autore_ruolo = 'copia' and tipo = 'nota' and registrata = false)
      or (public.pee_giro_is_owner(giro_id) and autore_ruolo = 'titolare' and tipo = 'esito' and registrata = true)
    )
  );

drop policy if exists "pee_giri_rev: modifica" on public.pee_giri_rev;
create policy "pee_giri_rev: modifica" on public.pee_giri_rev
  for update to authenticated
  using (user_id = auth.uid() or public.pee_giro_is_owner(giro_id))
  with check (user_id = auth.uid() or public.pee_giro_is_owner(giro_id));

drop policy if exists "pee_giri_rev: elimina" on public.pee_giri_rev;
create policy "pee_giri_rev: elimina" on public.pee_giri_rev
  for delete to authenticated
  using (user_id = auth.uid() or public.pee_giro_is_owner(giro_id));

-- chi scrive il progetto cambia solo «recepita»; chi ha scritto la nota non può segnarsi recepita da solo
create or replace function public.pee_giri_rev_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.id is distinct from old.id or new.giro_id is distinct from old.giro_id or new.user_id is distinct from old.user_id
       or new.tipo is distinct from old.tipo or new.registrata is distinct from old.registrata
       or new.autore_ruolo is distinct from old.autore_ruolo then
      raise exception 'Questi campi non si cambiano';
    end if;
    if old.user_id = auth.uid() and not public.pee_giro_is_owner(old.giro_id) then
      -- l'autore (revisore) cambia il proprio contenuto ma non «recepita»
      -- se rivede ciò che aveva scritto, «recepita» si azzera: chi ha scritto il progetto deve rileggerlo
      if new.valore is distinct from old.valore or new.testo is distinct from old.testo then new.recepita := false; new.recepita_il := null;
      else new.recepita := old.recepita; new.recepita_il := old.recepita_il; end if;
      if public.pee_giro_ruolo(old.giro_id) is null then raise exception 'Non hai più accesso a questo giro'; end if;
    elsif public.pee_giro_is_owner(old.giro_id) and old.user_id is distinct from auth.uid() then
      -- il titolare cambia solo «recepita»
      new.autore_nome := old.autore_nome; new.chiave := old.chiave; new.valore := old.valore; new.testo := old.testo;
      if new.recepita is distinct from old.recepita then new.recepita_il := case when new.recepita then now() else null end; end if;
    end if;
    new.updated_at := now();
  end if;
  return new;
end $$;
drop trigger if exists pee_giri_rev_guard on public.pee_giri_rev;
create trigger pee_giri_rev_guard before update on public.pee_giri_rev for each row execute function public.pee_giri_rev_guard();

-- ── 13 novembre: giro «visto» (per il numero rosso di chi è in copia) e mail di avviso a chi riceve un giro in app ──
alter table public.pee_giri_dest add column if not exists visto_il timestamptz;
create or replace function public.pee_giro_visto(g uuid) returns void
language sql security definer set search_path = public as $fn$
  update public.pee_giri_dest set visto_il = coalesce(visto_il, now())
   where giro_id = g and email = public.pee_my_email();
$fn$;
revoke all on function public.pee_giro_visto(uuid) from public;
grant execute on function public.pee_giro_visto(uuid) to authenticated;

do $$ begin create extension if not exists pg_net with schema extensions; exception when others then null; end $$;
create or replace function public.pee_html(t text) returns text
language sql immutable as $fn$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$fn$;

-- mail di avviso (spedita da Brevo, stessa chiave e stesso mittente delle altre mail dell'app): solo il link, nessun contenuto del progetto
create or replace function public.pee_mail_giro() returns trigger
language plpgsql security definer set search_path = public, extensions, vault, auth as $fn$
declare
  chiave text; mittente text; g record; chi text; corpo text; ogg text; rev boolean := (new.ruolo = 'revisore');
begin
  begin
    select decrypted_secret into chiave   from vault.decrypted_secrets where name = 'brevo_api_key';
    select decrypted_secret into mittente from vault.decrypted_secrets where name = 'brevo_mittente';
    if chiave is null or mittente is null then return new; end if;
    select n, meta into g from public.pee_giri where id = new.giro_id;
    chi := coalesce(nullif(trim(g.meta->>'nome'), ''), 'Una persona');
    ogg := case when rev then 'PEE CNGEI: ' || left(chi, 60) || ' ti ha inviato un Progetto Personale da rivedere'
                         else 'PEE CNGEI: ' || left(chi, 60) || ' ti ha inviato in copia un Progetto Personale' end;
    corpo :=
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">'
      || '<h2 style="color:#1b5e42;margin:0 0 12px">' || case when rev then 'Un Progetto Personale da rivedere' else 'Un Progetto Personale in copia' end || '</h2>'
      || '<p><b>' || pee_html(chi) || '</b> ti ha inviato in PEE CNGEI il <b>Giro ' || coalesce(g.n, 0) || '</b>'
      || coalesce(' del progetto «' || pee_html(nullif(g.meta->>'titolo', '')) || '»', '') || '.</p>'
      || '<p>' || case when rev then 'Lo trovi nella pagina <b>Progetti</b>, sotto «Giri da rivedere»: puoi leggerlo e lasciare le tue osservazioni.'
                       else 'Lo trovi nella pagina <b>Progetti</b>, sotto «Giri da rivedere»: puoi leggerlo e lasciare dei suggerimenti.' end || '</p>'
      || '<p style="margin:18px 0"><a href="https://pee-app.it/anteprima/#progetti" style="background:#1b5e42;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Apri PEE CNGEI</a></p>'
      || '<p style="color:#555;font-size:13px">Se non hai ancora un account, creane uno con questo stesso indirizzo email (' || pee_html(new.email) || '): vedrai il giro appena entri.</p>'
      || '<p style="color:#777;font-size:12px;margin-top:20px">Questa mail non contiene il progetto, solo l’avviso.</p></div>';
    perform net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', chiave, 'Content-Type', 'application/json', 'accept', 'application/json'),
      body    := jsonb_build_object('sender', jsonb_build_object('name', 'PEE CNGEI', 'email', mittente),
        'to', jsonb_build_array(jsonb_build_object('email', new.email)), 'subject', ogg, 'htmlContent', corpo),
      timeout_milliseconds := 5000);
  exception when others then
    raise warning 'pee_mail_giro: %', sqlerrm;
  end;
  return new;
end
$fn$;
drop trigger if exists pee_mail_giro on public.pee_giri_dest;
create trigger pee_mail_giro after insert on public.pee_giri_dest for each row execute function public.pee_mail_giro();

-- ══ 9. Dialogo per punto: risposte tra chi ha scritto il progetto e chi lo rivede ══
-- Un filo per ogni punto commentato (chiave) e per ogni revisore; resta uguale da un giro all'altro. Un solo livello: messaggi brevi, nessuna modifica.
create table if not exists public.pee_giri_msg (
  id            uuid primary key default gen_random_uuid(),
  archivio_id   uuid not null,
  rev_id        uuid not null references auth.users(id) on delete cascade,   -- il revisore con cui è il filo
  chiave        text not null check (char_length(chiave) <= 160),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autore_nome   text not null default '' check (char_length(autore_nome) <= 120),
  autore_ruolo  text not null check (autore_ruolo in ('revisore', 'titolare')),
  testo         text not null check (char_length(testo) between 1 and 600),
  created_at    timestamptz not null default now()
);
create index if not exists pee_giri_msg_arch on public.pee_giri_msg (archivio_id, created_at);
alter table public.pee_giri_msg enable row level security;

create or replace function public.pee_arch_revisore(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pee_giri g where g.archivio_id = a and public.pee_giro_ruolo(g.id) = 'revisore');
$$;
revoke all on function public.pee_arch_revisore(uuid) from public, anon;
grant execute on function public.pee_arch_revisore(uuid) to authenticated;

drop policy if exists "pee_giri_msg: lettura" on public.pee_giri_msg;
create policy "pee_giri_msg: lettura" on public.pee_giri_msg
  for select to authenticated
  using (public.pee_is_owner(archivio_id) or rev_id = auth.uid());

drop policy if exists "pee_giri_msg: scrive" on public.pee_giri_msg;
create policy "pee_giri_msg: scrive" on public.pee_giri_msg
  for insert to authenticated
  with check (
    user_id = auth.uid() and (
      (autore_ruolo = 'titolare' and public.pee_is_owner(archivio_id))
      or (autore_ruolo = 'revisore' and rev_id = auth.uid() and public.pee_arch_revisore(archivio_id))
    )
  );

drop policy if exists "pee_giri_msg: elimina" on public.pee_giri_msg;
create policy "pee_giri_msg: elimina" on public.pee_giri_msg
  for delete to authenticated
  using (user_id = auth.uid());

-- ══ 10. Una revisione sola per progetto: si apre al primo invio, si chiude quando il revisore approva ══
-- Il revisore è uno solo (Tutor o ICdF), scelto all'invio. Ogni punto commentato ha uno stato:
--   da_fare → (il compilatore) fatto oppure attesa (ha un dubbio) → (il revisore) confermato, oppure di nuovo da_fare.
-- «fase» dice a chi tocca: 'revisore' (legge) o 'compilatore' (lavora). Le copie congelate (pee_giri) restano: una all'invio e una a ogni «Ho finito».
create table if not exists public.pee_revisioni (
  id              uuid primary key default gen_random_uuid(),
  archivio_id     uuid not null references public.pee_archivi(id) on delete cascade,
  owner_id        uuid not null references auth.users(id) on delete cascade,
  revisore_email  text check (revisore_email is null or (revisore_email = lower(revisore_email) and char_length(revisore_email) <= 200)),
  stato           text not null default 'aperta' check (stato in ('aperta', 'chiusa')),
  fase            text not null default 'revisore' check (fase in ('revisore', 'compilatore')),
  esito           text check (esito is null or esito in ('approvata', 'storica')),
  primo_giro_id   uuid references public.pee_giri(id) on delete set null,
  ultimo_giro_id  uuid references public.pee_giri(id) on delete set null,
  nota_chiusura   text not null default '' check (char_length(nota_chiusura) <= 600),
  aperta_il       timestamptz not null default now(),
  chiusa_il       timestamptz,
  updated_at      timestamptz not null default now()
);
create unique index if not exists pee_revisioni_una_aperta on public.pee_revisioni (archivio_id) where stato = 'aperta';
create index if not exists pee_revisioni_arch on public.pee_revisioni (archivio_id, aperta_il);
alter table public.pee_revisioni enable row level security;

create table if not exists public.pee_revisioni_punto (
  revisione_id   uuid not null references public.pee_revisioni(id) on delete cascade,
  chiave         text not null check (char_length(chiave) <= 160),
  stato          text not null default 'da_fare' check (stato in ('da_fare', 'attesa', 'fatto', 'confermato')),
  nota           text not null default '' check (char_length(nota) <= 300),   -- una riga del compilatore: perché «fatto» senza modifiche, o la domanda
  aggiornato_da  uuid default auth.uid(),
  updated_at     timestamptz not null default now(),
  primary key (revisione_id, chiave)
);
alter table public.pee_revisioni_punto enable row level security;

-- chi è chi in una revisione: 'titolare', 'revisore' o null
create or replace function public.pee_rev_ruolo(r uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select case when v.owner_id = auth.uid() then 'titolare'
              when public.pee_arch_revisore(v.archivio_id) then 'revisore' end
    from public.pee_revisioni v where v.id = r
$$;
revoke all on function public.pee_rev_ruolo(uuid) from public, anon;
grant execute on function public.pee_rev_ruolo(uuid) to authenticated;

drop policy if exists "pee_revisioni: lettura" on public.pee_revisioni;
create policy "pee_revisioni: lettura" on public.pee_revisioni for select to authenticated using (public.pee_rev_ruolo(id) is not null);
drop policy if exists "pee_revisioni_punto: lettura" on public.pee_revisioni_punto;
create policy "pee_revisioni_punto: lettura" on public.pee_revisioni_punto for select to authenticated using (public.pee_rev_ruolo(revisione_id) is not null);
revoke insert, update, delete on public.pee_revisioni, public.pee_revisioni_punto from authenticated, anon;

-- al primo invio si apre la revisione; gli invii successivi (ogni «Ho finito») si agganciano a quella aperta
create or replace function public.pee_rev_dopo_giro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('pee_rev:' || new.archivio_id::text));
  if exists (select 1 from public.pee_revisioni where archivio_id = new.archivio_id and stato = 'aperta') then
    update public.pee_revisioni set ultimo_giro_id = new.id, updated_at = now() where archivio_id = new.archivio_id and stato = 'aperta';
  else
    insert into public.pee_revisioni (archivio_id, owner_id, primo_giro_id, ultimo_giro_id) values (new.archivio_id, new.owner_id, new.id, new.id);
  end if;
  return new;
end $$;
drop trigger if exists pee_rev_dopo_giro on public.pee_giri;
create trigger pee_rev_dopo_giro after insert on public.pee_giri for each row execute function public.pee_rev_dopo_giro();

-- il revisore è uno solo: lo fissa il primo invio, poi non si cambia (chi scrive dall'app; l'amministratore del database può correggere)
create or replace function public.pee_rev_dest_prima() returns trigger
language plpgsql security definer set search_path = public as $$
declare v public.pee_revisioni;
begin
  if new.ruolo <> 'revisore' then return new; end if;
  select r.* into v from public.pee_revisioni r join public.pee_giri g on g.archivio_id = r.archivio_id
   where g.id = new.giro_id and r.stato = 'aperta';
  if v.id is null then return new; end if;
  if v.revisore_email is null then
    update public.pee_revisioni set revisore_email = new.email, updated_at = now() where id = v.id;
  elsif v.revisore_email <> new.email and auth.uid() is not null then
    raise exception 'Il revisore di questa revisione è già stato scelto (%): per cambiarlo bisogna chiuderla', v.revisore_email;
  end if;
  return new;
end $$;
drop trigger if exists pee_rev_dest_prima on public.pee_giri_dest;
create trigger pee_rev_dest_prima before insert on public.pee_giri_dest for each row execute function public.pee_rev_dest_prima();

-- ogni commento del revisore su un punto diventa (o riapre) un punto da fare; la vecchia casella «recepita» muove lo stesso stato
create or replace function public.pee_rev_dopo_nota() returns trigger
language plpgsql security definer set search_path = public as $$
declare v uuid; cur text;
begin
  if new.tipo <> 'nota' or new.autore_ruolo = 'titolare' then return new; end if;
  select r.id into v from public.pee_revisioni r join public.pee_giri g on g.archivio_id = r.archivio_id
   where g.id = new.giro_id and r.stato = 'aperta';
  if v is null then return new; end if;
  select stato into cur from public.pee_revisioni_punto where revisione_id = v and chiave = new.chiave;
  if new.testo = '' then return new; end if;
  if tg_op = 'INSERT' or old.testo is distinct from new.testo then
    insert into public.pee_revisioni_punto (revisione_id, chiave, stato, aggiornato_da) values (v, new.chiave, 'da_fare', new.user_id)
      on conflict (revisione_id, chiave) do update set stato = 'da_fare', nota = '', updated_at = now() where public.pee_revisioni_punto.stato <> 'da_fare';
  elsif new.recepita and not old.recepita and cur = 'da_fare' then
    update public.pee_revisioni_punto set stato = 'fatto', updated_at = now() where revisione_id = v and chiave = new.chiave;
  elsif not new.recepita and old.recepita and cur = 'fatto' then
    update public.pee_revisioni_punto set stato = 'da_fare', updated_at = now() where revisione_id = v and chiave = new.chiave;
  end if;
  return new;
end $$;
drop trigger if exists pee_rev_dopo_nota on public.pee_giri_rev;
create trigger pee_rev_dopo_nota after insert or update on public.pee_giri_rev for each row execute function public.pee_rev_dopo_nota();

-- azioni (le sole che cambiano gli stati)
create or replace function public.pee_rev_punto(r uuid, k text, s text, n text default '') returns void
language plpgsql security definer set search_path = public as $$
declare ru text := public.pee_rev_ruolo(r); v public.pee_revisioni; cur text;
begin
  select * into v from public.pee_revisioni where id = r;
  if ru is null or v.stato <> 'aperta' then raise exception 'Revisione non disponibile'; end if;
  select stato into cur from public.pee_revisioni_punto where revisione_id = r and chiave = k;
  if ru = 'titolare' then
    if s not in ('fatto', 'attesa') or cur is null then raise exception 'Azione non consentita'; end if;
    if cur = 'confermato' then raise exception 'Punto già confermato dal revisore'; end if;
  else
    if s not in ('da_fare', 'confermato') then raise exception 'Azione non consentita'; end if;
    if cur is null and s <> 'da_fare' then raise exception 'Punto inesistente'; end if;
  end if;
  insert into public.pee_revisioni_punto (revisione_id, chiave, stato, nota, aggiornato_da) values (r, k, s, left(coalesce(n, ''), 300), auth.uid())
    on conflict (revisione_id, chiave) do update set stato = excluded.stato, nota = case when excluded.nota <> '' then excluded.nota else public.pee_revisioni_punto.nota end, aggiornato_da = auth.uid(), updated_at = now();
  update public.pee_revisioni set updated_at = now() where id = r;
end $$;

create or replace function public.pee_rev_ho_finito(r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.pee_rev_ruolo(r) is distinct from 'titolare' then raise exception 'Solo chi ha scritto il progetto'; end if;
  if not exists (select 1 from public.pee_revisioni where id = r and stato = 'aperta' and fase = 'compilatore') then raise exception 'Non è il tuo turno'; end if;
  if exists (select 1 from public.pee_revisioni_punto where revisione_id = r and stato in ('da_fare', 'attesa')) then raise exception 'Ci sono ancora punti da fare o in attesa di risposta'; end if;
  update public.pee_revisioni set fase = 'revisore', updated_at = now() where id = r;
end $$;

create or replace function public.pee_rev_rimanda(r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.pee_rev_ruolo(r) is distinct from 'revisore' then raise exception 'Solo il revisore'; end if;
  if not exists (select 1 from public.pee_revisioni where id = r and stato = 'aperta' and fase = 'revisore') then raise exception 'Non è il tuo turno'; end if;
  if not exists (select 1 from public.pee_revisioni_punto where revisione_id = r and stato in ('da_fare', 'attesa')) then raise exception 'Nessun punto da riaprire: puoi approvare'; end if;
  update public.pee_revisioni set fase = 'compilatore', updated_at = now() where id = r;
end $$;

create or replace function public.pee_rev_approva(r uuid, n text default '') returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.pee_rev_ruolo(r) is distinct from 'revisore' then raise exception 'Solo il revisore'; end if;
  if not exists (select 1 from public.pee_revisioni where id = r and stato = 'aperta' and fase = 'revisore') then raise exception 'Non è il tuo turno'; end if;
  if exists (select 1 from public.pee_revisioni_punto where revisione_id = r and stato <> 'confermato') then raise exception 'Ci sono punti non ancora confermati'; end if;
  update public.pee_revisioni set stato = 'chiusa', esito = 'approvata', nota_chiusura = left(coalesce(n, ''), 600), chiusa_il = now(), updated_at = now() where id = r;
end $$;
revoke all on function public.pee_rev_punto(uuid, text, text, text), public.pee_rev_ho_finito(uuid), public.pee_rev_rimanda(uuid), public.pee_rev_approva(uuid, text) from public, anon;
grant execute on function public.pee_rev_punto(uuid, text, text, text), public.pee_rev_ho_finito(uuid), public.pee_rev_rimanda(uuid), public.pee_rev_approva(uuid, text) to authenticated;

-- giri e commenti già esistenti: una revisione per progetto (chiusa se l'ultimo giro ha un esito, altrimenti aperta); nessun dato viene toccato
insert into public.pee_revisioni (archivio_id, owner_id, revisore_email, stato, fase, esito, primo_giro_id, ultimo_giro_id, aperta_il, chiusa_il)
select g.archivio_id, (array_agg(g.owner_id order by g.n))[1],
       (select d.email from public.pee_giri_dest d join public.pee_giri g2 on g2.id = d.giro_id where g2.archivio_id = g.archivio_id and d.ruolo = 'revisore' order by g2.n desc, d.created_at limit 1),
       case when x.chiusa then 'chiusa' else 'aperta' end, 'revisore', case when x.chiusa then 'storica' end,
       (array_agg(g.id order by g.n))[1], (array_agg(g.id order by g.n desc))[1], min(g.created_at), case when x.chiusa then max(g.created_at) end
  from public.pee_giri g
  cross join lateral (select exists (select 1 from public.pee_giri_rev e where e.tipo = 'esito' and e.giro_id = (select id from public.pee_giri where archivio_id = g.archivio_id order by n desc limit 1)) as chiusa) x
 where not exists (select 1 from public.pee_revisioni r where r.archivio_id = g.archivio_id)
 group by g.archivio_id, x.chiusa;

insert into public.pee_revisioni_punto (revisione_id, chiave, stato, aggiornato_da)
select distinct on (r.id, n.chiave) r.id, n.chiave,
       case when r.stato = 'chiusa' or n.recepita then (case when r.stato = 'chiusa' then 'confermato' else 'fatto' end) else 'da_fare' end, n.user_id
  from public.pee_revisioni r
  join public.pee_giri g on g.archivio_id = r.archivio_id
  join public.pee_giri_rev n on n.giro_id = g.id and n.tipo = 'nota' and n.testo <> '' and n.autore_ruolo <> 'titolare'
 order by r.id, n.chiave, n.updated_at desc
on conflict do nothing;
