// Più PEE nello stesso anno: nuovo progetto, duplica, messaggio «più scarno» e titolo del progetto sempre in alto
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const dialogs = []; P.on('dialog', d => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
await ev(() => { scheda.pp.numTot = '24'; scheda.pp.sezione = 'Pesaro'; scheda.pp.occasioni = 'x'.repeat(4000); saveData(true); }); await sleep(2500);
const ex = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo)); const yr = ex.anno; const n0 = db.t.pee_archivi.length;
{ const t = await ev(() => (document.getElementById('pj-bar') || {}).textContent || ''); ok(t.includes(ex.titolo) && t.includes(String(yr)), 'titolo del progetto sempre in alto: ' + t); }
// nuovo progetto nello stesso anno
await ev(() => clOpen()); await sleep(1200);
await P.fill('#cl-nt', 'Secondo PEE'); await ev(y => { document.getElementById('cl-ny').value = y; }, String(yr));
await P.locator('button', {hasText:'+ Crea e apri'}).click(); await sleep(4000);
ok(await ev(() => CL.ctx && CL.ctx.titolo) === 'Secondo PEE', 'si apre il progetto nuovo');
ok(((await ev(() => (document.getElementById('pj-bar') || {}).textContent)) || '').includes('Secondo PEE'), 'in alto compare il progetto nuovo');
await ev(() => { scheda.pp.numTot = '10'; saveData(true); }); await sleep(3500);
ok(!dialogs.some(m => /scarno/.test(m)), 'nessun messaggio «più scarno» dopo aver creato un progetto nuovo (' + dialogs.length + ' avvisi: ' + dialogs.join(' | ').slice(0, 80) + ')');
ok(db.t.pee_archivi.length === n0 + 1 && db.t.pee_archivi.filter(r => r.anno === yr).length === n0 + 1, 'un progetto in più nello stesso anno, tutti nel cloud');
// duplica nello stesso anno
await ev(() => clOpen()); await sleep(1200);
const row = P.locator('#cl-arclist .cl-row', {hasText: ex.titolo}).first();
await row.locator('button', {hasText:'Duplica'}).click(); await sleep(300);
await P.locator(`#cl-dup-${ex.id} button`, {hasText:'Crea la copia'}).click(); await sleep(2500);
const titoli = await P.locator('#cl-arclist .cl-row .t').allTextContents();
ok(titoli.length === n0 + 2 && titoli.some(t => t.includes(ex.titolo + ' (copia)')) && titoli.some(t => t.includes('Secondo PEE')) && titoli.some(t => t.trim().endsWith(ex.titolo) || t.includes(ex.titolo + ' ') ), 'in archivio restano tutti: ' + JSON.stringify(titoli));
ok(db.t.pee_archivi.length === n0 + 2 && db.t.pee_archivi.find(r => r.id === ex.id).data.scheda.pp.numTot === '24', 'l’originale non cambia');
// apro l'originale e la copia a turno: nessun messaggio
await ev(id => clOpenProject(id), ex.id); await sleep(3500); await ev(() => { scheda.pp.numTot = '25'; saveData(true); }); await ev(() => clPush(true)); await sleep(1500);
const cp = db.t.pee_archivi.find(r => /\(copia\)/.test(r.titolo));
await ev(id => clOpenProject(id), cp.id); await sleep(3500); await ev(() => { scheda.pp.numTot = '26'; saveData(true); }); await ev(() => clPush(true)); await sleep(1500);
ok(!dialogs.some(m => /scarno/.test(m)), 'passando da un progetto all’altro nessun avviso');
ok(db.t.pee_archivi.find(r => r.id === ex.id).data.scheda.pp.numTot === '25' && db.t.pee_archivi.find(r => r.id === cp.id).data.scheda.pp.numTot === '26', 'ogni progetto ha i suoi dati');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
