-- PEE CNGEI — aggiornamento del 12 novembre 2026: raccolta anonima delle parole (strumento «Crea le tue attività osservative»)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca nessun dato esistente: crea solo una tabella nuova.
--
-- A cosa serve: lo strumento propone i percorsi da osservare leggendo la domanda scritta da chi usa l'app.
-- Per migliorarlo servono le parole con cui le persone descrivono davvero i loro dubbi.
-- Vengono salvate SOLO se chi usa l'app spunta la casella (spenta di default):
--   · le radici delle parole (per esempio «litig», «guid», «iniziat»), in ordine alfabetico, senza frasi;
--   · il percorso che la persona ha scelto alla fine e la Branca.
-- Non si salva: il testo, i nomi (le parole scritte con la maiuscola sono scartate), l'account, il progetto, la data precisa.
-- Chi usa l'app può solo AGGIUNGERE righe: nessuno può leggerle, cambiarle o cancellarle dall'app.
-- Le righe si leggono solo da qui (Supabase > Table Editor > pee_radici) con il tuo accesso.

-- controllo di forma delle radici (un CHECK non può contenere una sottoquery, quindi serve una funzione)
create or replace function public.pee_radici_ok(r text[]) returns boolean
language sql immutable as $$
  select coalesce(bool_and(length(x) between 2 and 24 and x ~ '^[a-zàèéìòù'']+$'), true) from unnest(r) as x
$$;

create table if not exists public.pee_radici (
  id        bigint generated always as identity primary key,
  giorno    date not null default current_date,
  branca    text not null check (branca in ('L','E','R')),
  radici    text[] not null,
  percorso  text not null check (percorso ~ '^[PCS][1-8]$'),
  altri     text[] not null default '{}',
  -- limiti di forma, così nessuno può usare la tabella per salvare testi lunghi
  constraint pee_radici_nr   check (cardinality(radici) between 2 and 30),
  constraint pee_radici_len  check (public.pee_radici_ok(radici)),
  constraint pee_radici_alt  check (cardinality(altri) <= 4)
);

alter table public.pee_radici enable row level security;

drop policy if exists "radici_aggiungi" on public.pee_radici;
create policy "radici_aggiungi" on public.pee_radici for insert to authenticated with check (true);

-- nessuna policy di lettura, modifica o cancellazione: dall'app non si può fare altro che aggiungere
revoke all on public.pee_radici from anon, authenticated;
grant insert on public.pee_radici to authenticated;
