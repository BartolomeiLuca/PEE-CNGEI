-- PEE CNGEI — aggiornamento dell'11 novembre 2026: regole di accesso più strette (verifica di sicurezza)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non cancella né modifica i dati esistenti. Funziona con l'app così com'è (sito principale e anteprima).

-- 1. Cestino: solo chi ha creato il progetto può metterlo nel cestino o toglierlo.
--    Prima un co-titolare o un collaboratore, chiamando il database direttamente, poteva segnare il progetto
--    «nel cestino da più di 30 giorni»: alla prima apertura l'app del titolare lo avrebbe cancellato per sempre.
--    Ora il segno del cestino resta com'era, senza errore (il salvataggio normale di un collaboratore non lo tocca).
create or replace function public.pee_archivi_guard() returns trigger
language plpgsql as $$
begin
  if old.user_id is distinct from auth.uid() then
    if new.user_id is distinct from old.user_id
       or new.anno   is distinct from old.anno
       or new.titolo is distinct from old.titolo then
      raise exception 'Solo chi ha creato il progetto può cambiarne anno, titolo o proprietario';
    end if;
    if (new.meta -> 'cest') is distinct from (old.meta -> 'cest') then
      new.meta := (coalesce(new.meta, '{}'::jsonb) - 'cest')
                  || case when old.meta ? 'cest' then jsonb_build_object('cest', old.meta -> 'cest') else '{}'::jsonb end;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists pee_archivi_guard on public.pee_archivi;
create trigger pee_archivi_guard before update on public.pee_archivi
  for each row execute function public.pee_archivi_guard();

-- 2. Inviti: un co-titolare può cambiare il ruolo (lettore/collaboratore), non l'indirizzo dell'invito,
--    né il progetto a cui si riferisce. Prima poteva riscrivere l'indirizzo di un invito esistente
--    (anche quello di un altro co-titolare, passando di fatto quel ruolo a un'altra persona).
--    Il cambio di email dell'account (funzione pee_completa_cambio_email) continua a funzionare.
create or replace function public.pee_membri_guard() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.pee_is_owner(old.archivio_id) then
    if new.email is distinct from old.email
       or new.archivio_id is distinct from old.archivio_id
       or new.owner_id is distinct from old.owner_id then
      raise exception 'Solo chi ha creato il progetto può cambiare l''indirizzo o il progetto di un invito';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists pee_membri_guard on public.pee_membri;
create trigger pee_membri_guard before update on public.pee_membri
  for each row execute function public.pee_membri_guard();

-- 3. Versioni precedenti.
--    a) chi ha creato il progetto vede (e può sfoltire) tutte le versioni, anche quelle salvate da co-titolari
--       e collaboratori: prima non le vedeva, e le versioni automatiche degli altri non venivano mai sfoltite;
--    b) chi non ha più accesso al progetto non vede più le versioni che aveva salvato lui
--       (sono copie intere del progetto).
drop policy if exists "pee_versioni: solo le mie" on public.pee_versioni;
create policy "pee_versioni: solo le mie" on public.pee_versioni
  for all to authenticated
  using (user_id = auth.uid() and (public.pee_is_owner(archivio_id) or public.pee_can_edit(archivio_id)))
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.pee_archivi a where a.id = archivio_id and a.user_id = auth.uid())
  );

drop policy if exists "pee_versioni: il titolare le vede tutte" on public.pee_versioni;
create policy "pee_versioni: il titolare le vede tutte" on public.pee_versioni
  for select to authenticated
  using (public.pee_is_owner(archivio_id));

drop policy if exists "pee_versioni: il titolare sfoltisce" on public.pee_versioni;
create policy "pee_versioni: il titolare sfoltisce" on public.pee_versioni
  for delete to authenticated
  using (public.pee_is_owner(archivio_id));
