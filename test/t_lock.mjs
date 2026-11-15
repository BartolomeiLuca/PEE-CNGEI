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
await ev(() => { window._added = 0; const b = document.createElement('button'); b.id = 'tst-add'; window.tstAdd = () => { window._added++; }; b.setAttribute('onclick', 'tstAdd()'); b.textContent = 'x'; document.getElementById('main-app').appendChild(b); });
await ev(() => document.getElementById('tst-add').click()); await sleep(200);
ok((await ev(() => window._added)) === 0, 'un pulsante che modifica viene fermato');
await ev(() => { window._nav = 0; const b = document.createElement('button'); b.id = 'tst-nav'; window.vidOpen = () => { window._nav++; }; b.setAttribute('onclick', 'vidOpen()'); b.textContent = 'y'; document.getElementById('main-app').appendChild(b); });
await ev(() => document.getElementById('tst-nav').click()); await sleep(200);
ok((await ev(() => window._nav)) === 1, 'la navigazione e la lettura restano libere');
// le azioni segnalate (attività osservative col tool, valori ai percorsi, priorità, necessità) sono ferme
const bl = await ev(() => { const out = {}; ['ossWizOpen','occPick','progSet','idrEditStart','setObs','ossModifica','ossNonSvolta','grKosAdd'].forEach(n => { window['_c' + n] = 0; window[n] = () => { window['_c' + n]++; }; const b = document.createElement('button'); b.setAttribute('onclick', n + '()'); document.getElementById('main-app').appendChild(b); b.click(); out[n] = window['_c' + n]; }); return out; });
ok(Object.values(bl).every(v => v === 0), 'le azioni che modificano sono ferme: ' + JSON.stringify(bl));
// rete di sicurezza: una modifica che sfugge ai campi (valore cambiato per codice) non si salva e torna com'era
const nome0 = await ev(() => scheda.pp.nome);
await ev(() => { scheda.pp.nome = 'MODIFICATO'; saveData(true); }); await sleep(800);
ok((await ev(() => scheda.pp.nome)) === nome0 && (await ev(() => JSON.parse(localStorage.getItem(LSK)).scheda.pp.nome)) === nome0, 'una modifica sfuggita al blocco torna com\'era: ' + nome0);
await ev(() => { saveData(true); }); await sleep(300);
ok((await ev(() => !!document.getElementById('rvl-bar'))), 'un salvataggio senza modifiche non rompe nulla');
// si sblocca quando tocca al compilatore
db.t.pee_revisioni[0].fase = 'compilatore'; await ev(() => rpLoad()); await sleep(1500);
s = await st(); ok(!s.cls && !s.bar && s.rvl === 0 && s.ro > 500, 'tocca al compilatore: sbloccato ' + JSON.stringify(s));
db.t.pee_revisioni[0].fase = 'revisore'; await ev(() => rpLoad()); await sleep(1500);
s = await st(); ok(s.cls && s.ro === 0, 'di nuovo tocca al revisore: bloccato');
db.t.pee_revisioni[0].stato = 'chiusa'; await ev(() => rpLoad()); await sleep(1500);
s = await st(); ok(!s.cls, 'revisione chiusa: sbloccato');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); process.exit(0);
