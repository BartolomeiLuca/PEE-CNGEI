# PEE CNGEI — mail: cosa fare tu (9/11/2026)

## 1. Avviso per le proposte all'archivio nazionale (punto 56)
1. Supabase → SQL Editor → New query.
2. Incolla tutto il file `supabase_mail_archivio.sql` → Run.
3. Prova: dall'anteprima proponi un'attività all'archivio. Entro un minuto ti arriva la mail su luca.bartolomei@cngei.it.

Non tocca i dati. Se Brevo non risponde, la proposta si salva lo stesso.

## 2. Mail che non finiscono nello spam (punto 43)
Serve un mittente del tuo dominio (es. `noreply@pee-app.it`), autenticato su Brevo.

1. **Brevo** → Impostazioni → *Mittenti, domini e IP* → *Domini* → **Aggiungi un dominio** → `pee-app.it`.
2. Brevo ti mostra 3–4 record DNS da copiare:
   - un **TXT** `brevo-code:…` (verifica);
   - **DKIM**: uno o due record (CNAME o TXT, es. `brevo1._domainkey`);
   - **DMARC**: TXT su `_dmarc` → valore consigliato per iniziare: `v=DMARC1; p=none; rua=mailto:luca.bartolomei@cngei.it`.
3. **Pannello DNS del dominio** (dove hai comprato pee-app.it) → aggiungi quei record *esattamente* come li dà Brevo.
   - Se esiste già un TXT SPF (`v=spf1 …`), non crearne un secondo: aggiungi `include:spf.brevo.com` dentro quello esistente.
   - Il sito (record A/CNAME di GitHub Pages) non va toccato.
4. Torna su Brevo → **Autentica**. La propagazione può richiedere fino a 24–48 ore.
5. Brevo → *Mittenti* → **Aggiungi mittente** `noreply@pee-app.it` (nome: PEE CNGEI).
6. Supabase → SQL Editor, aggiorna il mittente usato da tutte le mail:
   ```sql
   select vault.update_secret(
     (select id from vault.secrets where name = 'brevo_mittente'),
     'noreply@pee-app.it');
   ```
7. Prova: registra un account di test e controlla che la mail di benvenuto arrivi in posta in arrivo (non nello spam).

Dopo qualche settimana senza problemi puoi passare il DMARC a `p=quarantine`.

## 3. Far partire tutte le mail dell'app (13/11/2026, corretto il 14/11) — da fare una volta
Le mail (benvenuto, proposta all'archivio, giro inviato, «Rimanda», «Approva») partono solo se nel vault di Supabase ci sono `brevo_api_key` e `brevo_mittente`. Se mancano, l'app funziona lo stesso ma non spedisce nulla.

**Il mittente è `noreply@pee-app.it`**: su Brevo è già *Verificato*, con firma DKIM `pee-app.it` e DMARC configurato (punto 2 già fatto). **Non usare `luca.bartolomei@cngei.it`**: Brevo lo mostra con DKIM «Predefinito» e l'avviso dei requisiti Google/Yahoo/Microsoft, quindi le mail rischiano di essere rifiutate o finire nello spam. Non serve aggiungere nessun nuovo mittente.

1. **Controlla cosa c'è già nel vault.** Supabase → SQL Editor → New query:
   ```sql
   select name, left(decrypted_secret, 8) as inizio from vault.decrypted_secrets where name in ('brevo_api_key','brevo_mittente');
   ```
   - `brevo_mittente` deve valere `noreply@pee-app.it` (la query ne mostra solo l'inizio: `noreply@`). Se manca o è diverso → passo 3.
   - `brevo_api_key` deve iniziare con `xkeysib-`. Se manca → passo 2.
2. **Chiave API (solo se manca).** Brevo → in alto a destra il tuo nome → **SMTP e API** → scheda **Chiavi API** → **Genera una nuova chiave API** (nome: `PEE`) → copiala (inizia con `xkeysib-`, si vede una volta sola). Poi in Supabase:
   ```sql
   select vault.create_secret('xkeysib-LA-TUA-CHIAVE', 'brevo_api_key');
   ```
   Se dice che esiste già: `select vault.update_secret((select id from vault.secrets where name='brevo_api_key'), 'xkeysib-…');`
3. **Mittente (solo se manca o è diverso):**
   ```sql
   select vault.create_secret('noreply@pee-app.it', 'brevo_mittente');
   ```
   Se esiste già con un altro valore:
   ```sql
   select vault.update_secret((select id from vault.secrets where name='brevo_mittente'), 'noreply@pee-app.it');
   ```
4. Nuova query: incolla tutto `supabase_aggiornamento_13novembre_mail_revisione.sql` → Run (aggiunge le mail di «Rimanda» e «Approva»).
5. Prova: dall'anteprima crea un account di prova, invia un giro a un tuo indirizzo → la mail arriva entro un minuto. Se non arriva, in SQL Editor:
   ```sql
   select id, status_code, content::text from net._http_response order by id desc limit 5;
   ```
   `201` = accettata da Brevo; `401` = chiave sbagliata; `400` con «sender» = mittente non verificato o scritto male.
