// Revisione a turni: colori degli stati, «Ho fatto» / «Ho un dubbio», sezioni comprimibili, «Ho finito» con domande aperte
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
await pe(() => { const a = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)); rvDocOpen(a.key); });
await pe(() => { const t = document.querySelector('#rv-doc textarea'); t.value = 'Aggiungi il quartiere'; t.dispatchEvent(new Event('change', {bubbles:true})); }); await sleep(900);
ok(db.t.pee_revisioni_punto.length === 1 && db.t.pee_revisioni_punto[0].stato === 'da_fare', 'il commento diventa un punto «da fare»');
await pe(() => rvSync()); await sleep(1200);
let s = await pe(() => document.getElementById('rv-dock').innerText);
ok(/Tocca a te/.test(s) && /Rimanda al compilatore \(1\)/.test(s) && !/Approva e chiudi/.test(s), 'revisore: turno, «Rimanda» e niente «Approva» con punti da fare');
await pe((a) => rvAzione(a, 'rimanda'), aid); await sleep(900);
ok(db.t.pee_revisioni[0].fase === 'compilatore', '«Rimanda» passa il turno al compilatore');
s = await pe(() => document.getElementById('rv-dock').innerText); ok(/Tocca a chi ha scritto/.test(s), 'revisore: ora tocca al compilatore');
// compilatore
await ev(() => rpLoad()); await sleep(1500); await ev(() => rpTog()); await sleep(600);
s = await ev(() => document.getElementById('rp-dock').innerText);
await ev(() => rpLoad()); await sleep(1500);
const cls = () => ev(() => ({ chip: (document.querySelector('#rp-dock .rv-st .rv-ch') || {}).className, pt: (document.querySelector('#rp-dock .rv-pt') || {}).className, sec: !!document.querySelector('#rp-dock details.rp-sec'), open: !!document.querySelector('#rp-dock details.rp-sec[open]'), taHidden: (document.querySelector('#rp-dock .rv-st textarea') || {}).hidden }));
let c = await cls();
ok(/rv-ch-da_fare/.test(c.chip) && /rv-pt-da_fare/.test(c.pt), 'punto da fare: rosso ' + JSON.stringify(c));
ok(c.sec && c.open, 'le richieste sono raggruppate per sezione, aperta quella con punti da fare');
ok(c.taHidden === true, 'il campo di testo è chiuso finché non serve');
// «Ho un dubbio»: prima apre il campo, poi invia
await ev(() => { const b = Array.from(document.querySelectorAll('#rp-dock .rv-st .rv-b')).find(x => /Ho un dubbio/.test(x.textContent)); b.click(); }); await sleep(300);
c = await cls(); ok(c.taHidden === false, '«Ho un dubbio» apre il campo');
await ev(() => { const b = Array.from(document.querySelectorAll('#rp-dock .rv-st .rv-b')).find(x => /Invia il dubbio/.test(x.textContent)); b.click(); }); await sleep(300);
ok(db.t.pee_revisioni_punto[0].stato === 'da_fare', 'senza testo il dubbio non parte');
await ev(() => { document.querySelector('#rp-dock .rv-st textarea').value = 'Intendi il quartiere o la frazione?'; const b = Array.from(document.querySelectorAll('#rp-dock .rv-st .rv-b')).find(x => /Invia il dubbio/.test(x.textContent)); b.click(); }); await sleep(1500);
c = await cls(); ok(db.t.pee_revisioni_punto[0].stato === 'attesa' && /rv-ch-attesa/.test(c.chip) && /rv-pt-attesa/.test(c.pt), 'dubbio inviato: giallo ' + JSON.stringify(c));
// «Ho finito» non è bloccato da una domanda aperta
ok(!(await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled)), '«Ho finito» resta acceso con una domanda ancora aperta');
// risposta del revisore dopo il dubbio: blu
const pu0 = db.t.pee_revisioni_punto[0]; pu0.updated_at = '2026-11-15T10:00:00Z';
db.t.pee_giri_msg = db.t.pee_giri_msg || [];
db.t.pee_giri_msg.push({id:'m1', archivio_id:aid, rev_id:L.id, chiave:pu0.chiave, user_id:L.id, autore_nome:'Luca Prova', autore_ruolo:'revisore', testo:'Il quartiere, grazie', created_at:'2026-11-15T11:00:00Z'});
await ev(() => rpLoad()); await sleep(1500);
c = await cls(); ok(/rv-ch-risp/.test(c.chip) && /rv-pt-risp/.test(c.pt), 'risposta ricevuta: blu ' + JSON.stringify(c));
await ev(() => { const b = document.querySelector('#rp-dock .rv-body'); }); await P.screenshot({path:'/tmp/colori_blu.png', clip:{x:880,y:0,width:400,height:700}});
// «Ho fatto»: verde
await ev(() => { const b = Array.from(document.querySelectorAll('#rp-dock .rv-st .rv-b')).find(x => /Ho fatto/.test(x.textContent)); b.click(); }); await sleep(1500);
c = await cls(); ok(db.t.pee_revisioni_punto[0].stato === 'fatto' && /rv-ch-fatto/.test(c.chip) && /rv-pt-fatto/.test(c.pt), '«Ho fatto»: verde ' + JSON.stringify(c));
await P.screenshot({path:'/tmp/colori_verde.png', clip:{x:880,y:0,width:400,height:700}});
// nella copia inviata (ferma) niente pulsanti di lavoro: solo un invito chiaro a tornare al progetto
db.t.pee_revisioni_punto[0].stato = 'da_fare'; db.t.pee_revisioni[0].fase = 'compilatore';
P.evaluate(id => ppGiroApriQui(id), g0.id).catch(() => {}); await sleep(11000);
await P.evaluate(async () => { try{ await rvMsgLoad(); rvRender(); rvDocPaint(); }catch(e){} }); await sleep(800);
const dk = await P.evaluate(() => ({ t: (document.getElementById('rv-dock') || {innerText: ''}).innerText, hasFinito: !!document.querySelector('#rv-dock [onclick*=ho_finito]'), hasFatto: !!document.querySelector('#rv-doc [onclick*="rvPuntoSet"], #rv-dock [onclick*="rvPuntoSet"]'), back: !!document.querySelector('#rv-dock [onclick*=giroChiudi]') }));
ok(/Torna al tuo progetto/.test(dk.t) && /copia inviata/.test(dk.t) && !dk.hasFinito && !dk.hasFatto && dk.back, 'copia inviata: niente «Ho finito» né «Ho fatto», invito a tornare al progetto ' + JSON.stringify({f: dk.hasFinito, p: dk.hasFatto, b: dk.back}));
await P.screenshot({path:'/tmp/colori_copia.png'});
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); process.exit(0);
