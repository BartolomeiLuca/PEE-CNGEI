-- PEE CNGEI — piani (Piano di Gruppo, Progetto di Clan, Progetto di Sezione) — 23 novembre 2026
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca né cancella nessun dato esistente: aggiunge solo tabelle nuove. Il sito principale non le usa.
--
-- Cosa aggiunge
--   pee_piani           un documento per ogni piano (tipo: gruppo, clan o sezione), nel suo periodo di 3 o 4 anni
--   pee_piani_versioni  copie dello storico (verifiche annuali, delibere, aggiornamenti): non si modificano mai
--   pee_piani_membri    chi ha accesso a un piano, oltre a chi l'ha creato: lettore, collaboratore o co-titolare
--
-- Perché una tabella propria: chi viene invitato a un PROGETTO riceve l'intero progetto; chi viene invitato a un
-- PIANO vede solo il piano. Gli inviti ai piani sono separati da quelli ai progetti (pee_membri non cambia).
--
-- Ruoli nel piano
--   titolare       chi lo ha creato: tutto, compreso eliminarlo e invitare co-titolari
--   cotitolare     modifica tutto; invita lettori e collaboratori; non elimina il piano
--   collaboratore  modifica il contenuto (le «parti affidate» sono limitate dall'app, come per i progetti); non può
--                  cambiare titolo, periodo o stato, né cancellare parti del piano; non invita
--   lettore        legge soltanto (nessun suggerimento: i pareri si raccolgono in presenza)
--
-- Modifiche contemporanee: ogni salvataggio deve indicare la versione (rev) che ha letto. Se nel frattempo
-- qualcun altro ha salvato, il database rifiuta (codice 40001) e l'app ricarica: nessuno cancella il lavoro di un altro.
--
-- Per tornare indietro (solo se servisse): drop table public.pee_piani_versioni, public.pee_piani_membri, public.pee_piani cascade;

-- ══ 1. Piani ══
create table if not exists public.pee_piani (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_email      text not null default '' check (char_length(owner_email) <= 200),
  tipo             text not null check (tipo in ('gruppo', 'clan', 'sezione')),
  titolo           text not null default '' check (char_length(titolo) <= 160),
  anno_inizio      int  not null check (anno_inizio between 2020 and 2100),
  durata           int  not null default 3 check (durata in (3, 4)),
  stato            text not null default 'bozza' check (stato in ('bozza', 'deliberato', 'approvato')),
  archivio_id      uuid references public.pee_archivi(id) on delete set null,   -- il progetto del titolare in cui il piano «appare»
  data             jsonb not null default '{}'::jsonb
                   check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000),
  rev              int  not null default 1,
  updated_by       uuid references auth.users(id) on delete set null,
  updated_by_nome  text not null default '' check (char_length(updated_by_nome) <= 120),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists pee_piani_owner on public.pee_piani (owner_id);
create index if not exists pee_piani_archivio on public.pee_piani (archivio_id);
alter table public.pee_piani enable row level security;

-- ══ 2. Inviti ai piani ══
create table if not exists public.pee_piani_membri (
  id          uuid primary key default gen_random_uuid(),
  piano_id    uuid not null references public.pee_piani(id) on delete cascade,
  invitato_da uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email       text not null check (email = lower(email) and char_length(email) <= 200),
  ruolo       text not null default 'lettore' check (ruolo in ('lettore', 'collaboratore', 'cotitolare')),
  etichetta   text not null default '' check (char_length(etichetta) <= 60),   -- «Commissario», «Presidente», «Vice Capo Gruppo»…
  nome        text not null default '' check (char_length(nome) <= 120),
  visto_il    timestamptz,
  created_at  timestamptz not null default now(),
  unique (piano_id, email)
);
create index if not exists pee_piani_membri_email on public.pee_piani_membri (email);
alter table public.pee_piani_membri enable row level security;

-- ══ 3. Storico ══
create table if not exists public.pee_piani_versioni (
  id          uuid primary key default gen_random_uuid(),
  piano_id    uuid not null references public.pee_piani(id) on delete cascade,
  n           int  not null default 0,
  motivo      text not null default 'manuale' check (motivo in ('manuale', 'stato', 'verifica', 'aggiornamento', 'staffetta', 'auto')),
  nota        text not null default '' check (char_length(nota) <= 500),
  stato       text not null default 'bozza',
  autore_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autore_nome text not null default '' check (char_length(autore_nome) <= 120),
  data        jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 2000000),
  created_at  timestamptz not null default now(),
  unique (piano_id, n)
);
create index if not exists pee_piani_versioni_piano on public.pee_piani_versioni (piano_id, n);
alter table public.pee_piani_versioni enable row level security;

-- ══ 4. Funzioni di appoggio (evitano ricorsioni tra le regole) ══
create or replace function public.pee_piano_is_owner(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pee_piani where id = p and owner_id = auth.uid())
$$;
-- ruolo di chi è collegato: 'titolare', 'cotitolare', 'collaboratore', 'lettore' oppure null
create or replace function public.pee_piano_ruolo(p uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select case when exists (select 1 from public.pee_piani where id = p and owner_id = auth.uid()) then 'titolare'
              else (select m.ruolo from public.pee_piani_membri m where m.piano_id = p and m.email = public.pee_my_email() limit 1) end
$$;
create or replace function public.pee_piano_can_edit(p uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(public.pee_piano_ruolo(p) in ('titolare', 'cotitolare', 'collaboratore'), false)
$$;
create or replace function public.pee_piano_is_cotitolare(p uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.pee_piani_membri m
                 where m.piano_id = p and m.email = public.pee_my_email() and m.ruolo = 'cotitolare')
$$;
create or replace function public.pee_mio_nome() returns text
language sql stable security definer set search_path = public, auth as $$
  select coalesce(nullif(trim(raw_user_meta_data->>'nome'), ''), '') from auth.users where id = auth.uid()
$$;
revoke all on function public.pee_piano_is_owner(uuid), public.pee_piano_ruolo(uuid), public.pee_piano_can_edit(uuid),
  public.pee_piano_is_cotitolare(uuid), public.pee_mio_nome() from public, anon;
grant execute on function public.pee_piano_is_owner(uuid), public.pee_piano_ruolo(uuid), public.pee_piano_can_edit(uuid),
  public.pee_piano_is_cotitolare(uuid), public.pee_mio_nome() to authenticated;

-- ══ 5. Controlli in scrittura sui piani ══
create or replace function public.pee_piani_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  k text;
  collab boolean := false;
begin
  if tg_op = 'INSERT' then
    new.rev := 1;
    new.created_at := now(); new.updated_at := now();
    if auth.uid() is not null then
      new.owner_id := auth.uid();
      new.owner_email := coalesce(public.pee_my_email(), '');
      new.updated_by := auth.uid();
      new.updated_by_nome := public.pee_mio_nome();
      if new.archivio_id is not null and not exists (select 1 from public.pee_archivi a where a.id = new.archivio_id and a.user_id = auth.uid()) then
        raise exception 'Il piano si può collegare solo a un tuo progetto';
      end if;
    end if;
    return new;
  end if;

  -- modifica: chi salva deve aver letto l'ultima versione
  if new.rev is distinct from old.rev then
    raise exception 'Il piano è stato modificato da un''altra persona: ricarica prima di salvare' using errcode = '40001';
  end if;
  new.rev := old.rev + 1;
  new.updated_at := now();
  new.created_at := old.created_at;
  if new.tipo is distinct from old.tipo then raise exception 'Il tipo di piano non si cambia'; end if;
  if new.owner_id is distinct from old.owner_id then raise exception 'Il piano ha un solo titolare: non si cambia da qui'; end if;

  if auth.uid() is null then return new; end if;   -- esecuzioni dal pannello di Supabase: nessun altro limite
  new.updated_by := auth.uid();
  new.updated_by_nome := public.pee_mio_nome();
  new.owner_email := old.owner_email;

  if new.archivio_id is distinct from old.archivio_id then
    if old.owner_id <> auth.uid() then raise exception 'Solo il titolare collega il piano a un progetto'; end if;
    if new.archivio_id is not null and not exists (select 1 from public.pee_archivi a where a.id = new.archivio_id and a.user_id = auth.uid()) then
      raise exception 'Il piano si può collegare solo a un tuo progetto';
    end if;
  end if;

  if old.owner_id <> auth.uid() then
    collab := exists (select 1 from public.pee_piani_membri m
                      where m.piano_id = old.id and m.email = public.pee_my_email() and m.ruolo = 'collaboratore');
  end if;
  if collab then
    if new.titolo is distinct from old.titolo or new.anno_inizio is distinct from old.anno_inizio
       or new.durata is distinct from old.durata or new.stato is distinct from old.stato then
      raise exception 'Un collaboratore non può cambiare titolo, periodo o stato del piano';
    end if;
    for k in select jsonb_object_keys(old.data) loop
      if not (new.data ? k) then
        raise exception 'Un collaboratore non può eliminare parti del piano (%)', k;
      end if;
    end loop;
  end if;
  return new;
end $$;
drop trigger if exists pee_piani_prima_ins on public.pee_piani;
create trigger pee_piani_prima_ins before insert on public.pee_piani for each row execute function public.pee_piani_prima();
drop trigger if exists pee_piani_prima_upd on public.pee_piani;
create trigger pee_piani_prima_upd before update on public.pee_piani for each row execute function public.pee_piani_prima();

-- storico: numero progressivo dal database, nessuna modifica dopo
create or replace function public.pee_piani_versioni_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(hashtext('pee_piani_versioni:' || new.piano_id::text));
    select coalesce(max(n), 0) + 1 into new.n from public.pee_piani_versioni where piano_id = new.piano_id;
    new.created_at := now();
    if auth.uid() is not null then
      new.autore_id := auth.uid();
      new.autore_nome := public.pee_mio_nome();
    end if;
    return new;
  end if;
  raise exception 'Una versione dello storico non si modifica';
end $$;
drop trigger if exists pee_piani_versioni_ins on public.pee_piani_versioni;
create trigger pee_piani_versioni_ins before insert on public.pee_piani_versioni for each row execute function public.pee_piani_versioni_prima();
drop trigger if exists pee_piani_versioni_upd on public.pee_piani_versioni;
create trigger pee_piani_versioni_upd before update on public.pee_piani_versioni for each row execute function public.pee_piani_versioni_prima();

-- ══ 6. Regole di accesso: piani ══
drop policy if exists "pee_piani: creo i miei" on public.pee_piani;
create policy "pee_piani: creo i miei" on public.pee_piani
  for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "pee_piani: leggo i miei e quelli a cui sono invitato" on public.pee_piani;
create policy "pee_piani: leggo i miei e quelli a cui sono invitato" on public.pee_piani
  for select to authenticated
  using (owner_id = auth.uid() or public.pee_piano_ruolo(id) is not null);

drop policy if exists "pee_piani: modificano titolare, co-titolari e collaboratori" on public.pee_piani;
create policy "pee_piani: modificano titolare, co-titolari e collaboratori" on public.pee_piani
  for update to authenticated
  using (public.pee_piano_can_edit(id))
  with check (public.pee_piano_can_edit(id));

drop policy if exists "pee_piani: elimina il titolare" on public.pee_piani;
create policy "pee_piani: elimina il titolare" on public.pee_piani
  for delete to authenticated
  using (owner_id = auth.uid());

-- ══ 7. Regole di accesso: storico ══
drop policy if exists "pee_piani_versioni: leggono tutti gli invitati" on public.pee_piani_versioni;
create policy "pee_piani_versioni: leggono tutti gli invitati" on public.pee_piani_versioni
  for select to authenticated
  using (public.pee_piano_ruolo(piano_id) is not null);

drop policy if exists "pee_piani_versioni: salvano chi può modificare" on public.pee_piani_versioni;
create policy "pee_piani_versioni: salvano chi può modificare" on public.pee_piani_versioni
  for insert to authenticated
  with check (autore_id = auth.uid() and public.pee_piano_can_edit(piano_id));

drop policy if exists "pee_piani_versioni: elimina il titolare" on public.pee_piani_versioni;
create policy "pee_piani_versioni: elimina il titolare" on public.pee_piani_versioni
  for delete to authenticated
  using (public.pee_piano_is_owner(piano_id));

-- ══ 8. Regole di accesso: inviti ══
drop policy if exists "pee_piani_membri: il titolare gestisce" on public.pee_piani_membri;
create policy "pee_piani_membri: il titolare gestisce" on public.pee_piani_membri
  for all to authenticated
  using (public.pee_piano_is_owner(piano_id))
  with check (public.pee_piano_is_owner(piano_id) and invitato_da = auth.uid());

drop policy if exists "pee_piani_membri: vedo i miei inviti" on public.pee_piani_membri;
create policy "pee_piani_membri: vedo i miei inviti" on public.pee_piani_membri
  for select to authenticated
  using (email = public.pee_my_email());

drop policy if exists "pee_piani_membri: esco da un piano" on public.pee_piani_membri;
create policy "pee_piani_membri: esco da un piano" on public.pee_piani_membri
  for delete to authenticated
  using (email = public.pee_my_email());

drop policy if exists "pee_piani_membri: i co-titolari vedono" on public.pee_piani_membri;
create policy "pee_piani_membri: i co-titolari vedono" on public.pee_piani_membri
  for select to authenticated
  using (public.pee_piano_is_cotitolare(piano_id));

drop policy if exists "pee_piani_membri: i co-titolari invitano" on public.pee_piani_membri;
create policy "pee_piani_membri: i co-titolari invitano" on public.pee_piani_membri
  for insert to authenticated
  with check (public.pee_piano_is_cotitolare(piano_id) and ruolo in ('lettore', 'collaboratore') and invitato_da = auth.uid());

drop policy if exists "pee_piani_membri: i co-titolari cambiano ruolo" on public.pee_piani_membri;
create policy "pee_piani_membri: i co-titolari cambiano ruolo" on public.pee_piani_membri
  for update to authenticated
  using (public.pee_piano_is_cotitolare(piano_id) and ruolo <> 'cotitolare')
  with check (public.pee_piano_is_cotitolare(piano_id) and ruolo in ('lettore', 'collaboratore'));

drop policy if exists "pee_piani_membri: i co-titolari tolgono l'accesso" on public.pee_piani_membri;
create policy "pee_piani_membri: i co-titolari tolgono l'accesso" on public.pee_piani_membri
  for delete to authenticated
  using (public.pee_piano_is_cotitolare(piano_id) and ruolo <> 'cotitolare');

-- «ho visto l'invito»: l'invitato lo segna, senza poter cambiare il proprio ruolo
create or replace function public.pee_piano_segna_visto(m uuid) returns void
language sql security definer set search_path = public, auth as $$
  update public.pee_piani_membri set visto_il = now() where id = m and email = public.pee_my_email()
$$;
revoke all on function public.pee_piano_segna_visto(uuid) from public, anon;
grant execute on function public.pee_piano_segna_visto(uuid) to authenticated;

-- ══ 9. Permessi di base e avvisi in tempo reale ══
grant select, insert, update, delete on public.pee_piani, public.pee_piani_membri, public.pee_piani_versioni to authenticated;
grant all on public.pee_piani, public.pee_piani_membri, public.pee_piani_versioni to service_role;

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['pee_piani', 'pee_piani_membri'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
