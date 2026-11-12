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

# 8 ricerca: occasioni osservative e attività osservative dentro «Cerca un'attività»
def rep(h,old,new,cnt=1):
    assert old in h, old[:70]
    return h.replace(old,new,cnt)
if 'anFlatOss(sc,fascia,proj)' not in h:
    h=rep(h,"try{ anFlatUsc(sc,fascia,proj).forEach(z=>out.push(z)); }catch(e){ console.error(e); } return out; }","try{ anFlatUsc(sc,fascia,proj).forEach(z=>out.push(z)); }catch(e){ console.error(e); } try{ anFlatOss(sc,fascia,proj).forEach(z=>out.push(z)); }catch(e){ console.error(e); } return out; }")
    h=rep(h,"f:{q:'',branca:'',ambito:'',perc:'',tipo:'',str:'',dur:'',sede:'',ok:false}","f:{q:'',branca:'',ambito:'',perc:'',tipo:'',str:'',dur:'',sede:'',ok:false,ga:true,go:true,st:''}")
    h=rep(h,"(r.idr||[]).join(' '),(r.tipi||[]).join(' '),(r.strumenti||[]).join(' '),c.lancio,c.sviluppo,c.conclusione].join(' ').toLowerCase();\n  if(q&&","(r.idr||[]).join(' '),(r.tipi||[]).join(' '),(r.strumenti||[]).join(' '),c.lancio,c.sviluppo,c.conclusione,r.dom,(r.foc||[]).join(' '),r.ctx,r.note,(r.chi||[]).join(' ')].join(' ').toLowerCase();\n  const gn=r.gen==='oss'?'go':'ga'; if(!f[gn]) return false; if(f.st&&r.gen==='oss'){ const sv=r.stato==='svolta'; if(f.st==='svolta'&&!sv) return false; if(f.st==='todo'&&sv) return false; }\n  if(q&&")
    h=rep(h,"if(f.ambito&&r.ambito!==f.ambito) return false; if(f.perc&&r.perc_id!==f.perc) return false;","if(f.ambito&&r.ambito!==f.ambito&&!(r.also||[]).some(p=>p[0]===f.ambito)) return false; if(f.perc&&r.perc_id!==f.perc&&!(r.also||[]).includes(f.perc)) return false;")
    h=rep(h,"async function anOpen(tab){ AN.det=null;","async function anOpen(tab,gen){ if(gen==='oss'){ AN.f.ga=false; AN.f.go=true; } AN.det=null;")
    h=rep(h,"if(T!=='pend'&&T!=='mie') h+=`<div class=\"an-f\"><input id=\"an-q\"","if(T!=='pend'&&T!=='mie') h+=anGenHTML()+`<div class=\"an-f\"><input id=\"an-q\"")
    h=rep(h,"<select class=\"ax-in\" onchange=\"AN.f.tipo=","<select class=\"ax-in\" ${AN.f.ga?'':'style=\"display:none\" '}onchange=\"AN.f.tipo=")
    h=rep(h,"<select class=\"ax-in\" onchange=\"AN.f.str=","<select class=\"ax-in\" ${AN.f.ga?'':'style=\"display:none\" '}onchange=\"AN.f.str=")
    h=rep(h,"<select class=\"ax-in\" onchange=\"AN.f.sede=","<select class=\"ax-in\" ${AN.f.ga?'':'style=\"display:none\" '}onchange=\"AN.f.sede=")
    h=rep(h,"<label class=\"an-ck\"><input type=\"checkbox\" ${f.ok?'checked':''} onchange=\"AN.f.ok=this.checked;anRender()\"> Ha funzionato</label></div>`;","<label class=\"an-ck\" ${AN.f.ga?'':'style=\"display:none\"'}><input type=\"checkbox\" ${f.ok?'checked':''} onchange=\"AN.f.ok=this.checked;anRender()\"> Ha funzionato</label>${anStSel(T)}</div>`;")
    h=rep(h,"${anChips(r)}${P('Lancio',c.lancio)}","${anChips(r)}${anOssDet(r)}${P('Lancio',c.lancio)}")
    h=rep(h,"function anChips(r){ const bits=[","function anChips(r){ const bits=[anGenChip(r),")
    h=rep(h,"function anActs(r){ const i=anIdx(r);","function anActs(r){ if(r.gen==='oss'&&AN.tab!=='mie'&&AN.tab!=='pend') return anActsOss(r); const i=anIdx(r);")
    h=rep(h,"String(c.lancio||c.sviluppo||'').slice(0,140)","String(c.lancio||c.sviluppo||r.dom||(r.foc||[])[0]||r.ctx||'').slice(0,140)")
    h=rep(h,"${L.length} attività${L.length===1?'':''}","${L.length} ${L.length===1?'risultato':'risultati'}")
    h=rep(h,"function anGoMine(i){ const r=AN_CUR[i]; if(!r) return; anClose();","function anGoMine(i){ const r=AN_CUR[i]; if(!r) return; anClose(); if(r.gen==='oss'){ ossJumpTo(r); return; }")
    h=rep(h,"function anJump(J){ try{\n","function anJump(J){ try{\n  if(J.t==='oss'){ ossFind(J); return; }\n")

if 'anRowFix(Object.assign' not in h:
    h=rep(h,"AN.rows=(data||[]).map(r=>Object.assign({src:'an'},r));","AN.rows=(data||[]).map(r=>anRowFix(Object.assign({src:'an'},r)));")
# 7 build
h=re.sub(r"const APP_BUILD='\d+';","const APP_BUILD='202611121930';",h,1)
open(A,'w').write(h)
print('ok',len(h))
