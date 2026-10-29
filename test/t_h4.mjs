import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, aid, d) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
const us = (id, t, m, d, d2) => ({id, cr:1, testo:t, modello:m, ax:{data:d, durata:d2 ? 'piu' : 'giorno', dataFine:d2, pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'},
    priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:'', tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:'', tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1'}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', 'm0', ''), att('Gioco B', 'm1', '')]}],
    uscite:{u1:us('u1', 'Uscita al parco', 'giorno', '2026-11-15'), u2:us('u2', 'Riunione di ottobre', 'sede', '2026-10-09'), u3:us('u3', 'Campo invernale', 'campo', '2026-12-27', '2026-12-30'), u4:us('u4', 'Riunione senza data', 'sede', ''),
      u5:Object.assign(us('u5', 'Formazione staff', 'sede', '2026-11-20'), {dest:'staff', tipo:'Attività formativa'})}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => shCal()); await sleep(1000);
let s = await ev(() => ({mesi: [...document.querySelectorAll('.cal-mese h3')].map(h => h.textContent), righe: document.querySelectorAll('.cal-row').length, stf: document.querySelectorAll('.cal-row.cal-stf').length, org: document.querySelectorAll('.cal-org, .cal-b .cal-bt2[aria-expanded]').length, pool: document.querySelectorAll('.cal-pool .cal-b').length, orgBtn: [...document.querySelectorAll('#panel-pp button')].some(b => b.textContent.trim() === 'Organizza')}));
ok(JSON.stringify(s.mesi) === JSON.stringify(['Ottobre 2026', 'Novembre 2026', 'Dicembre 2026', 'Senza data']), 'home a elenco mese per mese in ordine di data, «Senza data» in fondo: ' + s.mesi.join(' | '));
ok(s.righe === 5 && s.stf === 1, 'cinque eventi, uno solo dello staff (colore diverso)');
ok(!s.orgBtn && s.pool === 2, 'nessun «Organizza» nella home; due attività in «Da collocare»');
ok(await ev(() => document.querySelector('.cal-row.cal-stf .cal-fo').textContent === 'Staff' && !!document.querySelector('.cal-leg')), 'etichette Unità/Staff e legenda dei colori');
// riunione: si apre
await ev(() => shSrUsc('u1')); await sleep(1500);
ok(await ev(() => typeof USC_CUR !== 'undefined' && USC_CUR === 'u1'), 'cliccando un evento si apre');
await ev(() => uscOpen(null)); await sleep(800);
ok(await ev(() => document.querySelectorAll('.cal-row').length === 5 && SH.ppv === 'cal'), 'tornando indietro si torna al calendario (non alla vecchia lista delle uscite)');
// elimina
await ev(() => { window.confirm = () => true; calDel('u4'); }); await sleep(600);
ok(await ev(() => document.querySelectorAll('.cal-row').length === 4 && !/Senza data/.test(document.getElementById('panel-pp').textContent)), 'si può eliminare un evento dalla home');
// nuovo evento dello staff
await ev(() => calNew('sede')); await sleep(300);
await P.check('input[name="cal-dest"][value="staff"]'); await sleep(300);
ok(await ev(() => [...document.querySelectorAll('#cal-tp option')].some(o => o.value === 'Riunione di staff')), 'per lo staff: tipi formativi (Attività formativa, Riunione di staff, …)');
await P.fill('#cal-nt', 'Riunione di staff di gennaio'); await P.fill('#cal-d1', '2027-01-12'); await P.selectOption('#cal-tp', 'Riunione di staff'); await P.click('.cal-new .sh-btn >> text=Crea'); await sleep(800);
s = await ev(() => { const U = Object.values(scheda.uscite).find(x => x.testo === 'Riunione di staff di gennaio'); return {dest: U && U.dest, tipo: U && U.tipo, rows: document.querySelectorAll('.cal-row.cal-stf').length, mesi: [...document.querySelectorAll('.cal-mese h3')].map(h => h.textContent)}; });
ok(s.dest === 'staff' && s.tipo === 'Riunione di staff' && s.rows === 2 && s.mesi.includes('Gennaio 2027'), 'evento dello staff creato, in gennaio, con il colore dello staff');
// attività educative non entrano negli eventi dello staff
await ev(() => { SH._calDrag = {i:0, j:0, from:''}; calDrop({preventDefault(){}}, 'u5'); }); await sleep(300);
ok(await ev(() => !(uscBlocks(scheda.uscite.u5) || []).some(o => o.m && o.m.k === 'att')), 'le attività educative non si collocano negli eventi dello staff');
// check dello staff in calendario
ok(await ev(() => !!document.querySelector('.cal-chks')), 'Check dello staff dentro il calendario');
await ev(() => { document.querySelector('.cal-chks').open = true; }); await P.click('.cal-chk .cal-bt2 >> nth=0'); await sleep(600);
ok(await ev(() => Object.values(scheda.uscite).some(x => x.chk && x.dest === 'staff')), '«Metti in calendario» crea l’evento dello staff del check');
// Lancio · Sviluppo · Conclusione
ok(await ev(() => USC_BT.nuova[2][0] === 'lsn' && USC_BT.gioco[2][0] === 'lsn' && USC_F.lsn === 'Lancio · Sviluppo · Conclusione'), 'una nuova attività ha Lancio · Sviluppo · Conclusione al posto di «Cosa si fa»');
// spese in Misurare
await ev(() => shGrp('Misurare')); await sleep(300);
ok(await ev(() => { const g = [...document.querySelectorAll('#sh-side .sh-sg, #sh-side .sh-si')].map(e => e.textContent.trim()); const i = g.indexOf('Misurare'); const r = g.indexOf('Realizzare'); return g.slice(i, i + 8).includes('Spese mese per mese') && !g.slice(r, i).includes('Spese mese per mese'); }), '«Spese mese per mese» ora sta in Misurare');
// Elenco dell'anno
await ev(() => shEle()); await sleep(1500);
s = await ev(() => ({stf: document.querySelectorAll('.ele-t tr.ele-s').length, uni: document.querySelectorAll('.ele-t tr.ele-u').length}));
ok(s.stf >= 2 && s.uni >= 3, 'Elenco dell’anno: righe Unità e staff con stili diversi (' + JSON.stringify(s) + ')');
await P.click('.ele-vw button >> text=Timeline'); await sleep(500);
s = await ev(() => ({lanes: document.querySelectorAll('#panel-pp .vis-wrap .vis-r:not(.vis-rh)').length, marks: document.querySelectorAll('#panel-pp .vis-wrap .vis-dot, #panel-pp .vis-wrap .vis-bar').length}));
ok(s.lanes === 2 && s.marks >= 5, 'vista timeline con le corsie Unità e Staff (' + JSON.stringify(s) + ')');
await P.selectOption('#ele-s', 'staff'); await sleep(300);
ok(await ev(() => document.querySelectorAll('.ele-t tr').length > 0 && document.querySelectorAll('.ele-t tbody tr.ele-u').length === 0), 'il filtro «Solo staff» funziona');
process.exit(summary() ? 1 : 0);
