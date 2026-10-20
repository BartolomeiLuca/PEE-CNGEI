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
ok(await P.locator('.usc-tabs2 .usc-tab[id^="usc-tab-"]').count() === 4 && await P.locator('.usc-tabs1 #usc-tab-campo').count() === 1 && await P.locator('.usc-tabs1 #usc-tab-pasti').count() === 1 && await P.locator('.usc-tabs1 #usc-tab-m-chi').count() === 1 && await P.locator('.usc-tabs1 .usc-tab', {hasText:'+ Aggiungi un modulo'}).count() === 1, 'prima riga: Campo, i moduli e «+ Aggiungi un modulo»; sotto le 4 giornate');
ok(await P.locator('.usc-ms, .usc-mods').count() > 0 && await P.locator('details.ax-g').count() === 0, 'niente più colonna dei moduli a destra');
ok(await ev(() => { const x = uscCur().ax; return x.pres.rag === '22' && x.pres.ragF === '10' && x.pres.ragM === '12' && x.pres.ad.length === 3; }), 'ragazzi (anche ragazze e ragazzi) e capi dai Numeri dell’Unità e dalla tabella dello staff');
// pagina di un modulo: a tutta larghezza, referente, × per toglierlo, riepilogo giornata per giornata
await P.locator('#usc-tab-m-costi').click(); await sleep(300);
ok(await P.locator('.usc-modpage .usc-ctab tr').count() === 6 && await P.locator('.usc-modpage .usc-mref select').count() === 1, '«Cassa e quota»: referente e costi giornata per giornata (4 giornate + totale)');
await P.locator('#usc-tab-m-pb').click(); await sleep(300);
P.__answer = true; await P.locator('.usc-modpage .usc-mx').click(); await sleep(300);
ok(await ev(() => USC_TAB) === 'campo' && await P.locator('#usc-tab-m-pb').count() === 0, 'la × in alto a destra toglie il modulo');
await P.locator('.usc-tab', {hasText:'+ Aggiungi un modulo'}).click(); await sleep(200);
await P.locator('.usc-addpanel .ax-chip', {hasText:'Piano B'}).click(); await sleep(300);
ok(await ev(() => USC_TAB) === 'm:pb' && await P.locator('#usc-tab-m-pb').count() === 1, '«+ Aggiungi un modulo» lo rimette');
// in sede: luogo e ritrovo alla sede; si torna a campo
await ev(() => uscSetModello('sede')); await sleep(200);
ok(await ev(() => { const L = uscCur().ax.luogo; return L.tipo === 'sede' && L.ritrovoDove === 'Via del Bosco 1, Pesaro'; }) && /in sede/.test(await P.locator('#usc-sub').textContent()), '«Evento in sede»: luogo in sede e ritrovo all’indirizzo della sede');
await ev(() => uscSetModello('campo')); await sleep(200);
ok(await ev(() => uscCur().ax.luogo.tipo === 'uscita'), '…tornando a «Campo» il luogo non resta «in sede»');
await P.locator('#usc-tab-m-log').click(); await sleep(300);
ok(/si parte dal luogo di ritrovo/.test(await P.locator('.usc-modpage').textContent()) && await P.locator('.usc-modpage input[placeholder*="Città della Sezione"]').count() === 0, 'la partenza è il luogo di ritrovo');
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
// durata scritta a mano, campi fermi, duplica, × nell'intestazione, avviso dell'ora fissa
const pos0 = await P.locator(`#usc-b-${kP} .usc-brow > *`).evaluateAll(E => E.map(e => Math.round(e.getBoundingClientRect().left)));
await P.locator(`#usc-b-${kP} .usc-durin`).fill('1h30'); await P.locator(`#usc-b-${kP} .usc-durin`).dispatchEvent('change'); await sleep(300);
ok(await ev(k => uscCur().prog[k].dur, kP) === 90, 'durata scritta a mano: «1h30» = 90 minuti');
await P.locator(`#usc-b-${kP} .usc-durin`).fill('45'); await P.locator(`#usc-b-${kP} .usc-durin`).dispatchEvent('change'); await sleep(300);
const pos1 = await P.locator(`#usc-b-${kP} .usc-brow > *`).evaluateAll(E => E.map(e => Math.round(e.getBoundingClientRect().left)));
ok(await ev(k => uscCur().prog[k].dur, kP) === 45 && JSON.stringify(pos0) === JSON.stringify(pos1), 'cambiando la durata i campi restano dove sono');
ok(await P.locator(`#usc-b-${kP} .usc-bh .usc-bx`).count() === 1, '× per togliere il blocco nell’intestazione');
const n3 = await ev(() => uscBlocks(uscCur(), 3).length);
await P.locator(`#usc-b-${kP} .usc-mv2`, {hasText:'Duplica in'}).locator('select').selectOption('3'); await sleep(300);
ok(await ev(() => uscBlocks(uscCur(), 3).length) === n3 + 1 && await ev(() => uscBlocks(uscCur(), 3).some(o => o.m.pasto === 'pranzo' && o.m.fix)), '«Duplica in»: il pranzo anche il 29 (con la sua ora fissa)');
await ev(k => { const m = uscCur().prog[k]; m.ora = '08:00'; uscRe(); }, kP); await sleep(200);
ok(/questo blocco comincia prima che finisca quello precedente \(finisce alle \d\d:\d\d\)/.test(await P.locator(`#usc-b-${kP}`).textContent()), 'avviso dell’ora fissa scritto in chiaro');
await ev(k => { const m = uscCur().prog[k]; m.ora = '12:30'; uscRe(); }, kP); await sleep(200);
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
ok(await P.locator(`#usc-b-${kH} details.usc-fld`).count() >= 4 && await P.locator(`#usc-b-${kH} details.usc-fld:not([open])`).count() >= 3 && /Cosa si fa/.test((await P.locator(`#usc-b-${kH} details.usc-fld summary`).allTextContents()).join('|')), 'i campi del blocco si aprono e si chiudono (chiusi all’inizio)');
await ev(k => { USC_FOPEN[k+'|mat'] = true; USC_FOPEN[k+'|link'] = true; uscRe(); }, kH); await sleep(100);
await P.locator(`#usc-b-${kH} button`, {hasText:'+ Materiale'}).click(); await sleep(200);
await P.locator(`#usc-b-${kH} .ax-mat input[placeholder="Materiale"]`).first().fill('Cartine');
await P.locator(`#usc-b-${kH} .ax-mat .ax-q`).first().fill('6');
await P.locator(`#usc-b-${kH} .ax-mat select:not(.ax-qm)`).first().selectOption('comprare'); await sleep(300);
await P.locator(`#usc-b-${kH} .ax-mat .ax-q`).nth(1).fill('5'); await sleep(300);
ok(await P.locator(`#usc-b-${kH} .ax-mat`).first().evaluate(e => /Chi lo procura/.test(e.textContent) && /Dove comprarlo/.test(e.textContent) && /A carico di/.test(e.textContent)), 'materiali del blocco con le stesse voci del materiale comune');
await P.locator(`#usc-b-${kH} button`, {hasText:'+ Link'}).click(); await sleep(200);
await P.locator(`#usc-b-${kH} .usc-links-r input`).nth(1).fill('https://www.gaiagps.com/map/?loc=1'); await sleep(200);
ok(await ev(() => uscSpesa(uscCur())) === 30 && /Materiali/.test(await P.locator('#usc-tiles').textContent()) && /1 voce|2 voci/.test(await P.locator('#usc-tiles').textContent()), 'materiale da comprare nel blocco: entra nella spesa (30 €)');
// spese generali e quota con scenari
await ev(() => { const u = uscCur(); u.ax.spese = [{voce:'Casa', importo:'8', modo:'notte', notti:3, carico:'ragazzi'}, {voce:'Pullman', importo:'660', modo:'forfait', carico:'ragazzi'}]; saveData(true); uscRe(); });
await P.locator('.usc-tile', {hasText:'Quota'}).click(); await sleep(300);
ok(await P.locator('#usc-detail button', {hasText:'Esporta'}).count() === 1 && await P.locator('#usc-detail button', {hasText:'Stampa'}).count() === 0, 'nei riquadri «Esporta» al posto di «Stampa»');
const det = await P.locator('#usc-detail').textContent();
ok(/Quota ragazzi/.test(det) && /capi costano/.test(det) && /ogni ragazzo paga/.test(det), 'riquadro «Quota»: quanto costano i capi e quanto pesano sulla quota dei ragazzi');
ok(/tutto sui ragazzi/.test(det) && /metà della loro parte/.test(det) && await P.locator('#usc-detail .ax-conto').count() === 0, 'scenari con le descrizioni brevi, senza la riga grigia del conto');
await P.locator('#usc-tab-m-costi').click(); await sleep(300);
const scen = t => P.locator('.usc-modpage .usc-sctab tr', {hasText:t}).locator('button', {hasText:'Scegli'}).click().catch(() => {});
await scen('Capi non pagano'); await sleep(300);
const q1 = await ev(() => axQuota(uscCur().ax));
await scen('Quota ridotta capi'); await sleep(300);
const q2 = await ev(() => axQuota(uscCur().ax));
await scen('Capi pagano la loro parte'); await sleep(300);
const q3 = await ev(() => axQuota(uscCur().ax));
ok(q1 > q2 && q2 > q3 && Math.abs((q1 - q3) - 2*(q1 - q2)) < 0.01, `scenari: ${q1.toFixed(2)} > ${q2.toFixed(2)} (metà) > ${q3.toFixed(2)}`);
ok(await ev(() => { const x = uscCur().ax, N = axN(x); const y = Object.assign({}, x, {spese:[{voce:'Pullman', importo:'660', modo:'forfait', carico:'ragazzi'}], mat:[], piatti:[], contrib:''}); Object.defineProperty(y, '__u', {value:'nessuna'}); const a = uscQ(y, 'ragazzi'), b = uscQ(y, 'capi'); return Math.abs(a - 660/N.rag) < 0.01 && Math.abs(b - 660/N.tot) < 0.01; }), 'anche una spesa «in tutto» (pullman) si divide tra tutti: i capi che non pagano pesano sui ragazzi');
ok(await P.locator('.usc-modpage .ax-conto').count() === 0 && await P.locator('.usc-modpage .ax-quota-box').count() === 0, 'Cassa e quota senza ripetizioni (niente riquadro verde e riga grigia)');
await P.locator('.usc-contrib input').first().fill('110'); await sleep(300);
const q4 = await ev(() => axQuota(uscCur().ax));
ok(Math.abs(q3 - q4 - 5) < 0.01 && /Contributo/.test(await ev(() => axQuotaConto(uscCur().ax))), 'contributo di 110 €: quota di 5 € più bassa');
await P.locator('.usc-modpage .ax-chip', {hasText:'Bonifico alla Sezione'}).click(); await sleep(300);
await P.locator('.usc-modpage input[placeholder^="IT00"]').fill('IT60 X054 2811 1010 0000 0123 456'); await P.locator('.usc-modpage input[placeholder^="es. CNGEI"]').fill('CNGEI Sezione di Pesaro'); await sleep(900);
await P.locator('.usc-modpage .ax-chip', {hasText:'In contanti'}).count().then(n => ok(n === 1, 'si può scegliere anche «In contanti ai capi»'));
// circolare dell'uscita (carta intestata nazionale)
{ const j = await ev(() => uscJ(USC_CUR)); const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(j => axMsgDocx(900, j), j)]);
  const t = (await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/Campo invernale/.test(t) && t.includes(q4.toFixed(2).replace('.', ',')), 'circolare in Word dall’uscita con la quota giusta');
  ok(/IT60 X054 2811 1010 0000 0123 456/.test(t) && /CNGEI Sezione di Pesaro/.test(t), 'IBAN e intestatario nella circolare');
  ok(/Giulia, Dario e Elena/.test(t), 'firma con tutto lo staff: ' + (t.match(/grazie,(.{0,60})/)||[])[1]);
  ok(/Il programma/.test(t) && /Hike/.test(t) && !/wp:anchor/.test(await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')), 'circolare dell’uscita con il programma, senza immagini flottanti'); }
// scheda Pasti: menù cliccabile, ingredienti, copia, Excel
await P.locator('#usc-tab-pasti').click(); await sleep(300);
await P.locator('.usc-menu tr').nth(2).locator('.usc-mc').nth(1).click(); await sleep(300); // pranzo del 28
await P.locator('#usc-meal-ed button', {hasText:'+ Piatto'}).first().click(); await sleep(300);
await P.locator('.usc-dn').last().fill('Pasta al pomodoro');
await P.locator('.usc-ingn').last().fill('pasta'); await P.locator('.usc-ingn').last().press('Enter'); await sleep(400);
await P.locator('.usc-ingn').last().fill('passata di pomodoro'); await P.locator('.usc-ingn').last().dispatchEvent('change'); await sleep(400);
ok(await ev(() => { const P0 = uscCur().ax.piatti.find(p => p.nome === 'Pasta al pomodoro'); return P0 && P0.g === 2 && P0.pasto === 'pranzo' && P0.ingr.length === 2 && Number(P0.ingr[0].dose) > 0; }), 'pranzo del 28: piatto con due ingredienti (Invio aggiunge il successivo, dose proposta)');
ok(/Pasta al pomodoro/.test(await P.locator('.usc-menu tr').nth(2).textContent()), 'il menù compare nella tabella');
await P.locator('#usc-meal-ed .usc-copy select').selectOption('3|pranzo'); await sleep(400);
ok(await ev(() => uscMeals(uscCur().ax, 3, 'pranzo').includes('Pasta al pomodoro')), '«Copia in»: lo stesso pranzo il 29');
ok(/pasta/.test(await P.locator('.usc-pgrid').textContent()), 'lista della spesa con gli ingredienti');
await P.locator('.ax-chip', {hasText:'+ Merenda del mattino'}).click(); await sleep(300);
ok(await P.locator('.usc-menu th', {hasText:'Merenda del mattino'}).count() === 1 && await P.locator('.usc-menu tr').nth(4).locator('.usc-mc').count() === 5, '«+ Merenda del mattino»: una colonna in più in tutte le giornate');
P.__answer = true; await P.locator('.usc-menu th', {hasText:'Merenda del mattino'}).locator('.usc-mcx').click(); await sleep(300);
ok(await P.locator('.usc-menu th', {hasText:'Merenda del mattino'}).count() === 0, '…e con la × si toglie da tutte');
await P.locator('.usc-menu tr').nth(2).locator('.usc-mc').nth(1).click(); await sleep(200);
if(!(await P.locator('#usc-meal-ed').count())){ await P.locator('.usc-menu tr').nth(2).locator('.usc-mc').nth(1).click(); await sleep(200); }
await P.locator('#usc-meal-ed button', {hasText:'Piatto per pochi'}).click(); await sleep(300);
await P.locator('.usc-dn').last().fill('Panini per l’hike');
await P.locator('.usc-per input').last().fill('Pattuglia Volpi'); await P.locator('.usc-per select.usc-pn').last().selectOption('6'); await sleep(400);
ok(await ev(() => uscMeals(uscCur().ax, 2, 'pranzo').some(t => t === 'Panini per l’hike (Pattuglia Volpi · 6 pers.)')), 'piatto per pochi: «per chi» e quante persone');
await P.locator('.usc-dish').last().locator('.usc-ingn').last().fill('salsa segreta'); await P.locator('.usc-dish').last().locator('.usc-ingn').last().dispatchEvent('change'); await sleep(400);
await ev(() => { const P0 = uscCur().ax.piatti.find(p => p.nome === 'Panini per l’hike'); const ig = P0.ingr.find(i => i.nome === 'salsa segreta'); ig.dose = '20'; ig.um = 'g'; saveData(true); uscRe(); }); await sleep(300);
const y0 = await ev(() => window.scrollY);
await P.locator('.usc-dish').last().locator('.usc-ingn').last().press('Enter'); await sleep(500);
{ const y1 = await ev(() => window.scrollY); const vis = await ev(() => { const r = document.activeElement.getBoundingClientRect(); return document.activeElement.classList.contains('usc-ingn') && r.top > 0 && r.bottom < innerHeight; });
  ok(y1 >= y0 - 20 && y1 - y0 < 400 && vis, 'aggiungendo un ingrediente la pagina non torna su al menù: resta lì, con il nuovo ingrediente in vista (' + y0 + ' → ' + y1 + ')'); }
ok(await P.locator('.usc-dish .usc-noprice').count() >= 1 && /salsa segreta/.test(await P.locator('.usc-npw').textContent()) && /stimata/.test(await P.locator('.usc-npw').textContent()), 'ingredienti senza prezzo evidenziati: la spesa è stimata');
{ const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(() => uscExcel())]);
  const z = await JSZip.loadAsync(fs.readFileSync(await d.path())); const wb = await z.file('xl/workbook.xml').async('string');
  ok(/Menù/.test(wb) && /Dosi per piatto/.test(wb) && /Lista della spesa/.test(wb), 'Excel con Menù, Dosi per piatto e Lista della spesa: ' + d.suggestedFilename()); }
// il pasto della giornata mostra il menù
await P.locator('#usc-tab-2').click(); await sleep(300);
ok(/Pasta al pomodoro/.test(await P.locator(`#usc-b-${kP}`).textContent()) && /Pattuglia Volpi/.test(await P.locator(`#usc-b-${kP}`).textContent()), 'il blocco «Pranzo» del 28 mostra il menù, anche quello per la Pattuglia');
// obiettivi dalla programmazione e «Porta nella programmazione»
await ev(k => { USC_OPEN[k] = true; uscFieldAdd(k, 'obj'); }, kH); await sleep(300);
const pidH = await ev(([i]) => getAllPercorsi()[i].percorsoId, [iP]);
ok(/Priorità \d — (Personale|Comunitario|Spirituale) · [PCS]\d+ /.test(await P.locator(`#usc-b-${kH} .usc-objp .ax-chip`).first().textContent()), 'obiettivi: etichetta intera «Priorità n — Ambito · percorso»');
await P.locator(`#usc-b-${kH} .usc-objp .ax-chip`).nth(iP).click(); await sleep(300);
const nO = await P.locator(`#usc-b-${kH} .usc-objl`).count();
ok(nO >= 2, 'campo Obiettivi: obiettivi e Indicatori del percorso scelto nella programmazione (' + nO + ')');
await P.locator(`#usc-b-${kH} .usc-objl input`).first().check(); await sleep(250);
await P.locator(`#usc-b-${kH} .usc-objl input`).last().check(); await sleep(250);
const objH = await ev(k => uscCur().prog[k].obj, kH);
ok(objH.pid === pidH && (objH.o||[]).length === 1 && (objH.i||[]).length === 1, 'scelti un obiettivo e un Indicatore');
await P.locator(`#usc-b-${kH} button`, {hasText:'Porta nella programmazione'}).click(); await sleep(300);
ok(/Consigliato: lavora sugli stessi obiettivi/.test(await P.locator(`#usc-b-${kH} .usc-mvo.best`).textContent()) && await P.locator(`#usc-b-${kH} .usc-mvo`).first().evaluate(e => e.classList.contains('best')), 'propone per primo il percorso con gli stessi obiettivi');
await ev(k => { USC_FOPEN[k+'|scal'] = true; uscRe(); }, kH); await sleep(200);
await P.locator(`#usc-b-${kH} .usc-scr input`).first().fill('Partenza dal campo'); await P.locator(`#usc-b-${kH} .usc-scr select`).first().selectOption('60'); await sleep(400);
ok(await ev(k => { const m = uscCur().prog[k]; return (m.tt||[])[0].cosa === 'Partenza dal campo' && Number(m.tt[0].dur) === 60; }, kH) && /\d\d:\d\d/.test(await P.locator(`#usc-b-${kH} .usc-sct`).first().textContent()), 'scaletta anche nelle attività nate nell’uscita (orari dall’inizio del blocco)');
const nAtt0 = await ev(i => getAllPercorsi()[i].attivita.filter(a => (a.testo||'').trim()).length, iP);
await P.locator(`#usc-b-${kH} .usc-mvo.best button`).click(); await sleep(500);
const mv = await ev(([k,i]) => { const m = uscCur().prog[k]; const f = uscAttFind(m); return {tt:f&&(f.a.ax.tt2||[]).map(r=>r.cosa+'@'+(r.start||'')).join('|'), k:m.k, idx:f&&f.idx, t:f&&f.a.testo, data:f&&f.a.ax.data, mat:f&&(f.a.ax.mat||[]).map(r=>r.cosa), oss:f&&Object.keys(f.a.ax.oss||{}).length, link:f&&f.a.link, n:getAllPercorsi()[i].attivita.filter(a => (a.testo||'').trim()).length}; }, [kH, iP]);
ok(mv.k === 'att' && mv.idx === iP && mv.t === 'Hike' && mv.data === '2026-12-28' && mv.mat.includes('Cartine') && mv.oss === 1 && /gaiagps/.test(mv.link||'') && mv.n === nAtt0 + 1, 'portata nel percorso: titolo, data, materiali, link e Indicatore da osservare; nell’uscita resta collegata ' + JSON.stringify(mv));
ok(await ev(() => uscSpesa(uscCur())) >= 30, 'la spesa dell’uscita conta ancora i materiali (ora dell’attività)');
ok(/^Partenza dal campo@\d\d:\d\d/.test(mv.tt||''), 'la scaletta passa nella Sezione 3 con l’ora d’inizio (' + mv.tt + ')');
// attività della Sezione 3 nell'uscita: gli stessi campi, in tempo reale nei due sensi
await ev(k => { USC_OPEN[k] = true; USC_FOPEN[k+'|a:mat'] = true; USC_FOPEN[k+'|a:sic'] = true; uscRe(); }, kH); await sleep(300);
ok(await P.locator(`#usc-b-${kH} details.usc-fld[data-f="a:mat"] .ax-mat input[placeholder="Materiale"]`).count() >= 1 && await P.locator(`#usc-b-${kH} details.usc-fld[data-f="a:scal"]`).count() === 1, 'nel blocco i materiali dell’attività sono righe normali, come nella Sezione 3; c’è anche la scaletta');
await P.locator(`#usc-b-${kH} details[data-f="a:mat"] button`, {hasText:'Aggiungi materiale'}).click(); await sleep(300);
await P.locator(`#usc-b-${kH} details[data-f="a:mat"] .ax-mat input[placeholder="Materiale"]`).last().fill('Bussole'); await sleep(300);
await P.locator(`#usc-b-${kH} details[data-f="a:sic"] textarea`).first().fill('Attraversamento della statale: in fila con un capo in testa'); await sleep(300);
ok(await ev(k => { const f = uscAttFind(uscCur().prog[k]); return (f.a.ax.mat||[]).some(r => r.cosa === 'Bussole') && /statale/.test(f.a.ax.sic.rischi); }, kH), 'scritti nell’uscita: materiale e sicurezza sono subito nell’attività della Sezione 3');
await ev(k => { const f = uscAttFind(uscCur().prog[k]); updateAttivita(f.idx, f.j, 'incRischi', 'Attenzione a chi si stanca presto'); uscRe(); }, kH); await sleep(200);
ok(/chi si stanca presto/.test(await P.locator(`#usc-b-${kH} details[data-f="a:ben"] summary`).textContent()), 'scritto nella Sezione 3: si vede subito nel blocco dell’uscita');
await ev(k => { const m = uscCur().prog[k]; delete m._mig; m.pb = 'Se piove si resta al rifugio'; uscRe(); }, kA); await sleep(200);
ok(await ev(k => { const m = uscCur().prog[k]; const f = uscAttFind(m); return !m.pb && /resta al rifugio/.test(f.a.pianoB||''); }, kA), 'il piano B scritto sul blocco (versione di prima) passa all’attività');
await P.locator('#usc-tab-m-mat').click(); await sleep(300);
await ev(() => { USC_FOPEN['pd|mat|2'] = true; uscRe(); }); await sleep(200);
ok(await P.locator('.usc-modpage .usc-axw .ax-mat input[placeholder="Materiale"]').count() >= 2 && await P.locator('.usc-modpage details.usc-mpd').count() >= 1 && await P.locator('.usc-modpage details.usc-pdday').count() === 4, 'Materiali: comuni e giornate collassabili, i materiali delle attività esplosi e modificabili');
await P.locator('#usc-tab-m-chi').click(); await sleep(200);
ok(!/giornata per giornata/i.test(await P.locator('.usc-modpage').textContent()), 'in «Persone e date» niente «giornata per giornata»');
// spostamenti: come ritrovo e trasporti, anche andata e ritorno
await P.locator('#usc-tab-m-log').click(); await sleep(300);
await P.locator('.usc-modpage .usc-pdday').nth(2).locator('button', {hasText:'Spostamento in questa giornata'}).evaluate(e => e.click()); await sleep(400);
const tr = P.locator('.usc-modpage .usc-pdday').nth(2).locator('.usc-trip').first();
ok(await tr.locator('input').first().inputValue() === '' && (await tr.locator('input').first().getAttribute('placeholder')) !== null, 'nuovo spostamento con partenza, arrivo, ora, mezzo, km e ritorno');
await tr.locator('input').nth(1).fill('Rifugio Cotaline');
await tr.locator('select').nth(0).selectOption('09:00'); await sleep(400);
await P.locator('.usc-modpage .usc-pdday').nth(2).locator('.usc-trip').first().locator('select').nth(1).selectOption('bus'); await sleep(300);
await P.locator('.usc-modpage .usc-pdday').nth(2).locator('.usc-trip').first().locator('select').nth(2).selectOption('giorno'); await sleep(300);
await P.locator('.usc-modpage .usc-pdday').nth(2).locator('.usc-trip').first().locator('select').nth(3).selectOption('17:00'); await sleep(300);
await P.locator('.usc-modpage .usc-pdday').nth(2).locator('button', {hasText:'Metti il ritorno nel programma'}).click(); await sleep(400);
ok(await ev(() => { const R = uscBlocks(uscCur(), 3).filter(o => o.m.k === 'sposta'); const T = uscTimes(uscCur(), 3); return R.length === 2 && R.some(o => o.m.trip.a === 'Rifugio Cotaline' && axHM(T[o.k].s) === '09:00') && R.some(o => o.m.trip.da === 'Rifugio Cotaline' && o.m.ora === '17:00' && o.m.fix); }), 'spostamento delle 9:00 al rifugio con il ritorno alle 17:00 messo nel programma al suo posto');
// stampe
const dtxt = async (f, a) => { const [d] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(f, a)]); return {n: d.suggestedFilename(), t: (await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, ' ')}; };
const pr = await dtxt(() => uscExport('giorno', 2));
ok(/\.docx$/.test(pr.n) && /Sveglia e ginnastica/.test(pr.t) && /LANCIO DALL’USCITA/.test(pr.t) && /Cartine/.test(pr.t) && /Pattuglia Volpi/.test(pr.t), 'Esporta la giornata in Word: time table e blocchi con i dettagli (' + pr.n + ')');
const pt = await dtxt(() => uscExport('tuttotutto'));
ok(/Time table del campo/.test(pt.t) && /Lista della spesa/.test(pt.t) && /Quota/.test(pt.t) && /Circolare/.test(pt.t), '«Tutto di tutto» in Word: time table, giornate, menù e spesa, quota, circolare');
// scheda Campo: time table generale e moduli
await P.locator('#usc-tab-campo').click(); await sleep(300);
ok(await P.locator('.usc-gseg').count() >= 14 && /spesa totale/.test(await P.locator('.usc-sint').textContent()) && await P.locator('.usc-camp .usc-ctab tr').count() === 6, 'scheda Campo: time table di tutto il campo, sintesi e riepilogo per giornata');
await P.locator('.usc-gseg', {hasText:'Serata'}).first().click(); await sleep(400);
ok(await ev(() => USC_TAB) === 2 && await P.locator(`#usc-b-${kS} .usc-bb`).isVisible(), 'dal time table del campo si arriva al blocco nella sua giornata');
// Sezione 3: «fa parte di»
await ev(() => gGo('3')); await sleep(800);
ok(/fa parte di: Campo invernale/i.test(await P.locator('.usc-ina').filter({hasText:/fa parte di/i}).first().textContent()), 'nella Sezione 3 l’attività dice che fa parte del campo');
{ const iA = await ev(() => { const f = uscAttFind(Object.values(uscList().find(u => u.testo === 'Campo invernale').prog).find(m => m.k === 'att' && m.t !== 'Hike' && uscAttFind(m))); return [f.idx, f.j]; });
  await ev(([i,j]) => { axSet(i,j,'durata','piu',true); }, iA); await sleep(300);
  const tx = await P.locator(`#ax-${iA[0]}-${iA[1]}`).textContent();
  ok(!/Con il pernotto è un bivacco/.test(tx) && await P.locator(`#ax-${iA[0]}-${iA[1]} details[data-k="chi"]`).count() === 0 && await P.locator(`#ax-${iA[0]}-${iA[1]} details[data-k="mat"]`).count() === 1 && /Vai all’uscita/.test(tx), 'attività già in un’uscita: niente avvisi, solo il cuore dell’attività e «Vai all’uscita»');
  await P.locator(`#ax-${iA[0]}-${iA[1]} .usc-ina button`, {hasText:'Mostra anche il resto'}).evaluate(e => e.click()); await sleep(300);
  ok(await P.locator(`#ax-${iA[0]}-${iA[1]} details[data-k="chi"]`).count() === 1, '«Mostra anche il resto» fa vedere tutto');
  await ev(([i,j]) => { axSet(i,j,'durata','giorno',true); }, iA); }
// ricarica: torna nell'uscita
await ev(() => uscOpen(USC_CUR || uscList()[0].id, 2)); await sleep(2500);
await P.reload(); await sleep(3500);
ok(await P.locator('.usc-title').isVisible() && await ev(() => USC_TAB) === 2, 'dopo il ricaricamento si riapre l’uscita sulla stessa giornata');
// archivio
await ev(() => clOpen()); await sleep(1500);
ok(await P.locator('#cl-arclist .cl-uc', {hasText:'Campo invernale'}).count() === 1 && await P.locator('#cl-arclist .cl-ucnew').count() >= 1, 'archivio: scheda dell’uscita e «+ Nuova uscita» sotto il progetto');
await P.locator('#cl-arclist .cl-uc', {hasText:'Campo invernale'}).click(); await sleep(900);
ok(await P.locator('.usc-title').isVisible(), 'dall’archivio si apre l’uscita');
await ev(() => { document.getElementById('main-app').style.display = 'none'; MODE = null; clOpen(); }); await sleep(1500);
await P.locator('#cl-arclist .cl-uc', {hasText:'Campo invernale'}).click(); await sleep(1200);
ok(await P.locator('.usc-title').isVisible() && await ev(() => MODE) === 'giovani', 'anche arrivando dalla Home (app chiusa) il pulsante dell’uscita la apre');
// creare un'uscita da un'attività
await ev(() => gGo('3')); await sleep(700);
await ev(([i,j]) => { axSet(i,j,'data','2027-03-14'); axSet(i,j,'pres.rag','18'); axSet(i,j,'luogo.tipo','uscita'); }, [iP, jA]);
await ev(([i,j]) => uscFromAtt(i,j), [iP, jA]); await sleep(900);
ok(await ev(() => { const u = uscCur(); return u && uscModK(u) === 'giorno' && u.ax.data === '2027-03-14' && u.ax.pres.rag === '18' && uscBlocks(u, 1).some(o => o.m.k === 'att'); }), '«Crea un’uscita da qui»: Uscita in giornata con data, presenti e l’attività dentro');
await ev(() => uscOpen(uscList().find(u => u.testo === 'Campo invernale').id, 2)); await sleep(500);
// un percorso PEE che non è nella programmazione: portando l'attività nasce un percorso in più
await ev(() => uscTab(3)); await sleep(200);
await P.locator('.usc-pi[data-pi="6"]').click(); await sleep(400);
const kG = await ev(() => { const R = uscBlocks(uscCur(), 3); return R[R.length-1].k; });
await ev(k => { USC_OPEN[k] = true; uscFieldAdd(k, 'obj'); }, kG); await sleep(300);
const other = await ev(() => { const L = getAllPercorsi().map(p => p.percorsoId); return Object.values(DB).flat().find(q => !L.includes(q.id)).id; });
await P.locator(`#usc-b-${kG} .usc-fld select`).last().selectOption(other); await sleep(300);
await P.locator(`#usc-b-${kG} .usc-objl input`).first().check(); await sleep(250);
const nPx = await ev(() => scheda.percorsiExtra.length);
await P.locator(`#usc-b-${kG} button`, {hasText:'Porta nella programmazione'}).click(); await sleep(300);
await P.locator(`#usc-b-${kG} .usc-mvo.best button`, {hasText:'Crea il percorso'}).click(); await sleep(500);
ok(await ev(([n, id, k]) => scheda.percorsiExtra.length === n + 1 && scheda.percorsiExtra[n].percorsoId === id && (scheda.percorsiExtra[n].obiettiviExtra||[]).length === 1 && uscCur().prog[k].k === 'att', [nPx, other, kG]), 'percorso PEE nuovo: nasce un percorso in più con l’obiettivo scelto e l’attività dentro');
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
await ev(k => { uscBlkSet(k, 'aff', 'Dario Blu (VCR)', true); const u = uscCur(); u.prog[k].f.push('mat'); u.ax.bm = u.ax.bm || {}; u.ax.bm[k] = [{cosa:'Chitarra', q:1, qm:'fissa', prov:'unita', chi:'Dario Blu (VCR)'}]; u.ax.ref = Object.assign({}, u.ax.ref, {sic:'Dario Blu (VCR)'}); saveData(true); uscRe(); }, kS); await P.locator('body').click({position:{x:5, y:5}}); await sleep(9000);
let ptd = []; for(let i = 0; i < 3 && !ptd.length; i++){ ptd = await ed(async () => { await new Promise(r => setTimeout(r, 600)); const it = await clPerTe(); return (it || []).filter(x => x.k === 'usc').map(x => x.t + ' | ' + x.ut); }); }
ok(ptd.some(t => /^Serata \| Campo invernale/.test(t)), 'a Dario arriva in «Per te» il blocco affidato: ' + JSON.stringify(ptd));
ok(ptd.some(t => /Chitarra/.test(t)) && ptd.some(t => /referente: sicurezza/.test(t)), '…e anche il materiale da procurare e la parte di cui è referente');
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
