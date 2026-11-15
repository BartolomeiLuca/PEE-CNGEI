-- 15 novembre 2026 · Revisione a turni (parte B)
-- Il revisore può segnare «Visto» (stato confermato) anche un punto non richiesto da lui: serve per le modifiche che chi ha scritto il progetto fa fuori dalle richieste.
-- Sostituisce la funzione della parte A (rieseguibile, non tocca i dati).
create or replace function public.pee_rev_punto(r uuid, k text, s text, n text default '') returns void
language plpgsql security definer set search_path = public as $$
declare ru text := public.pee_rev_ruolo(r); v public.pee_revisioni; cur text;
begin
  select * into v from public.pee_revisioni where id = r;
  if ru is null or v.stato <> 'aperta' then raise exception 'Revisione non disponibile'; end if;
  select stato into cur from public.pee_revisioni_punto where revisione_id = r and chiave = k;
  if ru = 'titolare' then
    if v.fase <> 'compilatore' then raise exception 'Tocca al revisore'; end if;
    if s not in ('fatto', 'attesa') or cur is null then raise exception 'Azione non consentita'; end if;
    if cur = 'confermato' then raise exception 'Punto già confermato dal revisore'; end if;
  else
    if v.fase <> 'revisore' then raise exception 'Tocca al compilatore'; end if;
    if s not in ('da_fare', 'confermato') then raise exception 'Azione non consentita'; end if;
  end if;
  insert into public.pee_revisioni_punto (revisione_id, chiave, stato, nota, aggiornato_da) values (r, k, s, left(coalesce(n, ''), 300), auth.uid())
    on conflict (revisione_id, chiave) do update set stato = excluded.stato, nota = case when excluded.nota <> '' then excluded.nota else public.pee_revisioni_punto.nota end, aggiornato_da = auth.uid(), updated_at = now();
  update public.pee_revisioni set updated_at = now() where id = r;
end $$;
