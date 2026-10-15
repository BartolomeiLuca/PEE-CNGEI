import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1500);
await ev(() => gGo('1a')); await sleep(600);
const find = () => [...document.querySelectorAll('details.att-extra')].find(x => /Numeri dell/.test(x.textContent));
ok(await ev(() => { const d = [...document.querySelectorAll('details.att-extra')].find(x => /Numeri dell/.test(x.textContent)); return !!d && !d.open; }), '1.1: riquadro «Numeri dell’Unità» presente e chiuso');
await P.locator('details.att-extra:has(#num-check) > summary').click(); await sleep(200);
const nIn = await ev(() => document.querySelectorAll('details.att-extra:has(#num-check) input[type=number]').length);
ok(nIn === 7, 'Reparto: totale, maschi, femmine + 4 anni (' + nIn + ')');
const inp = i => P.locator('details.att-extra:has(#num-check) input[type=number]').nth(i);
await inp(0).fill('24'); await inp(1).fill('13'); await inp(2).fill('10'); await sleep(200);
ok(/fanno 23/.test(await ev(() => document.getElementById('num-check').textContent)), 'avviso morbido se maschi e femmine non fanno il totale');
await inp(2).fill('11'); for (let i = 3; i < 7; i++) await inp(i).fill('6'); await sleep(200);
ok((await ev(() => document.getElementById('num-check').textContent)) === '', 'nessun avviso se i numeri tornano');
await inp(6).fill('7'); await sleep(200);
ok(/anni fanno 25/.test(await ev(() => document.getElementById('num-check').textContent)), 'avviso morbido se gli anni non fanno il totale');
await inp(6).fill('6'); await sleep(1500);
await P.reload(); await sleep(1500);
const kept = await ev(() => { const p = scheda.pp; return [p.numTot, p.numM, p.numF, (p.numAnn || []).join(',')].join('|'); });
ok(kept === '24|13|11|6,6,6,6', 'i numeri restano dopo il ricaricamento (' + kept + ')');
{ const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default; const fs = (await import('fs')).default;
  const [d] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx())]);
  const z = await JSZip.loadAsync(fs.readFileSync(await d.path())); const t = (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/Numeri dell’Unità/.test(t) && /24 in totale \(13 maschi, 11 femmine\)/.test(t) && /1° anno: 6 · 2° anno: 6 · 3° anno: 6 · 4° anno: 6/.test(t), 'i numeri compaiono nell’intestazione del Word della Scheda');
  await ev(() => { scheda.pp.numTot = ''; scheda.pp.numM = ''; scheda.pp.numF = ''; scheda.pp.numAnn = []; });
  const [d2] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx())]);
  const z2 = await JSZip.loadAsync(fs.readFileSync(await d2.path())); const t2 = (await z2.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(!/Numeri dell’Unità/.test(t2), 'senza numeri la riga non compare nel Word'); }
for (const [fa, n, lab] of [['L', 7, 'Branco'], ['R', 6, 'Compagnia'], ['E', 7, 'Reparto']]) {
  const r = await ev(f => { FASCIA = f; const d = document.createElement('div'); renderSchedaCtx(d); const x = [...d.querySelectorAll('details.att-extra')].find(y => /Numeri dell/.test(y.textContent)); return x ? x.querySelectorAll('input[type=number]').length + '|' + /Per anno di (\w+)/.exec(x.textContent)[1] : 'assente'; }, fa);
  ok(r.startsWith(n + '|'), lab + ': ' + n + ' campi (' + r + ')');
}
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
