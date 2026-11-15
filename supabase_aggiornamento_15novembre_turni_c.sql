-- 15 novembre 2026 · Revisione a turni (parte C)
-- Il revisore può riaprire una revisione già approvata, ma solo con una nota obbligatoria.
-- La revisione torna aperta e il turno resta al revisore (per segnare i punti da rifare e rimandarli). Rieseguibile, non tocca i dati.
create or replace function public.pee_rev_riapri(r uuid, n text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.pee_rev_ruolo(r) is distinct from 'revisore' then raise exception 'Solo il revisore'; end if;
  if length(trim(coalesce(n, ''))) = 0 then raise exception 'Scrivi perché riapri la revisione'; end if;
  if not exists (select 1 from public.pee_revisioni where id = r and stato = 'chiusa' and esito = 'approvata') then raise exception 'La revisione non è approvata'; end if;
  if exists (select 1 from public.pee_revisioni x join public.pee_revisioni y on y.archivio_id = x.archivio_id and y.id <> x.id and y.stato = 'aperta' where x.id = r) then raise exception 'Per questo progetto c''è già un''altra revisione aperta'; end if;
  update public.pee_revisioni set stato = 'aperta', fase = 'revisore', esito = null, chiusa_il = null, nota_chiusura = left('Riaperta: ' || trim(n), 600), updated_at = now() where id = r;
end $$;
revoke all on function public.pee_rev_riapri(uuid, text) from public, anon;
grant execute on function public.pee_rev_riapri(uuid, text) to authenticated;
