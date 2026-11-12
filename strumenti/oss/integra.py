import re,sys
A='/home/claude/bartolomeiluca/pee-cngei/anteprima/index.html'
M='/home/claude/work/proto/mod/'
h=open(A).read()
js=open(M+'oss_native.js').read(); css=open(M+'oss_native.css').read(); b64=open(M+'oss_iframe.b64').read()
def strip(h,a,b):
    i=h.find(a)
    if i<0: return h
    j=h.find(b,i)+len(b)
    return h[:i]+h[j:]
h=strip(h,'/*OSS-BEGIN*/','/*OSS-END*/\n')
h=re.sub(r'<style id="oss-css">.*?</style>\n','',h,flags=re.S)
h=re.sub(r'<script type="text/plain" id="oss-doc">.*?</script>\n','',h,flags=re.S)
# 1 JS
mark='// KOS_OBS — Cosa osservare per percorso × fascia'
i=h.index(mark); i=h.rfind('\n',0,i-1)+1
pass
h=h[:i]+js+'\n'+h[i:]
# 2 CSS
h=h.replace('</head>','<style id="oss-css">\n'+css+'</style>\n</head>',1)
# 3 doc
h=h.replace('<!-- GUSCIO:FINE -->','<script type="text/plain" id="oss-doc">'+b64+'</script>\n<!-- GUSCIO:FINE -->',1)
# 4 pannello
old="    ${kosPathHTML()}\n    <label style=\"${SC_LBL}\">Occasioni osservative"
if '<div id="oss-panel">' not in h:
    assert old in h
    h=h.replace(old,"    ${kosPathHTML()}\n    <div id=\"oss-panel\">${ossPanelHTML()}</div>\n    <label style=\"${SC_LBL}\">Occasioni osservative",1)
# 5 kosObsRefresh: numero di occasioni sul segno
if 'osservato · ' not in h:
    old="if(tag){ tag.style.display=cov.has(p.id)?'':'none'; tag.title=cov.has(p.id)?'Osservato in: '+src[p.id].join(' · '):''; } });"
    assert old in h
    h=h.replace(old,"if(tag){ const n=(src[p.id]||[]).length; tag.style.display=n?'':'none'; tag.textContent=n?'osservato · '+n:'osservato'; tag.title=n?'Osservato in: '+src[p.id].join(' · ')+(n===1?' — una sola occasione: se puoi, cerca un secondo contesto in cui osservarlo.':''):''; } });",1)
    old2="`Di questi, <b>${un.length}</b>"
    assert old2 in h
    # frase sui percorsi con una sola occasione
    h=h.replace("h.innerHTML=`<b>Occasioni osservative:</b> ${cov.size} percorsi su 24 hanno avuto almeno un’occasione di osservazione, con il KOS o con altre attività (segnati con <span class=\"kos-tag\">osservato</span>, passaci sopra per vedere dove). `+(un.length","const uno=Object.keys(src).filter(k=>src[k].length===1).length;\n  h.innerHTML=`<b>Occasioni osservative:</b> ${cov.size} percorsi su 24 hanno avuto almeno un’occasione di osservazione, con il KOS o con altre attività (segnati con <span class=\"kos-tag\">osservato</span>, passaci sopra per vedere dove; il numero dice in quante occasioni). `+(uno?`Per ${uno} ${uno===1?'è stata':'sono state'} una sola: se puoi, cerca un secondo contesto. `:'')+(un.length",1)
# 6 Per te
if "x.tipo==='oss'" not in h:
    old="${x.tipo==='mv'?clEsc(x.da||'Una persona dello staff')+' ha dato il suo valore su '+clEsc(x.dove||'un percorso')+' · da riguardare':"
    assert old in h
    h=h.replace(old,old+"x.tipo==='oss'?clEsc(x.da||'Una persona')+(x.az==='prop'?' ha proposto un’attività osservativa: ':x.az==='ok'?' ha accettato la tua proposta di attività osservativa: ':' ti ha scritto un suggerimento sull’attività osservativa: ')+clEsc(x.dove||''):",1)
    old="    if(A && A.tipo === 'mv'){ try{ clClose(); }catch(e){} (window._mvOpen = window._mvOpen || {})[A.pid] = true; gotoObs(A.pid); return; }"
    assert old in h
    h=h.replace(old,old+"\n    if(A && A.tipo === 'oss'){ if(!window.BRO) ptAvRead(av); ossGo(); return; }",1)
# 6b blocco in modifica: il pannello resta usabile (proporre e suggerire) anche per chi collabora
if '#oss-panel' not in h:
    old="const special = e => e.closest('.sg-wrap,.sg13,#cl-ov,#ed-bar,.ed-aff,#g-modal,"
    assert old in h
    h=h.replace(old,"const special = e => e.closest('.sg-wrap,.sg13,#cl-ov,#ed-bar,.ed-aff,#g-modal,#oss-panel,",1)
# 6c l'avviso porta anche il tipo di azione (proposta, accettata, suggerimento)
if 'az:a.az' not in h:
    old="Object.assign({k:'av', av:a.id, tipo:a.tipo, da:a.da,"
    assert old in h
    h=h.replace(old,"Object.assign({k:'av', av:a.id, tipo:a.tipo, az:a.az, da:a.da,",1)
# 7 build
h=re.sub(r"const APP_BUILD='\d+';","const APP_BUILD='202611121800';",h,1)
open(A,'w').write(h)
print('ok',len(h))
