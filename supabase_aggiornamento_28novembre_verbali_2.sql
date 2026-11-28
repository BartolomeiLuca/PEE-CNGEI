-- 28 novembre 2026 (pomeriggio) — Correzione ai Verbali (da eseguire DOPO supabase_aggiornamento_28novembre_verbali.sql, già lanciato).
-- Rieseguibile, non tocca dati: sostituisce solo la funzione di lettura pee_verbali_lista().
-- 1) Consiglio di Gruppo: lo legge chi ne fa parte PER RUOLO (Capo Gruppo, Vice, Capi Unità, Vice, Senior in Servizio del Gruppo), non chiunque abbia un Gruppo nel profilo
--    (il Coordinatore Senior che era stato Capo Gruppo se lo ritrovava scritto e lo leggeva); Commissario e Vice restano.
-- 2) Il verbale del Comitato di Sezione con la spunta «Visibile a tutta la Sezione» lo legge ogni iscritto della Sezione (anche Senior e adulti in formazione).

-- l'elenco dei verbali che chi chiama può leggere (suoi, e degli altri secondo le regole in testa a questo file)
drop function if exists public.pee_verbali_lista(int);
create function public.pee_verbali_lista(p_anno int default null)
returns table(id uuid, tipo text, titolo text, data date, modalita text, luogo text, partecipanti text, odg text, sintesi text, decisioni text, azioni jsonb,
              prossima date, stato text, approvato_il date, sez boolean, autore_nome text, autore_ruolo text, gruppo text, mio boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text; v_gr text; m text; v_cos boolean; v_da date; v_a date;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.gruppo, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  m := coalesce(me.ruolo, '');
  v_cos := m in ('cds', 'pres', 'tes', 'cos') or coalesce((me.dashboard->'cos'->>'membro') = 'true', false);
  if not found then raise exception 'I verbali li leggono gli iscritti di una Sezione.'; end if;
  v_sez := public.pee_norm(me.sezione); v_gr := public.pee_norm(me.gruppo);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  if p_anno is not null then v_da := make_date(p_anno, 9, 1); v_a := make_date(p_anno + 1, 8, 31); end if;

  return query
  select v.id, v.tipo, v.titolo, v.data, v.modalita, v.luogo, v.partecipanti, v.odg, v.sintesi, v.decisioni, v.azioni,
         v.prossima, v.stato, v.approvato_il, v.sez, v.autore_nome, v.autore_ruolo, v.gruppo, (v.owner_id = auth.uid()), v.updated_at
    from public.pee_verbali v
   where (p_anno is null or (v.data >= v_da and v.data <= v_a))
     and (v.owner_id = auth.uid()
          or (v.stato <> 'bozza' and public.pee_norm(v.sezione) = v_sez and (
                case v.tipo
                  when 'staff' then
                       (v.autore_ruolo in ('cu', 'vcu', 'senior') and ((m in ('cg', 'vcg') and v_gr <> '' and v_gr = public.pee_norm(v.gruppo)) or m in ('cds', 'vcds')))
                    or (v.autore_ruolo in ('cg', 'vcg', 'coords') and m in ('cds', 'vcds'))
                    or (v.autore_ruolo in ('cds', 'vcds') and m = 'pres')
                  when 'cdg' then (m in ('cu', 'vcu', 'senior', 'cg', 'vcg') and v_gr <> '' and v_gr = public.pee_norm(v.gruppo)) or m in ('cds', 'vcds')
                  when 'rica' then m in ('cu', 'vcu', 'senior', 'cg', 'vcg', 'coords', 'cds', 'vcds')
                  when 'cosez' then m in ('cg', 'vcg', 'coords', 'cds', 'vcds')
                  when 'cos' then v_cos or v.sez
                  else false end)))
   order by v.data desc, v.created_at desc
   limit 1000;
end $$;

revoke all on function public.pee_verbali_lista(int) from public, anon;
grant execute on function public.pee_verbali_lista(int) to authenticated;
revoke all on function public.pee_verbale_puo(text, jsonb, text, text) from public, anon;
grant execute on function public.pee_verbale_puo(text, jsonb, text, text) to authenticated;
