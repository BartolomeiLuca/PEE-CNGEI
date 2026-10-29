import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:+(process.env.VW || 1280), height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d, done) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:done ? 'bene' : '', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const row = (id, titolo, data, ts) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto'}, data), created_at:ts, updated_at:ts});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
db.t.pee_archivi.push(row('c1', 'Programmazione Annuale 2026-27 · Reparto', {obs:{P1:4, P2:6, C1:3}, pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'}, riobs:{P1:7},
  priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')], pp:{sezione:'Pesaro', gruppo:'1', ctxTerr:'Quartiere con parco', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}], occMan:[{id:'x', att:'vecchia occasione'}], scelta:'testo di scelta'},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-10-20', true), att('Gioco B', '2026-12-05', false), att('Gioco C', '2027-05-01', false)]}]}}, '2026-10-20T10:00:00Z'));
db.t.pee_archivi.push(row('c2', 'Programmazione Annuale 2026-27 · Reparto · II trimestre', {pris:{P2:true, C2:true, S2:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'II trimestre', dal:'2027-01', al:'2027-03'}, cicloDa:'c1',
  priorita:[pri('P', 'P2', '2027-01', '2027-03'), pri('C', 'C2', '2027-01', '2027-03'), pri('S', 'S2', '2027-02', '2027-03')], pp:{sezione:'Pesaro', gruppo:'1'},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P2', ambito:'P', attivita:[att('Caccia al tesoro', '2027-01-18', false)]}]}}, '2026-10-21T10:00:00Z'));
db.t.pee_archivi.push(Object.assign(row('pp', 'Progetto Personale 2026-27', {scheda:{tipoProgetto:'PP', annoScout:'2026-27', pp:{ctxTerr:'Dal PP', ctxSez:'Dal PP'}, osservazione:{P:{positivi:'dal PP', necessita:'', singoli:''}, C:{positivi:'', necessita:'', singoli:''}, S:{positivi:'', necessita:'', singoli:''}}}}, '2026-10-22T10:00:00Z'), {meta:{mode:'giovani', fascia:'E', tipo:'PP'}}));
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3800);
// 1 · intestazione e interruttore
let s = await ev(() => ({h1: document.querySelector('#panel-dash h1').textContent, seg: [...document.querySelectorAll('.sh-seg button')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')).join(), card: document.querySelector('[data-c="anno"] h3') && document.querySelector('[data-c="anno"] h3').textContent, sub: document.querySelector('#panel-dash .sub').textContent}));
ok(s.h1 === 'Il mio ciclo' && /Il mio ciclo:true,Il mio anno:false/.test(s.seg), 'dashboard: «Il mio ciclo» con interruttore «Il mio ciclo | Il mio anno»');
ok(/I trimestre/.test(s.sub) && /ottobre 2026 a dicembre 2026/.test(s.sub), 'il ciclo mostra nome e periodo (' + s.sub + ')');
ok(s.card === 'Il mio ciclo in un colpo d’occhio', 'la vecchia grafica dell’anno è sostituita dalla linea del tempo del ciclo');
ok(await ev(() => document.querySelectorAll('[data-c="anno"] .vis-bar').length === 3 && !!document.querySelector('[data-c="anno"] .vis-fl')), 'nel ciclo: tre blocchi e la bandierina della verifica');
ok(await ev(() => /di solito di 3-4 mesi/.test(document.querySelector('.an-exp').textContent)), 'sotto «Il mio ciclo» c’è la spiegazione');
await P.click('.an-exp button:has-text("Rinomina")'); await sleep(200);
await P.fill('#sh-cf textarea', 'Ciclo d’autunno'); await sleep(300);
ok(await ev(() => scheda.ciclo.nome === 'Ciclo d’autunno'), 'il ciclo si rinomina dal pulsante «Rinomina il ciclo»');
await ev(() => shDash()); await sleep(300);
ok(/Ciclo d’autunno/.test(await ev(() => document.querySelector('#panel-dash .sub').textContent)), 'il nuovo nome compare nell’intestazione');
// 2 · Il mio anno
await P.click('.sh-seg button:has-text("Il mio anno")'); await sleep(2500);
s = await ev(() => ({h1: document.querySelector('#panel-dash h1').textContent, cy: [...document.querySelectorAll('.an-cy')].map(c => c.querySelector('b').textContent.replace(/\s+/g, ' ').trim()), rows: document.querySelectorAll('#an-year .vis-bar').length}));
ok(s.h1 === 'Il mio anno scout' && s.cy.length === 2 && /Ciclo d’autunno \(aperto ora\)/.test(s.cy[0]) && /II trimestre/.test(s.cy[1]), 'Il mio anno: due cicli in ordine di tempo ' + JSON.stringify(s.cy));
ok(s.rows === 6, 'sei blocchi (tre percorsi per ciclo) ' + s.rows);
await P.click('.vis-opt .sh-seg >> nth=0 >> button:has-text("Attività per attività")'); await sleep(300);
s = await ev(() => ({dots: document.querySelectorAll('#an-year .vis-dl').length, tr: document.querySelectorAll('#an-year .vis-lst tbody tr').length, txt: document.querySelector('#an-year .vis-lst').textContent}));
ok(s.dots === 4 && s.tr === 4 && /Caccia al tesoro/.test(s.txt) && /II trimestre/.test(s.txt), 'un’unica linea con tutte le attività con la data (' + s.dots + ' punti, ' + s.tr + ' righe)');
await P.click('.vis-opt .sh-seg >> nth=1 >> button:has-text("Stato")'); await sleep(300);
ok(await ev(() => /Verificata/.test(document.querySelector('#an-year .vis-leg').textContent) && /Da verificare/.test(document.querySelector('#an-year .vis-leg').textContent)), 'colore per stato: legenda con simboli e parole');
await P.click('.vis-opt .sh-seg >> nth=0 >> button:has-text("Per ciclo")'); await sleep(300);
ok(await ev(() => document.querySelectorAll('#an-year .vis-sub').length === 6), 'lettura per ciclo: un blocco per ciclo e i suoi percorsi');
// 3 · nuovo ciclo
await P.click('button:has-text("+ Nuovo ciclo")'); await sleep(300);
await P.fill('#nc-n', 'III trimestre'); await P.selectOption('#nc-d', '2027-04'); await P.selectOption('#nc-a', '2027-06');
await P.click('#nc-go'); await sleep(5000);
const nr = db.t.pee_archivi.find(r => r.data.scheda && r.data.scheda.ciclo && r.data.scheda.ciclo.nome === 'III trimestre');
ok(!!nr && nr.anno === 2026 && nr.titolo.endsWith('· III trimestre') && !/· II trimestre/.test(nr.titolo), 'nuovo ciclo creato nello stesso anno, con titolo pulito: ' + (nr && nr.titolo));
ok(nr && nr.data.scheda.ciclo.dal === '2027-04' && nr.data.scheda.ciclo.al === '2027-06' && nr.data.scheda.cicloDa === 'c1', 'periodo e collegamento al ciclo di partenza');
ok(nr && nr.data.obs.P1 === 7 && nr.data.obs.P2 === 6 && nr.data.obs.C1 === 3, 'la rilettura di fine ciclo (P1: 4→7) diventa la partenza del nuovo ciclo; gli altri valori passano');
ok(nr && nr.data.scheda.pp.ctxTerr === 'Quartiere con parco' && nr.data.scheda.pp.staffTab[0].nome === 'Anna Verdi' && !nr.data.scheda.pp.occMan && !nr.data.scheda.pp.scelta, 'passano contesto e staff; non le occasioni e le scelte del ciclo vecchio');
ok(nr && !nr.data.scheda.priorita && !nr.data.scheda.percorsiExtra, 'priorità, obiettivi e percorsi del nuovo ciclo sono vuoti');
ok(nr && !nr.data.scheda.ppImp && !(nr.data.scheda.osservazione && nr.data.scheda.osservazione.P && nr.data.scheda.osservazione.P.positivi), 'il Progetto Personale non entra direttamente nei cicli successivi (il contesto arriva dal ciclo precedente)');
ok(await ev(() => CL.ctx && /III trimestre/.test(CL.ctx.titolo)), 'il nuovo ciclo si apre');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
