// Parte 2 — accessibilità (tastiera, nomi, etichette, id doppi, zoom) e prestazioni con progetto grande
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch(process.argv[2] || 'chromium');
const db = new FakeDB(); const u = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const pa = await person(br, db); const P = pa.page; await loginAs(P, base, u); await sleep(1500);
db.t.pee_profili.push({user_id:u.id, nome:'Anna', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const BIG = +(process.env.BIG || 0);
await P.evaluate(() => exStart()); await sleep(3500);
const id = await P.evaluate(() => CL.ctx && CL.ctx.id);
if(BIG){   // progetto grande: molte uscite con osservazioni e testi lunghi
  const row = db.t.pee_archivi.find(r => r.id === id); const d = row.data; d.scheda.uscite = d.scheda.uscite || {}; let n = 0;
  for(let i = 0; i < BIG; i++){ const nid = 'big' + i; d.scheda.uscite[nid] = {id:nid, cr:1, testo:'Uscita lunga numero ' + i + ' ' + 'testo '.repeat(80), modello: i % 3 ? 'sede' : 'giorno', ax:{data:new Date(Date.UTC(2026, 9, 1 + (i % 240))).toISOString().slice(0, 10), durata:'giorno', pres:{ad:[]}, luogo:{tipo:'sede'}}, prog:{}, hid:{}, own:{}}; n++; }
  for(let i = 0; i < BIG * 2; i++){ d.obs['X' + i] = 3 + (i % 5); }
  d.scheda.percorsiExtra = d.scheda.percorsiExtra || [];
  row.data = d; row.updated_at = new Date(Date.now() + 60000).toISOString(); console.log('uscite aggiunte: ' + n + ' (totale ' + Object.keys(d.scheda.uscite).length + ')');
  await P.evaluate(() => { localStorage.removeItem('bussola_pee_v6'); localStorage.removeItem('bussola_cloud_ctx'); });
}
const t0 = Date.now(); await P.reload({waitUntil:'domcontentloaded'}); await sleep(2500);
await P.evaluate(() => { window.__lt = []; try{ new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push(Math.round(e.duration)))).observe({entryTypes:['longtask']}); }catch(e){} });
const tOpen = Date.now(); await P.evaluate(id => shOpen(id, 0), id); await P.waitForFunction(() => document.querySelectorAll('*').length > 800, null, {timeout: 60000}).catch(() => {}); const dOpen = Date.now() - tOpen;
await sleep(3000);
const NAV = /^(?:event\.\w+\(\);\s*|shDrawer\(false\);\s*)*(stPick|stGo|stAddToggle|shShare|shStaffBack|toggleCard|shSrUsc|anJump|calOpenCy|shCal|shPerc|shSub|shSec|shGrp|shVis|shDash|shPP|shPF|shEle|shNum|shChk|shPrev|tipSet|tipPop|usc(Tab|Open|Home|BlkTog|Jump|OpenAll)\b|goPhase|gGo|verGo|gotoObs|showAutoOss|shSharePage|shGuide|cfOpen|shAnnoV|shStaffPage)/;

const F = {noname:new Set(), nolabel:new Set(), noalt:new Set(), clickNoKey:new Set(), dupid:new Set(), tabpos:0, pages:0, nodes:0, maxNodes:0, tooSmall:new Set()};
const audit = () => P.evaluate(() => {
  const vis = e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  const nm = e => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || (e.textContent || '').trim() || (e.querySelector && e.querySelector('img[alt]:not([alt=""])') ? 'x' : '') || '').trim();
  const out = {noname:[], nolabel:[], noalt:[], clickNoKey:[], dup:[], tabpos:0, small:[], nodes: document.querySelectorAll('*').length};
  const ds = e => (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]) + ' ' + (e.getAttribute('onclick') || '').slice(0, 40);
  document.querySelectorAll('button, a[href], [role=button]').forEach(e => { if(vis(e) && !nm(e)) out.noname.push(ds(e)); });
  document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), textarea, select').forEach(e => { if(!vis(e)) return;
    const has = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]')) || e.closest('label') || e.getAttribute('placeholder'); if(!has) out.nolabel.push(ds(e) + ' ' + (e.getAttribute('oninput') || e.getAttribute('onchange') || '').slice(0, 30)); });
  document.querySelectorAll('input[type=checkbox], input[type=radio]').forEach(e => { if(!vis(e)) return; const has = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.getAttribute('title') || (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]')) || e.closest('label'); if(!has) out.nolabel.push('check ' + ds(e)); });
  document.querySelectorAll('img').forEach(e => { if(vis(e) && !e.hasAttribute('alt')) out.noalt.push((e.getAttribute('src') || '').slice(0, 40)); });
  document.querySelectorAll('[onclick]').forEach(e => { if(!vis(e)) return; const t = e.tagName; if(['BUTTON','A','INPUT','SELECT','TEXTAREA','SUMMARY','LABEL'].includes(t)) return; if(e.closest('button, a[href], label, summary')) return;
    if(!(e.hasAttribute('tabindex') && e.getAttribute('role'))) out.clickNoKey.push(ds(e)); });
  const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; }); Object.keys(ids).forEach(k => { if(ids[k] > 1) out.dup.push(k); });
  out.tabpos = document.querySelectorAll('[tabindex]').length && [...document.querySelectorAll('[tabindex]')].filter(e => +e.getAttribute('tabindex') > 0).length;
  document.querySelectorAll('button, a[href], [role=button], input:not([type=hidden])').forEach(e => { if(!vis(e)) return; const r = e.getBoundingClientRect(); if(r.width && r.height && (r.width < 24 || r.height < 24) && !e.closest('label')) out.small.push(ds(e) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
  return out; });
const addA = async () => { const a = await audit().catch(() => null); if(!a) return; F.pages++; F.maxNodes = Math.max(F.maxNodes, a.nodes);
  a.noname.forEach(x => F.noname.add(x)); a.nolabel.forEach(x => F.nolabel.add(x)); a.noalt.forEach(x => F.noalt.add(x)); a.clickNoKey.forEach(x => F.clickNoKey.add(x)); a.dup.forEach(x => F.dupid.add(x)); F.tabpos += a.tabpos || 0; a.small.forEach(x => F.tooSmall.add(x)); };
await addA();
const seen = new Set(); const times = [];
for(let round = 0; round < 90; round++){
  const todo = await P.evaluate(src => { const re = new RegExp(src); const out = []; document.querySelectorAll('[onclick]').forEach(e => { const oc = e.getAttribute('onclick') || ''; if(re.test(oc) && e.offsetParent !== null) out.push(oc); }); return [...new Set(out)]; }, NAV.source);
  const next = todo.find(oc => !seen.has(oc)); if(!next) break; seen.add(next);
  const t = Date.now(); await P.evaluate(oc => { const e = [...document.querySelectorAll('[onclick]')].find(x => x.getAttribute('onclick') === oc && x.offsetParent !== null); if(e) e.click(); }, next).catch(() => {});
  await P.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {}); times.push([Date.now() - t, next.slice(0, 40)]);
  await sleep(350); await P.evaluate(() => { document.querySelectorAll('details:not([open])').forEach(d => { try{ d.open = true; }catch(e){} }); }).catch(() => {}); await addA();
  await P.evaluate(() => { try{ modalClose(); }catch(e){} try{ clClose(); }catch(e){} }).catch(() => {});
}
// pagine globali: lingua, zoom, focus visibile
const g = await P.evaluate(() => ({lang: document.documentElement.lang, vp: (document.querySelector('meta[name=viewport]') || {}).content || '', title: document.title,
  dlg: [...document.querySelectorAll('#cl-ov, [role=dialog], .modal, #modal')].map(e => e.id + ':' + (e.getAttribute('role') || '-') + ':' + (e.getAttribute('aria-modal') || '-')).slice(0, 6)}));
// tastiera: Tab attraverso 40 elementi, quanti hanno un contorno visibile
await P.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
let focused = 0, noRing = [], stuck = 0, last = '';
for(let i = 0; i < 60; i++){ await P.keyboard.press('Tab'); const s = await P.evaluate(() => { const e = document.activeElement; if(!e || e === document.body) return null; const cs = getComputedStyle(e); const cs2 = getComputedStyle(e, ':focus-visible'); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
  return {k: e.tagName + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0], ring, sig: e.outerHTML.slice(0, 60)}; });
  if(!s){ continue; } focused++; if(!s.ring) noRing.push(s.k); if(s.sig === last) stuck++; last = s.sig; }
// Escape chiude le finestre
await P.evaluate(() => { try{ clShow('account'); }catch(e){} }); await sleep(600); const openB = await P.evaluate(() => document.getElementById('cl-ov').classList.contains('show'));
await P.keyboard.press('Escape'); await sleep(400); const openA = await P.evaluate(() => document.getElementById('cl-ov').classList.contains('show'));
const lt = await P.evaluate(() => window.__lt || []);
const slow = times.filter(x => x[0] > (BIG ? 1500 : 800)).sort((a, b) => b[0] - a[0]);
const heap = await P.evaluate(() => performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : -1).catch(() => -1);
console.log(`\nBIG=${BIG}  apertura progetto: ${dOpen} ms  nodi DOM max: ${F.maxNodes}  pagine viste: ${seen.size}  memoria JS: ${heap} MB`);
console.log(`navigazione: mediana ${[...times].map(x => x[0]).sort((a, b) => a - b)[Math.floor(times.length / 2)]} ms, peggiori: ` + times.sort((a, b) => b[0] - a[0]).slice(0, 4).map(x => x[0] + 'ms ' + x[1]).join(' | '));
console.log('compiti lunghi (>50ms): ' + lt.length + ' · il peggiore ' + Math.max(0, ...lt) + ' ms');
console.log('lingua=' + g.lang + ' viewport=' + g.vp + ' finestre=' + g.dlg.join(','));
const show = (t, s) => { console.log(`${t}: ${s.size}`); [...s].slice(0, 8).forEach(x => console.log('    · ' + x)); };
show('pulsanti/link senza nome', F.noname); show('campi senza etichetta', F.nolabel); show('immagini senza alt', F.noalt); show('elementi cliccabili non raggiungibili da tastiera', F.clickNoKey); show('id doppi', F.dupid); show('bersagli < 24px', F.tooSmall);
console.log(`tastiera: ${focused} elementi raggiunti con Tab su 60, senza contorno visibile: ${noRing.length} (${[...new Set(noRing)].slice(0, 5).join(', ')}), bloccato: ${stuck}`);
console.log(`Escape: finestra aperta prima=${openB} dopo=${openA}`);
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 3).join(' | '));
if(process.env.STRICT){ ok(F.noname.size === 0, 'ogni pulsante ha un nome'); ok(F.nolabel.size === 0, 'ogni campo ha un’etichetta'); ok(F.dupid.size === 0, 'nessun id doppio'); ok(/width=device-width/.test(g.vp) && !/user-scalable=no|maximum-scale=1\b/.test(g.vp), 'zoom non bloccato'); ok(!openA, 'Escape chiude la finestra'); }
if(BIG) ok(dOpen < 15000 && slow.length <= 3, 'progetto grande: apertura ' + dOpen + ' ms, passaggi lenti ' + slow.length);
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
