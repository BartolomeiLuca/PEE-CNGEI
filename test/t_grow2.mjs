// Campi che si allungano anche quando la scheda era chiusa e poi si apre (percorsi e attività chiusi di default)
process.env.KEEPCLOSED = '1';
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => gGo('3')); await sleep(900);
const LONG = Array.from({length:8}, (_, i) => 'Riga ' + (i + 1) + ' di nota, abbastanza lunga da occupare più righe nel campo.').join('\n');
// riempio i campi mentre la scheda è chiusa (come quando i dati arrivano al caricamento)
const info = await ev(L => { const c = document.querySelector('.pcx.closed'); if(!c) return {closed:0}; const ts = [...c.querySelectorAll('textarea')]; ts.forEach(t => { t.value = L; t.dispatchEvent(new Event('input', {bubbles:true})); }); return {closed:1, n:ts.length, hidden: ts.filter(t => t.offsetParent === null).length}; }, LONG);
ok(info.closed === 1 && info.n > 0, 'trovata una scheda chiusa con ' + info.n + ' campi (di cui ' + info.hidden + ' nascosti)');
await ev(() => { const c = document.querySelector('.pcx.closed'); pcxToggle(Number(c.id.replace('pc-card-', ''))); }); await sleep(900);
const bad = await ev(() => [...document.querySelector('.pcx:not(.closed)').querySelectorAll('textarea')].filter(t => t.offsetParent !== null && t.value && t.scrollHeight > t.clientHeight + 3).length);
ok(bad === 0, 'aprendo la scheda, tutti i campi mostrano il testo intero (campi tagliati: ' + bad + ')');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors[0] : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
