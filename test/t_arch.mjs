import { FakeDB, serve, launch, person, loginAs, sleep } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const B = db.addUser('bea@x.it', 'password123', 'Bea Verdi');
const h0 = db.handle.bind(db); let log = null;
db.handle = async (req, p) => { if(log) log.push((req.kind==='query'? req.q.op+' '+req.q.table : req.kind+' '+(req.name||''))); await sleep(700); return h0(req, p); };
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(4000);
await ev(() => clClose && clClose()); await sleep(500);
for(let i=0;i<2;i++){
  log = [];
  const t = await ev(async () => {
    const t0 = performance.now(); let tShow = 0;
    clOpen(); tShow = performance.now() - t0;
    const t1 = performance.now(); clPerTeHTML(); const tPT = performance.now() - t1;
    await new Promise(r => { const iv = setInterval(() => { if(/I miei PEE per anno/.test(document.getElementById('cl-body').textContent)){ clearInterval(iv); r(); } }, 10); });
    return {tShow: Math.round(tShow), tPerTe: Math.round(tPT), tReady: Math.round(performance.now() - t0)};
  });
  console.log(JSON.stringify(t)); console.log(log.join(' | ')); log = null;
  await sleep(3000); console.log('dopo 3s altre chiamate:', 0);
  await ev(() => clClose()); await sleep(500);
}
await br.close(); process.exit(0);
