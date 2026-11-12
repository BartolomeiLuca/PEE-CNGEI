/*OSS-BEGIN*/
// ═══ Attività osservative proprie («Crea le tue attività osservative») ═══
// Le attività stanno in scheda.pp.attOss (oggetto con una chiave per attività: così la sincronizzazione unisce le modifiche di più persone).
// «Aggiungi alle occasioni osservative» aggiunge una riga alle occasioni osservative (scheda.pp.occMan), e da lì tutto il resto (griglia, copertura, Word) funziona come per le altre occasioni.
// Il percorso guidato gira in un riquadro isolato (documento in base64 qui sotto) e dialoga con la pagina con postMessage.
const OSS_STATI = {bozza:['Bozza','b'], proposta:['Proposta','p'], pronta:['Pronta','r'], svolta:['Svolta','s']};
function ossList(){ const o = (scheda && scheda.pp && scheda.pp.attOss) || {}; return Object.keys(o).map(k => o[k]).filter(a => a && a.id).sort((a, b) => (b.at || 0) - (a.at || 0)); }
function ossStore(){ const pp = scheda.pp || (scheda.pp = {}); if(!pp.attOss || typeof pp.attOss !== 'object' || Array.isArray(pp.attOss)) pp.attOss = {}; return pp.attOss; }
function ossRole(){ try{ if(window.BRO) return 'let'; if(szPP()) return 'aut'; const r = CL && CL.ctx && CL.ctx.ruolo; if(!r) return 'tit'; if(r === 'cotitolare') return 'cot'; if(r === 'collaboratore') return 'col'; return 'let'; }catch(e){ return 'tit'; } }
function ossCanCreate(){ return ['tit','cot','col','aut'].indexOf(ossRole()) >= 0; }
function ossCanDirect(){ return ['tit','cot','aut'].indexOf(ossRole()) >= 0; }
function ossMe(){ try{ return clMyName() || String((scheda.pp || {}).nome || '').trim() || (CL.user && CL.user.email) || 'Io'; }catch(e){ return 'Io'; } }
function ossMine(a){ try{ const me = affMe(); if(a.autMail) return a.autMail === me; return a.aut === ossMe(); }catch(e){ return false; } }
function ossPN(id){ return (szPP() ? id + ' ' : '') + kosPName(id); }
function ossTouch(){ try{ _clTouched = true; _clUserAt = Date.now(); }catch(e){} saveData(true); }
function ossNewId(){ return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function ossAllIds(){ return ['P','C','S'].reduce((r, am) => r.concat((DB[am] || []).map(p => p.id)), []); }
function ossStaff(){ try{ return [...new Set(occChiNames())]; }catch(e){ return []; } }
function ossWhen(t){ try{ return attSgFmt(t); }catch(e){ return ''; } }
// destinatari degli avvisi in «Per te»: chi ha il progetto e i co-titolari (per le proposte), o l'autore (per i suggerimenti)
function ossTo(kind, a){ const to = new Set();
  if(kind === 'dir'){ const ow = progOwnerMail(); if(ow) to.add(ow); (CL._mem || []).forEach(m => { if(m.ruolo === 'cotitolare' && m.email) to.add(clLc(m.email)); }); }
  else if(a && a.autMail) to.add(a.autMail);
  to.delete(affMe()); return [...to]; }
function ossAv(kind, az, a, testo){ try{ if(window.BRO || typeof CL === 'undefined' || !CL.ctx) return; ossTo(kind, a).forEach(m => edAvAdd({tipo:'oss', az, a:m, dove:a.nome, testo:testo || '', oid:a.id})); }catch(e){} }

function ossPanelHTML(){
  if(MODE !== 'giovani' || window._stEmb) return '';
  const f = FASCIA; if(!f || !KOS2[f]) return '';
  const role = ossRole(), L = ossList();
  if(role === 'let' && !L.length) return '';
  const pp = scheda.pp || {};
  const cov = obsSources(), sc = ossAllIds().filter(id => !cov[id]);
  const intro = role === 'col' ? 'Puoi creare attività osservative e proporle a chi ha il progetto o è cotitolare: le trovano qui e in «Per te», con il tuo nome.'
    : role === 'let' ? 'Le attività osservative create da chi scrive il progetto.'
    : role === 'aut' ? 'Costruisci attività tue, partendo da una domanda sul gruppo o da ciò che non hai ancora osservato. Quando le hai svolte, entrano nelle occasioni osservative.'
    : 'Costruisci attività tue, partendo da una domanda sul gruppo o da ciò che non hai ancora osservato. Chi collabora può proporti le sue: le trovi qui e in «Per te».';
  const nProp = L.filter(a => a.stato === 'proposta').length;
  const scop = (sc.length && ossCanCreate()) ? `<details class="oss-sc"><summary>Non hai ancora osservato ${sc.length} ${sc.length === 1 ? 'percorso' : 'percorsi'} <span>(tocca un percorso per partire da lì)</span></summary>${['P','C','S'].map(am => { const X = sc.filter(id => id[0] === am); return X.length ? `<div class="oss-sca"><b class="oss-t${am}">Sviluppo ${({P:'Personale',C:'Comunitario',S:'Spirituale'})[am]}</b>${X.map(id => `<button type="button" class="oss-chip a${am}" onclick="ossWizOpen('${id}')">${sEsc(ossPN(id))}</button>`).join('')}</div>` : ''; }).join('')}</details>` : '';
  return `<div class="oss-box" id="oss-panel-in">
    <div class="oss-h"><div><div class="oss-ey">Oltre il KOS</div><h4>Crea le tue attività osservative</h4><p>${intro}</p></div><div class="oss-btns"><button type="button" class="btn-ghost" onclick="anOpen('mine','oss')">🔎 Cerca</button>${ossCanCreate() ? '<button type="button" class="btn-primary" onclick="ossWizOpen()">+ Nuova attività osservativa</button>' : ''}</div></div>
    ${nProp && ossCanDirect() ? `<div class="oss-note">${nProp === 1 ? 'C’è una proposta' : 'Ci sono ' + nProp + ' proposte'} da valutare: accettala per renderla pronta, oppure rispondi con un suggerimento.</div>` : ''}
    ${scop}
    <div class="oss-list">${L.length ? L.map(ossCardHTML).join('') : '<div class="oss-empty">Ancora nessuna attività. Quelle che crei compaiono qui, con chi le ha scritte e a che punto sono.</div>'}</div></div>`;
}
function ossCardHTML(a){
  const st = OSS_STATI[a.stato] || OSS_STATI.pronta, P = [a.main].concat(a.also || []).filter(Boolean);
  const pp = scheda.pp || {}; const orphan = a.stato === 'svolta' && !(pp.occMan || []).some(r => r && r.id === a.occId);
  const acts = ['<button type="button" class="btn-ghost sm" onclick="ossApri(\'' + a.id + '\')">Apri</button>'];
  if(!window.BRO){
    if(a.stato === 'proposta' && ossCanDirect()) acts.push('<button type="button" class="btn-primary sm" onclick="ossAccetta(\'' + a.id + '\')">Accetta la proposta</button>');
    if(a.stato === 'pronta' && ossCanDirect()) acts.push('<button type="button" class="btn-primary sm" onclick="ossSvolta(\'' + a.id + '\')">Aggiungi alle occasioni osservative</button>');
    if(orphan && ossCanDirect()) acts.push('<button type="button" class="btn-primary sm" onclick="ossSvolta(\'' + a.id + '\')">Aggiungi di nuovo alle occasioni osservative</button>');
    if(ossCanPropose(a)) acts.push('<span class="an-prop" style="' + (AN.st !== 'no' ? '' : 'display:none') + '"><button type="button" class="btn-ghost sm" onclick="ossPropose(\'' + a.id + '\')">📚 ' + (a.anAt ? 'Proponi di nuovo' : 'Proponi all’archivio nazionale') + '</button></span>');
    if(!ossMine(a) && !szPP()) acts.push('<button type="button" class="btn-ghost sm" onclick="ossSugg(\'' + a.id + '\')">Suggerisci</button>');
    if(a.stato === 'svolta' && !orphan && ossCanDirect()) acts.push('<button type="button" class="lnk" onclick="ossNonSvolta(\'' + a.id + '\')">Togli dalle occasioni osservative</button>');
    if(ossMine(a) || ossRole() === 'tit' || ossRole() === 'aut') acts.push('<button type="button" class="lnk" onclick="ossDel(\'' + a.id + '\')">Elimina</button>');
  }
  const sg = Object.keys(a.sugg || {}).map(k => Object.assign({k}, a.sugg[k])).sort((x, y) => (x.at || 0) - (y.at || 0));
  return `<div class="oss-card" data-oss="${a.id}"><div class="oss-ch"><span class="oss-st s${st[1]}">${st[0]}</span><b>${sEsc(a.nome)}</b><small>di ${sEsc(a.aut || '—')}${a.stato === 'svolta' && a.data ? ' · svolta il ' + sEsc(grDateTxt(a.data)) : ''}</small></div>
    <div class="oss-cp">${P.map((p, i) => `<span class="oss-pc a${p[0]}">${sEsc(ossPN(p))}${i === 0 ? ' · principale' : ''}</span>`).join(' ')}</div>
    ${a.dom ? `<div class="oss-q">«${sEsc(a.dom)}»</div>` : ''}
    ${orphan ? '<div class="oss-warn">La riga di questa attività non c’è più nelle occasioni osservative (forse l’hai tolta dalla tabella): i percorsi non risultano osservati finché non la rimetti.</div>' : ''}
    ${sg.length ? `<details class="oss-sg"><summary>Suggerimenti ricevuti · ${sg.length}</summary>${sg.map(s => `<div class="oss-sgi"><b>${sEsc(s.da || '')}</b> · ${sEsc(ossWhen(s.at))}<div>${sEsc(s.t)}</div></div>`).join('')}</details>` : ''}
    ${a.anAt ? `<div class="oss-q" style="font-style:normal">Proposta all’archivio nazionale il ${sEsc(grDateTxt(new Date(a.anAt).toISOString().slice(0, 10)))}: lo stato lo vedi in «Cerca › Le mie proposte».</div>` : ''}
    <div class="oss-aa">${acts.join('')}</div></div>`;
}
function ossRefresh(){ const e = document.getElementById('oss-panel'); if(e) e.innerHTML = ossPanelHTML(); }

// ── percorso guidato in un riquadro isolato ──
let _ossDoc = null;
function ossDocText(){ if(_ossDoc) return _ossDoc; const b = (document.getElementById('oss-doc') || {}).textContent || ''; try{ const bin = atob(b.replace(/\s+/g, '')); const u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); _ossDoc = new TextDecoder().decode(u); }catch(e){ _ossDoc = ''; } return _ossDoc; }
function ossRadiciOk(){ try{ return localStorage.getItem('pee_radici_ok') === '1'; }catch(e){ return false; } }
function ossInitPayload(pid){
  const done = (scheda.pp && scheda.pp.kosDone) || {};
  const staff = ossStaff();
  return {oss:1, t:'init', B:FASCIA || 'E', tipo:szPP() ? 'PP' : 'PE', role:ossRole(), me:ossMe(), staff, cov:obsSources(), kosDone:kosActs().filter(a => done[a.key]).map(a => a.n), pid:pid || '',
    radiciAsk:!!(typeof CL !== 'undefined' && CL.sb && CL.user && !window.BRO), optin:ossRadiciOk(), prefill:window._ossPrefill || null};
}
function ossWizOpen(pid, prefill){
  if(!ossCanCreate()) return;
  const txt = ossDocText(); if(!txt){ showToast('Non riesco ad aprire il percorso guidato: ricarica la pagina e riprova.'); return; }
  ossWizClose(true);
  const ov = document.createElement('div'); ov.id = 'oss-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Nuova attività osservativa');
  const fr = document.createElement('iframe'); fr.title = 'Nuova attività osservativa'; fr.setAttribute('allow', 'clipboard-write'); ov.appendChild(fr);
  window._ossPid = pid || ''; window._ossPrefill = prefill || null; window._ossFocus = document.activeElement;
  document.body.appendChild(ov); document.body.classList.add('oss-open'); fr.srcdoc = txt;
  fr.addEventListener('load', () => { try{ fr.contentWindow.focus(); }catch(e){} });
}
function ossWizClose(quiet){ const ov = document.getElementById('oss-ov'); if(ov) ov.remove(); document.body.classList.remove('oss-open'); if(!quiet){ try{ const f = window._ossFocus; if(f && f.focus && document.contains(f)) f.focus(); }catch(e){} } }
window.addEventListener('message', e => {
  const m = e.data; if(!m || !m.oss) return; const fr = document.querySelector('#oss-ov iframe'); if(!fr || e.source !== fr.contentWindow) return;
  if(m.t === 'ready') fr.contentWindow.postMessage(ossInitPayload(window._ossPid), '*');
  else if(m.t === 'close') ossWizClose();
  else if(m.t === 'save') ossSaveFrom(m);
});
document.addEventListener('keydown', e => { if(e.key === 'Escape' && document.getElementById('oss-ov') && !e.defaultPrevented) ossWizClose(); });
const _ossS = (v, n) => String(v == null ? '' : v).slice(0, n);
function ossSaveFrom(m){
  const x = m.att; if(!x || typeof x !== 'object' || !_ossS(x.nome, 5).trim() || !/^[PCS][1-8]$/.test(String(x.main))) return;
  if(!ossCanCreate()) return;
  const ids = ossAllIds(); const role = ossRole(), id = ossNewId();
  const a = {id, nome:_ossS(x.nome, 120).trim(), aut:ossMe(), autMail:affMe(), ruolo:role, stato:role === 'col' ? 'proposta' : 'pronta', main:String(x.main),
    also:(Array.isArray(x.also) ? x.also : []).map(String).filter(p => ids.indexOf(p) >= 0 && p !== x.main).slice(0, 8),
    dom:_ossS(x.dom, 600), foc:(Array.isArray(x.foc) ? x.foc : []).map(f => _ossS(f, 300)).slice(0, 8), dur:Math.max(0, Math.min(600, +x.dur || 0)),
    lan:_ossS(x.lan, 4000), svi:_ossS(x.svi, 6000), con:_ossS(x.con, 4000), temi:(Array.isArray(x.temi) ? x.temi : []).map(String).filter(p => ids.indexOf(p) >= 0).slice(0, 8), at:Date.now(), sugg:{}};
  ossStore()[id] = a;
  if(role === 'col') ossAv('dir', 'prop', a, 'Percorso principale: ' + ossPN(a.main));
  ossTouch();
  try{ localStorage.setItem('pee_radici_ok', m.optin ? '1' : '0'); }catch(e){}
  if(m.rad) ossSendRad(m.rad);
  ossWizClose(); ossRefresh();
  showToast(role === 'col' ? 'Proposta inviata: chi ha il progetto la trova qui e in «Per te».' : 'Attività salvata. Quando l’avrete fatta, «Aggiungi alle occasioni osservative» la porta nelle occasioni osservative.');
  setTimeout(() => { const e = document.getElementById('oss-panel'); if(e && e.scrollIntoView) e.scrollIntoView({behavior:'smooth', block:'start'}); }, 80);
}
// raccolta anonima, solo con il consenso: radici delle parole e percorso scelto, nient'altro
function ossSendRad(r){
  try{ if(window.BRO || typeof CL === 'undefined' || !CL.sb || !CL.user) return;
    const rad = (Array.isArray(r.radici) ? r.radici : []).map(String).filter(w => /^[a-zàèéìòù']{2,24}$/.test(w)).slice(0, 30);
    if(rad.length < 2 || !/^[LER]$/.test(String(r.branca)) || !/^[PCS][1-8]$/.test(String(r.percorso))) return;
    const alt = (Array.isArray(r.altri) ? r.altri : []).map(String).filter(p => /^[PCS][1-8]$/.test(p)).slice(0, 4);
    CL.sb.from('pee_radici').insert({branca:String(r.branca), radici:rad, percorso:String(r.percorso), altri:alt}).then(() => {}, () => {});
  }catch(e){}
}

// ── azioni sulle attività ──
function ossGet(id){ return ((scheda.pp || {}).attOss || {})[id]; }
function ossApri(id){ const a = ossGet(id); if(!a) return; const st = OSS_STATI[a.stato] || OSS_STATI.pronta;
  const sec = (t, v) => v ? `<div class="oss-lbl">${t}</div><p class="oss-p">${sEsc(v).replace(/\n/g, '<br>')}</p>` : '';
  modalShow(`<div class="sch-t">${sEsc(a.nome)}</div><div class="sch-m">di ${sEsc(a.aut || '—')} · ${st[0]}${a.dur ? ' · ' + a.dur + ' min' : ''}</div>
    ${a.dom ? `<div class="oss-q" style="margin:8px 0">La domanda di partenza: «${sEsc(a.dom)}»</div>` : ''}
    <div class="oss-lbl">Percorsi</div><div class="oss-cp">${[a.main].concat(a.also || []).map((p, i) => `<span class="oss-pc a${p[0]}">${sEsc(ossPN(p))}${i === 0 ? ' · principale' : ''}</span>`).join(' ')}</div>
    ${(a.foc || []).length ? `<div class="oss-lbl">Focus</div><ol class="oss-ol">${a.foc.map(f => `<li>${sEsc(f)}</li>`).join('')}</ol>` : ''}
    ${sec('Lancio', a.lan)}${sec('Sviluppo', a.svi)}${sec('Conclusione', a.con)}
    <div class="oss-aa" style="margin-top:12px"><button type="button" class="btn-ghost sm" onclick="ossCopia('${a.id}')">Copia il testo</button><button type="button" class="btn-ghost sm" onclick="modalClose()">Chiudi</button></div>`); }
function ossCopia(id){ const a = ossGet(id); if(!a) return;
  const t = [a.nome, a.dom ? 'Ti chiedi: ' + a.dom : '', 'Percorsi: ' + [a.main].concat(a.also || []).map(ossPN).join(', '), 'Focus:'].concat((a.foc || []).map((f, i) => (i + 1) + '. ' + f)).concat(['Lancio: ' + (a.lan || ''), 'Sviluppo: ' + (a.svi || ''), 'Conclusione: ' + (a.con || '')]).filter(Boolean).join('\n');
  try{ navigator.clipboard.writeText(t).then(() => showToast('Copiato'), () => showToast('Il browser non permette di copiare qui')); }catch(e){ showToast('Il browser non permette di copiare qui'); } }
function ossAccetta(id){ const a = ossGet(id); if(!a || a.stato !== 'proposta' || !ossCanDirect()) return; a.stato = 'pronta'; ossAv('aut', 'ok', a, ''); ossTouch(); ossRefresh(); showToast('Proposta accettata: ora è pronta.'); }
function ossSugg(id){ const a = ossGet(id); if(!a) return;
  modalShow(`<div class="sch-t">Suggerimento per ${sEsc(a.aut || 'chi l’ha scritta')}</div><div class="sch-m">Su «${sEsc(a.nome)}». Lo trova in «Per te» e sotto l’attività, con il tuo nome.</div><textarea id="oss-sgt" rows="4" maxlength="800" style="width:100%;margin-top:8px;font:inherit;font-size:13px;padding:8px;border:1.5px solid var(--border);border-radius:8px" placeholder="Cosa suggerisci?" aria-label="Il tuo suggerimento"></textarea>
    <div class="oss-aa" style="margin-top:10px"><button type="button" class="btn-primary sm" onclick="ossSuggSend('${a.id}')">Invia</button><button type="button" class="btn-ghost sm" onclick="modalClose()">Annulla</button></div>`);
  setTimeout(() => { const t = document.getElementById('oss-sgt'); if(t) t.focus(); }, 40); }
function ossSuggSend(id){ const a = ossGet(id); const t = _ossS((document.getElementById('oss-sgt') || {}).value, 800).trim(); if(!a) return; if(!t){ showToast('Scrivi il suggerimento'); return; }
  if(!a.sugg || typeof a.sugg !== 'object' || Array.isArray(a.sugg)) a.sugg = {};
  a.sugg[ossNewId()] = {da:ossMe(), daMail:affMe(), t, at:Date.now()}; ossAv('aut', 'sugg', a, t); ossTouch(); modalClose(); ossRefresh(); showToast('Suggerimento inviato'); }
function ossDel(id){ const a = ossGet(id); if(!a) return;
  modalShow(`<div class="sch-t">Eliminare l’attività?</div><div class="sch-m">«${sEsc(a.nome)}» sparisce dall’elenco.${a.stato === 'svolta' ? ' La riga nelle occasioni osservative resta: se non ti serve, toglila dalla tabella.' : ''}</div><div class="oss-aa" style="margin-top:12px"><button type="button" class="btn-primary sm" onclick="ossDelOk('${a.id}')">Elimina</button><button type="button" class="btn-ghost sm" onclick="modalClose()">Annulla</button></div>`); }
function ossDelOk(id){ const o = ossStore(); delete o[id]; ossTouch(); modalClose(); ossRefresh(); showToast('Attività eliminata'); }
function ossSvolta(id){ const a = ossGet(id); if(!a) return; const P = [a.main].concat(a.also || []); const pp = scheda.pp || {};
  const old = (pp.occMan || []).find(r => r && r.id === a.occId); const sel = old ? (old.perc || []) : P;
  const staff = ossStaff();
  const chiOld = old ? String(old.chi || '').split('|').map(x => x.trim()).filter(Boolean) : [];
  const dIso = old && grIso(old.data) ? old.data : (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
  const rest = ossAllIds().filter(p => P.indexOf(p) < 0);
  modalShow(`<div class="sch-t">Aggiungi alle occasioni osservative</div><div class="sch-m">«${sEsc(a.nome)}» entra nelle occasioni osservative e da lì nella griglia, come le attività del KOS.</div>
    <label class="oss-fl">Data<input type="date" id="oss-sv-d" value="${dIso}"></label>
    ${staff.length ? `<div class="oss-lbl">Chi ha osservato</div><div class="oss-cg">${staff.map(n => `<label><input type="checkbox" class="oss-sv-c" value="${sEsc(n)}" ${(!chiOld.length || chiOld.indexOf(n) >= 0) ? 'checked' : ''}> ${sEsc(n)}</label>`).join('')}</div>` : `<label class="oss-fl">Chi ha osservato<input type="text" id="oss-sv-t" maxlength="120" value="${sEsc(chiOld.join(', '))}" placeholder="Scrivi lo staff nella tabella «Il mio staff» per sceglierli da un elenco"></label>`}
    <div class="oss-lbl">Quali percorsi avete osservato davvero <span>(arrivano spuntati quelli previsti: cambiali se è andata diversamente)</span></div>
    <div class="oss-cg">${P.map(p => `<label><input type="checkbox" class="oss-sv-p" value="${p}" ${sel.indexOf(p) >= 0 || !old ? 'checked' : ''}> ${sEsc(ossPN(p))}</label>`).join('')}</div>
    <details class="oss-more"><summary>Avete osservato anche altro?</summary><div class="oss-cg">${rest.map(p => `<label><input type="checkbox" class="oss-sv-p" value="${p}" ${sel.indexOf(p) >= 0 ? 'checked' : ''}> ${sEsc(ossPN(p))}</label>`).join('')}</div></details>
    <div class="oss-aa" style="margin-top:12px"><button type="button" class="btn-primary sm" onclick="ossSvoltaOk('${a.id}')">Conferma</button><button type="button" class="btn-ghost sm" onclick="modalClose()">Annulla</button></div>`); }
function ossSvoltaOk(id){ const a = ossGet(id); if(!a) return;
  const perc = [...document.querySelectorAll('.oss-sv-p:checked')].map(x => x.value); if(!perc.length){ showToast('Spunta almeno un percorso'); return; }
  const d = (document.getElementById('oss-sv-d') || {}).value || ''; const cs = [...document.querySelectorAll('.oss-sv-c:checked')].map(x => x.value);
  const free = _ossS((document.getElementById('oss-sv-t') || {}).value, 120).trim(); const chi = cs.length ? cs : (free ? [free] : []);
  const staff = ossStaff();
  const pp = scheda.pp || (scheda.pp = {}); if(!Array.isArray(pp.occMan)) pp.occMan = [];
  let r = pp.occMan.find(x => x && x.id === a.occId);
  if(!r){ r = {id:grNewId(), att:''}; pp.occMan.push(r); }
  r.att = 'Attività osservativa · ' + a.nome; r.data = grIso(d) || ''; r.perc = perc; r.chi = chi.join('|');
  if(typeof mvOn === 'function' && mvOn() && staff.length) r.ass = staff.filter(n => chi.indexOf(n) < 0);
  if(!r.ctx) r.ctx = ''; if(!r.note) r.note = '';
  a.occId = r.id; a.stato = 'svolta'; a.data = r.data; a.svoltaAt = Date.now();
  ossTouch(); modalClose(); try{ occRefresh(); }catch(e){} ossRefresh(); showToast('Svolta: ora è nelle occasioni osservative.'); }
function ossNonSvolta(id){ const a = ossGet(id); if(!a) return; const pp = scheda.pp || {}; const r = (pp.occMan || []).find(x => x && x.id === a.occId);
  modalShow(`<div class="sch-t">L’attività non è stata svolta?</div><div class="sch-m">«${sEsc(a.nome)}» torna «pronta» e la sua riga esce dalle occasioni osservative${r && (r.note || '').trim() ? ' (insieme alle note che vi hai scritto)' : ''}. I percorsi che ti aveva fatto osservare non risultano più osservati da lei.</div><div class="oss-aa" style="margin-top:12px"><button type="button" class="btn-primary sm" onclick="ossNonSvoltaOk('${a.id}')">Sì, toglila</button><button type="button" class="btn-ghost sm" onclick="modalClose()">Annulla</button></div>`); }
function ossNonSvoltaOk(id){ const a = ossGet(id); if(!a) return; const pp = scheda.pp || {}; pp.occMan = (pp.occMan || []).filter(x => !(x && x.id === a.occId)); a.stato = 'pronta'; a.occId = ''; a.data = '';
  ossTouch(); modalClose(); try{ occRefresh(); }catch(e){} ossRefresh(); showToast('Tolta dalle occasioni osservative.'); }
// da «Per te»: apro la pagina delle occasioni osservative, sul pannello
function ossGo(){ try{ clClose(); }catch(e){} try{ gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }catch(e){}
  setTimeout(() => { const e = document.getElementById('oss-panel'); if(e && e.scrollIntoView) e.scrollIntoView({behavior:'smooth', block:'start'}); }, 450); }
// ═══ Ricerca: attività osservative e occasioni osservative dentro «Cerca un’attività» ═══
// Le righe osservative hanno gen:'oss' (le educative sono gen 'att' o niente). Tipi: 'att' = attività osservativa creata col tool; 'occ' = occasione registrata a mano; 'kos' = attività del KOS svolta.
function anFlatOss(sc, fascia, proj){ const out = [];
  try{
    const pp = (sc && sc.pp) || {}; const DBx = Object.values(DB).flat(); const nm = id => { const P = DBx.find(q => q.id === id); return P ? P.name : id; };
    const store = (pp.attOss && typeof pp.attOss === 'object' && !Array.isArray(pp.attOss)) ? pp.attOss : {};
    const occIds = new Set();
    Object.keys(store).map(k => store[k]).filter(a => a && a.id && String(a.nome || '').trim()).forEach(a => {
      if(a.occId) occIds.add(a.occId);
      out.push({src:'mine', gen:'oss', ok:'att', proj:proj || null, ossId:a.id, titolo:String(a.nome).trim(), branca:fascia || '', ambito:String(a.main || '')[0] || '', perc_id:a.main || '', perc_nome:nm(a.main), also:(a.also || []).slice(),
        stato:a.stato || 'pronta', data:a.data || '', dom:a.dom || '', foc:(a.foc || []).slice(), obiettivi:[], idr:[], tipi:[], strumenti:[], durata_min:a.dur || null, sede:'', funzionato:'', pi:-1, j:-1,
        contenuto:{lancio:a.lan || '', sviluppo:a.svi || '', conclusione:a.con || '', scaletta:[], materiali:[], bene:'', migl:''}}); });
    (Array.isArray(pp.occMan) ? pp.occMan : []).forEach(r => { if(!r || occIds.has(r.id)) return; const P = (Array.isArray(r.perc) ? r.perc : []).filter(Boolean); const t = String(r.att || '').trim(); if(!t && !P.length) return;
      out.push({src:'mine', gen:'oss', ok:'occ', proj:proj || null, occId:r.id, titolo:t || 'Occasione osservativa', branca:fascia || '', ambito:(P[0] || '')[0] || '', perc_id:P[0] || '', perc_nome:P[0] ? nm(P[0]) : '', also:P.slice(1),
        stato:'svolta', data:r.data || '', ctx:String(r.ctx || ''), chi:String(r.chi || '').split('|').filter(Boolean), note:String(r.note || ''), obiettivi:[], idr:[], tipi:[], strumenti:[], durata_min:null, sede:'', funzionato:'', pi:-1, j:-1,
        contenuto:{lancio:'', sviluppo:'', conclusione:'', scaletta:[], materiali:[], bene:'', migl:''}}); });
    if(KOS2 && KOS2[fascia]) KOS2[fascia].forEach((inc, i) => inc.a.forEach((a, j) => { const key = fascia + i + '_' + j; if(!(pp.kosDone || {})[key]) return; const o = (pp.occKos || {})[key] || {}; const P = (a.f || []).slice();
      out.push({src:'mine', gen:'oss', ok:'kos', proj:proj || null, kosKey:key, titolo:'KOS: ' + a.n, branca:fascia || '', ambito:(P[0] || '')[0] || '', perc_id:P[0] || '', perc_nome:P[0] ? nm(P[0]) : '', also:P.slice(1),
        stato:'svolta', data:o.data || '', ctx:'', chi:[], note:'', obiettivi:[], idr:[], tipi:[], strumenti:[], durata_min:Number(a.m) || null, sede:'', funzionato:'', pi:-1, j:-1,
        contenuto:{lancio:'', sviluppo:'', conclusione:'', scaletta:[], materiali:[], bene:'', migl:''}}); }));
  }catch(e){ console.error(e); }
  return out; }
function anGenHTML(){ const f = AN.f;
  return `<div class="an-gen" role="group" aria-label="Che cosa cerchi"><span>Cerchi:</span><button type="button" class="an-gb ${f.ga ? 'on' : ''}" aria-pressed="${!!f.ga}" onclick="anGenTog('ga')">Attività educative</button><button type="button" class="an-gb ${f.go ? 'on' : ''}" aria-pressed="${!!f.go}" onclick="anGenTog('go')">Occasioni osservative</button></div>`; }
function anGenTog(k){ const f = AN.f; f[k] = !f[k]; if(!f.ga && !f.go) f[k === 'ga' ? 'go' : 'ga'] = true; anRender(); }
function anGenChip(r){ if(r.gen === 'oss') return '<span class="an-chip go">' + (r.ok === 'att' ? 'Attività osservativa' : 'Occasione osservativa') + '</span>'; return (AN.f.go && AN.f.ga) ? '<span class="an-chip ga">Attività educativa</span>' : ''; }
function anStSel(T){ const f = AN.f; if(T !== 'mine' || f.ga || !f.go) return '';
  return `<select class="ax-in" aria-label="Svolte o ancora da fare" onchange="AN.f.st=this.value;anRender()"><option value="">Svolte e da fare</option><option value="svolta" ${f.st === 'svolta' ? 'selected' : ''}>Già svolte</option><option value="todo" ${f.st === 'todo' ? 'selected' : ''}>Ancora da fare</option></select>`; }
function anOssDet(r){ if(r.gen !== 'oss') return ''; const P = [r.perc_id].concat(r.also || []).filter(Boolean); const sec = (t, v) => String(v || '').trim() ? `<p><b>${t}</b><br>${sEsc(v).replace(/\n/g, '<br>')}</p>` : '';
  const pc = P.length ? `<p><b>Percorsi</b></p><div class="oss-cp">${P.map((p, i) => `<span class="oss-pc a${p[0]}">${sEsc(ossPN(p))}${i === 0 && P.length > 1 ? ' · principale' : ''}</span>`).join(' ')}</div>` : '';
  const foc = (r.foc || []).length ? `<p><b>Focus</b></p><ol class="oss-ol">${r.foc.map(f => `<li>${sEsc(f)}</li>`).join('')}</ol>` : '';
  const occ = r.ok !== 'att' ? (sec('Quando', r.data ? grDateTxt(r.data) : '') + sec('Contesto', r.ctx) + sec('Chi ha osservato', (r.chi || []).join(', ')) + sec('Note', r.note)) : '';
  return sec('La domanda di partenza', r.dom) + pc + foc + occ; }
function anActsOss(r){ const i = anIdx(r); const bits = [];
  if(!window.BRO && r.ok === 'att' && ossOk()) bits.push(`<button type="button" class="btn-primary usc-btn" onclick="ossRiusa(${i})">Riusa come punto di partenza</button>`);
  if(r.src === 'mine') bits.push(`<button type="button" class="btn-ghost usc-btn" onclick="anGoMine(${i})">Apri</button>`);
  if(r.src === 'an' && anIsAdmin()) bits.push(`<button type="button" class="btn-ghost usc-btn" onclick="anDel('${r.id}')">Cancella</button>`);
  return bits.join(''); }
function ossOk(){ try{ return MODE === 'giovani' && !window._stEmb && !!FASCIA && !!KOS2[FASCIA] && ossCanCreate(); }catch(e){ return false; } }
// «Apri»: porta nella pagina delle occasioni osservative (anche di un altro progetto) e si ferma sull'attività o sulla tabella
function ossJumpTo(r){ const J = {t:'oss', ok:r.ok, ossId:r.ossId || '', occId:r.occId || ''};
  if(!r.proj || r.proj === 'cur' || (CL.ctx && r.proj === CL.ctx.id)){ ossFind(J); return; }
  try{ sessionStorage.setItem('pee_jump', JSON.stringify(J)); }catch(e){} try{ clOpenProject(r.proj); }catch(e){} }
function ossFind(J){ ossGo();
  setTimeout(() => { let e = null; try{ e = J.ossId ? document.querySelector('[data-oss="' + J.ossId + '"]') : document.getElementById('occ-tab'); }catch(x){} if(!e) e = document.getElementById('oss-panel'); if(e && e.scrollIntoView){ e.scrollIntoView({behavior:'smooth', block:'center'}); try{ e.classList.add('oss-flash'); setTimeout(() => e.classList.remove('oss-flash'), 2200); }catch(x){} } }, 800); }
function ossRiusa(i){ const r = AN_CUR[i]; if(!r || !ossOk()) return; const c = r.contenuto || {};
  const pre = {nome:r.titolo, dom:r.src === 'mine' ? (r.dom || '') : '', main:r.perc_id, also:r.also || [], foc:r.foc || [], dur:r.durata_min || 0, lan:c.lancio || '', svi:c.sviluppo || '', con:c.conclusione || ''};
  anClose(); ossWizOpen('', pre); }
// ═══ Archivio nazionale: proporre un'attività osservativa (solo Programmazione Educativa) ═══
// Nell'archivio va la stessa tabella delle attività educative, con la colonna «genere» = 'oss'. Si manda solo ciò che non identifica il gruppo: titolo, percorsi, focus, durata, lancio/sviluppo/conclusione.
// Non partono mai la domanda di partenza, le persone, gli osservatori né i nomi dello staff.
function anRowFix(r){ r.perc_id = r.perc_id || r.percorso_id || ''; r.perc_nome = r.perc_nome || r.percorso_nome || '';
  if(r.genere === 'oss'){ const c = r.contenuto || {}; r.gen = 'oss'; r.ok = 'att'; r.also = Array.isArray(c.also) ? c.also : []; r.foc = Array.isArray(c.foc) ? c.foc : []; }
  return r; }
function ossCanPropose(a){ return !window.BRO && !szPP() && (a.stato === 'pronta' || a.stato === 'svolta') && ossCanDirect() && typeof CL !== 'undefined' && !!CL.user; }
async function ossPropose(id){ if(window.BRO || szPP()) return; const a = ossGet(id); if(!a || !ossCanPropose(a)) return;
  if(AN.st !== 'ok'){ try{ await anProbe(true); }catch(e){} }
  if(AN.st !== 'ok'){ anNote('Archivio nazionale non ancora raggiungibile', AN.st === 'no' ? 'La tabella dell’archivio nazionale non è ancora stata creata su Supabase.' : 'Non riesco a raggiungere l’archivio nazionale (' + (AN.err || 'errore') + '). Controlla di aver fatto l’accesso con il tuo account e riprova.'); return; }
  try{ const pr = await CL.sb.from(AN_T).select('genere').limit(1); if(pr.error) throw pr.error; }
  catch(e){ anNote('L’archivio non è ancora pronto per le attività osservative', 'Manca l’aggiornamento della tabella (script SQL «archivio osservative» del 12 novembre). Eseguilo una volta su Supabase e riprova.'); return; }
  const DBx = Object.values(DB).flat(); const P = DBx.find(q => q.id === a.main);
  const d = {gen:'oss', ok:'att', titolo:anScrub(a.nome), perc_id:a.main, perc_nome:P ? P.name : '', also:(a.also || []).slice(), ambito:String(a.main)[0], branca:FASCIA || '', durata_min:a.dur || null, foc:(a.foc || []).map(anScrub), contenuto:{lancio:anScrub(a.lan), sviluppo:anScrub(a.svi), conclusione:anScrub(a.con)}};
  AN.draftO = {id:a.id, d}; const cc = d.contenuto; const ta = (i, l, v, h) => `<label class="ax-sub" for="${i}">${l}</label><textarea id="${i}" class="ax-ta" style="min-height:${h || 60}px">${sEsc(v || '')}</textarea>`;
  const ov = anOv(); ov.classList.add('show');
  ov.innerHTML = `<div class="an-box"><button class="modal-x" aria-label="Chiudi" onclick="anClose()">✕</button><h3 class="an-h">Proponi all’archivio nazionale</h3>
    <div class="ax-hint">Arriva a tutti i capi dopo una revisione. Mando solo titolo, percorsi, focus, durata e i testi dell’attività: <b>non</b> la domanda sul gruppo, le persone e gli osservatori. Ho già tolto i nomi dello staff, dell’Unità e della Sezione, le mail, i telefoni e le date che ho riconosciuto: <b>rileggi tutto</b> e togli ogni nome di ragazzi e persone.</div>
    <label class="ax-sub" for="anp-t">Titolo</label><input id="anp-t" class="ax-in" maxlength="140" value="${sEsc(d.titolo)}">
    ${ta('anp-fc', 'Focus (uno per riga)', d.foc.join('\n'), 70)}${ta('anp-l', 'Lancio', cc.lancio)}${ta('anp-s', 'Sviluppo', cc.sviluppo, 80)}${ta('anp-c', 'Conclusione', cc.conclusione)}
    <label class="ax-sub" for="anp-f">L’hai svolta?</label><select id="anp-f" class="ax-in"><option value="si" ${a.stato === 'svolta' ? 'selected' : ''}>Sì, ha funzionato</option><option value="in_parte">Sì, in parte</option><option value="da_provare" ${a.stato === 'svolta' ? '' : 'selected'}>Non ancora</option></select>
    ${anChips(d)}${d.also.length ? `<div class="oss-cp" style="margin-top:6px">${d.also.map(p => `<span class="oss-pc a${p[0]}">${sEsc(ossPN(p))}</span>`).join(' ')}</div>` : ''}
    <label class="an-ck" style="margin-top:10px"><input type="checkbox" id="anp-ok"> Ho controllato: nessun nome di persone, Unità o date</label>
    <div class="ax-chips" style="margin-top:10px"><button type="button" class="btn-primary usc-btn" id="anp-go" onclick="ossSend()">Invia la proposta</button><button type="button" class="btn-ghost usc-btn" onclick="anClose()">Annulla</button></div><div id="anp-r"></div></div>`; }
async function ossSend(){ const o = AN.draftO; if(!o || AN.busy) return; const g = i => document.getElementById(i);
  if(!g('anp-ok').checked){ g('anp-r').innerHTML = '<div class="ax-warn">Spunta la casella dopo aver riletto i testi.</div>'; return; }
  const titolo = g('anp-t').value.trim(); if(titolo.length < 3){ g('anp-r').innerHTML = '<div class="ax-warn">Il titolo è troppo corto.</div>'; return; }
  const foc = g('anp-fc').value.split('\n').map(x => x.trim().slice(0, 300)).filter(Boolean).slice(0, 8); const lan = g('anp-l').value, svi = g('anp-s').value, con = g('anp-c').value;
  if(!foc.length || !(lan.trim() || svi.trim() || con.trim())){ g('anp-r').innerHTML = '<div class="ax-warn">Servono almeno un focus e uno tra Lancio, Sviluppo e Conclusione.</div>'; return; }
  const d = o.d; const row = {genere:'oss', titolo, branca:d.branca || null, ambito:d.ambito || null, percorso_id:d.perc_id || null, percorso_nome:d.perc_nome || null, obiettivi:[], idr:[], tipi:[], strumenti:[], durata_min:d.durata_min || null, sede:null, funzionato:g('anp-f').value,
    contenuto:{lancio:lan, sviluppo:svi, conclusione:con, foc, also:d.also}};
  AN.busy = true; g('anp-go').disabled = true;
  try{ const {error} = await CL.sb.from(AN_T).insert(row); if(error) throw error; const a = ossGet(o.id); if(a){ a.anAt = Date.now(); ossTouch(); ossRefresh(); } anClose(); try{ await anLoadRows(); }catch(e){} showToast('Proposta inviata. Lo stato lo trovi in «Cerca un’attività › Le mie proposte»; arriva a tutti dopo la revisione.'); }
  catch(e){ g('anp-r').innerHTML = '<div class="ax-warn">Non sono riuscito a inviarla (' + sEsc((e && e.message) || 'errore') + '). Riprova più tardi.</div>'; g('anp-go').disabled = false; }
  finally{ AN.busy = false; } }
/*OSS-END*/
