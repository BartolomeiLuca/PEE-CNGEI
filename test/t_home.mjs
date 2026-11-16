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
console.log('CL-REV:', s.replace(/\s+/g, ' ').slice(0, 400));
ok(/Tocca a te/.test(s) && /Anna Rossi/.test(s) && /Leggi e rivedi/.test(s), 'home del revisore: il progetto è subito nel pannello in alto con «Tocca a te»');
ok(await el(() => { const b = document.getElementById('cl-rev'); const y = b.getBoundingClientRect().top; return y > 0 && y < 700; }), 'è in vista, senza scorrere');
ok(await el(() => !document.querySelector('#cl-rev .rv-hist')), 'senza progetti chiusi non compare lo storico');
ok(await el(() => !(document.getElementById('sh-revrows') || {innerText:''}).innerText.trim()), 'nessun secondo elenco di revisioni in fondo alla home');
console.log('PERTE kinds', JSON.stringify(await el(() => (CL.perte||[]).map(x => x.k))));
ok(await el(() => !/Da rivedere|Progetto Personale di/.test((document.getElementById('sh-perte') || {innerText:''}).innerText)), 'il riquadro «Per te» non ripete le revisioni (stanno solo nel pannello dedicato)');
summary(); await br.close(); process.exit(0);