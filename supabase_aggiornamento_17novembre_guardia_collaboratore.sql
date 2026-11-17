-- PEE CNGEI — aggiornamento 17/11: guardia sul server per il ruolo «collaboratore»
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca né modifica i dati esistenti: aggiunge solo un controllo in scrittura.
--
-- Prima: le regole del collaboratore (può scrivere solo le parti affidate a lui) erano applicate solo
-- dall'interfaccia; chiamando direttamente l'API un collaboratore poteva riscrivere l'intero progetto.
-- Ora, quando a scrivere è un collaboratore (non chi ha creato il progetto, non un co-titolare):
--   1. il contenuto deve restare un oggetto JSON (niente cancellazioni totali o sostituzioni con altro);
--   2. nessuna voce di primo livello già presente può sparire;
--   3. restano com'erano i campi che definiscono il progetto: tipo di lavoro (MODE), fascia (FASCIA),
--      nome dell'Unità (UNIT_NAME), tipo e anno scout del progetto (scheda.tipoProgetto, scheda.annoScout).
-- Titolo, anno e proprietario erano già protetti (pee_archivi_guard).
-- Le parti affidate (attività, verifiche, calendario, osservazione) restano modificabili come prima.
--
-- Per tornare indietro: drop trigger if exists pee_archivi_guard_collab on public.pee_archivi;

create or replace function public.pee_archivi_guard_collab() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare
  k text;
begin
  -- esecuzioni dal pannello di Supabase (nessun utente collegato) e proprietario: nessun limite
  if auth.uid() is null or old.user_id = auth.uid() then return new; end if;
  -- solo per chi è collaboratore di questo progetto
  if not exists (select 1 from public.pee_membri m
                 where m.archivio_id = old.id and m.email = public.pee_my_email() and m.ruolo = 'collaboratore') then
    return new;
  end if;

  if new.data is null or jsonb_typeof(new.data) <> 'object' then
    raise exception 'Un collaboratore non può sostituire il contenuto del progetto';
  end if;

  if old.data is not null and jsonb_typeof(old.data) = 'object' then
    for k in select jsonb_object_keys(old.data) loop
      if not (new.data ? k) then
        raise exception 'Un collaboratore non può eliminare parti del progetto (%)', k;
      end if;
    end loop;
    foreach k in array array['MODE','FASCIA','UNIT_NAME'] loop
      if old.data->k is not null and jsonb_typeof(old.data->k) <> 'null' and new.data->k is distinct from old.data->k then
        raise exception 'Un collaboratore non può cambiare «%» del progetto', k;
      end if;
    end loop;
    foreach k in array array['tipoProgetto','annoScout'] loop
      if old.data->'scheda'->k is not null and jsonb_typeof(old.data->'scheda'->k) <> 'null'
         and new.data->'scheda'->k is distinct from old.data->'scheda'->k then
        raise exception 'Un collaboratore non può cambiare «%» del progetto', k;
      end if;
    end loop;
  end if;
  return new;
end $$;

drop trigger if exists pee_archivi_guard_collab on public.pee_archivi;
create trigger pee_archivi_guard_collab before update on public.pee_archivi
  for each row execute function public.pee_archivi_guard_collab();
