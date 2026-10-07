-- PEE CNGEI — aggiornamento: anche i co-titolari possono invitare (lettori e collaboratori)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Un co-titolare vede chi ha accesso al progetto e può invitare o cambiare il ruolo di lettori e collaboratori.
-- Non può creare altri co-titolari né togliere l'accesso a un co-titolare: quello resta a chi ha creato il progetto.

create or replace function public.pee_is_cotitolare(a uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.pee_membri m
                 where m.archivio_id = a and m.email = public.pee_my_email() and m.ruolo = 'cotitolare')
$$;

drop policy if exists "pee_membri: i co-titolari vedono" on public.pee_membri;
create policy "pee_membri: i co-titolari vedono" on public.pee_membri
  for select to authenticated
  using (public.pee_is_cotitolare(archivio_id));

drop policy if exists "pee_membri: i co-titolari invitano" on public.pee_membri;
create policy "pee_membri: i co-titolari invitano" on public.pee_membri
  for insert to authenticated
  with check (public.pee_is_cotitolare(archivio_id) and ruolo in ('lettore','collaboratore'));

drop policy if exists "pee_membri: i co-titolari cambiano ruolo" on public.pee_membri;
create policy "pee_membri: i co-titolari cambiano ruolo" on public.pee_membri
  for update to authenticated
  using (public.pee_is_cotitolare(archivio_id) and ruolo <> 'cotitolare')
  with check (public.pee_is_cotitolare(archivio_id) and ruolo in ('lettore','collaboratore'));

drop policy if exists "pee_membri: i co-titolari tolgono l'accesso" on public.pee_membri;
create policy "pee_membri: i co-titolari tolgono l'accesso" on public.pee_membri
  for delete to authenticated
  using (public.pee_is_cotitolare(archivio_id) and ruolo <> 'cotitolare');
