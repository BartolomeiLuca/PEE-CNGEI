// Blocco D/E: chi rivede un giro (revisore / in copia) e i riscontri in app lato compilatore
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
await el(() => shGoHome()); await sleep(2500);
let s = await el(() => { const b = document.getElementById('cl-rev'); return b ? b.innerText : 'nessun contenitore'; });
ok(/giri da rivedere/i.test(s) && /Anna Rossi/.test(s) && /Giro 1/.test(s) && /Leggi e rivedi/.test(s) && /Scarica il Word/.test(s) && /Concludi la revisione/.test(s), 'home del revisore: pannello per compilatore con «Leggi e rivedi», Word e «Concludi»: ' + s.replace(/\n/g,' | ').slice(0,140));
const badge = await el(() => { clPerTe(); return new Promise(r => setTimeout(() => r((Array.from(document.querySelectorAll('.hd-lnk')).find(b => /^Progetti/.test(b.textContent.trim())) || {getAttribute(){return null}}).getAttribute('data-n')), 2500)); });
ok(badge === '1', 'il numero rosso su «Progetti» compare per il giro da rivedere: ' + badge);
// il revisore apre la copia in una nuova scheda: pannello di revisione affiancato
const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(7000);
const pe = (f, a) => pop.evaluate(f, a);
s = await pe(() => ({bar:(document.getElementById('giro-bar') || {}).textContent || '', dock:!!document.getElementById('rv-dock'), t:(document.getElementById('rv-dock') || {}).innerText || '', hd:getComputedStyle(document.querySelector('.hd-links') || document.body).display, side:Array.from(document.querySelectorAll('#sh-side .sh-si')).filter(b => getComputedStyle(b).display !== 'none').map(b => b.getAttribute('data-id')).join(',')}));
ok(/COPIA INVIATA DA ANNA ROSSI/.test(s.bar) && /pannello «Revisione»/.test(s.bar), 'banner della copia: «COPIA INVIATA DA ANNA ROSSI»: ' + s.bar.slice(0, 60));
ok(s.dock && /Revisione · Giro 1/.test(s.t) && /Check-list/.test(s.t) && /Il tuo esito/.test(s.t) && /Concludi la revisione/.test(s.t) && /Scarica il Word/.test(s.t), 'pannello di revisione a fianco della copia');
ok(s.hd === 'none' && !/pp0|ppi|pp4|pp5/.test(s.side), 'nella copia sono nascosti Progetti/profilo e le sezioni non inviate (menu: ' + s.side + ')');
const blocked = await pe(() => { let r = 'nessun avviso'; const f = window.showToast; window.showToast = m => { r = m; }; shProfileOpen(); shGoHome(); clOpen(); window.showToast = f; return r; });
ok(/sola lettura/.test(blocked), 'profilo, progetti e archivio del titolare non si aprono: ' + blocked.slice(0, 50));
await sleep(1500);
const cur2 = await pe(() => window._rv.sec); ok(cur2 === 2 || cur2 === 1, 'la sezione corrente segue la lettura (sezione ' + cur2 + ')');
await pe(() => { rvVai(2); }); await sleep(600);
await pe(() => rvSt(2, 'rivedere')); await sleep(400); await pe(() => rvNota(2, 'Gli obiettivi sono troppo generici')); await sleep(400);
await pe(() => rvCk('a1', 'si')); await sleep(300); await pe(() => rvCk('b2', 'parz')); await sleep(300); await pe(() => rvCk('b3', 'no')); await sleep(300);
await pe(() => rvEs('da_integrare')); await sleep(300); await pe(() => rvEsNota('Rivedi la sezione 2')); await sleep(400);
const mine = db.t.pee_giri_rev.filter(x => x.giro_id === g0.id);
ok(mine.length === 6 && mine.every(x => x.autore_ruolo === 'revisore' && x.autore_nome === 'Luca Prova'), 'salvati 6 riscontri (stato, nota, 3 criteri, esito) a nome del revisore: ' + mine.length);
ok(mine.find(x => x.tipo === 'check' && x.chiave === 'b2').valore === 'parz', 'il criterio «in parte» viene salvato');
await pe(() => rvCk('a1', 'si')); await sleep(300); ok(!db.t.pee_giri_rev.some(x => x.chiave === 'a1'), 'un secondo clic toglie la risposta');
await pop.setViewportSize({width:390, height:760}); await sleep(600);
s = await pe(() => { const d = document.getElementById('rv-dock'), r = d.getBoundingClientRect(); return {closedTop: Math.round(r.top), vh: innerHeight, bw: document.documentElement.scrollWidth, vw: innerWidth}; });
ok(s.closedTop >= s.vh - 60 && s.bw <= s.vw + 1, 'su telefono il pannello è una barra in basso (chiusa) e non fa scorrere di lato: ' + JSON.stringify(s));
await pe(() => rvDockToggle()); await sleep(600);
s = await pe(() => { const d = document.getElementById('rv-dock'), r = d.getBoundingClientRect(); return {top: Math.round(r.top), vh: innerHeight, sw: d.scrollWidth, cw: d.clientWidth}; });
ok(s.top < s.vh - 200 && s.sw <= s.cw + 1, 'aperto copre la parte bassa e resta nei bordi: ' + JSON.stringify(s));
await pop.setViewportSize({width:1280, height:900}); await pe(() => rvDockToggle()); await sleep(300);
await pe(() => rvConcludiDock(true)); await sleep(500);
ok(db.t.pee_giri_rev.some(x => x.tipo === 'stato' && x.chiave === 'chiuso' && x.giro_id === g0.id), 'il revisore conclude la revisione dal pannello');
await pop.close();
// elenco: giro rivisto in verde, progetto concluso
await el(() => { shGoHome(); }); await sleep(2500);
s = await el(() => { const b = document.getElementById('cl-rev'); return {t:b.textContent, done:!!b.querySelector('.rv-done'), closed:!!b.querySelector('.rv-closed')}; });
ok(s.done && s.closed && /Concluso/.test(s.t) && /Da integrare/.test(s.t), 'elenco: giro rivisto in verde, progetto «Concluso» e esito visibile');
await el(() => rvConcludi(window._rvL[0].g.archivio_id, false)); await sleep(900);
ok(!db.t.pee_giri_rev.some(x => x.chiave === 'chiuso'), 'si può riaprire la revisione dall’elenco');
// pacchetto: file generato e scaricato
const [dl] = await Promise.all([PL.waitForEvent('download', {timeout:20000}).catch(() => null), el(a => rvPackage(a), g0.archivio_id)]);
ok(!!dl && /Pacchetto revisione - Anna Rossi/.test(dl.suggestedFilename()), 'il pacchetto del progetto si scarica: ' + (dl && dl.suggestedFilename()));
// in copia: solo note
const pg = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PG = pg.page, eg = (f, a) => PG.evaluate(f, a);
await loginAs(PG, base, G); await sleep(1500);
const L2 = await eg(async () => (await rvListLoad()).map(x => x.g.n + ':' + x.ruolo).join()); ok(L2 === '1:copia', 'il Capo Gruppo ha il giro come «in copia»');
const [popg] = await Promise.all([PG.context().waitForEvent('page', {timeout:15000}), eg(id => rvOpen(id), g0.id)]);
await popg.waitForLoadState('domcontentloaded'); await sleep(7000);
s = await popg.evaluate(() => (document.getElementById('rv-dock') || {}).innerText || 'nessun pannello'); ok(!/Il tuo esito/.test(s) && !/Check-list/.test(s) && /in copia/.test(s), 'in copia: pannello con soli suggerimenti, niente esito né check-list');
await popg.evaluate(() => rvNota(1, 'Ottimo punto di partenza')); await sleep(400);
ok(await el(async () => (await rvListLoad()).length) === 1, 'resta un solo progetto nell’elenco del revisore'); await popg.close();
ok(db.t.pee_giri_rev.some(x => x.autore_ruolo === 'copia' && x.tipo === 'nota' && x.testo === 'Ottimo punto di partenza'), 'il suggerimento in copia viene salvato');
const bad = await eg(async id => (await CL.sb.from('pee_giri_rev').insert({giro_id:id, tipo:'esito', chiave:'esito', valore:'approva', autore_ruolo:'copia'})).error ? 'rifiutato' : 'passato', g0.id);
ok(bad === 'rifiutato', 'chi è in copia non può dare un esito, nemmeno dal database');
// compilatore: vede i riscontri e li segna recepiti
await ev(() => shPP('i')); await sleep(2500);
s = await ev(() => { const e = document.getElementById('gfb-' + Object.keys(ppGiri())[0]); return e ? e.innerText : 'nessun contenitore'; });
ok(/Luca Prova/.test(s) && /Da integrare/.test(s) && /Rivedi la sezione 2/.test(s) && /troppo generici/.test(s), 'la compilatrice vede il revisore, l’esito e le note');
ok(/Capo Gruppo/.test(s) && /Ottimo punto/.test(s), 'e il suggerimento di chi è in copia');
ok(/Prima parte approvata/.test(await ev(() => document.body.innerText)) === false, 'non ancora approvato: la consegna finale resta chiusa');
const rid = db.t.pee_giri_rev.find(x => x.user_id === L.id && x.tipo === 'nota').id; await ev(id => ppGiroFbRec(Object.keys(ppGiri())[0], id, true), rid); await sleep(500);
ok(db.t.pee_giri_rev.some(x => x.recepita === true), '«recepita» si segna e resta nel database');
const [pop2] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop2.waitForLoadState('domcontentloaded'); await sleep(7000);
s = await pop2.evaluate(() => (document.getElementById('rv-dock') || {}).innerText || ''); ok(/recepita/i.test(s), 'il revisore vede «✓ Recepita» accanto alla sua osservazione'); await pop2.close();
// approvazione in app: sblocca la consegna finale
db.t.pee_giri_rev.filter(x => x.user_id === L.id && x.tipo === 'esito').forEach(x => { x.valore = 'approva'; x.updated_at = new Date(Date.now() + 5000).toISOString(); });
await ev(() => { ppGiroFbAll(); }); await sleep(2000); await ev(() => shPP('i')); await sleep(2500);
s = await ev(() => ({ap: ppIter().apprB1 || null, t: document.body.innerText}));
ok(s.ap && /Luca Prova/.test(s.ap.chi) && /in app/.test(s.ap.chi), 'l’approvazione data in app viene registrata da sola: ' + JSON.stringify(s.ap));
ok(/Prima parte approvata/.test(s.t), 'la pagina mostra la prima parte approvata');
// ripensamento: il revisore cambia esito e l'approvazione si ritira da sola
db.t.pee_giri_rev.filter(x => x.user_id === L.id && x.tipo === 'esito').forEach(x => { x.valore = 'chiarimenti'; x.updated_at = new Date(Date.now() + 9000).toISOString(); });
await ev(() => { ppGiroFbAll(); }); await sleep(2500);
s = await ev(() => ({ap: ppIter().apprB1 || null})); ok(!s.ap, 'se il revisore cambia esito, l’approvazione data in app si ritira: ' + JSON.stringify(s.ap));
// l'approvazione registrata a mano non si tocca
await ev(() => { ppApprB1Set('Tutor Marco', '2026-11-13'); ppGiroFbAll(); }); await sleep(2000);
ok(await ev(() => !!ppIter().apprB1 && ppIter().apprB1.chi === 'Tutor Marco'), 'l’approvazione registrata a mano resta');
// interruttore chiuso: perde l'accesso alla revisione ma non al resto
db.ammessi = [];
const L3 = await el(async () => (await rvListLoad()).length); ok(L3 === 1 || L3 === 0, 'dopo la revoca l’elenco non va in errore: ' + L3);
summary(); process.exit(0);
