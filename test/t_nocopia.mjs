// Il compilatore non incontra la copia: «Per te» e scheda del giro aprono il progetto vero e l'elenco delle revisioni
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', false)); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0], aid = g0.archivio_id;
let v = db.t.pee_revisioni[0];
ok(db.t.pee_revisioni.length === 1 && v.stato === 'aperta' && v.fase === 'revisore' && v.revisore_email === 'luca.bartolomei@cngei.it', 'il primo invio apre la revisione e fissa il revisore: ' + JSON.stringify(v && [v.stato, v.fase, v.revisore_email]));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);
const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(9000);
const pe = (f, a) => pop.evaluate(f, a);
await pe(() => { const a = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)); rvDocOpen(a.key); }); await sleep(300);
await pe(() => { const t = document.querySelector('#rv-doc textarea'); t.value = 'Aggiungi il quartiere'; Array.from(document.querySelectorAll('#rv-doc button')).find(x => /Aggiungi richiest/.test(x.textContent)).click(); }); await sleep(900);
await pe(() => rvSync()); await sleep(1000);
ok(db.t.pee_revisioni_punto.length === 1 && db.t.pee_giri_rev.some(x => x.tipo === 'nota' && x.testo === 'Aggiungi il quartiere'), 'la richiesta è una bozza salvata');

await pe((a) => rvAzione(a, 'rimanda'), aid); await sleep(1500);
ok(db.t.pee_revisioni[0].fase === 'compilatore', 'la revisione è passata al compilatore');
// ── compilatore ──
await ev(() => clPerTe()); await sleep(2500);
const pt = await ev(() => ({it: (CL.perte || []).filter(x => x.k === 'gfb').map(x => ({aid: x.aid, id: x.id})), html: clPerTeHTML()}));
ok(pt.it.length === 1 && pt.it[0].aid === aid, 'in «Per te» c’è la riga delle revisioni e porta l’id del progetto: ' + JSON.stringify(pt.it));
ok(/rpOpenDock\('/.test(pt.html) && !/rvOpenAny/.test(pt.html), '«Leggi le revisioni» apre il progetto vivo, non la copia');
const card = await ev(() => ppBloccoHTML(1));
ok(!/ppGiroApri/.test(card) && !/Vedi il progetto inviato/.test(card) && !/Leggi le revisioni ricevute/.test(card), 'nella scheda del giro non ci sono pulsanti sulla copia');
ok(/rpOpenDock\(CL\.ctx/.test(card) && /Elimina il giro/.test(card), 'resta «Apri le revisioni nel progetto» e «Elimina il giro»');
// clic dal progetto aperto: nessuna nuova scheda, nessuna copia
let nPag = P.context().pages().length;
await ev(() => { document.querySelector('.cl-perte') ; }); 
await ev(id => rpOpenDock(id), aid); await sleep(3500);
let st = await ev(() => ({bro: !!window.BRO, open: !!(window._rp && window._rp.open), dock: !!document.querySelector('#rp-dock.open'), n: (window._rp.pts || []).length, flag: sessionStorage.getItem('bussola_rp_open'), hash: location.hash}));
ok(!st.bro && st.open && st.dock && st.n === 1, 'si apre l’elenco delle revisioni nel progetto vivo: ' + JSON.stringify(st));
ok(P.context().pages().length === nPag && st.hash === '' && !st.flag, 'nessuna scheda nuova, nessuna copia in sola lettura, flag consumato');
// clic dalla pagina «I tuoi progetti» (progetto non aperto)
await ev(() => { if(window._rp.open) rpTog(); try{ shGoHome && shGoHome(); }catch(e){} }); await sleep(2000);
await ev(id => rpOpenDock(id), aid); await sleep(7000);
st = await ev(() => ({bro: !!window.BRO, dock: !!document.querySelector('#rp-dock.open'), ctx: CL.ctx && CL.ctx.id, home: ptHome()}));
ok(!st.bro && st.dock && !st.home, 'dalla pagina dei progetti si entra nel progetto e si apre l’elenco: ' + JSON.stringify(st));
// ricarica della pagina con il flag (come dopo l'apertura di un altro progetto)
await ev(id => { if(window._rp.open) rpTog(); sessionStorage.setItem('bussola_autoresume', '1'); sessionStorage.setItem('bussola_rp_open', JSON.stringify({aid: id, t: Date.now()})); }, await ev(() => CL.ctx.id)); await P.reload(); await sleep(12000);
st = await ev(() => ({bro: !!window.BRO, dock: !!document.querySelector('#rp-dock.open'), flag: sessionStorage.getItem('bussola_rp_open')}));
ok(!st.bro && st.dock && !st.flag, 'dopo la ricarica del progetto l’elenco si apre da solo: ' + JSON.stringify(st));
// flag vecchio: non deve aprire nulla
await ev(() => { if(window._rp.open) rpTog(); sessionStorage.setItem('bussola_rp_open', JSON.stringify({aid: CL.ctx.id, t: Date.now() - 200000})); }); await ev(() => rpOpenRun(0)); await sleep(800);
ok(await ev(() => !document.querySelector('#rp-dock.open') && !sessionStorage.getItem('bussola_rp_open')), 'un flag vecchio viene scartato e non apre l’elenco');
summary(); await br.close(); process.exit(0);
