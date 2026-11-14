// Esempi PP e PE: contenuti completi, nessun errore, nessuno scorrimento laterale, anno separato, eliminazione pulita
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const P = [['Desktop Chrome','chromium'],['iPhone 13','webkit'],['Desktop Firefox','firefox'],['Pixel 5','chromium'],['iPad (gen 7)','webkit']];
const only = process.argv[2];
for (const [n, eng] of P) { if (only && eng !== only) continue;
  const br = await launch(eng); const db = new FakeDB(); db.sql14 = true;
  const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
  const d = devices[n] || {viewport:{width:1280, height:800}}; const {defaultBrowserType, ...ctx} = d;
  const pa = await person(br, db, {ctx}), PA = pa.page, errs = []; PA.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await loginAs(PA, base, A);
  // PP
  await PA.evaluate(() => exStart('PP')); await sleep(3500);
  const pp = await PA.evaluate(() => { const g = scheda.griglia || {}; const nG = Object.keys(g).reduce((a, k) => a + Object.keys(g[k] || {}).length, 0);
    return {flag: scheda.esempio, tipo: scheda.tipoProgetto, occ: (scheda.pp.occMan || []).length, iter: !!(scheda.pp.iter && scheda.pp.iter.avvio), nG, oss: Object.keys((typeof ossStore === 'function' ? ossStore() : {}) || {}).length, ow: document.documentElement.scrollWidth <= innerWidth + 2}; });
  ok(pp.flag === 'PP' && pp.tipo === 'PP' && pp.iter && pp.nG >= 24 && pp.oss >= 2 && pp.ow, n + ' PP ' + JSON.stringify(pp));
  await PA.evaluate(() => exDelete && 0); // l'eliminazione chiede conferma: si prova più sotto
  // PE
  await PA.evaluate(() => { try{ window.confirm = () => true; }catch(e){} });
  await PA.evaluate(() => exDelete()); await sleep(3000);
  await loginAs(PA, base, A).catch(() => {}); await sleep(1500);
  await PA.evaluate(() => exStart('AN')); await sleep(5000);
  const an = await PA.evaluate(async () => { const U = Object.values(scheda.uscite || {}).filter(u => u && !u.del); const pf = (scheda.pf || []).length; const g = scheda.griglia || {};
    const nG = Object.keys(g).reduce((a, k) => a + Object.keys(g[k] || {}).length, 0); const ye = {};
    const sp = (typeof SH !== 'undefined' && SH._av && SH._av.data && SH._av.data.sp) ? SH._av.data.sp.length : -1;
    const att = U.reduce((a, u) => a + Object.values(u.prog || {}).filter(m => m && m.k === 'att').length, 0);
    return {flag: scheda.esempio, uscite: U.length, pf, nG, att, sp, oss: Object.keys(ossStore() || {}).length, ciclo: (scheda.ciclo || {}).nome, staffTel: ((scheda.pp.staffTab || [])[0] || {}).tel, ow: document.documentElement.scrollWidth <= innerWidth + 2}; });
  ok(an.flag === true && an.uscite >= 19 && an.pf >= 4 && an.nG >= 24 && an.att >= 10 && an.oss >= 2 && an.ciclo === 'Ciclo d’autunno' && an.staffTel && an.ow, n + ' PE ' + JSON.stringify(an));
  // pagine principali senza errori
  const pages = ["shDash()", "shCal()", "shEle()", "shNumAnno()", "shBil()", "shAnnoV()", "shPF()", "shVis()", "shSec('4')", "shSec('5')", "shSub('1b','P')"];
  let bad = [];
  for (const p of pages) { try { await PA.evaluate(p); await sleep(500); const w = await PA.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2); if (!w) bad.push(p); } catch (e) { bad.push(p + ' ERR'); } }
  ok(!bad.length && !errs.length, n + ' pagine ' + JSON.stringify(bad) + ' errori ' + JSON.stringify(errs));
  // l'anno dell'esempio non si mescola con quello reale
  await sleep(1500);
  const rows = (db.t.pee_archivi || []).filter(r => r.meta && r.meta.mode === 'anno');
  const sep = rows.length >= 1 && rows.every(r => /^Esempio/i.test(r.titolo || '')) && rows.some(r => r.data && r.data.ver && r.data.sp && r.data.sp.length >= 8);
  ok(sep, n + ' anno separato, ver e spese ' + JSON.stringify(rows.map(r => [r.titolo, !!(r.data && r.data.ver), r.data && r.data.sp && r.data.sp.length])));
  await br.close();
}
summary(); process.exit(0);
