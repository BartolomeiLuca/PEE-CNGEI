// Blocco D/E: chi rivede un giro (revisore / in copia) e i riscontri in app lato compilatore
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova'), G = db.addUser('cg@x.it', 'password123', 'Capo Gruppo');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1920, height:700}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it', cgMail:'cg@x.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); ppGiroDest(2, 'app', true); ppGiroDest(0, 'mail', false); ppGiroDest(1, 'mail', false); ppGiroDest(2, 'mail', false); ppGiroDest(3, 'mail', false); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0]; ok(g0 && g0.meta && g0.meta.nome === 'Anna Rossi', 'il giro porta l’intestazione leggera (nome): ' + JSON.stringify(g0 && g0.meta));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1920, height:700}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);
await el(() => shGoHome()); await sleep(2500);
let s = await el(() => { const b = document.getElementById('cl-rev'); return b ? b.innerText : 'nessun contenitore'; });
const rr = await el(() => { const b = document.getElementById('sh-revrows'); return b ? b.innerText : 'nessun contenitore'; });
ok(/Da rivedere/.test(rr) && /Anna Rossi/.test(rr) && /Leggi e rivedi/.test(rr), 'home del revisore: il progetto è subito tra i progetti con «Da rivedere»: ' + rr.replace(/\s+/g, ' ').slice(0, 160));
ok(await el(() => { const b = document.getElementById('sh-revrows'); const y = b.getBoundingClientRect().top; return y > 0 && y < 700; }), 'è in vista, senza scorrere');
summary(); await br.close(); process.exit(0);