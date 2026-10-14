import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve();
const db = new FakeDB();
const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(1200);
// landing
const land = await ev(() => ({main: document.querySelector('.cl-land .cl-hdrbtn').textContent.trim(), no: document.getElementById('cl-nolog').textContent}));
ok(/Accedi o crea un account/.test(land.main) && /Continua senza account/.test(land.no), 'landing: «Accedi o crea un account» in evidenza + «Continua senza account» con spiegazione');
const out = await ev(() => { const b = document.querySelector('.hdr .cl-hdrbtn'); return {cls: b.className, txt: b.textContent}; });
ok(/cl-out/.test(out.cls) && /Non hai fatto l’accesso/.test(out.txt), 'intestazione: senza account il pulsante è giallo «Non hai fatto l’accesso · Accedi»');
// lavoro senza account
await ev(() => { selectMode('staff'); saveData(true); });
await ev(() => { document.querySelectorAll('.mov-strip').forEach(e => e.remove()); nacStrip(); });
ok(await ev(() => nacWork() && !!document.querySelector('.nac-strip') && /senza account/.test(document.querySelector('.nac-strip').textContent)), 'striscia gialla: lavori senza account');
await ev(() => nacLater());
ok(await ev(() => !document.querySelector('.nac-strip')), 'striscia: «Più tardi» la toglie per la sessione');
// beforeunload
const bu = await ev(() => { const e = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(e); return e.defaultPrevented; });
ok(bu, 'chiusura: avviso se si lavora senza account');
const bu2 = await ev(() => { window._appReload = true; const e = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(e); window._appReload = false; return e.defaultPrevented; });
ok(!bu2, 'chiusura: nessun avviso sui ricaricamenti voluti dall’app');
// accesso
db.addUser('giulia@x.it', 'password123', 'Giulia Rossi');
await ev(() => clOpen()); await sleep(300);
await P.fill('#cl-email', 'giulia@x.it'); await P.fill('#cl-pw', 'password123'); await P.click('#cl-go'); await sleep(3000);
const inn = await ev(() => { const b = document.querySelector('.hdr .cl-hdrbtn'); return {cls: b.className, txt: b.textContent, w: nacWork()}; });
ok(/cl-in/.test(inn.cls) && /Giulia/.test(inn.txt) && !/Non hai/.test(inn.txt), 'intestazione: dopo l’accesso compare il nome «Giulia»');
const bu3 = await ev(() => { const e = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(e); return e.defaultPrevented; });
ok(!bu3 && !inn.w, 'chiusura: con l’account nessun avviso');
// uscita involontaria
await ev(() => { window._toasts = []; const o = window.clToast; window.clToast = m => { window._toasts.push(m); return o && o(m); }; });
await ev(() => CL.sb.auth.signOut()); await sleep(1200);
const so = await ev(() => ({t: window._toasts.join('|'), out: window._nacOut, hdr: document.querySelector('.hdr .cl-hdrbtn').className}));
ok(/Sei uscit/.test(so.t) && so.out && /cl-out/.test(so.hdr), 'uscita involontaria: avviso + pulsante giallo');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
