/*OSS-BEGIN*/
// ═══ Attività osservative proprie («Crea le tue attività osservative») ═══
// Le attività stanno in scheda.pp.attOss (oggetto con una chiave per attività: così la sincronizzazione unisce le modifiche di più persone).
// «Segna come svolta» aggiunge una riga alle occasioni osservative (scheda.pp.occMan), e da lì tutto il resto (griglia, copertura, Word) funziona come per le altre occasioni.
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
    <div class="oss-h"><div><div class="oss-ey">Oltre il KOS</div><h4>Crea le tue attività osservative</h4><p>${intro}</p></div>${ossCanCreate() ? '<button type="button" class="btn-primary" onclick="ossWizOpen()">+ Nuova attività osservativa</button>' : ''}</div>
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
    if(a.stato === 'pronta' && ossCanDirect()) acts.push('<button type="button" class="btn-primary sm" onclick="ossSvolta(\'' + a.id + '\')">Segna come svolta</button>');
    if(orphan && ossCanDirect()) acts.push('<button type="button" class="btn-primary sm" onclick="ossSvolta(\'' + a.id + '\')">Rimetti nelle occasioni</button>');
    if(!ossMine(a) && !szPP()) acts.push('<button type="button" class="btn-ghost sm" onclick="ossSugg(\'' + a.id + '\')">Suggerisci</button>');
    if(a.stato === 'svolta' && !orphan && ossCanDirect()) acts.push('<button type="button" class="lnk" onclick="ossNonSvolta(\'' + a.id + '\')">Non è stata svolta</button>');
    if(ossMine(a) || ossRole() === 'tit' || ossRole() === 'aut') acts.push('<button type="button" class="lnk" onclick="ossDel(\'' + a.id + '\')">Elimina</button>');
  }
  const sg = Object.keys(a.sugg || {}).map(k => Object.assign({k}, a.sugg[k])).sort((x, y) => (x.at || 0) - (y.at || 0));
  return `<div class="oss-card"><div class="oss-ch"><span class="oss-st s${st[1]}">${st[0]}</span><b>${sEsc(a.nome)}</b><small>di ${sEsc(a.aut || '—')}${a.stato === 'svolta' && a.data ? ' · svolta il ' + sEsc(grDateTxt(a.data)) : ''}</small></div>
    <div class="oss-cp">${P.map((p, i) => `<span class="oss-pc a${p[0]}">${sEsc(ossPN(p))}${i === 0 ? ' · principale' : ''}</span>`).join(' ')}</div>
    ${a.dom ? `<div class="oss-q">«${sEsc(a.dom)}»</div>` : ''}
    ${orphan ? '<div class="oss-warn">La riga di questa attività non c’è più nelle occasioni osservative (forse l’hai tolta dalla tabella): i percorsi non risultano osservati finché non la rimetti.</div>' : ''}
    ${sg.length ? `<details class="oss-sg"><summary>Suggerimenti ricevuti · ${sg.length}</summary>${sg.map(s => `<div class="oss-sgi"><b>${sEsc(s.da || '')}</b> · ${sEsc(ossWhen(s.at))}<div>${sEsc(s.t)}</div></div>`).join('')}</details>` : ''}
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
    radiciAsk:!!(typeof CL !== 'undefined' && CL.sb && CL.user && !window.BRO), optin:ossRadiciOk()};
}
function ossWizOpen(pid){
  if(!ossCanCreate()) return;
  const txt = ossDocText(); if(!txt){ showToast('Non riesco ad aprire il percorso guidato: ricarica la pagina e riprova.'); return; }
  ossWizClose(true);
  const ov = document.createElement('div'); ov.id = 'oss-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Nuova attività osservativa');
  const fr = document.createElement('iframe'); fr.title = 'Nuova attività osservativa'; fr.setAttribute('allow', 'clipboard-write'); ov.appendChild(fr);
  window._ossPid = pid || ''; window._ossFocus = document.activeElement;
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
  showToast(role === 'col' ? 'Proposta inviata: chi ha il progetto la trova qui e in «Per te».' : 'Attività salvata. Quando l’avrete fatta, «Segna come svolta» la porta nelle occasioni osservative.');
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
  modalShow(`<div class="sch-t">Segna come svolta</div><div class="sch-m">«${sEsc(a.nome)}» entra nelle occasioni osservative e da lì nella griglia, come le attività del KOS.</div>
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
/*OSS-END*/
