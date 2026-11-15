// Turno del revisore: il progetto di chi l'ha scritto è in sola lettura; si sblocca quando tocca al compilatore
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart('PP')); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it'}; saveData(true); }); await sleep(500);
const nRO0 = await ev(() => [...document.querySelectorAll('#main-app textarea')].filter(t => !t.closest('#rp-dock,#rv-dock,[data-conv],.rd-rp,.rv-st') && !t.readOnly).length);
console.log('nRO0', nRO0); ok(!(await ev(() => document.body.classList.contains('rev-lock'))), 'prima dell\'invio nessun blocco');
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', false)); });
await ev(() => ppGiroCongela()); await sleep(2500);
ok(db.t.pee_revisioni[0].fase === 'revisore', 'dopo l\'invio tocca al revisore');
await ev(() => rpLoad()); await sleep(1500);
const st = () => ev(() => ({ cls: document.body.classList.contains('rev-lock'), bar: !!document.getElementById('rvl-bar'),
  ro: [...document.querySelectorAll('#main-app textarea')].filter(t => !t.closest('#rp-dock,#rv-dock,[data-conv],.rd-rp,.rv-st') && !t.readOnly).length,
  tot: document.querySelectorAll('#main-app textarea').length, rvl: document.querySelectorAll('[data-rvl]').length }));
let s = await st(); ok(s.cls && s.bar && s.ro === 0 && s.tot > 0, 'tocca al revisore: banner e tutti i campi di testo in sola lettura ' + JSON.stringify(s));
// il pulsante di modifica strutturale è fermato, la navigazione no
await ev(() => { window._added = 0; const b = document.createElement('button'); b.id = 'tst-add'; b.setAttribute('onclick', 'window._added++'); b.textContent = 'x'; document.getElementById('main-app').appendChild(b); });
await ev(() => document.getElementById('tst-add').click()); await sleep(200);
ok((await ev(() => window._added)) === 0, 'un pulsante di aggiunta/eliminazione viene fermato');
await ev(() => { window._nav = 0; const b = document.createElement('button'); b.id = 'tst-nav'; b.setAttribute('onclick', 'window._nav++'); b.textContent = 'y'; document.getElementById('main-app').appendChild(b); });
await ev(() => document.getElementById('tst-nav').click()); await sleep(200);
ok((await ev(() => window._nav)) === 1, 'la navigazione resta libera');
// si sblocca quando tocca al compilatore
db.t.pee_revisioni[0].fase = 'compilatore'; await ev(() => rpLoad()); await sleep(1500);
s = await st(); ok(!s.cls && !s.bar && s.rvl === 0 && s.ro > 500, 'tocca al compilatore: sbloccato ' + JSON.stringify(s));
db.t.pee_revisioni[0].fase = 'revisore'; await ev(() => rpLoad()); await sleep(1500);
s = await st(); ok(s.cls && s.ro === 0, 'di nuovo tocca al revisore: bloccato');
db.t.pee_revisioni[0].stato = 'chiusa'; await ev(() => rpLoad()); await sleep(1500);
s = await st(); ok(!s.cls, 'revisione chiusa: sbloccato');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); process.exit(0);
