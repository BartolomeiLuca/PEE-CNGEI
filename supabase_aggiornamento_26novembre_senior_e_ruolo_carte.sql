-- PEE CNGEI — 26/11/2026 — (1) i Senior in Servizio compaiono nell'elenco persone del Gruppo (GRU.4: fanno parte del Consiglio di Gruppo);
-- (2) sulle carte del giro restano ruolo e Branca di chi le ha scritte, per mostrarli accanto al nome.
-- Non cancella nessun dato. Si può rieseguire.

-- ══ 1. Elenco persone del Gruppo: aggiunge i Senior in Servizio (ruolo 'senior' del profilo) ══
create or replace function public.pee_persone_elenco(p_tipo text)
returns table(persona_id uuid, nome text, ruolo text, branca text, gruppo text, sezione text, incarichi jsonb, email text)
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
  v_comm := me.ruolo = 'cds'
         or (me.ruolo = 'cos' and exists (select 1 from jsonb_array_elements_text(coalesce(me.dashboard->'cos'->'incarichi', '[]'::jsonb)) x where public.pee_norm(x) = 'commissario'));
  if p_tipo = 'gruppo' then
    if me.ruolo not in ('cg', 'vcg') then raise exception 'Solo chi guida il Gruppo vede questo elenco.'; end if;
    if v_gr = '' then raise exception 'Nel tuo profilo manca il Gruppo.'; end if;
  elsif p_tipo = 'sezione' then
    if not (v_comm or me.ruolo = 'vcds') then raise exception 'Solo chi guida la Sezione vede questo elenco.'; end if;
  else
    if me.ruolo <> 'coords' then raise exception 'Solo il Coordinatore Senior vede questo elenco.'; end if;
  end if;

  return query
    select pr.user_id, pr.nome, pr.ruolo, pr.branca, pr.gruppo, pr.sezione,
           coalesce(pr.dashboard->'cos'->'incarichi', '[]'::jsonb), lower(u.email)
      from public.pee_profili pr
      join auth.users u on u.id = pr.user_id and u.email_confirmed_at is not null
     where pr.user_id <> auth.uid()
       and public.pee_norm(pr.sezione) = v_sez
       and ( (p_tipo = 'gruppo'  and ((public.pee_norm(pr.gruppo) = v_gr and pr.ruolo in ('cu', 'vcu', 'cg', 'vcg', 'senior')) or pr.ruolo in ('cds', 'vcds', 'cos', 'coords')))
          or (p_tipo = 'sezione' and pr.ruolo in ('cg', 'vcg', 'cds', 'vcds', 'cos', 'coords'))
          or (p_tipo = 'clan'    and pr.ruolo in ('cg', 'vcg', 'cds', 'vcds', 'cos')) )
     order by pr.nome;
end $$;

revoke all on function public.pee_persone_elenco(text) from public, anon;
grant execute on function public.pee_persone_elenco(text) to authenticated;

-- ══ 2. Ruolo e Branca sulle carte ══
alter table public.pee_piani_contributi add column if not exists autore_etichetta text not null default '' check (char_length(autore_etichetta) <= 60);
alter table public.pee_piani_contributi add column if not exists autore_branca text not null default '' check (autore_branca in ('', 'L', 'E', 'R'));

create or replace function public.pee_etichetta_profilo(r text, inc jsonb) returns text
language plpgsql stable set search_path = public as $$
begin
  return case r
    when 'cu' then 'Capo Unità' when 'vcu' then 'Vice Capo Unità' when 'senior' then 'Senior in Servizio'
    when 'cg' then 'Capo Gruppo' when 'vcg' then 'Vice Capo Gruppo'
    when 'cds' then 'Commissario di Sezione' when 'vcds' then 'Vice Commissario di Sezione'
    when 'coords' then 'Coordinatore Senior'
    when 'cos' then case
        when exists (select 1 from jsonb_array_elements_text(coalesce(inc, '[]'::jsonb)) x where public.pee_norm(x) = 'commissario') then 'Commissario di Sezione'
        when exists (select 1 from jsonb_array_elements_text(coalesce(inc, '[]'::jsonb)) x where public.pee_norm(x) = 'presidente') then 'Presidente'
        else 'Comitato di Sezione' end
    when 'volontario' then 'Adulto in formazione'
    else '' end;
end $$;

create or replace function public.pee_piani_contributi_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare gp uuid; nn text; rr text; bb text; ee text;
begin
  select piano_id into gp from public.pee_piani_giri where id = new.giro_id;
  if gp is null then raise exception 'Giro non trovato'; end if;
  new.piano_id := gp;
  new.updated_at := now();
  -- etichetta (ruolo) e Branca di chi scrive, dal profilo: fotografia al momento in cui scrive, finché il giro è aperto
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

-- allinea subito le carte già scritte (ruolo e Branca di oggi dal profilo)
update public.pee_piani_contributi c
   set autore_etichetta = coalesce(public.pee_etichetta_profilo(pr.ruolo, pr.dashboard->'cos'->'incarichi'), ''),
       autore_branca = case when pr.branca in ('L', 'E', 'R') then pr.branca else '' end
  from public.pee_profili pr
 where pr.user_id = c.autore_id and c.autore_etichetta = '';
