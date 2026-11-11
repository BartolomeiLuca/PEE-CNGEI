// Verifica 11/11 — un trascinamento fatto dopo una pausa (nessun clic o battitura negli ultimi 10 secondi) deve arrivare al cloud
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, k, aid) => Object.assign({testo:t, link:'', lancio:'', sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', aid}, {[k]:'testo ' + t});
const usc = (id, md, t, d) => ({id, cr:1, testo:t, modello:md, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:md === 'sede' ? {tipo:'sede'} : {}}, prog:{}, hid:{}, own:{}});
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0], tempistica:''}], pp:{},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', 'lancio', 'm0'), att('Gioco B', 'lancio', 'm1'), att('Gioco C', 'sviluppo', 'm2')]}],
    uscite:{u1:usc('u1', 'giorno', 'Uscita al parco', '2026-11-15'), u2:usc('u2', 'sede', 'Riunione di novembre', '2026-11-08')}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
await ev(() => shCal()); await sleep(800);
const cloudIn = () => { const d = db.t.pee_archivi.find(r => r.id === 'p1').data; try{ const a = d.scheda.percorsiExtra[0].attivita[0]; return (a.ax && a.ax.data) || ''; }catch(e){ return 'ERR'; } };
// una prima modifica normale (clic vero): deve arrivare al cloud
await P.locator('.cal-pool .cal-b >> nth=1 >> .cal-sel').click(); await P.keyboard.press('Escape'); await P.selectOption('.cal-pool .cal-b >> nth=1 >> .cal-sel', {label: 'Uscita · Uscita al parco'}); await sleep(4000);
ok((db.t.pee_archivi[0].data.scheda.percorsiExtra[0].attivita[1].ax || {}).data === '2026-11-15', 'modifica con la tendina: arrivata al cloud');
// pausa: la persona guarda il calendario senza toccare niente
await sleep(11500);
await P.dragAndDrop('.cal-pool .cal-b >> nth=0 >> .cal-bt', '.cal-c[data-u="u2"]'); await sleep(600);
const loc = await ev(() => (scheda.percorsiExtra[0].attivita[0].ax || {}).data);
ok(loc === '2026-11-08', 'trascinamento riuscito sullo schermo (' + loc + ')');
await sleep(6000);
const st = await ev(() => ({status: CL.status, pending: CL.pending, dirty: CL.ctx.dirty, up: (CL.ctx.upaths || []).length}));
ok(cloudIn() === '2026-11-08', 'il trascinamento è arrivato al cloud (nel cloud: «' + cloudIn() + '», stato mostrato: ' + JSON.stringify(st) + ')');
// la persona chiude e riapre da un altro dispositivo
const pb = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const Q = pb.page;
await loginAs(Q, base, u); await sleep(1200); await Q.evaluate(() => shOpen('p1', 0)); await sleep(3500);
const other = await Q.evaluate(() => (scheda.percorsiExtra[0].attivita[0].ax || {}).data || '');
ok(other === '2026-11-08', 'da un altro dispositivo l’attività è dove è stata trascinata (trovato: «' + other + '»)');
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 2).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
