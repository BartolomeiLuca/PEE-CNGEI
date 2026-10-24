// A capo nel Word: i ritorni a capo dei campi diventano <w:br/>
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
import { createRequire } from 'module'; const require = createRequire('/home/claude/work/libs/');
const JSZip = require('jszip');
const base = await serve(); const db = new FakeDB(); const br = await launch('chromium'); const pa = await person(br, db); const P = pa.page, ev=(f,a)=>P.evaluate(f,a);
await P.goto(base,{waitUntil:'domcontentloaded'}); await sleep(1500);
await ev(() => needDocx());
const [dl] = await Promise.all([P.waitForEvent('download'), ev(async () => { await dSave(dDocument([dPara('riga uno\nriga due\n\nriga quattro'), dPara('senza capo')],'prova'), 'prova.docx'); })]);
const buf = await (async()=>{ const fs = await import('fs'); return fs.readFileSync(await dl.path()); })();
const z = await JSZip.loadAsync(buf); const x = await z.file('word/document.xml').async('string');
ok((x.match(/<w:br\/>/g)||[]).length >= 2, 'ci sono gli a capo veri (' + (x.match(/<w:br\/>/g)||[]).length + ')');
ok(!/<w:t[^>]*>[^<]*\n[^<]*<\/w:t>/.test(x), 'nessun ritorno a capo grezzo rimasto dentro il testo');
ok(/riga uno<\/w:t><w:br\/><w:t[^>]*>riga due/.test(x), 'riga uno / riga due separate');
ok(/senza capo/.test(x), 'il testo senza a capo resta com’è');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors[0] : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
