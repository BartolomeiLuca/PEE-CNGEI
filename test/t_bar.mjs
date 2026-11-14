// Blocco D/E: chi rivede un giro (revisore / in copia) e i riscontri in app lato compilatore
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova'), G = db.addUser('cg@x.it', 'password123', 'Capo Gruppo');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1463, height:630}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it', cgMail:'cg@x.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); ppGiroDest(2, 'app', true); ppGiroDest(0, 'mail', false); ppGiroDest(1, 'mail', false); ppGiroDest(2, 'mail', false); ppGiroDest(3, 'mail', false); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0]; ok(g0 && g0.meta && g0.meta.nome === 'Anna Rossi', 'il giro porta l’intestazione leggera (nome): ' + JSON.stringify(g0 && g0.meta));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1463, height:630}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);
await el(() => shGoHome()); await sleep(2500);
let s = await el(() => { const b = document.getElementById('cl-rev'); return b ? b.innerText : 'nessun contenitore'; });
ok(/progetti personali che segui/i.test(s) && /Anna Rossi/.test(s) && /Giro 1/.test(s) && /Leggi e rivedi/.test(s) && /Scarica il Word/.test(s) && /Concludi la revisione/.test(s), 'home del revisore: pannello per compilatore con «Leggi e rivedi», Word e «Concludi»: ' + s.replace(/\n/g,' | ').slice(0,140));
P.evaluate(id => ppGiroApriQui(id), g0.id).catch(() => {}); await sleep(11000);
const geo = () => P.evaluate(() => { const b = document.getElementById('giro-bar').getBoundingClientRect().bottom, d = document.getElementById('rv-doc').getBoundingClientRect().top, n = document.getElementById('rv-nav').getBoundingClientRect().top, h = document.getElementById('hdr').getBoundingClientRect(); return {barBottom:Math.round(b), docTop:Math.round(d), navTop:Math.round(n), hdrTop:Math.round(h.top), hdrBottom:Math.round(h.bottom)}; });
console.log('iniziale', JSON.stringify(await geo()));
await P.evaluate(() => { const b = document.getElementById('giro-bar'); b.style.fontSize = '22px'; window.rvDockPos && rvDockPos(); }); await sleep(400);
const g1 = await geo(); console.log('barra più alta', JSON.stringify(g1)); ok(g1.docTop === g1.barBottom && g1.navTop === g1.barBottom, 'con la barra più alta il pannello scende con lei: ' + JSON.stringify(g1));
await P.evaluate(() => { document.getElementById('giro-bar').style.fontSize = ''; }); await sleep(600);
const g2 = await geo(); console.log('barra di nuovo normale', JSON.stringify(g2));
ok(g2.docTop === g2.barBottom && g2.navTop === g2.barBottom, 'il pannello segue sempre il fondo della barra marrone: ' + JSON.stringify(g2));
await P.screenshot({path:'/tmp/bar.png'}); summary(); process.exit(0);
