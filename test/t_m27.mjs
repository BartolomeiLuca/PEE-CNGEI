// griglia collaboratore
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
await loginAs(A, base, ua); await sleep(1500); await A.evaluate(() => shOpen('c1', 0)).catch(()=>{}); await sleep(3500);
await ea(() => shPerc('P')); await sleep(1500); await ea(() => { const d=document.getElementById('att-0-0'); d.open=true; });
await sleep(800);
await ea(() => { window.__RT_OFF = false; });
const ta = A.locator('#att-0-0 textarea').first();
await ta.scrollIntoViewIfNeeded(); await ta.click(); await A.keyboard.type('uno due tre quattro'); await sleep(800);
console.log('eds', await A.locator('#att-0-0 .rt-ed').count());
const ed = A.locator('#att-0-0 .rt-ed').first(); const bb = await ed.boundingBox(); console.log('bb', JSON.stringify(bb));
// selezione col mouse: trascino da inizio parola «due» a fine
await A.mouse.move(bb.x + 40, bb.y + 14); await A.mouse.down(); await A.mouse.move(bb.x + 75, bb.y + 14, {steps:6}); await A.mouse.up(); await sleep(300);
console.log('sel1', JSON.stringify(await ea(() => getSelection().toString())));
await A.screenshot({path:'/tmp/rt1.png'});
console.log('bar', await ea(() => { const b=document.getElementById('rt-bar'); return b ? JSON.stringify({d:getComputedStyle(b).display, top:b.getBoundingClientRect().top, left:b.getBoundingClientRect().left}) : 'none'; }));
console.log('RT_T', await ea(() => RT_T ? RT_T.tagName + '.' + RT_T.className + ' conn=' + RT_T.isConnected : 'null'), 'active', await ea(() => document.activeElement.tagName + '.' + document.activeElement.className));
const b = A.locator('#rt-bar [data-rt=b]'); if (await b.count()) { await b.click(); await sleep(400); }
console.log('val', JSON.stringify(await ta.inputValue()), 'edhtml', await ed.innerHTML());
await A.mouse.dblclick(bb.x + 100, bb.y + 14); await sleep(300); console.log('sel2', JSON.stringify(await ea(() => getSelection().toString())));
await A.keyboard.press('Control+b'); await sleep(300); console.log('val2', JSON.stringify(await ta.inputValue()));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
