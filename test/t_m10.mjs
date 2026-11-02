// Blocco 1 (2 nov): titolare e collaboratore sullo stesso progetto
//  A1 il collaboratore resta nella pagina in cui sta quando il titolare salva
//  A6 «ha già visto l'invito» dopo che il collaboratore ha aperto il progetto (anche da «Continua qui»)
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
db.t.pee_membri.push({id:'m2', archivio_id:'c1', email:'dario@x.it', ruolo:'lettore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'}, {id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const memb = () => db.t.pee_membri.find(m => m.id === 'm1');


const pa = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const A = pa.page, ea = (f, x) => A.evaluate(f, x);
A.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await ea(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(1500);
await ea(() => shPF()); await sleep(1200);
ok(await ea(() => !!document.querySelector('.pf-cols .pf-left .pfx') && !!document.querySelector('.pf-cols .pf-right#pf-mine')), 'la pagina ha due parti: proposte a sinistra, il tuo percorso a destra');
const nome = await ea(() => { pfxSet('mode', 't'); pfxArea(3); const n = (window._pfL || [])[0]; return n; }); await sleep(400);
await ea(() => pfAddS(0)); await sleep(500);
ok(await ea(() => (scheda.pf||[]).length === 1 && !!document.querySelector('.pf-right .pf-c.pf-new')), 'l’attività scelta compare nel percorso (a destra) e resta evidenziata');
const id = await ea(() => (scheda.pf||[])[0].id);
// la metto in un evento esistente
await ea(id => pfSet(id, 'ev', 's1', true), id); await sleep(400);
const b1 = await ea(() => Object.values(uscMap().s1.prog).filter(m => m.k === 'mf' && !m.del).map(m => ({t: m.t, pf: m.pfId, passi: m.mfPassi.length})));
ok(b1.length === 1 && b1[0].pf === id && b1[0].t === pfList0(), 'dentro l’evento c’è il momento formativo con lo stesso nome (' + JSON.stringify(b1) + ')');
function pfList0(){ return nome; }
// se modifico il lancio, si aggiorna
await ea(id => pfSet(id, 'lancio', 'Nuovo lancio scritto da me'), id); await sleep(200);
ok(await ea(() => Object.values(uscMap().s1.prog).some(m => m.pfId && /Nuovo lancio scritto da me/.test(m.mfPassi))), 'cambiando il lancio, cambia anche nell’evento');
// ne creo uno nuovo dalla scheda
await ea(id => pfEvForm(id, true), id); await sleep(300);
await A.fill('#pf-ne-t', 'Riunione di dicembre'); await A.fill('#pf-ne-d', '2026-12-10'); await A.click('.pf-ne .sh-btn'); await sleep(700);
const ev2 = await ea(id => (scheda.pf||[]).find(z => z.id === id).ev, id);
const st = await ea(([id, ev2]) => ({nuovo: Object.values(uscMap()[ev2].prog).filter(m => m.pfId === id && !m.del).length, vecchio: Object.values(uscMap().s1.prog).filter(m => m.pfId === id && !m.del).length, dest: uscMap()[ev2].dest}), [id, ev2]);
ok(ev2 && ev2 !== 's1' && st.nuovo === 1 && st.vecchio === 0 && st.dest === 'staff', 'nuovo evento creato dalla scheda: l’attività ci finisce dentro e esce dal vecchio ' + JSON.stringify(st));
// tolgo l'attività dal percorso
A.on('dialog', d => d.accept().catch(() => {}));
await ea(id => pfDel(id), id); await sleep(500);
ok(await ea(ev2 => Object.values(uscMap()[ev2].prog).filter(m => m.pfId && !m.del).length === 0, ev2), 'togliendola dal percorso esce anche dall’evento');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
