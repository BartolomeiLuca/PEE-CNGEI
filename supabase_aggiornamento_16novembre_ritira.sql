-- 16 novembre 2026 · Revisione a turni (parte D)
-- Il revisore può ritirare una richiesta che non ha ancora inviato (punto «da fare» nel suo turno).
-- Il punto viene tolto dall'elenco; il commento si svuota dall'app. Rieseguibile, non tocca altri dati.
create or replace function public.pee_rev_ritira(r uuid, k text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.pee_rev_ruolo(r) is distinct from 'revisore' then raise exception 'Solo il revisore'; end if;
  if not exists (select 1 from public.pee_revisioni where id = r and stato = 'aperta' and fase = 'revisore') then raise exception 'Non è il tuo turno'; end if;
  delete from public.pee_revisioni_punto where revisione_id = r and chiave = k and stato = 'da_fare';
  if not found then raise exception 'Questa richiesta non si può ritirare'; end if;
  update public.pee_revisioni set updated_at = now() where id = r;
end $$;
revoke all on function public.pee_rev_ritira(uuid, text) from public, anon;
grant execute on function public.pee_rev_ritira(uuid, text) to authenticated;
