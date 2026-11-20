-- PEE CNGEI — aggiornamento 20/11: nuovo ruolo «commissario» (Commissario di Sezione) per gli inviti
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non cancella né modifica nessun dato: allarga solo l'elenco dei ruoli ammessi in pee_membri.
--
-- Cosa cambia: chi ha creato il progetto può invitare una persona come «commissario».
-- Cosa NON cambia (volutamente, nessuna regola nuova):
--   · il commissario legge il progetto come ogni invitato, ma NON lo modifica (pee_can_edit conta solo co-titolari e collaboratori);
--   · può scrivere suggerimenti/pareri firmati (come ogni invitato) e vede solo i propri;
--   · un co-titolare NON può invitare un commissario (le sue regole ammettono solo lettore e collaboratore): lo invita solo chi ha creato il progetto.
-- Il sito principale, che non conosce questo ruolo, lo tratta come lettore (sola lettura): niente si rompe.
--

alter table public.pee_membri drop constraint if exists pee_membri_ruolo_check;
alter table public.pee_membri add constraint pee_membri_ruolo_check
  check (ruolo in ('lettore','cotitolare','collaboratore','commissario'));
