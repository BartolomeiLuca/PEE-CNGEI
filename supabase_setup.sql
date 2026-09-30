-- PEE CNGEI — archivio per utente e per anno
-- Da eseguire una sola volta: Supabase > SQL Editor > New query > incolla tutto > Run

create table if not exists public.pee_archivi (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  anno        int  not null,
  titolo      text not null,
  meta        jsonb not null default '{}'::jsonb,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, anno, titolo)
);

create index if not exists pee_archivi_user_anno on public.pee_archivi (user_id, anno);

-- ogni utente vede e modifica SOLO i propri progetti
alter table public.pee_archivi enable row level security;

drop policy if exists "pee_archivi: solo i miei" on public.pee_archivi;
create policy "pee_archivi: solo i miei" on public.pee_archivi
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at cambia solo quando cambia il contenuto (non quando si rinomina):
-- serve al controllo "versione più recente su un altro dispositivo"
create or replace function public.pee_touch_updated_at() returns trigger
language plpgsql as $$
begin
  if new.data is distinct from old.data then new.updated_at = now(); end if;
  return new;
end $$;

drop trigger if exists pee_archivi_touch on public.pee_archivi;
create trigger pee_archivi_touch before update on public.pee_archivi
  for each row execute function public.pee_touch_updated_at();

-- ══ Cronologia delle versioni (aggiunta) ══
create table if not exists public.pee_versioni (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  archivio_id  uuid not null references public.pee_archivi(id) on delete cascade,
  label        text not null default 'Versione',
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index if not exists pee_versioni_arch on public.pee_versioni (archivio_id, created_at desc);

alter table public.pee_versioni enable row level security;

drop policy if exists "pee_versioni: solo le mie" on public.pee_versioni;
create policy "pee_versioni: solo le mie" on public.pee_versioni
  for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.pee_archivi a where a.id = archivio_id and a.user_id = auth.uid())
  );


-- ══ Condivisione con i colleghi e suggerimenti (aggiunta) ══
-- Lo script si può rieseguire senza danni.

-- email dell'utente collegato, solo se l'indirizzo è stato confermato
create or replace function public.pee_my_email() returns text
language sql stable security definer set search_path = public, auth as $$
  select lower(email) from auth.users where id = auth.uid() and email_confirmed_at is not null
$$;

create table if not exists public.pee_membri (
  id           uuid primary key default gen_random_uuid(),
  archivio_id  uuid not null references public.pee_archivi(id) on delete cascade,
  owner_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  owner_email  text not null default '',
  email        text not null check (email = lower(email)),
  created_at   timestamptz not null default now(),
  unique (archivio_id, email)
);
create index if not exists pee_membri_email on public.pee_membri (email);

-- funzioni di appoggio (security definer) per evitare ricorsioni tra le policy
create or replace function public.pee_is_owner(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.pee_archivi where id = a and user_id = auth.uid())
$$;
create or replace function public.pee_is_member(a uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.pee_membri m where m.archivio_id = a and m.email = public.pee_my_email())
$$;

alter table public.pee_membri enable row level security;

drop policy if exists "pee_membri: il proprietario gestisce" on public.pee_membri;
create policy "pee_membri: il proprietario gestisce" on public.pee_membri
  for all to authenticated
  using (public.pee_is_owner(archivio_id))
  with check (public.pee_is_owner(archivio_id) and owner_id = auth.uid());

drop policy if exists "pee_membri: vedo i miei inviti" on public.pee_membri;
create policy "pee_membri: vedo i miei inviti" on public.pee_membri
  for select to authenticated
  using (email = public.pee_my_email());

drop policy if exists "pee_membri: esco da un progetto" on public.pee_membri;
create policy "pee_membri: esco da un progetto" on public.pee_membri
  for delete to authenticated
  using (email = public.pee_my_email());

-- i colleghi invitati possono LEGGERE il progetto (mai modificarlo)
drop policy if exists "pee_archivi: condivisi con me" on public.pee_archivi;
create policy "pee_archivi: condivisi con me" on public.pee_archivi
  for select to authenticated
  using (public.pee_is_member(id));

create table if not exists public.pee_suggerimenti (
  id           uuid primary key default gen_random_uuid(),
  archivio_id  uuid not null references public.pee_archivi(id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autore_nome  text not null default '',
  percorso     text not null check (char_length(percorso) between 1 and 160),
  testo        text not null check (char_length(testo) between 1 and 2000),
  stato        text not null default 'nuovo' check (stato in ('nuovo','letto')),
  created_at   timestamptz not null default now()
);
-- per chi aveva già creato la tabella con il limite precedente (8 caratteri)
alter table public.pee_suggerimenti drop constraint if exists pee_suggerimenti_percorso_check;
alter table public.pee_suggerimenti add constraint pee_suggerimenti_percorso_check check (char_length(percorso) between 1 and 160);
create index if not exists pee_sugg_archivio on public.pee_suggerimenti (archivio_id);

alter table public.pee_suggerimenti enable row level security;

-- il proprietario vede tutti i suggerimenti; un collega vede solo i propri
drop policy if exists "pee_sugg: lettura" on public.pee_suggerimenti;
create policy "pee_sugg: lettura" on public.pee_suggerimenti
  for select to authenticated
  using (public.pee_is_owner(archivio_id) or (user_id = auth.uid() and public.pee_is_member(archivio_id)));

drop policy if exists "pee_sugg: scrive solo un collega invitato" on public.pee_suggerimenti;
create policy "pee_sugg: scrive solo un collega invitato" on public.pee_suggerimenti
  for insert to authenticated
  with check (user_id = auth.uid() and public.pee_is_member(archivio_id) and stato = 'nuovo');

drop policy if exists "pee_sugg: il proprietario segna letto" on public.pee_suggerimenti;
create policy "pee_sugg: il proprietario segna letto" on public.pee_suggerimenti
  for update to authenticated
  using (public.pee_is_owner(archivio_id))
  with check (public.pee_is_owner(archivio_id));

drop policy if exists "pee_sugg: elimina autore o proprietario" on public.pee_suggerimenti;
create policy "pee_sugg: elimina autore o proprietario" on public.pee_suggerimenti
  for delete to authenticated
  using (user_id = auth.uid() or public.pee_is_owner(archivio_id));

-- il proprietario può cambiare solo lo stato (letto / da rileggere), mai il testo
create or replace function public.pee_sugg_solo_stato() returns trigger
language plpgsql as $$
begin
  if new.testo is distinct from old.testo or new.percorso is distinct from old.percorso
     or new.autore_nome is distinct from old.autore_nome or new.user_id is distinct from old.user_id
     or new.archivio_id is distinct from old.archivio_id then
    raise exception 'Di un suggerimento si può cambiare solo lo stato';
  end if;
  return new;
end $$;
drop trigger if exists pee_sugg_stato on public.pee_suggerimenti;
create trigger pee_sugg_stato before update on public.pee_suggerimenti
  for each row execute function public.pee_sugg_solo_stato();
