// «+ Aggiungi persona» e «Rileggi la tabella» nello staff non devono bloccare la pagina (senza e con account)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true; const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
const race = (p, ms) => Promise.race([p, sleep(ms).then(() => 'BLOCCATA')]);
for (const acc of [false, true]) {
  const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a); const lab = acc ? 'con account' : 'senza account';
  if (acc) { await loginAs(P, base, A); } else { await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800); }
  await ev(() => { window._pjPick = true; selectMode('giovani'); selectFascia('E'); startTool(); }); await sleep(2000);
  await ev(() => { UNIT_NAME = 'Reparto Prova'; scheda.pp.staffTab = [{ruolo:'VCU', nome:'Lia Verdi', mail:'lia@x.it'}]; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2000);
  await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = 'CU'; startTool(); });
  await P.waitForFunction(() => MODE === 'staff' && document.getElementById('main-app').style.display === 'block', null, {timeout: 20000}); await sleep(2500);
  await ev(() => { setTimeout(() => stAddToggle(), 10); }); await sleep(1500);
  ok(await race(ev(() => 1), 5000) === 1, lab + ': dopo «+ Aggiungi persona» la pagina risponde');
  await ev(() => { setTimeout(() => stUnitRefresh(), 10); }); await sleep(1500);
  ok(await race(ev(() => 1), 5000) === 1, lab + ': dopo «Rileggi la tabella» la pagina risponde');
  ok(await race(ev(() => (ST_UNIT.rows || []).map(r => r.nome).join(',')), 5000) === 'Lia Verdi', lab + ': la tabella dell’Unità è letta');
  await P.context().close().catch(() => {});
}
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
