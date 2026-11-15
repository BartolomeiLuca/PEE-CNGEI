// Revisione a turni: colori degli stati, «Ho fatto» / «Ho un dubbio», sezioni comprimibili, «Ho finito» con domande aperte
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', false)); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0], aid = g0.archivio_id;
let v = db.t.pee_revisioni[0];
ok(db.t.pee_revisioni.length === 1 && v.stato === 'aperta' && v.fase === 'revisore' && v.revisore_email === 'luca.bartolomei@cngei.it', 'il primo invio apre la revisione e fissa il revisore: ' + JSON.stringify(v && [v.stato, v.fase, v.revisore_email]));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);
const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(9000);
const pe = (f, a) => pop.evaluate(f, a);
await pe(() => { const a = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)); rvDocOpen(a.key); });
await pe(() => { const t = document.querySelector('#rv-doc textarea'); t.value = 'Aggiungi il quartiere'; t.dispatchEvent(new Event('change', {bubbles:true})); }); await sleep(900);
ok(db.t.pee_revisioni_punto.length === 1 && db.t.pee_revisioni_punto[0].stato === 'da_fare', 'il commento diventa un punto «da fare»');
await pe(() => rvSync()); await sleep(1200);
let s = await pe(() => document.getElementById('rv-dock').innerText);
ok(/Tocca a te/.test(s) && /Invia le richieste di revisione \(1\)/.test(s) && await pe(() => { const b = Array.from(document.querySelectorAll('#rv-dock .rv-b')).find(x => x.textContent.trim() === 'Approva'); return !!b && b.disabled; }), 'revisore: turno, richieste inviabili e «Approva» spento con punti da fare');
await pe((a) => rvAzione(a, 'rimanda'), aid); await sleep(900);
ok(db.t.pee_revisioni[0].fase === 'compilatore', '«Rimanda» passa il turno al compilatore');
s = await pe(() => document.getElementById('rv-dock').innerText); ok(/Tocca a chi ha scritto/.test(s), 'revisore: ora tocca al compilatore');
// compilatore
await ev(() => rpLoad()); await sleep(1500); await ev(() => rpTog()); await sleep(600);
const keys = await pe(() => _rd.anchors.filter(a => a.sec >= 1).map(a => ({chiave: a.key, kind: a.kind, label: a.label})));
console.log('NKEYS', keys.length);
const sample = keys.filter((k, i) => i % 5 === 0);
await ev((ks) => { _rp.pts = ks.map((k, i) => ({id: 'x' + i, chiave: k.chiave, sec: +k.chiave.split('|')[0].slice(2), txt: k.label, testo: 'Prova ' + i, n: 1, user_id: 'u1', autore_nome: 'Revisore', recepita: false, tipo: 'nota'})); }, sample);
let bad = 0, fl = 0;
for(let i = 0; i < sample.length; i++){
  await ev((i) => rpGo(i), i); await sleep(2600);
  const ys = []; for(let j = 0; j < 4; j++){ ys.push(await ev(() => Math.round(scrollY))); await sleep(350); }
  const st = await ev(() => ({inl: !!document.querySelector('.rp-inl:not(#rp-float .rp-inl)'), fl: !!document.getElementById('rp-float'), n: document.querySelectorAll('.rp-inl').length}));
  const stable = ys.every(y => Math.abs(y - ys[0]) < 3); if(!stable) bad++; if(st.fl) fl++;
  console.log('GO', i, sample[i].chiave.slice(0, 50), st.fl ? 'FLOAT' : 'INLINE', st.n, stable ? 'stabile' : 'SALTA ' + ys.join(','));
}
console.log('RIEPILOGO', sample.length, 'punti; instabili', bad, '; in primo piano', fl);
await br.close(); process.exit(0);
