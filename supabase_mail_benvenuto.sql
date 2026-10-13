-- PEE CNGEI — mail di benvenuto al primo accesso (spedita da Brevo)
-- Quando qualcuno crea l'account, il database chiede a Brevo di mandargli una mail con:
-- l'email con cui entrare, il link all'app, «Password dimenticata?» e gli eventuali inviti già ricevuti.
-- La password NON c'è: Supabase la conserva cifrata e non la conosce.
--
-- PRIMA (una volta sola), in Supabase › SQL Editor, esegui queste due righe con i TUOI dati
-- (la chiave API di Brevo e il mittente verificato in Brevo), poi esegui tutto il resto dello script:
--
--   select vault.create_secret('xkeysib-LA-TUA-CHIAVE', 'brevo_api_key');
--   select vault.create_secret('no-reply@iltuodominio.it', 'brevo_mittente');
--
-- Per cambiarli in seguito: select vault.update_secret((select id from vault.secrets where name = 'brevo_api_key'), 'nuova-chiave');
-- Il mittente non deve essere una casella vera (basta un indirizzo del dominio verificato in Brevo):
-- se qualcuno risponde, la risposta arriva a luca.bartolomei@cngei.it.
-- Si può rieseguire senza danni. Se Brevo non risponde, l'account si crea lo stesso (la mail semplicemente non parte).

create extension if not exists pg_net with schema extensions;

-- testo sicuro dentro l'HTML
create or replace function public.pee_html(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;')
$$;

create or replace function public.pee_mail_benvenuto() returns trigger
language plpgsql security definer set search_path = public, extensions, vault as $$
declare
  chiave   text;
  mittente text;
  app      text := 'https://bartolomeiluca.github.io/PEE-CNGEI/';
  nome     text := nullif(trim(coalesce(new.raw_user_meta_data->>'nome', '')), '');
  inviti   text := '';
  corpo    text;
  r        record;
begin
  begin
    select decrypted_secret into chiave   from vault.decrypted_secrets where name = 'brevo_api_key';
    select decrypted_secret into mittente from vault.decrypted_secrets where name = 'brevo_mittente';
    if chiave is null or mittente is null or new.email is null then return new; end if;

    -- progetti a cui la persona era già stata invitata prima di creare l'account
    for r in
      select a.anno, a.titolo, m.owner_email, m.ruolo
      from public.pee_membri m join public.pee_archivi a on a.id = m.archivio_id
      where m.email = lower(new.email)
      order by m.created_at limit 5
    loop
      inviti := inviti || '<li><b>' || pee_html(r.anno::text || ' · ' || r.titolo) || '</b>'
        || coalesce(', da ' || pee_html(nullif(regexp_replace(r.owner_email, '\s*\(.*\)\s*$', ''), '')), '')
        || ' — come ' || case r.ruolo when 'cotitolare' then 'co-titolare' when 'collaboratore' then 'collaboratore' else 'lettore' end || '</li>';
    end loop;

    corpo :=
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">'
      || '<h2 style="color:#1b5e42;margin:0 0 12px">Ciao' || coalesce(' ' || pee_html(split_part(nome, ' ', 1)), '') || '!</h2>'
      || '<p>Il tuo account su <b>PEE CNGEI</b> è pronto. Ti accompagna nella Scheda di Programmazione Educativa Esperienziale e nell’organizzazione delle attività, da solo o con il tuo staff.</p>'
      || '<p style="background:#f1f8f4;border:1px solid #cfe6d8;border-radius:8px;padding:10px 14px;margin:14px 0">'
      || 'Per entrare usa sempre questa email: <b>' || pee_html(new.email) || '</b><br>e la password che hai scelto quando hai creato l’account.</p>'
      || case when inviti <> '' then '<p><b>Ti aspettano già questi progetti condivisi con te:</b></p><ul style="padding-left:18px;margin:0 0 12px">' || inviti
           || '</ul><p>Li trovi in <b>Archivio › Condivisi con me</b>.</p>' else '' end
      || '<p style="margin:18px 0"><a href="' || app || '" style="background:#1b5e42;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Apri PEE CNGEI</a></p>'
      || '<p>Se dimentichi la password, nella schermata di accesso premi <b>«Password dimenticata?»</b>: ti arriva un link per sceglierne una nuova.</p>'
      || '<p>Dubbi o idee? Dentro l’app c’è <b>Suggerimenti?</b>: il messaggio arriva direttamente a chi la cura.</p>'
      || '<p style="color:#777;font-size:12px;margin-top:20px">Hai ricevuto questa mail perché è stato creato un account PEE CNGEI con questo indirizzo. Se non sei stato tu, ignorala o scrivi a luca.bartolomei@cngei.it.</p>'
      || '</div>';

    perform net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', chiave, 'Content-Type', 'application/json', 'accept', 'application/json'),
      body    := jsonb_build_object(
        'sender',      jsonb_build_object('name', 'PEE CNGEI', 'email', mittente),
        'replyTo',     jsonb_build_object('email', 'luca.bartolomei@cngei.it', 'name', 'PEE CNGEI'),
        'to',          jsonb_build_array(jsonb_build_object('email', new.email, 'name', coalesce(nome, new.email))),
        'subject',     'Benvenuto su PEE CNGEI: il tuo account è pronto',
        'htmlContent', corpo),
      timeout_milliseconds := 5000);
  exception when others then
    -- mai bloccare la creazione dell'account per un problema della mail
    raise warning 'pee_mail_benvenuto: %', sqlerrm;
  end;
  return new;
end $$;

revoke all on function public.pee_mail_benvenuto() from public, anon, authenticated;

drop trigger if exists pee_mail_benvenuto on auth.users;
create trigger pee_mail_benvenuto after insert on auth.users
  for each row execute function public.pee_mail_benvenuto();

-- Per controllare gli invii (le ultime risposte di Brevo; 201 = mail accettata):
--   select id, status_code, content, created from net._http_response order by created desc limit 5;
