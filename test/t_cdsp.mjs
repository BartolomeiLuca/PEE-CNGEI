// «Parere sul progetto» (box in fondo alle 5 pagine del progetto Capo Gruppo e a ogni evento, lo scrive solo il Commissario di Sezione)
// + risposta del Capo Gruppo ai pareri e ai suggerimenti
// uso: node t_cdsp.mjs [motore | profilo di dispositivo come in t_cdsr.mjs]   (SITE = copia di prova, come gli altri test)
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

// il Capo Gruppo, prima di qualunque parere, non vede nessun box
await go(A, 'lettura');
ok(!(await host(A)).vis, 'senza pareri il Capo Gruppo non vede nessun box «Parere sul progetto»');

// ───── 2. il Commissario: il box c'è su ognuna delle 5 pagine e in ogni evento ─────
const pc = await person(br, db, {ctx: dev0}); const C = pc.page, ec = (f, a) => C.evaluate(f, a);
await loginAs(C, base, cm); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await ec(() => (CL._inv || []).length)) break; await sleep(500); }
await ec(id => clOpenShared(id), pid); await sleep(4500);
ok(await ec(() => !!window.BRO && clIsComm()), 'il Commissario apre il progetto in sola lettura');
const KEYS = {osservazione: 'PAG:osservazione', lettura: 'PAG:lettura', percorso: 'PAG:percorso', eventi: 'PAG:eventi', check: 'PAG:check'};
for (const pag of Object.keys(KEYS)){
  await go(C, pag); const h = await host(C);
  ok(h.vis && h.k === KEYS[pag] && /Parere sul progetto/.test(h.t || '') && h.add, `pagina «${pag}»: box con chiave ${KEYS[pag]} e pulsante per lasciare un parere (${h.vis ? h.k : 'assente'})`);
  { const no = await noOver(C); ok(h.inView && no, `pagina «${pag}»: il box sta dentro lo schermo (${arg})` + (h.inView ? '' : ' [box fuori]') + (no ? '' : ' [pagina più larga dello schermo]')); }
}
await ec(() => { shSec('usc'); uscOpen('uTest1'); }); await sleep(1300);
let h = await host(C);
ok(h.vis && h.k === 'EVT:uTest1' && /Parere su questo evento/.test(h.t) && /Serata formativa/.test(h.t), 'dentro l’evento il box è «Parere su questo evento» con il titolo dell’evento');
ok(h.inView && await noOver(C), 'dentro l’evento il box sta dentro lo schermo');
// torna all'elenco: si rimette il box della pagina
await ec(() => uscHome()); await sleep(1100); h = await host(C);
ok(h.vis && h.k === 'PAG:eventi', 'tornando all’elenco degli eventi il box torna quello della pagina');

// scrive un parere sulla pagina «Lettura» e uno nell'evento, dall'interfaccia
const scrivi = async (k, nome, testo) => {
  await ec(k0 => { const b = document.querySelector('#sgp-host .sg-add'); b && b.click(); }, k); await sleep(500);
  const okForm = await ec(k0 => !!document.getElementById('sg-ta-' + k0) && !!document.getElementById('sg-nm-' + k0), k);
  if(!okForm) return false;
  await ec(([k0, n, t]) => { const nm = document.getElementById('sg-nm-' + k0), ta = document.getElementById('sg-ta-' + k0); nm.value = n; ta.value = t; ta.dispatchEvent(new Event('input')); document.querySelector('#sgp-host .sg-a .ok').click(); }, [k, nome, testo]);
  await sleep(1800); return true;
};
await go(C, 'lettura');
ok(await scrivi('PAG:lettura', 'Marco Rossi', 'La lettura è chiara, ma manca il confronto con l’anno scorso.'), 'il modulo del parere si apre sulla pagina «Lettura»');
await ec(() => { shSec('usc'); uscOpen('uTest1'); }); await sleep(1300);
ok(await scrivi('EVT:uTest1', 'Marco Rossi', 'La serata è ben costruita; curerei di più il debriefing.'), 'il modulo del parere si apre dentro l’evento');
const rows = db.t.pee_suggerimenti.map(x => x.percorso + '|' + x.autore_nome);
ok(rows.join() === 'PAG:lettura|Marco Rossi · Commissario di Sezione,EVT:uTest1|Marco Rossi · Commissario di Sezione', 'pareri salvati con chiave e firma: ' + rows.join(' ; '));
h = await host(C);
ok(/Marco Rossi · Commissario di Sezione/.test(h.t) && /Elimina/.test(h.t), 'il Commissario rivede il suo parere nel box dell’evento, con «Elimina»');

// non modifica il progetto
const before = JSON.stringify(db.t.pee_archivi.find(r => r.id === pid).data);
await ec(() => { try{ scheda.uscite.uTest1.testo = 'MODIFICATO'; saveData(true); }catch(e){} }); await sleep(3500);
ok(JSON.stringify(db.t.pee_archivi.find(r => r.id === pid).data) === before, 'il Commissario non scrive sul progetto (resta identico)');

// ───── 3. Lettore e Collaboratore: niente box ─────
const pd = await person(br, db, {ctx: dev0}); const D = pd.page, ed = (f, a) => D.evaluate(f, a);
await loginAs(D, base, lt); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await ed(() => (CL._inv || []).length)) break; await sleep(500); }
await ed(id => clOpenShared(id), pid); await sleep(4500);
let none = true; for (const pag of Object.keys(KEYS)){ await go(D, pag); if((await host(D)).vis) none = false; }
await ed(() => { shSec('usc'); uscOpen('uTest1'); }); await sleep(1100); if((await host(D)).vis) none = false;
ok(none, 'il Lettore non vede il box in nessuna pagina né in un evento');
await pd.ctx.close();
const pe = await person(br, db, {ctx: dev0}); const E = pe.page, ee = (f, a) => E.evaluate(f, a);
await loginAs(E, base, co); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await ee(() => (CL._inv || []).length)) break; await sleep(500); }
await ee(id => clOpenShared(id), pid); await sleep(4500);
none = true; for (const pag of Object.keys(KEYS)){ await go(E, pag); if((await host(E)).vis) none = false; }
ok(none && await ee(() => !window.BRO), 'il Collaboratore (che modifica) non vede il box in nessuna pagina');
await pe.ctx.close();

// ───── 4. il Capo Gruppo legge il parere nel box e risponde ─────
await ea(() => sgLoad(true)); await sleep(1500);
await go(A, 'lettura'); h = await host(A);
ok(h.vis && h.k === 'PAG:lettura' && /Pareri del Commissario di Sezione/.test(h.t) && /confronto con l’anno scorso/.test(h.t) && /da leggere/.test(h.t) && /Rispondi/.test(h.t) && !h.add, 'il Capo Gruppo vede il parere sulla pagina «Lettura» («da leggere», «Rispondi», senza modulo per scrivere)');
await go(A, 'osservazione'); ok(!(await host(A)).vis, 'sulle pagine senza pareri il box del Capo Gruppo resta nascosto');
await go(A, 'lettura');
const idL = db.t.pee_suggerimenti.find(x => x.percorso === 'PAG:lettura').id;
await ea(() => { [...document.querySelectorAll('#sgp-host .sg-a button')].find(b => /Rispondi/.test(b.innerText)).click(); }); await sleep(500);
ok(await ea(i => !!document.getElementById('sg-rt-' + i), idL), '«Rispondi» apre il campo della risposta');
await ea(i => { document.getElementById('sg-rn-' + i).value = 'Luca'; const t = document.getElementById('sg-rt-' + i); t.value = 'Grazie, aggiungo il confronto nella prossima versione.'; t.dispatchEvent(new Event('input')); [...document.querySelectorAll('#sgp-host .sg-box .sg-a button')].find(b => /Invia la risposta/.test(b.innerText)).click(); }, idL);
await sleep(1800);
let rw = db.t.pee_suggerimenti.find(x => x.id === idL);
ok(rw.risposta === 'Grazie, aggiungo il confronto nella prossima versione.' && rw.risposta_da === 'Luca' && !!rw.risposta_il && rw.stato === 'letto', 'risposta salvata: «' + String(rw.risposta).slice(0, 30) + '…» di ' + rw.risposta_da + ', segnato come letto (' + rw.stato + ')');
h = await host(A);
ok(/Risposta di Luca/.test(h.t) && /Modifica la risposta/.test(h.t) && /Togli la risposta/.test(h.t) && !/da leggere/.test(h.t), 'il Capo Gruppo rivede la risposta con «Modifica» e «Togli»');
{ const no = await noOver(A), hi = (await host(A)).inView; ok(no && hi, 'il box con la risposta sta dentro lo schermo' + (hi ? '' : ' [box fuori]') + (no ? '' : ' [pagina più larga dello schermo]')); }

// ───── 5. il Commissario vede la risposta solo sul suo parere ─────
await ec(() => sgLoad(true)); await sleep(1500);
await go(C, 'lettura'); h = await host(C);
ok(/Risposta di Luca/.test(h.t) && /aggiungo il confronto/.test(h.t) && !/Rispondi|Modifica la risposta/.test(h.t), 'il Commissario legge la risposta sul suo parere, senza pulsanti per rispondere');
const nres = await ec(() => SG.list.filter(x => x.risposta).length);
ok(nres === 1, 'la risposta compare solo sul parere a cui si riferisce');

// ───── 6. modificare e togliere la risposta ─────
await ea(() => { [...document.querySelectorAll('#sgp-host .sg-a button')].find(b => /Modifica la risposta/.test(b.innerText)).click(); }); await sleep(500);
const pre = await ea(i => document.getElementById('sg-rt-' + i).value, idL);
ok(/aggiungo il confronto/.test(pre), '«Modifica la risposta» riapre il campo con il testo già scritto');
await ea(i => { const t = document.getElementById('sg-rt-' + i); t.value = 'Aggiunto: vedi la nuova versione.'; t.dispatchEvent(new Event('input')); [...document.querySelectorAll('#sgp-host .sg-box .sg-a button')].find(b => /Invia la risposta/.test(b.innerText)).click(); }, idL); await sleep(1800);
ok(db.t.pee_suggerimenti.find(x => x.id === idL).risposta === 'Aggiunto: vedi la nuova versione.', 'risposta modificata');
globalThis.confirm = undefined; await A.evaluate(() => { window.confirm = () => true; });
await ea(() => { [...document.querySelectorAll('#sgp-host .sg-a button')].find(b => /Togli la risposta/.test(b.innerText)).click(); }); await sleep(1800);
rw = db.t.pee_suggerimenti.find(x => x.id === idL);
ok(rw.risposta == null && rw.risposta_da == null && rw.risposta_il == null, 'risposta tolta: spariscono testo, firma e data');
await ea(() => { [...document.querySelectorAll('#sgp-host .sg-a button')].find(b => /Rispondi/.test(b.innerText)).click(); }); await sleep(400);
await ea(i => { document.getElementById('sg-rn-' + i).value = 'Luca'; document.getElementById('sg-rt-' + i).value = ''; [...document.querySelectorAll('#sgp-host .sg-box .sg-a button')].find(b => /Invia la risposta/.test(b.innerText)).click(); }, idL); await sleep(700);
ok(db.t.pee_suggerimenti.find(x => x.id === idL).risposta == null, 'una risposta vuota non viene inviata');
await ea(() => sg13Rep(null)); await sleep(300);

// ───── 7. la risposta anche sulla scheda di una persona (suggerimento / parere su Paolo Riva) ─────
await ec(() => dbSgAdd(CL.ctx.id, 'S:Paolo Riva|P1', sgFirma('Marco Rossi'), 'Su Paolo osserverei anche la capacità di delegare.')); await sleep(800);
await ea(() => { sgLoad(true); STAFF_VIEW = 'osservazione'; CURRENT_MEMBER = 'Paolo Riva'; goPhase(1); renderStaffPhase1(); }); await sleep(1800);
await ea(() => { const b = document.querySelector('.pc[data-stcard] .sg-pill'); b && b.click(); }); await sleep(500);
const hasRep = await ea(() => !![...document.querySelectorAll('.pc[data-stcard] .sg-a button')].find(b => /Rispondi/.test(b.innerText)));
ok(hasRep, 'sulla scheda di una persona il Capo Gruppo ha «Rispondi» sotto il parere');
if(hasRep){
  const idP = db.t.pee_suggerimenti.find(x => x.percorso === 'S:Paolo Riva|P1').id;
  await ea(() => { [...document.querySelectorAll('.pc[data-stcard] .sg-a button')].find(b => /Rispondi/.test(b.innerText)).click(); }); await sleep(500);
  await ea(i => { document.getElementById('sg-rn-' + i).value = 'Luca'; const t = document.getElementById('sg-rt-' + i); t.value = 'Buon punto, lo osservo al prossimo campo.'; t.dispatchEvent(new Event('input')); [...document.querySelectorAll('.pc[data-stcard] .sg-box .sg-a button')].find(b => /Invia la risposta/.test(b.innerText)).click(); }, idP); await sleep(1800);
  ok(/prossimo campo/.test(db.t.pee_suggerimenti.find(x => x.id === idP).risposta || ''), 'risposta sulla scheda della persona salvata');
  await ec(() => { sgLoad(true); STAFF_VIEW = 'osservazione'; CURRENT_MEMBER = 'Paolo Riva'; goPhase(1); renderStaffPhase1(); }); await sleep(1800);
  const pill = await ec(() => { const w = document.querySelector('.pc[data-stcard] .sg-pill'); return w ? w.innerText : ''; });
  ok(/1 risposta/.test(pill), 'al Commissario la scheda annuncia «' + pill + '»');
}

// ───── 8. database NON aggiornato (manca il secondo SQL): niente errori, niente pulsanti di risposta ─────
db.sqlRisp = false;
await ea(() => { CL._sgRep = undefined; return sgLoad(true); }); await sleep(1500);
await go(A, 'lettura'); h = await host(A);
ok(h.vis && /confronto con l’anno scorso/.test(h.t) && !/Rispondi/.test(h.t), 'con il database vecchio il Capo Gruppo vede comunque i pareri, senza «Rispondi»');
ok(await ea(() => CL._sgRep === false), 'l’app ha capito che le colonne mancano e non riprova a ogni lettura');
await ec(() => { CL._sgRep = undefined; return sgLoad(true); }); await sleep(1500);
await go(C, 'lettura'); h = await host(C);
ok(h.vis && h.add && !/Risposta di/.test(h.t), 'con il database vecchio il Commissario scrive e vede i suoi pareri come prima');
db.sqlRisp = true;

await pa.ctx.close(); await pc.ctx.close();
await br.close(); process.exit(summary() ? 1 : 0);
