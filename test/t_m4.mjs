// Blocco 1 (2 nov): titolare e collaboratore sullo stesso progetto
//  A1 il collaboratore resta nella pagina in cui sta quando il titolare salva
//  A6 «ha già visto l'invito» dopo che il collaboratore ha aperto il progetto (anche da «Continua qui»)
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
db.t.pee_membri.push({id:'m2', archivio_id:'c1', email:'dario@x.it', ruolo:'lettore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'}, {id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const memb = () => db.t.pee_membri.find(m => m.id === 'm1');


const pa = await person(br, db), pc = await person(br, db); const A = pa.page, C = pc.page, ea = (f, x) => A.evaluate(f, x), ec = (f, x) => C.evaluate(f, x);
for (const [pg, n] of [[A, 'A'], [C, 'C']]) pg.on('pageerror', e => console.log('PAGEERR', n, String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await ea(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(1500);
await ea(() => shCal()); await sleep(800); await ea(() => shSrUsc('r0')); await sleep(2500);
// la conduzione si sceglie dal menu: una persona, poi una seconda
const kB = await ea(() => Object.keys(uscCur().prog).find(k => uscCur().prog[k].t === 'Merenda dei ragazzi'));
await ea(k => { uscOpenBlk && 0; }, kB).catch(() => {});
await ea(k => { const el = document.getElementById('usc-b-' + k); if(el && !el.classList.contains('open')) { const h = el.querySelector('.usc-bh, summary, header'); if(h) h.click(); } }, kB); await sleep(500);
const sel = () => A.locator(`#usc-b-${kB} select.ax-pm-s`).nth(1);
ok(await sel().count() === 1, 'la conduzione ha il menu a più persone');
await sel().selectOption({label: 'Carla Neri (CU)'}); await sleep(800);
await sel().selectOption({label: 'Anna Verdi (CU)'}); await sleep(800);
const aff = await ea(k => uscCur().prog[k].aff, kB);
ok(/Carla Neri/.test(aff) && /Anna Verdi/.test(aff) && aff.includes('|'), 'conducono due persone: «' + aff + '»');
ok(await ea(k => document.querySelectorAll('#usc-b-' + k + ' .ax-pm-c').length, kB) === 2, 'due etichette con ×');
await A.locator(`#usc-b-${kB} .ax-pm-c button`).first().click(); await sleep(800);
ok(await ea(k => uscCur().prog[k].aff, kB) === 'Anna Verdi (CU)', 'togliendo la prima resta la seconda');
await ea(k => uscBlkSet(k, 'aff', 'Anna Verdi (CU)|Carla Neri (CU)', true), kB); await sleep(1500);
ok(await ea(() => affIsMe('Anna Verdi (CU)|Carla Neri (CU)')), 'chi è nel gruppo riconosce l’incarico come suo');
ok(await ea(() => affName('Anna Verdi (CU)|Carla Neri (CU)') === 'Anna Verdi, Carla Neri'), 'il nome mostrato elenca tutti: ' + await ea(() => affName('Anna Verdi (CU)|Carla Neri (CU)')));
// Carla riceve l'incarico in «Per te»
await loginAs(C, base, uc); await sleep(3500);
const rows = await ec(() => [...document.querySelectorAll('#sh-perte .cl-row .t')].map(e => e.textContent));
ok(rows.some(t => /Merenda dei ragazzi/.test(t)), 'Carla vede in «Per te» la merenda condotta anche da lei: ' + JSON.stringify(rows.map(t => t.slice(0, 80))));
// Piano B ha il suo referente
ok(await ea(() => AX_REF.some(r => r[0] === 'pb') && AX_REFG.pb === 'pb'), 'Piano B è tra i settori con referente');
const errs = pa.errors.concat(pc.errors); ok(!errs.length, 'nessun errore JS' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
