// Parte 2 — testo «ostile» in ogni campo libero di un progetto: nessun campo deve essere eseguito come HTML in nessuna pagina
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch(process.argv[2] || 'chromium');
const db = new FakeDB(); const u = db.addUser('anna@x.it', 'password123', 'Anna <img src=x onerror="(window.__x=window.__x||[]).push(\'nome-utente\')">');
const pa = await person(br, db); const P = pa.page; await loginAs(P, base, u); await sleep(1500);
await P.evaluate(() => exStart()); await sleep(3500);
const id = await P.evaluate(() => CL.ctx && CL.ctx.id);
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
await P.evaluate(() => { localStorage.removeItem('bussola_pee_v6'); localStorage.removeItem('bussola_cloud_ctx'); }); await P.reload({waitUntil:'domcontentloaded'}); await sleep(2500);
await P.evaluate(id => shOpen(id, 0), id); await sleep(4000);
const hits = new Map(); const grab = async where => { const x = await P.evaluate(() => { const a = window.__x || []; window.__x = []; return a; }).catch(() => []); x.forEach(n => { const k = typeof n === 'number' ? paths[n] : (/^F\d+$/.test(n) ? 'campo «' + fillLabels[+n.slice(1)] + '»' : n); if(!hits.has(k)) hits.set(k, where); }); };
await grab('apertura');
const NAV = /^(?:event\.\w+\(\);\s*)*(shSrUsc|anJump|calOpenCy|shCal|shPerc|shSub|shSec|shGrp|shVis|shDash|shPP|shPF|shEle|shNum|shChk|shPrev|tipSet|tipPop|usc(Tab|Open|Home|BlkTog|Jump|OpenAll)\b|goPhase|gGo|verGo|gotoObs|showAutoOss|shSharePage|shGuide|cfOpen|shAnnoV|shStaffPage)/;
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
ok(seen.size >= 15 && FILLN >= 150, 'visitate ' + seen.size + ' pagine, scritti a mano ' + FILLN + ' campi oltre ai ' + paths.length + ' del progetto');
ok(hits.size === 0, 'nessun testo scritto dalle persone viene eseguito come HTML (eseguiti: ' + hits.size + ')');
[...hits.entries()].slice(0, 40).forEach(([k, w]) => console.log('    ✗ ' + k + '   ← ' + w));
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 3).map(e => e.slice(0, 160)).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
