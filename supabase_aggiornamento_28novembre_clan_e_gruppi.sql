-- 28 novembre 2026 — Progetto di Clan e Piani di Gruppo si parlano, in sola lettura e senza nomi.
-- Due funzioni, entrambe rieseguibili, che non cambiano né cancellano nessun dato. Richiedono lo script del 25 novembre (pee_norm).
--
-- 1) pee_richieste_al_clan(): il Coordinatore Senior vede le AZIONI dei Piani di Gruppo della propria Sezione che hanno segnato «Chi: Clan»
--    (es. persone per i campi). Per ogni azione: testo, obiettivo a cui appartiene, anno di inizio, mese, stato, «con i genitori».
--    NON escono: referente, indicatore, analisi, Ascolto, altri obiettivi, note.
-- 2) pee_pdc_della_mia_sezione(): chi guida la Sezione (Commissario, Vice Commissario, Comitato con incarico Commissario) legge dei Progetti di Clan
--    della propria Sezione (anche in bozza) gli obiettivi (testo, aree, indirizzi) e la parte «Disponibilità e prospettive». NON escono analisi, azioni,
--    verifiche né le valutazioni sul Clan.
-- La Sezione e il Gruppo sono quelli del profilo di chi possiede il piano.

create or replace function public.pee_richieste_al_clan()
returns table(id uuid, titolo text, gruppo text, anno_inizio int, durata int, stato text, richieste jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or me.ruolo <> 'coords' then
    raise exception 'Le richieste dei Gruppi le legge il Coordinatore Senior.';
  end if;
  v_sez := public.pee_norm(me.sezione);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  return query
    select p.id, p.titolo, pr.gruppo, p.anno_inizio, p.durata, p.stato, r.richieste
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
      cross join lateral (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'id', left(coalesce(a.o->>'id', ''), 60),
                 'testo', left(coalesce(a.o->>'testo', ''), 600),
                 'obiettivo', left(coalesce((select ob->>'testo' from jsonb_array_elements(case when jsonb_typeof(p.data->'obiettivi') = 'array' then p.data->'obiettivi' else '[]'::jsonb end) ob
                                              where jsonb_typeof(ob) = 'object' and ob->>'id' = a.o->>'ob' limit 1), ''), 600),
                 'inizio', case when (a.o->>'inizio') ~ '^[0-9]{1,2}$' then (a.o->>'inizio')::int else 1 end,
                 'mese', left(coalesce(a.o->>'mese', ''), 7),
                 'stato', left(coalesce(a.o->>'stato', 'da_iniziare'), 20),
                 'genitori', coalesce(a.o->>'genitori', 'false') = 'true'
               ) order by a.n), '[]'::jsonb) as richieste
          from jsonb_array_elements(case when jsonb_typeof(p.data->'azioni') = 'array' then p.data->'azioni' else '[]'::jsonb end) with ordinality as a(o, n)
         where jsonb_typeof(a.o) = 'object' and btrim(coalesce(a.o->>'testo', '')) <> ''
           and jsonb_typeof(a.o->'chi') = 'array' and (a.o->'chi') ? 'clan'
      ) r
     where p.tipo = 'gruppo' and public.pee_norm(pr.sezione) = v_sez and jsonb_array_length(r.richieste) > 0
     order by pr.gruppo, p.anno_inizio desc, p.updated_at desc;
end $$;

create or replace function public.pee_pdc_della_mia_sezione()
returns table(id uuid, titolo text, anno_inizio int, durata int, stato text, obiettivi jsonb, disponibilita jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or not (me.ruolo in ('cds', 'vcds')
       or (me.ruolo = 'cos' and exists (select 1 from jsonb_array_elements_text(coalesce(me.dashboard->'cos'->'incarichi', '[]'::jsonb)) x where public.pee_norm(x) = 'commissario'))) then
    raise exception 'Il Progetto di Clan lo legge chi guida la Sezione.';
  end if;
  v_sez := public.pee_norm(me.sezione);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  return query
    select p.id, p.titolo, p.anno_inizio, p.durata, p.stato,
           (select coalesce(jsonb_agg(jsonb_build_object(
                     'id', left(coalesce(t.o->>'id', ''), 60),
                     'testo', left(coalesce(t.o->>'testo', ''), 600),
                     'aree', case when jsonb_typeof(t.o->'aree') = 'array' then t.o->'aree' else '[]'::jsonb end,
                     'indirizzi', case when jsonb_typeof(t.o->'indirizzi') = 'array' then t.o->'indirizzi' else '[]'::jsonb end
                   ) order by t.n), '[]'::jsonb)
              from jsonb_array_elements(case when jsonb_typeof(p.data->'obiettivi') = 'array' then p.data->'obiettivi' else '[]'::jsonb end) with ordinality as t(o, n)
             where jsonb_typeof(t.o) = 'object' and btrim(coalesce(t.o->>'testo', '')) <> ''),
           (select coalesce(jsonb_agg(jsonb_build_object(
                     'id', left(coalesce(t.o->>'id', ''), 60),
                     'cosa', left(coalesce(t.o->>'cosa', ''), 300),
                     'quanti', left(coalesce(t.o->>'quanti', ''), 80),
                     'quando', left(coalesce(t.o->>'quando', ''), 120),
                     'note', left(coalesce(t.o->>'note', ''), 600)
                   ) order by t.n), '[]'::jsonb)
              from jsonb_array_elements(case when jsonb_typeof(p.data->'disp') = 'array' then p.data->'disp' else '[]'::jsonb end) with ordinality as t(o, n)
             where jsonb_typeof(t.o) = 'object' and btrim(coalesce(t.o->>'cosa', '')) <> '')
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
     where p.tipo = 'clan' and public.pee_norm(pr.sezione) = v_sez
     order by p.anno_inizio desc, p.updated_at desc;
end $$;

revoke all on function public.pee_richieste_al_clan() from public, anon;
revoke all on function public.pee_pdc_della_mia_sezione() from public, anon;
grant execute on function public.pee_richieste_al_clan() to authenticated;
grant execute on function public.pee_pdc_della_mia_sezione() to authenticated;
