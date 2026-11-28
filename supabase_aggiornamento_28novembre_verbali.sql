-- 28 novembre 2026 (sera) — Verbali delle riunioni degli adulti: dallo staff di Unità fino al Comitato di Sezione.
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Rieseguibile. Non tocca nessun dato esistente: crea una tabella nuova.
-- Il verbale integra il libro dei verbali, non lo sostituisce.
--
-- Chi scrive cosa:
--   Riunione di staff ........ Capi Unità, Vice, Senior in Servizio, Capi Gruppo, Vice, Coordinatore Senior, Commissario, Vice
--   Consiglio di Gruppo ...... Capo Gruppo, Vice
--   RiCa, Consiglio di Sezione  Commissario, Vice
--   Comitato di Sezione ...... Commissario, Presidente, Tesoriere, chi ha la spunta del Comitato (anche i Vice, se ne fanno parte)
-- Chi legge (sempre nella stessa Sezione, e solo se il verbale non è più «bozza»; la bozza la legge solo chi la scrive):
--   Staff di Unità ........... il Capo Gruppo di quel Gruppo, Commissario e Vice
--   Staff di Gruppo / Clan ... Commissario e Vice
--   Staff del Commissario .... il Presidente
--   Consiglio di Gruppo ...... tutti gli adulti di quel Gruppo, Commissario e Vice
--   RiCa ..................... tutti i Capi della Sezione, il Coordinatore Senior, Commissario e Vice
--   Consiglio di Sezione ..... Capi Gruppo e Vice, Coordinatore Senior, Commissario e Vice (il Presidente no)
--   Comitato di Sezione ...... i membri del Comitato; con la spunta «Visibile a tutta la Sezione» tutti gli adulti
-- Il Consiglio di Gruppo lo legge chi ne fa parte per ruolo (Capo Gruppo, Vice, Capi Unità, Vice, Senior in Servizio del Gruppo): un Gruppo rimasto scritto nel profilo dopo un cambio di ruolo non basta.
-- Il verbale del Comitato di Sezione con la spunta «Visibile a tutta la Sezione» lo legge ogni iscritto della Sezione, Senior e adulti in formazione compresi; di tutti gli altri verbali questi leggono solo i propri.
-- Un verbale approvato non si modifica e non si cancella: va prima riaperto (torna «condiviso» o «bozza»).
-- La lettura passa SOLO dalla funzione pee_verbali_lista(): la tabella la legge direttamente solo chi ha scritto il verbale.

create table if not exists public.pee_verbali (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  sezione text not null default '',
  gruppo text not null default '',
  autore_ruolo text not null default '',
  autore_nome text not null default '',
  tipo text not null check (tipo in ('staff', 'cdg', 'rica', 'cosez', 'cos')),
  titolo text not null default '' check (char_length(titolo) <= 160),
  data date not null,
  modalita text not null default 'presenza' check (modalita in ('presenza', 'online')),
  luogo text not null default '' check (char_length(luogo) <= 200),
  partecipanti text not null default '' check (char_length(partecipanti) <= 4000),
  odg text not null default '' check (char_length(odg) <= 8000),
  sintesi text not null default '' check (char_length(sintesi) <= 30000),
  decisioni text not null default '' check (char_length(decisioni) <= 12000),
  azioni jsonb not null default '[]'::jsonb check (jsonb_typeof(azioni) = 'array' and jsonb_array_length(azioni) <= 100 and pg_column_size(azioni) <= 60000),
  prossima date,
  stato text not null default 'bozza' check (stato in ('bozza', 'condiviso', 'approvato')),
  approvato_il date,
  sez boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pee_verbali_sezione_idx on public.pee_verbali (sezione, data desc);
create index if not exists pee_verbali_owner_idx on public.pee_verbali (owner_id, data desc);

-- chi può scrivere quel tipo di verbale (ruolo, spunta del Comitato, Gruppo)
create or replace function public.pee_verbale_puo(p_ruolo text, p_dash jsonb, p_gruppo text, p_tipo text) returns boolean
language sql immutable set search_path = public as $$
  select case
    when coalesce(p_tipo, '') = 'staff' then
      coalesce(p_ruolo, '') in ('cds', 'vcds', 'coords')
      or (coalesce(p_ruolo, '') in ('cu', 'vcu', 'senior', 'cg', 'vcg') and public.pee_norm(p_gruppo) <> '')
    when p_tipo = 'cdg' then coalesce(p_ruolo, '') in ('cg', 'vcg') and public.pee_norm(p_gruppo) <> ''
    when p_tipo in ('rica', 'cosez') then coalesce(p_ruolo, '') in ('cds', 'vcds')
    when p_tipo = 'cos' then coalesce(p_ruolo, '') in ('cds', 'pres', 'tes', 'cos') or coalesce((p_dash->'cos'->>'membro') = 'true', false)
    else false end
$$;

-- prima di salvare: l'autore, la Sezione e il Gruppo vengono dal profilo (non da ciò che manda l'app); regole di scrittura e di stato
create or replace function public.pee_verbali_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare pr record;
begin
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid(); new.created_at := now();
  else
    new.owner_id := old.owner_id; new.created_at := old.created_at;
    if old.stato = 'approvato' and new.stato = 'approvato' then
      raise exception 'Il verbale approvato non si modifica: riaprilo prima.';
    end if;
  end if;
  select p.nome, p.ruolo, p.sezione, p.gruppo, p.dashboard into pr from public.pee_profili p where p.user_id = new.owner_id;
  if not found or public.pee_norm(pr.sezione) = '' then raise exception 'Nel tuo profilo manca la Sezione.'; end if;
  if not public.pee_verbale_puo(pr.ruolo, pr.dashboard, pr.gruppo, new.tipo) then
    raise exception 'Con il tuo ruolo non puoi scrivere questo tipo di verbale.';
  end if;
  new.sezione := btrim(pr.sezione); new.gruppo := btrim(coalesce(pr.gruppo, '')); new.autore_ruolo := coalesce(pr.ruolo, '');
  new.autore_nome := left(btrim(coalesce(pr.nome, '')), 120);
  new.sez := coalesce(new.sez, false) and new.tipo = 'cos';
  if new.stato = 'approvato' then new.approvato_il := coalesce(new.approvato_il, current_date); else new.approvato_il := null; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists pee_verbali_prima_trg on public.pee_verbali;
create trigger pee_verbali_prima_trg before insert or update on public.pee_verbali for each row execute function public.pee_verbali_prima();

alter table public.pee_verbali enable row level security;
drop policy if exists pee_verbali_sel on public.pee_verbali;
drop policy if exists pee_verbali_ins on public.pee_verbali;
drop policy if exists pee_verbali_upd on public.pee_verbali;
drop policy if exists pee_verbali_del on public.pee_verbali;
create policy pee_verbali_sel on public.pee_verbali for select to authenticated using (owner_id = auth.uid());
create policy pee_verbali_ins on public.pee_verbali for insert to authenticated with check (owner_id = auth.uid());
create policy pee_verbali_upd on public.pee_verbali for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy pee_verbali_del on public.pee_verbali for delete to authenticated using (owner_id = auth.uid() and stato <> 'approvato');
revoke all on public.pee_verbali from public, anon;
grant select, insert, update, delete on public.pee_verbali to authenticated;

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
