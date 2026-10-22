// Branco e Compagnia: giro delle sezioni, riquadro numeri, Word ed Excel senza errori
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true; const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
for (const [F, nA, lab] of [['L', 4, 'Branco'], ['R', 3, 'Compagnia']]) {
  const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
  await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
  await ev(f => { selectFascia(f); }, F); await sleep(1200);
  ok(await ev(f => FASCIA === f, F), lab + ': branca impostata');
  const over = [];
  for (const k of ['1a', '1b', '1c', '1d', '2', '3', '4', '5', 'chk']) {
    await ev(k => { if (k === '1c') goPhaseInternal(2); else gGo(k); }, k); await sleep(600);
    const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth})); if (w.sw - w.iw > 1) over.push(k);
  }
  ok(!over.length, lab + ': nessuna sezione larga più dello schermo ' + over.join(','));
  await ev(() => gGo('1a')); await sleep(500);
  const n = await ev(() => { const d = document.querySelector('#num-box'); if (!d) return -1; return d.querySelectorAll(':is(input,textarea)[type=number]').length; });
  ok(n === 3 + nA, lab + ': riquadro numeri con ' + (3 + nA) + ' campi (' + n + ')');
  await ev(() => { scheda.pp.numTot = '18'; scheda.pp.numM = '9'; scheda.pp.numF = '9'; scheda.pp.numAnn = ['5','5','4','4']; saveData(true); });
  const [d] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx())]);
  const z = await JSZip.loadAsync(fs.readFileSync(await d.path())); const t = (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/Composizione dell’Unità/.test(t) && /TotaleMaschiFemmine1899/.test(t) && (nA === 3 ? !/4° anno/.test(t) && /3° anno/.test(t) : /4° anno/.test(t)), lab + ': Word con i numeri (' + (nA === 3 ? '3' : '4') + ' anni)');
  const [e] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportExcel())]);
  ok(fs.statSync(await e.path()).size > 4000, lab + ': Excel scaricato');
  ok(!pa.errors.length, lab + ': nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
  await P.context().close().catch(() => {});
}
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
