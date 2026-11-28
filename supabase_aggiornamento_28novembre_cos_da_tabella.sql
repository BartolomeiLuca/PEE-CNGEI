-- 28 novembre 2026 (sera) — Verbali del Comitato di Sezione: li legge chi è nella tabella «Comitato di Sezione (COS)» del Progetto di Sezione.
-- Da eseguire DOPO supabase_aggiornamento_28novembre_verbali.sql e _verbali_2.sql. Rieseguibile, non tocca nessun dato: sostituisce due funzioni.
--
-- Cosa cambia
-- 1) LEGGERE i verbali del COS (quelli non «visibili a tutta la Sezione»): Commissario, Presidente, Tesoriere e «membro COS» per ruolo (come prima)
--    + chiunque abbia l'email nella tabella COS di un Progetto di Sezione della propria Sezione.
--    Il Progetto di Sezione conta solo se il TITOLARE è il Commissario o il Presidente di quella Sezione (il Presidente, co-titolare del piano del Commissario, lo
--    può compilare comunque): nessuno può darsi accesso scrivendosi in un piano proprio, nemmeno invitando il Presidente come co-titolare.
--    Transizione: la vecchia spunta «Comitato di Sezione» del profilo vale ancora SOLO finché la Sezione non ha una tabella COS compilata.
-- 2) SCRIVERE i verbali del COS: solo Commissario e Presidente. Tesoriere e membri della tabella leggono soltanto.
--    (I verbali già scritti restano di chi li ha scritti: li vede e li modifica come prima.)

-- vero se chi chiama è nella tabella COS di un Progetto di Sezione «autorevole» della Sezione p_sez (già normalizzata con pee_norm)
create or replace function public.pee_cos_da_tabella(p_sez text) returns boolean
language plpgsql stable security definer set search_path = public, auth as $$
declare v_me text;
begin
  if auth.uid() is null or coalesce(p_sez, '') = '' then return false; end if;
  select lower(btrim(u.email)) into v_me from auth.users u where u.id = auth.uid();
  if coalesce(v_me, '') = '' then return false; end if;
  return exists (
    select 1
      from public.pee_piani p
     where p.tipo = 'sezione'
       and jsonb_typeof(p.data #> '{persone,cos}') = 'array'
       and exists (select 1 from jsonb_array_elements(p.data #> '{persone,cos}') e
                    where jsonb_typeof(e) = 'object' and lower(btrim(coalesce(e->>'mail', ''))) = v_me)
       and exists (select 1 from public.pee_profili o where o.user_id = p.owner_id and o.ruolo in ('cds', 'pres') and public.pee_norm(o.sezione) = p_sez));
end $$;

-- vero se la Sezione ha una tabella COS compilata (almeno una persona con email) in un Progetto di Sezione autorevole: serve alla transizione
create or replace function public.pee_cos_tabella_esiste(p_sez text) returns boolean
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if coalesce(p_sez, '') = '' then return false; end if;
  return exists (
    select 1
      from public.pee_piani p
     where p.tipo = 'sezione'
       and jsonb_typeof(p.data #> '{persone,cos}') = 'array'
       and exists (select 1 from jsonb_array_elements(p.data #> '{persone,cos}') e
                    where jsonb_typeof(e) = 'object' and btrim(coalesce(e->>'mail', '')) <> '')
       and exists (select 1 from public.pee_profili o where o.user_id = p.owner_id and o.ruolo in ('cds', 'pres') and public.pee_norm(o.sezione) = p_sez));
end $$;

-- chi può scrivere quale tipo di verbale (il COS lo scrivono solo Commissario e Presidente)
create or replace function public.pee_verbale_puo(p_ruolo text, p_dash jsonb, p_gruppo text, p_tipo text) returns boolean
language sql immutable set search_path = public as $$
  select case
    when coalesce(p_tipo, '') = 'staff' then
      coalesce(p_ruolo, '') in ('cds', 'vcds', 'coords')
      or (coalesce(p_ruolo, '') in ('cu', 'vcu', 'senior', 'cg', 'vcg') and public.pee_norm(p_gruppo) <> '')
    when p_tipo = 'cdg' then coalesce(p_ruolo, '') in ('cg', 'vcg') and public.pee_norm(p_gruppo) <> ''
    when p_tipo in ('rica', 'cosez') then coalesce(p_ruolo, '') in ('cds', 'vcds')
    when p_tipo = 'cos' then coalesce(p_ruolo, '') in ('cds', 'pres')
    else false end
$$;

-- l'elenco dei verbali che chi chiama può leggere
drop function if exists public.pee_verbali_lista(int);
create function public.pee_verbali_lista(p_anno int default null)
returns table(id uuid, tipo text, titolo text, data date, modalita text, luogo text, partecipanti text, odg text, sintesi text, decisioni text, azioni jsonb,
              prossima date, stato text, approvato_il date, sez boolean, autore_nome text, autore_ruolo text, gruppo text, mio boolean, updated_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text; v_gr text; m text; v_cos boolean; v_da date; v_a date;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.gruppo, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found then raise exception 'I verbali li leggono gli iscritti di una Sezione.'; end if;
  m := coalesce(me.ruolo, '');
  v_sez := public.pee_norm(me.sezione); v_gr := public.pee_norm(me.gruppo);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  v_cos := m in ('cds', 'pres', 'tes', 'cos')
        or public.pee_cos_da_tabella(v_sez)
        or (coalesce((me.dashboard->'cos'->>'membro') = 'true', false) and not public.pee_cos_tabella_esiste(v_sez));
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

revoke all on function public.pee_cos_da_tabella(text) from public, anon;
revoke all on function public.pee_cos_tabella_esiste(text) from public, anon;
grant execute on function public.pee_cos_da_tabella(text) to authenticated;
grant execute on function public.pee_cos_tabella_esiste(text) to authenticated;
revoke all on function public.pee_verbali_lista(int) from public, anon;
grant execute on function public.pee_verbali_lista(int) to authenticated;
revoke all on function public.pee_verbale_puo(text, jsonb, text, text) from public, anon;
grant execute on function public.pee_verbale_puo(text, jsonb, text, text) to authenticated;
