// ═══ Prototipo v6: «Come osservo» con KOS, attività osservative proprie, occasioni e griglia ═══
// (le costanti condivise stanno in app3_const.js)
let B='E', TIPO='PE', ROLE='tit';
const ROLES={PE:[['tit','Titolare'],['cot','Cotitolare'],['col','Collaboratore o collaboratrice'],['let','Lettore (per esempio il Capo Gruppo)']],PP:[['aut','Chi scrive il Progetto Personale'],['cg','Capo Gruppo (lettore)']]};
const ME={tit:'Giulia (titolare)',cot:'Marco (cotitolare)',col:'Anna (collaboratrice)',let:'Paolo (Capo Gruppo)',aut:'Giulia',cg:'Paolo (Capo Gruppo)'};
const canCreate=()=>['tit','cot','col','aut'].includes(ROLE);
const canDirect=()=>['tit','cot','aut'].includes(ROLE);
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pick=a=>a[Math.floor(Math.random()*a.length)];
const oggi=()=>{ const d=new Date(); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); };
function toast(t){ const e=$('toast'); e.textContent=t; e.classList.add('on'); clearTimeout(toast._t); toast._t=setTimeout(()=>e.classList.remove('on'),2400); }
function motore(t){ try{ return suggerisci(t); }catch(e){ console.error(e); return []; } }

// ── Dati di prova della scheda ──
const DB_={kosDone:new Set(), occMan:[{n:'Uscita di inizio anno',data:'04/10/2026',ctx:'Uscita',chi:'Giulia, Marco',perc:['C3','P5','C2']}], att:[]};
function kosInit(){ DB_.kosDone=new Set((KOS[B]||[]).filter(a=>/^1/.test(a.inc)).map(a=>a.n)); }
function initAtt(){ DB_.att=[{id:1,nome:'Il mercato senza capo',autore:'Anna (collaboratrice)',ruoloAut:'col',stato:'proposta',main:'C3',also:['C1'],dom:'Quando nessuno è incaricato di guidare, qualcuno prende l’iniziativa?',foc:['Osservo se e come le persone che di solito restano ai margini propongono un compito ai compagni quando nessuno è incaricato di guidare.'],dur:45,sugg:[],lan:'Le squadre diventano botteghe di un mercato: devono vendere e comprare servizi.',svi:'Nessun capo designato. A metà cambia la moneta.',con:'In cerchio: chi vi ha aiutato senza che lo chiedeste?'}]; }
function copertura(){ const c={}; const add=(p,src)=>{ (c[p]=c[p]||[]).push(src); };
  (KOS[B]||[]).forEach(a=>{ if(DB_.kosDone.has(a.n)) a.f.forEach(p=>add(p,'KOS · '+a.n)); });
  DB_.occMan.forEach(o=>o.perc.forEach(p=>add(p,o.n)));
  DB_.att.filter(a=>a.stato==='svolta').forEach(a=>(a.oss||[a.main,...a.also]).forEach(p=>add(p,'Attività osservativa · '+a.nome)));
  return c; }
const nOcc=p=>(copertura()[p]||[]).length;
const scoperti=()=>PERC.filter(p=>!nOcc(p.id)).map(p=>p.id);

// ── Pagina «Come osservo» ──
function renderPage(){ document.body.dataset.theme=B;
  const PP=TIPO==='PP';
  $('crumb').textContent=PP?'Progetto Personale › Osservazione del gruppo di pari':'Programmazione di Unità › Osservazione del gruppo di pari';
  $('ptitle').textContent=PP?'KOS e Occasioni osservative':'Come osservo';
  $('roles').innerHTML=ROLES[TIPO].map(([k,t])=>`<option value="${k}"${ROLE===k?' selected':''}>${t}</option>`).join('');
  $('kos').innerHTML=kosHTML(); $('mie').innerHTML=mieHTML(); $('occ').innerHTML=occHTML(); $('gri').innerHTML=griHTML(); }
function covBars(){ const c=copertura(); return ['P','C','S'].map(a=>{ const L=PERC.filter(p=>p.id[0]===a); const n=L.filter(p=>c[p.id]).length; return `<div class="cb"><span class="t${a}">Sviluppo ${AMB[a]}</span><i><b class="b${a}" style="width:${Math.round(100*n/L.length)}%"></b></i><em>${n}/${L.length}</em></div>`; }).join(''); }
function kosHTML(){ const L=KOS[B]||[]; const incs=[...new Set(L.map(a=>a.inc))]; const c=copertura(); const tot=Object.keys(c).length; const done=L.filter(a=>DB_.kosDone.has(a.n)).length;
  return `<div class="kh"><div><div class="eyebrow">Kit di Osservazione e Scoperta</div><h3>Percorso osservativo KOS 2.0 · ${BR[B].u}</h3><p class="sub">3 incontri, circa 10 ore, da chiudere entro novembre. Spunta le attività che hai svolto: finiscono nelle occasioni osservative e nella griglia.</p></div><div class="kstat"><b>${done}</b><small>attività svolte su ${L.length}</small></div></div>
  <div class="incs">${incs.map((t,i)=>`<span class="inc i${i}"><b>${i+1}</b> ${esc(t.replace(/^\d°?\s*incontro\s*·\s*/i,''))}</span>`).join('<span class="arr">→</span>')}</div>
  <div class="covw"><div class="lbl">Percorsi già osservati (KOS e altre occasioni): ${tot} su 24</div>${covBars()}</div>
  <details class="kd"><summary>Apri le attività del KOS</summary>${incs.map((t,i)=>`<div class="kinc i${i}"><div class="kih"><b>${esc(t)}</b></div>${L.filter(a=>a.inc===t).map(a=>`<label class="kact"><input type="checkbox" ${DB_.kosDone.has(a.n)?'checked':''} data-v="${esc(a.n)}" onchange="kosTog(this.dataset.v,this.checked)"><span><b>${esc(a.n)}</b>${a.m?' · '+a.m+' min':''}<small>Osserva: ${a.f.map(p=>esc(PID[p].n)).join(' · ')}</small></span></label>`).join('')}</div>`).join('')}</details>`; }
function kosTog(n,on){ if(on) DB_.kosDone.add(n); else DB_.kosDone.delete(n); renderPage(); }
function mieHTML(){ const sc=scoperti(); const PP=TIPO==='PP';
  const intro=canCreate()?(ROLE==='col'?'Puoi creare attività osservative e proporle a chi è titolare o cotitolare: le trovano qui, con il tuo nome.':'Costruisci attività tue, partendo da una domanda sul gruppo o da ciò che non hai ancora osservato. Sei tu a scriverle: il tool ti accompagna e restringe il campo passo dopo passo.'):(PP?'Il Progetto Personale lo scrive una persona sola: puoi leggere le attività e lasciare un suggerimento.':'Puoi leggere le attività e lasciare un suggerimento a chi le ha scritte.');
  return `<div class="kh"><div><div class="eyebrow">Oltre il KOS</div><h3>Crea le tue attività osservative</h3><p class="sub">${intro}</p></div>${canCreate()?`<button class="btn-primary" onclick="wizOpen()">+ Nuova attività osservativa</button>`:''}</div>
  ${sc.length&&canCreate()?`<div class="scop"><div class="lbl">Non hai ancora osservato ${sc.length} ${sc.length===1?'percorso':'percorsi'} <small>(tocca per partire da lì)</small></div>${['P','C','S'].map(a=>{ const L=sc.filter(p=>p[0]===a); return L.length?`<div class="scr"><span class="t${a}">${AMB[a]}</span>${L.map(p=>`<button class="chip a${a}" onclick="wizOpen('${p}')">${esc(PID[p].n)}</button>`).join('')}</div>`:''; }).join('')}</div>`:''}
  <div class="alist">${DB_.att.length?DB_.att.map(attCard).join(''):'<div class="empty">Ancora nessuna attività. Le attività che crei compaiono qui, con chi le ha scritte e a che punto sono.</div>'}</div>`; }
const STATI={bozza:['Bozza','st-b'],proposta:['Proposta','st-p'],pronta:['Pronta','st-r'],svolta:['Svolta','st-s']};
function attCard(a){ const P=[a.main,...a.also]; const mine=a.autore===ME[ROLE];
  const acts=[];
  acts.push(`<button class="btn-ghost sm" onclick="attApri(${a.id})">Apri</button>`);
  if(a.stato==='proposta'&&canDirect()) acts.push(`<button class="btn-primary sm" onclick="attAccetta(${a.id})">Accetta la proposta</button>`);
  if(a.stato==='pronta'&&(canDirect()||mine)) acts.push(`<button class="btn-primary sm" onclick="attSvolta(${a.id})">Segna come svolta</button>`);
  if(!mine) acts.push(`<button class="btn-ghost sm" onclick="attSugg(${a.id})">Suggerisci</button>`);
  if(mine||ROLE==='tit'||ROLE==='aut') acts.push(`<button class="lnk" onclick="attDel(${a.id})">Elimina</button>`);
  return `<div class="acard"><div class="ah"><span class="stp ${STATI[a.stato][1]}">${STATI[a.stato][0]}</span><b>${esc(a.nome)}</b><small>di ${esc(a.autore)}${a.data?' · svolta il '+a.data:''}</small></div>
   <div class="ap">${P.map((p,i)=>`<span class="pchip a${p[0]}">${esc(PID[p].n)}${i===0?' · principale':''}</span>`).join(' ')}</div>
   ${a.dom?`<div class="adom">«${esc(a.dom)}»</div>`:''}
   ${a.sugg.length?`<details class="sgp"><summary>Suggerimenti ricevuti · ${a.sugg.length}</summary>${a.sugg.map(s=>`<div class="sgi"><b>${esc(s.da)}</b> · ${s.at}<div>${esc(s.t)}</div></div>`).join('')}</details>`:''}
   ${a.stato==='proposta'&&canDirect()?`<div class="hint">Proposta da ${esc(a.autore)}: accettala per renderla pronta, oppure rispondi con un suggerimento.</div>`:''}
   <div class="aa">${acts.join('')}</div></div>`; }
function attGet(id){ return DB_.att.find(a=>a.id===id); }
function attAccetta(id){ attGet(id).stato='pronta'; renderPage(); toast('Proposta accettata: ora è pronta'); }
function attDel(id){ modal(`<h3>Eliminare l’attività?</h3><p class="sub">«${esc(attGet(id).nome)}» sparisce dall’elenco. Se era già svolta, esce anche dalle occasioni osservative.</p><div class="aa"><button class="btn-primary" onclick="DB_.att=DB_.att.filter(a=>a.id!==${id});modalClose();renderPage()">Elimina</button><button class="btn-ghost" onclick="modalClose()">Annulla</button></div>`); }
function attSugg(id){ const a=attGet(id); modal(`<h3>Suggerimento per ${esc(a.autore)}</h3><p class="sub">Su «${esc(a.nome)}». Lo trova in «Per te», con il tuo nome.</p><textarea id="sgt" rows="4" placeholder="Cosa suggerisci?"></textarea><div class="aa"><button class="btn-primary" onclick="attSuggSend(${id})">Invia</button><button class="btn-ghost" onclick="modalClose()">Annulla</button></div>`); }
function attSuggSend(id){ const t=($('sgt').value||'').trim(); if(!t){ toast('Scrivi il suggerimento'); return; } attGet(id).sugg.push({da:ME[ROLE],t,at:oggi()}); modalClose(); renderPage(); toast('Suggerimento inviato'); }
function attSvolta(id){ const a=attGet(id); const P=[a.main,...a.also];
  modal(`<h3>Segna come svolta</h3><p class="sub">«${esc(a.nome)}» entra nelle occasioni osservative e da lì nella griglia, come le attività del KOS.</p>
  <label class="fl w1">Data<input type="text" id="sv-d" value="${oggi()}"></label>
  <label class="fl">Chi ha osservato<input type="text" id="sv-c" value="Giulia, Marco"></label>
  <div class="lbl">Quali percorsi avete osservato davvero <small>(arrivano spuntati quelli previsti: cambiali se è andata diversamente)</small></div>
  <div class="cgrid">${P.map(p=>`<label><input type="checkbox" class="sv-p" value="${p}" checked> ${esc(PID[p].n)}</label>`).join('')}</div>
  <details class="pick"><summary>Avete osservato anche altro?</summary><div class="cgrid">${PERC.filter(p=>!P.includes(p.id)).map(p=>`<label><input type="checkbox" class="sv-p" value="${p.id}"> ${esc(p.n)}</label>`).join('')}</div></details>
  <div class="aa"><button class="btn-primary" onclick="attSvoltaOk(${id})">Conferma</button><button class="btn-ghost" onclick="modalClose()">Annulla</button></div>`); }
function attSvoltaOk(id){ const a=attGet(id); a.oss=[...document.querySelectorAll('.sv-p:checked')].map(x=>x.value); if(!a.oss.length){ toast('Spunta almeno un percorso'); return; } a.stato='svolta'; a.data=$('sv-d').value; a.chi=$('sv-c').value; modalClose(); renderPage(); toast('Svolta: ora è nelle occasioni osservative'); }
function attApri(id){ const a=attGet(id); modal(`<h3>${esc(a.nome)}</h3><p class="sub">di ${esc(a.autore)} · ${STATI[a.stato][0]}</p>${a.dom?`<div class="box q">La domanda di partenza: «${esc(a.dom)}»</div>`:''}<div class="lbl">Focus</div><ol class="ol">${a.foc.map(f=>`<li>${esc(f)}</li>`).join('')}</ol>${['lan','svi','con'].map((k,i)=>a[k]?`<div class="lbl">${['Lancio','Sviluppo','Conclusione'][i]}</div><p>${esc(a[k])}</p>`:'').join('')}<div class="aa"><button class="btn-ghost" onclick="modalClose()">Chiudi</button></div>`); }
function occHTML(){ const L=KOS[B]||[]; const rows=[...L.filter(a=>DB_.kosDone.has(a.n)).map(a=>({n:'KOS · '+a.n,data:'—',chi:'—',perc:a.f,k:1})),...DB_.occMan,...DB_.att.filter(a=>a.stato==='svolta').map(a=>({n:'Attività osservativa · '+a.nome,data:a.data,chi:a.chi||'',perc:a.oss,att:1}))];
  return `<h3>Occasioni osservative</h3><p class="sub">Le attività del KOS spuntate, le altre occasioni e le tue attività osservative svolte.</p><div class="tw"><table class="occ"><tr><th>Attività o incontro</th><th>Data</th><th>Chi ha osservato</th><th>Cosa hai osservato</th></tr>${rows.map(r=>`<tr class="${r.att?'att':''}"><td>${esc(r.n)}</td><td>${esc(r.data)}</td><td>${esc(r.chi)}</td><td>${r.perc.map(p=>`<span class="pchip a${p[0]}" title="${esc(PID[p].n)}">${p}</span>`).join(' ')}</td></tr>`).join('')}</table></div><button class="btn-ghost" onclick="toast('Nel prototipo questa parte non cambia: è quella che c’è già')">+ Aggiungi attività o incontro</button>`; }
function griHTML(){ const c=copertura(); return `<h3>Griglia osservativa <small>(anteprima)</small></h3><p class="sub">«Osservato» compare dopo una sola occasione, come oggi; accanto c’è il numero di occasioni, e con una sola un invito a cercare un secondo contesto.</p><div class="grid3">${['P','C','S'].map(a=>`<div><div class="lbl t${a}">Sviluppo ${AMB[a]}</div>${PERC.filter(p=>p.id[0]===a).map(p=>{ const n=(c[p.id]||[]).length; return `<div class="gr ${n?'ok':''}" title="${esc((c[p.id]||[]).join('\n'))}"><span>${esc(p.n)}</span>${n?`<em>osservato · ${n} ${n===1?'occasione':'occasioni'}</em>${n===1?'<small>un solo contesto: cercane un secondo</small>':''}`:'<em class="no">non osservato</em>'}</div>`; }).join('')}</div>`).join('')}</div>`; }
function modal(h){ $('modal').innerHTML=`<div class="mbox">${h}</div>`; $('modal').classList.add('on'); }
function modalClose(){ $('modal').classList.remove('on'); }
function setDemo(k,v){ if(k==='B'){ B=v; kosInit(); } if(k==='TIPO'){ TIPO=v; ROLE=ROLES[v][0][0]; } if(k==='ROLE') ROLE=v; renderPage(); }

// ══ Percorso guidato (wizard) ══
let S;
function nuovoS(){ return {step:0,porta:'',mom:'',momTxt:'',momMese:'',dom:'',contro:'',fr:null,useFr:true,amb:'',area:'',main:'',also:[],scart:[],ctx:'',dur:0,foc:[],nR:'',oss:['Giulia','Marco','Anna'].map((n,i)=>({n,on:i<2,staff:true,cond:i===0})),strum:[],tipi:[],tipoLib:'',ag:'',nome:'',lan:'',svi:'',con:'',temi:[],
 lab:{pid:'',chi:'',verbo:'',ogg:'',cond:'',cls:'',man:false,showChi:false,showCond:false,fromFr:false}, disamb:null, letta:null}; }
const STEPS=[{k:'porta',f:0},{k:'mom',f:0},{k:'dom',f:0},{k:'amb',f:0},{k:'perc',f:0},{k:'ctx',f:1},{k:'dur',f:1},{k:'foc',f:2},{k:'oss',f:2},{k:'str',f:3},{k:'tipo',f:3},{k:'ag',f:3},{k:'fog',f:4}];
const FASI=['Quando e cosa','Dove e quanto','Il focus','Come','Scrivi tu'];
const percs=()=>[S.main,...S.also].filter(Boolean);
function momObj(){ return MOM.find(m=>m.k===S.mom); }
function autunno(){ const m=momObj(); if(!m) return false; if(m.aut!==null) return m.aut; return ['settembre','ottobre','novembre','dicembre'].includes(S.momMese); }
function visSteps(){ return STEPS.filter(s=>s.k!=='ag'||autunno()); }
function idrVerb(t){ const w=t.split(' '); let n=(w[0]==='Si'||w[0]==='Non')?2:1; if(w[n]==='e') n+=2; return {v:w.slice(0,n).join(' ').toLowerCase(), o:w.slice(n).join(' ').replace(/\.$/,'').split(/,\s| durante | quando /)[0]}; }
function idrOf(pid){ return PID[pid].i.map((t,k)=>({pid,t,c:PID[pid].c[k],...idrVerb(t)})); }
function visCount(pid){ const c=PID[pid].c; return {A:c.filter(x=>x==='A').length,n:c.length}; }
function capacita(){ const n=+S.nR||0; const obs=S.oss.filter(o=>o.on); const eff=obs.reduce((s,o)=>s+(o.cond?0.5:1),0);
  const d=S.dur||45; let max=d<=20?1:d<=45?2:d<=90?3:4; const ratio=eff?n/eff:Infinity; if(ratio>10) max=Math.max(1,max-1);
  const cons=n?Math.max(1,Math.ceil(n/8)):0; let cop, sug=[];
  if(!obs.length) cop='nessuno'; else if(!n) cop='?'; else if(ratio<=5) cop='completa'; else if(ratio<=10){ cop='parziale'; sug.push('Seguite piccoli gruppi a turni (per esempio 15 minuti a testa) invece delle singole persone.'); } else { cop='solo il gruppo'; sug.push('Con così tante persone per osservatore vedrete le dinamiche di gruppo, non le singole persone. Aggiungete un osservatore o restringete il focus.'); }
  if(obs.length&&obs.every(o=>o.cond)) sug.push('Chi conduce non riesce a osservare a fondo: serve almeno una persona che osserva soltanto.');
  if(obs.length>1&&S.foc.length>1) sug.push('Date a ogni osservatore un focus diverso, poi confrontatevi a fine attività.');
  if(obs.length===1) sug.push('Da soli si vede meno e si interpreta di più: se potete, confrontatevi con un altro capo dopo l’attività.');
  return {n,max,cons,cop,sug,obs:obs.length}; }
function testoDom(){ return S.dom+' '+S.contro; }
// punteggi: motore + risposte alle domande + percorsi scoperti
function punteggi(){ const r=motore(testoDom()); const M=Object.fromEntries(r.map(x=>[x.id,x]));
  const area=S.area&&S.amb?(AREE[S.amb].find(a=>a[0]===S.area)||[])[1]||[]:[];
  return PERC.map(p=>{ const m=M[p.id]; let v=m?m.score:0; if(S.amb&&p.id[0]===S.amb) v+=1.5; if(area.includes(p.id)) v+=3; if(!nOcc(p.id)) v+=0.8; if((momObj()?.p||[]).includes(p.id)) v+=0.5; return {id:p.id,v,m}; }).sort((a,b)=>b.v-a.v); }

function wizOpen(pid){ S=nuovoS(); if(pid){ S.porta='scop'; S.main=pid; S.amb=pid[0]; S.step=1; } $('wiz').classList.add('on'); document.body.style.overflow='hidden'; wr(); }
function wizClose(){ $('wiz').classList.remove('on'); document.body.style.overflow=''; }
function wr(){ const vs=visSteps(); if(S.step>=vs.length) S.step=vs.length-1; const st=vs[S.step];
  $('wfasi').innerHTML=FASI.map((f,i)=>{ const first=vs.findIndex(s=>s.f===i); return `<button type="button" class="stab${st.f===i?' active':''}${st.f>i?' done':''}" onclick="go(${first})"><span>${i+1}</span>${f}</button>`; }).join('');
  lente(); domBar(st.k); $('wstep').textContent=`Passo ${S.step+1} di ${vs.length}`; $('wbody').innerHTML=VIEW[st.k]();
  $('wprev').style.visibility=S.step?'visible':'hidden'; $('wnext').style.display=st.k==='fog'?'none':''; $('wbody').scrollTop=0; $('wscroll').scrollTop=0; }
function go(i){ S.step=Math.max(0,i); wr(); }
function nav(d){ go(S.step+d); }
function lente(){ const P=percs(); const nP=P.length||(S.amb?8:24); const nI=P.length?P.reduce((s,p)=>s+PID[p].i.length,0):(S.amb?PERC.filter(p=>p.id[0]===S.amb).reduce((s,p)=>s+p.i.length,0):145); const c=capacita(); const nF=S.foc.length; const w=(x,m)=>Math.max(6,Math.round(100*x/m));
  $('wlente').innerHTML=`<div class="len"><span>Percorsi</span><i><b style="width:${w(nP,24)}%"></b></i><em>${nP}</em></div><div class="len"><span>Indicatori in gioco</span><i><b style="width:${w(nI,145)}%"></b></i><em>${nI}</em></div><div class="len"><span>Focus su consigliati</span><i class="${nF>c.max?'over':''}"><b style="width:${nF?Math.min(100,Math.round(100*nF/c.max)):0}%"></b></i><em>${nF?nF+'/'+c.max:'—'}</em></div>`; }
function domBar(k){ const e=$('wdom'); const show=S.dom.trim()&&!['porta','mom','dom'].includes(k); e.style.display=show?'':'none'; if(show) e.innerHTML=`<span class="lbl">${S.porta==='att'?'La tua attività':'La tua domanda'}</span><span class="dq">«${esc(S.dom)}»</span><button class="lnk" onclick="go(2)">modifica</button>`; }
function H(t,s){ return `<h2>${t}</h2>${s?`<p class="sub">${s}</p>`:''}`; }
function setq(k,v){ S[k]=v; lente(); }
function tog(arr,v){ const i=arr.indexOf(v); if(i>=0) arr.splice(i,1); else arr.push(v); wr(); }
const pchip=(p,x='')=>`<span class="pchip a${p[0]}">${esc(PID[p].n)}${x}</span>`;

const VIEW={
 porta(){ const sc=scoperti(); return H('Da dove vuoi partire?','Tre strade, stesso arrivo: un’attività scritta da te, con i suoi focus.')+
  `<div class="opts">${[['dub','Ho una domanda sul gruppo','Qualcosa che ho notato o che sento il bisogno di capire.'],['scop','Parto da ciò che non ho ancora osservato',`${sc.length} ${sc.length===1?'percorso è ancora scoperto':'percorsi sono ancora scoperti'}, tra KOS e altre occasioni.`],['att','Ho già un’attività in mente','La racconto e mi aiuti a capire cosa posso osservarci.']].map(([k,t,d])=>`<button type="button" class="opt${S.porta===k?' on':''}" onclick="S.porta='${k}';wr()"><b>${t}</b><small>${d}</small></button>`).join('')}</div>`+
  (S.porta==='scop'?`<div class="lbl">Scegli il percorso da cui partire</div>${['P','C','S'].map(a=>{ const L=sc.filter(p=>p[0]===a); return L.length?`<div class="scr"><span class="t${a}">${AMB[a]}</span>${L.map(p=>`<button class="chip a${a}${S.main===p?' on':''}" onclick="S.main='${p}';S.amb='${a}';wr()">${esc(PID[p].n)}</button>`).join('')}</div>`:''; }).join('')||'<div class="box tip">Hai già osservato tutti i percorsi almeno una volta.</div>'}`:''); },
 mom(){ const m=momObj(); return H('In che momento dell’anno cade?','Scegli la tappa più vicina: ti dico cosa offre quel periodo e lo uso per i suggerimenti.')+
  `<div class="opts">${MOM.map(x=>`<button type="button" class="opt${S.mom===x.k?' on':''}" onclick="S.mom='${x.k}';wr()"><b>${x.t}</b><small>${x.q}</small></button>`).join('')}</div>`+
  (S.mom==='altro'?`<div class="row2"><label class="fl">Quando<input type="text" value="${esc(S.momTxt)}" oninput="S.momTxt=this.value" placeholder="Per esempio: dopo l’uscita di Pattuglia"></label><label class="fl">In che mese<select onchange="S.momMese=this.value;wr()"><option value="">scegli</option>${MESI.map(x=>`<option${S.momMese===x?' selected':''}>${x}</option>`).join('')}</select></label></div>`:'')+
  (m?`<div class="box tip"><b>Cosa offre questo periodo.</b> ${m.sp}${autunno()?'<br><b>È il periodo del Percorso Promessa:</b> più avanti potrai decidere se agganciare l’attività.':''}</div>`:''); },
 dom(){ if(S.porta==='att') return H('Racconta l’attività che hai in mente','Cosa succede, con quali consegne, in quali momenti. Ti aiuto a capire cosa ci puoi osservare.')+`<textarea rows="6" oninput="setq('dom',this.value);domLive()" placeholder="Per esempio: le squadre diventano botteghe di un mercato e devono scambiarsi servizi; nessuno è incaricato di guidare…">${esc(S.dom)}</textarea><div id="domlive">${domLiveHTML()}</div>`;
  const pre=S.porta==='scop'&&S.main?`<div class="box tip">Parti da <b>${esc(PID[S.main].n)}</b>: ${esc(INDICE.LENTE[S.main])}. Cosa vorresti capire, del tuo gruppo, su questo?</div>`:'';
  return H('Che cosa hai voglia di chiederti del gruppo?','Scrivilo come ti viene, anche come sospetto. Qualcosa che senti l’urgenza di osservare, o che hai notato e su cui vuoi scendere più in profondità.')+pre+
  `<textarea rows="4" oninput="setq('dom',this.value);domLive()" placeholder="Per esempio: mi chiedo se, quando manca un capo designato, qualcuno prende l’iniziativa o aspettano tutti">${esc(S.dom)}</textarea><div id="domlive">${domLiveHTML()}</div>
  <div class="box q"><b>Ora la domanda scomoda.</b> Se il tuo sospetto fosse sbagliato, che cosa vedresti?<textarea rows="2" oninput="setq('contro',this.value)" placeholder="Per esempio: vedrei qualcuno che propone, anche a bassa voce, e gli altri che lo seguono">${esc(S.contro)}</textarea><small>Serve a non cercare solo le prove che ti danno ragione. La ritroverai nel laboratorio dei focus.</small></div>`; },
 amb(){ const r=motore(testoDom()); const tot={P:0,C:0,S:0}; r.slice(0,6).forEach(x=>tot[x.id[0]]+=x.score); const best=Object.entries(tot).sort((a,b)=>b[1]-a[1])[0]; const sc=scoperti();
  return H('La tua domanda riguarda di più…','Scegli la risposta più vicina: è solo il punto di partenza, potrai aggiungere percorsi di altri Ambiti.')+
  `<div class="opts three">${['P','C','S'].map(a=>{ const ns=sc.filter(p=>p[0]===a).length; return `<button type="button" class="opt a${a}${S.amb===a?' on':''}" onclick="S.amb='${a}';S.area='';wr()"><b>${Q_AMB[a]}</b><small><span class="t${a}">Sviluppo ${AMB[a]}</span>${best[1]&&best[0]===a?' · <span class="tagok">il più vicino alla tua domanda</span>':''}</small><small>${ns?ns+(ns===1?' percorso ancora scoperto':' percorsi ancora scoperti'):'tutti già osservati almeno una volta'}</small></button>`; }).join('')}</div>`+
  (!S.dom.trim()&&S.porta!=='scop'?'<div class="box warn">Non hai scritto la domanda: torna indietro, i suggerimenti funzionano molto meglio.</div>':''); },
 perc(){ return percView(); },
 ctx(){ const m=momObj(); return H('In che contesto vuoi osservare?','Il contesto decide cosa riesci a vedere.')+(S.fr&&S.fr.sit?`<div class="box q small">Nella tua domanda c’è già una situazione: «${esc(S.fr.sit)}».</div>`:'')+
  `<div class="opts">${CTX.map(c=>`<button type="button" class="opt${S.ctx===c.k?' on':''}" onclick="S.ctx='${c.k}';wr()"><b>${c.t}${m&&m.ctx===c.k?' <em>suggerito per il periodo</em>':''}</b><small>${c.d}</small></button>`).join('')}</div>`+(S.ctx?`<div class="box tip">${CTX.find(c=>c.k===S.ctx).v}</div>`:'')+ctxHint(); },
 dur(){ const c=capacita(); return H('Quanto dura?','Tieni conto anche del tempo per raccogliere gli appunti subito dopo.')+`<div class="pills">${DUR.map(([k,t])=>`<button type="button" class="pill${S.dur===k?' on':''}" onclick="S.dur=${k};wr()">${t}</button>`).join('')}</div>`+
  (S.dur?`<div class="box tip">Con ${DUR.find(d=>d[0]===S.dur)[1]} potete seguire bene <b>${c.max===1?'un solo focus':'fino a '+c.max+' focus'}</b>. Lo ricalcolo quando mi dici quante persone e quanti osservatori ci sono.${S.dur<=15?' Un momento così breve funziona bene come momento di soglia o come domanda in chiusura.':''}${S.dur>=240?' In una giornata lunga alterna focus diversi in momenti diversi, come fa il terzo incontro del KOS.':''}</div>`:''); },
 foc(){ return focView(); }, oss(){ return ossView(); },
 str(){ const P=percs(); const cons=STR.filter(s=>s.f.some(f=>P.includes(f)));
  return H('Quali Strumenti del Metodo ti aiutano a vederlo?',`Declinati per il ${BR[B].u}. Quelli segnati illuminano meglio i tuoi percorsi: è una bozza di collegamento, da validare.`)+
  `<div class="list">${[...cons,...STR.filter(s=>!cons.includes(s))].map(s=>{ const on=S.strum.includes(s.k), rec=cons.includes(s); const inc=(INCL[s.k]||{})[B];
   return `<label class="row${on?' on':''}"><input type="checkbox" ${on?'checked':''} onchange="tog(S.strum,'${s.k}')"><span><b>${s.t}</b>${rec?' <span class="tagok">per i tuoi percorsi</span>':''}<small class="decl">${s.d[B]}</small><small>Fa vedere bene: ${s.v}.</small>${on&&inc?`<small class="incl">Attenzione all’inclusione: ${inc}</small>`:''}</span></label>`; }).join('')}</div>`; },
 tipo(){ return tipoView(); },
 ag(){ return H('Vuoi agganciarla al Percorso Promessa?','Siamo nel periodo giusto. «Nessuno» è una scelta legittima: il KOS lo dice chiaramente, a volte un aggancio forzato inquina l’osservazione.')+
  `<div class="opts three">${[['nessuno','Nessuno','l’attività resta pura'],['leggero','Leggero','una domanda in più in chiusura'],['profondo','Profondo','una cornice tematica esplicita']].map(([k,t,d])=>`<button type="button" class="opt${S.ag===k?' on':''}" onclick="S.ag='${k}';wr()"><b>${t}</b><small>${d}</small></button>`).join('')}</div>`+
  (S.ag==='leggero'?'<div class="box tip">Una sola domanda di chiusura che colleghi l’esperienza a una Parola del Percorso Promessa di Branca, senza cambiare la meccanica.</div>':S.ag==='profondo'?'<div class="box tip">Il KOS lo riserva ad attività che hanno già una struttura vicina (per esempio dilemma → argomentazione → voto e la Legge). Il focus non cambia: cambia la cornice.</div>':''); },
 fog(){ return fogView(); }
};

// ── Domanda: suggerimenti, esempi, frase restituita ──
function nomiIn(t){ return [...String(t).matchAll(/(?:^|[^.!?\s]\s+)([A-Z][a-zà-ù]{2,})/g)].map(m=>m[1]).filter(x=>!/^(Mi|Ho|Il|La|Lo|Le|Gli|In|Al|Nel|Nei|Quando|Durante|Credo|Vorrei|Sembra|Dopo|Prima|Branco|Reparto|Compagnia|Pattuglia|Pattuglie|Muta|Mute|Ronda|Ronde|Legge|Promessa|Dio|Esploratori|Esploratrici|Lupetti|Lupette|Rover|Consiglio)$/.test(x)); }
function domLiveHTML(){ let h=''; const n=nomiIn(S.dom); const att=S.porta==='att';
  if(n.length) h+=`<div class="box warn">Mi sembra di vedere un nome (${esc(n.slice(0,2).join(', '))}). Scrivi senza nomi: osservi situazioni e comportamenti, non persone da etichettare.</div>`;
  const r=motore(S.dom);
  if(S.dom.trim().length>15){ h+=r.length?`<div class="hint">Ci sento dentro: ${r.slice(0,3).map(x=>`<b class="t${x.id[0]}">${esc(PID[x.id].n)}</b>`).join(' · ')}</div>`:'<div class="hint">Ancora non ci sento un percorso: prova a dire cosa fanno, e in quale situazione.</div>';
   if(!att&&JG.test(S.dom)) h+=`<div class="hint warnt">«${esc(S.dom.match(JG)[0])}» è già un giudizio: va benissimo come sospetto, ma è un’ipotesi da verificare.</div>`; }
  if(!att){ S.fr=frase(S.dom,B);
   if(S.fr) h+=`<div class="box fr"><b>Ho capito così</b> <small>(correggi pure: lo userò per preparare il laboratorio dei focus)</small>
    <div class="frg"><label class="fl">Chi<input value="${esc(S.fr.chi)}" oninput="S.fr.chi=this.value"></label><label class="fl">In quale situazione<input value="${esc(S.fr.sit)}" oninput="S.fr.sit=this.value" placeholder="quando… / durante…"></label><label class="fl">Cosa fanno, o non fanno<input value="${esc(S.fr.cosa)}" oninput="S.fr.cosa=this.value"></label></div>
    <label class="cbx"><input type="checkbox" ${S.useFr?'checked':''} onchange="S.useFr=this.checked"> Usalo come punto di partenza nel laboratorio</label></div>`;
   const ex=S.dom.trim().length>15?esempiVicini(S.dom,r,4):[];
   const ins=!S.dom.trim()?Object.entries(ESEMPI).filter((x,i)=>i%4===1).slice(0,6).map(([p,a])=>({p,e:a[0]})):[];
   const L=ex.length?ex:ins;
   if(L.length) h+=`<div class="exs"><div class="lbl">${ex.length?'Altre persone che fanno il Capo si chiedono…':'Non sai da dove partire? Ecco cosa si chiedono altri staff'} <small>(tocca quello che ti somiglia)</small></div>${L.map(x=>`<button class="ex" onclick="usaEsempio('${x.p}',this.dataset.e)" data-e="${esc(x.e)}">«${esc(x.e)}»<small class="t${x.p[0]}">${esc(PID[x.p].n)}</small></button>`).join('')}</div>`; }
  return h; }
function domLive(){ const e=$('domlive'); if(!e) return; const a=document.activeElement; e.innerHTML=domLiveHTML(); }
function usaEsempio(p,e){ if(!S.dom.trim()) S.dom=e; S.main=p; S.amb=p[0]; S.exP=p; wr(); toast('Percorso principale: '+PID[p].n); }
function ctxHint(){ const I=percs().flatMap(idrOf); if(!I.length) return ''; const nB=I.filter(x=>x.c==='B').length, nA=I.filter(x=>x.c==='A').length;
  if((S.ctx==='libera'||S.ctx==='soglia')&&nB>nA) return `<div class="box warn">Per i tuoi percorsi molti indicatori sono ${visTag('B')}: in uno spazio libero rischi di non vederli. Valuta un contesto misto.</div>`; return ''; }

// ── Percorso: area, principale, «Osservi anche» ──
function percView(){ if(!S.amb) return H('Prima rispondi alla domanda precedente','')+'<div class="box warn">Torna al passo precedente.</div>';
  const P=punteggi(); const V=Object.fromEntries(P.map(x=>[x.id,x])); const amb=S.amb; const r=motore(testoDom());
  const aree=AREE[amb]; const areaBest=aree.map(([t,ids])=>[t,ids.reduce((s,i)=>s+(V[i].m?V[i].m.score:0),0)]).sort((a,b)=>b[1]-a[1])[0];
  const list=P.filter(x=>x.id[0]===amb).map(x=>PID[x.id]); const amb2=ambiguita(r); const other=P.filter(x=>x.id[0]!==amb&&x.m&&x.m.score>=2).slice(0,3);
  const mp=momObj()?.p||[];
  const card=p=>{ const x=V[p.id]; const m=x.m; const on=S.main===p.id; const al=S.also.includes(p.id); const v=visCount(p.id); const n=nOcc(p.id);
    return `<div class="prc a${p.id[0]}${on?' main':''}${al?' also':''}"><span class="pid">${p.id}</span><span class="pn"><b>${esc(p.n)}</b>${m&&m.hits.length?`<small class="why">Hai scritto: «${esc(m.hits.slice(0,3).join('», «'))}»</small>`:''}<small class="obs">${nInd(v.A,v.n)}</small></span>
     <span class="tags">${m&&m.score>=3?'<span class="tagok">dalla tua domanda</span>':''}${S.exP===p.id?'<span class="tagok">dal tuo esempio</span>':''}${n?`<span class="tagn">osservato · ${n}</span>`:'<span class="tagx">non ancora osservato</span>'}${mp.includes(p.id)?'<span class="tagp">adatto al periodo</span>':''}</span>
     <span class="acts"><button type="button" class="pill sm${on?' on':''}" onclick="setMain('${p.id}')">${on?'✓ principale':'Principale'}</button><button type="button" class="pill sm${al?' on':''}" onclick="setAlso('${p.id}')">${al?'✓ osservi anche':'Osservi anche'}</button></span></div>`; };
  const area=S.area?(aree.find(a=>a[0]===S.area)||[])[1]:null;
  const top=area?list.filter(p=>area.includes(p.id)):list.slice(0,3); const rest=list.filter(p=>!top.includes(p));
  return H('Quale percorso?','Scegli un percorso principale, quello che risponde alla tua domanda. Poi, se vuoi, aggiungi gli altri che l’attività può osservare: anche di altri Ambiti.')+
  `<div class="lbl">Dentro lo Sviluppo ${AMB[amb]}, ti interessa di più…</div><div class="pills">${aree.map(([t])=>`<button class="pill${S.area===t?' on':''}" data-v="${esc(t)}" onclick="S.area=S.area===this.dataset.v?'':this.dataset.v;wr()">${esc(t)}${!S.area&&areaBest[1]&&areaBest[0]===t?' <small>· vicino alla tua domanda</small>':''}</button>`).join('')}</div>`+
  (amb2&&!S.disamb?`<div class="box q"><b>Sono indeciso tra due strade.</b> La tua domanda parla più di…<div class="pills" style="margin-top:6px"><button class="pill" onclick="S.disamb='${amb2.a}';setMain('${amb2.a}')">${esc(amb2.qa)}</button><button class="pill" onclick="S.disamb='${amb2.b}';if('${amb2.b}'[0]!==S.amb)S.amb='${amb2.b}'[0];setMain('${amb2.b}')">${esc(amb2.qb)}</button></div></div>`:'')+
  `<div class="plist">${top.map(card).join('')}</div>`+(rest.length?`<details class="more-p"><summary>Gli altri ${rest.length} percorsi dello Sviluppo ${AMB[amb]}</summary><div class="plist">${rest.map(card).join('')}</div></details>`:'')+
  (other.length?`<div class="lbl" style="margin-top:14px">La tua domanda tocca anche altri Ambiti</div><div class="plist">${other.map(x=>card(PID[x.id])).join('')}</div>`:'')+
  `<details class="box"><summary>Non trovi quello che cerchi? Esplora per temi</summary><div class="temi">${['P','C','S'].map(a=>`<div><div class="lbl t${a}">Sviluppo ${AMB[a]}</div>${PERC.filter(p=>p.id[0]===a).map(p=>`<button type="button" class="tema${percs().includes(p.id)?' on':''}" onclick="${S.main?`setAlso('${p.id}')`:`setMain('${p.id}')`}"><b>${esc(p.n)}</b><small>${esc(INDICE.LENTE[p.id])}</small></button>`).join('')}</div>`).join('')}</div></details>`+
  (S.main?coocHTML():'')+VIS_LEGENDA; }
function setMain(id){ if(S.main===id){ S.main=''; } else { if(S.main&&!S.also.includes(S.main)) S.also.unshift(S.main); S.main=id; S.also=S.also.filter(x=>x!==id); } wr(); }
function setAlso(id){ if(id===S.main) return; tog(S.also,id); if(S.also.length>4&&S.also.includes(id)) toast('Tanti percorsi: va bene, ma i focus consigliati restano pochi'); }
function coocHTML(){ const c=(COOC[S.main]||[]).filter(([p])=>!percs().includes(p)).slice(0,4); if(!c.length) return '';
  return `<div class="box"><b>Nel KOS, ${esc(PID[S.main].n)} si osserva spesso insieme a:</b><div class="pills" style="margin-top:6px">${c.map(([p,n])=>`<button class="pill sm" onclick="setAlso('${p}')">+ ${esc(PID[p].n)} <small>(${n} attività${nOcc(p)?'':' · non ancora osservato'})</small></button>`).join('')}</div></div>`; }

// ── Laboratorio dei focus ──
function focSentence(){ const L=S.lab; if(!L.verbo&&!L.ogg) return '';
  if(!L.verbo&&/^(qualcuno|nessuno|alcun[ie]|tutti|tutte|chi|ognuno|ognuna)\b/i.test(L.ogg)) return ('Osservo se'+(L.cond?' '+L.cond+',':'')+' '+L.ogg+'.').replace(/\s+/g,' ');
  return ('Osservo se e come '+[L.chi||BR[B].r,L.verbo,L.ogg,L.cond].filter(Boolean).join(' ')+'.').replace(/\s+/g,' '); }
function labDaDomanda(){ const f=S.fr; if(!f) return; Object.assign(S.lab,{chi:f.chi,verbo:'',ogg:f.cosa,cond:/^(quando|mentre|ogni volta)/.test(f.sit)?f.sit:(f.sit||''),cls:'',man:false,fromFr:true}); }
function focView(){ const P=percs(); if(!P.length) return H('Il laboratorio dei focus','')+'<div class="box warn">Prima scegli almeno un percorso (passo 5).</div>';
  const L=S.lab; if(!L.pid||!P.includes(L.pid)) L.pid=P[0];
  if(!S.foc.length&&S.useFr&&S.fr&&!L.fromFr&&!L.verbo&&!L.ogg) labDaDomanda();
  const I=idrOf(L.pid); const vIdr=[...new Set(I.map(x=>x.v))]; const sent=L.man?L.txt:focSentence();
  const pzs=(arr,key,more)=>arr.map(([x,base])=>(base||more||L[key]===x)?`<button type="button" class="pz${L[key]===x?' on':''}" data-v="${esc(x)}" onclick="labSet('${key}',this.dataset.v)">${esc(x)}</button>`:'').join('');
  const chiAll=CHI(B).slice(); if(L.chi&&!chiAll.some(c=>c[0]===L.chi)) chiAll.unshift([L.chi,1]);
  const condAll=COND.slice(); if(L.cond&&!condAll.some(c=>c[0]===L.cond)) condAll.unshift([L.cond,1]);
  return H('Il laboratorio dei focus','Costruisci il focus a mattoncini, oppure parti da un indicatore del percorso e trasformalo. Il risultato lo puoi riscrivere come vuoi.')+
  (L.fromFr&&!S.foc.length?`<div class="box q small">Ho preparato i mattoncini partendo dalla tua domanda. Ora scegli un verbo che si vede, o riscrivi «Che cosa».</div>`:'')+
  (S.contro.trim()?`<div class="box q small">La tua prova contraria: «${esc(S.contro)}». Tienila in un focus o tra gli appunti.</div>`:'')+
  `<div class="lab">
   <div class="lrow"><span class="lk">Per quale percorso</span>${P.map(p=>`<button type="button" class="pz pc${L.pid===p?' on':''}" onclick="S.lab.pid='${p}';wr()">${esc(PID[p].n)}</button>`).join('')}</div>
   <div class="lrow"><span class="lk">Chi</span>${pzs(chiAll,'chi',L.showChi)}<button class="more" onclick="S.lab.showChi=!S.lab.showChi;wr()">${L.showChi?'meno':'altri…'}</button></div>
   <div class="lrow"><span class="lk">Fa cosa</span><span class="grp">dagli indicatori</span>${vIdr.slice(0,8).map(x=>`<button type="button" class="pz idr${IN.test(x)?' risky':''}${L.verbo===x?' on':''}" ${IN.test(x)?'title="Verbo che descrive un pensiero: se lo usi, traducilo in gesti e parole"':''} data-v="${esc(x)}" onclick="labSet('verbo',this.dataset.v)">${esc(x)}</button>`).join('')}
     <details class="morev"><summary>Altri verbi che si vedono, per famiglia</summary>${Object.entries(VERBI).map(([g,a])=>`<div><span class="grp">${g}</span>${a.map(x=>`<button type="button" class="pz${L.verbo===x?' on':''}" data-v="${esc(x)}" onclick="labSet('verbo',this.dataset.v)">${esc(x)}</button>`).join('')}</div>`).join('')}</details></div>
   <div class="lrow"><span class="lk">Che cosa</span><input type="text" value="${esc(L.ogg)}" oninput="S.lab.ogg=this.value;S.lab.man=false;labLive()" placeholder="per esempio: un compito ai compagni">
     <div class="sugg">${I.map((x,k)=>`<button type="button" class="pz mini" onclick="labIdr(${k})" title="${esc(x.t)}">${visTag(x.c,true)} ${esc(x.o.length>60?x.o.slice(0,60)+'…':x.o)}</button>`).join('')}</div></div>
   <div class="lrow"><span class="lk">Quando</span>${pzs(condAll,'cond',L.showCond)}<button class="more" onclick="S.lab.showCond=!S.lab.showCond;wr()">${L.showCond?'meno':'altre…'}</button></div>
   <div class="ldice"><button type="button" class="dice" onclick="dado()">🎲 Pesca un focus a caso</button>${S.fr?'<button type="button" class="btn-ghost sm" onclick="labDaDomanda();wr()">Riparti dalla tua domanda</button>':''}<small>Prova finché non ne esce uno che ti fa venire un’idea.</small></div>
   <div class="lout"><span class="lk">Il tuo focus</span><textarea id="ftxt" rows="2" oninput="S.lab.txt=this.value;S.lab.man=true;labChk()">${esc(sent)}</textarea><div id="fchk">${chkHTML(sent)}</div>${L.cls?`<div class="small">Questo indicatore: ${visTag(L.cls)} — ${VIS[L.cls].d}</div>`:''}
   <button type="button" class="btn-primary" onclick="focAdd()">+ Aggiungi questo focus</button></div>
  </div><div id="flist">${focListHTML()}</div>${VIS_LEGENDA}
  <details class="box"><summary>La postura di chi osserva (leggila una volta)</summary><ul>
   <li><b>Scrivi ciò che vedi e senti</b>, non ciò che pensi che provino: «ha proposto tre soluzioni», non «è creativo».</li><li><b>Cerca anche il contrario</b> del tuo sospetto: è la tua prova contraria.</li>
   <li><b>Guarda tutte le persone</b>: chi spicca ruba lo sguardo, chi è silenzioso sparisce.</li><li><b>Prima le capacità, poi i limiti</b>: cosa riesce a fare, con quale aiuto.</li>
   <li><b>Molti linguaggi</b>: chi parla poco può mostrarsi con le mani, il corpo, il disegno. Prevedilo.</li><li><b>Non diagnosticare</b>: descrivi un comportamento in una situazione, non definisci una persona.</li>
   <li><b>Un momento solo non basta</b> per dire che un percorso è osservato: cerca un secondo contesto.</li><li><b>Verbi sì</b>: propongono, chiedono, scelgono, aiutano, interrompono, cambiano strategia. <b>Verbi da tradurre</b>: ${VERBI_NO.join(', ')}.</li></ul></details>`; }
function labSet(k,v){ S.lab[k]=S.lab[k]===v?'':v; S.lab.man=false; wr(); }
function labIdr(k){ const x=idrOf(S.lab.pid)[k]; S.lab.verbo=x.v; S.lab.ogg=x.o.charAt(0).toLowerCase()+x.o.slice(1); S.lab.cls=x.c; S.lab.man=false; wr(); }
function labLive(){ const e=$('ftxt'); if(e&&!S.lab.man) e.value=focSentence(); labChk(); }
function labChk(){ const e=$('fchk'); if(e) e.innerHTML=chkHTML($('ftxt').value); }
function chkHTML(t){ if(!t.trim()) return ''; const j=t.match(JG), n=t.match(IN); let s0=t.replace(/^Osservo se e come /,''); CHI(B).forEach(([c])=>{ s0=s0.replace(c,''); }); const and=(s0.match(/\se\s|,/g)||[]).length;
  return [j?['no',`«${j[0]}» è un giudizio: descrivi cosa fanno, non come sono.`]:['ok','Nessun giudizio.'], n?['no',`«${n[0]}» descrive un pensiero: cosa vedresti o sentiresti, invece?`]:['ok','Si vede con occhi e orecchie.'], and>=2?['no','Sembrano più cose insieme: prova a tenerne una sola.']:['ok','Una cosa sola.']].map(([c,x])=>`<div class="ck ${c}">${c==='ok'?'✓':'!'} ${x}</div>`).join(''); }
function dado(){ const L=S.lab; const I=idrOf(L.pid).filter(y=>y.c!=='D'); L.chi=pick(CHI(B))[0];
  if(I.length&&Math.random()<0.65){ const x=pick(I); L.verbo=x.v; L.ogg=x.o.charAt(0).toLowerCase()+x.o.slice(1); L.cls=x.c; } else { L.verbo=pick(Object.values(VERBI).flat()); L.ogg=pick(['un compito ai compagni','le idee degli altri','il materiale','chi è in difficoltà','una regola del gioco','un ruolo nella '+BR[B].sq1]); L.cls=''; }
  L.cond=pick(COND)[0]; L.man=false; L.fromFr=true; wr(); }
function focAdd(){ const t=($('ftxt').value||'').trim(); if(!t||/…/.test(t)){ toast('Completa prima il focus'); return; }
  const tocca=motore(t.replace(/^Osservo se e come /,'')).filter(x=>!percs().includes(x.id)&&x.score>=2).slice(0,2).map(x=>x.id);
  S.foc.push({txt:t,cls:S.lab.cls||'',pid:S.lab.pid,extra:[],tocca,sp:'Lo fanno da sé, senza che nessuno lo chieda.',st:'Lo fanno dopo una domanda, un invito o un cambio di regola.',na:'Non lo fanno nemmeno quando lo stimolo c’è.'});
  Object.assign(S.lab,{chi:'',verbo:'',ogg:'',cond:'',cls:'',man:false,txt:''}); wr(); toast('Focus aggiunto'); }
function focLink(i,p){ const f=S.foc[i]; f.extra.push(p); f.tocca=f.tocca.filter(x=>x!==p); if(!S.also.includes(p)&&S.main!==p) S.also.push(p); wr(); toast('Collegato: '+PID[p].n); }
function focNo(i,p){ S.foc[i].tocca=S.foc[i].tocca.filter(x=>x!==p); wr(); }
function focListHTML(){ if(!S.foc.length) return ''; const c=capacita();
  return `<h3>I tuoi focus <small>(${S.foc.length}${S.dur?' · consigliati fino a '+c.max:''})</small></h3>`+S.foc.map((f,i)=>`<div class="fitem"><div class="ft"><b>${i+1}.</b><span class="fx" contenteditable="true" onblur="S.foc[${i}].txt=this.textContent">${esc(f.txt)}</span><button type="button" class="x" aria-label="Togli focus" onclick="S.foc.splice(${i},1);wr()">×</button></div>
   <div class="fmeta">${[f.pid,...f.extra].map(p=>pchip(p)).join(' ')} ${visTag(f.cls)}</div>
   ${f.tocca.map(p=>{ const v=visCount(p); return `<div class="tocca">Questo focus tocca anche <b>${esc(PID[p].n)}</b> <small>(${nInd(v.A,v.n)}${nOcc(p)?'':' · non ancora osservato'})</small> <button class="pill sm" onclick="focLink(${i},'${p}')">Collega</button><button class="lnk" onclick="focNo(${i},'${p}')">no, grazie</button></div>`; }).join('')}
   <details><summary>Come capisco se è spontaneo, stimolato o non adottato</summary><div class="sna"><label class="fl">Spontaneo (2)<input value="${esc(f.sp)}" oninput="S.foc[${i}].sp=this.value"></label><label class="fl">Stimolato (1)<input value="${esc(f.st)}" oninput="S.foc[${i}].st=this.value"></label><label class="fl">Non adottato (0)<input value="${esc(f.na)}" oninput="S.foc[${i}].na=this.value"></label></div></details></div>`).join('')+
  (S.foc.length>c.max?`<div class="box warn">Sono più focus di quelli che riuscirete a seguire con ${S.dur?'questa durata':'una durata media'}: valuta di restringere, o di dividerli tra gli osservatori.</div>`:''); }

// ── Persone e osservatori ──
function ossView(){ const c=capacita(); return H('Quante persone e chi osserva?','Così capiamo se l’osservazione sarà completa o parziale.')+
  `<label class="fl w1">Quante persone dell’Unità ci saranno<input type="number" min="1" max="60" value="${esc(S.nR)}" oninput="S.nR=this.value;ossLive();lente()" placeholder="20"></label>
  <div class="lbl">Chi osserva <small>(dallo staff; puoi aggiungere altre persone e toglierle)</small></div>
  <div class="list">${S.oss.map((o,i)=>`<div class="row${o.on?' on':''}"><label><input type="checkbox" ${o.on?'checked':''} onchange="S.oss[${i}].on=this.checked;wr()"> <b>${esc(o.n)}</b>${o.staff?'':' <small>(aggiunta)</small>'}</label>${o.on?`<label class="cd"><input type="checkbox" ${o.cond?'checked':''} onchange="S.oss[${i}].cond=this.checked;wr()"> conduce l’attività</label>`:''}${o.staff?'':`<button type="button" class="x" aria-label="Togli ${esc(o.n)}" onclick="S.oss.splice(${i},1);wr()">×</button>`}</div>`).join('')}
  <div class="row add"><input type="text" id="newoss" placeholder="Altra persona (per esempio un Senior, il Capo Gruppo)" onkeydown="if(event.key==='Enter')ossAdd()"><button type="button" class="btn-ghost" onclick="ossAdd()">+ Aggiungi</button></div></div><div id="osslive">${ossLiveHTML(c)}</div>`; }
function ossAdd(){ const v=($('newoss').value||'').trim(); if(!v) return; S.oss.push({n:v,on:true,staff:false,cond:false}); wr(); }
function ossLiveHTML(c){ c=c||capacita(); if(!c.obs) return '<div class="box warn">Nessuno osserva: scegli almeno una persona.</div>';
  const lab={completa:'Completa: potete seguire anche le singole persone.',parziale:'Parziale: potete seguire piccoli gruppi, non tutte le persone.','solo il gruppo':'Solo il gruppo: vedrete le dinamiche d’insieme.','?':'Indica quante persone ci saranno.'}[c.cop];
  return `<div class="meter"><div><small>Osservazione</small><b>${esc(c.cop)}</b></div><div><small>Focus consigliati</small><b>${c.max}</b></div><div><small>Osservatori consigliati</small><b>${c.cons||'—'}</b></div></div>
  <div class="box ${c.cop==='completa'?'tip':c.cop==='?'?'':'warn'}">${lab}${S.foc.length>c.max?` Avete ${S.foc.length} focus: sono più di quelli che riuscirete a seguire.`:''}${c.sug.length?'<ul>'+c.sug.map(x=>`<li>${x}</li>`).join('')+'</ul>':''}</div><p class="note">Regole pratiche da tarare con l’esperienza: circa 8 persone per osservatore; chi conduce vale metà.</p>`; }
function ossLive(){ const e=$('osslive'); if(e) e.innerHTML=ossLiveHTML(); }

// ── Tipo di attività ──
function stimolo(){ const cs=S.foc.map(f=>f.cls).filter(Boolean); const src=cs.length?cs:percs().flatMap(p=>PID[p].c); const out=[];
  if(src.includes('A')) out.push(['A','Lascia fare: guarda e annota, senza intervenire.']); if(src.includes('B')) out.push(['B','Senza una domanda, un dilemma o un giro di racconto non lo vedrai: mettilo nella Conclusione o dentro il gioco.']);
  if(src.includes('C')) out.push(['C','Prevedi un secondo momento, anche breve, e confronta.']); if(src.includes('D')) out.push(['D','Raccogli il racconto delle persone stesse, o di chi le vede altrove.']); return out; }
function tipoView(){ const T=ATT[B]||[]; const want=new Set(S.strum); const st=stimolo(); const verb=st.some(x=>x[0]==='B'); const P=percs();
  const kos=(KOS[B]||[]).filter(a=>a.f.some(f=>P.includes(f))).sort((a,b)=>b.f.filter(f=>P.includes(f)).length-a.f.filter(f=>P.includes(f)).length);
  const rec=T.filter(([g])=>(GMAP[g]||[]).some(x=>want.has(x))||(verb&&(GMAP[g]||[]).includes('VERB'))); const sel=[...S.tipi,S.tipoLib].filter(Boolean);
  return H('Che tipo di attività?',`I tipi di attività del ${BR[B].u}, gli stessi dell’app: anche più di uno, servono a darti idee.`)+
  `<div class="lbl">Quanto stimolo serve per i tuoi focus</div><div class="stim">${st.map(([c,d])=>`<div>${visTag(c)} ${d}</div>`).join('')||'<div>Scegli prima un percorso o un focus.</div>'}</div>`+
  (kos.length?`<details class="box tip" open><summary>Nel KOS ci sono ${kos.length} attività del ${BR[B].u} che osservano i tuoi percorsi</summary><ul>${kos.slice(0,6).map(a=>`<li><b>${esc(a.n)}</b>${a.m?' · '+a.m+' min':''} · ${esc(a.inc)} · osserva ${a.f.filter(f=>P.includes(f)).map(f=>esc(PID[f].n)).join(', ')}${DB_.kosDone.has(a.n)?' · <i>già svolta</i>':''}</li>`).join('')}</ul><small>Puoi prenderne una come base e trasformarla.</small></details>`:'')+
  `<div class="selp">${sel.length?sel.map(x=>`<span class="spill">${esc(x)}</span>`).join(''):'<span class="faint">Nessun tipo scelto.</span>'}</div>`+
  (rec.length?`<div class="lbl">Consigliati per i tuoi strumenti${verb?' e per lo stimolo':''}</div>${grpHTML(rec)}`:'')+
  `<details class="pick"><summary>Scegli tra tutti i tipi di attività della tua Branca <span class="faint">(${S.tipi.length} scelti)</span></summary>${grpHTML(T)}</details>
  <label class="fl w1">Oppure scrivi tu<input type="text" value="${esc(S.tipoLib)}" oninput="S.tipoLib=this.value" placeholder="Per esempio: caccia al tesoro notturna"></label>
  <details class="box"><summary>Tecniche per far emergere ciò che cerchi (dal KOS)</summary><ul><li><b>Cambia le condizioni a metà</b>: gruppi, ruoli, materiali o tempi.</li><li><b>Ribalta i ruoli</b>: chi guida di solito fa l’arbitro.</li><li><b>Sposta lo sguardo</b> dal grande gruppo ai piccoli gruppi.</li><li><b>Osservazione condivisa</b>: due capi sulla stessa dinamica.</li></ul></details>`; }
function grpHTML(G){ return G.map(([g,it])=>`<div class="tgn">${esc(g)}</div><div class="cgrid">${it.map(x=>`<label><input type="checkbox" ${S.tipi.includes(x)?'checked':''} data-v="${esc(x)}" onchange="tog(S.tipi,this.dataset.v)"><span>${esc(x)}</span></label>`).join('')}</div>`).join(''); }

// ── Il foglio ──
function eSe(){ const f=S.foc[0]; const cond=f&&COND.map(c=>c[0]).find(c=>f.txt.includes(c)); const st=STR.find(s=>s.k===S.strum[0]); const m=momObj(); const sB=stimolo().some(x=>x[0]==='B');
  const P=[]; if(cond) P.push(`E se l’attività cominciasse proprio ${cond}?`);
  P.push(`E se a metà ${pick(['cambiassi le squadre','togliessi un materiale indispensabile','dimezzassi il tempo rimasto','chi guida passasse a fare l’arbitro','cambiassi una regola senza preavviso','scambiassi due persone tra '+BR[B].sq])}?`);
  if(st) P.push(`E se usassi come cornice lo strumento «${st.t}»? Per esempio: ${st.d[B].split(', ').slice(0,2).join(' o ')}.`);
  if(sB) P.push(`E se tutto finisse con una sola domanda, ${BR[B].cerchio}: «${pick(DOM_CHIUSURA[B])}»?`);
  if(S.contro.trim()) P.push('E se preparassi una situazione in cui il tuo sospetto potrebbe essere smentito?');
  if(m&&m.k==='campo') P.push('E se non ci fosse un’attività apposta, ma un momento di vita al campo (cucina, smontaggio, sera)?');
  if(S.ctx==='soglia') P.push('E se lo stimolo fosse nascosto in un momento che sembra di pausa?');
  P.push(`E se il gioco fosse raccontato come ${pick(['una missione segreta','una sfida tra '+BR[B].sq,'un mercato','un naufragio','un’indagine','una spedizione','una trasmissione radio','un consiglio di saggi'])}?`);
  P.push(`E se ${pick(['nessuno sapesse le regole tranne una persona','il materiale fosse diviso tra '+BR[B].sq+' e servisse scambiarlo','ci fosse un ruolo segreto','il tempo fosse scandito da un suono','si giocasse in silenzio per i primi minuti'])}?`);
  return P.sort(()=>Math.random()-.5).slice(0,5); }
function nonVedra(){ const r=[]; const src=(S.foc.map(f=>f.cls).filter(Boolean).length?S.foc.map(f=>f.cls):percs().flatMap(p=>PID[p].c));
  if(src.includes('C')) r.push('come cambiano nel tempo: serve un altro momento'); if(src.includes('D')) r.push('ciò che fanno fuori dagli scout');
  if(S.ctx==='strutturata') r.push('cosa farebbero senza la tua consegna'); if(S.ctx==='libera') r.push('come reagiscono a una richiesta precisa');
  const cop=capacita().cop; if(cop==='solo il gruppo'||cop==='parziale') r.push('ogni singola persona: vedrai soprattutto il gruppo'); return r; }
function fogView(){ const m=momObj(); const c=capacita(); const nv=nonVedra();
  if(S.porta==='att'&&!S.svi) S.svi=S.dom;
  const quando=m?(m.k==='altro'?(S.momTxt||'momento scelto da te')+(S.momMese?' ('+S.momMese+')':''):m.t+' · '+m.q):'—';
  const tipo=[...S.tipi,S.tipoLib].filter(Boolean).join(', ')||'—'; const sB=stimolo().some(x=>x[0]==='B');
  return H('Il tuo foglio (non più bianco)','Hai ristretto il campo passo dopo passo. Adesso l’attività la scrivi tu: qui sotto trovi tutto quello che serve per partire.')+
  `<div class="sum"><div class="sc"><small>Quando</small>${esc(quando)}</div><div class="sc"><small>Percorsi</small>${S.main?pchip(S.main,' · principale'):''} ${S.also.map(p=>pchip(p)).join(' ')||''}</div>
   <div class="sc"><small>Contesto e durata</small>${S.ctx?CTX.find(x=>x.k===S.ctx).t:'—'} · ${S.dur?DUR.find(d=>d[0]===S.dur)[1]:'—'}</div>
   <div class="sc w"><small>Cosa guarderai</small>${S.foc.length?'<ol>'+S.foc.map(f=>`<li>${esc(f.txt)} ${visTag(f.cls,true)}</li>`).join('')+'</ol>':'—'}${S.contro?`<em>Prova contraria: ${esc(S.contro)}</em>`:''}</div>
   <div class="sc"><small>Chi osserva</small>${S.oss.filter(o=>o.on).map(o=>esc(o.n)+(o.cond?' (conduce)':'')).join(', ')||'—'} · ${S.nR||'?'} persone · osservazione ${esc(c.cop)}</div>
   <div class="sc"><small>Strumenti e tipo</small>${S.strum.map(k=>STR.find(s=>s.k===k).t).join(', ')||'—'} · ${esc(tipo)}</div>${autunno()?`<div class="sc"><small>Percorso Promessa</small>${S.ag||'—'}</div>`:''}</div>
  <div class="ese"><div class="eh"><b>Spunti per cominciare</b><button type="button" class="btn-ghost sm" onclick="wr()">Altri spunti ↻</button></div>${eSe().map(x=>`<div class="ei">${esc(x)}</div>`).join('')}</div>
  ${sB?`<div class="box q"><b>Domande di chiusura pronte per il ${BR[B].u}</b> (${BR[B].cerchio}):<ul>${DOM_CHIUSURA[B].map(x=>`<li>«${esc(x)}»</li>`).join('')}</ul></div>`:''}
  ${nv.length?`<div class="box">Questa attività <b>non potrà mostrarti</b>: ${nv.join('; ')}.</div>`:''}
  <div class="write"><label class="fl">Nome dell’attività<input type="text" value="${esc(S.nome)}" oninput="S.nome=this.value" placeholder="Dagli un nome che incuriosisca"></label>
   <label class="fl">Lancio<textarea rows="3" oninput="S.lan=this.value" placeholder="Come la presenti, senza svelare cosa osservi? Quale storia, quale sfida?">${esc(S.lan)}</textarea></label>
   <label class="fl">Sviluppo<textarea rows="4" oninput="S.svi=this.value" placeholder="${esc(S.foc[0]?'Dove, nell’attività, metti le condizioni perché si veda: «'+S.foc[0].txt.replace(/^Osservo se e come /,'').replace(/\.$/,'')+'»?':'Cosa succede, passo per passo? Dove metti le condizioni che fanno emergere il focus?')}">${esc(S.svi)}</textarea></label>
   <label class="fl">Conclusione<textarea rows="3" oninput="S.con=this.value" placeholder="${sB?'Qui ci va lo stimolo a parole: quale domanda fai, e come?':'Come chiudi? Ti serve un momento di rielaborazione?'}${S.ag&&S.ag!=='nessuno'?' E l’aggancio al Percorso Promessa.':''}">${esc(S.con)}</textarea></label></div>
  <div class="aa"><button type="button" class="btn-ghost" onclick="rileggi()">Rileggi la mia attività e suggeriscimi altri percorsi</button></div><div id="letta">${lettaHTML()}</div>
  <div class="box ${ROLE==='col'?'q':'tip'}">${ROLE==='col'?'La salvi come <b>proposta</b>: chi è titolare o cotitolare la trova in «Crea le tue attività osservative» e può accettarla o mandarti un suggerimento.':'La salvi come <b>pronta</b>: quando l’avrete fatta, «Segna come svolta» la porta nelle occasioni osservative e nella griglia.'}</div>
  <div class="aa"><button type="button" class="btn-primary" onclick="salva()">${ROLE==='col'?'Salva e proponi':'Salva l’attività'}</button><button type="button" class="btn-ghost" onclick="copia()">Copia tutto</button></div>`; }
function rileggi(){ const t=[S.nome,S.lan,S.svi,S.con].join(' '); if(t.trim().length<30){ toast('Scrivi prima almeno qualche riga dell’attività'); return; }
  S.letta=motore(t).filter(x=>!percs().includes(x.id)&&!S.scart.includes(x.id)&&x.score>=3&&x.hits.length>=2).slice(0,4); $('letta').innerHTML=lettaHTML(); }
function lettaHTML(){ if(!S.letta) return ''; if(!S.letta.length) return '<div class="box tip">Dalla tua attività non emergono altri percorsi oltre a quelli che hai già scelto.</div>';
  return `<div class="box"><b>Leggendo la tua attività, ci vedo anche:</b>${S.letta.map(x=>{ const v=visCount(x.id); return `<div class="tocca">${pchip(x.id)} <small>perché hai scritto «${esc(x.hits.slice(0,3).join('», «'))}» · ${nInd(v.A,v.n)}${nOcc(x.id)?'':' · non ancora osservato'}</small><br><button class="pill sm" onclick="lettaSi('${x.id}')">Lo osservo</button><button class="pill sm" onclick="lettaTema('${x.id}')">Solo come tema</button><button class="lnk" onclick="lettaNo('${x.id}')">no</button></div>`; }).join('')}<small>«Lo osservo» lo aggiunge ai percorsi e ti riporta al laboratorio per scriverne il focus. «Solo come tema» lo annota senza contarlo come osservato.</small></div>`; }
function lettaSi(p){ S.also.push(p); S.letta=S.letta.filter(x=>x.id!==p); S.lab.pid=p; go(visSteps().findIndex(s=>s.k==='foc')); toast('Ora scrivi un focus per '+PID[p].n); }
function lettaTema(p){ S.scart.push(p); S.temi.push(p); S.letta=S.letta.filter(x=>x.id!==p); $('letta').innerHTML=lettaHTML(); toast('Annotato come tema'); }
function lettaNo(p){ S.scart.push(p); S.letta=S.letta.filter(x=>x.id!==p); $('letta').innerHTML=lettaHTML(); }
function salva(){ if(!S.main){ toast('Manca il percorso principale'); return; } if(!S.nome.trim()){ toast('Dai un nome all’attività'); return; }
  DB_.att.unshift({id:Date.now(),nome:S.nome.trim(),autore:ME[ROLE],ruoloAut:ROLE,stato:ROLE==='col'?'proposta':'pronta',main:S.main,also:S.also.slice(),dom:S.porta==='att'?'':S.dom,foc:S.foc.map(f=>f.txt),dur:S.dur,sugg:[],lan:S.lan,svi:S.svi,con:S.con,temi:S.temi});
  wizClose(); renderPage(); document.getElementById('mie').scrollIntoView({behavior:'smooth'}); toast(ROLE==='col'?'Proposta inviata: la trovano in «Crea le tue attività osservative»':'Attività salvata'); }
function copia(){ const t=[S.nome||'Attività osservativa',`Ti chiedi: ${S.dom}`,S.contro?`Prova contraria: ${S.contro}`:'',`Percorsi: ${percs().map(p=>PID[p].n).join(', ')}`,'Focus:',...S.foc.map((f,i)=>`${i+1}. ${f.txt}`),`Lancio: ${S.lan}`,`Sviluppo: ${S.svi}`,`Conclusione: ${S.con}`].filter(Boolean).join('\n');
  try{ navigator.clipboard.writeText(t).then(()=>toast('Copiato'),()=>toast('Il browser non permette di copiare qui')); }catch(e){ toast('Il browser non permette di copiare qui'); } }
document.addEventListener('DOMContentLoaded',()=>{ kosInit(); initAtt(); renderPage(); });
