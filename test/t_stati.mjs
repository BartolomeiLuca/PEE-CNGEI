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
ok(/Tocca a te/.test(s) && /Da fare/.test(s) && /Ho finito, può rileggere/.test(s) && !/Invia un nuovo giro/.test(s), 'compilatore: turno, chip «Da fare», «Ho finito», nessun nuovo invio a parte');
ok(await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled), '«Ho finito» è spento finché ci sono punti da fare');
await ev(() => { const t = document.querySelector('#rp-dock .rv-st textarea'); t.value = 'Aggiunto il Quartiere San Carlo'; const b = Array.from(document.querySelectorAll('#rp-dock .rv-st .rv-b')).find(x => /Fatto/.test(x.textContent)); b.click(); }); await sleep(1200);
const pu = db.t.pee_revisioni_punto[0]; ok(pu.stato === 'fatto' && /San Carlo/.test(pu.nota), 'il compilatore segna «Fatto» con una riga di nota');
ok(!(await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled)), '«Ho finito» si accende');
await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').click()); await sleep(3500);
v = db.t.pee_revisioni[0]; ok(db.t.pee_giri.length === 2 && v.fase === 'revisore' && v.ultimo_giro_id === db.t.pee_giri[1].id, '«Ho finito» congela la copia 2 e passa il turno al revisore: giri ' + db.t.pee_giri.length + ', fase ' + v.fase);
ok(db.t.pee_giri_dest.some(d => d.giro_id === db.t.pee_giri[1].id && d.email === 'luca.bartolomei@cngei.it'), 'la copia 2 va allo stesso revisore');
// revisore conferma e approva
await pe(() => rvSync()); await sleep(1500);
s = await pe(() => document.getElementById('rv-dock').innerText);
ok(/◐ Fatto/.test(s), 'elenco del revisore: stato «Fatto»'); await pe(() => { rvDocOpen(_rd.pts[0].key); }); await sleep(800); await pe(() => { const b = Array.from(document.querySelectorAll('#rv-doc .rv-st .rv-b')).find(x => /Conferma/.test(x.textContent)); b.click(); }); await sleep(1200);
ok(db.t.pee_revisioni_punto[0].stato === 'confermato', 'il revisore conferma il punto');
s = await pe(() => document.getElementById('rv-dock').innerText); ok(/Approva e chiudi la revisione/.test(s), 'con tutto confermato compare «Approva»');
await pe(() => { document.getElementById('rv-ap-n').value = 'Ottimo lavoro'; document.querySelector('#rv-dock .rv-b[onclick*=approva]').click(); }); await sleep(1200);
v = db.t.pee_revisioni[0]; ok(v.stato === 'chiusa' && v.esito === 'approvata' && v.nota_chiusura === 'Ottimo lavoro', 'approvata e chiusa');
await ev(() => rpLoad()); await sleep(1500); s = await ev(() => document.getElementById('rp-dock') ? document.getElementById('rp-dock').innerText : '');
ok(/Revisione chiusa/.test(s) && /Invia un nuovo giro/.test(s), 'compilatore: revisione chiusa e di nuovo possibile un nuovo invio');
// backup in blocco (compilatore)
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:170000}), ev(() => rvBackupMine())]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const names = Object.keys(z.files);
ok(names.some(n => /dati\/storico_completo\.json$/.test(n)) && names.some(n => /Storico della revisione\.docx$/.test(n)) && names.some(n => /LEGGIMI\.txt$/.test(n)), 'archivio del compilatore: dati, Word dello storico, LEGGIMI: ' + names.length + ' file');
const js = JSON.parse(await z.file(names.find(n => /storico_completo\.json$/.test(n))).async('string'));
ok(js.copie.length === 2 && js.punti.length === 1 && js.revisioni[0].esito === 'approvata' && js.commenti.some(c => c.tipo === 'nota'), 'il file dati contiene copie, punti, commenti ed esito');
ok(names.some(n => /copie\/Copia 1[^/]*\/Copia 1.*\.docx$/.test(n)), 'ogni copia è anche in Word');
// backup (revisore, tutti i progetti)
await el(() => rvListPaint()); await sleep(1500);
const [d2] = await Promise.all([PL.waitForEvent('download', {timeout:170000}), el(() => rvBackupAll())]);
const z2 = await JSZip.loadAsync(fs.readFileSync(await d2.path())); const n2 = Object.keys(z2.files);
ok(n2.some(n => /storico_completo\.json$/.test(n)) && n2.some(n => /Storico della revisione\.docx$/.test(n)), 'archivio del revisore (tutti i progetti): ' + n2.length + ' file');
summary();
await br.close();
