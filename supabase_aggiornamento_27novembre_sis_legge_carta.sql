-- 27 novembre 2026 · Il Senior in Servizio legge la Carta di Unità della sua Unità (sola lettura)
-- Richiede lo script del 27 novembre «carta di Unità». Rieseguibile, non cancella né modifica dati.
-- La stessa regola del Vice Capo Unità: stessa Branca, stesso Gruppo, stessa Sezione.
-- La Carta la consegna e la modifica solo il Capo Unità: questo script non cambia chi scrive.

create or replace function public.pee_vcu_stessa_unita(a uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.pee_profili me join public.pee_profili au on au.user_id = a
     where me.user_id = auth.uid() and me.ruolo in ('vcu', 'senior') and me.branca in ('L', 'E', 'R')
       and au.ruolo in ('cu', 'cg', 'cds')
       and me.branca = (case when au.ruolo = 'cu' then au.branca else au.dashboard->'unita'->>'branca' end)
       and public.pee_norm(me.gruppo) <> '' and public.pee_norm(me.gruppo) = public.pee_norm(au.gruppo)
       and public.pee_norm(me.sezione) = public.pee_norm(au.sezione))
$$;
revoke all on function public.pee_vcu_stessa_unita(uuid) from public, anon;
grant execute on function public.pee_vcu_stessa_unita(uuid) to authenticated;
