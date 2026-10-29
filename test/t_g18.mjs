import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:+(process.env.VW || 1280), height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, k, aid) => Object.assign({testo:t, link:'', lancio:'', sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', aid}, {[k]:'testo ' + t});
const usc = (id, md, t, d) => ({id, cr:1, testo:t, modello:md, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:md === 'sede' ? {tipo:'sede'} : {}}, prog:{}, hid:{}, own:{}});
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0], tempistica:''}], pp:{},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', 'lancio', 'm0'), att('Gioco B', 'lancio', 'm1'), att('Gioco C', 'sviluppo', 'm2')]}],
    uscite:{u1:usc('u1', 'giorno', 'Uscita al parco', '2026-11-15'), u2:usc('u2', 'sede', 'Riunione di novembre', '2026-11-08')}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
// 1 · menu e pagina
await ev(() => ['Realizzare'].forEach(g => { if(!document.querySelector('#sh-side .sh-gh.open[onclick*="' + g + '"]')) shGrp(g); })); await sleep(200);
ok(await ev(() => [...document.querySelectorAll('#sh-side .sh-si')].some(b => /Calendario e attività/.test(b.textContent))), 'menu Realizzare: «Calendario e attività»');
await ev(() => shCal()); await sleep(800);
let s = await ev(() => ({pool: document.querySelectorAll('.cal-pool .cal-b').length, cs: [...document.querySelectorAll('.cal-c')].map(c => c.querySelector('.cal-ty').textContent + ':' + uscBlocks(uscGet(c.dataset.u)).filter(o => o.m && o.m.k === 'att').length), on: document.querySelector('#sh-side .sh-si.on') && document.querySelector('#sh-side .sh-si.on').textContent.trim()}));
ok(s.pool === 3 && s.cs.join() === 'Riunione:0,Uscita:0', 'tre attività da collocare, contenitori Riunione e Uscita vuoti ' + JSON.stringify(s));
ok(/Calendario e attività/.test(s.on || ''), 'voce del menu evidenziata');
// 2 · sposta con «Sposta in…»
await P.selectOption('.cal-pool .cal-b >> nth=1 >> .cal-sel', {label: 'Uscita · Uscita al parco'}); await sleep(500);
s = await ev(() => ({pool: document.querySelectorAll('.cal-pool .cal-b').length, cs: [...document.querySelectorAll('.cal-c')].map(c => c.querySelector('.cal-ty').textContent + ':' + uscBlocks(uscGet(c.dataset.u)).filter(o => o.m && o.m.k === 'att').length), d: scheda.percorsiExtra[0].attivita[1].ax && scheda.percorsiExtra[0].attivita[1].ax.data, inU: uscOfAtt(scheda.percorsiExtra[0], scheda.percorsiExtra[0].attivita[1]).map(z => z.u.id).join()}));
ok(s.pool === 2 && s.cs.join() === 'Riunione:0,Uscita:1' && s.inU === 'u1', 'Gioco B nell’uscita: sta nel contenitore');
ok(s.d === '2026-11-15', 'la data dell’attività diventa quella del contenitore (' + s.d + ')');
// 3 · trascinamento vero
await P.dragAndDrop('.cal-pool .cal-b >> nth=0 >> .cal-bt', '.cal-c[data-u="u2"]'); await sleep(600);
s = await ev(() => ({cs: [...document.querySelectorAll('.cal-c')].map(c => uscBlocks(uscGet(c.dataset.u)).filter(o => o.m && o.m.k === 'att').length).join(), d: scheda.percorsiExtra[0].attivita[0].ax && scheda.percorsiExtra[0].attivita[0].ax.data}));
ok(s.cs === '1,1' && s.d === '2026-11-08', 'trascinando Gioco A nella riunione: contenitore e data (' + JSON.stringify(s) + ')');
// 4 · l'ordine logico: A (1ª) l'8 novembre, B (2ª) il 15: nessun avviso. Sposto C (3ª) nella riunione: ancora nessun avviso. Poi B nella riunione e A nell'uscita: avviso
ok(await ev(() => !document.querySelector('.cal-warn')), 'ordine coerente con le date: nessun avviso');
const mvA = (idx, j, fromU, toU) => ev(([idx, j, fromU, toU]) => { const f = fromU ? fromU + '|' + uscBlocks(uscGet(fromU)).find(o => { const z = o.m && o.m.k === 'att' && uscAttFind(o.m); return z && z.idx === idx && z.j === j; }).k : ''; calSel({value: toU}, idx, j, f); }, [idx, j, fromU, toU]);
await mvA(0, 1, 'u1', 'u2'); await sleep(400); await mvA(0, 0, 'u2', 'u1'); await sleep(500);
s = await ev(() => ({w: document.querySelector('.cal-warn') ? document.querySelector('.cal-warn').textContent : '', ord: attOrd(scheda.percorsiExtra[0], 3).join()}));
ok(/L’ordine ipotizzato del percorso/.test(s.w) && /Non riordino niente da solo/.test(s.w) && s.ord === '0,1,2', 'se la data cambia l’ordine: avviso, e nessun riordino automatico (' + s.ord + ')');
await P.click('.cal-warn button:has-text("Aggiorna l’ordine")'); await sleep(500);
s = await ev(() => ({w: !!document.querySelector('.cal-warn'), ord: attOrd(scheda.percorsiExtra[0], 3).join()}));
ok(!s.w && s.ord.startsWith('1,0') , '«Aggiorna l’ordine del percorso»: B passa prima di A (' + s.ord + ')');
// 5 · «Lascio com'è»
await ev(() => calSel({value: 'u1'}, 0, 2, '')); await sleep(400);
await ev(() => { const a = scheda.percorsiExtra[0].attivita; a[2].ax = a[2].ax || {}; a[2].ax.data = '2026-10-01'; saveData(true); }); await ev(() => shCal()); await sleep(300);
ok(await ev(() => !!document.querySelector('.cal-warn')), 'una data precedente fa comparire di nuovo l’avviso');
await P.click('.cal-warn button:has-text("Lascio")'); await sleep(400);
ok(await ev(() => !document.querySelector('.cal-warn')), '«Lascio com’è»: l’avviso sparisce e non torna');
// 6 · l'organizzazione della singola attività non sta più nella home del calendario
ok(await ev(() => !document.querySelector('.cal-org') && ![...document.querySelectorAll('#panel-pp button')].some(b => b.textContent.trim() === 'Organizza')), 'home del calendario: nessuna organizzazione delle singole attività (si fa dentro l’evento o nei percorsi)');
// 7 · Percorsi educativi non li ha più
await ev(() => shSec('3')); await sleep(900);
s = await ev(() => ({t: document.getElementById('panel4').innerText}));
ok(!/Quando arriva il momento di organizzarla/.test(s.t) && /Calendario e attività/.test(s.t), '«Percorsi educativi» (Progettare): niente più campi di Realizzare, rimando al Calendario');
// 8 · nuovo contenitore
await ev(() => shCal()); await sleep(500);
await P.click('.cal-add button:has-text("+ Campo")'); await sleep(300);
await P.fill('#cal-nt', 'Campo estivo'); await P.fill('#cal-d1', '2027-07-20'); await P.fill('#cal-d2', '2027-07-27'); await P.click('.cal-new button:has-text("Crea")'); await sleep(500);
ok(await ev(() => [...document.querySelectorAll('.cal-c')].some(c => /Campo estivo/.test(c.textContent) && c.querySelector('.cal-ty').textContent === 'Campo')), 'nuovo Campo creato dal calendario');
ok(await ev(() => Object.values(scheda.uscite).some(x => x.testo === 'Campo estivo' && x.modello === 'campo' && x.ax.dataFine === '2027-07-27')), 'il Campo è un’uscita vera (stessi dati dell’impostazione precedente)');
// 9 · Apri
await P.click('.cal-c >> nth=0 >> button:has-text("Apri")'); await sleep(900);
ok(await ev(() => schedaStep === 'usc' && !!USC_CUR), 'Apri porta nell’uscita');
ok(/Calendario e attività/.test(await ev(() => document.querySelector('#sh-side .sh-si.on') ? document.querySelector('#sh-side .sh-si.on').textContent : '')), 'dentro l’uscita la voce del menu resta «Calendario e attività»');
// 10 · nessuno scorrimento orizzontale
await ev(() => shCal()); await sleep(400);
for(const w of [820, 390]){ await P.setViewportSize({width:w, height:800}); await sleep(300); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'nessuno scorrimento orizzontale a ' + w + ' px'); }
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
