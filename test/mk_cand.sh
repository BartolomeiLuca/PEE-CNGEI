#!/bin/bash
# copia di prova del sito come sarà DOPO il passaggio: radice = anteprima con la riga di accensione del guscio del sito principale; anteprima = anteprima. APP_BUILD='dev'.
bash /home/claude/pee-cngei/test/mk.sh
cp /tmp/site_sh/anteprima/index.html /tmp/site_sh/index.html
python3 - <<'PY'
p='/tmp/site_sh/index.html'; s=open(p,encoding='utf8').read()
old="  on = (/\\/anteprima(\\/|$)/.test(location.pathname) || localStorage.getItem('pee_guscio') === '1') && q.get('guscio') !== '0';"
new="  on = q.get('guscio') !== '0';   // sito principale: interfaccia nuova sempre accesa (con ?guscio=0 si torna alla vecchia, solo per emergenza)"
assert s.count(old)==1, 'riga di accensione non trovata'
open(p,'w',encoding='utf8').write(s.replace(old,new))
PY
cp -r /home/claude/pee-cngei/anteprima/circolare /tmp/site_sh/ 2>/dev/null; true
