-- PEE CNGEI — aggiornamento: avvisi in tempo reale
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Fa arrivare subito all'app le modifiche fatte da un collega o da un altro dispositivo
-- (progetto aggiornato, suggerimenti nuovi, inviti e ruoli). Le regole di accesso restano le stesse:
-- ognuno riceve solo le notifiche delle righe che può già vedere.

do $$
declare t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['pee_archivi','pee_suggerimenti','pee_membri'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
