// Uscite e campi dell'Unità (prima versione): creare, giornate, attività dalla Sezione 3, momenti, sposta, moduli,
// totali con i materiali delle attività, foglio della giornata, archivio, ricarica, lavoro in due, lettore, versione vecchia
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), D = db.addUser('dario@x.it', 'password123', 'Dario Blu'), B = db.addUser('bea@x.it', 'password123', 'Bea Neri');
const br = await launch(engine);
const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
const pid = await ev(() => CL.ctx.id);
await ev(() => gGo('3')); await sleep(900);
ok(await P.locator('.usc-s3').isVisible(), 'in fondo alla Sezione 3 c’è «Hai un’uscita o un campo?»');
ok(await P.locator('#gt-usc').count() === 0, 'senza uscite la voce «Uscite» in alto non c’è');
await P.locator('.usc-s3 button', {hasText:'Nuova uscita'}).click(); await sleep(500);
await P.fill('#usc-new-t', 'Campo invernale');
await P.locator('.usc-mp', {hasText:'più giornate'}).click();
await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
ok(await P.locator('.usc-title').inputValue() === 'Campo invernale', 'uscita creata e aperta');
ok(/Uscite \(1\)/.test(await P.locator('#gt-usc').textContent()), 'in alto compare «Uscite (1)»');
const j = await ev(() => uscJ(USC_CUR));
const M = k => P.locator(`#ax-900-${j} details[data-k="${k}"]`);
// date e presenti dal modulo «Chi viene e quando»
await M('chi').locator('summary').click(); await sleep(300);
await M('chi').locator('input[type=date]').nth(0).fill('2026-12-27'); await M('chi').locator('input[type=date]').nth(0).dispatchEvent('change'); await sleep(400);
await M('chi').locator('input[type=date]').nth(1).fill('2026-12-30'); await M('chi').locator('input[type=date]').nth(1).dispatchEvent('change'); await sleep(400);
ok(await P.locator('.usc-day:not(.add):not(.warn)').count() === 4, '4 giornate dalle date (27–30 dicembre)');
await M('chi').locator(`select[onchange*="'pres.rag',"]`).selectOption('20'); await sleep(400);
ok(/20 ragazzi/.test(await M('chi').locator('summary').textContent()), 'il modulo mostra in breve i presenti');
// giornata 2: attività dalla programmazione e momenti
await P.locator('#usc-day-2').click(); await sleep(300);
await P.locator('button', {hasText:'+ Attività dalla programmazione'}).click(); await sleep(300);
const pick = await P.locator('.usc-pi').first().textContent();
await P.locator('.usc-pi').first().click(); await sleep(500);
const rows = () => P.evaluate(() => [...document.querySelectorAll('.usc-prog .usc-mo')].map(r => (r.querySelector('.usc-t, .usc-mt') || {}).value || (r.querySelector('.usc-t') || {}).textContent));
let r = await rows(); ok(r.length === 1 && /^Attività \d/.test(r[0]) && pick.includes(r[0].split(' · ')[1] || '§'), 'attività inserita nella giornata 2: ' + r[0]);
const kAtt = await ev(() => document.querySelector('.usc-prog .usc-mo').dataset.k);
await P.locator(`#usc-r-${kAtt} .usc-ora`).selectOption('09:15'); await sleep(300);
await P.locator('button', {hasText:'+ Momento'}).click(); await sleep(300);
await P.locator('.usc-mt').last().fill('Pranzo'); await sleep(200);
await P.locator('.usc-mo').last().locator('.usc-cat').selectOption('pasto');
await P.locator('.usc-mo').last().locator('.usc-ora').selectOption('12:30'); await sleep(300);
await P.locator('button', {hasText:'+ Momento'}).click(); await sleep(300);
await P.locator('.usc-mt').last().fill('Sveglia e ginnastica');
await P.locator('.usc-mo').last().locator('.usc-ora').selectOption('07:30'); await sleep(400);
r = await rows(); ok(r.length === 3 && r[0] === 'Sveglia e ginnastica' && /^Attività/.test(r[1]) && r[2] === 'Pranzo', 'programma in ordine di ora: ' + JSON.stringify(r));
// Sposta a… un'altra giornata
const kPr = await ev(() => [...document.querySelectorAll('.usc-prog .usc-mo')].find(x => (x.querySelector('.usc-mt')||{}).value === 'Pranzo').dataset.k);
await P.locator(`#usc-r-${kPr} .usc-more`).click(); await sleep(300);
await P.locator(`#usc-r-${kPr} .usc-mv2 select`).first().selectOption('3'); await sleep(500);
ok((await rows()).length === 2, '«Sposta a» toglie il pranzo dalla giornata 2');
await P.locator('#usc-day-3').click(); await sleep(300);
ok(JSON.stringify(await rows()) === '["Pranzo"]', '…e lo porta nella giornata 3');
await P.locator('#usc-day-2').click(); await sleep(300);
// una sola attività, due porte: modifica dall'uscita
await P.locator(`#usc-r-${kAtt} button`, {hasText:'Modifica qui'}).click(); await sleep(300);
ok(/cambia anche nella Sezione 3/.test(await P.locator(`#usc-r-${kAtt} .usc-edit-n`).textContent()), 'avviso: stai modificando l’attività del percorso');
await P.locator(`#usc-r-${kAtt} textarea`).first().fill('LANCIO SCRITTO NELL’USCITA'); await sleep(300);
const found = await ev(k => { const f = uscAttFind(uscCur().prog[k]); return f && f.a.lancio; }, kAtt);
ok(found === 'LANCIO SCRITTO NELL’USCITA', 'il Lancio cambia nell’attività della Sezione 3');
// materiali dell'attività e spese dell'uscita nei totali
await ev(k => { const f = uscAttFind(uscCur().prog[k]); f.a.ax = f.a.ax || {}; f.a.ax.mat = [{cosa:'Corde', prov:'comprare', prezzo:'2', q:20, qm:'fissa', carico:'ragazzi'}]; saveData(true); }, kAtt);
await ev(j => { axRowSet(900, j, 'spese', 0, 'voce', 'Casa'); axRowSet(900, j, 'spese', 0, 'importo', '400'); axRowSet(900, j, 'spese', 0, 'modo', 'forfait'); axRowSet(900, j, 'spese', 0, 'carico', 'ragazzi', true); }, j); await sleep(500);
const tot = await P.locator('#usc-tot').textContent();
ok(/440,00/.test(tot) && /22,00/.test(tot), 'testata: spesa 440 € (casa + corde dell’attività), quota 22 € a testa: ' + tot.replace(/\s+/g, ' '));
ok(/Corde/.test(await M('mat').innerHTML()), 'nel modulo Materiali ci sono quelli dell’attività');
const circ = await ev(j => axMsgText(900, j), j);
ok(/Campo invernale/.test(circ) && /22,00 € a testa/.test(circ), 'circolare: titolo dell’uscita e quota giusta');
{ const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
  const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(j => axMsgDocx(900, j), j)]);
  const t = (await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/Campo invernale/.test(t) && /22,00/.test(t), 'circolare in Word dall’uscita: ' + d.suggestedFilename());
  const [d2] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(j => axMsgPdf(900, j), j)]);
  ok(fs.statSync(await d2.path()).size > 2000 && /\.pdf$/.test(d2.suggestedFilename()), 'circolare in PDF dall’uscita: ' + d2.suggestedFilename()); }
// moduli: togliere, rimettere, modulo nostro
await M('pb').locator('summary').click(); await M('pb').locator('button', {hasText:'Togli il modulo'}).click(); await sleep(400);
ok(await M('pb').count() === 0, 'modulo «Piano B» tolto');
await P.locator('.usc-addm').click(); await sleep(200);
await P.locator('.usc-addmod button', {hasText:'Piano B'}).click(); await sleep(300);
ok(await M('pb').count() === 1, '…e rimesso da «+ Aggiungi un modulo»');
await P.locator('.usc-addm').click(); await sleep(200);
await P.fill('#usc-own-t', 'Turni di servizio'); await P.locator('#usc-own-k').selectOption('lista'); await P.locator('.usc-ownf button').click(); await sleep(400);
await P.locator('.usc-ownm button', {hasText:'+ Voce'}).click(); await sleep(300);
await P.locator('.usc-ownm .usc-li input[type=text]').first().fill('Cucina: Aquile'); await sleep(300);
ok(await ev(() => Object.values(uscCur().own).some(o => o.t === 'Turni di servizio' && o.items[0].t === 'Cucina: Aquile')), 'modulo nostro «Turni di servizio» con una voce');
// Sezione 3: «Fa parte di»
await ev(() => gGo('3')); await sleep(800);
ok(/Fa parte di: Campo invernale/.test(await P.locator('.usc-fa').first().textContent()), 'nella Sezione 3 l’attività dice «Fa parte di: Campo invernale»');
await P.locator('.usc-fa a').first().click(); await sleep(700);
ok(await P.locator('.usc-day.on').textContent().then(t => /28/.test(t)), 'il link riapre l’uscita sulla giornata giusta');
// foglio della giornata
await P.locator('.usc-lnk', {hasText:'Foglio della giornata'}).click(); await sleep(500);
const fdg = await P.locator('#g-modal').textContent();
ok(/Programma/.test(fdg) && /Sveglia e ginnastica/.test(fdg) && /LANCIO SCRITTO/.test(fdg), 'foglio della giornata con programma e attività');
await ev(() => modalClose()); await sleep(300);
// ricarica: si torna lì e i dati ci sono
await sleep(2500); await P.reload(); await sleep(3500);
ok(await P.locator('.usc-title').isVisible() && await P.locator('.usc-title').inputValue() === 'Campo invernale', 'dopo il ricaricamento si riapre l’uscita');
ok((await rows()).length === 2, '…con il programma della giornata');
// archivio
await ev(() => clOpen()); await sleep(1500);
ok(/Uscite \(1\)/.test(await P.locator('#cl-arclist .cl-usc summary').first().textContent()), 'in archivio, sotto il progetto: «Uscite (1)»');
await ev(() => gGo('2')); await ev(() => clOpen()); await sleep(800);
await P.locator('#cl-arclist .cl-usc summary').first().click(); await P.locator('#cl-arclist .cl-usc a', {hasText:'Campo invernale'}).click(); await sleep(900);
ok(await P.locator('.usc-title').isVisible(), 'dall’archivio si apre l’uscita');
// lavoro in due: Dario co-titolare aggiunge un momento mentre Anna ne aggiunge un altro
await ev(async () => { await dbInvite(CL.ctx.id, 'dario@x.it', 'cotitolare'); await dbInvite(CL.ctx.id, 'bea@x.it', 'lettore'); await clMemLoad(); }); await sleep(800);
const pd = await person(br, db), PD = pd.page, ed = (f, a) => PD.evaluate(f, a);
await loginAs(PD, base, D); await sleep(1200);
await ed(() => { const x = (CL._inv||[]).find(i => true); clInvOpen(x.id); }); await sleep(3500);
await ed(id => uscOpen(id, 1), await ev(() => USC_CUR)); await sleep(800);
ok(await PD.locator('.usc-title').inputValue() === 'Campo invernale', 'Dario vede l’uscita');
await P.locator('#usc-day-1').click(); await sleep(300);
await P.locator('button', {hasText:'+ Momento'}).click(); await P.locator('.usc-mt').last().fill('Alzabandiera (Anna)');
await PD.locator('button', {hasText:'+ Momento'}).click(); await PD.locator('.usc-mt').last().fill('Cerchio di apertura (Dario)');
await P.locator('body').click({position:{x:5, y:5}}); await PD.locator('body').click({position:{x:5, y:5}});
await sleep(14000);
const g1 = Pg => Pg.evaluate(() => uscRows(uscCur(), 1).map(o => o.m.t).sort());
const a1 = await g1(P), d1 = await g1(PD);
ok(JSON.stringify(a1) === JSON.stringify(d1) && a1.length === 2 && a1.includes('Alzabandiera (Anna)') && a1.includes('Cerchio di apertura (Dario)'), 'i due momenti ci sono tutti e due, per tutti e due: ' + JSON.stringify(a1) + ' / ' + JSON.stringify(d1));
ok((await ed(() => uscRows(uscCur(), 2).length)) === 2, 'il resto del programma resta com’era');
// «Per te»: un momento affidato a Dario
await ev(() => { const o = uscRows(uscCur(), 1).find(o => o.m.t === 'Alzabandiera (Anna)'); uscRowSet(o.k, 'aff', 'Dario Blu', true); }); await P.locator('body').click({position:{x:5, y:5}}); await sleep(10000);
let ptd = []; for(let i = 0; i < 3 && !ptd.length; i++){ ptd = await ed(async () => { await new Promise(r => setTimeout(r, 600)); const it = await clPerTe(); return (it || []).filter(x => x.k === 'usc').map(x => x.t + ' | ' + x.ut); }); }
ok(ptd.some(t => /^Alzabandiera \(Anna\) \| Campo invernale/.test(t)), 'a Dario arriva in «Per te» il momento affidato: ' + JSON.stringify(ptd));
// lettore: vede ma non modifica
const pb = await person(br, db), PB = pb.page, eb = (f, a) => PB.evaluate(f, a);
await loginAs(PB, base, B); await sleep(1200);
await eb(() => { const x = (CL._inv||[])[0]; clInvOpen(x.id); }); await sleep(3500);
await eb(id => uscOpen(id, 2), await ev(() => USC_CUR)); await sleep(800);
ok(await PB.locator('.usc-title').isVisible() && await PB.locator('button', {hasText:'+ Momento'}).count() === 0 && await PB.locator('.usc-ora').count() === 0, 'la lettrice vede il programma senza poterlo cambiare');
ok((await eb(() => uscRows(uscCur(), 2).length)) === 2, '…e vede le righe della giornata');
await PB.close(); await PD.close();
// versione vecchia (il sito principale di oggi) apre e salva: le uscite restano
const OLD = '/home/claude/pee-cngei';
const old = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html'; fs.readFile(path.join(OLD, p), (e, b) => { if(e){ s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'}); s.end(b); }); }).listen(8098);
const po = await person(br, db), PO = po.page, eo = (f, a) => PO.evaluate(f, a);
await loginAs(PO, 'http://127.0.0.1:8098/', A); await sleep(1200);
await eo(id => clOpenProject(id), pid); await sleep(4000);
ok(await eo(() => typeof uscList === 'undefined' && !!(scheda.uscite && Object.keys(scheda.uscite).length)), 'la versione vecchia apre il progetto e tiene le uscite in memoria');
await eo(() => gGo('1a')); await sleep(800); await PO.locator('textarea[oninput*="ctxTerr"]').first().click(); await PO.keyboard.press('End'); await PO.keyboard.type(' MODIFICA-VECCHIA'); await PO.locator('body').click({position:{x:5,y:5}}); await sleep(9000);
const row = db.t.pee_archivi.find(x => x.id === pid); 
ok(row && /MODIFICA-VECCHIA/.test(row.data.scheda.pp.ctxTerr) && Object.values(row.data.scheda.uscite || {}).some(u => u.testo === 'Campo invernale' && Object.keys(u.prog).length >= 5), 'dopo il salvataggio con la versione vecchia le uscite sono ancora nel cloud');
await PO.close(); old.close();
await sleep(1000); await P.reload(); await sleep(3500);
ok(await ev(() => /MODIFICA-VECCHIA/.test(scheda.pp.ctxTerr) && uscList().length === 1 && uscRows(uscList()[0]).length >= 5), 'con la versione nuova: modifica della vecchia e uscita insieme');
// eliminare un'uscita la nasconde, l'attività resta
await ev(() => { uscOpen(uscList()[0].id); }); await sleep(500);
P.__answer = true; await P.locator('.usc-delbtn').click(); await sleep(700);
const delOk = await ev(() => uscList().length === 0 && Object.values(scheda.uscite).every(u => u.del)); await ev(() => gGo('3')); await sleep(600);
ok(delOk && await P.locator('#gt-usc').count() === 0, 'eliminata: sparisce dall’elenco e dalla barra in alto (i dati restano segnati come tolti)');
ok(await ev(() => getAllPercorsi().some(p => (p.attivita||[]).some(a => a.lancio === 'LANCIO SCRITTO NELL’USCITA'))), 'l’attività resta nella Sezione 3');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
