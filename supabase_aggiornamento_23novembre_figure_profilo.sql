-- PEE CNGEI — aggiornamento 23/11: nuove figure nel profilo
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non cancella né modifica nessun dato: allarga solo l'elenco dei ruoli ammessi in pee_profili.
--
-- Nuovi ruoli: 'cos' (Comitato di Sezione, con gli incarichi nel campo dashboard), 'coords' (Coordinatore Senior),
-- 'vcg' (Vice Capo Gruppo), 'vcds' (Vice Commissario di Sezione).
-- Quelli che c'erano restano: cu, vcu, cg, cds, senior, volontario.
-- Il sito principale non conosce i nuovi ruoli: li tratta come un ruolo qualsiasi senza Branca, senza rompere nulla.

alter table public.pee_profili drop constraint if exists pee_profili_ruolo_check;
alter table public.pee_profili add constraint pee_profili_ruolo_check
  check (ruolo is null or ruolo in ('cu','vcu','cg','cds','senior','volontario','cos','coords','vcg','vcds'));
