-- PEE CNGEI — aggiornamento: ruoli dei colleghi invitati (lettore / co-titolare / collaboratore)
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run.
-- Si può rieseguire senza danni. Non cancella né modifica i dati esistenti:
-- chi è già stato invitato resta "lettore" (sola lettura + suggerimenti), come oggi.

-- 1. due colonne nuove negli inviti
alter table public.pee_membri add column if not exists ruolo    text not null default 'lettore';
alter table public.pee_membri add column if not exists visto_il timestamptz;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'pee_membri_ruolo_check') then
    alter table public.pee_membri add constraint pee_membri_ruolo_check
      check (ruolo in ('lettore','cotitolare','collaboratore'));
  end if;
end $$;

-- gli inviti già aperti prima di questo aggiornamento non devono comparire come "nuovi"
update public.pee_membri set visto_il = now() where visto_il is null and created_at < now() - interval '1 day';

-- 2. chi può modificare un progetto oltre a chi lo ha creato
create or replace function public.pee_can_edit(a uuid) returns boolean
language sql stable security definer set search_path = public, auth as $$
  select exists (select 1 from public.pee_membri m
                 where m.archivio_id = a and m.email = public.pee_my_email()
                   and m.ruolo in ('cotitolare','collaboratore'))
$$;

drop policy if exists "pee_archivi: modificano co-titolari e collaboratori" on public.pee_archivi;
create policy "pee_archivi: modificano co-titolari e collaboratori" on public.pee_archivi
  for update to authenticated
  using (public.pee_can_edit(id))
  with check (public.pee_can_edit(id));

-- chi non è il proprietario non può cambiare proprietario, anno o titolo
create or replace function public.pee_archivi_guard() returns trigger
language plpgsql as $$
begin
  if old.user_id is distinct from auth.uid() then
    if new.user_id is distinct from old.user_id
       or new.anno   is distinct from old.anno
       or new.titolo is distinct from old.titolo then
      raise exception 'Solo chi ha creato il progetto può cambiarne anno, titolo o proprietario';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists pee_archivi_guard on public.pee_archivi;
create trigger pee_archivi_guard before update on public.pee_archivi
  for each row execute function public.pee_archivi_guard();

-- 3. versioni precedenti: anche co-titolari e collaboratori le vedono e le salvano
drop policy if exists "pee_versioni: co-autori leggono" on public.pee_versioni;
create policy "pee_versioni: co-autori leggono" on public.pee_versioni
  for select to authenticated
  using (public.pee_can_edit(archivio_id));

drop policy if exists "pee_versioni: co-autori salvano" on public.pee_versioni;
create policy "pee_versioni: co-autori salvano" on public.pee_versioni
  for insert to authenticated
  with check (user_id = auth.uid() and public.pee_can_edit(archivio_id));

-- 4. "ho visto l'invito": l'invitato lo segna, senza poter cambiare il proprio ruolo
create or replace function public.pee_segna_visto(m uuid) returns void
language sql security definer set search_path = public, auth as $$
  update public.pee_membri set visto_il = now()
  where id = m and email = public.pee_my_email()
$$;
revoke all on function public.pee_segna_visto(uuid) from public;
grant execute on function public.pee_segna_visto(uuid) to authenticated;
