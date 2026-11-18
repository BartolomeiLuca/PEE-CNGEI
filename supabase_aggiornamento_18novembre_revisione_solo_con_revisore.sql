-- 18/11/2026 · La «revisione» (turno del revisore) si apre solo quando c'è davvero un revisore.
-- Prima: ogni giro congelato apriva una revisione, anche senza destinatari o con la sola mail, e il progetto restava in attesa di un revisore che non c'era.
-- Ora: congelare un giro non apre nulla; la revisione nasce quando si condivide un giro in app con un revisore (Tutor / ICdF). Nessun giro e nessun dato viene toccato.
-- ESEGUIRE IN DUE PARTI (A, poi B), come gli altri aggiornamenti.

-- ═══ PARTE A · le due funzioni ═══
create or replace function public.pee_rev_dopo_giro() returns trigger
language plpgsql security definer set search_path = public as $body$
begin
  perform pg_advisory_xact_lock(hashtext('pee_rev:' || new.archivio_id::text));
  update public.pee_revisioni set ultimo_giro_id = new.id, updated_at = now() where archivio_id = new.archivio_id and stato = 'aperta';
  return new;
end $body$;

create or replace function public.pee_rev_dest_prima() returns trigger
language plpgsql security definer set search_path = public as $body$
declare v public.pee_revisioni; g public.pee_giri;
begin
  if new.ruolo <> 'revisore' then return new; end if;
  select * into g from public.pee_giri where id = new.giro_id;
  if g.id is null then return new; end if;
  perform pg_advisory_xact_lock(hashtext('pee_rev:' || g.archivio_id::text));
  select * into v from public.pee_revisioni where archivio_id = g.archivio_id and stato = 'aperta';
  if v.id is null then
    insert into public.pee_revisioni (archivio_id, owner_id, revisore_email, primo_giro_id, ultimo_giro_id) values (g.archivio_id, g.owner_id, new.email, g.id, g.id);
  elsif v.revisore_email is null then
    update public.pee_revisioni set revisore_email = new.email, ultimo_giro_id = g.id, updated_at = now() where id = v.id;
  elsif v.revisore_email <> new.email and auth.uid() is not null then
    raise exception 'Il revisore di questa revisione è già stato scelto (%): per cambiarlo bisogna chiuderla', v.revisore_email;
  end if;
  return new;
end $body$;

-- ═══ PARTE B · pulizia: le revisioni rimaste aperte senza nessun revisore (nate da giri solo congelati) ═══
-- Non hanno punti né commenti (senza revisore nessuno può scriverne): si tolgono; i giri restano tutti.
delete from public.pee_revisioni v where v.stato = 'aperta' and v.revisore_email is null
  and not exists (select 1 from public.pee_revisioni_punto p where p.revisione_id = v.id);
