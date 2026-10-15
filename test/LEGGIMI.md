# Test automatici di PEE CNGEI

Banco di prova con un finto Supabase in memoria (più persone, ruoli, tempo reale): non tocca il database vero.

    mkdir -p /home/claude/work && cp test/* /home/claude/work/ && cd /home/claude/work
    npm i playwright@1.56.0 && PLAYWRIGHT_BROWSERS_PATH=/home/claude/pw npx playwright install webkit firefox
    (cd libs && npm init -y && npm i docx@8.5.0 exceljs@4.4.0 jszip@3.10.1)   # dentro /home/claude/work/libs
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
