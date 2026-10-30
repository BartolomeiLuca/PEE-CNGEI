import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
let _n = 0; const att = (t, d, done) => ({aid:'z' + (++_n), testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:done ? 'bene' : '', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const us = (id, t, m, d, dest) => Object.assign({id, cr:1, testo:t, modello:m, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}, dest ? {dest} : {});
const row = (id, titolo, data, ts) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto'}, data), created_at:ts, updated_at:ts});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
const U = {}; ['2026-10-06','2026-10-13','2026-10-20','2026-10-27','2026-11-03','2026-11-10','2026-11-17','2026-11-24'].forEach((d,i)=>U['r'+i]=us('r'+i,'Riunione '+(i+1),'sede',d));
U.s1 = us('s1','Uscita','giorno','2026-11-15'); U.s1.prog = {b1:{k:'att', aid:'z4', pid:'P1', g:1, ord:1, dur:60}}; U.b1 = us('b1','Bivacco','bivacco','2026-12-06'); U.st1 = us('st1','Staff','sede','2026-11-19','staff'); U.c1 = us('c1','Campo','campo','2027-07-12'); U.s2 = us('s2','Uscita 2','giorno','2027-02-20');
db.t.pee_archivi.push(row('c1', 'Programmazione Annuale 2026-27 · Reparto', {obs:{P1:4, P2:6, C1:3}, pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'}, riobs:{P1:7}, uscite:U,
  priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')], pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}]},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-10-03', true), att('Gioco B', '2026-10-17', true), att('Gioco C', '2026-10-24', false), att('Gioco D', '2026-11-14', false), att('Gioco E', '2026-12-05', false), att('Senza data', '', false)]},
  {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Cerchio', '2026-10-10', true), att('Patto', '2026-11-07', false), att('Verifica', '2026-12-12', false)]},
  {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', '2026-11-28', false), att('Silenzio', '2026-12-04', false)]}]}}, '2026-10-20T10:00:00Z'));
db.t.pee_archivi.push(row('c2', 'Programmazione Annuale 2026-27 · Reparto · II trimestre', {pris:{P2:true, C2:true, S2:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'II trimestre', dal:'2027-01', al:'2027-03'}, cicloDa:'c1', uscite:{v1:us('v1','Riunione gennaio','sede','2027-01-20'), v2:us('v2','Uscita febbraio','giorno','2027-02-20')},
  priorita:[pri('P', 'P2', '2027-01', '2027-03'), pri('C', 'C2', '2027-01', '2027-03'), pri('S', 'S2', '2027-02', '2027-03')], pp:{sezione:'Pesaro', gruppo:'1'},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P2', ambito:'P', attivita:[att('Caccia al tesoro', '2027-01-18', false), att('Giro', '2027-02-13', false)]}]}}, '2026-10-21T10:00:00Z'));
await loginAs(P, base, u); await sleep(1200); P.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(2500);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(3000);


const c2 = () => db.t.pee_archivi.find(x => x.id === 'c2').data.scheda;
const v0 = db.t.pee_versioni.length;
// 1 · Calendario: tutto l'anno
await ev(() => { SH.calScope = 'anno'; SH._ay = null; shCal(); }); await sleep(3500);
let r = await ev(() => ({rows:document.querySelectorAll('#panel-pp .cal-row').length, fx:document.querySelectorAll('#panel-pp .cal-row.cal-fx').length, cyb:document.querySelectorAll('#panel-pp .cal-row .cal-cyb').length, pool:document.querySelectorAll('#panel-pp .cal-pool .cal-b').length, bx:document.querySelectorAll('#panel-pp .cal-pool .cal-bx').length}));
ok(r.rows === 15 && r.fx === 2 && r.cyb === 15, 'Tutto l’anno: gli eventi dei due cicli insieme, ognuno col suo ciclo (' + JSON.stringify(r) + ')');
ok(r.bx === 2, 'in «Da collocare» ci sono anche le attività dell’altro ciclo (' + r.bx + ')');
const pill = await ev(() => { const B = [...document.querySelectorAll('#panel-pp .cal-pool .cal-b')]; return {n:B.length, all:B.every(b => b.querySelector('.cal-cyt .cal-cyb') && b.firstElementChild.classList.contains('cal-cyt')), names:[...new Set(B.map(b => b.querySelector('.cal-cyb').textContent))]}; });
ok(pill.all && pill.names.length === 2, 'ogni attività da collocare porta in alto la pastiglia del suo ciclo (' + pill.names.join(' | ') + ')');
await ev(() => calScopeSet('ciclo')); await sleep(500);
r = await ev(() => ({rows:document.querySelectorAll('#panel-pp .cal-row').length, bx:document.querySelectorAll('#panel-pp .cal-pool .cal-bx').length}));
ok(r.rows === 13 && r.bx === 0, '«Questo ciclo»: solo gli eventi del ciclo aperto (' + JSON.stringify(r) + ')');
await ev(() => calScopeSet('anno')); await sleep(3000);
// 2 · crea un evento: finisce nel ciclo che contiene la data
await ev(() => calNew('sede')); await sleep(300);
await ev(() => { document.getElementById('cal-nt').value = 'Riunione febbraio'; document.getElementById('cal-d1').value = '2027-02-05'; calMake(); }); await sleep(3500);
ok(Object.values(c2().uscite).some(u => u.testo === 'Riunione febbraio' && u.ax.data === '2027-02-05'), 'evento con la data di febbraio: creato nel ciclo che lo contiene (II trimestre)');
ok(!(await ev(() => Object.values(scheda.uscite).some(u => u.testo === 'Riunione febbraio'))), '…e non nel ciclo aperto');
// 3 · duplica ed elimina un evento dell'altro ciclo
await ev(() => calDupX('c2', 'v1')); await sleep(2500);
ok(Object.values(c2().uscite).some(u => /Riunione gennaio \(copia\)/.test(u.testo) && u.ax.data === '2027-01-27'), 'duplica un evento dell’altro ciclo: una settimana dopo');
await P.evaluate(() => { window.confirm = () => true; });
const dupId = Object.values(c2().uscite).find(u => /\(copia\)/.test(u.testo)).id;
await ev((id) => calDelX('c2', id), dupId); await sleep(2500);
ok(c2().uscite[dupId].del === true, 'elimina un evento dell’altro ciclo');
ok(db.t.pee_versioni.length > v0, 'prima di ogni scrittura su un altro ciclo c’è una copia di sicurezza (' + (db.t.pee_versioni.length - v0) + ')');
// 4 · attività del ciclo aperto → evento dell'altro ciclo
const jc = await ev(() => getAllPercorsi()[0].attivita.findIndex(a => a.testo === 'Gioco C'));
await ev((j) => calMoveX({cy:'', i:0, j}, 'v1', 'c2'), jc); await sleep(3500);
const PP = c2().percorsiExtra.find(q => q.percorsoId === 'P1'); const gc = PP && PP.attivita.find(a => a.testo === 'Gioco C');
ok(gc && gc.ax.data === '2027-01-20' && Object.values(c2().uscite.v1.prog).some(m => m.k === 'att' && m.aid === gc.aid && m.pid === 'P1' && !m.del), 'attività del ciclo aperto → evento dell’altro ciclo: arriva, con la data dell’evento, dentro l’evento');
ok(!(await ev(() => getAllPercorsi()[0].attivita.some(a => a.testo === 'Gioco C'))), '…e qui non c’è più');
// 5 · attività dell'altro ciclo → evento del ciclo aperto
const caccia = c2().percorsiExtra.find(q => q.percorsoId === 'P2').attivita.find(a => a.testo === 'Caccia al tesoro');
await ev((aid) => calMoveX({cy:'c2', pid:'P2', aid}, 's1', ''), caccia.aid); await sleep(3500);
const inCur = await ev(() => { const x = getAllPercorsi().find(q => q.percorsoId === 'P2'); const a = x && x.attivita.find(z => z.testo === 'Caccia al tesoro'); return a ? {d:a.ax.data, placed:Object.values(scheda.uscite.s1.prog).some(m => m.k === 'att' && m.aid === a.aid && !m.del)} : null; });
ok(inCur && inCur.d === '2026-11-15' && inCur.placed, 'attività dell’altro ciclo → evento del ciclo aperto (' + JSON.stringify(inCur) + ')');
ok(!c2().percorsiExtra.find(q => q.percorsoId === 'P2').attivita.some(a => a.testo === 'Caccia al tesoro'), '…e nell’altro ciclo non c’è più');
// 6 · attività e evento nello stesso altro ciclo
const giro = c2().percorsiExtra.find(q => q.percorsoId === 'P2').attivita.find(a => a.testo === 'Giro');
await ev((aid) => calMoveX({cy:'c2', pid:'P2', aid}, 'v2', 'c2'), giro.aid); await sleep(3000);
const gi = c2().percorsiExtra.find(q => q.percorsoId === 'P2').attivita.find(a => a.testo === 'Giro');
ok(gi && gi.ax.data === '2027-02-20' && Object.values(c2().uscite.v2.prog).some(m => m.aid === giro.aid && !m.del), 'attività e evento dello stesso altro ciclo: resta lì e va nell’evento, senza doppioni');
// 7 · apri un evento di un altro ciclo: si apre direttamente
await ev(() => calOpenCy('c2', 'v1')); await sleep(5500);
const op = await ev(() => ({ctx:CL.ctx && CL.ctx.id, usc:(typeof USC_CUR !== 'undefined') ? USC_CUR : null}));
ok(op.ctx === 'c2' && op.usc === 'v1', 'un clic su un evento di un altro ciclo lo apre (' + JSON.stringify(op) + ')');
// 8 · cambio ciclo: sempre Dashboard, in cima
await ev(() => shCal()); await sleep(1500); await ev(() => window.scrollTo(0, 300));
await ev(() => shGoCycle('c1')); await sleep(6000);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbLater(); }); await sleep(2500);
const ld = await ev(() => ({ctx:CL.ctx && CL.ctx.id, dash:document.getElementById('panel-dash').classList.contains('active'), y:Math.round(scrollY)}));
ok(ld.ctx === 'c1' && ld.dash && ld.y === 0, 'cambio ciclo: Dashboard, in cima (' + JSON.stringify(ld) + ')');
process.exit(summary() ? 1 : 0);
