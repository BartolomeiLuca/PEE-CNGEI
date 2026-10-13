// «Scegli la nuova password» dal link della mail, link scaduto, «cambia password» dall'archivio
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
// Anna ha già un progetto nel cloud (creato da un altro dispositivo)
const p0 = await person(br, db); await loginAs(p0.page, base, A); await p0.page.evaluate(() => exStart()); await sleep(3000); await p0.ctx.close();
// nuovo browser: arriva dal link della mail
const pa = await person(br, db), P = pa.page; let nav = 0;
await P.goto(base); await P.evaluate(() => localStorage.setItem('bussola_tour_v3', '1'));
P.on('framenavigated', f => { if(f === P.mainFrame()) nav++; });
await P.goto(base + '?r=1#access_token=' + A.id + '&type=recovery'); await P.evaluate(() => { window.__mark = 1; }); await sleep(4000);
nav = (await P.evaluate(() => window.__mark)) === 1 ? 0 : 1;
const r = await P.evaluate(() => ({show: document.getElementById('cl-ov').classList.contains('show'), t: document.getElementById('cl-title').textContent, pw: !!document.getElementById('cl-pw2')}));
ok(r.show && r.t === 'Scegli la nuova password' && r.pw, 'dal link: resta il riquadro «Scegli la nuova password» (' + r.t + ')');
ok(nav === 0, 'nessun ricaricamento mentre si sceglie (' + nav + ')');
await P.fill('#cl-pw', 'nuovapass1'); await P.fill('#cl-pw2', 'nuovapass1'); await P.click('#cl-go'); await sleep(800);
ok(/Password aggiornata/.test(await P.textContent('#cl-msg')), 'salvata: «Password aggiornata»');
ok(A.password === 'nuovapass1', 'nel database c’è la nuova password');
await sleep(4000);
ok(await P.evaluate(() => /Esempio/.test((CL.ctx||{}).titolo || '')), 'dopo: si apre il suo progetto');
// link scaduto
const pb = await person(br, db), Q = pb.page;
await Q.goto(base); await Q.evaluate(() => localStorage.setItem('bussola_tour_v3', '1'));
await Q.goto(base + '?r=2#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); await sleep(2500);
const e = await Q.evaluate(() => ({show: document.getElementById('cl-ov').classList.contains('show'), msg: (document.getElementById('cl-msg')||{}).textContent || '', mail: !!document.getElementById('cl-email'), hash: location.hash}));
ok(e.show && /non è più valido/.test(e.msg) && e.mail && !e.hash, 'link scaduto: spiega e propone di chiederne uno nuovo');
// cambia password dall'archivio
await P.evaluate(() => clOpen()); await sleep(1200);
await P.click('#cl-ov >> text=cambia password'); await sleep(300);
ok((await P.textContent('#cl-title')) === 'Cambia password', '«cambia password» nell’archivio');
await P.fill('#cl-pw', 'nuovapass1'); await P.fill('#cl-pw2', 'nuovapass2'); await P.click('#cl-go'); await sleep(400);
ok(/non coincidono/.test(await P.textContent('#cl-msg')), 'password diverse: avviso');
await P.fill('#cl-pw2', 'nuovapass1'); await P.fill('#cl-pw', 'altrapass9'); await P.fill('#cl-pw2', 'altrapass9'); await P.click('#cl-go'); await sleep(800);
ok(A.password === 'altrapass9', 'cambio password dall’archivio salvato');
ok(!pa.errors.length && !pb.errors.length, 'nessun errore JS ' + pa.errors.concat(pb.errors).slice(0, 2).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
