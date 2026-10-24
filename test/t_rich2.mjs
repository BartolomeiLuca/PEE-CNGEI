// Campi veri: in quali pagine i campi lunghi diventano editor «come viene» (desktop e telefono)
process.env.RT = '1';
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('dialog', d => d.accept().catch(() => {}));
for (const vp of [{width:1280,height:1000},{width:390,height:800}]){
  await P.setViewportSize(vp); await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
  const pages = ['1','2','3','4','5','6','7','8'];
  for (const g of pages){ await ev(g => { try{ gGo(g); }catch(e){} }, g); await sleep(500);
    await ev(() => document.querySelectorAll('details').forEach(d => d.open = true)); await sleep(1800);
    const r = await ev(() => { const L=[...document.querySelectorAll('textarea')].filter(t=>!t.closest('[hidden]')); const conv=L.filter(t=>t._rtEd); const un=L.filter(t=>!t._rtEd&&t.getBoundingClientRect().width>=180).map(t=>(t.id||t.className||'?')+':'+t.getBoundingClientRect().width+(t.maxLength>0?' ml'+t.maxLength:'')+(t.hasAttribute('data-conv')?' conv':'')+(t.closest('table')?' tab':'')); return {tot:L.length, conv:conv.length, un:un.slice(0,6)}; });
    console.log(vp.width, 'pagina', g, JSON.stringify(r)); if(g==='3') ok(await ev(() => [...document.querySelectorAll('textarea')].some(t => t._rtEd && t.closest('table'))), vp.width + 'px: anche i campi nelle tabelle delle attività'); if(['2','3','5'].includes(g)) ok(r.conv > 0, vp.width + 'px · pagina ' + g + ': i campi narrativi veri hanno la barra (' + r.conv + ')'); }
}
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
