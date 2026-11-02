// Blocco 1 (2 nov): titolare e collaboratore sullo stesso progetto
//  A1 il collaboratore resta nella pagina in cui sta quando il titolare salva
//  A6 «ha già visto l'invito» dopo che il collaboratore ha aperto il progetto (anche da «Continua qui»)
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri');
for (const [u, n] of [[ua, 'Anna Verdi'], [uc, 'Carla Neri']]) db.t.pee_profili.push({user_id:u.id, nome:n, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const us = (id, t, d) => ({id, cr:1, testo:t, modello:'sede', ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'},
    uscite:{r0:us('r0', 'Prima riunione', '2026-11-07')}, priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')],
    pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}]},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-11-07')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Cerchio', '2026-11-14')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', '2026-11-28')]}]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const memb = () => db.t.pee_membri.find(m => m.id === 'm1');
const pa = await person(br, db), pc = await person(br, db);
const A = pa.page, C = pc.page, ea = (f, x) => A.evaluate(f, x), ec = (f, x) => C.evaluate(f, x);
C.on('pageerror', e => console.log('PAGEERR C', String(e).slice(0, 300))); A.on('pageerror', e => console.log('PAGEERR A', String(e).slice(0, 300)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await ea(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2000);
await loginAs(C, base, uc); await sleep(1500);
ok(memb().visto_il === null, 'invito: all’inizio non visto');
// Carla apre il progetto condiviso dalla pagina «I tuoi progetti» (come fa chi riceve l'invito) …
await ec(() => { try{ shOpen('c1', true); }catch(e){} }); await sleep(3500);
ok(await ec(() => !!(CL.ctx && CL.ctx.id === 'c1')), 'Carla ha aperto il progetto condiviso (' + await ec(() => CL.ctx && CL.ctx.ruolo) + ')');
ok(memb().visto_il !== null, 'A6: dopo l’apertura l’invito risulta visto');
// … poi esce e rientra con «Continua qui» (progetto già nel contesto): deve restare visto, e se resettato deve tornare visto
memb().visto_il = null;
await ec(() => { try{ shGoHome(); }catch(e){} }); await sleep(800);
await ec(() => { try{ shOpen('c1', true); }catch(e){} }); await sleep(2500);
ok(memb().visto_il !== null, 'A6: anche riaprendo con «Continua qui» (progetto già aperto) l’invito risulta visto');
// A1 — Carla va sul Calendario
const where = () => ec(() => ({ph: [1, 2, 3, 4].find(i => document.getElementById('panel' + i)?.classList.contains('active')) || 0, pp: document.getElementById('panel-pp')?.classList.contains('active') ? 'pp' : '', dash: document.getElementById('panel-dash')?.classList.contains('active') ? 'dash' : '',
  h: (document.querySelector('.panel.active h1, #panel-pp h1, .sh-wrap h1') || {}).textContent || '', step: typeof schedaStep !== 'undefined' ? schedaStep : '', gcur: gCur()}));
await ec(() => shCal()); await sleep(1500);
const w0 = await where(); console.log('  Carla sul calendario:', JSON.stringify(w0));
// Anna salva una modifica (testo in una attività) → arriva a Carla
for (let r = 0; r < 3; r++) {
  await ea(r => { const a = scheda.percorsiExtra[0].attivita[0]; a.lancio = 'Lancio modificato da Anna ' + r; saveData(true); }, r); await sleep(500);
  await ea(() => clPush(true)).catch(() => {}); await sleep(3500);
  const w1 = await where();
  ok(JSON.stringify(w1) === JSON.stringify(w0), `A1: dopo il salvataggio ${r + 1} di Anna, Carla è ancora nella stessa pagina ${JSON.stringify(w1)}`);
}
ok(await ec(() => /Lancio modificato da Anna 2/.test(JSON.stringify(scheda.percorsiExtra[0].attivita[0]))), 'la modifica di Anna è arrivata a Carla');
// stesso controllo da altre pagine (osservazione spirituale, dashboard)
for (const [nome, fn] of [['dashboard', () => shDash()], ['calendario', () => shCal()]]) {
  await ec(fn); await sleep(1200); const wa = await where();
  await ea(() => { scheda.percorsiExtra[2].attivita[0].lancio = 'altro ' + Date.now(); saveData(true); }); await sleep(500); await ea(() => clPush(true)).catch(() => {}); await sleep(3500);
  ok(JSON.stringify(await where()) === JSON.stringify(wa), `A1: Carla resta su «${nome}» dopo un salvataggio di Anna`);
}
ok(!pa.errors.length && !pc.errors.length, 'nessun errore JS' + ((pa.errors.concat(pc.errors)).length ? ': ' + pa.errors.concat(pc.errors).slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
