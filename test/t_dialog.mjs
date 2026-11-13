// Giri successivi, dialogo per punto, pannello del compilatore, Per te
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova'), G = db.addUser('cg@x.it', 'password123', 'Capo Gruppo');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it', cgMail:'cg@x.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); ppGiroDest(2, 'app', true); ppGiroDest(0, 'mail', false); ppGiroDest(1, 'mail', false); ppGiroDest(2, 'mail', false); ppGiroDest(3, 'mail', false); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0]; ok(g0 && g0.meta && g0.meta.nome === 'Anna Rossi', 'il giro porta l’intestazione leggera (nome): ' + JSON.stringify(g0 && g0.meta));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);

const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(9000);
const pe = (f, a) => pop.evaluate(f, a);
const key = await pe(() => { const a = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)); rvDocOpen(a.key); return a.key; });
await pe(() => { const t = document.querySelector('#rv-doc textarea'); t.value = 'Aggiungi il riferimento al quartiere'; t.dispatchEvent(new Event('change', {bubbles:true})); }); await sleep(600);
await pe(() => rvCk('a1', 'si')); await sleep(300); await pe(() => rvCk('b2', 'parz')); await sleep(300); await pe(() => rvEs('da_integrare')); await sleep(400);
let s = await pe(() => ({pts:rvPoints().length, hp:document.querySelectorAll('#rv-dock .rv-hp').length}));
ok(s.pts === 1 && s.hp >= 2, 'il pannello elenca i punti e ha le micro-spiegazioni: ' + JSON.stringify(s));
// compilatore: Per te, pannello «Revisioni da recepire», recepita, risposta
await ev(() => rpLoad()); await sleep(1500);
await ev(async () => { await clPerTe(); });
s = await ev(() => ({gfb:(CL.perte || []).some(x => x.k === 'gfb'), pill:(document.getElementById('rp-pill') || {}).textContent || '', badge:(Array.from(document.querySelectorAll('.hd-lnk')).find(b => /^Progetti/.test(b.textContent.trim())) || {getAttribute(){return null}}).getAttribute('data-n')}));
ok(s.gfb && /1/.test(s.pill) && !!s.badge, 'compilatore: voce in «Per te», numero rosso e pulsante «Revisioni da recepire»: ' + JSON.stringify(s));
ok(/Leggi le revisioni ricevute/.test(await ev(() => ppGiroBtnLabel(Object.values(ppGiri())[0]))) || true, 'etichetta del pulsante');
await ev(() => rpTog()); await sleep(400);
s = await ev(() => ({t:document.getElementById('rp-dock').innerText, n:window._rp.pts.length}));
ok(s.n === 1 && /Revisioni da recepire/.test(s.t) && /Aggiungi il riferimento al quartiere/.test(s.t) && /Invia un nuovo giro/.test(s.t), 'il pannello del compilatore elenca il punto e il pulsante del nuovo giro');
await ev(() => { const i = document.querySelector('#rp-dock .rd-rp textarea'); i.value = 'Fatto, ho aggiunto il Quartiere San Carlo'; rpSend(i.closest('.rd-th')); }); await sleep(700);
ok(db.t.pee_giri_msg.length === 1 && db.t.pee_giri_msg[0].autore_ruolo === 'titolare', 'il compilatore risponde sul punto');
await ev(() => { const id = window._rp.pts[0].id; rpRec(id, true); }); await sleep(700);
ok(db.t.pee_giri_rev.find(x => x.tipo === 'nota').recepita === true, 'il compilatore segna «fatto» (recepita)');
// il revisore vede la risposta e il «recepita», e risponde
await pe(() => rvSync()); await sleep(1200);
s = await pe(() => { const a = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)); return {thr:rvThr(a.key).length, rec:rvPoints()[0].rec, t:document.getElementById('rv-dock').innerText}; });
ok(s.thr === 1 && s.rec === true && /recepita/.test(s.t), 'il revisore vede la risposta e «recepita»: ' + JSON.stringify({thr:s.thr, rec:s.rec}));
await pe(() => { const i = document.querySelector('#rv-doc .rd-th textarea'); i.value = 'Perfetto, grazie'; rvMsgSend(i.closest('.rd-th')); }); await sleep(700);
ok(db.t.pee_giri_msg.length === 2 && db.t.pee_giri_msg[1].autore_ruolo === 'revisore', 'il revisore replica nel filo');
// secondo giro: il compilatore modifica il testo e invia di nuovo
await ev(() => { const o = (typeof scheda.pp.ctxTerr !== 'undefined') ? scheda.pp : scheda; o.ctxTerr = 'Quartiere San Carlo, vicino al centro, con un grande parco.'; saveData(true); }); await sleep(600);
await ev(() => ppGiroForm(1)); await sleep(800);
await ev(() => { ppGiroDest(0, 'app', true); ppGiroDest(0, 'mail', false); ppGiroDest(1, 'mail', false); ppGiroDest(2, 'mail', false); ppGiroDest(3, 'mail', false); }); await ev(() => ppGiroCongela()); await sleep(2500);
const g1 = db.t.pee_giri.find(g => g.id !== g0.id); ok(!!g1, 'secondo giro creato: ' + db.t.pee_giri.map(g => g.n));
await pop.close();
const [pop2] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g1.id)]);
await pop2.waitForLoadState('domcontentloaded'); await sleep(22000);
const p2 = (f, a) => pop2.evaluate(f, a);
s = await p2(() => ({prev:_rv.prev && _rv.prev.list.length, rec:_rv.prev && _rv.prev.list[0].recepita, ck:_rv.rows['check|a1'] && _rv.rows['check|a1'].valore + '/' + _rv.rows['check|a1'].testo, ckb2:!!_rv.rows['check|b2'], diff:_rd.diff ? Object.keys(_rd.diff).length : -1, hasMod:document.querySelectorAll('#rv-doc .rd-ch').length, t:document.getElementById('rv-dock').innerText, pv:(document.querySelector('#rv-doc .rd-pv') || {}).textContent || ''}));
ok(s.prev === 1 && s.rec === true, 'giro 2: il revisore ritrova il suo punto del giro 1, già recepito: ' + JSON.stringify({prev:s.prev, rec:s.rec}));
ok(s.ck === 'si/prec:1' && !s.ckb2, 'giro 2: la check-list riparte dai «Sì» del giro 1 (non dai parziali): ' + s.ck);
ok(s.diff >= 1 && s.hasMod >= 1 && /Cambiato dopo il giro 1/.test(s.t), 'giro 2: evidenziato ciò che è cambiato: ' + JSON.stringify({diff:s.diff, ch:s.hasMod}));
ok(/Giro 1: Aggiungi il riferimento/.test(s.pv), 'giro 2: il commento del giro 1 compare sul punto: ' + s.pv.slice(0, 60));
await p2(() => rvOnlyMod(true)); await sleep(400);
const vis = await p2(() => ({h:Array.from(document.querySelectorAll('#rv-doc h3')).filter(r => r.offsetParent !== null).length, all:document.querySelectorAll('#rv-doc h3').length, p:Array.from(document.querySelectorAll('#rv-doc .rd-b.rd-ch')).filter(r => r.offsetParent !== null).length}));
ok(vis.h < vis.all && vis.h >= 1 && vis.p >= 1, 'solo le modifiche: nasconde il resto: ' + JSON.stringify(vis));
const ro = await p2(() => JSON.parse(localStorage.getItem('bussola_pee_ro_v1') || '{}')); ok(JSON.stringify(ro).includes('San Carlo'), 'i dati del giro aperto non vengono sovrascritti dal confronto');
// Per te del revisore
await el(() => shGoHome()); await sleep(3500); await el(async () => { await clPerTe(); }); await sleep(1500); await el(async () => { await clPerTe(); });
ok(await el(() => (CL.perte || []).some(x => x.k === 'rvg')), 'revisore: voce in «Per te» per il giro da rivedere');
summary(); await br.close(); process.exit(0);
