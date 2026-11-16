// Uscite e campi (disegno 4): nuova uscita con le date, giornate a blocchi, tavolozza, ordine e orari, ora fissa,
// apri/chiudi tutti, attività della Sezione 3 (stessa attività), campi dei blocchi, materiali e spesa, quota con scenari
// e contributo, scheda Pasti (menù, ingredienti, copia, Excel), stampe, scheda Campo, Sezione 3 (riquadro e avvisi),
// nome dell'Unità nella 1.1, archivio, ricarica, due persone, «Per te», lettrice, dati del 19 ottobre, versione principale.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), D = db.addUser('dario@x.it', 'password123', 'Dario Blu'), B = db.addUser('bea@x.it', 'password123', 'Bea Neri');
const br = await launch(engine);
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
const pid = await ev(() => CL.ctx.id);
await ev(() => { window._uscNoPrint = true; scheda.pp.numTot = '22'; scheda.pp.numF = '10'; scheda.pp.numM = '12'; scheda.pp.sedeVia = 'Via del Bosco 1'; scheda.pp.sedeCitta = 'Pesaro'; scheda.pp.staffTab = [{nome:'Giulia Neri', ruolo:'CR', tel:'320 1'},{nome:'Dario Blu', ruolo:'VCR', mail:'dario@x.it'},{nome:'Elena', ruolo:'AR'}]; saveData(true); });
// 1.1: nome dell'Unità prima dei Numeri dell'Unità, non più nella 1.2
await ev(() => gGo('1a')); await sleep(700);
const un = await ev(() => { const l = document.getElementById('unit-name-11'), n = document.getElementById('num-box'); return !!l && !!n && !!(l.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING); });
ok(un, '1.1: «Nome dell’Unità» subito prima dei Numeri dell’Unità');
await ev(() => gGo('1b')); await sleep(500);
ok(!(await P.locator('#unit-name-in').isVisible()), '1.2: il nome dell’Unità non c’è più');
// Sezione 3: riquadro «Hai un'uscita o un campo?» dentro la parte facoltativa, avvisi
await ev(() => gGo('3')); await sleep(900);
// la prima attività che NON fa già parte di un'uscita (l'esempio ne ha già alcune dentro un evento)
const [iP, jA] = await ev(() => { const e = [...document.querySelectorAll('.usc-ina:not(.in)')].map(x => { let p = x; while(p && !/^ax-\d+-\d+$/.test(p.id || '')) p = p.parentElement; return p ? p.id.split('-').slice(1).map(Number) : null; }).find(Boolean); return e || [-1, -1]; });
console.log('IJ', iP, jA, await ev(() => document.querySelectorAll('.usc-ina').length + '/' + document.querySelectorAll('.usc-ina:not(.in)').length + ' ax:' + document.querySelectorAll('[id^="ax-"]').length + ' panel:' + [...document.querySelectorAll('.panel.active')].map(p=>p.id)));
process.exit(0);
