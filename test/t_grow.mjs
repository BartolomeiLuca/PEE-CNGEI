// Correzione 10: campi di testo che si allungano da soli (anche le note della checklist dei 7 punti)
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => gGo('3')); await sleep(900);
const LONG = Array.from({length:12}, (_, i) => 'Riga numero ' + (i + 1) + ' della descrizione del lancio, abbastanza lunga da andare a capo.').join('\n');
const ta = P.locator('textarea[oninput*="\'lancio\'"]:visible').first();
const h0 = await ta.evaluate(e => e.offsetHeight);
await ta.fill(LONG); await sleep(300);
const m = await ta.evaluate(e => ({h:e.offsetHeight, sh:e.scrollHeight, ch:e.clientHeight}));
ok(m.h > h0 + 100 && m.sh <= m.ch + 2, 'scrivendo, il campo cresce e non ha barra interna (' + h0 + ' → ' + m.h + ', contenuto ' + m.sh + ')');
await ta.fill('Breve.'); await sleep(300);
const m2 = await ta.evaluate(e => e.offsetHeight);
ok(m2 < m.h - 100, 'cancellando torna più basso (' + m.h + ' → ' + m2 + ')');
await ta.fill(LONG); await sleep(1500);
await P.reload(); await sleep(2500); await ev(() => gGo('3')); await sleep(1200);
const m3 = await P.locator('textarea[oninput*="\'lancio\'"]:visible').first().evaluate(e => ({sh:e.scrollHeight, ch:e.clientHeight}));
ok(m3.sh <= m3.ch + 2, 'riaprendo, il testo già scritto si vede tutto (' + JSON.stringify(m3) + ')');
// note della checklist dei 7 punti
const notes = P.locator('textarea.cl3-note:visible');
ok(await notes.count() >= 7, 'note della checklist dei 7 punti: caselle su più righe (' + await notes.count() + ')');
const n0 = notes.first(); await n0.scrollIntoViewIfNeeded();
const y0 = await ev(() => window.scrollY);
await n0.click(); await P.keyboard.type('Nuova perché è la prima volta che costruiscono da soli. '.repeat(4)); await sleep(300);
const nm = await n0.evaluate(e => ({sh:e.scrollHeight, ch:e.clientHeight, h:e.offsetHeight}));
ok(nm.sh <= nm.ch + 2 && nm.h > 40, 'la nota si allunga mentre si scrive (' + JSON.stringify(nm) + ')');
ok(Math.abs(await ev(() => window.scrollY) - y0) < 60, 'la pagina non salta mentre si scrive');
await sleep(1200);
const saved = await ev(() => { const per = getAllPercorsi().find(p => p.checklist && Object.values(p.checklist).some(c => /prima volta/.test(c.note||''))); return per ? Object.values(per.checklist).find(c => /prima volta/.test(c.note||'')).note : ''; });
ok(/prima volta che costruiscono/.test(saved), 'la nota si salva negli stessi dati di prima (checklist.note)');
{ const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
  const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(() => exportSchedaDocx())]);
  const t = (await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/prima volta che costruiscono da soli/.test(t), 'il Word della Scheda riporta ancora la nota della checklist'); }
// campi creati dopo (es. «Aggiungi attività») e in altre parti dell'app
await ev(() => gGo('4')); await sleep(800);
const others = await ev(() => [...document.querySelectorAll('textarea')].filter(e => e.offsetParent && e.value && e.value.length > 40).map(e => e.scrollHeight <= e.clientHeight + 2));
ok(others.length > 0 && others.every(Boolean), 'Sezione 4: anche i campi già compilati si vedono interi (' + others.length + ')');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
