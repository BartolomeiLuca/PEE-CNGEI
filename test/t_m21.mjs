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
const pc = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
C.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 250)));
await loginAs(C, base, uc); await sleep(1500); await C.evaluate(() => clOpenShared('c1')).catch(()=>{}); await sleep(5000);
await ec(() => { scheda.pp = scheda.pp || {}; scheda.pp.occMan = [{id:'z1', att:'Gioco prova', data:'2026-10-20', perc:['P1']}]; scheda.griglia = {P1:{'m:z1':{pos:'testo titolare', by:{'anna@x.it':{nome:'Anna',pos:'ciao da anna'}}}}}; });
await ec(() => shSub('1b','P')); await sleep(1500);
await C.screenshot({path:'/tmp/gr1.png'});
console.log('HTML', await ec(() => { const t=document.querySelector('.gr-f textarea'); return t ? t.outerHTML.slice(0,300) : 'none'; })); const info = await ec(() => ({n: document.querySelectorAll('.gr-f textarea').length, ro: [...document.querySelectorAll('.gr-f textarea')].map(t => t.readOnly || t.disabled), txt: document.body.innerText.includes('Cosa hanno scritto gli altri'), sel: !!document.querySelector('.pc-scale')}));
console.log(JSON.stringify({n:info.n, free: info.ro.filter(x=>!x).length, txt: info.txt}));
await ec(() => { document.querySelectorAll('.pc-card, details.pc-c').forEach(d => d.open = true); });
const ed = await ec(() => { const t=[...document.querySelectorAll('.gr-f textarea')].find(x=>/'pos'/.test(x.getAttribute('oninput'))&&!x.disabled); if(!t) return null; t.value='scritto da Carla'; t.dispatchEvent(new Event('input',{bubbles:true})); return true; });
ok(ed, 'la collaboratrice può scrivere nei campi della griglia');
ok(await ec(() => { const g=scheda.griglia.P1; const k=Object.keys(g).find(x=>g[x].by&&g[x].by['carla@x.it']); return !!k; }), 'il testo va nel suo spazio (by)');
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
