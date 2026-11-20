# Test automatici di PEE CNGEI

Banco di prova con un finto Supabase in memoria (più persone, ruoli, tempo reale): non tocca il database vero.

    mkdir -p /home/claude/work && cp test/* /home/claude/work/ && cd /home/claude/work
    npm i playwright@1.56.0 && PLAYWRIGHT_BROWSERS_PATH=/home/claude/pw npx playwright install webkit firefox
    (cd libs && npm init -y && npm i docx@8.5.0 exceljs@4.4.0 jszip@3.10.1 jspdf@2.5.1)   # dentro /home/claude/work/libs
    export PLAYWRIGHT_BROWSERS_PATH=/home/claude/pw   # con chromium-1194 collegato da /opt/pw-browsers

- `node t_roles.mjs chromium|webkit|firefox` — titolare, collaboratore, lettrice, co-titolare (61 controlli)
- `node t_misc.mjs <motore>` — account, «Chi ha osservato», materiali, testi, pagina ferma su Safari
- `node t_flow.mjs <profilo>` — giro completo con Word ed Excel (safari-mac, iphone, iphone-se, ipad, ipad-land, firefox-win, firefox-small, chrome-win, edge-win, android, android-small, tablet-android)
- `node t_noacc.mjs <motore>` — senza account e modalità staff

`SITE=/percorso` prova un'altra copia del sito (predefinita: la cartella del repo).

Giro completo consigliato (i processi in background vengono interrotti: lanciare in primo piano, gruppi da max 10 minuti):

    ./grp.sh chromium t_roles t_misc t_staff t_login t_calm t_noacc t_switch t_mail t_pw
    ./grp.sh chromium t_cot t_pri t_link t_json t_pj t_loop t_mvcol t_vidfaq t_perm t_arch t_upd t_num t_fasce t_compat t_sv
    (poi webkit e firefox) e t_flow sui 12 profili.

- t_upd: aggiornamento automatico (grp.sh prepara la copia con APP_BUILD='b1'). Tenere APP_BUILD='dev' nel repo mentre si prova.
- t_num: Numeri dell'Unità. t_fasce: Branco e Compagnia. t_compat: dati salvati con la versione del 14 ottobre (serve /tmp/site_leg/index.html = git show 3de992f:index.html).
- t_sv: domande di feedback (SV=1; negli altri test sono spente dal harness).
- t_json e t_arch stampano dati diagnostici senza riepilogo: va bene se non ci sono ✗.

Test aggiunti il 19 ottobre (correzioni della sezione B):
- t_pos (1-3: riapertura dove si era rimasti, archivio da 1.1, pagina dall'alto), t_ax (4-6: distanza, rientro, quota con la parte dei capi),
  t_circ (7-8: contatti e firma, intestazione semplice, PDF; usa LibreOffice e pdftotext se ci sono), t_grow (10), t_move (11, anche con due persone),
  t_dup (12), t_spell (9 e 13), t_num aggiornato (14 e 17), t_live (15), t_links (16).
    ./grp.sh chromium t_pos t_ax t_circ t_grow t_move t_dup t_spell t_live t_links

Uscite e campi (anteprima del 20 ottobre, disegno 4): solo in `anteprima/index.html`, il sito principale non cambia.
- t_usc (64 controlli): nome dell'Unità nella 1.1, riquadro «Hai un'uscita o un campo?» e avvisi nella Sezione 3, nuova uscita con date e tipo,
  schema di giornata, tavolozza, sposta su/giù e trascinamento, ora fissa, apri/chiudi tutti, time table, attività della Sezione 3 (stessa attività),
  campi dei blocchi, materiali e spesa, quota con scenari e contributo, circolare, scheda Pasti (menù, ingredienti, copia, Excel), obiettivi e
  Indicatori dalla programmazione e «Porta nella programmazione», stampe, scheda Campo, archivio, ricarica, due persone, «Per te», lettrice,
  blocchi salvati con la prima anteprima, versione principale che apre e salva senza perdere le uscite.
  Per provare l'anteprima: `SITE=` una cartella con l'anteprima come index.html (con circolare/, video/, favicon) e `grp2.sh` in /home/claude/work.
- t_ax: su Firefox aspetta il messaggio dei km (il ricalcolo automatico può arrivare subito dopo il clic).

22 ottobre 2026 (uscite, Cerca, archivio nazionale e 30 video passati sul sito principale):
- t_new (28 controlli): link preciso di Cerca (sotto le barre fisse), attività delle uscite in Cerca e nell'archivio, «Proponi» nei momenti, liberatoria, scalette spostabili, 30 video, salto in sospeso dopo l'apertura di un altro progetto.
- t_vidfaq aggiornato ai 30 video. t_usc: «Sposta o duplica» va aperto prima. t_staff: il controllo «Priorità e Valutazione nascoste nello staff» è vecchio e fallisce anche prima (lo staff ora ha anche Uscite).
- Non lanciare due gruppi di test insieme: usano la stessa porta 8080.

## 22 ottobre — collaudo definitivo (t_coll.mjs)
`node t_coll.mjs <motore> [profili]`: titolare, co-titolare, collaboratrice, lettore, amministratore archivio ed estranea × 8 profili di dispositivo; scalette (tocco vero sulle frecce), Cerca/Apri, Proponi, uscite, archivio nazionale con regole emulate (harness.mjs: tabella pee_archivio_nazionale), salto fra progetti, Word. Lanciare un motore alla volta (porta 8080).

## 22 ottobre sera — campi a riga singola che si allungano
I campi `<input type=text>` diventano `<textarea data-conv>` (stessa grafica, vanno a capo): nei test usare `:is(input,textarea)` o `textarea:not([data-conv])` per i campi lunghi. audit_grow.mjs (in work) controlla che ogni campo cresca.

Test aggiunti il 24 ottobre (riscrittura di uscite, cassa, testo formattato):
- t_loss (protezione da salvataggi molto più scarni), t_nac (promemoria «non sei collegato/a»), t_nl (a capo nel Word), t_grow2 (campi che restano aperti), t_ret (ritorno in un altro giorno, Unità e staff), t_pb (Piano B delle attività),
  t_cassa (moduli Trasporti/Locazioni/Quota, categorie e incidenze, da attribuire cliccabile, materiali richiudibili ed Excel, diete per pasto, time table a blocchi e trascinabile, Excel del time table), t_rich (barra di formattazione, segni nel testo, anteprima, Word).

## 20 novembre — tendina «Formazione» a scelta multipla (solo anteprima)
- t_form (28 controlli): colonna Formazione della tabella staff con elenco a spunta (Unità, ruoli, brevetti, percorsi precedenti, Nessuna), livello calcolato (Nessuna / Iniziale / Intermedia / Avanzata / Wood Badge), Wood Badge 3-4 a cascata, «Nessuna» esclusiva, testo vecchio mai cancellato (nota «Scritto prima»), testo cambiato altrove che rivince, profili collegati e a mano, esportazione.
- t_staff aggiornato: i vecchi codici `base` e `tdm` ora diventano i livelli `iniz` e `inter`.

## 20 novembre sera — ruolo «Commissario di Sezione» (solo anteprima)
- Database: `supabase_aggiornamento_20novembre_commissario.sql` (vincolo `pee_membri_ruolo_check` con il quarto valore, rieseguibile). `rls/probe_commissario.sh` (25 prove su un Postgres vero: richiede il database di prova su porta 5544, con gli script SQL di sempre caricati e poi quello nuovo) verifica che il Commissario legga ma non modifichi, che lasci pareri firmati e che un co-titolare non possa nominarlo.
- t_cdsr (28 controlli, anche su 12 profili di dispositivo: `node t_cdsr.mjs iphone-se`): il ruolo si offre solo nella «Condividi» della Programmazione formativa del Capo Gruppo (non nel progetto del Commissario, non nei progetti d'Unità); frase approvata; database non aggiornato → messaggio chiaro e nessun invito; il Commissario apre in sola lettura col suo ruolo, vede i momenti riservati agli adulti che il Lettore non vede, non scrive nulla sul database; parere firmato «Nome · Commissario di Sezione» lasciato dalla scheda di una persona (pulsante «+ Lascia un parere») e letto dal Capo Gruppo; cambio di ruolo in diretta (Lettore ⇄ Commissario) e ritorno a Lettore.
- harness: `FakeDB.ruoloAmmesso()` emula il vincolo (`db.sqlComm = false` = script SQL del 20 novembre non ancora lanciato → errore 23514).

## 20 novembre notte — «Parere sul progetto» e risposta del Capo Gruppo (solo anteprima)
- Database: `supabase_aggiornamento_20novembre_risposte_pareri.sql` (colonne `risposta`, `risposta_da`, `risposta_il` in `pee_suggerimenti`, vincolo 1–2000 caratteri, guardia `pee_sugg_solo_stato` allargata; rieseguibile). `rls/probe_risposte.sh` (17 prove su Postgres vero, porta 5544): rispondono solo titolare e co-titolari; Commissario, lettore ed estranei no; testo, firma e percorso restano immodificabili; la data della risposta la mette il database; il Commissario legge la risposta solo sul proprio parere.
- App: un solo box fisso `#sgp-host` in fondo alla pagina (non si perde quando le pagine si ridisegnano). Chiavi `PAG:osservazione|lettura|percorso|eventi|check` e `EVT:<id evento>`; pagina riconosciuta con `window.vidCtx()` (`aud === 'C'` = progetto Capo Gruppo). Lo scrive solo il Commissario; chi ha il progetto lo vede solo se ci sono pareri. Risposta (`sgRepH`, `sg13Rep*`) sotto ogni suggerimento/parere: schede delle persone, tabelle 1.3 e box. `CL._sgRep === false` = colonne mancanti: niente pulsanti di risposta e niente errori.
- t_cdsp (41 controlli, anche su 12 profili: `node t_cdsp.mjs iphone-se`): box su ognuna delle 5 pagine e in ogni evento, nascosto a Lettore e Collaboratore, parere salvato con chiave e firma, il Commissario non scrive sul progetto, risposta/modifica/toglie/risposta vuota, risposta sulla scheda di una persona, avviso «1 risposta», database vecchio.
- harness: `db.sqlRisp = false` = secondo script SQL non ancora lanciato (42703 sulle colonne); l'update delle risposte emula guardia e vincolo.
- Nota: la prima volta `goPhase(2)` passa dalla pagina della citazione; nei test usare `goPhaseInternal(2)`.
