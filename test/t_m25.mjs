// griglia collaboratore
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri'), ud = db.addUser('dario@x.it', 'password123', 'Dario Blu');
for (const [u, n] of [[ua, 'Anna Verdi'], [uc, 'Carla Neri'], [ud, 'Dario Blu']]) db.t.pee_profili.push({user_id:u.id, nome:n, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const us = (id, t, d) => ({id, cr:1, testo:t, modello:'sede', ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'},
    uscite:{r0:Object.assign(us('r0', 'Prima riunione', '2026-11-07'), {prog:{u1:{k:'nuova', g:1, ord:1, dur:20, t:'Merenda dei ragazzi', f:[]}}}), s1:Object.assign(us('s1', 'Bivacco di staff', '2026-11-22'), {dest:'staff', prog:{x1:{k:'nuova', g:1, ord:1, dur:30, t:'Segreto del programma', f:[]}, x2:{k:'nuova', g:1, ord:2, dur:30, t:'Momento di Carla', aff:'carla@x.it', f:[]}}})}, priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')],
    pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'CU', nome:'Carla Neri', mail:'carla@x.it'}]},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-11-07')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Cerchio', '2026-11-14')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', '2026-11-28')]}]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_archivi.push({id:'c2', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto · II trimestre', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P2:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'II trimestre', dal:'2027-01', al:'2027-03'}, cicloDa:'c1', uscite:{q1:{id:'q1', cr:1, testo:'Bivacco di febbraio', modello:'sede', dest:'staff', ax:{data:'2027-02-13', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}}, priorita:[{ambito:'P', necessita:'n', percorso:'P2', obiettivi:[0], idr:[0], tDal:'2027-01', tAl:'2027-03'}], pp:{sezione:'Pesaro', gruppo:'1'}, percorsiExtra:[]}}, created_at:'2026-10-13T09:00:00Z', updated_at:'2026-10-13T09:00:00Z'});
db.t.pee_membri.push({id:'m2', archivio_id:'c1', email:'dario@x.it', ruolo:'lettore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'}, {id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const memb = () => db.t.pee_membri.find(m => m.id === 'm1');
const pa = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const A = pa.page, ea = (f, x) => A.evaluate(f, x);
const pc = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
await loginAs(A, base, ua); await sleep(1500); await A.evaluate(() => shOpen('c1', 0)).catch(()=>{}); await sleep(3500);
await loginAs(C, base, uc); await sleep(1500); await C.evaluate(() => clOpenShared('c1')).catch(()=>{}); await sleep(4500);
await ea(() => { scheda.pp = scheda.pp || {}; scheda.pp.occMan = [{id:'z1', att:'Gioco prova', data:'2026-10-20', perc:['P1']}]; saveData(true); }); await sleep(500); await ea(() => clPush(true)).catch(()=>{}); await sleep(5000);
const typeIn = async (P, txt) => P.evaluate(txt => { const t=[...document.querySelectorAll('.gr-f textarea')].find(x=>/'pos'/.test(x.getAttribute('oninput'))&&!x.disabled); if(!t) return 'none'; t.value=txt; t.dispatchEvent(new Event('input',{bubbles:true})); _clTouched = true; _clUserAt = Date.now(); return 'ok'; }, txt);
await ea(() => shSub('1b','P')); await ec(() => shSub('1b','P')); await sleep(1500);
await ea(() => document.querySelectorAll('details.pc-c, .pc-card').forEach(d => d.open = true)); await ec(() => document.querySelectorAll('details.pc-c, .pc-card').forEach(d => d.open = true));
console.log('A', await typeIn(A, 'testo di Anna'), 'C', await typeIn(C, 'testo di Carla')); await sleep(3000);
await sleep(15000);
const srv = () => JSON.stringify((db.t.pee_archivi.find(z => z.id === 'c1').data.scheda.griglia||{}).P1||null);
console.log('SERVER', srv());
await sleep(8000); await A.reload(); await C.reload(); await sleep(8000);
console.log('A after', await ea(() => JSON.stringify((scheda.griglia||{}).P1||null)));
console.log('C after', await ec(() => JSON.stringify((scheda.griglia||{}).P1||null)));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
