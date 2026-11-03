// valori a più voci: nessun valore deve sparire quando un collaboratore dà il suo
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri');
for (const [u, n] of [[ua, 'Anna Verdi'], [uc, 'Carla Neri']]) db.t.pee_profili.push({user_id:u.id, nome:n, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true}, obs:{P1:6,P2:7,C1:4}, scheda:{mv:{on:true,by:{},dec:{},log:[]}, tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I', dal:'2026-10', al:'2026-12'}, uscite:{}, pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'CU', nome:'Carla Neri', mail:'carla@x.it'}]}, percorsiExtra:[]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const pa = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const A = pa.page, ea = (f, x) => A.evaluate(f, x);
const pc = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
A.on('pageerror', e => console.log('PAGEERR A', String(e).slice(0, 250))); C.on('pageerror', e => console.log('PAGEERR C', String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await loginAs(C, base, uc); await sleep(1200); C.evaluate(() => clOpenShared('c1')).catch(() => {}); await sleep(3500);

const rem=()=>db.t.pee_archivi.find(z=>z.id==='c1').data.obs;
await sleep(1500);
const v0 = await ec(()=>({P1:obs.P1,P2:obs.P2,C1:obs.C1}));
ok(v0.P1===6 && v0.P2===7 && v0.C1===4, 'osservazione a più voci: i valori scritti prima, senza un autore, non spariscono all’apertura (' + JSON.stringify(v0) + ')');
await ec(() => { _clTouched=true; _clUserAt=Date.now(); setObs('P3',3); });
await sleep(5000);
const r = rem();
ok(r.P1===6 && r.P2===7 && r.C1===4 && r.P3===3, 'il collaboratore dà il suo valore e quelli degli altri restano sul server (' + JSON.stringify({P1:r.P1,P2:r.P2,C1:r.C1,P3:r.P3}) + ')');
await sleep(3000);
const a = await ea(()=>({P1:obs.P1,P2:obs.P2,C1:obs.C1,P3:obs.P3, by: Object.keys((scheda.mv||{}).by||{})}));
ok(a.P1===6 && a.P2===7 && a.C1===4 && a.P3===3, 'chi ha il progetto li vede tutti (' + JSON.stringify(a) + ')');
ok(a.by.includes('anna@x.it'), 'i valori senza autore diventano di chi ha il progetto');
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
