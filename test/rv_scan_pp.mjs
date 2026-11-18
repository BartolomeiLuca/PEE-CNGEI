// Quali punti del revisore non trovano un aggancio nella pagina del compilatore? (ogni ancora del documento, una per una)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const LONG = ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'.repeat(5);
const att = (t, aid, d) => ({testo:t, link:'', lancio:'L ' + t + LONG, sviluppo:'S' + LONG, conclusione:'C' + LONG, vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
db.t.pee_archivi.push({id:'c1', user_id:A.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'PP', sez3Pri:1, annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'},
    priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0]}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[Object.assign(att('Gioco A', 'a1', '2026-11-08'),{vBene:'ok bene P',vMigl:'m'}), att('Gioco B', 'a2', '')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Gioco C', 'a3', '')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', 'a4', '')]}],
    uscite:{u1:{id:'u1', cr:1, testo:'Uscita', modello:'giorno', ax:{data:'2026-11-08', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{m1:{k:'att', tipo:'att', pid:'P1', aid:'a1', g:1, f:['lsc','mat']}}, hid:{}, own:{}}}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});

await loginAs(P, base, A); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
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
  let r = await ev(() => ({float: !!document.getElementById('rp-float') || !!document.querySelector('.rp-inl[data-fb]'), inl: !!document.querySelector('.rp-inl')}));
  for(let w = 0; w < 14 && !r.float && !r.inl; w++){ await sleep(1000); r = await ev(() => ({float: !!document.getElementById('rp-float') || !!document.querySelector('.rp-inl[data-fb]'), inl: !!document.querySelector('.rp-inl')})); }
  await sleep(1500); r = await ev(() => ({float: !!document.getElementById('rp-float') || !!document.querySelector('.rp-inl[data-fb]'), inl: !!document.querySelector('.rp-inl')}));
  if(r.float){ bad.push(p.k); console.log('FLOAT', p.k); }
}
fs.writeFileSync('/tmp/rvall3c.json', JSON.stringify({tot:pts.length, bad}));
ok(bad.length === 0, 'punti senza aggancio: ' + bad.length + ' su ' + pts.length + ' → ' + bad.join(' ; '));
await br.close(); summary(); process.exit(0);
