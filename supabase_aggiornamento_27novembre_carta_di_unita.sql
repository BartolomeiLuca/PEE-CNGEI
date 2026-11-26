-- PEE CNGEI — 27/11/2026 — Carta di Unità: la consegna solo il Capo Unità, solo dalla programmazione dell'Unità.
-- La legge: chi la scrive, chi coordina il piano e il Vice Capo Unità della stessa Unità (stessa Sezione, Gruppo e Branca).
-- Le altre persone del piano vedono solo i segnali (i semafori), con la funzione pee_giro_unita_semaforo.
-- Non cancella nessun dato: le Carte già consegnate restano dove sono. Si può rieseguire.
-- Richiede gli script del 23, 24 e 26 novembre.

-- ══ 1. Chi può consegnare la Carta di Unità ══
create or replace function public.pee_piani_contributi_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare gp uuid; nn text; rr text; bb text; ee text; dd jsonb;
begin
  select piano_id into gp from public.pee_piani_giri where id = new.giro_id;
  if gp is null then raise exception 'Ascolto non trovato'; end if;
  new.piano_id := gp;
  new.updated_at := now();
  -- Carta di Unità: la consegna il Capo Unità (o chi ha indicato nel profilo la sua Unità), dalla programmazione dell'Unità
  if new.tipo = 'unita' and auth.uid() is not null then
    select pr.ruolo, pr.dashboard into rr, dd from public.pee_profili pr where pr.user_id = auth.uid();
    if not (coalesce(rr, '') = 'cu' or (coalesce(rr, '') in ('cg', 'cds') and coalesce(dd->'unita'->>'branca', '') in ('L', 'E', 'R'))) then
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

-- ══ 2. Chi può leggere una Carta di Unità ══
-- il Vice Capo Unità della stessa Unità: stessa Sezione, stesso Gruppo, stessa Branca di chi l'ha scritta
create or replace function public.pee_vcu_stessa_unita(a uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.pee_profili me join public.pee_profili au on au.user_id = a
     where me.user_id = auth.uid() and me.ruolo = 'vcu' and me.branca in ('L', 'E', 'R')
       and au.ruolo in ('cu', 'cg', 'cds')
       and me.branca = (case when au.ruolo = 'cu' then au.branca else au.dashboard->'unita'->>'branca' end)
       and public.pee_norm(me.gruppo) <> '' and public.pee_norm(me.gruppo) = public.pee_norm(au.gruppo)
       and public.pee_norm(me.sezione) = public.pee_norm(au.sezione))
$$;
revoke all on function public.pee_vcu_stessa_unita(uuid) from public, anon;
grant execute on function public.pee_vcu_stessa_unita(uuid) to authenticated;

drop policy if exists "contributi: leggo i miei e, dopo la consegna, quelli consegnati" on public.pee_piani_contributi;
create policy "contributi: leggo i miei e, dopo la consegna, quelli consegnati" on public.pee_piani_contributi
  for select to authenticated
  using (autore_id = auth.uid()
         or (consegnato and public.pee_piano_ruolo(piano_id) is not null and public.pee_giro_vedo_altri(giro_id)
             and (tipo = 'carte' or public.pee_piano_coordina(piano_id) or public.pee_vcu_stessa_unita(autore_id))));

-- ══ 3. I segnali delle Unità, per tutte le persone del piano (senza il testo della Carta) ══
create or replace function public.pee_giro_unita_semaforo(g uuid)
returns table(unita text, branca text, s jsonb, consegnato_il timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  if public.pee_piano_ruolo(public.pee_giro_piano(g)) is null then raise exception 'Non hai accesso a questo piano.'; end if;
  if not public.pee_giro_vedo_altri(g) then raise exception 'Consegna prima le tue carte: poi potrai vedere i segnali delle Unità.'; end if;
  return query
    select coalesce(nullif(c.data->>'unita', ''), c.autore_nome)::text, c.autore_branca::text,
           case when jsonb_typeof(c.data->'s') = 'object' then c.data->'s' else '{}'::jsonb end, c.consegnato_il
      from public.pee_piani_contributi c
     where c.giro_id = g and c.tipo = 'unita' and c.consegnato
     order by 1;
end $$;
revoke all on function public.pee_giro_unita_semaforo(uuid) from public, anon;
grant execute on function public.pee_giro_unita_semaforo(uuid) to authenticated;
