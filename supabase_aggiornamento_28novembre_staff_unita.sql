-- 28 novembre 2026 (sera) — «Chi vede lo staff della mia Unità»: consenso permanente + lettura dello staff di Unità.
-- Rieseguibile. Non tocca nessun dato esistente: aggiunge una tabella nuova (chiusa) e quattro funzioni.
--
-- Come funziona
-- * Il Capo Unità (o chiunque abbia un progetto Unità) autorizza una persona per email («il mio Capo Gruppo»). L'autorizzazione NON è legata
--   all'anno e NON è legata al progetto: dura finché la togli.
-- * La persona autorizzata legge SOLO nome, ruolo ed email delle persone della tabella dello staff dell'Unità dell'anno scout in corso
--   (mai telefono, professione, caratteristiche, formazione, né altro del progetto).
-- * Se l'autorizzazione c'è ma l'Unità non ha ancora un progetto dell'anno, o la tabella è vuota, la funzione lo dice (serve all'allerta).
-- * Il Capo Gruppo (e il Vice) vede anche chi sono i Capi Unità del suo Gruppo e se l'hanno autorizzato (solo nome, ruolo, Branca): serve all'allerta.
-- * La tabella dei consensi non si legge né si scrive direttamente: solo con queste funzioni.

create table if not exists public.pee_staff_consensi (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  email      text not null check (email = lower(btrim(email)) and char_length(email) between 5 and 254 and email like '%_@_%._%'),
  created_at timestamptz not null default now(),
  unique (owner_id, email)
);
alter table public.pee_staff_consensi enable row level security;
revoke all on public.pee_staff_consensi from public, anon, authenticated;

-- le autorizzazioni date da chi chiama
create or replace function public.pee_staff_consenso_lista()
returns table(email text, created_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  return query select c.email, c.created_at from public.pee_staff_consensi c where c.owner_id = auth.uid() order by c.created_at;
end $$;

-- dà (p_on = true) o toglie (p_on = false) l'autorizzazione a una persona
create or replace function public.pee_staff_consenso_imposta(p_email text, p_on boolean)
returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_mail text; v_me text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  v_mail := lower(btrim(coalesce(p_email, '')));
  if v_mail not like '%_@_%._%' or char_length(v_mail) > 254 then raise exception 'Controlla l''email.'; end if;
  select lower(u.email) into v_me from auth.users u where u.id = auth.uid();
  if v_mail = coalesce(v_me, '') then raise exception 'Non serve autorizzare te stesso.'; end if;
  if p_on then
    if (select count(*) from public.pee_staff_consensi c where c.owner_id = auth.uid()) >= 10
       and not exists (select 1 from public.pee_staff_consensi c where c.owner_id = auth.uid() and c.email = v_mail) then
      raise exception 'Hai già autorizzato troppe persone: toglierne qualcuna prima.';
    end if;
    insert into public.pee_staff_consensi(owner_id, email) values (auth.uid(), v_mail) on conflict (owner_id, email) do nothing;
  else
    delete from public.pee_staff_consensi c where c.owner_id = auth.uid() and c.email = v_mail;
  end if;
end $$;

-- gli staff di Unità che mi hanno autorizzato (anno scout in corso, o p_anno).
-- Una riga per ogni persona che mi ha autorizzato e per ogni suo progetto Unità dell'anno; se non ha un progetto: unita e staff vuoti.
create or replace function public.pee_staff_unita_visibili(p_anno int default null)
returns table(owner_id uuid, owner_nome text, owner_mail text, owner_ruolo text, unita text, fascia text, anno int, aggiornato timestamptz, staff jsonb)
language plpgsql stable security definer set search_path = public, auth as $$
declare v_me text; v_anno int;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select lower(u.email) into v_me from auth.users u where u.id = auth.uid();
  if v_me is null or v_me = '' then return; end if;
  v_anno := coalesce(p_anno, case when extract(month from now()) >= 9 then extract(year from now())::int else extract(year from now())::int - 1 end);
  return query
  select g.owner_id,
         coalesce(pr.nome, '')::text,
         lower(coalesce(ou.email, ''))::text,
         coalesce(pr.ruolo, '')::text,
         case when a.id is null then null else coalesce(nullif(btrim(a.meta->>'nome'), ''), nullif(btrim(a.data->>'UNIT_NAME'), ''), a.titolo) end::text,
         case when a.id is null then null else a.meta->>'fascia' end::text,
         case when a.id is null then null else a.anno end,
         case when a.id is null then null else a.updated_at end,
         case when a.id is null then '[]'::jsonb else coalesce((
           select jsonb_agg(jsonb_build_object(
                    'ruolo', left(btrim(coalesce(e->>'ruolo', '')), 40),
                    'nome',  left(btrim(coalesce(e->>'nome', '')), 80),
                    'mail',  left(coalesce((regexp_split_to_array(lower(btrim(coalesce(e->>'mail', ''))), '[\s,;]+'))[1], ''), 120)))
             from jsonb_array_elements(case when jsonb_typeof(a.data #> '{scheda,pp,staffTab}') = 'array' then a.data #> '{scheda,pp,staffTab}' else '[]'::jsonb end) e
            where jsonb_typeof(e) = 'object' and (btrim(coalesce(e->>'nome', '')) <> '' or btrim(coalesce(e->>'mail', '')) <> '')), '[]'::jsonb) end
    from public.pee_staff_consensi g
    left join public.pee_profili pr on pr.user_id = g.owner_id
    left join auth.users ou on ou.id = g.owner_id
    left join lateral (select x.* from public.pee_archivi x
                        where x.user_id = g.owner_id and x.anno = v_anno and x.meta->>'mode' = 'giovani'
                          and not (x.meta ? 'cest') and x.titolo !~* '^Esempio'
                        order by x.updated_at desc limit 5) a on true
   where g.email = v_me
   order by coalesce(pr.nome, ''), a.updated_at desc;
end $$;

-- i Capi Unità del mio Gruppo (solo se sono Capo Gruppo o Vice): nome, ruolo e Branca, e se mi hanno autorizzato.
-- Serve all'allerta «questa Unità non mi ha ancora autorizzato». Niente email, niente altro del profilo.
create or replace function public.pee_staff_unita_attese()
returns table(owner_id uuid, nome text, ruolo text, branca text, autorizzato boolean)
language plpgsql stable security definer set search_path = public, auth as $$
declare me record; v_me text; v_sez text; v_gr text;
begin
  if auth.uid() is null then raise exception 'Accesso necessario.'; end if;
  select pr.ruolo, pr.sezione, pr.gruppo into me from public.pee_profili pr where pr.user_id = auth.uid();
  if not found or coalesce(me.ruolo, '') not in ('cg', 'vcg') then return; end if;
  v_sez := public.pee_norm(me.sezione); v_gr := public.pee_norm(me.gruppo);
  if v_sez = '' or v_gr = '' then return; end if;
  select lower(u.email) into v_me from auth.users u where u.id = auth.uid();
  return query
  select p.user_id, coalesce(p.nome, '')::text, p.ruolo::text, coalesce(p.branca, '')::text,
         exists (select 1 from public.pee_staff_consensi g where g.owner_id = p.user_id and g.email = coalesce(v_me, '#'))
    from public.pee_profili p
   where p.user_id <> auth.uid() and p.ruolo = 'cu' and public.pee_norm(p.sezione) = v_sez and public.pee_norm(p.gruppo) = v_gr
   order by coalesce(p.nome, '');
end $$;

revoke all on function public.pee_staff_consenso_lista() from public, anon;
revoke all on function public.pee_staff_consenso_imposta(text, boolean) from public, anon;
revoke all on function public.pee_staff_unita_visibili(int) from public, anon;
grant execute on function public.pee_staff_consenso_lista() to authenticated;
grant execute on function public.pee_staff_consenso_imposta(text, boolean) to authenticated;
grant execute on function public.pee_staff_unita_visibili(int) to authenticated;
revoke all on function public.pee_staff_unita_attese() from public, anon;
grant execute on function public.pee_staff_unita_attese() to authenticated;
