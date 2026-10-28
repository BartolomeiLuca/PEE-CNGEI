import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
const mv = {on:true, by:{'anna@x.it':{nome:'Anna Verdi', v:{P1:9, P2:5, P3:6}, note:{P1:'molto sicuro'}, at:{P1:1,P2:1,P3:1}}, 'bruno@x.it':{nome:'Bruno Neri', v:{P1:3, P2:6, P3:'n'}, note:{P1:'non partecipa'}, at:{P1:1,P2:1,P3:1}}}, dec:{}, log:[]};
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', mv, pp:{staffTab:[{ruolo:'CU', nome:'Anna Verdi'},{ruolo:'VCU', nome:'Bruno Neri'}], occMan:[{id:'m1', att:'Gioco uno', data:'2026-10-20', perc:['P1'], ass:['Bruno Neri']},{id:'m2', att:'Gioco due', data:'2026-10-21', perc:['P3'], ass:['Bruno Neri']}]}}}, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-10-01T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
// regole di calcolo
let r = await ev(() => ({m1:mvMean([9,3]), med:mvMedian([9,3]), conf1:mvConf('P1'), conf2:mvConf('P2'), conf3:mvConf('P3'), p3b:mvAll('P3').map(x=>x.v).join()}));
ok(r.m1 === 6 && r.med === 6, 'valore proposto = media (6 tra 9 e 3)');
ok(r.conf1 === true && r.conf2 === false, 'divergenza da 4 punti: 9 vs 3 sì; 5 vs 6 no');
ok(r.conf3 === true && r.p3b === '6,n', 'Bruno assente da tutte le attività di P3: non osservato automatico, quindi misto');
// valore del titolare: motivazione obbligatoria
r = await ev(() => mvDecide('P1', 8, ''));
ok(r === false && await ev(() => !scheda.mv.dec.P1), 'valore diverso dalla media senza motivazione: non si salva');
r = await ev(() => mvDecide('P1', 8, 'Ho visto io le tre uscite'));
ok(r === true && await ev(() => scheda.mv.dec.P1.mod === true && scheda.mv.dec.P1.why.length > 5), 'con motivazione si salva ed è «modificato dal titolare»');
await ev(() => mvDecide('P1', 6, ''));
ok(await ev(() => scheda.mv.dec.P1.mod === false), 'tornare alla media non richiede motivazione');
// pagina Confronto
await ev(() => gGo('1s')); await sleep(600);
let t = await ev(() => document.getElementById('panel-pp').innerText);
ok(/Confronto e sintesi dello staff/.test(t) && /Sviluppo Personale/.test(t) && /Sviluppo Comunitario/.test(t) && /Sviluppo Spirituale/.test(t), 'pagina Confronto con i tre Ambiti');
ok(/Divergenza alta/.test(t), 'riga con divergenza evidenziata col messaggio');
ok(/Tu/.test(t) && /Bruno/.test(t), 'colonne per educatore (nome proprio)');
ok(await ev(() => document.querySelector('#sh-side .sh-si.on') && /Confronto e sintesi/.test(document.querySelector('#sh-side .sh-si.on').innerText) && getComputedStyle(document.querySelector('#g-subnav .gsn-steps')).display === 'none'), 'voce «Confronto e sintesi» attiva nel menu, niente pulsanti-pillola vecchi');
ok(await ev(() => /Corporeità/.test(document.getElementById('cf-detail').innerText) && /Gioco uno/.test(document.getElementById('cf-detail').innerText)), 'dettaglio: percorso e attività con presenze');
ok(await ev(() => /Bruno · assente/.test(document.getElementById('cf-detail').innerText)), 'presenze: Bruno assente a «Gioco uno»');
// sintesi condivisa
await P.fill('#cf-detail textarea[oninput^="cfSint"] >> nth=0', 'Si organizzano da soli'); await sleep(300);
ok(await ev(() => scheda.mv.sint.P1.pos === 'Si organizzano da soli'), 'sintesi condivisa salvata');
// ordina per divergenza + selezione
await P.selectOption('.cf-bar select', 'div'); await sleep(300);
await P.click('.cf-t tbody tr >> nth=1'); await sleep(300);
ok(await ev(() => window._cf.sel.length > 0), 'selezione di un altro percorso');
// altre pagine: la pillola non resta
await ev(() => gGo('1b')); await sleep(500);
ok(await ev(() => !window._cfOn && !document.getElementById('panel-pp').classList.contains('active')), 'uscendo dal Confronto si torna alla scheda');
// download excel
await ev(() => gGo('1s')); await sleep(400);
const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 20000}), P.click('button:has-text("Scarica tabella (Excel)")')]);
ok(/confronto_staff\.xlsx$/.test(dl.suggestedFilename()), 'Excel del confronto scaricato');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
