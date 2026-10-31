import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:700}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d, done) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:done ? 'bene' : '', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const us = (id, t, m, d, dest) => Object.assign({id, cr:1, testo:t, modello:m, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}, dest ? {dest} : {});
const row = (id, titolo, data, ts) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto'}, data), created_at:ts, updated_at:ts});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
const U = {}; ['2026-10-06','2026-10-13','2026-10-20','2026-10-27','2026-11-03','2026-11-10','2026-11-17','2026-11-24'].forEach((d,i)=>U['r'+i]=us('r'+i,'Riunione '+(i+1),'sede',d));
U.s1 = us('s1','Uscita','giorno','2026-11-15'); U.b1 = us('b1','Bivacco','bivacco','2026-12-06'); U.st1 = us('st1','Staff','sede','2026-11-19','staff'); U.c1 = us('c1','Campo','campo','2027-07-12'); U.s2 = us('s2','Uscita 2','giorno','2027-02-20');
db.t.pee_archivi.push(row('c1', 'Programmazione Annuale 2026-27 · Reparto', {obs:{P1:4, P2:6, C1:3}, pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'}, riobs:{P1:7}, uscite:U,
  priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')], pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}]},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-10-03', true), att('Gioco B', '2026-10-17', true), att('Gioco C', '2026-10-24', false), att('Gioco D', '2026-11-14', false), att('Gioco E', '2026-12-05', false), att('Senza data', '', false)]},
  {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Cerchio', '2026-10-10', true), att('Patto', '2026-11-07', false), att('Verifica', '2026-12-12', false)]},
  {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', '2026-11-28', false), att('Silenzio', '2026-12-04', false)]}]}}, '2026-10-20T10:00:00Z'));
db.t.pee_archivi.push(row('c2', 'Programmazione Annuale 2026-27 · Reparto · II trimestre', {pris:{P2:true, C2:true, S2:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'II trimestre', dal:'2027-01', al:'2027-03'}, cicloDa:'c1',
  priorita:[pri('P', 'P2', '2027-01', '2027-03'), pri('C', 'C2', '2027-01', '2027-03'), pri('S', 'S2', '2027-02', '2027-03')], pp:{sezione:'Pesaro', gruppo:'1'},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P2', ambito:'P', attivita:[att('Caccia al tesoro', '2027-01-18', false), att('Giro', '2027-02-13', false)]}]}}, '2026-10-21T10:00:00Z'));
await loginAs(P, base, u); await sleep(1200); P.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(2500);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(3000);

await P.setViewportSize({width:1280, height:800});
await ev(() => { getAllPercorsi().forEach(p => { try{ attIdsEnsure(p); }catch(e){} }); const a = getAllPercorsi()[0].attivita[0]; a.obj = {o:[], i:[0]}; a.ax = a.ax || {}; a.ax.oss = {0:{on:true, chi:'', comp:'sceglie in autonomia'}}; saveData(true); });
// Word della singola attività
const dl = P.waitForEvent('download', {timeout:25000}).catch(() => null);
await ev(() => axDocx(0, 0)); const d = await dl;
ok(!!d, 'scheda Word della singola attività scaricata');
if(d){ const path = await d.path(); const { execSync } = await import('node:child_process'); const txt = execSync('cd /tmp && rm -rf dx && mkdir dx && cd dx && unzip -q -o ' + path + ' && cat word/document.xml | sed -e "s/<[^>]*>/ /g"', {maxBuffer:50e6}).toString();
  ok(/Percorso, obiettivo e indicatori/.test(txt), 'Word: sezione «Percorso, obiettivo e indicatori»');
  ok(/Obiettivo 1/.test(txt) && /P1/.test(txt), 'Word: obiettivo e percorso scritti');
  ok(/sceglie in autonomia/.test(txt), 'Word: «Cosa osservo» con il comportamento'); }
// uscita: Word con attività dalla programmazione
await ev(() => calMoveX({cy:'', i:0, j:0, from:''}, 's1', '')); await sleep(1200);
await ev(() => shSrUsc('s1')); await sleep(1200);
const dl2 = P.waitForEvent('download', {timeout:25000}).catch(() => null);
await ev(() => uscExport('tutto')); const d2 = await dl2;
ok(!!d2, 'Word dell’uscita scaricato');
if(d2){ const path = await d2.path(); const { execSync } = await import('node:child_process'); const txt = execSync('cd /tmp && rm -rf dy && mkdir dy && cd dy && unzip -q -o ' + path + ' && cat word/document.xml | sed -e "s/<[^>]*>/ /g"', {maxBuffer:50e6}).toString();
  ok(/Obiettivo 1/.test(txt) && /Indicatori su cui insiste/.test(txt), 'Word uscita: l’attività dei percorsi riporta obiettivo e indicatori'); ok(/Chi osserva cosa/.test(txt), 'Word uscita: «Chi osserva cosa»'); }
// riepilogo obiettivi si aggiorna da solo
await ev(() => { scheda.priorita[1].obiettivi = []; scheda.priorita[1].idr = []; shSec('2'); }); await sleep(1500);
const before = await ev(() => (document.getElementById('ob-rc-1') || {}).textContent || '');
ok(/da scegliere/.test(before), 'riepilogo priorità 2: «da scegliere» (' + before.slice(0, 60) + ')');
await ev(() => { const d = document.querySelectorAll('details.u-ob')[1]; d.open = true; const c = d.querySelector('input[type=checkbox]'); c.click(); }); await sleep(500);
const after = await ev(() => (document.getElementById('ob-rc-1') || {}).textContent || '');
ok(/Obiettivo 1/.test(after) && !/Obiettivo da scegliere/.test(after), 'scelto l’obiettivo, il riepilogo cambia subito (' + after.slice(0, 70) + ')');
// aspetto del pannello attività nel calendario
await ev(() => { shCal(); }); await sleep(2500);
await ev(() => { window._calOpen['0-0'] = true; calOrg(0, 0); calOrg(0, 0); }); await sleep(800);
await P.screenshot({path:'/tmp/l2_cal.png', fullPage:false});
process.exit(summary() ? 1 : 0);
