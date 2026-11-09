import { FakeDB, serve, launch, person, loginAs, sleep } from './harness.mjs';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch('chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1366, height:900}}}); const P = pa.page; const ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(4000);
const S = async (n, sel) => { await sleep(900); if(sel){ const l = P.locator(sel).first(); if(await l.count()) { await l.scrollIntoViewIfNeeded().catch(()=>{}); await l.screenshot({path:'/tmp/shots/'+n+'.png'}).catch(e=>console.log(n, String(e).slice(0,100))); return; } console.log('manca', n, sel); } await P.screenshot({path:'/tmp/shots/'+n+'.png'}); };
// 1 dashboard
await ev(() => { try{ shSec('dash'); }catch(e){} }); await S('01_home');
// 2 percorsi: prima attività con riquadro obiettivi
await ev(() => { gGo('3'); }); await sleep(1500);
await ev(() => { const d = document.querySelector('details[id^="att-"]'); if(d){ d.open = true; let e = d; while(e){ if(e.tagName==='DETAILS') e.open = true; e = e.parentElement; } } const o = document.querySelector('.att-obj'); if(o) o.open = true; });
await S('02_attivita', '.att-objw');
// 3 calendario con pit stop
await ev(() => { try{ shCal(); }catch(e){} }); await sleep(2000); await S('03_cal_pit', '.cal-pit');
await S('03b_cal');
console.log('errori', pa.errors.slice(0,3));
await br.close(); process.exit(0);
