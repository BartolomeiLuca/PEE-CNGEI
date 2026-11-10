// Blocco 1 (2 nov): titolare e collaboratore sullo stesso progetto
//  A1 il collaboratore resta nella pagina in cui sta quando il titolare salva
//  A6 «ha già visto l'invito» dopo che il collaboratore ha aperto il progetto (anche da «Continua qui»)
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
A.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await ea(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(1500);
await ea(() => shPF()); await sleep(1500);
await ea(() => { pfxSet('mode', 't'); pfxArea(3); }); await sleep(300); await ea(() => pfAddS(0)); await sleep(500);
const id = await ea(() => scheda.pf[0].id);
await sleep(1500);
const opts = await ea(() => [...document.querySelectorAll('.pf-c select[id^=pf-ev] option')].map(o => o.value + '=' + o.textContent));
console.log(JSON.stringify(opts));
ok(opts.some(o => /^c2\|q1=/.test(o)), 'tra gli eventi compare quello di un altro ciclo: ' + opts.filter(o => /^c2/.test(o)).join());
await ea(id => pfSet(id, 'ev', 'c2|q1', true), id); await sleep(2500);
const r = db.t.pee_archivi.find(z => z.id === 'c2').data.scheda.uscite.q1.prog;
const bl = Object.values(r).filter(m => m.k === 'mf' && !m.del && m.pfId === id);
ok(bl.length === 1, 'l’attività è finita davvero nell’evento dell’altro ciclo (' + bl.length + ')');
ok(await ea(id => scheda.pf[0].ev === 'q1' && scheda.pf[0].evCy === 'c2', id), 'il percorso ricorda evento e ciclo');
// la sposto in un evento del ciclo aperto: esce dall'altro
await ea(id => pfSet(id, 'ev', 's1', true), id); await sleep(2500);
const bl2 = Object.values(db.t.pee_archivi.find(z => z.id === 'c2').data.scheda.uscite.q1.prog).filter(m => m.pfId === id && !m.del).length;
const bl3 = await ea(id => Object.values(uscMap().s1.prog).filter(m => m.pfId === id && !m.del).length, id);
ok(bl2 === 0 && bl3 === 1, 'cambiando evento esce dall’altro ciclo ed entra nel ciclo aperto (' + bl2 + '/' + bl3 + ')');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
