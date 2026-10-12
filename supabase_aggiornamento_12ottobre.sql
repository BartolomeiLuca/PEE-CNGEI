-- PEE CNGEI — aggiornamento del 12 ottobre 2026: cambio email e suggerimenti per i co-titolari
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non cancella né modifica i dati esistenti.

-- 1. Cambio email: chi cambia l'indirizzo dell'account non perde i progetti condivisi con lui.
--    Prima della conferma l'app annota «vecchia → nuova» (solo per l'email già confermata di chi è collegato);
--    dopo la conferma gli inviti passano alla nuova email e chi ha il progetto lo vede in «Per te».
alter table public.pee_membri add column if not exists email_prima text;

create table if not exists public.pee_cambi_email (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  vecchia    text not null,
  nuova      text not null check (nuova = lower(nuova)),
  created_at timestamptz not null default now()
);
alter table public.pee_cambi_email enable row level security;
-- nessuna policy: la tabella si usa solo attraverso le due funzioni qui sotto

create or replace function public.pee_prepara_cambio_email(nuova text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare v text := public.pee_my_email();
begin
  if v is null then raise exception 'Email non confermata'; end if;
  insert into public.pee_cambi_email (user_id, vecchia, nuova)
  values (auth.uid(), v, lower(trim(nuova)))
  on conflict (user_id) do update set vecchia = excluded.vecchia, nuova = excluded.nuova, created_at = now();
end $$;

create or replace function public.pee_completa_cambio_email() returns int
language plpgsql security definer set search_path = public, auth as $$
declare c record; v text := public.pee_my_email(); n int := 0;
begin
  if v is null then return 0; end if;
  select * into c from public.pee_cambi_email where user_id = auth.uid() and nuova = v;
  if not found then return 0; end if;
  -- se per lo stesso progetto c'è già un invito alla nuova email, tengo quello e tolgo il vecchio
  delete from public.pee_membri m where m.email = c.vecchia
    and exists (select 1 from public.pee_membri x where x.archivio_id = m.archivio_id and x.email = c.nuova);
  update public.pee_membri set email = c.nuova, email_prima = c.vecchia where email = c.vecchia;
  get diagnostics n = row_count;
  -- nei progetti che ho condiviso io, il mio indirizzo mostrato agli invitati
  update public.pee_membri set owner_email = replace(owner_email, c.vecchia, c.nuova) where owner_id = auth.uid();
  delete from public.pee_cambi_email where user_id = auth.uid();
  return n;
end $$;

revoke all on function public.pee_prepara_cambio_email(text) from public;
revoke all on function public.pee_completa_cambio_email() from public;
grant execute on function public.pee_prepara_cambio_email(text) to authenticated;
grant execute on function public.pee_completa_cambio_email() to authenticated;

-- 2. Suggerimenti: anche i co-titolari li leggono e li segnano come letti (come chi ha creato il progetto)
drop policy if exists "pee_sugg: lettura co-titolari" on public.pee_suggerimenti;
create policy "pee_sugg: lettura co-titolari" on public.pee_suggerimenti
  for select to authenticated
  using (public.pee_is_cotitolare(archivio_id));

drop policy if exists "pee_sugg: i co-titolari segnano letto" on public.pee_suggerimenti;
create policy "pee_sugg: i co-titolari segnano letto" on public.pee_suggerimenti
  for update to authenticated
  using (public.pee_is_cotitolare(archivio_id))
  with check (public.pee_is_cotitolare(archivio_id));
