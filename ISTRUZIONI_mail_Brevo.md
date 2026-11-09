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
