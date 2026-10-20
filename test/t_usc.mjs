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
await ev(() => { window._uscNoPrint = true; scheda.pp.numTot = '22'; scheda.pp.staffTab = [{nome:'Giulia Neri', ruolo:'CR', tel:'320 1'},{nome:'Dario Blu', ruolo:'VCR', mail:'dario@x.it'},{nome:'Elena', ruolo:'AR'}]; saveData(true); });
// 1.1: nome dell'Unità prima dei Numeri dell'Unità, non più nella 1.2
await ev(() => gGo('1a')); await sleep(700);
const un = await ev(() => { const l = document.getElementById('unit-name-11'), n = document.getElementById('num-box'); return !!l && !!n && !!(l.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING); });
ok(un, '1.1: «Nome dell’Unità» subito prima dei Numeri dell’Unità');
await ev(() => gGo('1b')); await sleep(500);
ok(!(await P.locator('#unit-name-in').isVisible()), '1.2: il nome dell’Unità non c’è più');
// Sezione 3: riquadro «Hai un'uscita o un campo?» dentro la parte facoltativa, avvisi
await ev(() => gGo('3')); await sleep(900);
const iP = await ev(() => getAllPercorsi().findIndex(p => (p.attivita||[]).some(a => (a.testo||'').trim())));
const jA = await ev(i => getAllPercorsi()[i].attivita.findIndex(a => (a.testo||'').trim()), iP);
const box = P.locator(`#ax-${iP}-${jA} .usc-ina`);
ok(await box.count() === 1 && /Hai un’uscita o un campo\?/.test(await box.textContent()), 'Sezione 3: «Hai un’uscita o un campo?» nella parte organizzativa dell’attività');
ok(await P.locator('.usc-s3').count() === 0, '…e non più in fondo alla Sezione 3');
ok(await ev(([i,j]) => { const h = document.getElementById('ax-'+i+'-'+j).innerHTML; return h.indexOf('usc-ina') < h.indexOf('data-k="chi"'); }, [iP, jA]), '…prima di «Chi e quando»');
await ev(([i,j]) => { axSet(i,j,'durata','piu',true); }, [iP, jA]); await sleep(300);
ok(/Con il pernotto è un bivacco o un campo/.test(await P.locator(`#ax-${iP}-${jA}`).textContent()), '«Più giorni (con pernotto)» fa comparire l’invito a farne un’uscita');
await ev(([i,j]) => { axSet(i,j,'durata','giorno'); axSet(i,j,'luogo.tipo','uscita',true); }, [iP, jA]); await sleep(300);
ok(/Fuori sede è un’uscita/.test(await P.locator(`#ax-${iP}-${jA}`).textContent()), '«Uscita» come luogo fa comparire l’invito');
await ev(([i,j]) => { axSet(i,j,'luogo.tipo','sede',true); }, [iP, jA]); await sleep(200);
ok(await P.locator('#gt-usc').count() === 0, 'senza uscite la voce «Uscite» in alto non c’è');
// nuova uscita: nome e date, tipo proposto dalle date
await ev(() => uscNewStart()); await sleep(400);
await P.fill('#usc-new-t', 'Campo invernale');
await P.fill('#usc-new-d1', '2026-12-27'); await P.locator('#usc-new-d1').dispatchEvent('change');
await P.fill('#usc-new-d2', '2026-12-28'); await P.locator('#usc-new-d2').dispatchEvent('change'); await sleep(100);
ok(/Bivacco/.test(await P.locator('.usc-md.on').textContent()), 'due giornate → propone «Bivacco»');
await P.fill('#usc-new-d2', '2026-12-30'); await P.locator('#usc-new-d2').dispatchEvent('change'); await sleep(100);
ok(/Campo/.test(await P.locator('.usc-md.on').textContent()), 'quattro giornate → propone «Campo»');
await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
ok(await P.locator('.usc-title').inputValue() === 'Campo invernale' && /Uscite \(1\)/.test(await P.locator('#gt-usc').textContent()), 'uscita creata e aperta, in alto «Uscite (1)»');
ok(await P.locator('.usc-tab[id^="usc-tab-"]').count() === 6, 'schede: Campo, Pasti e 4 giornate');
ok(await ev(() => { const x = uscCur().ax; return x.pres.rag === '22' && x.pres.ad.length === 3; }), 'ragazzi e capi dai Numeri dell’Unità e dalla tabella dello staff');
// giornata 2: schema e tavolozza
await P.locator('#usc-tab-2').click(); await sleep(300);
await P.locator('.usc-empty2 button', {hasText:'Giornata tipo'}).click(); await sleep(500);
const blocks = () => ev(() => uscBlocks(uscCur(), 2).map(o => uscBlkTitle(o.m)));
const times = () => ev(() => { const T = uscTimes(uscCur(), 2); return uscBlocks(uscCur(), 2).map(o => axHM(T[o.k].s)); });
let b0 = await blocks(), t0 = await times();
ok(b0.length === 12 && b0[0] === 'Sveglia e ginnastica' && t0[0] === '07:30' && t0[1] === '08:00', 'schema «Giornata tipo»: 12 blocchi, orari in fila dalle 07:30');
ok(await P.locator('.usc-tseg').count() === 12, 'time table della giornata con una voce per blocco');
ok(/Sveglia e ginnastica/.test(await P.locator('.usc-tseg').first().textContent()), '…e nel time table si legge cosa c’è scritto');
await P.locator('.usc-pi', {hasText:'Hike'}).click(); await sleep(400);
b0 = await blocks(); ok(b0.length === 13 && b0[12] === 'Hike', 'dalla tavolozza: «Hike» in fondo alla giornata');
const kH = await ev(() => uscBlocks(uscCur(), 2)[12].k);
ok(await P.locator(`#usc-b-${kH} .usc-bb`).isVisible(), 'il blocco nuovo si apre');
// sposta su
const before = await times();
await P.locator(`#usc-b-${kH} [data-mv="-1"]`).click(); await sleep(300);
b0 = await blocks(); ok(b0[11] === 'Hike' && b0[12] === 'Silenzio', '«Sposta su»: l’hike passa prima del silenzio');
ok((await times())[12] !== before[12], '…e gli orari si riallineano');
// trascinamento: l'hike prima della colazione (computer)
if(engine === 'chromium'){ await P.setViewportSize({width:1280, height:2600}); await ev(k => { USC_OPEN[k] = false; uscRe(); }, kH); await sleep(200); await P.locator(`#usc-b-${kH} .usc-bh .usc-bt`).dragTo(P.locator('.usc-blk').nth(1).locator('.usc-bt')); await sleep(500);
  b0 = await blocks(); ok(b0[1] === 'Hike', 'trascinamento: l’hike va prima della colazione ' + JSON.stringify(b0.slice(0,3))); await ev(k => uscBlkDrop(k, null), kH); await sleep(300); await P.setViewportSize({width:1280, height:900}); }
// ora fissa
const kP = await ev(() => uscBlocks(uscCur(), 2).find(o => o.m.t === 'Pranzo').k);
await ev(k => USC_OPEN[k] = true, kP); await ev(() => uscRe()); await sleep(200);
await P.locator(`#usc-b-${kP} input[type=checkbox]`).first().check(); await sleep(300);
await P.locator(`#usc-b-${kP} .usc-brow select`).first().selectOption('12:30'); await sleep(300);
const tp = await ev(k => axHM(uscTimes(uscCur(), 2)[k].s), kP);
ok(tp === '12:30' && /📌/.test(await P.locator(`#usc-b-${kP} .usc-bt`).textContent()), 'ora fissa: il pranzo alle 12:30 con lo spillo');
// apri / chiudi tutti
await P.locator('.usc-dcol button', {hasText:'Apri tutti'}).click(); await sleep(300);
ok(await P.locator('.usc-blk .usc-bb').count() === 13, '«Apri tutti» apre tutti i blocchi');
await P.locator('.usc-dcol button', {hasText:'Chiudi tutti'}).click(); await sleep(300);
ok(await P.locator('.usc-blk .usc-bb').count() === 0, '«Chiudi tutti» li chiude');
// time table: tocco → blocco aperto
await P.locator('.usc-tseg', {hasText:'Serata'}).click(); await sleep(400);
const kS = await ev(() => uscBlocks(uscCur(), 2).find(o => o.m.t === 'Serata').k);
ok(await P.locator(`#usc-b-${kS} .usc-bb`).isVisible(), 'toccando una voce del time table si apre il suo blocco');
// attività della Sezione 3 nella giornata: scegli, modifica qui
await P.locator('.usc-pi', {hasText:'Attività'}).first().click(); await sleep(400);
const kA = await ev(() => { const R = uscBlocks(uscCur(), 2); return R[R.length-1].k; });
await P.locator(`#usc-b-${kA} .usc-pa`).first().click(); await sleep(400);
ok(await ev(k => !!uscAttFind(uscCur().prog[k]), kA), 'blocco «Attività»: scelta un’attività della Sezione 3');
await P.locator(`#usc-b-${kA} button`, {hasText:'Modifica qui'}).click(); await sleep(300);
await P.locator(`#usc-b-${kA} textarea`).first().fill('LANCIO DALL’USCITA'); await sleep(300);
ok(await ev(k => uscAttFind(uscCur().prog[k]).a.lancio === 'LANCIO DALL’USCITA', kA), 'modificata nell’uscita, cambia nella Sezione 3 (stessa attività)');
// campi del blocco: togli e rimetti, materiali da comprare nella spesa
await ev(k => { USC_OPEN[k] = true; uscRe(); }, kH); await sleep(200);
await P.locator(`#usc-b-${kH} .usc-fx`).first().click(); await sleep(200); // toglie «Cosa si fa»
ok(!(await ev(k => uscCur().prog[k].f.includes('desc'), kH)), 'si toglie un campo del blocco');
await P.locator(`#usc-b-${kH} .usc-addf button`, {hasText:'Cosa si fa'}).click(); await sleep(200);
ok(await ev(k => uscCur().prog[k].f.includes('desc'), kH), '…e si rimette');
await ev(k => { USC_OPEN[k] = true; uscRe(); }, kH); await sleep(100);
await P.locator(`#usc-b-${kH} button`, {hasText:'+ Materiale'}).click(); await sleep(200);
await P.locator(`#usc-b-${kH} .usc-mat-r input`).first().fill('Cartine');
await P.locator(`#usc-b-${kH} .usc-mat-r input[type=number]`).first().fill('6');
await P.locator(`#usc-b-${kH} .usc-mat-r select`).first().selectOption('comprare'); await sleep(300);
await P.locator(`#usc-b-${kH} .usc-mat-r input[placeholder="€ cad."]`).fill('5'); await sleep(300);
await P.locator(`#usc-b-${kH} button`, {hasText:'+ Link'}).click(); await sleep(200);
await P.locator(`#usc-b-${kH} .usc-links-r input`).nth(1).fill('https://www.gaiagps.com/map/?loc=1'); await sleep(200);
ok(await ev(() => uscSpesa(uscCur())) === 30 && /Materiali/.test(await P.locator('#usc-tiles').textContent()) && /1 voce|2 voci/.test(await P.locator('#usc-tiles').textContent()), 'materiale da comprare nel blocco: entra nella spesa (30 €)');
// spese generali e quota con scenari
await ev(() => { const u = uscCur(); u.ax.spese = [{voce:'Casa', importo:'8', modo:'notte', notti:3, carico:'ragazzi'}, {voce:'Pullman', importo:'660', modo:'forfait', carico:'ragazzi'}]; saveData(true); uscRe(); });
await P.locator('.usc-tile', {hasText:'Quota'}).click(); await sleep(300);
const det = await P.locator('#usc-detail').textContent();
ok(/Come nasce la quota/.test(det) && /La parte dei capi vale/.test(det), 'riquadro «Quota»: come nasce e quanto vale la parte dei capi');
ok(/tutto sui ragazzi/.test(det) && /metà della loro parte/.test(det) && !/oggi capita|campi nazionali/.test(det), 'scenari con le descrizioni brevi');
await P.locator('.usc-sc', {hasText:'Capi non pagano'}).click(); await sleep(300);
const q1 = await ev(() => axQuota(uscCur().ax));
await P.locator('.usc-sc', {hasText:'Quota ridotta capi'}).click(); await sleep(300);
const q2 = await ev(() => axQuota(uscCur().ax));
await P.locator('.usc-sc', {hasText:'Capi pagano la loro parte'}).click(); await sleep(300);
const q3 = await ev(() => axQuota(uscCur().ax));
ok(q1 > q2 && q2 > q3 && Math.abs((q1 - q3) - 2*(q1 - q2)) < 0.01, `scenari: ${q1.toFixed(2)} > ${q2.toFixed(2)} (metà) > ${q3.toFixed(2)}`);
await P.locator('.usc-contrib input').first().fill('110'); await sleep(300);
const q4 = await ev(() => axQuota(uscCur().ax));
ok(Math.abs(q3 - q4 - 5) < 0.01 && /Contributo/.test(await ev(() => axQuotaConto(uscCur().ax))), 'contributo di 110 €: quota di 5 € più bassa, scritto nel conto');
// circolare dell'uscita (carta intestata nazionale)
{ const j = await ev(() => uscJ(USC_CUR)); const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(j => axMsgDocx(900, j), j)]);
  const t = (await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/Campo invernale/.test(t) && t.includes(q4.toFixed(2).replace('.', ',')), 'circolare in Word dall’uscita con la quota giusta'); }
// scheda Pasti: menù cliccabile, ingredienti, copia, Excel
await P.locator('#usc-tab-pasti').click(); await sleep(300);
await P.locator('.usc-menu tr').nth(2).locator('.usc-mc').nth(1).click(); await sleep(300); // pranzo del 28
await P.locator('#usc-meal-ed button', {hasText:'+ Piatto'}).click(); await sleep(300);
await P.locator('.usc-dn').last().fill('Pasta al pomodoro');
await P.locator('.usc-ingn').last().fill('pasta'); await P.locator('.usc-ingn').last().press('Enter'); await sleep(400);
await P.locator('.usc-ingn').last().fill('passata di pomodoro'); await P.locator('.usc-ingn').last().dispatchEvent('change'); await sleep(400);
ok(await ev(() => { const P0 = uscCur().ax.piatti.find(p => p.nome === 'Pasta al pomodoro'); return P0 && P0.g === 2 && P0.pasto === 'pranzo' && P0.ingr.length === 2 && Number(P0.ingr[0].dose) > 0; }), 'pranzo del 28: piatto con due ingredienti (Invio aggiunge il successivo, dose proposta)');
ok(/Pasta al pomodoro/.test(await P.locator('.usc-menu tr').nth(2).textContent()), 'il menù compare nella tabella');
await P.locator('#usc-meal-ed .usc-copy select').selectOption('3|pranzo'); await sleep(400);
ok(await ev(() => uscMeals(uscCur().ax, 3, 'pranzo').includes('Pasta al pomodoro')), '«Copia in»: lo stesso pranzo il 29');
ok(/pasta/.test(await P.locator('.usc-pgrid').textContent()), 'lista della spesa con gli ingredienti');
{ const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(() => uscExcel())]);
  const z = await JSZip.loadAsync(fs.readFileSync(await d.path())); const wb = await z.file('xl/workbook.xml').async('string');
  ok(/Menù/.test(wb) && /Dosi per piatto/.test(wb) && /Lista della spesa/.test(wb), 'Excel con Menù, Dosi per piatto e Lista della spesa: ' + d.suggestedFilename()); }
// il pasto della giornata mostra il menù
await P.locator('#usc-tab-2').click(); await sleep(300);
ok(/Pasta al pomodoro/.test(await P.locator(`#usc-b-${kP}`).textContent()), 'il blocco «Pranzo» del 28 mostra il menù');
// obiettivi dalla programmazione e «Porta nella programmazione»
await ev(k => { USC_OPEN[k] = true; uscFieldAdd(k, 'obj'); }, kH); await sleep(300);
const pidH = await ev(([i]) => getAllPercorsi()[i].percorsoId, [iP]);
await P.locator(`#usc-b-${kH} .usc-fld .ax-chip`).nth(iP).click(); await sleep(300);
const nO = await P.locator(`#usc-b-${kH} .usc-objl`).count();
ok(nO >= 2, 'campo Obiettivi: obiettivi e Indicatori del percorso scelto nella programmazione (' + nO + ')');
await P.locator(`#usc-b-${kH} .usc-objl input`).first().check(); await sleep(250);
await P.locator(`#usc-b-${kH} .usc-objl input`).last().check(); await sleep(250);
const objH = await ev(k => uscCur().prog[k].obj, kH);
ok(objH.pid === pidH && (objH.o||[]).length === 1 && (objH.i||[]).length === 1, 'scelti un obiettivo e un Indicatore');
await P.locator(`#usc-b-${kH} button`, {hasText:'Porta nella programmazione'}).click(); await sleep(300);
ok(/Consigliato: lavora sugli stessi obiettivi/.test(await P.locator(`#usc-b-${kH} .usc-mvo.best`).textContent()) && await P.locator(`#usc-b-${kH} .usc-mvo`).first().evaluate(e => e.classList.contains('best')), 'propone per primo il percorso con gli stessi obiettivi');
const nAtt0 = await ev(i => getAllPercorsi()[i].attivita.filter(a => (a.testo||'').trim()).length, iP);
await P.locator(`#usc-b-${kH} .usc-mvo.best button`).click(); await sleep(500);
const mv = await ev(([k,i]) => { const m = uscCur().prog[k]; const f = uscAttFind(m); return {k:m.k, idx:f&&f.idx, t:f&&f.a.testo, data:f&&f.a.ax.data, mat:f&&(f.a.ax.mat||[]).map(r=>r.cosa), oss:f&&Object.keys(f.a.ax.oss||{}).length, link:f&&f.a.link, n:getAllPercorsi()[i].attivita.filter(a => (a.testo||'').trim()).length}; }, [kH, iP]);
ok(mv.k === 'att' && mv.idx === iP && mv.t === 'Hike' && mv.data === '2026-12-28' && mv.mat.includes('Cartine') && mv.oss === 1 && /gaiagps/.test(mv.link||'') && mv.n === nAtt0 + 1, 'portata nel percorso: titolo, data, materiali, link e Indicatore da osservare; nell’uscita resta collegata ' + JSON.stringify(mv));
ok(await ev(() => uscSpesa(uscCur())) >= 30, 'la spesa dell’uscita conta ancora i materiali (ora dell’attività)');
// stampe
const pr = await ev(() => { uscPrint('giorno', 2); return window._uscLastPrint; });
ok(/Sveglia e ginnastica/.test(pr) && /LANCIO DALL’USCITA/.test(pr) && /Cartine/.test(pr), 'foglio della giornata: time table e blocchi con i dettagli');
const pt = await ev(() => { uscPrint('tuttotutto'); return window._uscLastPrint; });
ok(/Time table del campo/.test(pt) && /Lista della spesa/.test(pt) && /Quota/.test(pt) && /Circolare/.test(pt), '«Tutto di tutto»: time table, giornate, menù e spesa, quota, circolare');
// scheda Campo: time table generale e moduli
await P.locator('#usc-tab-campo').click(); await sleep(300);
ok(await P.locator('.usc-gseg').count() >= 14 && await P.locator('#ax-900-' + await ev(() => uscJ(USC_CUR)) + ' details[data-k="chi"]').count() === 1, 'scheda Campo: time table di tutto il campo e moduli generali');
await P.locator('.usc-gseg', {hasText:'Serata'}).first().click(); await sleep(400);
ok(await ev(() => USC_TAB) === 2 && await P.locator(`#usc-b-${kS} .usc-bb`).isVisible(), 'dal time table del campo si arriva al blocco nella sua giornata');
// Sezione 3: «fa parte di»
await ev(() => gGo('3')); await sleep(800);
ok(/fa parte di: Campo invernale/.test(await P.locator('.usc-ina').filter({hasText:'fa parte di'}).first().textContent()), 'nella Sezione 3 l’attività dice che fa parte del campo');
// ricarica: torna nell'uscita
await ev(() => uscOpen(USC_CUR || uscList()[0].id, 2)); await sleep(2500);
await P.reload(); await sleep(3500);
ok(await P.locator('.usc-title').isVisible() && await ev(() => USC_TAB) === 2, 'dopo il ricaricamento si riapre l’uscita sulla stessa giornata');
// archivio
await ev(() => clOpen()); await sleep(1500);
ok(await P.locator('#cl-arclist .cl-uc', {hasText:'Campo invernale'}).count() === 1 && await P.locator('#cl-arclist .cl-ucnew').count() >= 1, 'archivio: scheda dell’uscita e «+ Nuova uscita» sotto il progetto');
await P.locator('#cl-arclist .cl-uc', {hasText:'Campo invernale'}).click(); await sleep(900);
ok(await P.locator('.usc-title').isVisible(), 'dall’archivio si apre l’uscita');
// creare un'uscita da un'attività
await ev(() => gGo('3')); await sleep(700);
await ev(([i,j]) => { axSet(i,j,'data','2027-03-14'); axSet(i,j,'pres.rag','18'); axSet(i,j,'luogo.tipo','uscita'); }, [iP, jA]);
await ev(([i,j]) => uscFromAtt(i,j), [iP, jA]); await sleep(900);
ok(await ev(() => { const u = uscCur(); return u && uscModK(u) === 'giorno' && u.ax.data === '2027-03-14' && u.ax.pres.rag === '18' && uscBlocks(u, 1).some(o => o.m.k === 'att'); }), '«Crea un’uscita da qui»: Uscita in giornata con data, presenti e l’attività dentro');
await ev(() => uscOpen(uscList().find(u => u.testo === 'Campo invernale').id, 2)); await sleep(500);
// due persone: Dario co-titolare aggiunge un blocco mentre Anna ne aggiunge un altro
await ev(async () => { await dbInvite(CL.ctx.id, 'dario@x.it', 'cotitolare'); await dbInvite(CL.ctx.id, 'bea@x.it', 'lettore'); await clMemLoad(); }); await sleep(800);
const pd = await person(br, db), PD = pd.page, ed = (f, a) => PD.evaluate(f, a);
await loginAs(PD, base, D); await sleep(1200);
await ed(() => { const x = (CL._inv||[])[0]; clInvOpen(x.id); }); await sleep(3500);
const uid = await ev(() => USC_CUR);
await ed(id => uscOpen(id, 3), uid); await sleep(800);
await P.locator('#usc-tab-3').click(); await sleep(300);
await P.locator('.usc-pi[data-pi="6"]').click(); await PD.locator('.usc-pi', {hasText:'Blocco tuo'}).click(); await sleep(400);
await P.locator('.usc-bti').last().fill('Gioco di Anna'); await PD.locator('.usc-bti').last().fill('Blocco di Dario');
await P.locator('body').click({position:{x:5, y:5}}); await PD.locator('body').click({position:{x:5, y:5}});
await sleep(14000);
const g3 = Pg => Pg.evaluate(() => uscBlocks(uscCur(), 3).map(o => uscBlkTitle(o.m)).sort());
const a3 = await g3(P), d3 = await g3(PD);
ok(JSON.stringify(a3) === JSON.stringify(d3) && a3.includes('Gioco di Anna') && a3.includes('Blocco di Dario'), 'in due: tutti e due i blocchi ci sono per tutti e due ' + JSON.stringify(a3));
// «Per te»
await ev(k => uscBlkSet(k, 'aff', 'Dario Blu (VCR)', true), kS); await P.locator('body').click({position:{x:5, y:5}}); await sleep(9000);
let ptd = []; for(let i = 0; i < 3 && !ptd.length; i++){ ptd = await ed(async () => { await new Promise(r => setTimeout(r, 600)); const it = await clPerTe(); return (it || []).filter(x => x.k === 'usc').map(x => x.t + ' | ' + x.ut); }); }
ok(ptd.some(t => /^Serata \| Campo invernale/.test(t)), 'a Dario arriva in «Per te» il blocco affidato: ' + JSON.stringify(ptd));
await PD.close();
// lettrice
const pb = await person(br, db), PB = pb.page, eb = (f, a) => PB.evaluate(f, a);
await loginAs(PB, base, B); await sleep(1200);
await eb(() => { const x = (CL._inv||[])[0]; clInvOpen(x.id); }); await sleep(3500);
await eb(id => uscOpen(id, 2), uid); await sleep(800);
ok(await PB.locator('.usc-tseg').count() >= 12 && await PB.locator('.usc-pal').count() === 0 && await PB.locator('[data-mv]').count() === 0, 'la lettrice vede time table e blocchi senza poterli cambiare');
await PB.close();
// dati del 19 ottobre (blocchi con tipo/ora) letti e convertiti
await ev(() => { const u = uscCur(); u.prog.old1 = {tipo:'mom', g:4, ora:'08:00', fine:'08:45', t:'Colazione vecchia', cat:'pasto', cr:1}; u.prog.old2 = {tipo:'mom', g:4, ora:'07:30', t:'Sveglia vecchia', cat:'momento', cr:2}; saveData(true); });
await ev(() => uscTab(4)); await sleep(300);
ok(JSON.stringify(await ev(() => uscBlocks(uscCur(), 4).map(o => [uscBlkTitle(o.m), o.m.k, axHM(uscTimes(uscCur(), 4)[o.k].s), o.m.dur]))) === JSON.stringify([['Sveglia vecchia','mio','07:30',60],['Colazione vecchia','pasto','08:00',45]]), 'blocchi salvati con la prima anteprima: ordine, tipo, ora e durata giusti');
// versione principale (senza uscite) apre e salva: le uscite restano
const OLD = '/home/claude/pee-cngei';
const old = http.createServer((q, s) => { let p = decodeURIComponent(q.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html'; fs.readFile(path.join(OLD, p), (e, b) => { if(e){ s.writeHead(404); s.end(); return; } s.writeHead(200, {'content-type': p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream'}); s.end(b); }); }).listen(8098);
await sleep(2500);
const po = await person(br, db), PO = po.page, eo = (f, a) => PO.evaluate(f, a);
await loginAs(PO, 'http://127.0.0.1:8098/', A); await sleep(1200);
await eo(id => clOpenProject(id), pid); await sleep(4000);
await eo(() => gGo('1a')); await sleep(800); await PO.locator('textarea[oninput*="ctxTerr"]').first().click(); await PO.keyboard.press('End'); await PO.keyboard.type(' MODIFICA-VECCHIA'); await PO.locator('body').click({position:{x:5,y:5}}); await sleep(9000);
const row = db.t.pee_archivi.find(x => x.id === pid);
ok(row && /MODIFICA-VECCHIA/.test(row.data.scheda.pp.ctxTerr) && Object.values(row.data.scheda.uscite || {}).some(u => u.testo === 'Campo invernale' && Object.keys(u.prog).length >= 15), 'dopo un salvataggio con la versione principale le uscite sono ancora nel cloud');
await PO.close(); old.close();
await sleep(1000); await P.reload(); await sleep(3500);
ok(await ev(() => /MODIFICA-VECCHIA/.test(scheda.pp.ctxTerr) && uscList().length === 2), 'con la versione nuova: modifica della principale e uscite insieme');
// eliminare
await ev(() => uscOpen(uscList().find(u => u.testo === 'Campo invernale').id)); await sleep(500);
P.__answer = true; await P.locator('.usc-delbtn').click(); await sleep(700);
ok(await ev(() => uscList().length === 1 && Object.values(scheda.uscite).some(u => u.del)), 'eliminata: sparisce dall’elenco (resta segnata come tolta)');
ok(await ev(() => getAllPercorsi().some(p => (p.attivita||[]).some(a => a.lancio === 'LANCIO DALL’USCITA'))), 'l’attività resta nella Sezione 3');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
