// Salvataggio nel cloud: una modifica fatta MENTRE un salvataggio è in corso non deve perdersi (F2)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart('PP')); await sleep(2500);
const row = () => db.t.pee_archivi.find(r => r.user_id === A.id && (r.meta || {}).tipo === 'PP');
// prima modifica vera → il progetto nasce nel database
await ev(() => { scheda.pp.nome = 'Anna Rossi'; saveData(true); }); await sleep(3500);
ok(row() && row().data.scheda.pp.nome === 'Anna Rossi', 'prima modifica arrivata nel database');
// il database risponde lento: la modifica 1 parte (1,2 s di attesa) e resta in volo
db.delay = 1000;
await ev(() => { scheda.pp.cognomeProva = 'UNO'; saveData(true); });
await sleep(2700);   // 1,2 s di attesa + lettura dell'ora (1 s): lo snapshot è già preso, la scrittura è in volo
await ev(() => { scheda.pp.cognomeProva2 = 'DUE'; saveData(true); });   // modifica fatta durante il volo
await sleep(2500); db.delay = 0; await sleep(6000);
const d = row().data.scheda.pp;
ok(d.cognomeProva === 'UNO', 'modifica avviata prima: arrivata');
ok(d.cognomeProva2 === 'DUE', 'modifica fatta durante il salvataggio: arrivata (' + JSON.stringify({a:d.cognomeProva, b:d.cognomeProva2}) + ')');
const st = await ev(() => ({pending:CL.pending, busy:CL.busy, up:(CL.ctx.upaths||[]).length, extra:!!CL.ctx.upExtra, udirty:!!CL.ctx.udirty}));
ok(!st.pending && !st.busy && !st.extra && !st.udirty, 'nessun salvataggio rimasto in sospeso: ' + JSON.stringify(st));
await br.close(); summary(); process.exit(0);
