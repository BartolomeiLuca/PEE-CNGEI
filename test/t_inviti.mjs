// Parte 2 — inviti e ruoli: coda «diventa collaboratore?», promozione lettore→collaboratore, cambio email, uscita dal progetto
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), B = db.addUser('bruno@x.it', 'password123', 'Bruno Verdi');
db.addUser('carla@x.it', 'password123', 'Carla Neri'); db.addUser('dario@x.it', 'password123', 'Dario Blu');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db), PA = pa.page;
await loginAs(PA, base, A); await PA.evaluate(() => exStart()); await sleep(2500);
await PA.evaluate(() => { scheda.pp.prog = 'cond'; scheda.pp.staffTab = [
  {ruolo:'CU',nome:'Anna Rossi',mail:'anna@x.it'},{ruolo:'VCU',nome:'Bruno Verdi',mail:'bruno@x.it'},{ruolo:'VCU',nome:'Carla Neri',mail:'carla@x.it'},
  {ruolo:'VCU',nome:'Dario Blu',mail:'dario@x.it'},{ruolo:'VCU',nome:'Elena Senzamail',mail:''}]; if(typeof save==='function') save(); });
await sleep(2500);
const rows = () => PA.evaluate(async () => (await dbMembri(CL.ctx.id)).map(r => ({e:r.email, r:r.ruolo, id:r.id})));
const dlg = () => PA.evaluate(() => { const o = document.getElementById('cl-ov'); return o && o.classList.contains('show') ? (document.getElementById('cl-t')||{}).textContent || (o.querySelector('h3,.cl-h')||{}).textContent || 'aperto' : ''; });

// 1. due persone affidate insieme: una finestra alla volta, nessuna copre l'altra
await PA.evaluate(() => refInviteCheck('Bruno Verdi | Carla Neri', 'Esplorazione')); await sleep(1500);
let q = await PA.evaluate(() => ({open: CL._refOpen, cur: CL._refInv && CL._refInv.mail, wait: (CL._refQ||[]).map(x => x.mail)}));
ok(q.open && q.cur === 'bruno@x.it' && q.wait.join() === 'carla@x.it', 'due persone affidate: si apre la prima, la seconda aspetta in coda');
ok(await PA.locator('#cl-ov.show').count() === 1, 'una sola finestra visibile');
// chiedere di nuovo la stessa persona non la duplica
await PA.evaluate(() => refInviteCheck('Carla Neri', 'Altro')); await sleep(300);
ok(await PA.evaluate(() => (CL._refQ||[]).filter(x => x.mail === 'carla@x.it').length) === 1, 'la stessa persona non entra due volte in coda');
// 2. accetto la prima: invito creato come collaboratore, poi compare la seconda
await PA.evaluate(() => clRefInvDo(false)); await sleep(1800);
let r = await rows();
ok(r.some(x => x.e === 'bruno@x.it' && x.r === 'collaboratore'), 'accettata: Bruno invitato come collaboratore');
q = await PA.evaluate(() => ({open: CL._refOpen, cur: CL._refInv && CL._refInv.mail}));
ok(q.open && q.cur === 'carla@x.it', 'dopo la prima compare la seconda');
// 3. «No, grazie»: nessun invito
await PA.evaluate(() => refInvDone()); await sleep(900);
r = await rows(); ok(!r.some(x => x.e === 'carla@x.it'), '«No, grazie»: nessun invito a Carla');
// 4. già collaboratore → non chiede; senza email → avviso
await PA.evaluate(() => { CL._refQ = []; refInviteCheck('Bruno Verdi', 'x'); }); await sleep(600);
ok(await PA.evaluate(() => !(CL._refQ||[]).length && !CL._refOpen), 'già collaboratore: nessuna domanda');
await PA.evaluate(() => refInviteCheck('Elena Senzamail', 'x')); await sleep(600);
ok(await PA.evaluate(() => !(CL._refQ||[]).length && !CL._refOpen), 'senza email: nessuna finestra (solo avviso)');
ok(!/ola@/.test(JSON.stringify(await rows())), 'senza email: nessun invito inventato');
// 5. lettore → collaboratore (usa la riga esistente, nessun duplicato)
await PA.evaluate(async () => { await dbInvite(CL.ctx.id, 'dario@x.it', 'lettore'); CL._nMem = undefined; }); await sleep(500);
await PA.evaluate(() => refInviteCheck('Dario Blu', 'Cucina')); await sleep(1200);
ok(await PA.evaluate(() => CL._refInv && CL._refInv.mid && CL._refInv.mail === 'dario@x.it'), 'lettore: la domanda riguarda la riga esistente');
await PA.evaluate(() => clRefInvDo(false)); await sleep(1500);
r = await rows(); const dd = r.filter(x => x.e === 'dario@x.it');
ok(dd.length === 1 && dd[0].r === 'collaboratore', 'lettore promosso a collaboratore senza righe doppie');
// 6. Bruno vede il progetto e può lasciarlo
const pb = await person(br, db), PB = pb.page;
await loginAs(PB, base, B); await sleep(1500);
await PB.evaluate(() => { const x = (CL._inv||[])[0]; if(x) clInvOpen(x.id); }); await sleep(3000);
ok(await PB.evaluate(() => !!(CL.ctx && CL.ctx.ruolo === 'collaboratore')), 'Bruno apre il progetto come collaboratore');
const mid = (await rows()).find(x => x.e === 'bruno@x.it').id;
await PB.evaluate(([m, id]) => { window.confirm = () => true; return clLeave(m, id); }, [mid, await PA.evaluate(() => CL.ctx.id)]); await sleep(1500);
r = await rows(); ok(!r.some(x => x.e === 'bruno@x.it'), 'uscita: la riga di Bruno sparisce');
ok(await PB.evaluate(() => !CL.ctx || !CL.ctx.ruolo), 'uscita: Bruno non resta dentro il progetto altrui');
ok(db.t.pee_archivi.length >= 1, 'il progetto di Anna è intatto dopo l’uscita di Bruno');
// 7. cambio email: gli inviti seguono la nuova email
await PA.evaluate(async () => { await dbInvite(CL.ctx.id, 'carla@x.it', 'collaboratore'); }); await sleep(400);
const pc = await person(br, db), PC = pc.page; const C = db.users.find(u => u.email === 'carla@x.it');
await loginAs(PC, base, C); await sleep(1000);
await PC.evaluate(async () => { const r = await CL.sb.rpc('pee_prepara_cambio_email', {nuova:'carla2@x.it'}); if(r.error) throw r.error; });
C.email = 'carla2@x.it';
await PC.evaluate(async () => { window._n = (await CL.sb.rpc('pee_completa_cambio_email')).data; });
ok(await PC.evaluate(() => window._n) === 1, 'cambio email: una condivisione trasferita alla nuova email');
r = await rows(); ok(r.some(x => x.e === 'carla2@x.it' && x.r === 'collaboratore') && !r.some(x => x.e === 'carla@x.it'), 'cambio email: ruolo mantenuto, vecchia email non più presente');
ok(!pa.errors.length && !pb.errors.length && !pc.errors.length, 'nessun errore JS ' + pa.errors.concat(pb.errors, pc.errors).slice(0, 3).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
