// Cambio email di un collaboratore: chi ha il progetto aggiorna la tabella dello staff
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'); const B = db.addUser('bruno@x.it', 'password123', 'Bruno Verdi');
const br = await launch(engine);
const pa = await person(br, db), PA = pa.page;
await loginAs(PA, base, A); await PA.evaluate(() => exStart()); await sleep(2500);
const pid = await PA.evaluate(() => CL.ctx.id);
await PA.evaluate(f => { scheda.pp.staffTab = [{ruolo:'CU',nome:'Anna Rossi',mail:'anna@x.it'},{ruolo:'VCU',nome:'Bruno Verdi',mail:f ? 'Bruno <Bruno@X.it>' : 'bruno@x.it',tel:'333 1234567'}]; _clTouched = true; _clUserAt = Date.now(); saveData(true); }, process.argv[4] === 'formato');
await sleep(2500);
await PA.evaluate(() => dbInvite(CL.ctx.id, 'bruno@x.it', 'collaboratore')); await PA.evaluate(() => clMemLoad());
// Bruno apre l'invito e cambia email
const pb = await person(br, db), PB = pb.page;
await loginAs(PB, base, B); await sleep(1200);
await PB.evaluate(() => { const x = (CL._inv||[])[0]; clInvOpen(x.id); }); await sleep(3000);
await PB.evaluate(() => clOpen()); await sleep(1000);
await PB.click('#cl-ov >> text=cambia email'); await PB.fill('#cl-newmail', 'bruno.nuovo@x.it'); await PB.click('#cl-ov >> text=Invia il link di conferma'); await sleep(800);
db.confirmEmail('bruno@x.it');
await PB.evaluate(() => sessionStorage.removeItem('bussola_mail_ok')); await PB.reload(); await sleep(3500);
ok(db.t.pee_membri.some(m => m.email === 'bruno.nuovo@x.it' && m.email_prima === 'bruno@x.it'), 'invito passato alla nuova email');
const bctx = await PB.evaluate(() => CL.ctx && {id: CL.ctx.id, ruolo: CL.ctx.ruolo});
ok(bctx && bctx.id === pid && bctx.ruolo === 'collaboratore', 'Bruno, dopo il cambio, lavora ancora sul progetto: ' + JSON.stringify(bctx));
// Anna: «Per te» → aggiorna
if(process.argv[3] === 'altro'){ await PA.evaluate(() => exStart()); await sleep(3000); console.log('Anna ha aperto un altro progetto: ' + await PA.evaluate(() => CL.ctx.titolo)); }
await PA.evaluate(() => { gGo('1a'); }); await sleep(500);
await PA.evaluate(() => clPerTe()); await sleep(1500);
await PA.evaluate(() => clOpen()); await sleep(1500);
const pt = await PA.evaluate(() => (document.getElementById('cl-perte')||{}).textContent || '');
ok(/Bruno Verdi ha cambiato email/.test(pt), '«Per te» di Anna: ' + pt.slice(0, 120));
await PA.click('#cl-perte >> text=Aggiorna nella tabella dello staff'); await sleep(1500);
ok(/Tabella dello staff aggiornata/.test(await PA.textContent('#g-modal')), 'finestra di conferma: «Tabella dello staff aggiornata»');
await PA.evaluate(() => { modalClose(); clClose(); }); await sleep(500);
if(process.argv[3] === 'altro'){ await PA.evaluate(id => clOpenProject(id), pid); await sleep(3000); await PA.evaluate(() => { gGo('1a'); }); await sleep(800); }
const st = await PA.evaluate(() => ({mem: scheda.pp.staffTab[1].mail, ui: [...document.querySelectorAll('#staff-tab textarea')].map(t => t.value).filter(v => /bruno/.test(v)), shl: [...document.querySelectorAll('#staff-tab .st-shl')].map(e => e.textContent)}));
console.log(JSON.stringify(st));
ok(/bruno\.nuovo@x\.it/.test(st.mem) && !/bruno@x\.it/i.test(st.mem), 'dati: tabella aggiornata (' + st.mem + ')');
ok(st.ui.some(v => /bruno\.nuovo@x\.it/.test(v)) && !st.ui.some(v => /bruno@x\.it/i.test(v)), 'a schermo: la tabella mostra la nuova email');
await sleep(3500);
ok(/bruno\.nuovo@x\.it/.test(db.t.pee_archivi.find(r => r.id === pid).data.scheda.pp.staffTab[1].mail), 'cloud: tabella aggiornata');
const pt2 = await PA.evaluate(() => (CL.perte||[]).filter(x => x.k === 'email').length);
ok(pt2 === 0, 'l’avviso sparisce');
// Bruno è ancora riconosciuto come referente (affidamenti per email)?
const bme = await PB.evaluate(() => { try{ return affIsMe('bruno.nuovo@x.it'); }catch(e){ return 'err'; } });
ok(bme === true, 'Bruno resta «me» con la nuova email');
ok(!pa.errors.length && !pb.errors.length, 'nessun errore JS ' + pa.errors.concat(pb.errors).slice(0, 2).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
