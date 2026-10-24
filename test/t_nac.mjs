// Avviso «Non sei collegato/a»: ad ogni rientro senza accesso si sceglie se accedere o restare
process.env.NAC = '1';
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const shown = () => ev(() => document.getElementById('nac-ov').classList.contains('show'));
// 1) visitatore nuovo, nessun lavoro: nessun avviso
await P.goto(base, {waitUntil:'domcontentloaded'}); await sleep(2500);
ok(!(await shown()), 'visitatore nuovo senza lavoro: nessun avviso');
// 2) lavoro senza account
await ev(() => { localStorage.setItem('bussola_tour_v3', '1'); localStorage.setItem(LSK, JSON.stringify({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Prova', obs:{'1.1':'3'}, scheda:{pp:{nome:'Reparto Prova'}}, ts:Date.now()})); });
await P.reload({waitUntil:'domcontentloaded'}); await sleep(2500);
ok(await shown(), 'rientro senza accesso con lavoro sul dispositivo: compare la scelta');
ok(await ev(() => document.activeElement && document.activeElement.id === 'nac-login'), 'il pulsante «Accedi» ha il fuoco');
await P.click('#nac-stay'); await sleep(300);
ok(!(await shown()), '«Continuo senza accesso» chiude l’avviso');
ok(await ev(() => !!document.querySelector('.nac-strip,.mov-strip')), 'resta la striscia gialla ben visibile');
// 3) ogni rientro
await P.reload({waitUntil:'domcontentloaded'}); await sleep(2500);
ok(await shown(), 'ricaricando la pagina l’avviso ricompare (anche se si era scelto di restare)');
await P.click('#nac-stay'); await sleep(300);
await ev(() => window.dispatchEvent(Object.assign(new Event('pageshow'), {persisted:true}))); await sleep(600);
ok(await shown(), 'pagina ripristinata dal browser (pageshow): ricompare');
// 4) «Accedi» apre l'accesso
await P.click('#nac-login'); await sleep(500);
ok(!(await shown()) && await ev(() => document.getElementById('cl-ov').classList.contains('show')), '«Accedi» apre la finestra di accesso');
// 5) con account: nessun avviso
await loginAs(P, base, A); await sleep(3000);
ok(!(await shown()), 'con account: nessun avviso');
await ev(() => clLogout()).catch(() => {}); await sleep(3000);
ok(await shown() || await ev(() => !!localStorage.getItem('bussola_had_account')), 'dopo l’uscita il dispositivo ricorda che c’era un account');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
