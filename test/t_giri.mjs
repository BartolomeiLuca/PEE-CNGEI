// Giri di revisione del PP: congela, destinatari, tester / ammesso, migrazione dei vecchi invii, nessun tetto
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
// vecchi invii segnati a mano, come li avrebbe un progetto già in uso
await ev(() => { scheda.pp.iter = {prima:{date:'2026-10-01'}, finale:{date:'2026-11-01'}, riscontri:[{date:'2026-10-10', note:'ok'}]}; scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'tutor@x.it', cgMail:'cg@x.it', cdsMail:'', tono:'sobrio', l1:'', l2:'', body:'', edited:false}; saveData(true); }); await sleep(800);
await ev(() => shPP('i')); await sleep(600);
let s = await ev(() => ({L: ppGiriList().map(g => [g.n, g.hist, g.sez.join('')]), html: document.body.innerText.includes('Prima consegna · Sezioni 1–3'), isc: scheda.pp.iter.riscontri.length}));
ok(JSON.stringify(s.L) === '[[1,true,"123"],[2,true,"12345"]]', 'i due invii già segnati diventano Giro 1 e Giro 2 (storici): ' + JSON.stringify(s.L));
ok(s.html && s.isc === 1, 'la pagina mostra «Prima consegna · Sezioni 1–3» e i riscontri restano');
await P.setViewportSize({width:320, height:568}); await ev(() => ppGiroForm(1)); await sleep(900);
s = await ev(() => { const b = document.getElementById('pp-giro-ov').firstElementChild; return {sw: b.scrollWidth, cw: b.clientWidth, bw: document.documentElement.scrollWidth, vw: innerWidth}; });
ok(s.sw <= s.cw + 1 && s.bw <= s.vw + 1, 'su schermo stretto (320 px) il modulo non esce dai bordi: ' + JSON.stringify(s));
await ev(() => ppGiroFormClose()); await P.setViewportSize({width:1280, height:900});
// apro il modulo: proposta di default e blocco per i tester
await ev(() => ppGiroForm(1)); await sleep(1200);
s = await ev(() => { const ov = document.getElementById('pp-giro-ov'); const t = ov.innerText; return {t, tutor: ov.querySelectorAll('input[type=email]')[0].value, icdf: ov.querySelectorAll('input[type=email]')[1].value, dis: [...ov.querySelectorAll('input[type=email]')].map(e => e.parentElement.querySelector('input[type=checkbox]').disabled).join(), title: /Giro 3/.test(t)}; });
ok(s.title && /Prima consegna/.test(s.t) && !/Che cosa copre il giro/.test(s.t), 'il nuovo giro è il Giro 3, nel blocco Prima consegna, senza scelta delle sezioni'); ok(s.tutor === 'tutor@x.it' && s.icdf === 'rcdf.altoadriatico@cngei.it', 'Tutor e ICdF precompilati');
ok(/Funzione in preparazione: la condivisione in app con Tutor e ICdF non è ancora attiva/.test(s.t), 'disclaimer per i tester accanto a Tutor/ICdF');
ok(s.dis === 'true,true,false,true', '«Condividi in app» disabilitato per Tutor e ICdF (e abilitato per Capo Gruppo)');
// indirizzo ammesso: il pulsante si abilita e il disclaimer sparisce per quella riga
await ev(() => ppGiroDest(0, 'email', 'Luca.Bartolomei@cngei.it')); await sleep(900);
s = await ev(() => { const ov = document.getElementById('pp-giro-ov'); const row = ov.querySelectorAll('input[type=email]')[0].parentElement; return {dis: row.querySelector('input[type=checkbox]').disabled, msg: /in preparazione/.test(row.innerText)}; });
ok(!s.dis && !s.msg, 'con l’indirizzo ammesso la riga si abilita e il disclaimer scompare');
await ev(() => { ppGiroDest(0, 'app', true); ppGiroDest(2, 'app', true); ppGiroDest(1, 'mail', false); ppGiroDest(2, 'mail', false); ppGiroDest(3, 'mail', false); ppGiroDest(0, 'mail', false); ppGiroFormSet('nota', 'Guarda soprattutto la 2'); ppGiroSez(4, false); ppGiroSez(5, false); }); await sleep(300);
await ev(() => ppGiroCongela()); await sleep(2500);
const cloud = () => db.t.pee_giri.filter(g => g.archivio_id === db.t.pee_archivi[0].id);
let c = cloud();
ok(c.length === 1 && c[0].n === 3, 'copia nel cloud con numero 3 (dopo i due storici): n=' + (c[0] && c[0].n));
ok(c[0].sezioni.join() === '1,2,3' && c[0].nota === 'Guarda soprattutto la 2' && c[0].nomi_inclusi === true, 'sezioni, nota e nomi registrati');
ok(c[0].data.scheda && c[0].data.scheda.pp && !c[0].data.scheda.pp.giri && !c[0].data.scheda.pp.mail && !c[0].data.scheda.pp.iter, 'la copia non contiene i giri, la mail né le date degli invii');
ok(db.t.pee_giri_dest.length === 2 && db.t.pee_giri_dest.some(d => d.email === 'luca.bartolomei@cngei.it' && d.ruolo === 'revisore') && db.t.pee_giri_dest.some(d => d.email === 'cg@x.it' && d.ruolo === 'copia'), 'condiviso in app con il revisore ammesso e con il Capo Gruppo (in copia)');
s = await ev(() => ({L: ppGiriList().map(g => g.n + ':' + !!g.hist), ov: document.getElementById('pp-giro-ov').classList.contains('show'), mail: !!document.querySelector('#pp-mail-ov.show')}));
ok(s.L.join() === '1:true,2:true,3:false', 'il Giro 3 è registrato in locale'); ok(!s.ov && !s.mail, 'modulo chiuso e nessuna mail aperta (mail non richiesta)');
// secondo giro con mail richiesta, senza nomi: numero 4, nessun tetto
await ev(() => ppGiroForm(1)); await sleep(600);
await ev(() => { ppGiroFormSet('nomi', false); }); await ev(() => ppGiroCongela()); await sleep(2500);
c = cloud(); s = await ev(() => ({mail: !!document.querySelector('#pp-mail-ov.show'), n: ppGiriList().length}));
ok(c.length === 2 && c[1].n === 4 && c[1].nomi_inclusi === false && !c[1].data.scheda.griglia, 'Giro 4 senza griglia osservativa'); ok(s.mail, 'mail richiesta: si apre il compositore');
// un tester (non ammesso) non può inserire un revisore neanche dal database
const bad = await ev(async (gid) => (await CL.sb.from('pee_giri_dest').insert({giro_id:gid, email:'tutor@x.it', ruolo:'revisore', nome:'x'})).error ? 'rifiutato' : 'passato', c[0].id);
ok(bad === 'rifiutato', 'il database rifiuta un revisore non ammesso anche chiamato direttamente');
// il revisore ammesso legge la copia, il tester no
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); await loginAs(pl.page, base, L); await sleep(1500);
const rl = await pl.page.evaluate(async () => (await CL.sb.from('pee_giri').select('id,n').order('n')).data.map(x => x.n).join());
ok(rl === '3', 'il revisore ammesso vede solo il Giro 3 (il 4 non è condiviso con lui)');
const noarch = await pl.page.evaluate(async () => (await CL.sb.from('pee_archivi').select('id')).data.length);
ok(noarch === 0, 'il revisore non vede il progetto vivo');
// riaprendo la pagina la migrazione non si ripete
await ev(() => { delete scheda.pp.giri['h1']; saveData(true); shPP('i'); }); await sleep(500);
ok(await ev(() => !ppGiri()['h1']), 'la migrazione dei vecchi invii avviene una volta sola');

// blocchi: la consegna finale si apre solo con la prima parte approvata; riscontri dentro il giro; apri la copia
await ev(() => { scheda.pp.giri = {}; scheda.pp.giriMig = 1; scheda.pp.iter = {}; shPP('i'); }); await sleep(500);
s = await ev(() => ({b2: ppBloccoHTML(2), b1: ppBloccoHTML(1)}));
ok(/si apre quando la prima parte è approvata/.test(s.b2) && !/ppGiroForm\(2\)/.test(s.b2), 'senza approvazione la consegna finale resta chiusa');
ok(/ppGiroForm\(1\)/.test(s.b1) && /Primo giro/.test(s.b1), 'la prima consegna offre «Primo giro»');
await ev(() => ppGiroForm(1)); await sleep(500); await ev(() => ppGiroCongela()); await sleep(2000);
const gid = await ev(() => ppGiriList()[0].id), gn = await ev(() => ppGiriList()[0].n);
ok(gn === 1 || gn >= 5, 'in un progetto senza storici il primo giro prende il primo numero libero: ' + gn);
await ev(id => ppGRiscAdd(id), gid); await sleep(300);
const rid = await ev(id => Object.keys(ppGiri()[id].risc)[0], gid);
await ev(([id, r]) => { ppGRiscSet(id, r, 'da', 'Tutor Marco'); ppGRiscSet(id, r, 'esito', 'approva'); }, [gid, rid]); await sleep(500);
s = await ev(() => ({ap: ppIter().apprB1, b2: ppBloccoHTML(2)}));
ok(s.ap && s.ap.chi === 'Tutor Marco' && /ppGiroForm\(2\)/.test(s.b2), 'il riscontro «Approva» registra l’approvazione e sblocca la consegna finale');
ok(await ev(() => /Vedi il progetto inviato/.test(ppBloccoHTML(1)) && /Scarica il Word/.test(ppBloccoHTML(1))), 'il giro ha i pulsanti «Vedi il progetto inviato» e «Scarica il Word»');
const [pop] = await Promise.all([P.context().waitForEvent('page', {timeout:15000}), ev(id => ppGiroApri(id), gid)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(6000);
s = await pop.evaluate(() => ({ro: window.BRO && window.BRO.giro, bar: (document.getElementById('giro-bar') || {}).textContent || '', nome: (scheda.pp || {}).nome, old: !!document.getElementById('ro-bar'), url: location.hash}));
ok(s.ro && /PROGETTO INVIATO · Giro/.test(s.bar) && /Chiudi e torna al tuo progetto/.test(s.bar) && !s.old, 'la copia si apre in una NUOVA scheda con la barra «PROGETTO INVIATO» in alto: ' + s.bar.slice(0, 50));
ok(s.nome === 'Anna Rossi' && s.url === '', 'la copia contiene il progetto com’era');
const top = await pop.evaluate(() => Math.round(document.getElementById('giro-bar').getBoundingClientRect().top)); ok(top === 0, 'la barra è in cima alla pagina');
ok(await ev(() => !window.BRO && ppGiriList().length >= 1), 'la scheda originale resta sul tuo progetto');
await pop.evaluate(() => giroChiudi()).catch(() => {}); await sleep(1500); ok(pop.isClosed(), 'il pulsante chiude la scheda della copia');
// Tutor = ICdF
await ev(() => ppGiroForm(2)); await sleep(800);
s = await ev(() => { const ov = document.getElementById('pp-giro-ov'); return {n: ov.querySelectorAll('input[type=email]').length}; });
await ev(() => { window._giroForm.tutorIcdf = true; ppGiroFormRender(); }); await sleep(300);
let s2 = await ev(() => { const ov = document.getElementById('pp-giro-ov'); return {n: ov.querySelectorAll('input[type=email]').length, t: ov.innerText}; });
ok(s2.n === s.n - 1 && /ICdF \(fa anche da Tutor\)/.test(s2.t), 'con «Tutor = ICdF» resta una sola riga, ICdF che fa anche da Tutor');
await ev(() => { ppGiroFormClose(); });
// elimina un giro
const nBefore = cloud().length;
await ev(id => ppGiroElimina(id), gid); await sleep(1500);
ok(cloud().length === nBefore - 1 && !cloud().some(g => g.id === gid), 'il giro eliminato sparisce dal cloud');
s = await ev(id => ({list: ppGiriList().some(g => g.id === id), raw: !!ppGiri()[id], nx: ppGiroNextN(), html: ppBloccoHTML(1)}), gid);
ok(!s.list && s.raw && !/Elimina il giro<\/button>[\s\S]*ppGiroApri\('${gid}'\)/.test(s.html), 'in locale resta solo una traccia vuota: il giro non compare più');
await ev(() => ppGiroForm(1)); await sleep(400); await ev(() => ppGiroCongela()); await sleep(2000);
const ng = await ev(() => ppGiriList().map(g => g.n).join());
ok(!ng.split(',').includes(String(gn)) || gn === 1, 'un nuovo giro non riusa il numero di quello eliminato: ' + ng);
summary(); process.exit(0);
