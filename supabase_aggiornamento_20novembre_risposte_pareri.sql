-- PEE CNGEI — aggiornamento 20/11 (sera): il Capo Gruppo può rispondere a un suggerimento o a un parere
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non cancella né modifica nessun dato: aggiunge tre colonne vuote a pee_suggerimenti e allarga di poco la guardia sul testo.
--
-- Chi può rispondere: chi ha creato il progetto e i co-titolari (le stesse persone che già segnano un suggerimento come «letto»,
-- grazie alle regole di accesso che ci sono già: non se ne aggiunge nessuna).
-- Chi ha scritto il suggerimento (o il parere) vede la risposta, e solo sul proprio; gli altri invitati non vedono nulla in più.
-- Il testo, il nome di chi scrive e il percorso restano immodificabili, come prima.

alter table public.pee_suggerimenti add column if not exists risposta    text;
alter table public.pee_suggerimenti add column if not exists risposta_da text;
alter table public.pee_suggerimenti add column if not exists risposta_il timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pee_sugg_risposta_check') then
    alter table public.pee_suggerimenti add constraint pee_sugg_risposta_check
      check (risposta is null or char_length(risposta) between 1 and 2000);
  end if;
end $$;

create or replace function public.pee_sugg_solo_stato() returns trigger
language plpgsql as $$
begin
  if new.testo is distinct from old.testo or new.percorso is distinct from old.percorso
     or new.autore_nome is distinct from old.autore_nome or new.user_id is distinct from old.user_id
     or new.archivio_id is distinct from old.archivio_id then
    raise exception 'Di un suggerimento si può cambiare solo lo stato e la risposta';
  end if;
  -- la data della risposta la mette il database, non chi scrive
  if new.risposta is distinct from old.risposta then
    new.risposta_il := case when new.risposta is null then null else now() end;
    if new.risposta is null then new.risposta_da := null; end if;
  elsif new.risposta_il is distinct from old.risposta_il or new.risposta_da is distinct from old.risposta_da then
    raise exception 'La risposta si cambia scrivendo il testo della risposta';
  end if;
  return new;
end $$;
