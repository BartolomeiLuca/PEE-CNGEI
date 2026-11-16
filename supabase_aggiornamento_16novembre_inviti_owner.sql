-- PEE CNGEI — aggiornamento: nell'invito fatto da un co-titolare, "chi ha invitato" non può essere un altro utente
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non cancella né modifica i dati esistenti: l'app non cambia comportamento (owner_id vale già l'utente che invita);
-- si chiude solo la possibilità di scrivere a mano un owner_id diverso.

drop policy if exists "pee_membri: i co-titolari invitano" on public.pee_membri;
create policy "pee_membri: i co-titolari invitano" on public.pee_membri
  for insert to authenticated
  with check (
    public.pee_is_cotitolare(archivio_id)
    and ruolo in ('lettore','collaboratore')
    and owner_id = auth.uid()
  );
