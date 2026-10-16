// Staff: nuovo progetto subito in archivio e con i dati dell'Unità a schermo; eliminato e ricreato senza dati vecchi
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('dialog', d => d.accept().catch(() => {}));
const toStaff = async () => { await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); }); };
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
await ev(() => { scheda.pp.staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34'}, {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24'}, {ruolo:'SiS', nome:'Elena Sarti', mail:'elena@x.it', eta:'19'}];
  scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo Pesaro'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2500);
// apro l'archivio una volta (elenco in memoria, come fa una persona)
await ev(() => clOpen()); await sleep(1500); await ev(() => clClose && clClose()).catch(() => {}); await ev(() => document.getElementById('cl-ov').classList.remove('show'));
await toStaff(); await P.waitForFunction(() => MODE === 'staff' && document.getElementById('main-app') && document.getElementById('main-app').style.display === 'block', null, {timeout: 15000}); await sleep(1200);
const scr = await ev(() => { const m = document.getElementById('st-main') || document.body; const ins = [...document.querySelectorAll('input')].filter(i => i.offsetParent).map(i => i.value); return {ins, sel: [...document.querySelectorAll('select option')].map(o => o.textContent).join('|')}; });
ok(scr.ins.includes('Staff Reparto Kontiki') && scr.ins.includes('Pesaro'), 'appena creato: nome dello staff e Sezione già a schermo ' + JSON.stringify(scr.ins.slice(0, 6)));
ok(/Paolo Riva/.test(scr.sel), 'appena creato: la tendina offre le persone della tabella dell’Unità');
await ev(() => clOpen()); await sleep(800);
const arc1 = await ev(() => document.getElementById('cl-body').textContent);
ok(/Staff/.test(arc1) && (arc1.match(/Staff \d{4}|Staff Reparto/g) || []).length >= 1, 'il progetto staff compare subito in archivio, senza ricaricare');
await ev(() => document.getElementById('cl-ov').classList.remove('show'));
// lavoro nello staff
await ev(() => { STAFF_MEMBERS.push('Vecchio Membro'); staffObs['Vecchio Membro'] = {P1:'7'}; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(3000);
const stRow = db.t.pee_archivi.find(r => r.user_id === A.id && (r.meta||{}).mode === 'staff');
ok(stRow && (stRow.data.STAFF_MEMBERS || []).includes('Vecchio Membro'), 'il lavoro dello staff è salvato nel cloud');
// elimino il progetto staff aperto
await ev(id => clDelete(id), stRow.id); await sleep(2500);
ok(!db.t.pee_archivi.some(r => r.id === stRow.id), 'progetto staff eliminato');
// ricomincio uno staff nuovo
await sleep(1000);
await toStaff(); await P.waitForFunction(() => MODE === 'staff' && document.getElementById('main-app') && document.getElementById('main-app').style.display === 'block', null, {timeout: 15000}); await sleep(4500);
const ins2 = await ev(() => [...document.querySelectorAll('input')].filter(i => i.offsetParent).map(i => i.value));
ok(ins2.includes('Staff Reparto Kontiki') && ins2.includes('Pesaro'), 'nuovo staff dopo l’eliminazione: nome e Sezione a schermo senza ricaricare ' + JSON.stringify(ins2.slice(0, 4)));
const now = await ev(() => ({m: STAFF_MEMBERS.join(','), mode: MODE}));
ok(now.mode === 'staff' && !/Vecchio Membro/.test(now.m), 'nuovo progetto staff: niente dati del progetto eliminato (' + now.m + ')');
const rows = db.t.pee_archivi.filter(r => r.user_id === A.id && (r.meta||{}).mode === 'staff');
ok(rows.length === 1 && !JSON.stringify(rows[0].data).includes('Vecchio Membro'), 'nel cloud un solo staff, pulito (' + rows.length + ')');
await ev(() => clOpen()); await sleep(800);
ok((await ev(() => (document.getElementById('cl-body').textContent.match(/Staff/g) || []).length)) >= 1, 'in archivio c’è il nuovo staff');
const unit = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
ok(unit && (unit.data.scheda.pp.staffTab || []).length === 3, 'il progetto dell’Unità non è stato toccato');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
