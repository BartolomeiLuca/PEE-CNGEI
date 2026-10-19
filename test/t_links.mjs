// Correzione 16: «Allegati e link» nelle attività, cliccabili anche nel Word
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
const docx = async (P, fn, arg) => { const [d] = await Promise.all([P.waitForEvent("download", {timeout:30000}), P.evaluate(fn, arg)]); const z = await JSZip.loadAsync(fs.readFileSync(await d.path()));
  return {xml: await z.file('word/document.xml').async('string'), rels: await z.file('word/_rels/document.xml.rels').async('string')}; };
// senza account
const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => gGo('3')); await sleep(900);
const iP = await ev(() => getAllPercorsi().findIndex(p => p.percorsoId === 'P5'));
const box = P.locator(`#att-links-${iP}-0`);
ok(await box.isVisible() && /Allegati e link/.test(await box.textContent()), 'ogni attività ha «Allegati e link»');
await box.locator('button', {hasText:'Aggiungi un link'}).click(); await sleep(200);
await P.locator(`#att-links-${iP}-0 .lk-n`).last().fill('Scheda delle legature');
await P.locator(`#att-links-${iP}-0 .lk-u`).last().fill('drive.google.com/file/d/abc123'); await sleep(200);
ok(await P.locator(`#att-links-${iP}-0 .lk-ic`).last().textContent() === 'Drive', 'icona secondo il tipo (Drive)');
const op = P.locator(`#att-links-${iP}-0 .lk-open`).last();
ok(await op.isVisible() && await op.getAttribute('href') === 'https://drive.google.com/file/d/abc123' && await op.getAttribute('target') === '_blank', 'si apre con un tocco (in una nuova scheda)');
await P.locator(`#att-links-${iP}-0 button`, {hasText:'Aggiungi un link'}).click(); await sleep(200);
await P.locator(`#att-links-${iP}-0 .lk-n`).last().fill('Video del nodo');
await P.locator(`#att-links-${iP}-0 .lk-u`).last().fill('https://youtu.be/xyz'); await sleep(200);
ok(await P.locator(`#att-links-${iP}-0 .lk-ic`).last().textContent() === 'Video', 'icona Video per YouTube');
ok(await P.locator(`#att-links-${iP}-0 .lk-u`).first().evaluate(e => e.spellcheck === false), 'niente controllo ortografico sull’indirizzo');
await P.locator(`#att-links-${iP}-0 button`, {hasText:'Aggiungi un link'}).click(); await sleep(200);
await P.locator(`#att-links-${iP}-0 .lk-x`).last().click(); await sleep(200);
ok(await P.locator(`#att-links-${iP}-0 .lk-row`).count() === 2, 'si toglie un link');
await sleep(1500); await P.reload(); await sleep(2500); await ev(() => gGo('3')); await sleep(900);
const L = await ev(i => getAllPercorsi()[i].attivita[0].links, iP);
ok(JSON.stringify(L) === JSON.stringify([{n:'Scheda delle legature', u:'drive.google.com/file/d/abc123'}, {n:'Video del nodo', u:'https://youtu.be/xyz'}]), 'funziona anche senza account e resta dopo il ricaricamento');
ok(await ev(i => getAllPercorsi()[i].attivita[0].link, iP) === 'drive.google.com/file/d/abc123', 'il primo link resta anche nel campo di prima (per le versioni precedenti)');
{ const w = await docx(P, () => exportSchedaDocx());
  ok(/<w:hyperlink [^>]*r:id="[^"]+"[^>]*>[\s\S]*?Scheda delle legature/.test(w.xml) && /Target="https:\/\/drive\.google\.com\/file\/d\/abc123"/.test(w.rels) && /Target="https:\/\/youtu\.be\/xyz"/.test(w.rels), 'Word della Scheda: elenco con link cliccabili veri'); }
{ const w = await docx(P, ([i]) => axDocx(i, 0), [iP]).catch(e => ({xml:'', rels:''}));
  ok(/Allegati e link/.test(w.xml.replace(/<[^>]+>/g, '')) && /youtu\.be\/xyz/.test(w.rels), 'Word della singola attività: anche lì'); }
// un link vecchio (campo singolo) compare nella sezione nuova
await ev(i => { const a = getAllPercorsi()[i].attivita[1]; delete a.links; a.link = 'www.canva.com/design/vecchio'; saveData(true); renderValuation(); }, iP); await sleep(400);
ok(await P.locator(`#att-links-${iP}-1 .lk-u`).first().inputValue() === 'www.canva.com/design/vecchio' && await P.locator(`#att-links-${iP}-1 .lk-ic`).first().textContent() === 'Canva', 'il link scritto con la versione di prima compare in «Allegati e link»');
// copia .json
const js = await ev(() => JSON.stringify(clSnapshot()));
ok(/Scheda delle legature/.test(js), 'i link sono nella copia .json del progetto');
await pa.ctx.close();
// con account: «Duplica» li porta con sé
const pb = await person(br, db), Q = pb.page, eq = (f, a) => Q.evaluate(f, a);
await loginAs(Q, base, A); await eq(() => exStart()); await sleep(3000);
await eq(() => { const per = getAllPercorsi().find(p => p.percorsoId === 'P5'); per.attivita[0].links = [{n:'Album', u:'https://photos.app.goo.gl/abc'}]; saveData(true); }); await sleep(2500);
const src = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
await eq(id => clDup(id, 2026), src.id); await sleep(2000);
const cp = db.t.pee_archivi.find(r => / \(copia\)$/.test(r.titolo));
ok(cp && /photos\.app\.goo\.gl\/abc/.test(JSON.stringify(cp.data)), '«Duplica» copia anche i link');
ok(!pa.errors.length && !pb.errors.length, 'nessun errore JS' + pa.errors.concat(pb.errors).slice(0, 3).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
