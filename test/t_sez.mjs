// «Gruppi della Sezione» (pezzo 1): il Commissario vede, dentro il suo progetto, i Gruppi che lo hanno invitato, con le due letture etichettate.
// Si controlla: chi vede la scheda, i valori delle due letture, che nulla del Capo Gruppo venga copiato nel progetto del Commissario,
// l'aggiornamento (e la non-rilettura se nulla è cambiato), la revoca dell'invito, gli inviti di altri anni e di altri ruoli.
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
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB(); db.sql13 = true;
const br = await launch(engine);
const until = async (fn, ms = 20000, step = 300) => { const t = Date.now(); while(Date.now() - t < ms){ try{ if(await fn()) return true; }catch(e){} await sleep(step); } return false; };
const mkU = (mail, nome, ruolo, gr) => { const u = db.addUser(mail, 'password123', nome); db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:gr, area_rcdf:'altoadriatico', dashboard:{}}); return u; };
const CO = mkU('comm@x.it', 'Marco Commissario', 'cds', null);
const G1 = mkU('g1@x.it', 'Gina Uno', 'cg', '1'), G2 = mkU('g2@x.it', 'Dario Due', 'cg', '2'), G3 = mkU('g3@x.it', 'Tina Tre', 'cg', '3');

// un Capo Gruppo crea il suo progetto formativo dall'interfaccia e lo riempie: n persone osservate con valori fissi per Ambito
async function capoGruppo(u, nomeGruppo, persone, val){
  const pa = await person(br, db, {ctx: dev0}), P = pa.page; await loginAs(P, base, u); await sleep(2500);
  await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500);
  await P.evaluate(([nome, ps, v]) => {
    UNIT_NAME = nome; STAFF_MEMBERS = ps.map(p => p.n); STAFF_MEMBERS.forEach((n, k) => { staffProfiles[n] = {ruolo:'CU'}; staffObs[n] = {}; if(ps[k].obs) ['P', 'C', 'S'].forEach(a => DB[a].forEach(q => { staffObs[n][q.id] = v[a]; })); });
    _clTouched = true; _clUserAt = Date.now(); saveData(true); }, [nomeGruppo, persone, val]);
  let row = null; await until(async () => { row = db.t.pee_archivi.find(r => r.user_id === u.id && r.data && r.data.STAFF_MEMBERS && r.data.STAFF_MEMBERS.length === persone.length && r.data.UNIT_NAME === nomeGruppo); return !!row; }, 15000);
  await pa.ctx.close(); return row;
}
const R1 = await capoGruppo(G1, 'CdG Alfa', [{n:'ZQ-G1-Anna', obs:1}, {n:'ZQ-G1-Piero', obs:1}, {n:'ZQ-G1-Rita', obs:1}], {P:8, C:4, S:2});
const R2 = await capoGruppo(G2, 'CdG Beta', [{n:'ZQ-G2-Luca', obs:1}, {n:'ZQ-G2-Ines', obs:0}], {P:6, C:6, S:6});
const R3 = await capoGruppo(G3, 'CdG Gamma', [{n:'ZQ-G3-Zeno', obs:1}], {P:5, C:5, S:5});
ok(!!R1 && !!R2 && !!R3, 'tre Capi Gruppo hanno creato e riempito il loro progetto formativo');
// il Commissario: progetto proprio, con Gina già nella tabella «I miei Capi Gruppo» (osservata 9/7/5)
const pc = await person(br, db, {ctx: dev0}), C = pc.page, ev = (f, a) => C.evaluate(f, a);
await loginAs(C, base, CO); await sleep(2500);
await C.click('.sh-big >> nth=0'); await sleep(300); await C.click('#sh-ncre'); await sleep(3500);
await ev(() => { STAFF_MEMBERS = ['Gina Uno']; staffProfiles['Gina Uno'] = {ruolo:'CG', link:{mail:'g1@x.it'}}; staffObs['Gina Uno'] = {}; ['P', 'C', 'S'].forEach(a => DB[a].forEach(q => { staffObs['Gina Uno'][q.id] = {P:9, C:7, S:5}[a]; })); _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(1500);
const inv = (r, u, mail, ruolo, id) => db.t.pee_membri.push({id, archivio_id:r.id, owner_id:u.id, owner_email:mail, email:'comm@x.it', ruolo, visto_il:null, created_at:'2026-11-01T10:00:00Z'});
inv(R1, G1, 'Gina Uno (g1@x.it)', 'commissario', 'mA'); inv(R2, G2, 'Dario Due (g2@x.it)', 'commissario', 'mB'); inv(R3, G3, 'Tina Tre (g3@x.it)', 'lettore', 'mC');   // G3 lo ha invitato solo come lettore

const me = await ev(() => ({cds: cgCds(), anno: CL.ctx.anno, id: CL.ctx.id}));
ok(me.cds, 'il Commissario ha il suo progetto formativo (veste Commissario)');

// 1) menu
const nav = await ev(() => document.getElementById('sh-side').innerText);
ok(/Gruppi della Sezione/.test(nav), 'menu: «Gruppi della Sezione» presente per il Commissario');
await ev(() => shSheet('Altro')); await sleep(300);
ok(/Gruppi della Sezione/.test(await ev(() => document.getElementById('sh-sheet-in').innerText)), 'telefono: «Gruppi della Sezione» anche in «Altro»'); await ev(() => shSheetClose());

// 2) la pagina
await ev(() => shSez());
ok(await until(() => ev(() => /CdG Alfa/.test(document.getElementById('panel-pp').innerText)), 15000), 'pagina: compare il Gruppo di Gina');
if(process.env.SHOT){ await sleep(500); await C.screenshot({path: process.env.SHOT + '-alto.png'}); await C.screenshot({path: process.env.SHOT + '-intera.png', fullPage: true}); }
const T = await ev(() => document.getElementById('panel-pp').innerText);
ok(/CdG Beta/.test(T), 'pagina: compare anche il secondo Gruppo');
ok(!/CdG Gamma/.test(T), 'pagina: non compare il Gruppo che lo ha invitato solo come lettore');
ok(/Osservazione dei Capi Gruppo/.test(T) && /fatta da te/.test(T) && /Osservazione degli Staff/.test(T) && /fatta dal Capo Gruppo/.test(T), 'pagina: le due letture sono etichettate');
const rowsOf = nome => ev(n => { const s = [...document.querySelectorAll('#panel-pp section')].find(x => x.getAttribute('aria-label') === n); if(!s) return null; const bl = [...s.querySelectorAll('tbody')].map(t => [...t.querySelectorAll('tr')].map(r => [...r.children].map(c => c.innerText.replace(/\s+/g, ' ').trim()))); return bl[0].map((r, i) => [r[0], r[1], bl[1][i][1]]); }, nome);
const A = await rowsOf('CdG Alfa'), B = await rowsOf('CdG Beta');
ok(JSON.stringify(A) === JSON.stringify([['Personale', '9 consolidato', '8 presente'], ['Comunitario', '7 presente', '4 tracce iniziali'], ['Spirituale', '5 in sviluppo', '2 non emerge']]), 'valori del Gruppo Alfa: tua lettura 9/7/5, staff 8/4/2 · ' + JSON.stringify(A));
ok(JSON.stringify(B) === JSON.stringify([['Personale', '—', '6 in sviluppo'], ['Comunitario', '—', '6 in sviluppo'], ['Spirituale', '—', '6 in sviluppo']]), 'valori del Gruppo Beta: nessuna tua lettura (non è nella tua tabella), staff 6/6/6 · ' + JSON.stringify(B));
ok(/Non hai ancora osservato questo Capo Gruppo/.test(T), 'pagina: dice che il Capo Gruppo del Gruppo Beta non è ancora nella tabella');
ok(/3 persone, 3 con almeno una osservazione/.test(T) && /2 persone, 1 con almeno una osservazione/.test(T), 'pagina: conteggio dello staff (3 su 3, 1 su 2)');

const fuori = await ev(() => { const W = document.documentElement.clientWidth; return [...document.querySelectorAll('#panel-pp section table')].filter(t => t.getBoundingClientRect().right > W + 1 || t.getBoundingClientRect().left < -1).length; });
ok(fuori === 0, 'le due letture stanno dentro lo schermo (nessuna fuori vista)');
// 3) nulla del Capo Gruppo viene copiato nel progetto del Commissario
await sleep(1500);
const mine = db.t.pee_archivi.find(r => r.id === me.id); const js = JSON.stringify(mine.data);
ok(!/ZQ-G1|ZQ-G2|ZQ-G3/.test(js), 'dati del Commissario: nessun nome delle persone dello staff dei Gruppi è stato copiato');
ok(!/CdG Gamma/.test(js), 'dati del Commissario: il Gruppo non invitato non c\'è');
const V = mine.data.scheda && mine.data.scheda.sez && mine.data.scheda.sez.visti || {};
ok(Object.keys(V).sort().join() === [R1.id, R2.id].sort().join() && V[R1.id].n === 'CdG Alfa' && V[R2.id].n === 'CdG Beta', 'dati del Commissario: si ricordano solo id e nome dei due Gruppi visti');

// 4) nessuna rilettura se nulla è cambiato; rilettura se il Gruppo ha aggiornato
await ev(([i]) => { SH._sez.cache[i].__m = 1; }, [R1.id]); await ev(() => shGoHome && 0); await ev(() => shSez()); await sleep(2500);
ok(await ev(([i]) => SH._sez.cache[i].__m === 1, [R1.id]), 'riapertura senza novità: i dati del Gruppo non vengono riletti');
{ const r = db.t.pee_archivi.find(x => x.id === R1.id); r.data.staffObs['ZQ-G1-Anna']['P1'] = 10; ['P', 'C', 'S'].forEach(a => 0); r.updated_at = new Date(Date.now() + 5000).toISOString(); }
await ev(() => shSez()); await sleep(2500);
ok(await ev(([i]) => SH._sez.cache[i].__m === undefined, [R1.id]), 'il Gruppo ha aggiornato il progetto: alla riapertura viene riletto');
{ const A2 = await rowsOf('CdG Alfa'); ok(/^8,\d presente$/.test(A2[0][2]) && A2[0][2] !== '8 presente', 'il valore nuovo del Gruppo si vede (Personale, staff: ' + A2[0][2] + ')'); }
const g1Snap = JSON.stringify(db.t.pee_archivi.find(r => r.id === R1.id)), g2Snap = JSON.stringify(db.t.pee_archivi.find(r => r.id === R2.id)), g3Snap = JSON.stringify(db.t.pee_archivi.find(r => r.id === R3.id));

// 5) invito di un altro anno: non compare, ma si dice
const old = JSON.parse(JSON.stringify(db.t.pee_archivi.find(r => r.id === R2.id))); old.id = 'vecchio1'; old.anno = Number(me.anno) - 1; old.data.UNIT_NAME = 'CdG Vecchio'; db.t.pee_archivi.push(old);
inv(old, G2, 'Dario Due (g2@x.it)', 'commissario', 'mD');
await ev(() => { SH._sez.st = 'x'; shSez(); }); await sleep(2500);
const T5 = await ev(() => document.getElementById('panel-pp').innerText);
ok(!/CdG Vecchio/.test(T5) && /1 invito per altri anni scout/.test(T5), 'invito di un altro anno scout: non compare, c\'è la riga che spiega perché');

// 6) revoca: il Gruppo sparisce, resta la riga, il Commissario può toglierla
db.t.pee_membri = db.t.pee_membri.filter(m => m.id !== 'mB');
await ev(() => shSez()); await sleep(2500);
const T6 = await ev(() => document.getElementById('panel-pp').innerText);
ok(!/Osservazione degli Staff[\s\S]*6 in sviluppo/.test(T6) && await ev(() => ![...document.querySelectorAll('#panel-pp section')].some(s => s.getAttribute('aria-label') === 'CdG Beta')), 'invito revocato: il Gruppo Beta non è più nell\'elenco');
ok(/Il Gruppo CdG Beta non condivide più il progetto/.test(T6), 'invito revocato: compare «Il Gruppo CdG Beta non condivide più il progetto»');
ok(/CdG Alfa/.test(T6), 'invito revocato: l\'altro Gruppo resta');
await C.click('text=Toglilo dall’elenco'); await sleep(1500);
ok(!/non condivide più/.test(await ev(() => document.getElementById('panel-pp').innerText)), 'la riga si toglie dall\'elenco');
await sleep(1500);
ok(!JSON.stringify(db.t.pee_archivi.find(r => r.id === me.id).data).includes('CdG Beta'), 'dopo averla tolta, il nome del Gruppo non resta nei dati del Commissario');
ok(JSON.stringify(db.t.pee_archivi.find(r => r.id === R1.id)) === g1Snap && JSON.stringify(db.t.pee_archivi.find(r => r.id === R2.id)) === g2Snap && JSON.stringify(db.t.pee_archivi.find(r => r.id === R3.id)) === g3Snap, 'i progetti dei tre Capi Gruppo sono identici a prima: il Commissario non ha scritto nulla');

// 7) chi non è Commissario non vede la scheda
const pg = await person(br, db, {ctx: dev0}), Gp = pg.page; await loginAs(Gp, base, G1); await sleep(2500);
await Gp.evaluate(id => clOpenProject(id), R1.id); await sleep(3500);
ok(!/Gruppi della Sezione/.test(await Gp.evaluate(() => document.getElementById('sh-side').innerText)), 'un Capo Gruppo non vede «Gruppi della Sezione» nel suo menu');
const errs = await ev(() => window.__errs || []); ok(!errs.length, 'nessun errore nella pagina del Commissario ' + JSON.stringify(errs).slice(0, 200));
await br.close(); process.exit(summary() ? 1 : 0);
