// Calendario per Capo Gruppo e Commissario: eventi per gli adulti, momenti formativi da collocare; il Commissario vede anche gli eventi dei Gruppi (sola lettura, con il nome del Gruppo).
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
const cap = async (pg, f, a) => pg.evaluate(f, a);
const creaEv = async (P, m, titolo, data) => { await P.evaluate(([m, t, d]) => { shCal(); calNew(m); document.getElementById('cal-nt').value = t; document.getElementById('cal-d1').value = d; calMake(); }, [m, titolo, data]); await sleep(500); };

// ── un Capo Gruppo: progetto formativo + eventi creati dal calendario ──
async function capoGruppo(u, nomeGruppo, eventi, prova){
  const pa = await person(br, db, {ctx: dev0}), P = pa.page; await loginAs(P, base, u); await sleep(2500);
  await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500);
  await P.evaluate(([nome]) => { UNIT_NAME = nome; STAFF_MEMBERS = ['Capo Unità A']; staffProfiles['Capo Unità A'] = {ruolo:'CU'}; staffObs['Capo Unità A'] = {}; _clTouched = true; _clUserAt = Date.now(); saveData(true); }, [nomeGruppo]);
  if(prova){
    const nav = await P.evaluate(() => document.getElementById('sh-side').innerText);
    ok(/Calendario/.test(nav), 'Capo Gruppo: «Calendario» nel menu');
    await P.evaluate(() => shCal()); await sleep(600);
    const t0 = await P.evaluate(() => document.getElementById('panel-pp').innerText);
    ok(/Calendario/.test(t0) && !/Questo ciclo|Tutto l’anno/.test(t0) && !/Per l’Unità/.test(t0), 'Capo Gruppo: calendario senza cicli né «Per l’Unità»');
    await P.evaluate(() => calNew('sede')); await sleep(300);
    const f0 = await P.evaluate(() => document.querySelector('.cal-new').innerText);
    ok(!/Per chi/.test(f0) && /Tipo di attività formativa/.test(f0), 'Capo Gruppo: il modulo di un nuovo evento non chiede «Per chi» e propone i tipi formativi');
    await P.evaluate(() => { calNew('sede'); }); // chiude/riapre senza effetti
  }
  for(const [m, t, d] of eventi) await creaEv(P, m, t, d);
  if(prova){
    const r = await P.evaluate(() => [...document.querySelectorAll('#panel-pp .cal-row')].map(e => e.innerText.replace(/\s+/g, ' ').trim()));
    ok(r.length === eventi.length && !r.some(x => /Unità|Staff/.test(x.replace(/Capo Unità/g, ''))), 'Capo Gruppo: gli eventi creati sono nel calendario, senza etichette Unità/Staff · ' + JSON.stringify(r).slice(0, 200));
    const ev = await P.evaluate(() => Object.values(scheda.uscite || {}).map(u => ({t:u.testo, dest:u.dest, d:(u.ax || {}).data})));
    ok(ev.length === eventi.length && ev.every(e => e.dest === 'staff'), 'Capo Gruppo: gli eventi salvati sono eventi per gli adulti (dest staff) · ' + JSON.stringify(ev).slice(0, 160));
    // momento del Percorso formativo da collocare
    await P.evaluate(() => { scheda.pf = [{id:'fx1', nome:'Serata ZQ-G1-clima di staff', cat:'Team Building', sit:'', desc:''}]; _clTouched = true; _clUserAt = Date.now(); saveData(true); shCal(); }); await sleep(600);
    const pool = await P.evaluate(() => document.querySelector('.cal-pool') ? document.querySelector('.cal-pool').innerText : '');
    ok(/Serata ZQ-G1-clima di staff/.test(pool) && /Da collocare/.test(pool), 'Capo Gruppo: il momento formativo compare in «Da collocare»');
    const evId = await P.evaluate(() => Object.values(scheda.uscite)[0].id);
    await P.evaluate(id => { const s = document.querySelector('.cal-pool select.cal-sel'); s.value = id; s.dispatchEvent(new Event('change', {bubbles:true})); }, evId); await sleep(600);
    ok(await P.evaluate(() => scheda.pf[0].ev) === evId, 'Capo Gruppo: «Metti in…» collega il momento formativo all\'evento');
    // un evento si può aprire dal calendario
    await P.evaluate(id => shSrUsc(id), evId); await sleep(900);
    ok(await P.evaluate(() => schedaStep === 'usc' && !!USC_CUR), 'Capo Gruppo: «Apri» porta alla pagina dell\'evento');
    // eliminarlo dal calendario
    await P.evaluate(() => { window.confirm = () => true; shCal(); }); await sleep(500);
    const n0 = await P.evaluate(() => document.querySelectorAll('#panel-pp .cal-row').length);
    await P.evaluate(() => { const b = document.querySelector('#panel-pp .cal-row .cal-del'); b.click(); }); await sleep(600);
    ok(await P.evaluate(() => document.querySelectorAll('#panel-pp .cal-row').length) === n0 - 1, 'Capo Gruppo: «Elimina» toglie l\'evento dal calendario');
    // lo rimetto (per avere gli eventi attesi dal Commissario)
    await creaEv(P, eventi[0][0], eventi[0][1] + ' bis', eventi[0][2]);
  }
  let row = null; await until(async () => { row = db.t.pee_archivi.find(r => r.user_id === u.id && r.data && r.data.UNIT_NAME === nomeGruppo && Object.values((r.data.scheda || {}).uscite || {}).filter(x => !x.del).length >= eventi.length); return !!row; }, 15000);
  await pa.ctx.close(); return row;
}
const R1 = await capoGruppo(G1, 'CdG Alfa', [['sede', 'ZQ-G1-Riunione di staff', '2026-12-10'], ['giorno', 'ZQ-G1-Uscita formativa', '2027-01-20']], true);
const R2 = await capoGruppo(G2, 'CdG Beta', [['bivacco', 'ZQ-G2-Bivacco dei Capi', '2026-12-01']], false);
const R3 = await capoGruppo(G3, 'CdG Gamma', [['sede', 'ZQ-G3-Riunione Gamma', '2026-12-05']], false);
ok(!!R1 && !!R2 && !!R3, 'tre Capi Gruppo hanno creato il progetto e gli eventi');
// un evento di Gina è «aperto» ai Capi Unità, gli altri sono riservati
{ const ev = Object.values(R1.data.scheda.uscite).filter(x => !x.del).find(x => /Uscita formativa/.test(x.testo)); ev.aperta = true; R1.updated_at = new Date(Date.now() + 3000).toISOString(); }

// ── il Commissario: progetto proprio, un suo evento, poi gli inviti ──
const pc = await person(br, db, {ctx: dev0}), C = pc.page, ev = (f, a) => C.evaluate(f, a);
await loginAs(C, base, CO); await sleep(2500);
await C.click('.sh-big >> nth=0'); await sleep(300); await C.click('#sh-ncre'); await sleep(3500);
await ev(() => { STAFF_MEMBERS = ['Gina Uno']; staffProfiles['Gina Uno'] = {ruolo:'CG', link:{mail:'g1@x.it'}}; staffObs['Gina Uno'] = {}; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await creaEv(C, 'sede', 'Riunione di Sezione dei Capi Gruppo', '2026-12-15');
const inv = (r, u, mail, ruolo, id) => db.t.pee_membri.push({id, archivio_id:r.id, owner_id:u.id, owner_email:mail, email:'comm@x.it', ruolo, visto_il:null, created_at:'2026-11-01T10:00:00Z'});
inv(R1, G1, 'Gina Uno (g1@x.it)', 'commissario', 'mA'); inv(R2, G2, 'Dario Due (g2@x.it)', 'commissario', 'mB'); inv(R3, G3, 'Tina Tre (g3@x.it)', 'lettore', 'mC');
const me = await ev(() => ({id: CL.ctx.id}));
ok(/Calendario/.test(await ev(() => document.getElementById('sh-side').innerText)), 'Commissario: «Calendario» nel menu');
await ev(() => shSheet('Altro')); await sleep(300);
ok(/Calendario/.test(await ev(() => document.getElementById('sh-sheet-in').innerText)), 'telefono: «Calendario» anche in «Altro»'); await ev(() => shSheetClose());
const g1Snap = JSON.stringify(db.t.pee_archivi.find(r => r.id === R1.id)), g2Snap = JSON.stringify(db.t.pee_archivi.find(r => r.id === R2.id)), g3Snap = JSON.stringify(db.t.pee_archivi.find(r => r.id === R3.id));
await ev(() => shCal());
ok(await until(() => ev(() => document.querySelectorAll('#panel-pp .cal-gr').length >= 3), 15000), 'Commissario: gli eventi dei Gruppi compaiono nel calendario');
const rows = () => ev(() => [...document.querySelectorAll('#panel-pp .cal-row')].map(e => ({gr: e.classList.contains('cal-gr'), t: e.innerText.replace(/\s+/g, ' ').trim(), btn: e.querySelectorAll('button').length})));
let R = await rows();
ok(R.length === 4 && R.filter(x => x.gr).length === 3, 'Commissario: 3 eventi dei Gruppi + 1 suo · ' + R.length);
ok(R.every(x => /ZQ-G2-Bivacco|ZQ-G3|ZQ-G1|Riunione di Sezione/.test(x.t)) && !R.some(x => /ZQ-G3/.test(x.t)), 'Commissario: non compaiono gli eventi del Gruppo che lo ha invitato solo come lettore');
const ord = R.map(x => (x.t.match(/ZQ-G\d-[A-Za-zì ]+|Riunione di Sezione/) || [''])[0].trim());
ok(ord[0].includes('ZQ-G2-Bivacco') && ord[1].includes('ZQ-G1-Riunione') && ord[2].includes('Riunione di Sezione') && ord[3].includes('ZQ-G1-Uscita'), 'Commissario: eventi in ordine di data (1/12, 10/12, 15/12, 20/1) · ' + JSON.stringify(ord));
ok(R.filter(x => x.gr).every(x => x.btn === 0), 'Commissario: gli eventi dei Gruppi sono in sola lettura (nessun pulsante)');
ok(R.filter(x => x.gr).every(x => /CdG (Alfa|Beta)/.test(x.t)), 'Commissario: ogni evento dei Gruppi porta il nome del Gruppo');
ok(R.filter(x => !x.gr)[0].btn >= 3, 'Commissario: il suo evento ha Apri, Duplica, Elimina');
ok(R.filter(x => x.gr && /Riservato/.test(x.t)).length === 2 && !/Riservato/.test(R.find(x => /Uscita formativa/.test(x.t)).t), 'Commissario: «Riservato» sui due eventi non aperti, non su quello aperto da Gina');
// filtri
await C.click('button:has-text("Solo i miei")'); await sleep(300); R = await rows();
ok(R.length === 1 && !R[0].gr, 'filtro «Solo i miei»: solo il suo evento');
await C.click('#panel-pp .sh-seg button:has-text("CdG Beta")'); await sleep(300); R = await rows();
ok(R.length === 1 && /ZQ-G2-Bivacco/.test(R[0].t), 'filtro «CdG Beta»: solo gli eventi di quel Gruppo');
await C.click('#panel-pp .sh-seg button:has-text("Tutti")'); await sleep(300); R = await rows();
ok(R.length === 4, 'filtro «Tutti»: tutti');
if(process.env.SHOT){ await ev(() => window.scrollTo(0, 0)); await sleep(300); await C.screenshot({path: process.env.SHOT + '-cal.png'}); await C.screenshot({path: process.env.SHOT + '-cal-intera.png', fullPage: true}); }
// nessuna copia
await sleep(1500);
const js = JSON.stringify(db.t.pee_archivi.find(r => r.id === me.id).data);
ok(!/ZQ-G1|ZQ-G2|ZQ-G3/.test(js), 'dati del Commissario: nessun evento dei Gruppi è stato copiato');
ok(JSON.stringify(db.t.pee_archivi.find(r => r.id === R1.id)) === g1Snap && JSON.stringify(db.t.pee_archivi.find(r => r.id === R2.id)) === g2Snap && JSON.stringify(db.t.pee_archivi.find(r => r.id === R3.id)) === g3Snap, 'i progetti dei Capi Gruppo sono identici a prima');
// il suo evento si può eliminare, quelli dei Gruppi no (non hanno il pulsante); revoca: gli eventi spariscono
db.t.pee_membri = db.t.pee_membri.filter(m => m.id !== 'mB');
await ev(() => { SH._sez = null; shCal(); }); await sleep(2500); R = await rows();
ok(R.length === 3 && !R.some(x => /ZQ-G2/.test(x.t)), 'invito revocato: gli eventi del Gruppo Beta spariscono dal calendario');
// aggiornamento di un Gruppo: nuovo evento di Gina compare alla riapertura
{ const r = db.t.pee_archivi.find(x => x.id === R1.id); const id = 'zz1'; r.data.scheda.uscite[id] = {id, cr:Date.now(), testo:'ZQ-G1-Nuovo evento', modello:'sede', ax:{data:'2027-03-03', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}, dest:'staff'}; r.updated_at = new Date(Date.now() + 9000).toISOString(); }
await ev(() => shCal()); await sleep(2500); R = await rows();
ok(R.some(x => /ZQ-G1-Nuovo evento/.test(x.t)), 'il Gruppo ha aggiunto un evento: compare alla riapertura del calendario');
// un Capo Gruppo non vede eventi di altri nel suo calendario
const pg = await person(br, db, {ctx: dev0}), Gp = pg.page; await loginAs(Gp, base, G2); await sleep(2500);
await Gp.evaluate(id => clOpenProject(id), R2.id); await sleep(3500); await Gp.evaluate(() => shCal()); await sleep(1200);
const tg = await Gp.evaluate(() => document.getElementById('panel-pp').innerText);
ok(/ZQ-G2-Bivacco/.test(tg) && !/ZQ-G1|ZQ-G3|CdG Alfa/.test(tg), 'un Capo Gruppo vede solo i suoi eventi nel suo calendario');
const errs = await ev(() => window.__errs || []); ok(!errs.length, 'nessun errore nella pagina del Commissario ' + JSON.stringify(errs).slice(0, 200));
await br.close(); process.exit(summary() ? 1 : 0);
