-- 25/11/2026 · Il nome sulle carte segue il nome che la persona ha nel profilo, finché il giro è aperto.
-- Prima il nome veniva fissato alla prima consegna e non cambiava più. Ora, quando chi ha scritto la carta
-- la salva di nuovo (e il giro è ancora aperto), il nome si aggiorna. Le carte già consegnate restano com'erano
-- finché la persona non le salva di nuovo; il secondo comando in fondo le allinea subito.
-- Si può rieseguire senza danni.

create or replace function public.pee_piani_contributi_prima() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare gp uuid; nn text;
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
    new.giro_id := old.giro_id; new.autore_id := old.autore_id; new.tipo := old.tipo;
    nn := '';
    if auth.uid() is null then nn := new.autore_nome;               -- lanciato dall'editor SQL (non da una persona): si lascia com'è
    elsif auth.uid() = old.autore_id then nn := public.pee_mio_nome(); end if;
    new.autore_nome := case when nn <> '' then nn else old.autore_nome end;
  end if;
  if new.consegnato then
    if tg_op = 'UPDATE' and old.consegnato then new.consegnato_il := old.consegnato_il;
    else new.consegnato_il := now(); end if;
  else
    new.consegnato_il := null;
  end if;
  return new;
end $$;

-- allinea subito i nomi sulle carte dei giri ancora aperti
update public.pee_piani_contributi c
   set autore_nome = left(trim(u.raw_user_meta_data->>'nome'), 120)
  from auth.users u, public.pee_piani_giri g
 where u.id = c.autore_id and g.id = c.giro_id and g.stato = 'aperto'
   and coalesce(trim(u.raw_user_meta_data->>'nome'), '') <> ''
   and c.autore_nome is distinct from left(trim(u.raw_user_meta_data->>'nome'), 120);
