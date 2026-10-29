import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, aid, d) => ({testo:t, link:'', lancio:'L ' + t, sviluppo:'S', conclusione:'C', vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'},
    priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0]}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', 'a1', '2026-11-08'), att('Gioco B', 'a2', '')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Gioco C', 'a3', '')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[]}],
    uscite:{u1:{id:'u1', cr:1, testo:'Uscita', modello:'giorno', ax:{data:'2026-11-08', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{m1:{k:'att', tipo:'att', pid:'P1', aid:'a1', g:1, f:['lsc','mat']}}, hid:{}, own:{}}}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => shPerc('P')); await sleep(1000);
let s = await ev(() => { document.getElementById('pc-card-0').classList.remove('closed'); return {html: !!document.querySelector('#pc-card-0 .att-obj'), n: document.querySelectorAll('#pc-card-0 .att-obj input[type=checkbox]').length, mv: !!document.querySelector('#pc-card-0 .att-obj select')}; });
ok(s.html && s.n >= 4 && s.mv, 'attività nel percorso: «Obiettivi e Indicatori di questa attività» e «Sposta in un altro percorso» (' + JSON.stringify(s) + ')');
// scelta di un obiettivo che il percorso non aveva
await ev(() => attObjTog(0, 0, 'o', 3, true)); await sleep(400);
s = await ev(() => { const per = getAllPercorsi()[0]; return {o: per.attivita[0].obj.o, ext: per.obiettiviExtra, prov: per.provO && per.provO[3], pri: scheda.priorita[0].obiettivi}; });
ok(s.o.includes(3) && s.ext.includes(3) && s.prov && s.prov.includes('a1') && s.pri.includes(3), 'un obiettivo nuovo entra nel percorso, con l’attività come fonte (' + JSON.stringify(s) + ')');
await ev(() => attObjTog(0, 0, 'o', 3, false)); await sleep(300);
s = await ev(() => { const per = getAllPercorsi()[0]; return {o: per.attivita[0].obj.o, ext: per.obiettiviExtra || [], pri: scheda.priorita[0].obiettivi}; });
ok(!s.o.includes(3) && !s.ext.includes(3) && !s.pri.includes(3) && s.pri.includes(0), 'togliendolo, esce dal percorso ma resta quello originale (' + JSON.stringify(s) + ')');
// un obiettivo già del percorso si può scegliere e togliere senza toccare il percorso
await ev(() => attObjTog(0, 0, 'o', 0, true)); await ev(() => attObjTog(0, 0, 'o', 0, false)); await sleep(200);
ok(await ev(() => scheda.priorita[0].obiettivi.includes(0)), 'togliere un obiettivo già del percorso non lo toglie al percorso');
// indicatori
await ev(() => attObjTog(0, 0, 'i', 2, true)); await sleep(200);
ok(await ev(() => getAllPercorsi()[0].attivita[0].obj.i.includes(2) && scheda.priorita[0].idr.includes(2)), 'Indicatore scelto: entra nel percorso');
// sposta
await ev(() => { window.confirm = () => true; attMove(0, 0, 1); }); await sleep(600);
s = await ev(() => { const L = getAllPercorsi(); return {a0: L[0].attivita.map(a => a.testo), a1: L[1].attivita.map(a => a.testo), moved: L[1].attivita.find(a => a.aid === 'a1'), blk: scheda.uscite.u1.prog.m1.pid, idr0: scheda.priorita[0].idr}; });
ok(s.a0.join() === 'Gioco B' && s.a1.join() === 'Gioco C,Gioco A', 'attività spostata nel nuovo percorso (' + s.a0 + ' | ' + s.a1 + ')');
ok(s.moved.lancio === 'L Gioco A' && s.moved.ax.data === '2026-11-08' && s.moved.obj.o.length === 0, 'testo e data restano, obiettivi azzerati');
ok(s.blk === 'C1', 'il blocco nell’uscita segue l’attività (pid ' + s.blk + ')');
ok(!s.idr0.includes(2) && s.idr0.includes(0), 'ciò che era arrivato solo da quell’attività esce dal vecchio percorso');
// nell'evento
await ev(() => shSrUsc('u1')); await sleep(1500);
ok(await ev(() => document.querySelector('.usc-fld[data-f="a:obj"]') !== null || /Obiettivi e Indicatori della programmazione/.test(document.body.textContent)), 'nell’evento, l’attività ha il campo Obiettivi e Indicatori');
process.exit(summary() ? 1 : 0);
