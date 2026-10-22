-- PEE CNGEI — archivio nazionale delle attività (22 ottobre 2026)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Crea solo la tabella nuova pee_archivio_nazionale: non tocca né cancella nessun dato esistente.
-- Finché non la lanci, nell'app «Proponi all'archivio nazionale» resta nascosto e «Cerca» cerca solo fra le tue attività.

create table if not exists public.pee_archivio_nazionale (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  autore_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  stato          text not null default 'in_attesa' check (stato in ('in_attesa','approvata','rifiutata')),
  approvata_il   timestamptz,
  approvata_da   text,
  titolo         text not null check (char_length(titolo) between 3 and 140),
  branca         text,
  ambito         text,
  percorso_id    text,
  percorso_nome  text,
  obiettivi      jsonb not null default '[]'::jsonb,
  idr            jsonb not null default '[]'::jsonb,
  tipi           jsonb not null default '[]'::jsonb,
  strumenti      jsonb not null default '[]'::jsonb,
  durata_min     integer,
  sede           text,
  funzionato     text,
  contenuto      jsonb not null default '{}'::jsonb
);

-- Dal 30 ottobre 2026 Supabase non dà più accesso automatico alle tabelle nuove: i permessi vanno dati qui.
grant select, insert, update, delete on public.pee_archivio_nazionale to authenticated;
grant select, insert, update, delete on public.pee_archivio_nazionale to service_role;

alter table public.pee_archivio_nazionale enable row level security;

drop policy if exists "an_leggi" on public.pee_archivio_nazionale;
create policy "an_leggi" on public.pee_archivio_nazionale for select to authenticated
  using ( stato = 'approvata' or autore_id = auth.uid() or lower(coalesce(auth.jwt() ->> 'email','')) = 'luca.bartolomei@cngei.it' );

drop policy if exists "an_proponi" on public.pee_archivio_nazionale;
create policy "an_proponi" on public.pee_archivio_nazionale for insert to authenticated
  with check ( autore_id = auth.uid() and stato = 'in_attesa' );

drop policy if exists "an_decidi" on public.pee_archivio_nazionale;
create policy "an_decidi" on public.pee_archivio_nazionale for update to authenticated
  using ( lower(coalesce(auth.jwt() ->> 'email','')) = 'luca.bartolomei@cngei.it' )
  with check ( lower(coalesce(auth.jwt() ->> 'email','')) = 'luca.bartolomei@cngei.it' );

drop policy if exists "an_togli" on public.pee_archivio_nazionale;
create policy "an_togli" on public.pee_archivio_nazionale for delete to authenticated
  using ( (autore_id = auth.uid() and stato <> 'approvata') or lower(coalesce(auth.jwt() ->> 'email','')) = 'luca.bartolomei@cngei.it' );

create index if not exists pee_an_stato_idx on public.pee_archivio_nazionale (stato, created_at desc);
