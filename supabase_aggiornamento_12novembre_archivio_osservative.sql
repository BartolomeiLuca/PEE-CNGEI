-- PEE CNGEI — aggiornamento del 12 novembre 2026 (2): archivio nazionale anche per le attività osservative
-- Da eseguire UNA volta, DOPO supabase_archivio_nazionale.sql: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca né cancella nessuna riga: aggiunge solo una colonna alla tabella esistente.
--
-- La colonna «genere» dice che cosa è la riga: 'att' = attività educativa (tutte quelle già presenti), 'oss' = attività osservativa.
-- Le regole di lettura, proposta e approvazione restano quelle di prima: una proposta è visibile agli altri solo dopo la tua approvazione.
-- Nota: finché il sito principale non viene aggiornato, una proposta osservativa APPROVATA vi comparirebbe come una normale attività.
-- Se vuoi evitarlo, approva le proposte osservative solo dopo il passaggio dell'anteprima al sito principale.

alter table public.pee_archivio_nazionale add column if not exists genere text not null default 'att';
alter table public.pee_archivio_nazionale drop constraint if exists pee_an_genere_ck;
alter table public.pee_archivio_nazionale add constraint pee_an_genere_ck check (genere in ('att','oss'));
create index if not exists pee_an_genere_idx on public.pee_archivio_nazionale (genere, stato, created_at desc);
