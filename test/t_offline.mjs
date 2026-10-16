// Connessione che cade a metà lavoro (con account): niente perso, niente «sei uscita/o», sincronizza al ritorno
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true; const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
const id = await ev(() => CL.ctx.id);
// la rete cade: il finto Supabase non risponde più
db.offline = true; await P.context().setOffline(true);
await ev(() => { window.dispatchEvent(new Event('offline')); scheda.pp.ctxTerr = 'Scritto senza rete'; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(4000);
const st = await ev(() => ({local: (JSON.parse(localStorage.getItem(LSK) || '{}').scheda || {}).pp?.ctxTerr, out: !!window._nacOut, user: !!CL.user, strip: [...document.querySelectorAll('.mov-strip')].map(e => e.textContent.slice(0, 60))}));
ok(st.local === 'Scritto senza rete', 'senza rete il lavoro resta salvato sul dispositivo');
ok(!st.out && st.user, 'senza rete non compare «Sei uscita/o dall’account» ' + JSON.stringify(st.strip));
await ev(() => { scheda.pp.ctxSez = 'Anche questo senza rete'; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2000);
// la rete torna
db.offline = false; await P.context().setOffline(false); await ev(() => window.dispatchEvent(new Event('online'))); 
let synced = false; for (let i = 0; i < 60 && !synced; i++) { await sleep(1000); const r = db.t.pee_archivi.find(x => x.id === id); synced = r && r.data.scheda.pp.ctxTerr === 'Scritto senza rete' && r.data.scheda.pp.ctxSez === 'Anche questo senza rete'; if (synced) console.log('SYNC dopo', i, 's'); }
ok(synced, 'al ritorno della rete tutto arriva nel cloud');
await P.reload(); await sleep(3000);
ok(await ev(() => scheda.pp.ctxTerr === 'Scritto senza rete' && !!CL.user), 'dopo il ricaricamento ritrovo il lavoro e sono ancora dentro l’account');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
