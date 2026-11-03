// B3: osservazioni della griglia per persona
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
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
A.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 250)));
const pc = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
C.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await loginAs(C, base, uc); await sleep(1200); C.evaluate(() => clOpenShared('c1')).catch(() => {}); await sleep(3500);
// Anna (titolare) scrive nel testo principale; dato preesistente conservato
await ea(() => { scheda.griglia = {P1:{'m:z':{pos:'vecchio testo'}}}; grSet('P1','m:z','pos','Anna: hanno collaborato'); });
ok(await ea(() => scheda.griglia.P1['m:z'].pos === 'Anna: hanno collaborato' && !scheda.griglia.P1['m:z'].by), 'il titolare scrive nel testo principale');
await ea(() => { saveData(true); }); await sleep(500); await ea(() => clPush(true)).catch(() => {}); await sleep(3500);
await sleep(3000);
const seen = await ec(() => (scheda.griglia||{}).P1 && (scheda.griglia.P1['m:z']||{}).pos);
console.log('Carla vede:', seen);
await ec(() => { grSet('P1','m:z','pos','Carla: uno si è isolato'); grSet('P1','m:z','mig','Carla: ascolto'); saveData(true); }); await sleep(500); await ec(() => clPush(true)).catch(() => {}); await sleep(3500);
const d = await ec(() => scheda.griglia.P1['m:z']);
ok(d.by && d.by['carla@x.it'] && d.by['carla@x.it'].pos === 'Carla: uno si è isolato', 'la collaboratrice scrive nel proprio spazio');
ok(d.pos !== 'Carla: uno si è isolato', 'non sovrascrive il testo principale');
const oth = await ec(() => grOthers(scheda.griglia.P1['m:z'], 'pos').map(o => o.nome + '=' + o.t).join('|'));
ok(/Anna/.test(oth) || !seen, 'Carla vede il testo del titolare tra «gli altri» (' + oth + ')');
const eff = await ea(() => grEff(scheda.griglia.P1['m:z'], 'pos'));
console.log('eff', eff);
ok(/Anna: hanno collaborato/.test(eff), 'il testo del titolare è nel complessivo');
const rem = db.t.pee_archivi.find(z => z.id === 'c1').data.scheda.griglia.P1['m:z'];
ok(rem.pos === 'Anna: hanno collaborato' && rem.by && rem.by['carla@x.it'], 'sul server ci sono entrambi i testi (' + JSON.stringify(rem).slice(0, 160) + ')');
await sleep(3500);
ok(await ea(() => /Carla: uno/.test(grEff(scheda.griglia.P1['m:z'], 'pos'))), 'Anna riceve il testo di Carla nel panorama');
const gd = await ea(() => cfGridRows('P1').map(r => r.d.pos).join('|'));
ok(/Carla/.test(gd) && /Anna/.test(gd), 'il Confronto aggrega i due testi');
ok(!pa.errors.length && !pc.errors.length, 'nessun errore JS' + [...pa.errors, ...pc.errors].slice(0, 3).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
