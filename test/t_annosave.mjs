// Strumenti dell'anno: due dispositivi dello stesso utente non si sovrascrivono
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_archivi.push({id:'a1', user_id:u.id, anno:2026, titolo:'Verifica dell’anno 2026-27 · Reparto', meta:{mode:'anno', fascia:'E', tipo:'ANNO', nome:'Reparto'}, data:{v:1, MODE:'anno', FASCIA:'E', UNIT_NAME:'Reparto', ver:{a:'uno'}, sp:[], ts:1}, updated_at:'2026-11-01T10:00:00Z'});
await loginAs(P, base, u); await sleep(1500);
const R = await ev(async () => { CL.ctx = CL.ctx || {}; CL.ctx.anno = 2026; const r = await annoRowEnsure(2026); window._R = r; return {id:r.id, raw:r.raw, base:!!r.base}; });
ok(R.id === 'a1' && R.raw === '2026-11-01T10:00:00Z' && R.base, 'riga letta con ora e copia di base: ' + JSON.stringify(R));
// secondo dispositivo salva una chiave diversa
const row = db.t.pee_archivi.find(r => r.id === 'a1'); row.data = Object.assign({}, row.data, {ver:{a:'uno', b:'DUE'}, ts:2}); row.updated_at = '2026-11-01T11:00:00Z';
await ev(async () => { _R.data.ver.c = 'TRE'; _R.data.ts = 3; await annoPush(_R); });
const f = db.t.pee_archivi.find(r => r.id === 'a1').data;
ok(f.ver.a === 'uno' && f.ver.b === 'DUE' && f.ver.c === 'TRE', 'le due modifiche convivono: ' + JSON.stringify(f.ver));
// salvataggio normale dopo l'unione
await ev(async () => { _R.data.ver.d = 'QUATTRO'; await annoPush(_R); });
ok(db.t.pee_archivi.find(r => r.id === 'a1').data.ver.d === 'QUATTRO', 'salvataggio successivo senza conflitti');
// spese: lista unita
const row2 = db.t.pee_archivi.find(r => r.id === 'a1'); row2.data = Object.assign({}, row2.data, {sp:[{id:'x1', desc:'altro dispositivo'}]}); row2.updated_at = '2026-11-01T12:00:00Z';
await ev(async () => { _R.data.bil = {k1: 50}; await annoPush(_R); });
const f2 = db.t.pee_archivi.find(r => r.id === 'a1').data;
ok(f2.sp.length === 1 && f2.bil && f2.bil.k1 === 50 && f2.ver.d === 'QUATTRO', 'spese dell’altro dispositivo e bilancio conservati: ' + JSON.stringify({sp:f2.sp.length, bil:f2.bil}));
await br.close(); summary();
process.exit(0);
