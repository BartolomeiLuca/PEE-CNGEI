-- 28 novembre 2026 (sera) — Presidente, Tesoriere e Senior sono ruoli a sé; «Comitato di Sezione» diventa una spunta del profilo; i Senior leggono il Progetto di Clan.
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Rieseguibile. Non cancella né modifica nessun dato.
-- Richiede gli script del 23, 25, 26, 27 e 28 novembre (pee_norm, pee_piani, carta di Unità, pds_alla_sezione, clan_e_gruppi).
--
--  1) Ruoli ammessi in pee_profili: si aggiungono 'pres' (Presidente), 'tes' (Tesoriere), 'snr' (Senior, i giovani del Clan: NON il Senior in Servizio, che resta 'senior').
--     'cos' resta ammesso solo per i profili già salvati: l'app chiede di scegliere il ruolo vero al prossimo accesso.
--  2) pee_etichetta_profilo: le tre etichette nuove.
--  3) Carta di Unità: la consegnano anche Vice Capo Gruppo, Vice Commissario, Presidente, Tesoriere e Coordinatore Senior che hanno indicato l'Unità nel profilo;
--     la leggono i Vice Capi Unità e i Senior in Servizio della stessa Unità (pee_vcu_stessa_unita).
--  4) pee_persone_elenco (cambia: aggiunge la colonna «comitato»), 5) pee_pds_della_mia_sezione (la leggono anche Presidente, Tesoriere e chi ha la spunta del Comitato),
--  6) pee_pdg_della_mia_sezione e 7) pee_pdc_della_mia_sezione (Commissario, Vice Commissario e Presidente),
--  8) pee_richieste_al_clan: un profilo senza ruolo non la legge (prima, per un NULL nel controllo, la leggeva).
--  9) pee_pdc_per_senior (NUOVA): i Senior della Sezione leggono, in sola lettura, i Progetti di Clan DELIBERATI o APPROVATI (mai le bozze).

alter table public.pee_profili drop constraint if exists pee_profili_ruolo_check;
alter table public.pee_profili add constraint pee_profili_ruolo_check
  check (ruolo is null or ruolo in ('cu','vcu','cg','cds','senior','volontario','cos','coords','vcg','vcds','pres','tes','snr'));

create or replace function public.pee_etichetta_profilo(r text, inc jsonb) returns text
language plpgsql stable set search_path = public as $$
begin
  return case r
    when 'cu' then 'Capo Unità' when 'vcu' then 'Vice Capo Unità' when 'senior' then 'Senior in Servizio'
    when 'cg' then 'Capo Gruppo' when 'vcg' then 'Vice Capo Gruppo'
    when 'cds' then 'Commissario di Sezione' when 'vcds' then 'Vice Commissario di Sezione'
    when 'pres' then 'Presidente' when 'tes' then 'Tesoriere' when 'snr' then 'Senior'
    when 'coords' then 'Coordinatore Senior'
    when 'cos' then 'Comitato di Sezione'
    when 'volontario' then 'Adulto in formazione'
    else '' end;
end $$;

create or replace function public.pee_piani_contributi_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare gp uuid; nn text; rr text; bb text; ee text; dd jsonb;
begin
  select piano_id into gp from public.pee_piani_giri where id = new.giro_id;
  if gp is null then raise exception 'Ascolto non trovato'; end if;
  new.piano_id := gp;
  new.updated_at := now();
  -- Carta di Unità: la consegna il Capo Unità (o chi ha indicato nel profilo la sua Unità: Capo Gruppo, Commissario, Vice, Presidente, Tesoriere, Coordinatore Senior), dalla programmazione dell'Unità
  if new.tipo = 'unita' and auth.uid() is not null then
    select pr.ruolo, pr.dashboard into rr, dd from public.pee_profili pr where pr.user_id = auth.uid();
    if not (coalesce(rr, '') = 'cu' or (coalesce(rr, '') in ('cg', 'cds', 'vcg', 'vcds', 'pres', 'tes', 'coords') and coalesce(dd->'unita'->>'branca', '') in ('L', 'E', 'R'))) then
      raise exception 'La Carta di Unità la consegna il Capo Unità, dalla programmazione dell’Unità.';
    end if;
    if coalesce(new.data->>'fonte', '') <> 'pee' then
      raise exception 'La Carta di Unità si consegna dalla programmazione dell’Unità: apri la voce «Carta di Unità» e consegnala da lì.';
    end if;
  end if;
  -- etichetta (ruolo) e Branca di chi scrive, dal profilo: fotografia al momento in cui scrive, finché l'Ascolto è aperto
  ee := ''; bb := '';
  if auth.uid() is not null and (tg_op = 'INSERT' or auth.uid() = old.autore_id) then
    select public.pee_etichetta_profilo(pr.ruolo, pr.dashboard->'cos'->'incarichi'), case when pr.branca in ('L', 'E', 'R') then pr.branca else '' end
      into ee, bb from public.pee_profili pr where pr.user_id = auth.uid();
    ee := coalesce(ee, ''); bb := coalesce(bb, '');
  end if;
  if tg_op = 'INSERT' then
    new.created_at := now();
    if auth.uid() is not null then
      new.autore_id := auth.uid();
      new.autore_nome := public.pee_mio_nome();
      new.autore_etichetta := ee; new.autore_branca := bb;
    end if;
  else
    new.created_at := old.created_at;
    new.giro_id := old.giro_id; new.autore_id := old.autore_id; new.tipo := old.tipo;
    nn := '';
    if auth.uid() is null then nn := new.autore_nome;               -- lanciato dall'editor SQL (non da una persona): si lascia com'è
    elsif auth.uid() = old.autore_id then nn := public.pee_mio_nome(); end if;
    new.autore_nome := case when nn <> '' then nn else old.autore_nome end;
    if auth.uid() is null then null;                                 -- lanciato dall'editor SQL (non da una persona): si lascia ciò che è scritto
    elsif auth.uid() = old.autore_id and ee <> '' then new.autore_etichetta := ee; new.autore_branca := bb;
    else new.autore_etichetta := old.autore_etichetta; new.autore_branca := old.autore_branca; end if;
  end if;
  if new.consegnato then
    if tg_op = 'UPDATE' and old.consegnato then new.consegnato_il := old.consegnato_il;
    else new.consegnato_il := now(); end if;
  else
    new.consegnato_il := null;
  end if;
  return new;
end $$;

create or replace function public.pee_vcu_stessa_unita(a uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.pee_profili me join public.pee_profili au on au.user_id = a
     where me.user_id = auth.uid() and me.ruolo in ('vcu', 'senior') and me.branca in ('L', 'E', 'R')
       and au.ruolo in ('cu', 'cg', 'cds', 'vcg', 'vcds', 'pres', 'tes', 'coords')
       and me.branca = (case when au.ruolo = 'cu' then au.branca else au.dashboard->'unita'->>'branca' end)
       and public.pee_norm(me.gruppo) <> '' and public.pee_norm(me.gruppo) = public.pee_norm(au.gruppo)
       and public.pee_norm(me.sezione) = public.pee_norm(au.sezione))
$$;
grant execute on function public.pee_vcu_stessa_unita(uuid) to authenticated;

drop function if exists public.pee_persone_elenco(text);
create function public.pee_persone_elenco(p_tipo text)
returns table(persona_id uuid, nome text, ruolo text, branca text, gruppo text, sezione text, incarichi jsonb, comitato boolean, email text)
language plpgsql stable security definer set search_path = public, auth as $$
declare
  me public.pee_profili%rowtype;
  v_sez text; v_gr text; v_comm boolean;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  if p_tipo is null or p_tipo not in ('gruppo', 'sezione', 'clan') then raise exception 'Elenco non valido.'; end if;
  select * into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found then raise exception 'Completa prima il tuo profilo.'; end if;
  v_sez := public.pee_norm(me.sezione); v_gr := public.pee_norm(me.gruppo);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  v_comm := coalesce(me.ruolo, '') in ('cds', 'pres');
  if p_tipo = 'gruppo' then
    if coalesce(me.ruolo, '') not in ('cg', 'vcg') then raise exception 'Solo chi guida il Gruppo vede questo elenco.'; end if;
    if v_gr = '' then raise exception 'Nel tuo profilo manca il Gruppo.'; end if;
  elsif p_tipo = 'sezione' then
    if not (v_comm or coalesce(me.ruolo, '') = 'vcds') then raise exception 'Solo chi guida la Sezione vede questo elenco.'; end if;
  else
    if coalesce(me.ruolo, '') <> 'coords' then raise exception 'Solo il Coordinatore Senior vede questo elenco.'; end if;
  end if;

  return query
    select pr.user_id, pr.nome, pr.ruolo, pr.branca, pr.gruppo, pr.sezione,
           coalesce(pr.dashboard->'cos'->'incarichi', '[]'::jsonb),
           (pr.ruolo in ('cds', 'pres', 'tes', 'cos') or coalesce((pr.dashboard->'cos'->>'membro') = 'true', false)),
           lower(u.email)
      from public.pee_profili pr
      join auth.users u on u.id = pr.user_id and u.email_confirmed_at is not null
     where pr.user_id <> auth.uid()
       and public.pee_norm(pr.sezione) = v_sez
       and ( (p_tipo = 'gruppo'  and ((public.pee_norm(pr.gruppo) = v_gr and pr.ruolo in ('cu', 'vcu', 'cg', 'vcg', 'senior')) or pr.ruolo in ('cds', 'vcds', 'pres', 'coords')))
          or (p_tipo = 'sezione' and (pr.ruolo in ('cg', 'vcg', 'cds', 'vcds', 'pres', 'tes', 'coords') or (pr.dashboard->'cos'->>'membro') = 'true'))
          or (p_tipo = 'clan'    and pr.ruolo in ('cg', 'vcg', 'cds', 'vcds', 'pres', 'snr')) )
     order by pr.nome;
end $$;

create or replace function public.pee_pds_della_mia_sezione()
returns table(id uuid, titolo text, anno_inizio int, durata int, stato text, sezione text, obiettivi jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or not (coalesce(me.ruolo, '') in ('cg', 'vcg', 'cu', 'vcu', 'senior', 'cds', 'vcds', 'pres', 'tes', 'cos', 'coords') or coalesce((me.dashboard->'cos'->>'membro') = 'true', false)) then
    raise exception 'Il Progetto di Sezione lo leggono le figure di Gruppo e di Sezione e chi fa parte del Comitato di Sezione.';
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

create or replace function public.pee_pdg_della_mia_sezione()
returns table(id uuid, titolo text, gruppo text, anno_inizio int, durata int, stato text, obiettivi jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or coalesce(me.ruolo, '') not in ('cds', 'vcds', 'pres') then
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

create or replace function public.pee_pdc_della_mia_sezione()
returns table(id uuid, titolo text, anno_inizio int, durata int, stato text, obiettivi jsonb, disponibilita jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.dashboard into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or coalesce(me.ruolo, '') not in ('cds', 'vcds', 'pres') then
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

drop function if exists public.pee_pdc_per_senior();
create function public.pee_pdc_per_senior()
returns table(id uuid, tipo text, titolo text, anno_inizio int, durata int, stato text, data jsonb, rev int, updated_at timestamptz, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or coalesce(me.ruolo, '') <> 'snr' then raise exception 'Il Progetto di Clan lo leggono i Senior della Sezione (il ruolo «Senior», non il Senior in Servizio).'; end if;
  v_sez := public.pee_norm(me.sezione);
  if v_sez = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  return query
    select p.id, p.tipo, p.titolo, p.anno_inizio, p.durata, p.stato, p.data, p.rev, p.updated_at, p.created_at
      from public.pee_piani p
      join public.pee_profili pr on pr.user_id = p.owner_id
     where p.tipo = 'clan' and p.stato in ('deliberato', 'approvato') and public.pee_norm(pr.sezione) = v_sez
     order by p.anno_inizio desc, p.updated_at desc;
end $$;

-- pee_richieste_al_clan (script clan_e_gruppi): stessa regola, ma un profilo senza ruolo non la legge
create or replace function public.pee_richieste_al_clan()
returns table(id uuid, titolo text, gruppo text, anno_inizio int, durata int, stato text, richieste jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_sez text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or coalesce(me.ruolo, '') <> 'coords' then
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

revoke all on function public.pee_persone_elenco(text) from public, anon;
revoke all on function public.pee_richieste_al_clan() from public, anon;
grant execute on function public.pee_richieste_al_clan() to authenticated;
revoke all on function public.pee_pds_della_mia_sezione() from public, anon;
revoke all on function public.pee_pdg_della_mia_sezione() from public, anon;
revoke all on function public.pee_pdc_della_mia_sezione() from public, anon;
revoke all on function public.pee_pdc_per_senior() from public, anon;
grant execute on function public.pee_persone_elenco(text) to authenticated;
grant execute on function public.pee_pds_della_mia_sezione() to authenticated;
grant execute on function public.pee_pdg_della_mia_sezione() to authenticated;
grant execute on function public.pee_pdc_della_mia_sezione() to authenticated;
grant execute on function public.pee_pdc_per_senior() to authenticated;
