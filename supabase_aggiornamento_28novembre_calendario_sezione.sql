-- 28 novembre 2026 (sera) — Calendario della Sezione: la somma, in sola lettura, degli appuntamenti pubblicati dai Piani di Gruppo, dal Progetto di Sezione, dal Progetto di Clan e dalle Unità.
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Rieseguibile. NON crea tabelle, NON copia e NON modifica nessun dato: la funzione legge al momento dell'apertura.
-- Cosa esce (e nient'altro): tipo di evento, titolo, date, Gruppo, Branca, nome dell'Unità. Mai note, mai nomi, mai il resto del progetto.
-- Cosa NON esce: le riunioni, gli eventi segnati «Riservato», gli eventi dello staff (momenti formativi), gli eventi senza data o con data non valida.
-- Chi la legge: Capi Unità, Vice, Senior in Servizio, Capi Gruppo, Vice, Commissario, Vice, Presidente, Tesoriere, Coordinatore Senior e chi ha la spunta del Comitato di Sezione, della propria Sezione. Il Senior vede solo gli eventi del Clan.

-- data ISO «aaaa-mm-gg» valida, altrimenti null (una data scritta male non deve far fallire la funzione)
create or replace function public.pee_data_iso(t text) returns date
language plpgsql immutable set search_path = public as $$
begin
  if t is null or t !~ '^\d{4}-\d{2}-\d{2}' then return null; end if;
  return left(t, 10)::date;
exception when others then return null;
end $$;

drop function if exists public.pee_cal_sezione(int);
create function public.pee_cal_sezione(p_anno int default null)
returns table(origine text, tipo text, titolo text, data_da date, data_a date, gruppo text, branca text, unita text)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text; v_a int; v_da date; v_a2 date; v_clan boolean;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or not (coalesce(me.ruolo, '') in ('cu', 'vcu', 'senior', 'cg', 'vcg', 'cds', 'vcds', 'pres', 'tes', 'coords', 'snr', 'cos')
                       or coalesce((me.dashboard->'cos'->>'membro') = 'true', false)) then
    raise exception 'Il calendario della Sezione lo leggono le figure di Unità, di Gruppo e di Sezione.';
  end if;
  v_sez := public.pee_norm(me.sezione);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  v_clan := coalesce(me.ruolo, '') = 'snr';   -- il Senior vede solo gli eventi del Clan
  v_a := coalesce(p_anno, case when extract(month from current_date) >= 9 then extract(year from current_date)::int else extract(year from current_date)::int - 1 end);
  v_da := make_date(v_a, 9, 1); v_a2 := make_date(v_a + 1, 8, 31);

  return query
  with ev as (
    -- appuntamenti dei piani (Gruppo, Sezione, Clan): non riunioni, non riservati
    select p.tipo::text as origine,
           (case when t.o->>'tipo' in ('uscita', 'bivacco', 'campo', 'consiglio', 'assemblea') then t.o->>'tipo' else 'altro' end)::text as tipo,
           coalesce(nullif(btrim(left(coalesce(t.o->>'titolo', ''), 100)), ''), 'Senza titolo')::text as titolo,
           public.pee_data_iso(t.o->>'d1') as d1, public.pee_data_iso(t.o->>'d2') as d2,
           coalesce(pr.gruppo, '')::text as gruppo, ''::text as branca, ''::text as unita
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
      cross join lateral jsonb_array_elements(case when jsonb_typeof(p.data->'cal') = 'array' then p.data->'cal' else '[]'::jsonb end) as t(o)
     where p.tipo in ('gruppo', 'sezione', 'clan') and public.pee_norm(pr.sezione) = v_sez
       and jsonb_typeof(t.o) = 'object' and coalesce(t.o->>'tipo', '') <> 'riunione' and coalesce(t.o->>'ris', 'false') <> 'true'
    union all
    -- Consigli di Gruppo con una data (tappe del Piano di Gruppo)
    select 'gruppo', 'consiglio', 'Consiglio di Gruppo', public.pee_data_iso(t.o->>'data'), null, coalesce(pr.gruppo, ''), '', ''
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
      cross join lateral jsonb_array_elements(case when jsonb_typeof(p.data->'tappe') = 'array' then p.data->'tappe' else '[]'::jsonb end) as t(o)
     where p.tipo = 'gruppo' and public.pee_norm(pr.sezione) = v_sez and jsonb_typeof(t.o) = 'object' and t.o->>'tipo' = 'cdg'
    union all
    -- uscite, bivacchi e campi delle Unità (non quelli dello staff, non le riunioni, non i «Riservati»)
    select 'unita', (case when u.v->>'modello' = 'giorno' then 'uscita' when u.v->>'modello' = 'bivacco' then 'bivacco' else 'campo' end)::text,
           coalesce(nullif(btrim(left(coalesce(u.v->>'testo', ''), 100)), ''), 'Uscita senza titolo')::text,
           public.pee_data_iso(u.v->'ax'->>'data'),
           case when u.v->'ax'->>'durata' = 'piu' then public.pee_data_iso(u.v->'ax'->>'dataFine') else null end,
           coalesce(pr.gruppo, '')::text,
           (case when pr.branca in ('L', 'E', 'R') then pr.branca else '' end)::text,
           left(btrim(coalesce(a.data->>'UNIT_NAME', '')), 60)::text
      from public.pee_archivi a
      join public.pee_profili pr on pr.user_id = a.user_id
      cross join lateral jsonb_each(case when jsonb_typeof(a.data->'scheda'->'uscite') = 'object' then a.data->'scheda'->'uscite' else '{}'::jsonb end) as u(k, v)
     where public.pee_norm(pr.sezione) = v_sez and not v_clan
       and coalesce(a.meta->>'mode', '') not in ('staff', 'anno') and (a.meta->'cest') is null
       and jsonb_typeof(u.v) = 'object' and coalesce(u.v->>'del', 'false') <> 'true' and coalesce(u.v->>'dest', '') <> 'staff'
       and coalesce(u.v->>'modello', '') in ('giorno', 'bivacco', 'campo') and coalesce(u.v->>'risSez', 'false') <> 'true'
  )
  select distinct e.origine, e.tipo, e.titolo, e.d1, (case when e.d2 is not null and e.d2 > e.d1 then e.d2 else null end), e.gruppo, e.branca, e.unita
    from ev e
   where e.d1 is not null and e.d1 <= v_a2 and coalesce(e.d2, e.d1) >= v_da
     and (not v_clan or e.origine = 'clan')
   order by 4, 2, 3;
end $$;

revoke all on function public.pee_cal_sezione(int) from public, anon;
grant execute on function public.pee_cal_sezione(int) to authenticated;
revoke all on function public.pee_data_iso(text) from public, anon;
grant execute on function public.pee_data_iso(text) to authenticated;
