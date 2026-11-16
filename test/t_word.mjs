// Revisione unica: stati dei punti, turni, Ho finito / Rimanda / Approva, backup dello storico
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const JSZip_unused = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
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
await pe(() => rvSync()); await sleep(800);
console.log('DOCKBOZZA', (await pe(() => document.getElementById('rv-dock').innerText)).replace(/\n+/g,' | ').slice(0,700));
await pe((a) => rvAzione(a, 'rimanda'), aid); await sleep(900);
ok(/Aggiungi il quartiere/.test(await pe(() => { const e = document.querySelector('#rv-dock .rv-mr'); return e ? e.textContent : ''; })), 'dopo l’invio (Rimanda) l’elenco delle mie richieste è consultabile');
console.log('DOCKRIMANDATO', (await pe(() => document.getElementById('rv-dock').innerText)).replace(/\n+/g,' | ').slice(0,900));
// compilatore sistema e finisce
await ev(() => rpLoad()); await sleep(1200); await ev(() => rpTog()); await sleep(500); await ev(() => rpGo(0)); await sleep(3500);
await ev(() => { const b = Array.from(document.querySelectorAll('.rp-inl .rv-st .rv-b')).find(x => /Ho fatto/.test(x.textContent)); b.click(); }); await sleep(1200);
{ const p0 = db.t.pee_revisioni_punto[0]; db.t.pee_revisioni_punto.push(Object.assign({}, p0, {id:'zz8', chiave:'c:9|vuoto|riga-svuotata', stato:'da_fare', nota:''})); }
await ev(() => rpLoad()); await sleep(2000); await ev(() => { if(!document.getElementById('rp-dock') || !document.getElementById('rp-dock').innerText) rpTog(); }); await sleep(600);
ok(await ev(() => /Altri punti da chiudere/.test(document.getElementById('rp-dock').innerText) && document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled), 'compilatore: un punto aperto senza testo è elencato e blocca «Ho finito»');
await ev(() => { const b = Array.from(document.querySelectorAll('#rp-dock .rv-pend .rv-b')).find(x => /Ho fatto/.test(x.textContent)); b.click(); }); await sleep(1800);
ok(await ev(() => !document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').disabled), 'chiuso quel punto, «Ho finito» si accende');
await ev(() => document.querySelector('#rp-dock .rv-b[onclick*=ho_finito]').click()); await sleep(4000);
await sleep(9000);
console.log('DOCKDOPOFINITO', (await pe(() => document.getElementById('rv-dock').innerText)).replace(/\n+/g,' | ').slice(0,900));
// un punto «fatto» senza nota né ancoraggio nel testo (come quello dello screen: contatore 5/6 e nessun posto dove confermare)
const p0 = db.t.pee_revisioni_punto[0]; db.t.pee_revisioni_punto.push(Object.assign({}, p0, {id:'zz7', chiave:'c:9|punto-orfano|riga-fantasma', stato:'fatto', nota:'sistemato'}));
await pe(() => rvSync()); await sleep(3000);
const pend = await pe(() => { const e = document.querySelector('#rv-dock .rv-pend'); return e ? e.textContent : ''; });
ok(/Da confermare/.test(pend) && /Contesto territoriale/.test(pend) && /Punto orfano/.test(pend), 'il revisore vede elencati TUTTI i punti da confermare, anche quello senza posizione: ' + pend.replace(/\s+/g, ' ').slice(0, 160));
await pe(() => { document.querySelectorAll('#rv-dock .rv-pend .rv-st').forEach(b => { const c = Array.from(b.querySelectorAll('.rv-b')).find(x => x.textContent.trim() === 'Conferma'); if(c) c.click(); }); }); await sleep(2500);
ok(db.t.pee_revisioni_punto.every(x => x.stato === 'confermato'), 'si confermano da lì: stati ' + db.t.pee_revisioni_punto.map(x => x.stato).join(','));
ok(await pe(() => { const b = Array.from(document.querySelectorAll('#rv-dock .rv-b')).find(x => x.textContent.trim() === 'Approva'); return !!b && !b.disabled; }), '«Approva» si accende');
// revisore conferma
await pe(() => rvSync()); await sleep(1500);
await pe(() => { const k = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)).key; rvDocOpen(k); }); await sleep(600);
await pe(() => { const b = Array.from(document.querySelectorAll('#rv-doc .rv-b')).find(x => /Confermo|Conferm/.test(x.textContent)); if(b) b.click(); }); await sleep(1200);
// revisore approva subito senza altre richieste
await pe((a) => rvAzione(a, 'approva'), aid); await sleep(1200);
ok(db.t.pee_revisioni[0].stato === 'chiusa', 'giro 1 (1-3) approvato');
const mr = async (w) => pe(() => { const e = document.querySelector('#rv-dock .rv-mr'); return e ? e.textContent : ''; });
ok(/Le mie richieste/.test(await mr()) && /Aggiungi il quartiere/.test(await mr()) && /Confermato/.test(await mr()), 'dopo l’approvazione l’elenco delle mie richieste è consultabile: testo, giro, stato');
console.log('DOCKAPPR', (await pe(() => document.getElementById('rv-dock').innerText)).replace(/\n+/g,' | ').slice(0,900));
await pop.close();
// il compilatore invia il progetto completo 1-5, senza toccare nulla
await ev(() => ppGiroForm(2)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', false)); });
await ev(() => ppGiroCongela()); await sleep(3000);
ok(db.t.pee_giri.length === 3 && db.t.pee_giri[2].sezioni.length === 5, 'secondo invio 1-5: ' + JSON.stringify(db.t.pee_giri.map(g => g.sezioni)));
const JSZip = JSZip_unused;

await el(() => rvListPaint()); await sleep(1500);
const t0 = Date.now();
const [dl] = await Promise.all([PL.waitForEvent('download', {timeout:600000}), el(() => rvBackupAll())]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const names = Object.keys(z.files);
console.log('PKG', Math.round((Date.now() - t0) / 1000) + 's', names.filter(n => /\.docx$/.test(n)).join(' | '));
const lg = names.find(n => /LEGGIMI/.test(n)); console.log('LEGGIMI', (await z.file(lg).async('string')).split('Note:')[1] || '(nessuna nota)');
ok(names.filter(n => /copie\/.*\.docx$/.test(n)).length === 3, 'Word presente per tutte e 3 le copie');
summary(); await br.close(); process.exit(0);
