-- 28 novembre 2026 — Il Piano di Gruppo (e il Progetto di Clan) leggono il Progetto di Sezione della propria Sezione.
-- Una sola funzione, in sola lettura: restituisce, dei Progetti di Sezione DELIBERATI o APPROVATI della Sezione scritta nel tuo profilo,
-- solo titolo, periodo e obiettivi (testo, aree, indirizzi del Piano nazionale). Non dà accesso al piano: né azioni, né analisi, né nomi, né note.
-- La Sezione di un Progetto è quella del profilo di chi lo possiede (non quella scritta dentro il piano). Una bozza non si vede.
-- Non cambia né cancella nessun dato. Si può rieseguire. Richiede lo script del 25 novembre (pee_norm).

create or replace function public.pee_pds_della_mia_sezione()
returns table(id uuid, titolo text, anno_inizio int, durata int, stato text, sezione text, obiettivi jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or me.ruolo not in ('cg', 'vcg', 'cu', 'vcu', 'senior', 'cds', 'vcds', 'cos', 'coords') then
    raise exception 'Il Progetto di Sezione lo leggono le figure di Gruppo e di Sezione.';
  end if;
  v_sez := public.pee_norm(me.sezione);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  return query
    select p.id, p.titolo, p.anno_inizio, p.durata, p.stato, pr.sezione,
           (select coalesce(jsonb_agg(jsonb_build_object(
                     'id', left(coalesce(t.o->>'id', ''), 60),
                     'testo', left(coalesce(t.o->>'testo', ''), 600),
                     'aree', case when jsonb_typeof(t.o->'aree') = 'array' then t.o->'aree' else '[]'::jsonb end,
                     'indirizzi', case when jsonb_typeof(t.o->'indirizzi') = 'array' then t.o->'indirizzi' else '[]'::jsonb end
                   ) order by t.n), '[]'::jsonb)
              from jsonb_array_elements(case when jsonb_typeof(p.data->'obiettivi') = 'array' then p.data->'obiettivi' else '[]'::jsonb end) with ordinality as t(o, n)
             where jsonb_typeof(t.o) = 'object')
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
     where p.tipo = 'sezione' and p.stato in ('deliberato', 'approvato') and public.pee_norm(pr.sezione) = v_sez
     order by p.anno_inizio desc, p.updated_at desc;
end $$;

revoke all on function public.pee_pds_della_mia_sezione() from public, anon;
grant execute on function public.pee_pds_della_mia_sezione() to authenticated;
