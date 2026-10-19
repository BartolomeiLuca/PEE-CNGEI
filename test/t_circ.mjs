// Correzioni 7-8: circolare firmata da tutto lo staff, telefono del Capo Unità sempre, intestazione semplice, «Scarica in PDF»
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
import fs from 'fs'; import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
const OUT = '/tmp/t_circ'; fs.mkdirSync(OUT, {recursive:true});
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => { scheda.pp.sezione = 'Pesaro'; scheda.pp.staffTab = [{ruolo:'CU', nome:'Giulia Neri', tel:'', mail:'giulia@x.it'}, {ruolo:'VCU', nome:'Paolo Riva', tel:'333 1112222'}, {ruolo:'VCU', nome:'Elena Bassi', tel:''}]; saveData(true); });
await ev(() => gGo('3')); await sleep(800);
const [p, j] = await ev(() => [getAllPercorsi().findIndex(x => x.percorsoId === 'S3'), 1]);
await ev(([p, j]) => { ['chi','log','durante','mat','pasti','costi','sic','circ','imp'].forEach(k => axOpen[p+'-'+j+'-'+k] = true); axRe(p, j); let e = document.getElementById('ax-'+p+'-'+j); while(e){ if(e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } document.querySelectorAll('#ax-'+p+'-'+j+' details').forEach(d => d.open = true); }, [p, j]); await sleep(300);
const c = await ev(() => axStaffContatti());
ok(c.length === 2 && c[0].n === 'Giulia' && c[0].cu && c[1].n === 'Paolo', 'contatti: il Capo Unità sempre (anche senza telefono), gli altri solo se hanno il telefono ' + JSON.stringify(c));
ok(await ev(() => axFirma()) === 'Giulia, Paolo e Elena', 'firmata da tutte le persone della tabella dello staff (' + await ev(() => axFirma()) + ')');
const ask = P.locator(`#ax-cutel-${p}-${j}`);
ok(await ask.isVisible(), 'se manca il telefono del Capo Unità lo chiede');
await ask.locator('input').fill('320 9998877'); await ask.locator('input').press('Tab'); await sleep(300);
ok(await ev(() => scheda.pp.staffTab[0].tel) === '320 9998877', 'il telefono scritto lì finisce nella tabella dello staff (1.1)');
const txt = await ev(([p, j]) => axMsgText(p, j), [p, j]);
ok(/Giulia: 320 9998877/.test(txt) && /Paolo: 333 1112222/.test(txt) && !/Elena:/.test(txt), 'messaggio: contatti giusti');
// Word
const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(([p, j]) => axMsgDocx(p, j), [p, j])]);
fs.copyFileSync(await d.path(), OUT + '/c.docx');
const z = await JSZip.loadAsync(fs.readFileSync(OUT + '/c.docx'));
const h3 = await z.file('word/header3.xml').async('string'), dx = await z.file('word/document.xml').async('string');
ok(!/wp:anchor/.test(h3) && !/wp:anchor/.test(dx), 'Word: niente immagini o riquadri ancorati alla pagina (niente colonna laterale)');
ok((h3.match(/<wp:inline/g) || []).length === 2, 'Word: i due loghi (Sezione e Branca) sono in linea nell’intestazione');
ok(/CNGEI Pesaro/.test(h3) && /Capo Reparto: Giulia Neri · tel\. 320 9998877/.test(h3.replace(/<[^>]+>/g, '')), 'Word: intestazione con Sezione e contatti del Capo Unità');
ok(/w:left="1134"/.test(dx), 'Word: margini normali (niente spazio per la colonna)');
const t = dx.replace(/<[^>]+>/g, '');
ok(/Giulia: tel\. 320 9998877/.test(t) && /Paolo: tel\. 333 1112222/.test(t) && /Giulia, Paolo e Elena/.test(t), 'Word: contatti e firma');
let first = '';
try{ execSync(`cd ${OUT} && soffice --headless --convert-to pdf c.docx >/dev/null 2>&1`, {timeout:90000}); first = execSync(`pdftotext -f 1 -l 1 ${OUT}/c.pdf -`).toString(); }catch(e){ first = 'ERR ' + e.message; }
ok(/Ciao a tutte e a tutti/.test(first), 'Word aperto da un altro programma (LibreOffice): il testo comincia nella prima pagina');
// PDF
const [d2] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(([p, j]) => axMsgPdf(p, j), [p, j])]);
ok(/\.pdf$/.test(d2.suggestedFilename()), 'c’è «Scarica in PDF» e scarica un .pdf (' + d2.suggestedFilename() + ')');
fs.copyFileSync(await d2.path(), OUT + '/c2.pdf');
const pt = execSync(`pdftotext ${OUT}/c2.pdf -`).toString();
const tit = await ev(([p, j]) => attGet(p, j).testo, [p, j]);
ok(pt.includes(tit) && /Ciao a tutte e a tutti/.test(pt) && /CNGEI Pesaro/.test(pt), 'PDF: intestazione, titolo e testo');
ok(/Giulia: tel\. 320 9998877/.test(pt) && /Giulia, Paolo e Elena/.test(pt), 'PDF: contatti e firma');
ok(/“/.test(pt) && /’/.test(pt), 'PDF: virgolette e apostrofi tipografici leggibili');
ok(/\/URI/.test(fs.readFileSync(OUT + '/c2.pdf', 'latin1')), 'PDF: i link sono cliccabili');
ok(/Ciao a tutte/.test(execSync(`pdftotext -f 1 -l 1 ${OUT}/c2.pdf -`).toString()), 'PDF: il testo comincia nella prima pagina');
try{ execSync(`pdftoppm -r 50 -f 1 -l 1 -png ${OUT}/c2.pdf ${OUT}/pdfp`); execSync(`pdftoppm -r 50 -f 1 -l 1 -png ${OUT}/c.pdf ${OUT}/docp`); }catch(e){}
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
