// Riproduzione: «Nuova uscita» dall'archivio, uscita, altro account, rientro: il progetto di Giulia deve restare intero
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true; if(process.env.FAST) db.delay = 300;
const G = db.addUser('giulia@x.it', 'password123', 'Giulia Cocon');
const U = db.addUser('altro@x.it', 'password123', 'Altro Utente');
const mk = (titolo, nome, extra) => { const data = Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:nome, ts:Date.now(), scheda:{pp:{nome, sezione:'Pesaro', gruppo:'Pesaro 1'}, uscite:{}}, obs:{}}, extra||{});
  const r = {id:'p-'+titolo.replace(/\W/g,''), user_id:G.id, anno:2026, titolo, meta:{mode:'giovani', nome}, data, created_at:new Date().toISOString(), updated_at:new Date().toISOString()}; db.t.pee_archivi.push(r); return r; };
const P1 = mk('PEE 2026', 'Reparto Giulia', {obs:{'1.1':'3','1.2':'2'}, scheda:{pp:{nome:'Reparto Giulia', ctxTerr:'x'.repeat(6000)}, uscite:{u1:{id:'u1',t:'Campo estivo',prog:{}}}}});
const P2 = mk('Altro progetto', 'Reparto Due');
const before1 = JSON.stringify(P1.data), before2 = JSON.stringify(P2.data);
const br = await launch(engine); const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, G); await sleep(process.env.FAST?900:3000);
console.log('aperto:', await ev(() => CL.ctx && CL.ctx.titolo));
// archivio → Nuova uscita sul progetto P1 (e anche su P2)
for(const pid of [P1.id, P2.id]){
  await ev(() => clOpen()); await sleep(1200);
  await ev(id => uscArcOpen(id, 'new', 'giovani'), pid).catch(() => {}); await sleep(process.env.FAST?900:3500);
  console.log('dopo nuova uscita su', pid, '→ aperto:', await ev(() => CL.ctx && CL.ctx.titolo).catch(()=>'?'), 'USC_NEW=', await ev(() => USC_NEW).catch(()=>'?'));
}
await ev(() => clOpen()); await sleep(1200);
await ev(() => clLogout()).catch(() => {}); await sleep(process.env.FAST?900:3000);
await loginAs(P, base, U); await sleep(process.env.FAST?900:3000);
console.log('altro utente, aperto:', await ev(() => CL.ctx && CL.ctx.titolo).catch(()=>'?'));
await ev(() => clLogout()).catch(() => {}); await sleep(process.env.FAST?900:3000);
await loginAs(P, base, G); await sleep(process.env.FAST?900:3500);
console.log('Giulia di nuovo, aperto:', await ev(() => CL.ctx && CL.ctx.titolo).catch(()=>'?'));
await ev(() => clOpen()); await sleep(1500);
const rows = db.t.pee_archivi.filter(r => r.user_id === G.id);
ok(rows.length === 2, 'Giulia ha ancora 2 progetti nel cloud (ne ha ' + rows.length + ')');
ok(JSON.stringify(P1.data) === before1, 'dati di PEE 2026 identici' + (JSON.stringify(P1.data) === before1 ? '' : ' → ora: ' + JSON.stringify(P1.data).slice(0, 300)));
ok(JSON.stringify(P2.data) === before2, 'dati di Altro progetto identici' + (JSON.stringify(P2.data) === before2 ? '' : ' → ora: ' + JSON.stringify(P2.data).slice(0, 300)));
const lst = await ev(() => document.getElementById('cl-body').innerText.slice(0, 400));
console.log('archivio visibile:', lst.replace(/\n+/g, ' | '));
console.log('log db (aggiornamenti):', db.log.filter(l => /update|delete|insert/.test(l)).join(' ; '));
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
