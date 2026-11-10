// Blocco 1 (2 nov): titolare e collaboratore sullo stesso progetto
//  A1 il collaboratore resta nella pagina in cui sta quando il titolare salva
//  A6 «ha già visto l'invito» dopo che il collaboratore ha aperto il progetto (anche da «Continua qui»)
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
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
db.t.pee_membri.push({id:'m2', archivio_id:'c1', email:'dario@x.it', ruolo:'lettore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'}, {id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const memb = () => db.t.pee_membri.find(m => m.id === 'm1');

const P = {};
for (const [k, u] of [['carla', uc], ['dario', ud], ['anna', ua]]) { P[k] = await person(br, db); P[k].page.on('pageerror', e => console.log('PAGEERR', k, String(e).slice(0, 200))); await loginAs(P[k].page, base, u); await sleep(1500); }
const txt = (k) => P[k].page.evaluate(() => (document.querySelector('.panel.active') || document.body).textContent);
for (const k of ['carla', 'dario']) {
  const e = (f, x) => P[k].page.evaluate(f, x);
  await e(() => { try{ shOpen('c1', true); }catch(err){} }); await sleep(3500);
  await e(() => shCal()); await sleep(1200);
  const btn = await e(() => [...document.querySelectorAll('#panel-pp .cal-ra .cal-bt2, #panel-pp .cal-add button')].map(b => b.textContent.trim()));
  ok(!btn.some(t => /Duplica|Elimina|\+ /.test(t)), k + ': nel calendario niente Duplica / Elimina / + nuovo evento (' + btn.join(',') + ')');
  ok(btn.filter(t => t === 'Apri').length === 2, k + ': vede entrambi gli eventi con «Apri» (unità e staff)');
  await e(() => shSrUsc('r0')); await sleep(2500);
  let t = await txt(k);
  ok(/Merenda dei ragazzi/.test(t), k + ': apre la riunione dell’Unità e ne legge il programma');
  await e(() => shCal()); await sleep(800);
  await e(() => shSrUsc('s1')); await sleep(2500);
  t = await txt(k);
  ok(/Bivacco di staff/.test(t) && !/Segreto del programma/.test(t), k + ': nell’uscita di staff non vede la scaletta degli altri');
  ok(k === 'carla' ? /Momento di Carla/.test(t) : !/Momento di Carla/.test(t), k + ': ' + (k === 'carla' ? 'vede il momento che le è affidato' : 'il lettore non vede momenti altrui'));
}
{ const e = (f, x) => P.anna.page.evaluate(f, x);
  await e(() => { shOpen('c1', 0); }); await sleep(3500);
  await e(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(1500);
  await e(() => shCal()); await sleep(800); await e(() => shSrUsc('s1')); await sleep(2500);
  const t = await txt('anna');
  ok(/Segreto del programma/.test(t) && /Momento di Carla/.test(t), 'titolare: vede tutto il programma di staff');
  ok(/Programma riservato allo staff di conduzione/.test(t), 'titolare: ha l’interruttore «Programma riservato…»');
}
const errs = Object.values(P).flatMap(p => p.errors); ok(!errs.length, 'nessun errore JS' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
