-- PEE CNGEI — 25/11/2026 — Elenco delle persone iscritte (per Gruppo e per Sezione), per invitarle ai piani
-- Non modifica né cancella nessun dato: aggiunge solo due funzioni. Si può rieseguire.
-- Chi può chiamarla e cosa vede:
--   'gruppo'  → Capo Gruppo / Vice Capo Gruppo: le persone del proprio Gruppo + le figure di Sezione
--   'sezione' → Commissario (ruolo Commissario o incarico Commissario nel Comitato) / Vice Commissario: le figure del Gruppo e di Sezione
--   'clan'    → Coordinatore Senior: le figure di Sezione e i Capi Gruppo (il Progetto di Clan va alla Sezione)
-- Il confronto di Gruppo e Sezione ignora maiuscole, spazi doppi e accenti, ma i campi restano autodichiarati dal profilo.
-- Ogni persona è sempre esclusa dal proprio elenco. Nessuna scrittura: restituisce nome, ruolo, Branca, Gruppo, Sezione, incarichi, email.

create or replace function public.pee_norm(t text) returns text language sql immutable as $$
  select translate(lower(regexp_replace(btrim(coalesce(t, '')), '\s+', ' ', 'g')),
                   'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu') $$;

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
       and ( (p_tipo = 'gruppo'  and ((public.pee_norm(pr.gruppo) = v_gr and pr.ruolo in ('cu', 'vcu', 'cg', 'vcg')) or pr.ruolo in ('cds', 'vcds', 'cos', 'coords')))
          or (p_tipo = 'sezione' and pr.ruolo in ('cg', 'vcg', 'cds', 'vcds', 'cos', 'coords'))
          or (p_tipo = 'clan'    and pr.ruolo in ('cg', 'vcg', 'cds', 'vcds', 'cos')) )
     order by pr.nome;
end $$;

revoke all on function public.pee_persone_elenco(text) from public, anon;
grant execute on function public.pee_persone_elenco(text) to authenticated;
