import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const engine = process.argv[2] || 'chromium';




const base = await serve();
const db = new FakeDB();
const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
let newer = false, hits = 0;
await P.route(/[?&]c=\d+/, async r => { hits++; const t = fs.readFileSync('/tmp/site_upd/index.html', 'utf8'); await r.fulfill({status: 200, contentType: 'text/html', body: newer ? t.replace("APP_BUILD='b1'", "APP_BUILD='b2'") : t}); });
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(1000);
await ev(() => selectMode('staff')); 
// stessa versione: nessun avviso
await ev(() => updCheck()); await sleep(500);
ok(hits >= 1 && await ev(() => !document.querySelector('.upd-strip') && !window._updFound), 'stessa versione: nessuna striscia');
// versione nuova, pagina in uso: striscia
newer = true; await ev(() => updCheck()); await sleep(600);
ok(await ev(() => !!document.querySelector('.upd-strip') && /versione nuova/.test(document.querySelector('.upd-strip').textContent)), 'versione nuova mentre usi l’app: striscia «Aggiorna ora»');
ok(await ev(() => document.querySelectorAll('.upd-strip').length >= 1), 'striscia presente');
// «Più tardi»
await ev(() => document.querySelector('.upd-strip button.gh').click());
ok(await ev(() => !document.querySelector('.upd-strip')), '«Più tardi» toglie la striscia');
// lavoro non perso con aggiornamento: scrivi, poi aggiorna ora
await ev(() => { scheda.pp = scheda.pp || {}; scheda.pp.sezione = 'PROVA-UPD'; saveDataDebounced(); });
let reloaded = false; P.on('framenavigated', f => { if(f === P.mainFrame()) reloaded = true; });
await ev(() => updNow()); await sleep(2500);
ok(reloaded, 'Aggiorna ora ricarica la pagina');
const kept = await ev(() => JSON.stringify(Object.assign({}, localStorage)).includes('PROVA-UPD'));
ok(kept, 'il lavoro scritto subito prima è stato salvato');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
