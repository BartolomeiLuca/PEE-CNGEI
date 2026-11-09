// 3/11 pomeriggio: attività da programmazione = attività nuove, referenti, «affidato a te», parti affidate, Obiettivi, Condividi come pagina, Patto
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri');
for (const [u, n] of [[ua, 'Anna Verdi'], [uc, 'Carla Neri']]) db.t.pee_profili.push({user_id:u.id, nome:n, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d, aid) => ({aid, testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', ax:Object.assign(d ? {data:d} : {}, aid==='a1'?{ref:{sic:'carla@x.it'}}:{})});
const us = (id, t, d) => ({id, cr:1, testo:t, modello:'sede', ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'},
    uscite:{r0:Object.assign(us('r0', 'Prima riunione', '2026-11-07'), {prog:{
      u1:{k:'nuova', g:1, ord:1, dur:20, t:'Gioco nuovo', f:['tipo','met','sic','obj','pb'], ref:{sic:'carla@x.it'}, strum:['Gioco'], obj:{pid:'P1', o:[0], i:[0], chi:'anna@x.it'}},
      b1:{k:'att', g:1, ord:2, dur:90, pid:'P1', aid:'a1', f:['lsc','mat','sic','ben','pb']}}})},
    priorita:[pri('P','P1','2026-10','2026-12')],
    pp:{occMan:[{id:'o1', att:'Gioco di prova', data:'2026-10-20', perc:['P1']}], sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'CU', nome:'Carla Neri', mail:'carla@x.it'}]},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', strumSel:{'Gioco':''}, attivita:[att('Gioco A', '2026-10-20', 'a1')]}]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const pa = await person(br, db, {ctx:{viewport:{width:1400, height:1000}}}); const A = pa.page, ea = (f, x) => A.evaluate(f, x);
const pc = await person(br, db, {ctx:{viewport:{width:1400, height:1000}}}); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
A.on('pageerror', e => console.log('PAGEERR A', String(e).slice(0, 250))); C.on('pageerror', e => console.log('PAGEERR C', String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await loginAs(C, base, uc); await sleep(1200); C.evaluate(() => clOpenShared('c1')).catch(() => {}); await sleep(3500);

await ea(() => { gotoObs('P1'); }); await ec(() => { gotoObs('P1'); }); await sleep(1500);
const info = async E => E(() => ({els: grElems('P1').length, rows: grRows('P1').map(r=>r.k), ta: document.querySelectorAll('#card-P1 textarea').length, pick: document.querySelectorAll('#card-P1 .gr-pick').length, kos: typeof KOS_OBS, fascia: FASCIA}));
console.log('A', JSON.stringify(await info(ea))); console.log('C', JSON.stringify(await info(ec)));
const foc = s => s + ' #card-P1 textarea.gr-focta';
// digitazione vera
await A.locator(foc('')).first().click(); await A.keyboard.type('Focus Anna', {delay:30}); await sleep(5000);
console.log('remote foc', JSON.stringify(db.t.pee_archivi.find(z=>z.id==='c1').data.scheda.griglia));
console.log('C vede', await ec(() => JSON.stringify({exp:[...document.querySelectorAll('.expanded')].map(e=>e.id), card: !!document.getElementById('card-P1'), v: (document.querySelector('#card-P1 textarea.gr-focta')||{}).value})));
console.log('DBG', await ec(()=>JSON.stringify({rows:grRows('P1').map(r=>r.k), occ:(scheda.pp||{}).occMan, box:[...document.querySelectorAll('#card-P1 .gr-box')].length, html:(document.querySelector('#card-P1 .gr-box')||{innerHTML:'none'}).innerHTML.slice(0,300), cls:document.getElementById('card-P1').className})));
await sleep(1500); { const r = await ec(() => ({ta: document.querySelectorAll('#card-P1 textarea.gr-focta').length, ro: (document.querySelector('#card-P1 .gr-focro') || {}).textContent || ''})); ok(r.ta === 0 && /Focus Anna/.test(r.ro), 'il collaboratore vede il focus già scritto ma non lo modifica (' + JSON.stringify(r) + ')'); }
console.log('remote foc 2', JSON.stringify(db.t.pee_archivi.find(z=>z.id==='c1').data.scheda.griglia));
console.log('A ora', await ea(() => document.querySelector('#card-P1 textarea.gr-focta').value), '| C ora', await ec(() => (document.querySelector('#card-P1 .gr-focro') || {}).textContent));
console.log('A griglia', await ea(()=>JSON.stringify(scheda.griglia)));
const pos = E => E.locator('#card-P1 .gr-f textarea').first();
await A.locator('#card-P1 .gr-f textarea').first().click(); await A.keyboard.type('Anna vede A', {delay:30}); await sleep(5000);
await C.locator('#card-P1 .gr-f textarea').first().click(); await C.keyboard.type('Carla vede C', {delay:30}); await sleep(6000);
const gA = await ea(() => JSON.stringify(scheda.griglia.P1['m:o1'])), gC = await ec(() => JSON.stringify(scheda.griglia.P1['m:o1']));
const rem = JSON.stringify(db.t.pee_archivi.find(z=>z.id==='c1').data.scheda.griglia.P1['m:o1']);
console.log('A', gA); console.log('C', gC); console.log('R', rem);
ok(/Anna vede A/.test(rem) && /Carla vede C/.test(rem) && /Focus Anna/.test(rem), 'sul server restano i testi di entrambi');
ok(gA === rem && gC === rem, 'le due pagine mostrano gli stessi dati');
ok(await ea(() => !!document.querySelector('#card-P1.expanded textarea')) && await ec(() => !!document.querySelector('#card-P1.expanded textarea')), 'la scheda resta aperta dopo gli aggiornamenti dell’altro');
const f = summary(); await br.close(); process.exit(f?1:0);
