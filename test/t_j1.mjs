import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const mk = (id, titolo, meta, scheda, extra = {}) => db.t.pee_archivi.push({id, user_id:u.id, anno:2026, titolo, meta, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, scheda}, extra), created_at:'2026-10-20T10:00:00Z', updated_at: id==='c1' ? '2026-10-22T10:00:00Z' : '2026-10-26T10:00:00Z'});
const base_ = {tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'}};
// due cicli dello stesso anno: il primo senza nome di ciclo, il secondo «Ciclo 2»
mk('c1', 'Programmazione Annuale 2026-27', {mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1', ciclo:true}, Object.assign({}, base_, {ciclo:{nome:'Ciclo 1', dal:'2026-09', al:'2026-12'}, riobs:{P6:7}}), {obs:{P6:4, C2:5}, pris:{P6:true, C2:true}});
mk('c2', 'Programmazione Annuale 2026-27 · Ciclo 2', {mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1', ciclo:true, cn:'Ciclo 2', cdal:'2027-01', cal:'2027-04'}, Object.assign({}, base_, {ciclo:{nome:'Ciclo 2', dal:'2027-01', al:'2027-04'}, priorita:[{tDal:'2027-01', tAl:'2027-06', obiettivi:[], idr:[]}], percorsiExtra:[{percorsoId:'P4', prioritaIdx:0, tDal:'2027-01', tAl:'2027-06', attivita:[]}]}), {pris:{P4:true}});
mk('p1', 'Progetto Personale 2026-27', {mode:'giovani', fascia:'E', tipo:'PP', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1'}, Object.assign({}, base_, {tipoProgetto:'PP'}));
await loginAs(P, base, u); await sleep(1500);


P.on('dialog', d => { (globalThis.__dlg = globalThis.__dlg || []).push(d.message()); d.accept().catch(() => {}); });
// ── 5. percorso oltre la fine del ciclo: avviso + «Allunga il ciclo»
await ev(() => shOpen('c2', 0)); await sleep(3500);
const w = await ev(() => { const x = tmWarn('2027-01', '2027-06', true); return {x, btn: tmCicloBtn('2027-06'), fine: cicloFine()}; });
ok(/finisce dopo la fine del ciclo/.test(w.x) && /Allunga il ciclo fino a/.test(w.btn) && w.fine === '2027-04', 'avviso «finisce dopo la fine del ciclo» con pulsante (' + w.x.slice(0, 60) + ')');
ok(await ev(() => tmWarn('2027-01', '2027-04', true) === '' && tmCicloBtn('2027-04') === ''), 'nessun avviso se il percorso finisce nel ciclo');
await ev(() => shVis()); await sleep(900);
ok(await ev(() => /Allunga il ciclo/.test(document.body.innerText)), 'Visione d’insieme: pulsante «Allunga il ciclo»');
await ev(() => cicloAllunga('2027-06')); await sleep(1500);
ok(await ev(() => scheda.ciclo.al === '2027-06'), 'dopo la conferma il ciclo finisce a giugno (' + (await ev(() => scheda.ciclo.al)) + ')');
ok((globalThis.__dlg || []).some(m => /Allungo il ciclo/.test(m)), 'ha chiesto conferma prima di allungare');
// eventi fuori ciclo più tenui
const fu = await ev(() => { scheda.ciclo.al = '2027-04'; scheda.uscite = scheda.uscite || {}; scheda.uscite.ux = {id:'ux', testo:'Riunione', modello:'giorno', ax:{data:'2026-10-31', durata:'giorno'}, prog:{}, hid:{}, own:{}}; scheda.uscite.uy = {id:'uy', testo:'Riunione 2', modello:'giorno', ax:{data:'2027-02-10', durata:'giorno'}, prog:{}, hid:{}, own:{}}; SH.dscope = 'ciclo'; shDash(); return {fuori: document.querySelectorAll('.vis-ev.fuori').length, tot: document.querySelectorAll('.vis-ev').length}; });
await sleep(600);
ok(fu.fuori === 1 && fu.tot >= 2, 'in «Il mio ciclo» solo l’evento fuori periodo è tenue (' + JSON.stringify(fu) + ')');

// ── 1. nuovo ciclo da c1: porta focus e livelli del ciclo che finisce
await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => { SH.dscope = 'anno'; SH._ay = null; shDash(); }); await sleep(1500);
await ev(() => ncOpen()); await sleep(400);
await ev(() => { document.getElementById('nc-n').value = 'Ciclo 3'; document.getElementById('nc-d').value = '2027-05'; document.getElementById('nc-a').value = '2027-07'; });
await ev(() => ncMake()); await sleep(4500);
const nc = await ev(() => ({pris: Object.keys(pris).filter(k => pris[k]).sort(), ered: scheda.ered && scheda.ered.liv, nome: (scheda.ciclo || {}).nome, obsP6: obs.P6}));
ok(nc.nome === 'Ciclo 3' && nc.pris.join() === 'C2,P6', 'il nuovo ciclo porta i percorsi in evidenza (' + nc.pris.join() + ')');
ok(nc.ered && nc.ered.P6 && nc.ered.P6.a === 4 && nc.ered.P6.b === 7 && nc.obsP6 === 7, 'ricorda i livelli del ciclo 1 (4 → 7) e parte dalla rilettura (' + JSON.stringify(nc.ered && nc.ered.P6) + ')');
await ev(() => shSub('1d', '')); await sleep(900);
const tags = await ev(() => document.querySelectorAll('.pi-ered').length);
ok(tags === 2, 'nella lista delle priorità i due percorsi hanno «dal Ciclo 1» (' + tags + ')');
await ev(() => shSub('1b', 'P')); await sleep(900);
ok(await ev(() => /dal Ciclo 1: 4 → 7/.test(document.body.innerText)), 'accanto al livello compare «dal Ciclo 1: 4 → 7»');

// ── 2. PP → Programmazione: finestra «Cosa porto?»
db.t.pee_archivi.find(r => r.id === 'p1').data.obs = {P6:6};
db.t.pee_archivi.find(r => r.id === 'p1').data.scheda.percorsiExtra = [{percorsoId:'P6', attivita:[{testo:'Caccia al tesoro', lancio:'x', sviluppo:'y', conclusione:'z'}]}];
db.t.pee_archivi.find(r => r.id === 'p1').data.scheda.pp = {sezione:'Pesaro', gruppo:'1', ctxTerr:'Quartiere vivace'};
db.t.pee_archivi.push({id:'c9', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Nuova', meta:{mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'}}}, ts:Date.now()});
await ev(() => { SH.rows = null; shGoHome(); }); await sleep(1500);
P.evaluate(() => clOpenProject('c9')).catch(() => {}); await sleep(2500);
const ask = await ev(() => { const m = document.querySelector('#g-modal.show .ppb-ask'); return m ? [...m.querySelectorAll('.ppb-c')].map(c => c.getAttribute('data-g') + '=' + c.checked) : null; });
ok(ask && ask.some(x => /osservazione dei percorsi=false/.test(x)) && ask.some(x => /percorsi e attività=true/.test(x)), 'compare «Cosa porto?» con le osservazioni spente (' + (ask || []).join(' | ') + ')');
await ev(() => _ppbGo()); await sleep(4500);
const br2 = await ev(() => ({obsP6: obs.P6, att: ((scheda.percorsiExtra || [])[0] || {}).attivita, ctx: (scheda.pp || {}).ctxTerr}));
ok(br2.obsP6 !== 6 && br2.att && br2.att[0] && br2.att[0].dalPP === true && br2.ctx === 'Quartiere vivace', 'porta contesto e attività (bozza «dal PP»), non le osservazioni (' + JSON.stringify(br2).slice(0, 120) + ')');
await ev(() => shOpen('c9', 0)).catch(() => {}); await sleep(500);

// ── 6. «Gestione condivisa con lo staff» non compare nel PP
const sh = await ev(() => { const keep = scheda.tipoProgetto; scheda.tipoProgetto = 'PP'; const a = attShareHTML(0, 0, {condivisa:true}); scheda.tipoProgetto = 'AN'; const b = attShareHTML(0, 0, {condivisa:true}); scheda.tipoProgetto = keep; return {pp: a, an: b.length}; });
ok(sh.pp === '' && sh.an > 0, 'nel PP niente «Gestione condivisa con lo staff», nella Programmazione sì');

// ── 4. attività dello staff: percorsi dall'osservazione dello staff
const sp = await ev(() => { STAFF_MEMBERS = ['Ada', 'Bruno']; staffObs = {Ada:{C2:2, P6:8}, Bruno:{C2:3, P6:9}}; return uscStaffPrio().map(p => p.id); });
ok(sp.length === 1 && sp[0] === 'C2', 'le priorità dello staff vengono dall’osservazione dello staff (' + sp.join() + ')');
const sh2 = await ev(() => { const m = {k:'nuova', obj:{}}; USC_CUR = null; const stf = uscObjHTML('k1', m, true); return stf.length; });
ok(sh2 > 0, 'selettore per eventi (non crasha)');

// ── 3. attività da un'uscita con data fuori ciclo: scelta del ciclo / bozza di ciclo
await ev(() => shOpen('c2', 0)); await sleep(3500);
const nBefore = db.t.pee_archivi.length;
const f3 = await ev(() => { scheda.ciclo = {nome:'Ciclo 2', dal:'2027-01', al:'2027-04'}; scheda.uscite = scheda.uscite || {}; scheda.uscite.u1 = {id:'u1', testo:'Campo', modello:'giorno', ax:{data:'2027-06-10', durata:'giorno'}, prog:{b1:{k:'nuova', tipo:'mom', g:1, ord:1, dur:60, t:'Gioco finale', f:[], obj:{pid:'P4', o:[], i:[]}}}, hid:{}, own:{}}; USC_CUR = 'u1'; uscToSez3('b1', -1); return {ask: !!document.querySelector('#g-modal.show .ciclo-ask'), fuori: cicloDataFuori('2027-06-10'), dentro: cicloDataFuori('2027-02-10')}; });
ok(f3.ask && f3.fuori && !f3.dentro, 'data fuori ciclo: chiede in quale ciclo mettere l’attività');
await ev(() => cicloAskGo('b1', -1, 'bozza')); await sleep(3500);
const nuovo = db.t.pee_archivi.filter(r => (r.data.scheda || {}).bozzaCiclo);
ok(nuovo.length === 1 && nuovo[0].data.scheda.ciclo.nome === 'Ciclo da progettare' && nuovo[0].data.scheda.ciclo.dal === '2027-06' && (nuovo[0].data.scheda.percorsiExtra[0] || {}).percorsoId === 'P4' && nuovo[0].data.scheda.percorsiExtra[0].attivita[0].ax.data === '2027-06-10', 'crea la bozza «Ciclo da progettare» da giugno con P4 e l’attività come segnaposto');
process.exit(summary() ? 1 : 0);
