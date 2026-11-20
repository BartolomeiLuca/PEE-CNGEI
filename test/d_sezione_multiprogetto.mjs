// DIAGNOSTICO (non fa parte della serie): un Commissario legge insieme N progetti formativi condivisi da N Capi Gruppo.
// Misura: dati letti, tempo di lettura e di calcolo di una mappa Gruppi × Ambiti, anche con CPU rallentata (telefono).
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import zlib from 'node:zlib';
const engine = 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB(); db.sql13 = true;
const br = await launch(engine); const NG = +(process.env.NG || 9);
const mkProf = (u, nome, ruolo, gr) => db.t.pee_profili.push({user_id: u.id, nome, ruolo, branca: null, sezione: 'Pesaro', gruppo: gr, area_rcdf: 'altoadriatico', dashboard: {}});

// 1) un Capo Gruppo vero crea il progetto formativo e lo riempie come in un anno di uso
const g1 = db.addUser('cg1@x.it', 'password123', 'Capo Gruppo 1'); mkProf(g1, 'Capo Gruppo 1', 'cg', '1');
const pa = await person(br, db), P = pa.page; const ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, g1); await sleep(2500);
await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500);
await ev(() => {
  const nomi = ['Anna Rossi', 'Paolo Riva', 'Elena Sarti', 'Marco Bini', 'Giulia Neri', 'Luca Verdi', 'Sara Costa', 'Dario Pace'];
  STAFF_MEMBERS = nomi.slice(); const ids = Object.values(DB).flat().map(p => p.id);
  nomi.forEach((n, k) => { staffProfiles[n] = {ruolo: 'CU', eta: String(25 + k), esperienza: 'medio', formazione: 'inter'}; staffObs[n] = {}; ids.forEach((id, j) => { staffObs[n][id] = 1 + ((j * 7 + k * 3) % 10); }); });
  scheda.pp = scheda.pp || {}; scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo 1'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
let src = null; for(let k = 0; k < 20 && !src; k++){ await sleep(500); src = db.t.pee_archivi.find(r => r.user_id === g1.id && r.meta && r.meta.mode === 'staff' && r.data && r.data.staffObs && Object.keys(r.data.staffObs).length === 8); }
ok(!!src, 'progetto formativo del Capo Gruppo creato e salvato con 8 persone osservate');
if(!src){ await br.close(); process.exit(1); }
const base1 = JSON.stringify(src.data); console.log('  dimensione di un progetto reale con 8 persone osservate:', (base1.length / 1024).toFixed(0), 'KB (gzip', (zlib.gzipSync(base1).length / 1024).toFixed(0), 'KB)');

// 2) lo stesso progetto per N Capi Gruppo, tutti condivisi con il Commissario; scenari: reale e «pesante» (×4)
const C = db.addUser('cds@x.it', 'password123', 'Commissario'); mkProf(C, 'Commissario', 'cds', null);
const lorem = 'Riunione di staff sulla programmazione annuale: verifica dei tempi, ruoli, attività proposte, esiti e osservazioni sul gruppo di lavoro. '.repeat(1);
function fill(n, factor){
  db.t.pee_archivi = db.t.pee_archivi.filter(r => r.id === src.id); db.t.pee_membri = [];
  for(let i = 1; i <= n; i++){
    const u = i === 1 ? g1 : db.addUser('cg' + i + '@x.it', 'password123', 'Capo Gruppo ' + i);
    const d = JSON.parse(base1); d.pad = []; for(let k = 0; k < (factor - 1) * 220; k++) d.pad.push(lorem + k + ' ' + Math.random().toString(36).slice(2));
    const id = 'prog' + i + 'f' + factor;
    if(i === 1){ src.data = d; src.id = id; } else db.t.pee_archivi.push({id, user_id: u.id, anno: src.anno, titolo: 'Programmazione formativa · Gruppo ' + i, meta: JSON.parse(JSON.stringify(src.meta)), data: d, created_at: src.created_at, updated_at: src.updated_at});
    db.t.pee_membri.push({id: 'm' + i, archivio_id: id, owner_id: u.id, owner_email: u.email, email: 'cds@x.it', ruolo: 'lettore', visto_il: null, created_at: '2026-11-01T10:00:00Z'});
  } }
const pc = await person(br, db), Q = pc.page; const evq = (f, a) => Q.evaluate(f, a);
await loginAs(Q, base, C); await sleep(2000);
const cdp = await pc.ctx.newCDPSession(Q);
for(const [factor, nome] of [[1, 'progetti quasi vuoti'], [4, 'progetti pesanti (~100 KB l’uno)'], [20, 'progetti enormi (~500 KB l’uno)']]){
  fill(NG, factor);
  const tot = db.t.pee_archivi.filter(r => /^prog/.test(r.id)).reduce((a, r) => a + JSON.stringify(r.data).length, 0);
  const gz = db.t.pee_archivi.filter(r => /^prog/.test(r.id)).reduce((a, r) => a + zlib.gzipSync(JSON.stringify(r.data)).length, 0);
  console.log(`\n== ${NG} Capi Gruppo, ${nome}: ${(tot / 1024).toFixed(0)} KB totali, ${(gz / 1024).toFixed(0)} KB compressi`);
  for(const rate of [1, 6]){
    await cdp.send('Emulation.setCPUThrottlingRate', {rate});
    const r = await evq(async () => {
      const t0 = performance.now(); const list = await dbShared(); const t1 = performance.now();
      const rows = await Promise.all(list.map(x => dbGet(x.id))); const t2 = performance.now();
      const jsons = rows.map(x => JSON.stringify(x.data)); const t3 = performance.now(); const parsed = jsons.map(s => JSON.parse(s)); const t4 = performance.now();
      const amb = Object.entries(DB).map(([k, arr]) => [k, arr.map(p => p.id)]);
      const mappa = parsed.map(d => { const o = {}; amb.forEach(([k, ids]) => { let s = 0, n = 0; Object.values(d.staffObs || {}).forEach(ob => ids.forEach(id => { if(typeof ob[id] === 'number'){ s += ob[id]; n++; } })); o[k] = n ? +(s / n).toFixed(1) : null; }); return o; }); const t5 = performance.now();
      return {gruppi: list.length, lette: rows.filter(Boolean).length, elenco: Math.round(t1 - t0), lettura: Math.round(t2 - t1), parse: Math.round(t4 - t3), mappa: Math.round(t5 - t4), k: Object.keys(mappa[0] || {}).join('') };
    });
    console.log(`  CPU ${rate === 1 ? 'normale' : 'rallentata ×6 (telefono)'}: elenco ${r.elenco} ms, lettura ${r.lettura} ms, JSON.parse ${r.parse} ms, mappa Gruppi×Ambiti ${r.mappa} ms · ${r.lette}/${r.gruppi} progetti letti, ambiti ${r.k}`);
    ok(r.gruppi === NG && r.lette === NG, `il Commissario vede e legge tutti i ${NG} progetti condivisi (${nome}, CPU ×${rate})`);
  }
  // una sola richiesta per tutti, invece di una per progetto
  const one = await evq(async () => { const l = await dbShared(); const t = performance.now(); const {data, error} = await CL.sb.from('pee_archivi').select('id,titolo,data').in('id', l.map(x => x.id)); return {n: (data || []).length, err: error && error.message, ms: Math.round(performance.now() - t)}; });
  ok(one.n === NG && !one.err, `una sola richiesta .in('id', …) restituisce tutti i ${NG} progetti (${one.ms} ms) ${one.err || ''}`);
}
// revoca: il Gruppo sparisce
db.t.pee_membri = db.t.pee_membri.filter(m => m.id !== 'm3'); await cdp.send('Emulation.setCPUThrottlingRate', {rate: 1});
const rv = await evq(async () => { const l = await dbShared(); return l.length; });
ok(rv === NG - 1, `dopo la revoca di un invito restano ${NG - 1} Gruppi nell'elenco`);
await br.close(); process.exit(summary() ? 1 : 0);
