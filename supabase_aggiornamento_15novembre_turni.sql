-- 15 novembre 2026 · Revisione a turni
-- 1) «Ho finito, può rileggere»: una domanda ancora aperta (stato «attesa») non blocca più l'invio; restano bloccanti solo i punti «da fare».
-- 2) I punti si cambiano solo nel proprio turno: il revisore solo quando tocca a lui, il compilatore solo quando tocca a lui.
-- Rieseguibile; non tocca nessun dato esistente.
create or replace function public.pee_rev_ho_finito(r uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.pee_rev_ruolo(r) is distinct from 'titolare' then raise exception 'Solo chi ha scritto il progetto'; end if;
  if not exists (select 1 from public.pee_revisioni where id = r and stato = 'aperta' and fase = 'compilatore') then raise exception 'Non è il tuo turno'; end if;
  if exists (select 1 from public.pee_revisioni_punto where revisione_id = r and stato = 'da_fare') then raise exception 'Ci sono ancora punti da fare'; end if;
  update public.pee_revisioni set fase = 'revisore', updated_at = now() where id = r;
end $$;

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
    if cur is null and s <> 'da_fare' then raise exception 'Punto inesistente'; end if;
  end if;
  insert into public.pee_revisioni_punto (revisione_id, chiave, stato, nota, aggiornato_da) values (r, k, s, left(coalesce(n, ''), 300), auth.uid())
    on conflict (revisione_id, chiave) do update set stato = excluded.stato, nota = case when excluded.nota <> '' then excluded.nota else public.pee_revisioni_punto.nota end, aggiornato_da = auth.uid(), updated_at = now();
  update public.pee_revisioni set updated_at = now() where id = r;
end $$;
