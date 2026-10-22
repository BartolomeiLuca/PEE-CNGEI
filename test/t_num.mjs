import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1500);
await ev(() => gGo('1a')); await sleep(600);
const find = () => [...document.querySelectorAll('details.att-extra')].find(x => /Numeri dell/.test(x.textContent));
ok(await ev(() => { const d = document.getElementById('num-box'); return !!d && d.offsetParent !== null && !/facoltativo/i.test(d.textContent) && !d.closest('details'); }), '1.1: «Numeri dell’Unità» visibile come gli altri campi, non più facoltativo né chiuso');
const nIn = await ev(() => document.querySelectorAll('#num-box input[type=number]').length);
ok(nIn === 7, 'Reparto: totale, maschi, femmine + 4 anni (' + nIn + ')');
const inp = i => P.locator('#num-box input[type=number]').nth(i);
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
  ok(/Composizione dell’Unità/.test(t) && /TotaleMaschiFemmine241311/.test(t) && /1° anno2° anno3° anno4° anno6666/.test(t), 'Word: capitolo «Composizione dell’Unità» con le due tabelle');
  ok(t.indexOf('Composizione dell’Unità') < t.indexOf('Contesto territoriale') && t.indexOf('Sezione 1 — ') < t.indexOf('Composizione dell’Unità'), 'Word: il capitolo è all’inizio della Sezione 1, prima del Contesto territoriale');
  ok(!/Numeri dell’Unità/.test(t), 'Word: la riga nell’intestazione non c’è più');
  await ev(() => { scheda.pp.numTot = ''; scheda.pp.numM = ''; scheda.pp.numF = ''; scheda.pp.numAnn = []; });
  const [d2] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx())]);
  const z2 = await JSZip.loadAsync(fs.readFileSync(await d2.path())); const t2 = (await z2.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(!/Composizione dell’Unità/.test(t2), 'senza numeri il capitolo non compare nel Word'); }
ok(await ev(() => ppChecks().c1.some(x => /Numeri dell’Unità/.test(x.l) && !x.ok)), '«Cosa manca» del Progetto Personale: i Numeri dell’Unità sono tra le cose da compilare (senza bloccare nulla)');
for (const [fa, n, lab] of [['L', 7, 'Branco'], ['R', 6, 'Compagnia'], ['E', 7, 'Reparto']]) {
  const r = await ev(f => { FASCIA = f; const d = document.createElement('div'); renderSchedaCtx(d); const x = d.querySelector('#num-box'); return x ? x.querySelectorAll('input[type=number]').length + '|' + /Per anno di (\w+)/.exec(x.textContent)[1] : 'assente'; }, fa);
  ok(r.startsWith(n + '|'), lab + ': ' + n + ' campi (' + r + ')');
}
for (const fa of ['E','R']) { const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default; const fs = (await import('fs')).default;
  await ev(f => { FASCIA = f; const SC = staffCols(false); const r = {}; SC.forEach(c => { r[c[0]] = c[0]==='ruolo' ? 'Capo' : 'Zz' + c[0]; }); scheda.pp.ctxTerr = 'TERR'; scheda.pp.ctxSez = 'SEZ'; scheda.pp.staffTab = [r]; }, fa);
  const [d] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx())]);
  const z = await JSZip.loadAsync(fs.readFileSync(await d.path())); const x = await z.file('word/document.xml').async('string'); const t = x.replace(/<[^>]+>/g, '');
  const lab = fa === 'R' ? 'Adulti in Compagnia' : 'Adulti in staff';
  ok(t.indexOf('Contesto Sezione e Gruppo') < t.indexOf(lab) && t.indexOf(lab) < t.indexOf('Osservazione con il KOS: occasioni'), 'Word ' + fa + ': «' + lab + '» è un capitolo dopo Contesto Sezione e Gruppo');
  const hx = x.slice(x.lastIndexOf('<w:p>', x.indexOf(lab)), x.indexOf(lab)), hc = x.slice(x.lastIndexOf('<w:p>', x.indexOf('Contesto territoriale')), x.indexOf('Contesto territoriale'));
  ok(hx.replace(/w:val="[^"]*"/g,'') === hc.replace(/w:val="[^"]*"/g,'') || (hx.match(/w:pStyle w:val="[^"]*"/)||[])[0] === (hc.match(/w:pStyle w:val="[^"]*"/)||[])[0], 'Word ' + fa + ': stesso stile di titolo di «Contesto territoriale»'); }
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
