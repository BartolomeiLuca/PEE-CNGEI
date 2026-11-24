-- PEE CNGEI — giri di raccolta dei piani (Regia del Piano) — 24 novembre 2026
-- Da eseguire UNA volta, DOPO lo script del 23 novembre (piani): Supabase > SQL Editor > New query > incolla tutto > Run.
-- Si può rieseguire senza danni. Non tocca né cancella nessun dato esistente: aggiunge solo tabelle e funzioni nuove.
--
-- Cosa aggiunge
--   pee_piani_giri            un «giro» di raccolta per piano (apertura, scadenza, chiusura): lo vedono tutte le persone invitate al piano
--   pee_piani_contributi      carte di ambito e Carta di Unità, CON NOME; fino alla consegna le vede solo chi le scrive;
--                             dopo la consegna le altre persone le vedono solo dopo aver consegnato la propria o a giro chiuso
--   pee_piani_giri_persona    chi ha risposto al Mazzo persona (SENZA le risposte)
--   pee_piani_voci_anonime    le risposte del Mazzo persona (SENZA autore: nessun campo le collega a una persona; solo la data, non l'ora)
--   pee_piani_giri_registro   chi non ha risposto, fissato alla chiusura: lo vedono solo titolare e co-titolari
--
-- Anonimato: le risposte del Mazzo persona si scrivono solo con la funzione pee_piano_giro_persona, che le salva senza autore.
-- Si leggono solo a giro chiuso, solo da titolare e co-titolari, e solo se hanno risposto almeno 4 persone.
-- È anonima per le persone del Consiglio, non per chi amministra il database.
--
-- Per tornare indietro (solo se servisse): drop table public.pee_piani_giri_registro, public.pee_piani_voci_anonime,
--   public.pee_piani_giri_persona, public.pee_piani_contributi, public.pee_piani_giri cascade;

-- ══ 1. Giri ══
create table if not exists public.pee_piani_giri (
  id             uuid primary key default gen_random_uuid(),
  piano_id       uuid not null references public.pee_piani(id) on delete cascade,
  n              int  not null default 0,
  ritmo          text not null default 'standard' check (ritmo in ('rapido', 'standard', 'bivacco')),
  fase           text not null default 'giro1' check (fase in ('giro1', 'giro2')),
  stato          text not null default 'aperto' check (stato in ('aperto', 'chiuso')),
  scadenza       date,
  aperto_da      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  aperto_il      timestamptz not null default now(),
  chiuso_il      timestamptz,
  chiusura_tipo  text check (chiusura_tipo in ('scadenza', 'anticipata', 'completa')),
  unique (piano_id, n)
);
create unique index if not exists pee_piani_giri_uno_aperto on public.pee_piani_giri (piano_id) where stato = 'aperto';
alter table public.pee_piani_giri enable row level security;

-- ══ 2. Contributi con nome (carte di ambito, Carta di Unità) ══
create table if not exists public.pee_piani_contributi (
  id            uuid primary key default gen_random_uuid(),
  giro_id       uuid not null references public.pee_piani_giri(id) on delete cascade,
  piano_id      uuid not null references public.pee_piani(id) on delete cascade,
  autore_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autore_nome   text not null default '' check (char_length(autore_nome) <= 120),
  tipo          text not null check (tipo in ('carte', 'unita')),
  data          jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 100000),
  consegnato    boolean not null default false,
  consegnato_il timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (giro_id, autore_id, tipo)
);
create index if not exists pee_piani_contributi_giro on public.pee_piani_contributi (giro_id);
alter table public.pee_piani_contributi enable row level security;

-- ══ 3. Mazzo persona: chi ha risposto (senza risposte) e risposte (senza autore) ══
create table if not exists public.pee_piani_giri_persona (
  id        uuid primary key default gen_random_uuid(),
  giro_id   uuid not null references public.pee_piani_giri(id) on delete cascade,
  piano_id  uuid not null references public.pee_piani(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  giorno    date not null default current_date,
  unique (giro_id, user_id)
);
alter table public.pee_piani_giri_persona enable row level security;

create table if not exists public.pee_piani_voci_anonime (
  id        uuid primary key default gen_random_uuid(),
  giro_id   uuid not null references public.pee_piani_giri(id) on delete cascade,
  piano_id  uuid not null references public.pee_piani(id) on delete cascade,
  q         text not null check (q in ('p1','p2','p3','p4','p5','p6','p7','p8')),
  scelta    text[] not null default '{}' check (cardinality(scelta) <= 8),
  testo     text not null default '' check (char_length(testo) <= 1500),
  giorno    date not null default current_date
);
create index if not exists pee_piani_voci_anonime_giro on public.pee_piani_voci_anonime (giro_id);
alter table public.pee_piani_voci_anonime enable row level security;

-- ══ 4. Registro della chiusura (chi non ha risposto): solo titolare e co-titolari ══
create table if not exists public.pee_piani_giri_registro (
  giro_id  uuid primary key references public.pee_piani_giri(id) on delete cascade,
  piano_id uuid not null references public.pee_piani(id) on delete cascade,
  data     jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 100000)
);
alter table public.pee_piani_giri_registro enable row level security;

-- ══ 5. Funzioni di appoggio ══
create or replace function public.pee_giro_piano(g uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select piano_id from public.pee_piani_giri where id = g
$$;
create or replace function public.pee_giro_aperto(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select stato = 'aperto' from public.pee_piani_giri where id = g), false)
$$;
-- chi coordina: titolare o co-titolare del piano
create or replace function public.pee_piano_coordina(p uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce(public.pee_piano_ruolo(p) in ('titolare', 'cotitolare'), false)
$$;
-- le carte degli altri si vedono dopo aver consegnato la propria, oppure a giro chiuso
create or replace function public.pee_giro_vedo_altri(g uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.pee_piani_giri gi where gi.id = g and gi.stato = 'chiuso')
      or exists (select 1 from public.pee_piani_contributi c
                 where c.giro_id = g and c.autore_id = auth.uid() and c.tipo = 'carte' and c.consegnato)
$$;
-- le risposte anonime si leggono a giro chiuso, con almeno 4 persone che hanno risposto
create or replace function public.pee_giro_persona_leggibile(g uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.pee_piani_giri gi where gi.id = g and gi.stato = 'chiuso')
     and (select count(*) from public.pee_piani_giri_persona x where x.giro_id = g) >= 4
$$;
revoke all on function public.pee_giro_piano(uuid), public.pee_giro_aperto(uuid), public.pee_piano_coordina(uuid),
  public.pee_giro_vedo_altri(uuid), public.pee_giro_persona_leggibile(uuid) from public, anon;
grant execute on function public.pee_giro_piano(uuid), public.pee_giro_aperto(uuid), public.pee_piano_coordina(uuid),
  public.pee_giro_vedo_altri(uuid), public.pee_giro_persona_leggibile(uuid) to authenticated;

-- ══ 6. Controlli in scrittura sui contributi ══
create or replace function public.pee_piani_contributi_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare gp uuid;
begin
  select piano_id into gp from public.pee_piani_giri where id = new.giro_id;
  if gp is null then raise exception 'Giro non trovato'; end if;
  new.piano_id := gp;
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.created_at := now();
    if auth.uid() is not null then
      new.autore_id := auth.uid();
      new.autore_nome := public.pee_mio_nome();
    end if;
  else
    new.created_at := old.created_at;
    new.giro_id := old.giro_id; new.autore_id := old.autore_id; new.autore_nome := old.autore_nome; new.tipo := old.tipo;
  end if;
  if new.consegnato then
    if tg_op = 'UPDATE' and old.consegnato then new.consegnato_il := old.consegnato_il;
    else new.consegnato_il := now(); end if;
  else
    new.consegnato_il := null;
  end if;
  return new;
end $$;
drop trigger if exists pee_piani_contributi_ins on public.pee_piani_contributi;
create trigger pee_piani_contributi_ins before insert on public.pee_piani_contributi for each row execute function public.pee_piani_contributi_prima();
drop trigger if exists pee_piani_contributi_upd on public.pee_piani_contributi;
create trigger pee_piani_contributi_upd before update on public.pee_piani_contributi for each row execute function public.pee_piani_contributi_prima();

-- ══ 7. Regole di accesso ══
drop policy if exists "giri: li vedono le persone del piano" on public.pee_piani_giri;
create policy "giri: li vedono le persone del piano" on public.pee_piani_giri
  for select to authenticated
  using (public.pee_piano_ruolo(piano_id) is not null);
-- nessuna regola di scrittura sui giri: si apre, si sposta la scadenza e si chiude solo con le funzioni qui sotto

drop policy if exists "contributi: leggo i miei e, dopo la consegna, quelli consegnati" on public.pee_piani_contributi;
create policy "contributi: leggo i miei e, dopo la consegna, quelli consegnati" on public.pee_piani_contributi
  for select to authenticated
  using (autore_id = auth.uid()
         or (consegnato and public.pee_piano_ruolo(piano_id) is not null and public.pee_giro_vedo_altri(giro_id)));

drop policy if exists "contributi: scrivo i miei a giro aperto" on public.pee_piani_contributi;
create policy "contributi: scrivo i miei a giro aperto" on public.pee_piani_contributi
  for insert to authenticated
  with check (autore_id = auth.uid()
              and public.pee_piano_ruolo(public.pee_giro_piano(giro_id)) is not null
              and public.pee_giro_aperto(giro_id));

drop policy if exists "contributi: modifico i miei a giro aperto" on public.pee_piani_contributi;
create policy "contributi: modifico i miei a giro aperto" on public.pee_piani_contributi
  for update to authenticated
  using (autore_id = auth.uid() and public.pee_giro_aperto(giro_id))
  with check (autore_id = auth.uid() and public.pee_giro_aperto(giro_id));

drop policy if exists "contributi: tolgo una mia bozza a giro aperto" on public.pee_piani_contributi;
create policy "contributi: tolgo una mia bozza a giro aperto" on public.pee_piani_contributi
  for delete to authenticated
  using (autore_id = auth.uid() and not consegnato and public.pee_giro_aperto(giro_id));

-- chi ha risposto al Mazzo persona (senza le risposte): lo vede chi coordina e ciascuno per sé; si scrive solo con la funzione
drop policy if exists "persona: vedo la mia risposta o coordino" on public.pee_piani_giri_persona;
create policy "persona: vedo la mia risposta o coordino" on public.pee_piani_giri_persona
  for select to authenticated
  using (user_id = auth.uid() or public.pee_piano_coordina(piano_id));

-- risposte anonime: a giro chiuso, almeno 4 persone, solo chi coordina; nessuna scrittura diretta
drop policy if exists "voci anonime: le leggono titolare e co-titolari" on public.pee_piani_voci_anonime;
create policy "voci anonime: le leggono titolare e co-titolari" on public.pee_piani_voci_anonime
  for select to authenticated
  using (public.pee_piano_coordina(piano_id) and public.pee_giro_persona_leggibile(giro_id));

drop policy if exists "registro: lo leggono titolare e co-titolari" on public.pee_piani_giri_registro;
create policy "registro: lo leggono titolare e co-titolari" on public.pee_piani_giri_registro
  for select to authenticated
  using (public.pee_piano_coordina(piano_id));

-- ══ 8. Funzioni: aprire, spostare la scadenza, chiudere, rispondere al Mazzo persona, vedere chi ha consegnato ══
create or replace function public.pee_piano_giro_apri(p uuid, ritmo_ text default 'standard', fase_ text default 'giro1', scadenza_ date default null)
returns uuid language plpgsql security definer set search_path = public, auth as $$
declare gid uuid; nn int;
begin
  if not public.pee_piano_coordina(p) then raise exception 'Solo il titolare o un co-titolare apre un giro'; end if;
  if exists (select 1 from public.pee_piani_giri where piano_id = p and stato = 'aperto') then
    raise exception 'C''è già un giro aperto: chiudilo prima di aprirne un altro';
  end if;
  perform pg_advisory_xact_lock(hashtext('pee_piani_giri:' || p::text));
  select coalesce(max(n), 0) + 1 into nn from public.pee_piani_giri where piano_id = p;
  insert into public.pee_piani_giri (piano_id, n, ritmo, fase, scadenza, aperto_da)
    values (p, nn, ritmo_, fase_, scadenza_, auth.uid()) returning id into gid;
  return gid;
end $$;

create or replace function public.pee_piano_giro_scadenza(g uuid, scadenza_ date) returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.pee_piano_coordina(public.pee_giro_piano(g)) then raise exception 'Solo il titolare o un co-titolare cambia la scadenza'; end if;
  update public.pee_piani_giri set scadenza = scadenza_ where id = g and stato = 'aperto';
end $$;

-- chi ha consegnato cosa, senza i contenuti: lo vede solo chi coordina (serve per sollecitare chi non ha ancora risposto)
create or replace function public.pee_piano_giro_stato(g uuid)
returns table (email text, nome text, etichetta text, ruolo text, carte boolean, unita boolean, persona boolean)
language plpgsql stable security definer set search_path = public, auth as $$
declare p uuid := public.pee_giro_piano(g);
begin
  if p is null or not public.pee_piano_coordina(p) then raise exception 'Solo il titolare o un co-titolare vede chi ha consegnato'; end if;
  return query
  with persone as (
    select u.id as uid, lower(u.email)::text as em,
           coalesce(nullif(trim(u.raw_user_meta_data->>'nome'), ''), '')::text as nm, ''::text as et, 'titolare'::text as ru
      from public.pee_piani pi join auth.users u on u.id = pi.owner_id where pi.id = p
    union all
    select (select id from auth.users x where lower(x.email) = m.email limit 1), m.email::text, m.nome::text, m.etichetta::text, m.ruolo::text
      from public.pee_piani_membri m where m.piano_id = p
  )
  select pe.em, pe.nm, pe.et, pe.ru,
         exists (select 1 from public.pee_piani_contributi c where c.giro_id = g and c.autore_id = pe.uid and c.tipo = 'carte' and c.consegnato),
         exists (select 1 from public.pee_piani_contributi c where c.giro_id = g and c.autore_id = pe.uid and c.tipo = 'unita' and c.consegnato),
         exists (select 1 from public.pee_piani_giri_persona x where x.giro_id = g and x.user_id = pe.uid)
    from persone pe order by pe.nm, pe.em;
end $$;

-- chiusura: il giro si chiude e il registro di chi non ha risposto resta solo a chi coordina
create or replace function public.pee_piano_giro_chiudi(g uuid, tipo_ text default 'anticipata') returns void
language plpgsql security definer set search_path = public, auth as $$
declare p uuid := public.pee_giro_piano(g); reg jsonb; n_persona int;
begin
  if p is null or not public.pee_piano_coordina(p) then raise exception 'Solo il titolare o un co-titolare chiude il giro'; end if;
  if not public.pee_giro_aperto(g) then raise exception 'Il giro è già chiuso'; end if;
  if tipo_ not in ('scadenza', 'anticipata', 'completa') then raise exception 'Tipo di chiusura non valido'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('email', s.email, 'nome', s.nome, 'etichetta', s.etichetta)) filter (where not s.carte), '[]'::jsonb)
    into reg from public.pee_piano_giro_stato(g) s;
  select count(*) into n_persona from public.pee_piani_giri_persona where giro_id = g;
  insert into public.pee_piani_giri_registro (giro_id, piano_id, data)
    values (g, p, jsonb_build_object(
      'chiuso_da', public.pee_mio_nome(), 'chiusura_tipo', tipo_, 'chiuso_il', now(),
      'senza_carte', reg,
      'senza_persona', (select coalesce(jsonb_agg(jsonb_build_object('email', s.email, 'nome', s.nome, 'etichetta', s.etichetta)) filter (where not s.persona), '[]'::jsonb) from public.pee_piano_giro_stato(g) s),
      'risposte_persona', n_persona))
    on conflict (giro_id) do nothing;
  update public.pee_piani_giri set stato = 'chiuso', chiuso_il = now(), chiusura_tipo = tipo_ where id = g;
end $$;

-- risposta al Mazzo persona: salva le risposte SENZA autore e segna solo che la persona ha risposto
create or replace function public.pee_piano_giro_persona(g uuid, voci jsonb) returns void
language plpgsql security definer set search_path = public, auth as $$
declare p uuid := public.pee_giro_piano(g); v jsonb; sc text[];
begin
  if p is null or public.pee_piano_ruolo(p) is null then raise exception 'Non hai accesso a questo piano'; end if;
  if not public.pee_giro_aperto(g) then raise exception 'Il giro è chiuso'; end if;
  if jsonb_typeof(voci) <> 'array' or jsonb_array_length(voci) > 8 then raise exception 'Risposte non valide'; end if;
  if exists (select 1 from public.pee_piani_giri_persona where giro_id = g and user_id = auth.uid()) then
    raise exception 'Hai già risposto: le risposte anonime non si modificano';
  end if;
  insert into public.pee_piani_giri_persona (giro_id, piano_id, user_id) values (g, p, auth.uid());
  for v in select * from jsonb_array_elements(voci) loop
    select coalesce(array_agg(x), '{}') into sc from jsonb_array_elements_text(coalesce(v->'scelta', '[]'::jsonb)) x;
    if cardinality(sc) > 0 or coalesce(btrim(v->>'testo'), '') <> '' then
      insert into public.pee_piani_voci_anonime (giro_id, piano_id, q, scelta, testo)
        values (g, p, v->>'q', sc, left(coalesce(v->>'testo', ''), 1500));
    end if;
  end loop;
end $$;
revoke all on function public.pee_piano_giro_apri(uuid, text, text, date), public.pee_piano_giro_scadenza(uuid, date),
  public.pee_piano_giro_stato(uuid), public.pee_piano_giro_chiudi(uuid, text), public.pee_piano_giro_persona(uuid, jsonb) from public, anon;
grant execute on function public.pee_piano_giro_apri(uuid, text, text, date), public.pee_piano_giro_scadenza(uuid, date),
  public.pee_piano_giro_stato(uuid), public.pee_piano_giro_chiudi(uuid, text), public.pee_piano_giro_persona(uuid, jsonb) to authenticated;

-- ══ 9. Permessi di base e avvisi in tempo reale ══
grant select on public.pee_piani_giri, public.pee_piani_giri_persona, public.pee_piani_voci_anonime, public.pee_piani_giri_registro to authenticated;
grant select, insert, update, delete on public.pee_piani_contributi to authenticated;
grant all on public.pee_piani_giri, public.pee_piani_contributi, public.pee_piani_giri_persona,
  public.pee_piani_voci_anonime, public.pee_piani_giri_registro to service_role;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pee_piani_giri') then
    alter publication supabase_realtime add table public.pee_piani_giri;
  end if;
end $$;
