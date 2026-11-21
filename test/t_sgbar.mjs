// La barra dei pareri: il Commissario ha SEMPRE in vista «Lascia un parere»; il Capo Gruppo vede l'avviso in alto e il numerino nel menu.
// uso: node t_sgbar.mjs [motore | profilo]
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const arg = process.argv[2] || 'chromium';
const engine = PROFILES[arg] ? PROFILES[arg][0] : arg;
const dev0 = Object.assign({}, PROFILES[arg] ? PROFILES[arg][1] : {}); delete dev0.defaultBrowserType; if(engine === 'firefox') delete dev0.isMobile;
const noOver = P => P.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB();
const br = await launch(engine);
const mkUser = (mail, nome, ruolo) => { const u = db.addUser(mail, 'password123', nome); db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:ruolo === 'cds' ? null : '1', area_rcdf:'altoadriatico', dashboard:{}}); return u; };
const cg = mkUser('cg@x.it', 'Capo Gruppo', 'cg'), cm = mkUser('comm@x.it', 'Marco Commissario', 'cds'), lt = mkUser('lett@x.it', 'Lea Lettrice', 'cu'), co = mkUser('col@x.it', 'Carlo Collaboratore', 'cu');

const NAV = {
  osservazione: () => { STAFF_VIEW = 'osservazione'; goPhase(1); },
  lettura: () => { goPhase(1); setTimeout(() => goPhaseInternal(2), 400); },
  percorso: () => { shPF(); },
  eventi: () => { shSec('usc'); uscHome(); },
  check: () => { shChk(); }
};
const go = async (P, pag) => { await P.evaluate(`(${NAV[pag].toString()})()`).catch(() => {}); await sleep(1800); };
const host = P => P.evaluate(() => { const h = document.getElementById('sgp-host'); if(!h) return {vis: false}; const r = h.getBoundingClientRect(); return {vis: h.style.display !== 'none' && r.height > 0, k: h.dataset.k, t: h.innerText, add: !!h.querySelector('.sg-add'), ta: !!h.querySelector('textarea'), inView: r.width > 0 && r.right <= window.innerWidth + 1 && r.left >= -1}; });

// ───── 1. il Capo Gruppo crea la formativa con un evento e invita Commissario, Lettore e Collaboratore ─────
const pa = await person(br, db, {ctx: dev0}); const A = pa.page, ea = (f, a) => A.evaluate(f, a);
await loginAs(A, base, cg); await sleep(2500);
await A.click('.sh-big >> nth=0'); await sleep(300); await A.click('#sh-ncre'); await sleep(3500);
const pid = await ea(() => CL.ctx.id);
await ea(() => { const id = 'uTest1'; scheda.uscite = scheda.uscite || {}; scheda.uscite[id] = {id, cr: Date.now(), testo: 'Serata formativa dei Capi Unità', modello: 'sede', dest: 'staff', riservata: true, ax: {data: '2026-12-05'}, prog: {b1: {k: 'nuova', t: 'Momento segreto', dur: 30}}, hid: {}, own: {}}; STAFF_MEMBERS = ['Paolo Riva']; staffObs['Paolo Riva'] = {P1: 4, P2: 3, C1: 2}; staffProfiles['Paolo Riva'] = {eta: '34', ruolo: 'Capo Unità', esperienza: '5'}; try{ _clTouched = true; _clUserAt = Date.now(); }catch(e){} saveData(true); });
await sleep(4500);
await ea(() => shShare()); await sleep(1800);
for (const [m, r] of [['comm@x.it', 'commissario'], ['lett@x.it', 'lettore'], ['col@x.it', 'collaboratore']]){
  await ea(([m, r]) => { document.getElementById('cl-inv').value = m; document.getElementById('cl-invr').value = r; return clInvite(); }, [m, r]); await sleep(1500);
}
ok(db.t.pee_membri.map(m => m.ruolo).sort().join() === 'collaboratore,commissario,lettore', 'inviti: ' + db.t.pee_membri.map(m => m.email + ':' + m.ruolo).join());

const vis = (P, sel) => P.evaluate(s => { const e = document.querySelector(s); if(!e) return null; const r = e.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight; return {top: Math.round(r.top), bottom: Math.round(r.bottom), inView: r.width > 0 && r.left >= -1 && r.right <= W + 1 && r.top >= 0 && r.bottom <= H, t: e.innerText.replace(/\s+/g, ' ').trim()}; }, sel);
const pc = await person(br, db, {ctx: dev0}); const C = pc.page, ec = (f, a) => C.evaluate(f, a);
await loginAs(C, base, cm); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await ec(() => (CL._inv || []).length)) break; await sleep(500); }
await ec(id => clOpenShared(id), pid); await sleep(4500);

// ───── 1. Commissario: la barra c'è su ogni pagina, in alto, e resta in vista anche scorrendo ─────
for (const pag of ['osservazione', 'lettura', 'percorso', 'eventi', 'check']){
  await go(C, pag); await ec(() => window.scrollTo(0, 0)); await sleep(300);
  const b = await vis(C, '#sgp-bar');
  ok(b && b.inView && /Lascia un parere su questa pagina/.test(b.t), `«${pag}»: barra con «Lascia un parere su questa pagina» in vista (${b ? b.t.slice(0, 70) : 'assente'})`);
  await ec(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(500);
  const b2 = await vis(C, '#sgp-bar');
  const hh = await ec(() => document.getElementById('hdr').offsetHeight);
  ok(b2 && b2.inView && b2.top >= hh - 6 && b2.top <= hh + 40, `«${pag}»: scorrendo in fondo la barra resta in vista (top ${b2 && b2.top}, intestazione ${hh})`);
  ok(await noOver(C), `«${pag}»: la pagina non è più larga dello schermo`);
}
// il pulsante apre il modulo, porta il box in vista e mette il cursore nel testo
await go(C, 'lettura'); await ec(() => window.scrollTo(0, 0)); await sleep(300);
if(process.env.SHOT) await C.screenshot({path: process.env.SHOT + '-comm.png'});
await ec(() => document.querySelector('#sgp-bar .pbar-g').click()); await sleep(1500);
const f1 = await ec(() => { const t = document.getElementById('sg-ta-PAG:lettura'); if(!t) return null; const r = t.getBoundingClientRect(); return {focus: document.activeElement === t, inView: r.top >= 0 && r.bottom <= window.innerHeight + 2, h: r.height}; });
ok(f1 && f1.inView && f1.focus, 'il pulsante apre il modulo, lo porta in vista e mette il cursore nel testo · ' + JSON.stringify(f1));
ok(/Vai al tuo parere/.test((await vis(C, '#sgp-bar')).t), 'con il modulo aperto la barra diventa «Vai al tuo parere»');
// scrive il parere
await ec(() => { document.getElementById('sg-nm-PAG:lettura').value = 'Marco Rossi'; const t = document.getElementById('sg-ta-PAG:lettura'); t.value = 'Parere di prova sulla lettura.'; t.dispatchEvent(new Event('input')); document.querySelector('#sgp-host .sg-a .ok').click(); }); await sleep(2000);
ok(db.t.pee_suggerimenti.some(x => x.percorso === 'PAG:lettura'), 'parere sulla pagina «Lettura» salvato');
ok(/hai già scritto 1 parere/.test((await vis(C, '#sgp-bar')).t) && /Lascia un parere/.test((await vis(C, '#sgp-bar')).t), 'dopo l\'invio la barra dice «hai già scritto 1 parere» e propone di scriverne un altro');
// evento: la barra parla dell'evento
await ec(() => { shSec('usc'); uscOpen('uTest1'); }); await sleep(1400); await ec(() => window.scrollTo(0, 0)); await sleep(300);
const be = await vis(C, '#sgp-bar');
ok(be && be.inView && /Serata formativa/.test(be.t) && /Lascia un parere su questo evento/.test(be.t), 'dentro l\'evento: la barra cita l\'evento e propone «su questo evento» · ' + (be && be.t.slice(0, 120)));
await ec(() => document.querySelector('#sgp-bar .pbar-g').click()); await sleep(1200);
await ec(() => { document.getElementById('sg-nm-EVT:uTest1').value = 'Marco Rossi'; const t = document.getElementById('sg-ta-EVT:uTest1'); t.value = 'Parere di prova sull\'evento.'; t.dispatchEvent(new Event('input')); document.querySelector('#sgp-host .sg-a .ok').click(); }); await sleep(2000);
ok(db.t.pee_suggerimenti.length === 2, 'parere sull\'evento salvato (2 pareri in tutto)');
// pagine senza box (es. Calendario): nessuna barra
await ec(() => shCal()); await sleep(1200);
ok(!(await vis(C, '#sgp-bar')), 'su una pagina senza box dei pareri (Calendario) la barra non c\'è');

// ───── 2. Capo Gruppo: numerino nel menu e avviso in alto ─────
await ea(() => sgLoad(true)); await sleep(2000);
await go(A, 'osservazione');
const nb = () => ea(() => { const o = {}; document.querySelectorAll('#sh-side .sh-si').forEach(b => { const n = b.querySelector('.sh-nb'); o[b.dataset.id] = n ? n.innerText.replace(/\s+/g, ' ').trim() : ''; }); const bb = [...document.querySelectorAll('#sh-bb .sh-bbb')].map(b => (b.querySelector('.sh-nb') || {innerText: ''}).innerText.replace(/\s+/g, ' ').trim()); return {side: o, bb}; });
let N = await nb();
ok(N.side.st2 && /^1/.test(N.side.st2) && N.side.usc && /^1/.test(N.side.usc) && !N.side.st1 && !N.side['p-pf'] && !N.side['r-chk'], 'menu: numerino 1 su «Lettura» e su «Eventi per gli adulti», nessuno sulle altre voci · ' + JSON.stringify(N.side));
ok(N.bb.some(x => /^1/.test(x)), 'barra dei tasti in basso (telefono): c\'è un numerino sul tasto «Uscite» · ' + JSON.stringify(N.bb));
await go(A, 'lettura'); await ea(() => window.scrollTo(0, 0)); await sleep(300);
let ba = await vis(A, '#sgp-bar');
ok(ba && ba.inView && /Il Commissario di Sezione ha scritto 1 parere su questa pagina/.test(ba.t) && /1 da leggere/.test(ba.t), 'Capo Gruppo su «Lettura»: avviso in alto «ha scritto 1 parere… 1 da leggere» · ' + (ba && ba.t));
await go(A, 'osservazione'); await ea(() => window.scrollTo(0, 0)); await sleep(300);
ok(!(await vis(A, '#sgp-bar')), 'Capo Gruppo su una pagina senza pareri: nessun avviso');
await go(A, 'lettura'); await ea(() => window.scrollTo(0, 0)); await sleep(300);
if(process.env.SHOT){ await A.screenshot({path: process.env.SHOT + '-cg.png'}); }
await ea(() => document.querySelector('#sgp-bar .pbar-g').click()); await sleep(1500);
const hv = await host(A);
ok(hv.vis && hv.inView && /Parere di prova sulla lettura/.test(hv.t), '«Leggi ↓» porta al box con il parere, dentro lo schermo');
const hr = await ea(() => { const r = document.getElementById('sgp-host').getBoundingClientRect(); const b = document.getElementById('sgp-bar').getBoundingClientRect(); return r.top >= b.bottom - 2; });
ok(hr, 'il box non resta nascosto sotto la barra');
// segna come letto: il numerino e il «da leggere» spariscono
await ea(() => { const b = document.querySelector('#sgp-host .sg-a .ok'); b && b.click(); }); await sleep(2200);
N = await nb();
ok(!N.side.st2 && N.side.usc && /^1/.test(N.side.usc), 'dopo «Segna come letto» il numerino di «Lettura» sparisce, resta quello degli eventi · ' + JSON.stringify(N.side));
ba = await vis(A, '#sgp-bar');
ok(ba && /tutti letti/.test(ba.t), 'la barra dice «tutti letti» · ' + (ba && ba.t));
// evento: numerino resta finché non letto, avviso dentro l'evento
await ea(() => { shSec('usc'); uscOpen('uTest1'); }); await sleep(1400); await ea(() => window.scrollTo(0, 0)); await sleep(300);
ba = await vis(A, '#sgp-bar');
ok(ba && /su questo evento/.test(ba.t) && /1 da leggere/.test(ba.t), 'Capo Gruppo dentro l\'evento: avviso «su questo evento · 1 da leggere» · ' + (ba && ba.t));
// Lettore e Collaboratore non vedono né barra né numerini
const pl = await person(br, db, {ctx: dev0}); const L = pl.page;
await loginAs(L, base, lt); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await L.evaluate(() => (CL._inv || []).length)) break; await sleep(500); }
await L.evaluate(id => clOpenShared(id), pid); await sleep(4500);
await L.evaluate(() => { shPF(); }); await sleep(1500);
ok(!(await vis(L, '#sgp-bar')) && !(await L.evaluate(() => !!document.querySelector('#sh-side .sh-nb'))), 'il Lettore non vede né la barra né i numerini');
const errs = await ec(() => window.__errs || []); ok(!errs.length, 'nessun errore nella pagina del Commissario ' + JSON.stringify(errs).slice(0, 200));
await br.close(); process.exit(summary() ? 1 : 0);
