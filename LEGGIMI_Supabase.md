# PEE CNGEI — guida per attivare il cloud (Supabase)

## Cos'è
Una app in **un solo file HTML** (`index.html`), pubblicata su GitHub Pages, che serve a osservare i 24 percorsi PEE
(Unità Lupetti/Esploratori/Rover e Staff).
Senza cloud funziona già: salva nel browser del dispositivo.
Con Supabase aggiungiamo **login, salvataggio automatico "come Google Docs", archivio dei progetti per anno,
cronologia versioni, accesso da qualsiasi dispositivo e condivisione con i colleghi (sola lettura + suggerimenti)**.

Non c'è nessun server da gestire: l'app parla direttamente con Supabase.
La sicurezza è garantita dalle regole **RLS** (Row Level Security) create dallo script SQL:
ogni utente vede e modifica **solo i propri progetti**; un collega invitato può soltanto leggerne uno e scrivere suggerimenti.

## File del pacchetto
| File | A cosa serve |
|---|---|
| `index.html` | L'app completa. Vanno inseriti URL e chiave Supabase (vedi passo 4). |
| `supabase_setup.sql` | Crea le tabelle `pee_archivi`, `pee_versioni`, `pee_membri` (inviti) e `pee_suggerimenti` con le regole di sicurezza. Da eseguire **una volta** (se il database era già stato preparato con una versione precedente, va **rieseguito tutto**: non cancella nulla e aggiorna anche il limite di lunghezza dei suggerimenti). |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | Servono per installare l'app come icona su tablet/PC. Vanno **nella stessa cartella** di `index.html`. |

## Passi da fare (circa 15 minuti)

### 1. Progetto Supabase
- Crea (o riusa) un progetto su https://supabase.com. Il piano gratuito basta.
- Nota: il piano gratuito permette 2 progetti attivi. Se il limite è raggiunto, si può riusare uno esistente:
  le tabelle si chiamano `pee_archivi`, `pee_versioni`, `pee_membri`, `pee_suggerimenti`, quindi non danno conflitti con altre.

### 2. Creare le tabelle
- Menu **SQL Editor → New query**
- Incolla **tutto** il contenuto di `supabase_setup.sql` → **Run**.
- Deve rispondere "Success". Si può rieseguire senza danni (usa `if not exists` / `drop ... if exists`).

### 3. Impostazioni di accesso (Authentication)
- **Authentication → Providers → Email**: deve essere attivo (lo è di default).
- **Authentication → URL Configuration → Site URL**: metti l'indirizzo di GitHub Pages
  (es. `https://NOME.github.io/REPO/`). Serve perché il link di "password dimenticata" e di conferma email torni all'app.
  Aggiungi lo stesso indirizzo anche in **Redirect URLs**.
- **Providers → Email → "Confirm email": lasciarlo ATTIVO.** La condivisione funziona per indirizzo email: il database
  riconosce un collega invitato solo se ha *confermato* la sua email. Se la conferma fosse disattivata, chiunque potrebbe
  registrarsi con l'indirizzo di un invitato e leggerne il progetto. La mail di conferma può finire nello spam.

### 4. Inserire le chiavi nell'app
- **Project Settings → API** (o "API Keys"): copia
  - **Project URL** (tipo `https://abcdefgh.supabase.co`)
  - **anon / publishable key**
- Apri `index.html` con un editor di testo e cerca queste due righe (cerca il testo `SUPABASE_URL`):
  ```js
  const SUPABASE_URL = '';
  const SUPABASE_KEY = '';
  ```
  Incolla tra gli apici URL e chiave. Salva.

> ⚠️ **Usa SOLO la chiave `anon` / `publishable`** (è pubblica per progetto: la sicurezza sta nelle regole RLS).
> **Non usare mai la `service_role` / `secret`**: darebbe accesso totale al database e non deve mai finire in un file pubblicato.

### 5. Pubblicare su GitHub Pages
- Carica nella stessa cartella del repository: `index.html`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`
  (lo `.sql` non serve online, resta per archivio).
- Aspetta 1–2 minuti, poi ricarica la pagina (Ctrl+F5 se vedi ancora la versione vecchia).

### 6. Prova (5 minuti)
1. Apri l'app → tasto **☁** in alto → **Crea account** con un'email di prova.
2. Deve creare da solo il progetto "PEE 2026" e mostrare **"✓ Salvato"**.
3. Entra in una branca, imposta qualche valore, aspetta 2–3 secondi.
4. Apri l'app da un altro browser/dispositivo, fai login: il lavoro deve comparire da solo.
5. Nel menu ☁ → archivio: crea un nuovo progetto, premi il pulsante con l'orologio (Versioni), salva un momento con nome e ripristina una versione.
6. **Condivisione** (servono due account di prova, es. A e B): con A apri ☁ → **Condividi** → scrivi l'email di B → Invita. Esci, entra con B (email confermata): in ☁ compare **Condivisi con me** → Apri. Vedi una barra "Sola lettura", i punteggi sono bloccati e sotto ogni percorso c'è **+ Suggerisci**. Scrivi un suggerimento con il tuo nome. Torna con A: sotto quel percorso compare "1 suggerimento di …" con **Segna come letto**. Poi prova "Togli accesso".
7. Verifica in Supabase → **Table Editor → pee_archivi**: deve esserci una riga per utente.

## Come funziona (per chi deve metterci mano)
- **Salvataggio locale**: `localStorage`, chiave `bussola_pee_v6`. Funziona anche offline / senza account.
- **Cloud**: tabella `pee_archivi` (una riga per progetto: `anno`, `titolo`, `data` JSON con tutto il lavoro).
  `pee_versioni` contiene le copie storiche di ogni progetto.
- **Condivisione**: `pee_membri` (chi è invitato a quale progetto, per email in minuscolo) e `pee_suggerimenti` (testo, nome dell'autore, stato `nuovo`/`letto`, percorso).
  Le regole RLS usano tre funzioni di supporto (`pee_my_email`, `pee_is_owner`, `pee_is_member`, security definer) per evitare ricorsioni.
  L'invitato legge il progetto ma non lo modifica; vede solo i **propri** suggerimenti; il proprietario può cambiare solo lo `stato` (trigger `pee_sugg_solo_stato`).
- **Modalità sola lettura nell'app**: il progetto del collega viene aperto con `sessionStorage['bussola_ro']` e memorizzato in una chiave locale separata (`bussola_pee_ro_v1`), così il lavoro personale di chi guarda non viene mai toccato. "Torna al mio lavoro" ripristina tutto.
- I suggerimenti esistono sia nella modalità Unità sia in Staff. In Staff sono legati al **membro osservato e al percorso** (colonna `percorso` = `S:<nome membro>|<id percorso>`, per questo il limite è 160 caratteri; se un membro viene rinominato, i suoi vecchi suggerimenti restano nel database ma non compaiono più). Non hanno punteggio e, se non ce ne sono, l'area non compare.
- In sola lettura la scheda «auto osservazione» del capo non viene mostrata al collega. Attenzione: è nascosta nell'interfaccia, ma i dati del progetto viaggiano tutti insieme, quindi non è una protezione tecnica.
- **Autosalvataggio**: dopo ogni modifica, con piccolo ritardo (debounce). L'indicatore in alto mostra lo stato.
- **Più dispositivi**: se un altro dispositivo ha una versione più recente e non ci sono modifiche in corso, l'app la carica da sola;
  se ci sono modifiche locali non sincronizzate compare una finestra per scegliere quale tenere.
- **Versioni precedenti (stile Google Docs)**: pulsante con l'orologio in alto, visibile dopo il login. Elenco raggruppato per Oggi / Ieri / Questa settimana / Più indietro. Copia automatica ogni 30 minuti di lavoro: si tengono le ultime 10 più la più recente di ogni giorno per 14 giorni. Le versioni salvate a mano con nome (★) e le copie "Prima del ripristino": le ultime 25. Soglie in `dbVersionPrune` e `30*60*1000` in `clPush`.
- **Login**: si fa una volta sola per dispositivo, la sessione resta attiva.
- **Aggiornare l'app in futuro**: i dati salvati hanno un numero di versione (`v:1`); nuove osservazioni o campi si aggiungono
  senza cancellare i dati esistenti. Basta sostituire `index.html` su GitHub (rimettendo URL e chiave).
- **Libreria usata**: `@supabase/supabase-js@2` da jsDelivr. Esportazioni con ExcelJS e docx (caricate solo quando servono).

## Colori delle branche (interfaccia)
Giallo `#f0e603` (L), verde `#25734e` (E), rosso `#dc2b26` (R), blu 289 C `#0c2340` (Staff).
Definiti nel CSS `body[data-theme="L|E|R|S"]`.

## Problemi comuni
| Sintomo | Causa probabile |
|---|---|
| Il tasto ☁ non appare / "cloud non configurato" | URL o chiave vuoti in `index.html` |
| "Invalid API key" | Chiave copiata male, o chiave di un altro progetto |
| Errore su `pee_archivi` "relation does not exist" | Lo script SQL non è stato eseguito nel progetto giusto |
| Il link di reset password porta a una pagina sbagliata | Site URL / Redirect URLs non impostati (passo 3) |
| Non arriva la mail di conferma | Controllare lo spam (non disattivare "Confirm email" se si usa la condivisione) |
| "Il database non è aggiornato" invitando o suggerendo | Va rieseguito `supabase_setup.sql` per intero |
| Il collega non vede «Condivisi con me» | Deve usare **la stessa email** dell'invito e averla confermata |
| Si vede ancora la versione vecchia | Cache del browser: Ctrl+F5 |
