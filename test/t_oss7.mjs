// Giro 1: niente salti in cima, pannelli che restano aperti, strumenti per macro tema, nuovi nomi dei pulsanti
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:800}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}], occMan:[]}}}, created_at:ts, updated_at:ts});
await loginAs(P, base, u); await sleep(1200);
await ev(() => shOpen('c1', 0)).catch(() => {}); await sleep(2800);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
await ev(() => { gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(900);
await ev(() => ossWizOpen('S6')); await sleep(2500);
const F = P.frames().filter(f => f !== P.mainFrame()).pop();
// passo «percorsi»: Esplora per temi
await F.evaluate(() => { S.dom = 'Quando nessuno guida il gioco, chi prende l’iniziativa?'; S.porta = 'dom'; S.amb = 'S'; S.main = 'S6'; go(visSteps().findIndex(s => s.k === 'perc')); });
await sleep(400);
await F.evaluate(() => { const d = [...document.querySelectorAll('#wbody details')].find(x => /Esplora per temi/.test(x.textContent)); d.open = true; document.getElementById('wscroll').scrollTop = 0; });
const alsoBefore = await F.evaluate(() => S.also.length);
await F.evaluate(() => { const b = document.querySelector('#wbody .temi .tema:not(.on)'); b.click(); });
await sleep(300);
let r = await F.evaluate(() => ({open: [...document.querySelectorAll('#wbody details')].find(x => /Esplora per temi/.test(x.textContent)).open, also: S.also.length}));
ok(r.open === true, '«Esplora per temi» resta aperto dopo il clic su un tema');
ok(r.also === alsoBefore + 1, 'e il tema scelto viene registrato (' + alsoBefore + ' → ' + r.also + ')');
// scroll: resta dove sta
await F.evaluate(() => { const sc = document.getElementById('wscroll'); const b = document.getElementById('wbody'); (sc.scrollHeight > sc.clientHeight ? sc : b).scrollTop = 140; });
const sv = await F.evaluate(() => ({a: document.getElementById('wscroll').scrollTop, b: document.getElementById('wbody').scrollTop}));
await F.evaluate(() => { const b = document.querySelectorAll('#wbody .temi .tema:not(.on)')[1]; b && b.click(); });
await sleep(300);
const sv2 = await F.evaluate(() => ({a: document.getElementById('wscroll').scrollTop, b: document.getElementById('wbody').scrollTop}));
ok(sv2.a === sv.a && sv2.b === sv.b, 'dopo il clic la pagina non torna in cima (' + JSON.stringify(sv) + ' → ' + JSON.stringify(sv2) + ')');
// cambio passo: si riparte dall’alto
await F.evaluate(() => nav(1)); await sleep(300);
const sv3 = await F.evaluate(() => document.getElementById('wscroll').scrollTop + document.getElementById('wbody').scrollTop);
ok(sv3 === 0, 'cambiando passo si riparte dall’alto');
// strumenti
await F.evaluate(() => { go(visSteps().findIndex(s => s.k === 'str')); }); await sleep(300);
const k = await F.evaluate(() => { const m = STR.find(s => s.k === 'GP'); return m.d.E.split(', '); });
await F.evaluate(() => strumTool('GP', 0)); await sleep(150);
r = await F.evaluate(() => ({strum: S.strum.slice(), det: S.strumDet.GP, head: document.querySelector('.strm.on .sthead').textContent}));
ok(r.strum.includes('GP') && r.det.length === 1 && /Scelti 1 su/.test(r.head), 'scegliendo un solo strumento il macro tema si attiva con quello (' + r.head + ')');
await F.evaluate(() => strumTool('GP', 1)); await F.evaluate(() => strumTool('GP', 0)); await sleep(150);
r = await F.evaluate(() => S.strumDet.GP.join('|'));
ok(r === k[1], 'togliendo e aggiungendo restano gli strumenti giusti: ' + r);
await F.evaluate(() => strumTutto('GP')); await sleep(150);
r = await F.evaluate(() => ({det: S.strumDet.GP, head: document.querySelector('.strm.on .sthead').textContent, on: document.querySelectorAll('.strm.on .stc.on').length}));
ok(!r.det && /Tutto il macro tema/.test(r.head) && r.on === k.length, '«Scegli tutto il macro tema» li seleziona tutti');
await F.evaluate(() => { const i = document.querySelector('.strm .stalt input'); i.value = 'Tana segreta'; i.dispatchEvent(new Event('input', {bubbles:true})); });
r = await F.evaluate(() => ({alt: S.strumAltro, strum: S.strum.slice()}));
ok(Object.values(r.alt).includes('Tana segreta') && r.strum.length >= 2, '«Altro» si scrive senza perdere il fuoco e attiva il macro tema');
await F.evaluate(() => strumMacro('GP')); await sleep(150);
ok(await F.evaluate(() => !S.strum.includes('GP') && !S.strumDet.GP), 'togliendo il macro tema sparisce anche la scelta interna');
const rec = await F.evaluate(() => document.querySelectorAll('.strm .tagok').length);
ok(rec > 0, 'restano evidenziati i macro temi «per i tuoi percorsi» (' + rec + ')');
// pulsanti
await F.evaluate(() => { S.dom = 'x'; S.porta = 'dom'; S.amb = 'S'; S.main = 'S6'; S.dur = 60; S.foc.push({txt:'Osservo.', extra:[], tocca:[]}); S.nR = '12'; S.nome = 'Prova'; S.lan = 'l'; S.svi = 's'; S.con = 'c'; salva(); }); await sleep(900);
const bt = await ev(() => [...document.querySelectorAll('.oss-card button')].map(b => b.textContent.trim()));
ok(bt.includes('Aggiungi alle occasioni osservative') && !bt.some(t => /Segna come svolta/.test(t)), 'il pulsante si chiama «Aggiungi alle occasioni osservative»: ' + bt.join(' | '));
ok(pa.errors.length === 0, 'nessun errore JS: ' + JSON.stringify(pa.errors.slice(0, 2)));
summary(); process.exit(0);
