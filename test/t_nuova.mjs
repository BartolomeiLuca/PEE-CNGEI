// Revisione unica: stati dei punti, turni, Ho finito / Rimanda / Approva, backup dello storico
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
await pop.click('#rv-doc textarea'); await sleep(300);
ok(await pe(() => !document.querySelector('#rv-doc .rt-ed') && document.activeElement && document.activeElement.tagName === 'TEXTAREA'), 'revisore: il campo resta una textarea normale (niente riquadro formattato che fa saltare la pagina)');
await pe(() => { const t = document.querySelector('#rv-doc textarea'); t.value = 'Aggiungi il quartiere'; const b = Array.from(document.querySelectorAll('#rv-doc button')).find(x => /Aggiungi richiesta/.test(x.textContent)); b.click(); }); await sleep(1200);
ok(db.t.pee_revisioni_punto.length === 1 && db.t.pee_revisioni_punto[0].stato === 'da_fare', 'il commento diventa un punto «da fare»');
await pe(() => rvSync()); await sleep(1200);
let s = await pe(() => document.getElementById('rv-dock').innerText);
ok(/Tocca a te/.test(s) && /Invia le richieste di revisione \(1\)/.test(s) && await pe(() => { const b = Array.from(document.querySelectorAll('#rv-dock .rv-b')).find(x => x.textContent.trim() === 'Approva'); return !!b && b.disabled; }), 'revisore: turno, richieste inviabili e «Approva» spento con punti da fare');
await pe((a) => rvAzione(a, 'rimanda'), aid); await sleep(900);
ok(db.t.pee_revisioni[0].fase === 'compilatore', '«Rimanda» passa il turno al compilatore');
s = await pe(() => document.getElementById('rv-dock').innerText); ok(/Tocca a chi ha scritto/.test(s), 'revisore: ora tocca al compilatore');
// compilatore
await ev(() => rpLoad()); await sleep(1500); await ev(() => rpTog()); await sleep(600);
s = await ev(() => document.getElementById('rp-dock').innerText);
ok(/Tocca a te/.test(s) && /Da fare/.test(s) && /Ho finito, può rileggere/.test(s) && !/Invia un nuovo giro/.test(s), 'compilatore: turno, chip «Da fare», «Ho finito», nessun nuovo invio a parte');
ok(await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled), '«Ho finito» è spento finché ci sono punti da fare');
await ev(() => rpGo(0)); await sleep(3500);
ok(await ev(() => !!document.querySelector('.rp-inl') && !document.querySelector('#rp-dock .rv-st .rv-b') && !document.querySelector('#rp-dock textarea')), 'compilatore: nell’elenco a destra niente pulsanti né campi, solo il link; il pannello è nel progetto');
await ev(() => { const b = Array.from(document.querySelectorAll('.rp-inl .rv-st .rv-b')).find(x => /Ho fatto/.test(x.textContent)); b.click(); }); await sleep(1200);
const pu = db.t.pee_revisioni_punto[0]; ok(pu.stato === 'fatto' , 'il compilatore segna «Fatto» con una riga di nota');
ok(!(await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled)), '«Ho finito» si accende');
await ev(() => { scheda.pp.ctxSez = 'Cambiato dal compilatore senza che nessuno lo chiedesse'; saveData(true); }); await sleep(600);
await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').click()); await sleep(3500);
v = db.t.pee_revisioni[0]; ok(db.t.pee_giri.length === 2 && v.fase === 'revisore' && v.ultimo_giro_id === db.t.pee_giri[1].id, '«Ho finito» congela la copia 2 e passa il turno al revisore: giri ' + db.t.pee_giri.length + ', fase ' + v.fase);
ok(db.t.pee_giri_dest.some(d => d.giro_id === db.t.pee_giri[1].id && d.email === 'luca.bartolomei@cngei.it'), 'la copia 2 va allo stesso revisore');

// ── RIPRODUZIONE 16/11: il revisore ha ancora aperto il documento del giro 1 ──
await sleep(14000);
const info = await pe(() => ({gid:(window._rd||{g:{}}).g.id, txt:document.getElementById('rv-doc').innerText.includes('Cambiato dal compilatore senza che nessuno lo chiedesse'), href:location.hash}));
console.log('POP (giro1) dopo Ho finito:', JSON.stringify(info), 'giro2=', db.t.pee_giri[1].id);
ok(info.gid === db.t.pee_giri[1].id || info.txt, 'il documento del revisore, già aperto, passa alla nuova copia o mostra la modifica');
summary(); await br.close();