// Esempio PE creato con la versione vecchia: i momenti formativi si ricreano da soli alla riapertura
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const errs = []; P.on('pageerror', e => errs.push(String(e.message || e)));
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3500);
const cnt = () => ev(() => { let n = 0; Object.values(scheda.uscite || {}).forEach(u => Object.values(u.prog || {}).forEach(m => { if(m && m.pfId && !m.del) n++; })); return n; });
const n0 = await cnt(); ok(n0 === 4, 'esempio nuovo: 4 momenti formativi: ' + n0);
// simulo l'esempio vecchio: tolgo i momenti dagli eventi e salvo
await ev(() => { Object.values(scheda.uscite).forEach(u => Object.keys(u.prog || {}).forEach(k => { if(u.prog[k] && u.prog[k].pfId) delete u.prog[k]; })); CL.pending = true; return clPush(); }); await sleep(1200);
ok(await cnt() === 0, 'simulato: esempio vecchio senza momenti');
const id = await ev(() => CL.ctx.id);
await ev(() => { try{ clClose(); }catch(e){} }); await sleep(500);
await P.reload(); await sleep(2500); await ev(i => { try{ shOpen(i); }catch(e){} }, id); await sleep(3500);
const n1 = await cnt(); ok(n1 === 4, 'riaperto: i 4 momenti sono tornati: ' + n1);
await ev(() => shCal()); await sleep(800);
ok(/Momento formativo/i.test(await ev(() => document.getElementById('panel-pp').innerText)), 'calendario: i momenti si vedono');
await ev(() => exRepairPF()); await sleep(300); ok(await cnt() === 4, 'riparazione idempotente: ancora 4');
ok(errs.length === 0, 'nessun errore di pagina: ' + errs.slice(0, 2).join(' | '));
summary(); process.exit(0);
