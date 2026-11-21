// Genera i due file JSON di prova (Capo Gruppo e Commissario) dall'app vera, poi li ricarica in due account nuovi
// e controlla che il giro (importa → invita → il Commissario vede il Gruppo) funzioni come lo farà una persona.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const OUT = process.env.OUT || '/home/claude/work/prova_out';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB(); db.sql13 = true;
const br = await launch('chromium');
const mkU = (mail, nome, ruolo, gr) => { const u = db.addUser(mail, 'password123', nome); db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:gr, area_rcdf:'altoadriatico', dashboard:{}}); return u; };
const G = mkU('cg.prova@x.it', 'Capo Gruppo Prova', 'cg', '1'), C = mkU('cds.prova@x.it', 'Commissario Prova', 'cds', null);
const dl = async (P, fn) => { const [d] = await Promise.all([P.waitForEvent('download'), P.evaluate(fn)]); return fs.readFileSync(await d.path(), 'utf8'); };
const nuovo = async (u) => { const pa = await person(br, db, {}), P = pa.page; await loginAs(P, base, u); await sleep(2500); await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500); return P; };
const creaEv = async (P, m, t, d, d2) => { await P.evaluate(([m, t, d, d2]) => { shCal(); calNew(m); document.getElementById('cal-nt').value = t; document.getElementById('cal-d1').value = d; if(d2 && document.getElementById('cal-d2')) document.getElementById('cal-d2').value = d2; calMake(); }, [m, t, d, d2]); await sleep(500); };

// ── Capo Gruppo ──
const P1 = await nuovo(G);
await P1.evaluate(() => {
  UNIT_NAME = 'CdG Prova'; const pers = [['Anna Prova', ['for_in'], 7, 5, 3], ['Bruno Prova', ['for_m_e', 'for_g'], 8, 6, 4], ['Chiara Prova', ['for_in', 'for_m_l', 'pe_fad'], 5, 7, 6], ['Dario Prova', ['nessuna'], 4, 4, 2]];
  STAFF_MEMBERS = pers.map(p => p[0]);
  pers.forEach(([n, f, p, c, s]) => { staffProfiles[n] = {ruolo:'CU', formc:f, formazione:formLevel(f)}; staffObs[n] = {}; [['P', p], ['C', c], ['S', s]].forEach(([a, v]) => DB[a].forEach((q, i) => { staffObs[n][q.id] = Math.max(1, Math.min(10, v + (i % 3) - 1)); })); });
  Object.assign(autoProfile, {nome:'Capo Gruppo Prova', ruolo:'CG', formc:['for_a', 'for_c'], formazione:formLevel(['for_a', 'for_c'])});
  _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(800);
await creaEv(P1, 'sede', 'Riunione di staff di Gruppo', '2026-12-04');
await creaEv(P1, 'giorno', 'Uscita di staff', '2027-01-23');
await creaEv(P1, 'bivacco', 'Bivacco di Gruppo', '2027-03-13', '2027-03-14');
await creaEv(P1, 'campo', 'Campo estivo di Gruppo', '2027-07-10', '2027-07-17');
await P1.evaluate(() => { const u = Object.values(scheda.uscite).find(x => /Uscita di staff/.test(x.testo)); if(u) u.aperta = true; scheda.pf = [{id:'fx1', nome:'Serata sul clima di staff', cat:'Team Building', sit:'', desc:''}]; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(1500);
const confez = (raw, u, titolo) => { const row = db.t.pee_archivi.filter(r => r.user_id === u.id).slice(-1)[0]; const j = JSON.parse(raw); return JSON.stringify({app:'bussola-pee-cngei', v:1, anno:row.anno, titolo, meta:row.meta || {}, data:j.data}, null, 1); };
const j1 = confez(await dl(P1, () => clBackup()), G, 'PROVA Capo Gruppo');
fs.writeFileSync(OUT + '/PEE_PROVA_Capo_Gruppo.json', j1);

// ── Commissario ──
const P2 = await nuovo(C);
await P2.evaluate(() => {
  STAFF_MEMBERS = ['Capo Gruppo Prova']; staffProfiles['Capo Gruppo Prova'] = {ruolo:'CG', link:{mail:'cg.prova@x.it'}}; staffObs['Capo Gruppo Prova'] = {};
  [['P', 9], ['C', 7], ['S', 5]].forEach(([a, v]) => DB[a].forEach((q, i) => { staffObs['Capo Gruppo Prova'][q.id] = Math.max(1, Math.min(10, v + (i % 3) - 1)); }));
  _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(800);
await creaEv(P2, 'sede', 'Riunione dei Capi Gruppo', '2027-01-16');
await sleep(1000);
const j2 = confez(await dl(P2, () => clBackup()), C, 'PROVA Commissario');
fs.writeFileSync(OUT + '/PEE_PROVA_Commissario.json', j2);
const d1 = JSON.parse(j1).data, d2 = JSON.parse(j2).data;
ok(d1.MODE === 'staff' && d1.STAFF_RUOLO === 'CG' && d1.scheda.veste && d1.scheda.veste.ruolo !== 'cds' && d1.STAFF_MEMBERS.length === 4 && Object.keys(d1.scheda.uscite).length === 4, 'file Capo Gruppo: staff di 4 persone, 4 eventi, veste Capo Gruppo · veste=' + JSON.stringify(d1.scheda.veste));
ok(d2.MODE === 'staff' && d2.STAFF_RUOLO === 'CG' && d2.scheda.veste && d2.scheda.veste.ruolo === 'cds' && d2.STAFF_MEMBERS.length === 1, 'file Commissario: veste Commissario, un Capo Gruppo nella tabella · veste=' + JSON.stringify(d2.scheda.veste));
await P1.context().close(); await P2.context().close();

// ── il giro di una persona: due account NUOVI caricano i file ──
const G2 = mkU('cg.nuovo@x.it', 'Capo Gruppo Nuovo', 'cg', '1'), C2 = mkU('cds.nuovo@x.it', 'Commissario Nuovo', 'cds', null);
const importa = async (u, file) => {
  const pa = await person(br, db, {}), P = pa.page; await loginAs(P, base, u); await sleep(2500);
  await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500);
  await P.evaluate(() => shGoHome()); await sleep(1500);
  await P.locator('input[type=file][onchange*=shImportJson]').first().setInputFiles(file, {timeout: 8000}); await sleep(1200);
  await P.evaluate(() => clRestoreOne(0)); await sleep(3000);
  return P; };
const Q1 = await importa(G2, OUT + '/PEE_PROVA_Capo_Gruppo.json');
const rows1 = db.t.pee_archivi.filter(r => r.user_id === G2.id);
const imp1 = rows1.find(r => /PROVA Capo Gruppo/.test(r.titolo));
ok(!!imp1 && imp1.data.STAFF_MEMBERS.length === 4, 'Capo Gruppo nuovo: il file è stato aggiunto all\'archivio (titolo: ' + (imp1 && imp1.titolo) + ')');
await Q1.evaluate(id => clOpenProject(id), imp1.id); await sleep(3500);
await Q1.evaluate(() => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2000);
const m1 = db.t.pee_archivi.find(r => r.id === imp1.id).meta || {};
ok(m1.mode === 'staff' && m1.sruolo === 'CG' && m1.vruolo !== 'cds', 'Capo Gruppo nuovo: dopo l\'apertura il progetto è riconosciuto come progetto di Capo Gruppo · meta=' + JSON.stringify(m1).slice(0, 200));
// l'invito, come lo farebbe il Capo Gruppo dalla sua Programmazione formativa (qui scritto direttamente nel database di prova)
const Q2 = await importa(C2, OUT + '/PEE_PROVA_Commissario.json');
db.t.pee_membri.push({id:'mP', archivio_id:imp1.id, owner_id:G2.id, owner_email:'Capo Gruppo Nuovo (cg.nuovo@x.it)', email:'cds.nuovo@x.it', ruolo:'commissario', visto_il:null, created_at:'2026-11-21T10:00:00Z'});
const imp2 = db.t.pee_archivi.filter(r => r.user_id === C2.id).find(r => /PROVA Commissario/.test(r.titolo));
await Q2.evaluate(id => clOpenProject(id), imp2.id); await sleep(3500);
const cds = await Q2.evaluate(() => cgCds());
ok(cds, 'Commissario nuovo: il progetto caricato è un progetto da Commissario (veste cds)');
await Q2.evaluate(() => shSez()); await sleep(3500);
const T = await Q2.evaluate(() => document.getElementById('panel-pp').innerText);
ok(/CdG Prova/.test(T) && /Mappa dei Gruppi/.test(T) && /Formazione degli adulti dei Gruppi/.test(T), 'Commissario nuovo: «Gruppi della Sezione» mostra CdG Prova, mappa e formazione');
const adulti = await Q2.evaluate(() => [...document.querySelectorAll('#panel-pp details li')].map(l => l.textContent.replace(/\s+/g, ' ').trim()));
ok(adulti.length === 5, 'Commissario nuovo: 5 adulti (Capo Gruppo + 4) · ' + JSON.stringify(adulti).slice(0, 400));
await Q2.evaluate(() => shCal()); await sleep(2500);
const cal = await Q2.evaluate(() => document.getElementById('panel-pp').innerText);
ok(/Riunione di staff di Gruppo/.test(cal) && /Campo estivo di Gruppo/.test(cal) && /Riunione dei Capi Gruppo/.test(cal) && /CdG Prova/.test(cal), 'Commissario nuovo: nel calendario ci sono i suoi eventi e quelli del Gruppo, con il nome del Gruppo');
console.log(cal.slice(0, 900));
await br.close(); process.exit(summary() ? 1 : 0);
