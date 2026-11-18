// Quali punti del revisore non trovano un aggancio nella pagina del compilatore? (ogni ancora del documento, una per una)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
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
const anchors = await pe(() => _rd.anchors.map(a => ({key:a.key, label:a.label, sec:a.sec})));
console.log('ANCORE', anchors.length);
await pe(() => rvNota(1, 'base')); await sleep(800); await pe(() => rvSync()); await sleep(600);
await pe(a => rvAzione(a, 'rimanda'), aid); await sleep(1200);
const p0 = db.t.pee_giri_rev.find(x => x.chiave === 's1'); console.log('P0', JSON.stringify(p0).slice(0,300));
let n = 0; const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
for(const a of anchors){ if(only && !only.test(a.key)) continue; db.t.pee_giri_rev.push(Object.assign({}, p0, {id:'zz' + (++n), chiave:a.key, testo:'Nota su ' + a.label})); }
await ev(() => rpLoad()); await sleep(2000);
const pts = await ev(() => window._rp.pts.map((p, i) => ({i, k:p.chiave, sec:p.sec})));
const bad = [];
for(const p of pts){ if(p.k === 's1') continue;
  await ev(() => { const f = document.getElementById('rp-float'); if(f) f.remove(); document.querySelectorAll('.rp-inl,.rp-inl-tr').forEach(e => e.remove()); });
  await ev(i => { rpGo(i); }, p.i); await sleep(3500);
  let r = await ev(() => ({float: !!document.getElementById('rp-float'), inl: !!document.querySelector('.rp-inl')}));
  for(let w = 0; w < 14 && !r.float && !r.inl; w++){ await sleep(1000); r = await ev(() => ({float: !!document.getElementById('rp-float'), inl: !!document.querySelector('.rp-inl')})); }
  await sleep(1500); r = await ev(() => ({float: !!document.getElementById('rp-float'), inl: !!document.querySelector('.rp-inl')}));
  if(r.float){ bad.push(p.k); console.log('FLOAT', p.k); }
}
fs.writeFileSync('/tmp/rvall.json', JSON.stringify({tot:pts.length, bad}));
ok(bad.length === 0, 'punti senza aggancio: ' + bad.length + ' su ' + pts.length + ' → ' + bad.join(' ; '));
await br.close(); summary(); process.exit(0);
