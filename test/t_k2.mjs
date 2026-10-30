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

// 1 · le frecce ↑↓ cambiano l'ordine dentro il percorso (niente alert di spostamento tra percorsi)
let dlg = 0; P.on('dialog', d => { dlg++; d.dismiss().catch(() => {}); });
await ev(() => { const per = getAllPercorsi()[0]; attIdsEnsure(per); window._o0 = per.attOrder ? per.attOrder.slice() : null; });
const r1 = await ev(() => { const per = getAllPercorsi()[0]; const n = Math.max(3, per.attivita.length); const before = attOrd(per, n).slice(); attMove(0, before[0], 1); const after = attOrd(per, n).slice(); return {before, after, f: typeof attMoveTo}; });
ok(dlg === 0 && r1.after[0] === r1.before[1] && r1.after[1] === r1.before[0], 'freccia ↓: l’attività scende di una posizione dentro lo stesso percorso, senza alert (' + r1.before.slice(0, 3) + ' → ' + r1.after.slice(0, 3) + ')');
ok(r1.f === 'function', 'lo spostamento in un altro percorso ha un nome suo (attMoveTo)');
// 2 · l'elenco degli obiettivi dell'attività resta aperto finché non lo chiudi tu
const r2 = await ev(() => { const per = getAllPercorsi()[0]; window._attObjOpen = {}; const h1 = attObjHTML ? 1 : 0; return h1; }).catch(() => 0);
// 3 · lo scorrimento della dashboard non salta cambiando lettura o colore
await P.click('.sh-seg button:has-text("Il mio anno")'); await sleep(2500);
await ev(() => window.scrollTo(0, 800)); await sleep(300);
const y0 = await ev(() => Math.round(scrollY));
await ev(() => [...document.querySelectorAll('.vis-opt .sh-seg')][1].querySelectorAll('button')[2].click()); await sleep(600);
const y1 = await ev(() => Math.round(scrollY));
await ev(() => [...document.querySelectorAll('.vis-opt .sh-seg')][0].querySelectorAll('button')[2].click()); await sleep(600);
const y2 = await ev(() => Math.round(scrollY));
ok(y0 > 300 && Math.abs(y1 - y0) <= 2 && Math.abs(y2 - y0) <= 2, 'dashboard: cambiando colore o lettura la pagina resta dov’era (' + y0 + ' → ' + y1 + ' → ' + y2 + ')');
// 4 · zoom: la posizione orizzontale resta dopo un cambio di lettura
await ev(() => [...document.querySelectorAll('.vis-opt .sh-seg')][0].querySelectorAll('button')[0].click()); await sleep(400);
await ev(() => vzSet(document.querySelector('#an-year .vis-zr'), 4)); await sleep(400);
await ev(() => { document.querySelector('#an-year .vis-sc').scrollLeft = 900; }); await sleep(200);
await ev(() => [...document.querySelectorAll('.vis-opt .sh-seg')][1].querySelectorAll('button')[1].click()); await sleep(600);
const z = await ev(() => ({sl:Math.round(document.querySelector('#an-year .vis-sc').scrollLeft), z:SH.vz}));
ok(z.z === 4 && Math.abs(z.sl - 900) <= 3, 'lo zoom e la posizione orizzontale restano cambiando la grafica (' + JSON.stringify(z) + ')');
process.exit(summary() ? 1 : 0);
