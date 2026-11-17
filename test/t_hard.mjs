// Robustezza: date locali (non UTC), nomi di file lunghi, dati locali con tipi sbagliati, titolo aggiornato dal ruolo
import { serve, launch, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch(process.argv[2] || 'chromium');
const ctx = await br.newContext({timezoneId:'Europe/Rome', locale:'it-IT'}); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e && e.message || e).slice(0, 200)));
await p.clock.setFixedTime(new Date('2026-11-17T23:30:00Z'));
await p.goto(base, {waitUntil:'domcontentloaded'}); await sleep(3500);
const r = await p.evaluate(() => ({oggi: isoOggi(), ts: isoOggi(Date.UTC(2026, 10, 17, 23, 30)), cap: fileNameCap('Scheda_PEE_' + 'x'.repeat(300) + '_completa_17-11-2026.docx'), corto: fileNameCap('a.docx'), senzaExt: fileNameCap('y'.repeat(200)), json: fileNameCap('PEE_2026_' + 'z'.repeat(200) + '.json')}));
ok(r.oggi === '2026-11-18' && r.ts === '2026-11-18', 'la data di oggi è quella dell’orologio locale (mezzanotte e mezza in Italia = 18 novembre): ' + r.oggi);
ok(r.cap.length <= 120 && /\.docx$/.test(r.cap), 'nome di file lungo accorciato mantenendo l’estensione (' + r.cap.length + ' caratteri)');
ok(r.corto === 'a.docx' && r.senzaExt.length <= 120 && /\.json$/.test(r.json) && r.json.length <= 120, 'i nomi brevi restano com’erano');
// dati locali con tipi sbagliati: l'app si apre lo stesso
for(const bad of [{STAFF_MEMBERS:'Anna'}, {staffProfiles:[], staffObs:5, staffTimeline:'x', autoObs:[], autoProfile:'y'}, {STAFF_MEMBERS:[1, null, 'Marta']}]){
  const c2 = await br.newContext({timezoneId:'Europe/Rome', locale:'it-IT'}); const q = await c2.newPage(); const e2 = [];
  q.on('pageerror', e => e2.push(String(e && e.message || e).slice(0, 160)));
  await q.addInitScript(d => { try{ if(!localStorage.getItem('bussola_pee_v6')) localStorage.setItem('bussola_pee_v6', JSON.stringify(Object.assign({v:1, MODE:'staff', STAFF_TYPE:'unit', obs:{}, pris:{}, scheda:{pp:{}}}, d))); }catch(e){} }, bad);
  await q.goto(base, {waitUntil:'domcontentloaded'}); await sleep(3500);
  ok(e2.length === 0, 'dati locali con tipi sbagliati ' + JSON.stringify(bad).slice(0, 50) + ': nessun errore (' + e2.slice(0, 1).join('') + ')');
  const names = await q.evaluate(() => Array.isArray(STAFF_MEMBERS) && STAFF_MEMBERS.every(x => typeof x === 'string')); ok(names, '… e l’elenco dello staff resta un elenco di nomi');
  await c2.close();
}
ok(errs.length === 0, 'nessun errore JS');
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
