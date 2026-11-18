-- PEE CNGEI — mail di avviso della revisione: nome di chi rivede al posto dell'indirizzo email; link a pee-app.it (18/11/2026)
-- Sostituisce la funzione del 13/11 (stessa logica, stessi destinatari). Rieseguibile.
-- Si può rieseguire senza danni. Non tocca i dati. Se Brevo non risponde, il passaggio di turno avviene lo stesso.
-- Richiede i segreti brevo_api_key e brevo_mittente nel vault (gli stessi delle altre mail dell'app).
--  · «Rimanda al compilatore»  → mail a chi ha scritto il progetto: ci sono punti da sistemare
--  · «Approva»                 → mail a chi ha scritto il progetto: revisione approvata
--  · «Ho finito, può rileggere» → già coperto dalla mail «ti ha inviato un Progetto Personale» (nuova copia al revisore)
create or replace function public.pee_mail_revisione() returns trigger
language plpgsql security definer set search_path = public, extensions, vault, auth as $fn$
declare
  chiave text; mittente text; dest text; chi text; ogg text; msg text; corpo text; npt int;
begin
  begin
    if new.stato = 'chiusa' and old.stato is distinct from 'chiusa' and new.esito = 'approvata' then
      msg := 'ha <b>approvato</b> il tuo Progetto Personale: la revisione è chiusa.' || coalesce('<br>Nota: ' || pee_html(nullif(new.nota_chiusura, '')), '');
      ogg := 'PEE CNGEI: il tuo Progetto Personale è stato approvato';
    elsif new.stato = 'aperta' and new.fase = 'compilatore' and old.fase is distinct from 'compilatore' then
      select count(*) into npt from public.pee_revisioni_punto where revisione_id = new.id and stato in ('da_fare', 'attesa');
      msg := 'ti ha rimandato il progetto con <b>' || npt || ' ' || case when npt = 1 then 'punto' else 'punti' end || '</b> da sistemare o a cui rispondere.';
      ogg := 'PEE CNGEI: ci sono punti da sistemare nel tuo Progetto Personale';
    else
      return new;
    end if;
    select decrypted_secret into chiave   from vault.decrypted_secrets where name = 'brevo_api_key';
    select decrypted_secret into mittente from vault.decrypted_secrets where name = 'brevo_mittente';
    if chiave is null or mittente is null then return new; end if;
    select u.email into dest from auth.users u where u.id = new.owner_id;
    if dest is null then return new; end if;
    -- il nome che chi rivede ha scritto nel suo profilo; se manca, l'indirizzo email; se manca anche quello, una frase neutra
    select nullif(trim(u.raw_user_meta_data->>'nome'), '') into chi from auth.users u where lower(u.email) = lower(new.revisore_email) limit 1;
    chi := coalesce(chi, nullif(trim(new.revisore_email), ''), 'Chi rivede il tuo progetto');
    corpo :=
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">'
      || '<h2 style="color:#1b5e42;margin:0 0 12px">Aggiornamento sulla revisione</h2>'
      || '<p><b>' || pee_html(chi) || '</b> ' || msg || '</p>'
      || '<p style="margin:18px 0"><a href="https://pee-app.it/#progetti" style="background:#1b5e42;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Apri PEE CNGEI</a></p>'
      || '<p style="color:#777;font-size:12px;margin-top:20px">Questa mail non contiene il progetto, solo l’avviso.</p></div>';
    perform net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', chiave, 'Content-Type', 'application/json', 'accept', 'application/json'),
      body    := jsonb_build_object('sender', jsonb_build_object('name', 'PEE CNGEI', 'email', mittente),
        'to', jsonb_build_array(jsonb_build_object('email', dest)), 'subject', ogg, 'htmlContent', corpo),
      timeout_milliseconds := 5000);
  exception when others then
    raise warning 'pee_mail_revisione: %', sqlerrm;
  end;
  return new;
end
$fn$;
drop trigger if exists pee_mail_revisione on public.pee_revisioni;
create trigger pee_mail_revisione after update on public.pee_revisioni for each row execute function public.pee_mail_revisione();

-- mail «ti ha inviato un Progetto Personale»: identica a prima, cambia solo il link (ora pee-app.it)
create or replace function public.pee_mail_giro() returns trigger
language plpgsql security definer set search_path = public, extensions, vault, auth as $fn$
declare
  chiave text; mittente text; g record; chi text; corpo text; ogg text; rev boolean := (new.ruolo = 'revisore');
begin
  begin
    select decrypted_secret into chiave   from vault.decrypted_secrets where name = 'brevo_api_key';
    select decrypted_secret into mittente from vault.decrypted_secrets where name = 'brevo_mittente';
    if chiave is null or mittente is null then return new; end if;
    select n, meta into g from public.pee_giri where id = new.giro_id;
    chi := coalesce(nullif(trim(g.meta->>'nome'), ''), 'Una persona');
    ogg := case when rev then 'PEE CNGEI: ' || left(chi, 60) || ' ti ha inviato un Progetto Personale da rivedere'
                         else 'PEE CNGEI: ' || left(chi, 60) || ' ti ha inviato in copia un Progetto Personale' end;
    corpo :=
      '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">'
      || '<h2 style="color:#1b5e42;margin:0 0 12px">' || case when rev then 'Un Progetto Personale da rivedere' else 'Un Progetto Personale in copia' end || '</h2>'
      || '<p><b>' || pee_html(chi) || '</b> ti ha inviato in PEE CNGEI il <b>Giro ' || coalesce(g.n, 0) || '</b>'
      || coalesce(' del progetto «' || pee_html(nullif(g.meta->>'titolo', '')) || '»', '') || '.</p>'
      || '<p>' || case when rev then 'Lo trovi nella pagina <b>Progetti</b>, sotto «Giri da rivedere»: puoi leggerlo e lasciare le tue osservazioni.'
                       else 'Lo trovi nella pagina <b>Progetti</b>, sotto «Giri da rivedere»: puoi leggerlo e lasciare dei suggerimenti.' end || '</p>'
      || '<p style="margin:18px 0"><a href="https://pee-app.it/#progetti" style="background:#1b5e42;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:bold">Apri PEE CNGEI</a></p>'
      || '<p style="color:#555;font-size:13px">Se non hai ancora un account, creane uno con questo stesso indirizzo email (' || pee_html(new.email) || '): vedrai il giro appena entri.</p>'
      || '<p style="color:#777;font-size:12px;margin-top:20px">Questa mail non contiene il progetto, solo l’avviso.</p></div>';
    perform net.http_post(
      url     := 'https://api.brevo.com/v3/smtp/email',
      headers := jsonb_build_object('api-key', chiave, 'Content-Type', 'application/json', 'accept', 'application/json'),
      body    := jsonb_build_object('sender', jsonb_build_object('name', 'PEE CNGEI', 'email', mittente),
        'to', jsonb_build_array(jsonb_build_object('email', new.email)), 'subject', ogg, 'htmlContent', corpo),
      timeout_milliseconds := 5000);
  exception when others then
    raise warning 'pee_mail_giro: %', sqlerrm;
  end;
  return new;
end
$fn$;
