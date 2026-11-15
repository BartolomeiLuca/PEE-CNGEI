import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const D_ = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); const FUT1 = D_(10), FUT2 = D_(40), FUT3 = D_(90);
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, aid, d, l) => ({testo:t, link:'', lancio:l || '', sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
const us = (id, t, m, d, dest) => Object.assign({id, cr:1, testo:t, modello:m, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}, dest ? {dest} : {});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'P', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'K', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{}, priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tDal:'2026-10', tAl:'2027-02'}, {ambito:'C', necessita:'n', percorso:'C1'}, {ambito:'S', necessita:'n', percorso:'S1'}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Futura', 'a1', FUT2), att('', 'a2', '', 'Solo il lancio scritto'), att('Passata', 'a3', '2026-10-02')]}],
    uscite:{u1:us('u1', 'Uscita futura', 'giorno', FUT1), u2:us('u2', 'Riunione senza data', 'sede', ''), u3:us('u3', 'Staff', 'sede', FUT3, 'staff'), u4:us('u4', 'Passata', 'sede', '2026-09-20')}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => shDash()); await sleep(1500);
const s = await ev(() => { const d = document.getElementById('panel-dash'); const pr = [...d.querySelectorAll('.sh-card2')].find(c => /Prossime attività/.test(c.textContent)); return {pr: pr ? pr.textContent : '', ev: d.querySelectorAll('.vis-ev').length, evStf: d.querySelectorAll('.vis-ev.stf').length}; });
ok(/Futura/.test(s.pr) && /Uscita futura/.test(s.pr) && /Staff/.test(s.pr), 'Prossime: attività e uscite future, anche dello staff');
ok(/Attività 2/.test(s.pr) || /Solo il lancio/.test(s.pr) || /senza data/.test(s.pr), 'attività con solo il lancio scritto: non sparisce');
ok(/2 attività o eventi senza data/.test(s.pr) && /già passati/.test(s.pr), 'conteggio di quelle senza data e già passate, con i link (' + s.pr.slice(-190) + ')');
ok(s.ev === 3 && s.evStf === 1, 'colpo d’occhio: riunioni e uscite sulla linea (' + s.ev + ', staff ' + s.evStf + ')');
process.exit(summary() ? 1 : 0);
