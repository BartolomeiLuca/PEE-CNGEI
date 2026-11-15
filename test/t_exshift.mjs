// Le date dell'esempio seguono il calendario (a settimane, fino a 12; da settembre riparte con l'anno dopo)
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const br = await launch(engine);
async function run(day){
  const db = new FakeDB(); const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
  if(day) await P.clock.install({time: new Date(day + 'T10:00:00')});
  await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
  await P.evaluate(() => exStart('AN')); await sleep(2500);
  const r = await ev(() => { const d = Object.values(scheda.uscite || {}).map(u => (u.ax || {}).data).filter(Boolean).sort(); const a = []; getAllPercorsi().forEach(p => (p.attivita || []).forEach(x => { if((x.ax || {}).data) a.push(x.ax.data); })); return {first: d[0], last: d[d.length - 1], anno: scheda.annoScout, tDal: (scheda.priorita[0] || {}).tDal, act: a.sort()[0], n: d.length}; });
  await pa.page.context().close(); return r;
}
const r0 = await run(null); const t = new Date(); const dd = Math.floor((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(2026, 10, 14)) / 864e5);
ok(r0.first && r0.n >= 6, 'esempio di oggi: eventi con date (' + r0.first + ' … ' + r0.last + ')');
const plus = (iso, n) => { const d = new Date(Date.parse(iso + 'T12:00:00Z') + n * 864e5); return d.toISOString().slice(0, 10); };
const r1 = await run('2027-01-20');
ok(r1.first === plus(r0.first, 63) && r1.last === plus(r0.last, 63) && r1.act === plus(r0.act, 63) && r1.tDal === '2026-12' && r1.anno === '2026-27', 'il 20/01/2027 l’esempio è scorso di 9 settimane: ' + r1.first + ' … ' + r1.last);
const r2 = await run('2027-10-01');
ok(r2.first === plus(r0.first, 364) && r2.last === plus(r0.last, 364) && r2.anno === '2027-28' && r2.tDal === '2027-10', 'da settembre riparte con l’anno dopo: ' + r2.first + ' … ' + r2.last + ' · ' + r2.anno);
summary(); await br.close(); process.exit(0);
