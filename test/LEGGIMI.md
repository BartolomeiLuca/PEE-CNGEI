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
