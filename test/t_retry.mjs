// Dopo un errore di salvataggio il progetto riprova da solo (senza altre modifiche né ritorno della rete segnalato dal browser)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart('PP')); await sleep(2500);
const row = () => db.t.pee_archivi.find(r => r.user_id === A.id && (r.meta || {}).tipo === 'PP');
await ev(() => { scheda.pp.nome = 'Anna Rossi'; saveData(true); }); await sleep(3500);
ok(row() && row().data.scheda.pp.nome === 'Anna Rossi', 'prima modifica nel database');
db.offline = true;
await ev(() => { scheda.pp.cognomeProva = 'DOPO ERRORE'; saveData(true); }); await sleep(3000);
ok(row().data.scheda.pp.cognomeProva !== 'DOPO ERRORE', 'con il database irraggiungibile la modifica non arriva');
db.offline = false; await sleep(14000);
ok(row().data.scheda.pp.cognomeProva === 'DOPO ERRORE', 'tornato il database, la modifica parte da sola (nuovo tentativo automatico)');
const st = await ev(() => ({pending: CL.pending, status: CL.status})); ok(!st.pending && st.status === 'ok', 'stato finale: salvato (' + JSON.stringify(st) + ')');
await br.close(); summary(); process.exit(0);
