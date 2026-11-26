-- 28 novembre 2026 — Il Progetto di Sezione legge gli obiettivi dei Piani di Gruppo della propria Sezione («Porta dai Gruppi»).
-- Una sola funzione, in sola lettura, per chi guida la Sezione (Commissario, Vice Commissario, Comitato con incarico Commissario).
-- Restituisce, dei Piani di Gruppo (anche in bozza) della Sezione scritta nel tuo profilo: titolo, Gruppo, periodo, stato e degli obiettivi
-- solo testo, aree e indirizzi del Piano nazionale. Non dà accesso al piano: né azioni, né analisi, né Ascolto, né nomi, né note.
-- La Sezione e il Gruppo sono quelli del profilo di chi possiede il piano. Non cambia né cancella nessun dato. Si può rieseguire.
-- Richiede lo script del 25 novembre (pee_norm).

create or replace function public.pee_pdg_della_mia_sezione()
returns table(id uuid, titolo text, gruppo text, anno_inizio int, durata int, stato text, obiettivi jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or not (me.ruolo in ('cds', 'vcds')
       or (me.ruolo = 'cos' and exists (select 1 from jsonb_array_elements_text(coalesce(me.dashboard->'cos'->'incarichi', '[]'::jsonb)) x where public.pee_norm(x) = 'commissario'))) then
    raise exception 'I Piani di Gruppo li legge chi guida la Sezione.';
  end if;
  v_sez := public.pee_norm(me.sezione);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  return query
    select p.id, p.titolo, pr.gruppo, p.anno_inizio, p.durata, p.stato,
           (select coalesce(jsonb_agg(jsonb_build_object(
                     'id', left(coalesce(t.o->>'id', ''), 60),
                     'testo', left(coalesce(t.o->>'testo', ''), 600),
                     'aree', case when jsonb_typeof(t.o->'aree') = 'array' then t.o->'aree' else '[]'::jsonb end,
                     'indirizzi', case when jsonb_typeof(t.o->'indirizzi') = 'array' then t.o->'indirizzi' else '[]'::jsonb end
                   ) order by t.n), '[]'::jsonb)
              from jsonb_array_elements(case when jsonb_typeof(p.data->'obiettivi') = 'array' then p.data->'obiettivi' else '[]'::jsonb end) with ordinality as t(o, n)
             where jsonb_typeof(t.o) = 'object' and btrim(coalesce(t.o->>'testo', '')) <> '')
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
     where p.tipo = 'gruppo' and public.pee_norm(pr.sezione) = v_sez
     order by pr.gruppo, p.anno_inizio desc, p.updated_at desc;
end $$;

revoke all on function public.pee_pdg_della_mia_sezione() from public, anon;
grant execute on function public.pee_pdg_della_mia_sezione() to authenticated;
