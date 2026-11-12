import re,base64,json
P='/home/claude/work/proto/'
sh=open(P+'shell3.html').read()
css=sh[sh.find('<style>')+7:sh.find('</style>')]
wiz_html=sh[sh.find('<div id="wiz">'):sh.find('<div id="modal"')]
wiz_html=wiz_html.replace('<div id="wiz">','<div id="wiz" class="on">')
rd=lambda f:open(P+f).read()
wizjs=open('/tmp/wiz_part.js').read()
# --- modifiche al percorso guidato ---
wizjs=wizjs.replace("oss:['Giulia','Marco','Anna'].map((n,i)=>({n,on:i<2,staff:true,cond:i===0}))","oss:(INIT.staff&&INIT.staff.length?INIT.staff:[ME||'Io']).slice(0,8).map((n,i)=>({n,on:i<2,staff:true,cond:i===0}))")
assert 'INIT.staff' in wizjs
wizjs=wizjs.replace("function wizOpen(pid){ S=nuovoS(); if(pid){ S.porta='scop'; S.main=pid; S.amb=pid[0]; S.step=1; } $('wiz').classList.add('on'); document.body.style.overflow='hidden'; wr(); }","function wizOpen(pid){ S=nuovoS(); if(pid){ S.porta='scop'; S.main=pid; S.amb=pid[0]; S.step=1; } wr(); }")
wizjs=wizjs.replace("function wizClose(){ $('wiz').classList.remove('on'); document.body.style.overflow=''; }","function wizClose(){ parent.postMessage({oss:1,t:'close'},'*'); }")
assert "parent.postMessage({oss:1,t:'close'}" in wizjs
# salva
i=wizjs.index('function salva()'); j=wizjs.index('function copia()')
nuovo_salva='''function radiciAnon(){ if(S.porta==='att'||!S.dom.trim()) return [];
  const sent=/(^|[.!?…:]\\s+|["«(]\\s*)(\\p{Lu}[\\p{L}']*)/gu; const cand=[];
  let t=(S.dom+' '+S.contro).replace(sent,(m,a,w)=>{ const lw=w.toLowerCase(); const st=stem(lw); cand.push(st); return a+' '; });
  // le parole con la maiuscola a inizio frase si tengono solo se il motore le conosce (così un nome proprio non passa); le altre maiuscole si scartano
  t=t.replace(/\\p{Lu}[\\p{L}']*/gu,' ');
  const known=w=>!!(INDICE.IDX[w]||INDICE.RW[w]);
  const all=[...motoreTok(t).map(w=>stem(w)),...cand.filter(known)];
  return [...new Set(all)].filter(w=>w.length>=2&&w.length<=24&&/^[a-zàèéìòù']+$/.test(w)).sort().slice(0,30); }
function salva(){ if(!S.main){ toast('Manca il percorso principale'); return; } if(!S.nome.trim()){ toast('Dai un nome all’attività'); return; }
  const att={nome:S.nome.trim().slice(0,120),main:S.main,also:S.also.slice(),dom:S.porta==='att'?'':S.dom.trim(),foc:S.foc.map(f=>f.txt),dur:S.dur,lan:S.lan,svi:S.svi,con:S.con,temi:S.temi.slice()};
  const ck=$('radici-ok'); let rad=null; if(ck&&ck.checked){ const r=radiciAnon(); if(r.length>=2) rad={branca:B,radici:r,percorso:S.main,altri:S.also.slice(0,4)}; }
  parent.postMessage({oss:1,t:'save',att,rad,optin:!!(ck&&ck.checked)},'*'); }
'''
wizjs=wizjs[:i]+nuovo_salva+wizjs[j:]
# riga di consenso prima dei pulsanti finali
old='''<div class="aa"><button type="button" class="btn-primary" onclick="salva()">'''
assert old in wizjs
wizjs=wizjs.replace(old,'''${INIT.radiciAsk?`<label class="rad"><input type="checkbox" id="radici-ok" ${INIT.optin?'checked':''}><span><b>Aiuta a migliorare lo strumento</b> (facoltativo). Se spunti, condivido in modo anonimo solo le <i>radici</i> delle parole della tua domanda (per esempio «litig», «guid») e il percorso che hai scelto. Non vengono salvati il testo, i nomi, il tuo account né il progetto.</span></label>`:''}
  <div class="aa"><button type="button" class="btn-primary" onclick="salva()">''',1)
wizjs=wizjs.replace('DB_.kosDone.has(a.n)',"(INIT.kosDone||[]).includes(a.n)")
assert 'DB_' not in wizjs
wizjs=wizjs.replace("document.addEventListener('DOMContentLoaded',()=>{ kosInit(); initAtt(); renderPage(); });","")
shim='''
// ── Collegamento con la pagina (il percorso guidato gira isolato in un riquadro) ──
let INIT={}, B='E', TIPO='PE', ROLE='tit', ME='', COV={};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pick=a=>a[Math.floor(Math.random()*a.length)];
function toast(t){ const e=$('toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>e.classList.remove('on'),2400); }
function motore(t){ try{ return suggerisci(t); }catch(e){ console.error(e); return []; } }
function modal(h){ $('modal').innerHTML=`<div class="mbox">${h}</div>`; $('modal').classList.add('on'); }
function modalClose(){ $('modal').classList.remove('on'); }
const copertura=()=>COV;
const nOcc=p=>(COV[p]||[]).length;
const scoperti=()=>PERC.filter(p=>!nOcc(p.id)).map(p=>p.id);
let S;
window.addEventListener('message',e=>{ const m=e.data; if(!m||!m.oss||m.t!=='init'||e.source!==parent) return;
  INIT=m; B=m.B; TIPO=m.tipo; ROLE=m.role; ME=m.me||''; COV=m.cov||{}; document.body.dataset.theme=B; wizOpen(m.pid||''); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if($('modal').classList.contains('on')) modalClose(); else wizClose(); } });
'''
wizjs=wizjs.replace('let S;\n','',1)
js='\n'.join(['/*DATA*/'.replace('/*DATA*/',rd('data.js')),rd('cooc.js'),rd('stem_it.js'),rd('indice.js'),rd('motore.js')])
scripts=[rd('data.js'),rd('cooc.js'),rd('stem_it.js'),rd('indice.js'),rd('motore.js'),rd('app3_const.js'),rd('orienta.js'),shim+wizjs+"\nparent.postMessage({oss:1,t:'ready'},'*');"]
extra_css='''
body,button,input,select,textarea{font-family:'Montserrat',system-ui,-apple-system,'Segoe UI',Arial,sans-serif!important}
#wiz{display:flex}.wclose{white-space:nowrap;min-height:36px;padding:6px 14px}
.rad{display:flex;gap:9px;align-items:flex-start;font-size:12.5px;line-height:1.5;color:var(--ink-mid);background:var(--bg);border:1px dashed var(--border);border-radius:10px;padding:10px 12px;margin:12px 0 4px;cursor:pointer}.rad input{margin-top:3px;accent-color:var(--green);flex:none}
'''
doc='<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Nuova attività osservativa</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"><style>'+css+extra_css+'</style></head><body data-theme="E">'+wiz_html+'<div id="modal" onclick="if(event.target===this)modalClose()"></div><div id="toast" role="status"></div>'+''.join('<script>'+s+'</script>' for s in scripts)+'</body></html>'
assert doc.count('<script>')==8 and doc.count('</script>')==8, (doc.count('<script'),doc.count('</script'))
assert '<!--' not in doc
open(P+'mod/oss_iframe.html','w').write(doc)
b64=base64.b64encode(doc.encode()).decode()
open(P+'mod/oss_iframe.b64','w').write(b64)
print(len(doc),len(b64))
