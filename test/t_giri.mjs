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
let s = await ev(() => ({L: ppGiriList().map(g => [g.n, g.hist, g.sez.join('')]), html: document.body.innerText.includes('I giri di revisione'), isc: scheda.pp.iter.riscontri.length}));
ok(JSON.stringify(s.L) === '[[1,true,"123"],[2,true,"12345"]]', 'i due invii già segnati diventano Giro 1 e Giro 2 (storici): ' + JSON.stringify(s.L));
ok(s.html && s.isc === 1, 'la pagina mostra «I giri di revisione» e i riscontri restano');
await P.setViewportSize({width:320, height:568}); await ev(() => ppGiroForm()); await sleep(900);
s = await ev(() => { const b = document.getElementById('pp-giro-ov').firstElementChild; return {sw: b.scrollWidth, cw: b.clientWidth, bw: document.documentElement.scrollWidth, vw: innerWidth}; });
ok(s.sw <= s.cw + 1 && s.bw <= s.vw + 1, 'su schermo stretto (320 px) il modulo non esce dai bordi: ' + JSON.stringify(s));
await ev(() => ppGiroFormClose()); await P.setViewportSize({width:1280, height:900});
// apro il modulo: proposta di default e blocco per i tester
await ev(() => ppGiroForm()); await sleep(1200);
s = await ev(() => { const ov = document.getElementById('pp-giro-ov'); const t = ov.innerText; return {t, tutor: ov.querySelectorAll('input[type=email]')[0].value, icdf: ov.querySelectorAll('input[type=email]')[1].value, dis: [...ov.querySelectorAll('input[type=email]')].map(e => e.parentElement.querySelector('input[type=checkbox]').disabled).join(), title: /Giro 3/.test(t)}; });
ok(s.title, 'il nuovo giro è il Giro 3'); ok(s.tutor === 'tutor@x.it' && s.icdf === 'rcdf.altoadriatico@cngei.it', 'Tutor e ICdF precompilati');
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
await ev(() => ppGiroForm()); await sleep(600);
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
summary(); process.exit(0);
