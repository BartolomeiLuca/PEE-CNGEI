// Testo formattato: barra, segni nel testo, anteprima, Word
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('dialog', d => d.accept().catch(() => {}));
await P.setViewportSize({width:1280,height:1000});
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
await ev(() => { scheda.pp.staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34'}]; scheda.pp.sezione = 'Pesaro'; scheda.pp.numTot='20'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
// parser
const r = await ev(() => ({
  a: rtSegs('ciao **forte** e _storto_ ++sotto++').map(s => (s.b?'b':'')+(s.i?'i':'')+(s.u?'u':'')+':'+s.t).join('|'),
  b: rtStrip('x **a** _b_ ++c++ ^^d^^ ,,e,,'),
  c: rtSegs('file_nome_x e 2**3 e http://a_b.it').map(s=>s.t).join(''),
  d: rtHas('solo testo'), e: rtHas('con **grassetto**'), f: rtHas('• elenco'),
}));
ok(r.a === ':ciao |b:forte|: e |i:storto|: |u:sotto', 'parser: ' + r.a);
ok(r.b === 'x a b c d e', 'strip: ' + r.b);
ok(r.c === 'file_nome_x e 2**3 e http://a_b.it', 'segni sbilanciati o dentro le parole restano testo');
ok(!r.d && r.e && r.f, 'riconosce il testo formattato');
await ev(() => gGo('usc')).catch(() => {}); await sleep(600);
await ev(() => uscNewStart()); await sleep(300);
await P.fill('#usc-new-t', 'Prova testo'); await P.fill('#usc-new-d1', '2026-12-27'); await P.locator('#usc-new-d1').dispatchEvent('change');
await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
await ev(() => { uscSchema(1, 'tipo'); }); await sleep(300);
await ev(() => { const o = uscBlocks(uscCur(), 1).find(o => o.m.k === 'cerim'); window._K = o.k; USC_OPEN[o.k] = true; uscTab(1); uscRe(); }); await sleep(500);
await ev(() => document.querySelectorAll('#usc-b-' + window._K + ' details.usc-fld').forEach(d => d.open = true)); await sleep(200);
const ta = P.locator('#usc-b-' + await ev(() => window._K) + ' textarea.ax-ta').first();
ok(await ta.count() === 1, 'campo di testo del blocco trovato');
await ta.click(); await sleep(200);
ok(await ev(() => getComputedStyle(document.getElementById('rt-bar')).display) === 'flex', 'la barra compare sul campo');
await ta.fill('uno due tre'); await ta.evaluate(t => { t.setSelectionRange(4, 7); });
await P.locator('#rt-bar [data-rt=b]').click(); await sleep(100);
ok(await ta.inputValue() === 'uno **due** tre', 'grassetto: ' + await ta.inputValue());
await P.locator('#rt-bar [data-rt=b]').click(); await sleep(100);
ok(await ta.inputValue() === 'uno due tre', 'secondo clic toglie il grassetto');
await ta.evaluate(t => { t.setSelectionRange(8, 11); }); await P.locator('#rt-bar [data-rt=i]').click(); await P.locator('#rt-bar [data-rt=u]').click(); await sleep(100);
await ta.evaluate(t => { t.value = 'uno due tre\nquattro'; t.setSelectionRange(0, t.value.length); }); await P.locator('#rt-bar [data-rt=ol]').click(); await sleep(100);
ok(await ta.inputValue() === '1. uno due tre\n2. quattro', 'elenco numerato: '+JSON.stringify(await ta.inputValue()));
await P.locator('#rt-bar [data-rt=ul]').click(); await sleep(100);
ok(await ta.inputValue() === '• uno due tre\n• quattro', 'da numerato a puntato');
await ta.evaluate(t => { t.value = 'titolo e **grassetto** con _corsivo_ e ++sottolineato++ e ^^grande^^\n• primo\n• secondo'; t.dispatchEvent(new Event('input', {bubbles:true})); }); await sleep(300);
const m = await ev(() => { const u = uscCur(); return u.prog[window._K].desc; });
ok(/\*\*grassetto\*\*/.test(m || ''), 'il testo con i segni arriva nei dati: ' + (m || '').slice(0, 40));
const pv = await P.locator('#usc-b-' + await ev(() => window._K) + ' .rt-prev').first().innerHTML().catch(() => '');
ok(/<b>grassetto<\/b>/.test(pv) && /<i>corsivo<\/i>/.test(pv) && /<u>sottolineato<\/u>/.test(pv), 'anteprima sotto il campo');
// Word
const [d] = await Promise.all([P.waitForEvent('download', {timeout: 40000}), ev(() => uscExport('giorno', 1))]);
const x = await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string');
ok(!/\*\*grassetto|_corsivo_|\+\+sotto/.test(x.replace(/<[^>]+>/g, '')), 'nel Word non restano i segni');
ok(/<w:r><w:rPr>[^]*?<w:b\/>[^]*?<\/w:rPr><w:t xml:space="preserve">grassetto<\/w:t>/.test(x), 'Word: grassetto');
ok(/<w:i\/>[^]*?<w:t xml:space="preserve">corsivo<\/w:t>/.test(x), 'Word: corsivo');
ok(/<w:u w:val="single"\/><\/w:rPr><w:t xml:space="preserve">sottolineato<\/w:t>/.test(x), 'Word: sottolineato');
ok(/<w:t xml:space="preserve">grande<\/w:t>/.test(x) && /• primo/.test(x.replace(/<[^>]+>/g, '')), 'Word: corpo e elenco');
fs.copyFileSync(await d.path(), '/tmp/t_rich.docx');
ok(true, 'docx valido');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
await P.screenshot({path:'/tmp/shot_rich.png'});
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
