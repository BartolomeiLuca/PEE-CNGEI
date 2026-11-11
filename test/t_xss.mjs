// Parte 2 — testo «ostile» in ogni campo libero di un progetto: nessun campo deve essere eseguito come HTML in nessuna pagina
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch(process.argv[2] || 'chromium');
const db = new FakeDB(); const u = db.addUser('anna@x.it', 'password123', 'Anna <img src=x onerror="(window.__x=window.__x||[]).push(\'nome-utente\')">');
let pa = await person(br, db); let P = pa.page; await loginAs(P, base, u); await sleep(1500);
const KIND = process.env.KIND || 'unita';
db.t.pee_profili.push({user_id:u.id, nome:'Anna', ruolo: KIND === 'cg' ? 'cg' : 'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ST = [{ruolo:'CU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'25', form:'Testa di Moro', tel:'333'}, {ruolo:'VCU', nome:'Elena Sarti', mail:'elena@x.it', eta:'30', form:'', tel:''}];
const usc = (id, md, t, d) => ({id, cr:1, testo:t, modello:md, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:md === 'sede' ? {tipo:'sede'} : {}}, prog:{}, hid:{}, own:{}});
const BASE = {
  unita: null,
  staff: {meta:{mode:'staff'}, data:{v:1, MODE:'staff', STAFF_TYPE:'misto', STAFF_RUOLO:'CU', UNIT_NAME:'Staff X', STAFF_MEMBERS:['Paolo Riva','Elena Sarti'], staffObs:{'Paolo Riva':{'1.1':'3'}}, staffProfiles:{'Paolo Riva':{eta:'25', ruolo:'CU'}}, scheda:{pp:{staffTab:ST}, uscite:{u1:usc('u1', 'sede', 'Riunione di staff', '2026-11-12')}}}},
  cg: {meta:{mode:'staff'}, data:{v:1, MODE:'staff', STAFF_TYPE:'misto', STAFF_RUOLO:'CG', UNIT_NAME:'Gruppo X', STAFF_MEMBERS:['Paolo Riva','Elena Sarti'], staffObs:{}, staffProfiles:{}, scheda:{pp:{staffTab:ST}, uscite:{u1:usc('u1', 'sede', 'Consiglio di Gruppo', '2026-11-12')}}}},
  pp: {meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto X', obs:{P1:7, C2:5}, pris:{P1:true, C2:true, S3:true}, scheda:{tipoProgetto:'PP', annoScout:'2026-27', priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:''}], pp:{nome:'Anna', tutor:'Mario', sezione:'Pesaro', gruppo:'1', ctxTerr:'Quartiere con parco e bus', ctxSez:'Sezione piccola', staffTab:ST}, uscite:{u1:usc('u1', 'giorno', 'Uscita al parco', '2026-11-15')}}}},
};
let id;
if(KIND === 'unita'){ await P.evaluate(() => exStart()); await sleep(3500); id = await P.evaluate(() => CL.ctx && CL.ctx.id); }
else { id = 'k1'; db.t.pee_archivi.push({id, user_id:u.id, anno:2026, titolo:'Prova ' + KIND, meta:BASE[KIND].meta, data:JSON.parse(JSON.stringify(BASE[KIND].data)), created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'}); }
// una seconda persona che ha scritto suggerimenti e un invito con testo ostile: compaiono in «Per te», nella condivisione e nei suggerimenti
const evil = n => `'"><img src=x onerror="(window.__x=window.__x||[]).push('E${n}')">`;
const o = db.addUser('olga@x.it', 'password123', 'Olga' + evil('nome-olga'));
db.t.pee_membri.push({id:'m1', archivio_id:id, owner_id:u.id, owner_email:'Anna' + evil('owner') + ' (anna@x.it)', email:'olga@x.it', ruolo:'collaboratore', created_at:'2026-10-27T10:00:00Z'});
db.t.pee_suggerimenti.push({id:'s1', archivio_id:id, user_id:o.id, autore_nome:'Olga' + evil('sugg-autore'), percorso:'P1' + evil('sugg-perc'), testo:'Un consiglio' + evil('sugg-testo'), stato:'nuovo', created_at:'2026-10-28T10:00:00Z'});
db.t.pee_archivio_nazionale.push({id:'n1', autore_id:o.id, titolo:'Attività' + evil('an-titolo'), branca:'E', stato:'approvata', percorso_nome:'Perc' + evil('an-perc'), ambito:'P', dati:{testo:'x' + evil('an-dati')}, created_at:'2026-10-28T10:00:00Z'});
const row = db.t.pee_archivi.find(r => r.id === id);
// avveleno ogni testo libero (stringhe con uno spazio o lunghe), lasciando stare codici, date e identificativi
const paths = []; const pay = n => `'"><img src=x onerror="(window.__x=window.__x||[]).push(${n})">`;
const walk = (o, p) => { if(Array.isArray(o)){ o.forEach((v, i) => { if(typeof v === 'string'){ if(free(v)){ paths.push(p + '/' + i); o[i] = v + pay(paths.length - 1); } } else if(v && typeof v === 'object') walk(v, p + '/' + i); }); }
  else Object.keys(o).forEach(k => { const v = o[k]; if(typeof v === 'string'){ if(free(v)){ paths.push(p + '/' + k); o[k] = v + pay(paths.length - 1); } } else if(v && typeof v === 'object') walk(v, p + '/' + k); }); };
const free = v => (/\s/.test(v) || v.length > 14) && !/^\d{4}-\d{2}/.test(v) && !/^https?:/.test(v);
const d = JSON.parse(JSON.stringify(row.data)); walk(d, '');
// qualche campo corto ma libero
d.UNIT_NAME = 'Rep' + pay(paths.push('/UNIT_NAME') - 1);
(d.STAFF_MEMBERS || []).forEach((m, i) => { if(typeof m === 'string'){ d.STAFF_MEMBERS[i] = m + pay(paths.push('/STAFF_MEMBERS/' + i) - 1); } });
row.data = d; row.titolo = 'Tit' + pay(paths.push('titolo') - 1); row.updated_at = new Date(Date.now() + 60000).toISOString();
console.log('campi avvelenati: ' + paths.length);
if(process.env.AS === 'olga'){   // la stessa cosa vista da una collega invitata (collaboratrice): archivio, «Per te», progetto condiviso, suggerimenti
  await pa.ctx.close(); pa = await person(br, db); P = pa.page; await loginAs(P, base, o); await sleep(2500);
  await P.evaluate(() => { try{ clShow('archive'); }catch(e){} }); await sleep(2500);
  await P.evaluate(() => { const x = (CL._inv || [])[0]; if(x) clInvOpen(x.id); }).catch(() => {}); await sleep(5000);
} else {
await P.evaluate(() => { localStorage.removeItem('bussola_pee_v6'); localStorage.removeItem('bussola_cloud_ctx'); }); await P.reload({waitUntil:'domcontentloaded'}); await sleep(2500);
await P.evaluate(id => shOpen(id, 0), id); await sleep(4000);
}
const hits = new Map(); const grab = async where => { if(process.env.CTX){ const c = await P.evaluate(() => [...document.querySelectorAll('img[src="x"]')].slice(0,3).map(i => (i.closest('[id]')||{}).id + ' :: ' + (i.parentElement ? i.parentElement.outerHTML.slice(0, 200) : ''))).catch(() => []); c.forEach(x => console.log('    DOM @' + where + ' → ' + x)); } const x = await P.evaluate(() => { const a = window.__x || []; window.__x = []; return a; }).catch(() => []); x.forEach(n => { const k = typeof n === 'number' ? paths[n] : (/^F\d+$/.test(n) ? 'campo «' + fillLabels[+n.slice(1)] + '»' : n); if(!hits.has(k)) hits.set(k, where); }); };
await grab('apertura');
const NAV = /^(?:event\.\w+\(\);\s*|shDrawer\(false\);\s*)*(stPick|stGo|stAddToggle|shShare|shStaffBack|toggleCard|shSrUsc|anJump|calOpenCy|shCal|shPerc|shSub|shSec|shGrp|shVis|shDash|shPP|shPF|shEle|shNum|shChk|shPrev|tipSet|tipPop|usc(Tab|Open|Home|BlkTog|Jump|OpenAll)\b|goPhase|gGo|verGo|gotoObs|showAutoOss|shSharePage|shGuide|cfOpen|shAnnoV|shStaffPage)/;
let FILLN = 0; const fillLabels = [];
async function crawl(fill){ const seen = new Set();
  for(let round = 0; round < 140; round++){
    const todo = await P.evaluate(src => { const re = new RegExp(src); const out = []; document.querySelectorAll('[onclick]').forEach(e => { const oc = e.getAttribute('onclick') || ''; if(re.test(oc) && e.offsetParent !== null) out.push(oc); }); return [...new Set(out)]; }, NAV.source).catch(() => []);
    const next = todo.find(oc => !seen.has(oc)); if(!next) break; seen.add(next);
    await P.evaluate(oc => { const e = [...document.querySelectorAll('[onclick]')].find(x => x.getAttribute('onclick') === oc && x.offsetParent !== null); if(e) e.click(); }, next).catch(() => {});
    await sleep(400); await P.evaluate(() => { document.querySelectorAll('details:not([open])').forEach(d => { try{ d.open = true; }catch(e){} }); }).catch(() => {}); await sleep(250);
    if(fill){ const r = await P.evaluate(n0 => { const labs = []; let n = n0; document.querySelectorAll('textarea, input[type=text], input:not([type]), [contenteditable=true]').forEach(el => { if(el.offsetParent === null || el.readOnly || el.disabled || el.dataset.xf) return; if(el.closest('#cl-ov,#auth-box,.auth-box,#cl-auth,.sh-acc')) return; el.dataset.xf = '1';
          const lab = (el.getAttribute('oninput') || el.getAttribute('onchange') || el.getAttribute('onblur') || el.id || el.getAttribute('aria-label') || el.placeholder || el.className || '?').slice(0, 90); const pay = `'"><img src=x onerror="(window.__x=window.__x||[]).push('F${n}')">`;
          try{ if(el.isContentEditable){ el.focus(); el.textContent = 'T ' + pay; } else { el.value = 'T ' + pay; } el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); el.dispatchEvent(new Event('blur', {bubbles:true})); labs.push(lab); n++; }catch(e){} }); return labs; }, FILLN).catch(() => []);
      r.forEach(l => fillLabels.push(l)); FILLN += r.length; await sleep(250); }
    await grab(next.slice(0, 60));
    await P.evaluate(() => { try{ if(typeof modalClose === 'function') modalClose(); }catch(e){} try{ clClose(); }catch(e){} }).catch(() => {});
  } return seen; }
const s1 = await crawl(true); console.log('giro 1 (scrittura): ' + s1.size + ' pagine, ' + FILLN + ' campi scritti a mano');
await P.evaluate(() => { try{ saveData(true); }catch(e){} }).catch(() => {}); await sleep(5000);
await P.reload({waitUntil:'domcontentloaded'}); await sleep(2500); await P.evaluate(id => shOpen(id, 0), id); await sleep(4000); await grab('riapertura');
const seen = await crawl(false);
// pagine dell'archivio / condivisione / versioni
for(const v of ['archive', 'share', 'versions', 'account']){ await P.evaluate(v => { try{ clShow(v); }catch(e){} }, v).catch(() => {}); await sleep(900); await grab('clShow ' + v); await P.evaluate(() => { try{ clClose(); }catch(e){} }).catch(() => {}); }
await P.evaluate(() => { try{ shGoHome(); }catch(e){} }).catch(() => {}); await sleep(1500); await grab('I tuoi progetti');
console.log('giro 2 (lettura): ' + seen.size + ' pagine → ' + [...seen].map(x => x.slice(0, 30)).join(' ; '));
ok(seen.size >= (KIND === 'unita' ? 15 : 8) && FILLN >= (KIND === 'unita' ? 150 : KIND === 'pp' ? 100 : 8), 'visitate ' + seen.size + ' pagine, scritti a mano ' + FILLN + ' campi oltre ai ' + paths.length + ' del progetto');
ok(hits.size === 0, 'nessun testo scritto dalle persone viene eseguito come HTML (eseguiti: ' + hits.size + ')');
[...hits.entries()].slice(0, 40).forEach(([k, w]) => console.log('    ✗ ' + k + '   ← ' + w));
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 3).map(e => e.slice(0, 160)).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
