-- PEE CNGEI — giri di revisione del Progetto Personale (12 novembre 2026)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca né cancella dati esistenti. Funziona solo con l'anteprima: il sito principale non usa queste tabelle.
--
-- Cosa aggiunge
--   pee_giri          copie congelate (immutabili) del Progetto Personale: «Giro 1, 2, 3…», quanti ne servono
--   pee_giri_dest     a chi è stato condiviso un giro in app: revisore (Tutor, ICdF) oppure in copia (Capo Gruppo, CdS)
--   pee_giri_rev      note, stati, check-list ed esiti del revisore; «recepita» lo segna chi ha scritto il progetto
--   pee_revisori_ammessi / pee_config   funzione ancora in prova: vale solo per gli indirizzi in elenco,
--                     oppure per tutti se l'interruttore «revisori_aperto» è su «si»
-- I giri non stanno in pee_versioni: lì le copie vengono sfoltite, qui mai.
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
  n             int  not null,
  sezioni       int[] not null default '{}',
  nomi_inclusi  boolean not null default true,
  nota          text not null default '' check (char_length(nota) <= 2000),
  data          jsonb not null,
  created_at    timestamptz not null default now(),
  unique (archivio_id, n)
);
create index if not exists pee_giri_arch on public.pee_giri (archivio_id, n);
alter table public.pee_giri enable row level security;

-- numero progressivo assegnato dal database (nessun tetto); copia immutabile
create or replace function public.pee_giri_prima() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('pee_giri:' || new.archivio_id::text));
    select coalesce(max(n), 0) + 1 into new.n from public.pee_giri where archivio_id = new.archivio_id;
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
-- nessuna regola per modificare o cancellare: i giri restano come sono (spariscono solo con il progetto)

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
  check (tipo <> 'check' or valore in ('si', 'no', 'na', '')),
  check (tipo <> 'esito' or valore in ('da_integrare', 'chiarimenti', 'approva'))
);
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
      new.recepita := old.recepita; new.recepita_il := old.recepita_il;
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
