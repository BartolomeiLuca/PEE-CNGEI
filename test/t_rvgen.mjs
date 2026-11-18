// Pareri generali del revisore (chiavi s1…s5): il compilatore li trova agganciati in cima alla pagina del capitolo, non in una scheda fluttuante
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', false)); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0], aid = g0.archivio_id;
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);
const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(9000);
const pe = (f, a) => pop.evaluate(f, a);
// commento generale su 1 · Osservazione del gruppo, dal menu «Sezione per sezione»
for(const s of [1, 2, 3]) await pe(([s, t]) => rvNota(s, t), [s, 'Parere generale sulla sezione ' + s]);
await sleep(900); await pe(() => rvSync()); await sleep(800);
await pe(a => rvAzione(a, 'rimanda'), aid); await sleep(1200);
await ev(() => rpLoad()); await sleep(1500);
const keys = await ev(() => window._rp.pts.map(p => p.chiave).sort());
ok(['s1', 's2', 's3'].every(k => keys.includes(k)), 'il compilatore riceve i tre pareri generali: ' + keys.join(','));
for(const [n, sec] of [[1, 1], [2, 2], [3, 3]]){
  const i = await ev(k => window._rp.pts.findIndex(p => p.chiave === k), 's' + n);
  await ev(() => { const f = document.getElementById('rp-float'); if(f) f.remove(); document.querySelectorAll('.rp-inl').forEach(e => e.remove()); });
  await ev(() => rpTog()).catch(() => {}); await sleep(300);
  await ev(i => rpGo(i), i); await sleep(4500);
  const r = await ev(() => { const b = document.querySelector('.rp-inl'); const f = document.getElementById('rp-float'); return {inl: !!b, float: !!f, inPanel: !!(b && b.closest('#main-app .panel.active')), txt: b ? b.textContent.slice(0, 120) : '', y: b ? Math.round(b.getBoundingClientRect().top) : null, h3: b && b.nextElementSibling ? b.nextElementSibling.tagName : ''}; });
  ok(r.inl && !r.float && r.inPanel && /Parere generale sulla sezione/.test(r.txt), 'sezione ' + sec + ': il parere generale sta nella pagina del capitolo, non in una scheda fluttuante: ' + JSON.stringify(r));
}
await br.close(); summary(); process.exit(0);
