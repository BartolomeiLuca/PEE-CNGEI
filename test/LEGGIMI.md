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
