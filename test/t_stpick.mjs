// Staff: i dati arrivano dalla propria Unità, non dal progetto di esempio dello stesso anno
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const toStaff = () => ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); });
const waitMode = m => P.waitForFunction(m => MODE === m && document.getElementById('main-app').style.display === 'block', m, {timeout: 20000});
await loginAs(P, base, A);
// la mia Unità vera
await ev(() => { document.getElementById('cl-ov') || 0; }); await ev(() => clOpen()); await sleep(800);
await ev(() => { document.getElementById('cl-nt').value = 'Reparto Falco 2026'; clNew(); }); await sleep(3000);
await ev(() => { window._pjPick = true; selectMode('giovani'); selectFascia('E'); startTool(); }); await sleep(2000);
await ev(() => { UNIT_NAME = 'Reparto Falco'; scheda.pp.sezione = 'Fano'; scheda.pp.gruppo = 'Gruppo Due'; scheda.pp.staffTab = [{ruolo:'VCU', nome:'Lia Verdi', mail:'lia@x.it'}]; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2500);
// poi apro il progetto di esempio (più recente)
await ev(() => exStart()); await sleep(3000);
await ev(() => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2000);
// dall'esempio passo allo staff: deve prendere la mia Unità, non l'esempio
await toStaff(); await waitMode('staff'); await sleep(2500);
const s1 = await ev(() => ({n: UNIT_NAME, s: scheda.pp.sezione, rows: (ST_UNIT.rows || []).map(r => r.nome).join(',')}));
ok(s1.n === 'Staff Reparto Falco' && s1.s === 'Fano', 'lo staff prende nome e Sezione dalla mia Unità, non dall’esempio ' + JSON.stringify(s1));
ok(s1.rows === 'Lia Verdi', 'la tendina legge la tabella dello staff della mia Unità (' + s1.rows + ')');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
