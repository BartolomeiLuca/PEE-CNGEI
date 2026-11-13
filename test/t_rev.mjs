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
ok(/giri da rivedere/i.test(s) && /Anna Rossi/.test(s) && /Giro 1/.test(s) && /Rivedi/.test(s), 'nella home del revisore compare «Giri da rivedere» con il pulsante Rivedi: ' + s.replace(/\n/g,' | ').slice(0,120));
const L1 = await el(async () => (await rvListLoad()).map(x => x.g.n + ':' + x.ruolo).join());
ok(L1 === '1:revisore', 'il revisore ha il giro nell’elenco «da rivedere» con il ruolo giusto: ' + L1);
await el(id => rvOpen(id), g0.id); await sleep(700);
s = await el(() => { const o = document.getElementById('rv-ov'); return {show: !!o && o.classList.contains('show'), t: o ? o.innerText : ''}; });
ok(s.show && /Anna Rossi/.test(s.t) && /copia inviata/.test(s.t) && /Check-list/.test(s.t) && /Il tuo esito/.test(s.t), 'schermata del revisore: intestazione, avviso copia, check-list ed esito');
await el(() => { rvSt(2, 'rivedere'); }); await sleep(400);
await el(() => rvNota(2, 'Gli obiettivi sono troppo generici')); await sleep(400);
await el(() => rvCk('a1', 'si')); await sleep(300); await el(() => rvCk('b2', 'parz')); await sleep(300); await el(() => rvCk('b3', 'no')); await sleep(300);
await el(() => rvEs('da_integrare')); await sleep(300); await el(() => rvEsNota('Rivedi la sezione 2')); await sleep(400);
const mine = db.t.pee_giri_rev.filter(x => x.giro_id === g0.id);
ok(mine.length === 6 && mine.every(x => x.autore_ruolo === 'revisore' && x.autore_nome === 'Luca Prova'), 'salvati 6 riscontri (stato, nota, 3 criteri, esito) a nome del revisore: ' + mine.length);
ok(mine.find(x => x.tipo === 'check' && x.chiave === 'b2').valore === 'parz', 'il criterio «in parte» viene salvato');
await el(() => rvCk('a1', 'si')); await sleep(300);   // secondo clic: toglie
ok(!db.t.pee_giri_rev.some(x => x.chiave === 'a1'), 'un secondo clic toglie la risposta');
s = await el(() => document.getElementById('rv-ov').innerText);
ok(/1 su \d+ con «Sì»|0 su \d+ con «Sì»/.test(s), 'il conteggio della check-list si aggiorna');
await el(() => { rvClose(); return rvListPaint(); }); await sleep(600);
s = await el(() => document.getElementById('cl-rev').innerText); ok(/Da integrare/.test(s) && /Apri/.test(s), 'dopo l’esito l’elenco mostra «Da integrare» e il pulsante Apri');
await PL.setViewportSize({width:320, height:568}); await el(id => rvOpen(id), g0.id); await sleep(700);
s = await el(() => { const b = document.getElementById('rv-ov').firstElementChild; return {sw:b.scrollWidth, cw:b.clientWidth, bw:document.documentElement.scrollWidth, vw:innerWidth}; });
ok(s.sw <= s.cw + 1 && s.bw <= s.vw + 1, 'a 320 px la schermata di revisione non esce dai bordi: ' + JSON.stringify(s));
await el(() => rvClose()); await PL.setViewportSize({width:1280, height:900});
// in copia: solo note
const pg = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PG = pg.page, eg = (f, a) => PG.evaluate(f, a);
await loginAs(PG, base, G); await sleep(1500);
const L2 = await eg(async () => (await rvListLoad()).map(x => x.g.n + ':' + x.ruolo).join()); ok(L2 === '1:copia', 'il Capo Gruppo ha il giro come «in copia»');
await eg(id => rvOpen(id), g0.id); await sleep(700);
s = await eg(() => document.getElementById('rv-ov').innerText); ok(!/Il tuo esito/.test(s) && !/Check-list/.test(s) && /in copia/.test(s), 'in copia: niente esito né check-list');
await eg(() => rvNota(1, 'Ottimo punto di partenza')); await sleep(400);
ok(db.t.pee_giri_rev.some(x => x.autore_ruolo === 'copia' && x.tipo === 'nota' && x.testo === 'Ottimo punto di partenza'), 'il suggerimento in copia viene salvato');
const bad = await eg(async id => (await CL.sb.from('pee_giri_rev').insert({giro_id:id, tipo:'esito', chiave:'esito', valore:'approva', autore_ruolo:'copia'})).error ? 'rifiutato' : 'passato', g0.id);
ok(bad === 'rifiutato', 'chi è in copia non può dare un esito, nemmeno dal database');
// compilatore: vede i riscontri e li segna recepiti
await ev(() => shPP('i')); await sleep(2500);
s = await ev(() => { const e = document.getElementById('gfb-' + Object.keys(ppGiri())[0]); return e ? e.innerText : 'nessun contenitore'; });
ok(/Luca Prova/.test(s) && /Da integrare/.test(s) && /Rivedi la sezione 2/.test(s) && /troppo generici/.test(s), 'la compilatrice vede il revisore, l’esito e le note');
ok(/Capo Gruppo/.test(s) && /Ottimo punto/.test(s), 'e il suggerimento di chi è in copia');
ok(/Prima parte approvata/.test(await ev(() => document.body.innerText)) === false, 'non ancora approvato: la consegna finale resta chiusa');
await ev(() => { const c = document.querySelector('#gfb-' + Object.keys(ppGiri())[0] + ' input[type=checkbox]'); c.click(); }); await sleep(500);
ok(db.t.pee_giri_rev.some(x => x.recepita === true), '«recepita» si segna e resta nel database');
// approvazione in app: sblocca la consegna finale
await el(id => rvOpen(id), g0.id); await sleep(600); await el(() => rvEs('approva')); await sleep(400); await el(() => rvClose());
await ev(() => { ppGiroFbAll(); }); await sleep(2000); await ev(() => shPP('i')); await sleep(2500);
s = await ev(() => ({ap: ppIter().apprB1 || null, t: document.body.innerText}));
ok(s.ap && /Luca Prova/.test(s.ap.chi) && /in app/.test(s.ap.chi), 'l’approvazione data in app viene registrata da sola: ' + JSON.stringify(s.ap));
ok(/Prima parte approvata/.test(s.t), 'la pagina mostra la prima parte approvata');
// interruttore chiuso: perde l'accesso alla revisione ma non al resto
db.ammessi = [];
const L3 = await el(async () => (await rvListLoad()).length); ok(L3 === 1 || L3 === 0, 'dopo la revoca l’elenco non va in errore: ' + L3);
summary(); process.exit(0);
