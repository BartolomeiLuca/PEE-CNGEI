import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve();
const db = new FakeDB();
const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
let nav = 0; P.on('framenavigated', f => { if(f === P.mainFrame()) nav++; });
await P.click('text=Apri un progetto di esempio'); await sleep(1500);
ok(nav === 0 && await ev(() => UNIT_NAME === 'Reparto Kontiki' && !!document.getElementById('ex-bar')), '4. senza account: esempio aperto senza ricaricare');
await ev(() => gGo('1a')); await sleep(400);
await P.click('#prog-mode >> text=Programmazione condivisa'); await sleep(500);
const r = await ev(() => ({prog: scheda.pp.prog || 'ind', login: document.getElementById('cl-ov').classList.contains('show') && /Accedi/.test(document.getElementById('cl-body').textContent)}));
ok(r.prog === 'ind' && r.login, '9. senza account: «Condivisa» chiede di accedere');
await ev(() => clClose());
// modalità staff
await ev(() => { confirmBackToLanding(); }); await sleep(300);
await ev(() => { exReset(); selectMode('staff'); }); await sleep(300);
await ev(() => { try{ selectRuolo && selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); }); await sleep(600);
for(const n of [1, 2, 3, 4]){ await ev(n => goPhaseInternal(n), n); await sleep(400); }
ok(!pa.errors.length, 'nessun errore JS (esempio senza account e modalità staff)' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
