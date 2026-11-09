-- PEE CNGEI — avviso via mail quando arriva una proposta per l'archivio nazionale (9 novembre 2026)
-- A ogni nuova proposta (tabella pee_archivio_nazionale, stato «in_attesa») il database chiede a Brevo
-- di mandare una mail al referente dell'archivio: luca.bartolomei@cngei.it.
-- Usa la stessa chiave e lo stesso mittente della mail di benvenuto (vault: brevo_api_key, brevo_mittente):
-- se hai già eseguito supabase_mail_benvenuto.sql non serve altro.
-- Da eseguire UNA volta: Supabase > SQL Editor > New query > incolla tutto > Run. Si può rieseguire senza danni.
-- Non tocca né cancella nessun dato. Se Brevo non risponde, la proposta si salva lo stesso (la mail semplicemente non parte).

create extension if not exists pg_net with schema extensions;

create or replace function public.pee_html(t text) returns text
language sql immutable as $fn$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$fn$;

create or replace function public.pee_mail_proposta() returns trigger
language plpgsql security definer set search_path = public, extensions, vault, auth as $fn$
declare
  chiave   text;
  mittente text;
  dest     text := 'luca.bartolomei@cngei.it';
  autore   text;
  corpo    text;
begin
  begin
    select decrypted_secret into chiave   from vault.decrypted_secrets where name = 'brevo_api_key';
    select decrypted_secret into mittente from vault.decrypted_secrets where name = 'brevo_mittente';
    if chiave is null or mittente is null then return new; end if;
    select coalesce(nullif(trim(u.raw_user_meta_data->>'nome'), '') || ' (' || u.email || ')', u.email)
      into autore from auth.users u where u.id = new.autore_id;

    corpo :=
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">'
      || '<h2 style="color:#1b5e42;margin:0 0 12px">Nuova proposta per l’archivio nazionale</h2>'
      || '<p><b>' || pee_html(new.titolo) || '</b></p>'
      || '<p style="background:#f1f8f4;border:1px solid #cfe6d8;border-radius:8px;padding:10px 14px;margin:14px 0">'
      || 'Proposta da: ' || pee_html(coalesce(autore, 'una persona registrata')) || '<br>'
      || coalesce('Branca: ' || pee_html(nullif(new.branca, '')) || '<br>', '')
      || coalesce('Percorso: ' || pee_html(nullif(new.percorso_nome, '')) || '<br>', '')
      || coalesce('Ambito: ' || pee_html(nullif(new.ambito, '')) || '<br>', '')
      || 'Arrivata il ' || to_char(new.created_at at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI') || '</p>'
      || '<p>La trovi in PEE CNGEI, nell’archivio nazionale, fra le proposte <b>in attesa</b>: lì puoi leggerla, approvarla o rifiutarla.</p>'
      || '<p style="margin:18px 0"><a href="https://pee-app.it/" style="background:#1b5e42;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Apri PEE CNGEI</a></p>'
      || '<p style="color:#777;font-size:12px;margin-top:20px">Ricevi questa mail perché sei il referente dell’archivio nazionale di PEE CNGEI.</p>'
      || '</div>';

    perform net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', chiave, 'Content-Type', 'application/json', 'accept', 'application/json'),
      body    := jsonb_build_object(
        'sender',      jsonb_build_object('name', 'PEE CNGEI', 'email', mittente),
        'to',          jsonb_build_array(jsonb_build_object('email', dest, 'name', 'Archivio nazionale PEE')),
        'subject',     'PEE CNGEI: nuova proposta per l’archivio — ' || left(new.titolo, 80),
        'htmlContent', corpo),
      timeout_milliseconds := 5000);
  exception when others then
    raise warning 'pee_mail_proposta: %', sqlerrm;
  end;
  return new;
end
$fn$;

drop trigger if exists pee_mail_proposta on public.pee_archivio_nazionale;
create trigger pee_mail_proposta after insert on public.pee_archivio_nazionale
  for each row when (new.stato = 'in_attesa') execute function public.pee_mail_proposta();
