// Ruolo «Commissario di Sezione»: invitato dal Capo Gruppo nella Programmazione formativa annuale, legge tutto (anche gli eventi per gli adulti), non modifica, lascia pareri firmati
// uso: node t_cdsr.mjs [motore | profilo di dispositivo: safari-mac, iphone, iphone-se, ipad, ipad-land, firefox-win, firefox-small, chrome-win, edge-win, android, android-small, tablet-android]   (SITE = copia di prova, come gli altri test; il database è finto: db.sqlComm = false emula lo script SQL del 20 novembre non ancora lanciato)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const arg = process.argv[2] || 'chromium';
const engine = PROFILES[arg] ? PROFILES[arg][0] : arg;
const dev0 = Object.assign({}, PROFILES[arg] ? PROFILES[arg][1] : {}); delete dev0.defaultBrowserType; if(engine === 'firefox') delete dev0.isMobile;
const mobile = !!PROFILES[arg];
const noOver = P => P.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB();
const br = await launch(engine);
const mkUser = (mail, nome, ruolo) => { const u = db.addUser(mail, 'password123', nome); db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:ruolo === 'cds' ? null : '1', area_rcdf:'altoadriatico', dashboard:{}}); return u; };
const cg = mkUser('cg@x.it', 'Capo Gruppo', 'cg'), cm = mkUser('comm@x.it', 'Marco Commissario', 'cds'), lt = mkUser('lett@x.it', 'Lea Lettrice', 'cu');
const errs = [];

// ───── 1. il Capo Gruppo crea la formativa, un evento riservato agli adulti, e apre «Condividi» ─────
const pa = await person(br, db, {ctx: dev0}); const A = pa.page, ea = (f, a) => A.evaluate(f, a);
await loginAs(A, base, cg); await sleep(2500);
await A.click('.sh-big >> nth=0'); await sleep(300); await A.click('#sh-ncre'); await sleep(3500);
const s0 = await ea(() => ({mode: MODE, ru: STAFF_RUOLO, v: scheda.veste && scheda.veste.ruolo, id: CL.ctx.id}));
ok(s0.mode === 'staff' && s0.ru === 'CG' && s0.v === 'cg', 'il Capo Gruppo ha la sua Programmazione formativa annuale (veste ' + s0.v + ')');
const pid = s0.id;
await ea(() => { const id = 'uTest1'; scheda.uscite = scheda.uscite || {}; scheda.uscite[id] = {id, cr: Date.now(), testo: 'Serata formativa dei Capi Unità', modello: 'sede', dest: 'staff', riservata: true, ax: {data: '2026-12-05'}, prog: {b1: {k: 'nuova', t: 'Momento segreto del Capo Gruppo', dur: 30}}, hid: {}, own: {}}; saveData(true); });
await ea(() => { STAFF_MEMBERS = ['Paolo Riva']; staffObs['Paolo Riva'] = {P1: 4, P2: 3, C1: 2}; staffProfiles['Paolo Riva'] = {eta: '34', ruolo: 'Capo Unità', esperienza: '5'}; try{ _clTouched = true; _clUserAt = Date.now(); }catch(e){} saveData(true); });
await sleep(4500);

const offer = async () => { await ea(() => shShare()); await sleep(1800);
  return ea(() => ({opts: [...document.querySelectorAll('#cl-invr option')].map(o => o.value), intro: (document.getElementById('cl-shintro') || {}).innerText || '', box: document.getElementById('cl-rolebox') ? document.getElementById('cl-rolebox').style.display : 'x'})); };
const o1 = await offer();
ok(o1.opts.join() === 'lettore,cotitolare,collaboratore,commissario', 'nella Condividi della formativa del Capo Gruppo i ruoli sono: ' + o1.opts.join(', '));
ok(await noOver(A), 'la finestra «Condividi» non esce dallo schermo (' + arg + ')');
ok(/Commissario di Sezione · vede questo progetto, comprese le letture degli adulti e gli eventi formativi, e può lasciarti pareri firmati\. Non modifica nulla\. I tuoi altri progetti, compreso il Progetto Personale, non vengono condivisi\./.test(o1.intro.replace(/\s+/g, ' ')), 'la frase approvata compare uguale nella finestra');
ok(!/Capo Unità|Capi Unità/i.test((o1.intro.match(/Commissario di Sezione ·[^\n]*/) || [''])[0]), 'la frase non cita i nomi dei Capi Unità');

// invito: Commissario + Lettore (per confronto). Prima con il database NON aggiornato: messaggio chiaro, nessun invito creato
db.sqlComm = false;
await ea(() => { document.getElementById('cl-inv').value = 'comm@x.it'; document.getElementById('cl-invr').value = 'commissario'; return clInvite(); }); await sleep(1500);
const m0 = await ea(() => (document.getElementById('cl-msg') || {}).innerText || '');
ok(/database va aggiornato/i.test(m0) && db.t.pee_membri.length === 0, 'database non aggiornato: messaggio «' + m0.slice(0, 70) + '…», nessun invito creato');
db.sqlComm = true;
await ea(() => { document.getElementById('cl-inv').value = 'comm@x.it'; document.getElementById('cl-invr').value = 'commissario'; return clInvite(); }); await sleep(1500);
await ea(() => { document.getElementById('cl-inv').value = 'lett@x.it'; document.getElementById('cl-invr').value = 'lettore'; return clInvite(); }); await sleep(1500);
const mem = db.t.pee_membri.map(m => m.email + ':' + m.ruolo).sort().join();
ok(mem === 'comm@x.it:commissario,lett@x.it:lettore', 'inviti salvati: ' + mem);
const lst = await ea(() => { const b = document.getElementById('cl-members') || document.body; return b.innerText; });
ok(/Commissario di Sezione/.test(lst), 'nell’elenco di chi ha accesso compare «Commissario di Sezione»');
const wa = await ea(() => clWaText('comm@x.it', 'commissario'));
ok(/come Commissario di Sezione/.test(wa) && !/sola lettura/.test(wa), 'il messaggio di invito parla del ruolo giusto');

// ───── 2. in un progetto che NON è la formativa del Capo Gruppo il ruolo non si offre ─────
const pb = await person(br, db, {ctx: dev0}); const B = pb.page, eb = (f, a) => B.evaluate(f, a);
const uu = db.addUser('altro@x.it', 'password123', 'Altro Capo'); db.t.pee_profili.push({user_id:uu.id, nome:'Altro Capo', ruolo:'cds', branca:null, sezione:'Pesaro', gruppo:null, area_rcdf:'altoadriatico', dashboard:{}});
await loginAs(B, base, uu); await sleep(2500);
await B.click('.sh-big >> nth=0'); await sleep(300); await B.click('#sh-ncre'); await sleep(3500);
await eb(() => shShare()); await sleep(1800);
const o2 = await eb(() => [...document.querySelectorAll('#cl-invr option')].map(o => o.value).join());
ok(o2 === 'lettore,cotitolare,collaboratore', 'nel progetto del Commissario (non del Capo Gruppo) il ruolo non si offre: ' + o2);
await pb.ctx.close();

// ───── 3. il Commissario apre il progetto ─────
const pc = await person(br, db, {ctx: dev0}); const C = pc.page, ec = (f, a) => C.evaluate(f, a);
await loginAs(C, base, cm); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await ec(() => (CL._inv || []).length)) break; await sleep(500); }
await ec(id => clOpenShared(id), pid); await sleep(4500);
const c1 = await ec(() => ({ro: !!window.BRO, ruolo: window.BRO && window.BRO.ruolo, comm: clIsComm(), body: document.body.classList.contains('ro'), bar: (document.getElementById('ro-bar') || {}).innerText || '', mode: MODE}));
ok(c1.ro && c1.ruolo === 'commissario' && c1.comm && c1.body, 'il Commissario apre il progetto in sola lettura col suo ruolo');
ok(await noOver(C), 'la pagina in sola lettura del Commissario non esce dallo schermo (' + arg + ')');
ok(/Commissario di Sezione · sola lettura/.test(c1.bar) && /pareri firmati/.test(c1.bar), 'la barra dice «' + c1.bar.slice(0, 80) + '…»');

// eventi per gli adulti: il Commissario li vede, il Lettore no
const evText = async P => { await P.evaluate(() => { try{ shSec('usc'); }catch(e){} }); await sleep(900); await P.evaluate(() => { try{ const u = uscListAll()[0]; if(u) uscOpen(u.id); }catch(e){} }); await sleep(900); return P.evaluate(() => ({t: document.body.innerText, res: (() => { try{ return uscRes(uscListAll()[0]); }catch(e){ return 'ERR'; } })()})); };
const e1 = await evText(C);
ok(e1.res === false && /Momento segreto del Capo Gruppo/.test(e1.t), 'il Commissario vede il momento riservato («Momento segreto del Capo Gruppo»)');

const lett = async P => { await P.evaluate(() => { try{ STAFF_VIEW = 'osservazione'; goPhase(1); }catch(e){} }); await sleep(900); const a = await P.evaluate(() => document.body.innerText); await P.evaluate(() => { try{ goPhase(2); }catch(e){} }); await sleep(900); const b = await P.evaluate(() => document.body.innerText); return {a, b}; };
const l1 = await lett(C);
ok(/Paolo Riva/.test(l1.a + l1.b), 'il Commissario vede la persona e la sua lettura (Paolo Riva) nelle pagine «I miei Capi Gruppo/Unità» e «Lettura»');
globalThis.__lC = l1;

// non modifica: niente scrive sul progetto
const before = JSON.stringify(db.t.pee_archivi.find(r => r.id === pid).data);
await ec(() => { try{ scheda.uscite.uTest1.testo = 'MODIFICATO'; saveData(true); }catch(e){} }); await sleep(3500);
ok(JSON.stringify(db.t.pee_archivi.find(r => r.id === pid).data) === before, 'il progetto sul database resta identico (il Commissario non scrive)');

// parere firmato: dalla scheda di una persona (Paolo Riva), come fa il Lettore con i suggerimenti
await ec(() => { try{ STAFF_VIEW = 'osservazione'; CURRENT_MEMBER = 'Paolo Riva'; goPhase(1); renderStaffPhase1(); }catch(e){} }); await sleep(1500);
const bt = await ec(() => { const b = document.querySelector('.pc[data-stcard] .sg-add'); return b ? b.innerText : null; });
ok(bt === '+ Lascia un parere', 'sulla scheda di una persona il pulsante dice «' + bt + '»');
let perOk = false;
if(bt){
  await ec(() => { document.querySelector('.pc[data-stcard] .sg-add').click(); }); await sleep(500);
  const lab = await ec(() => { const b = document.querySelector('.pc[data-stcard] .sg-box'); return b ? b.innerText : ''; });
  ok(/Il tuo parere/.test(lab) && /Invia parere/.test(lab) && /Capo Gruppo/.test(lab), 'il modulo parla di «parere» e del Capo Gruppo: «' + lab.replace(/\s+/g, ' ').slice(0, 90) + '…»');
  await ec(() => { const box = document.querySelector('.pc[data-stcard] .sg-box'); const nm = box.querySelector('[id^="sg-nm-"]'), ta = box.querySelector('[id^="sg-ta-"]'); nm.value = 'Marco Rossi'; ta.value = 'Ottima lettura, ma manca il Comunitario.'; ta.dispatchEvent(new Event('input')); box.querySelector('.sg-a .ok').click(); }); await sleep(2500);
  perOk = true;
  const lab2 = await ec(() => { const w = document.querySelector('.pc[data-stcard] .sg-pill'); return w ? w.innerText : ''; });
  ok(/Il tuo parere/.test(lab2), 'dopo l’invio la scheda mostra «' + lab2 + '»');
}
if(!bt){ await ec(() => dbSgAdd(CL.ctx.id, 'S:Paolo Riva|P1', sgFirma('Marco Rossi'), 'Ottima lettura, ma manca il Comunitario.')); await sleep(800); }
const sg = db.t.pee_suggerimenti.map(x => x.autore_nome + '|' + x.testo.slice(0, 20));
ok(sg.length === 1 && /^Marco Rossi · Commissario di Sezione\|Ottima lettura/.test(sg[0]) && perOk, 'parere salvato con nome e carica: ' + sg.join(';'));
await pc.ctx.close();

// ───── 4. il Lettore, per confronto: eventi riservati nascosti, etichette da «suggerimento» ─────
const pd = await person(br, db, {ctx: dev0}); const D = pd.page, ed = (f, a) => D.evaluate(f, a);
await loginAs(D, base, lt); await sleep(2500);
for (let i = 0; i < 10; i++){ if(await ed(() => (CL._inv || []).length)) break; await sleep(500); }
await ed(id => clOpenShared(id), pid); await sleep(4500);
const d1 = await ed(() => ({ro: !!window.BRO, ruolo: window.BRO && window.BRO.ruolo || null, comm: clIsComm()}));
ok(d1.ro && !d1.ruolo && !d1.comm, 'il Lettore resta Lettore (nessun ruolo speciale)');
const e2 = await evText(D);
ok(e2.res === true && !/Momento segreto del Capo Gruppo/.test(e2.t), 'il Lettore NON vede il momento riservato (come prima)');
const l2 = await lett(D);
ok(/Paolo Riva/.test(l2.a + l2.b), 'anche il Lettore vede la lettura degli adulti nel progetto del Capo Gruppo (informativo: lo sblocco automatico riguarda gli eventi)');
// il Capo Gruppo cambia ruolo al Lettore mentre guarda: da Lettore a Commissario e ritorno, la pagina si riapre col ruolo giusto
const midL = db.t.pee_membri.find(m => m.email === 'lett@x.it').id;
await ea(m => clSetRole(m, 'commissario'), midL); await sleep(1200);
await ed(() => clRoleCheck()); await sleep(4500);
ok(await ed(() => !!window.BRO && window.BRO.ruolo === 'commissario' && clIsComm()), 'cambio in diretta: il Lettore diventa Commissario di Sezione e la pagina si riapre col ruolo nuovo');
await ea(m => clSetRole(m, 'lettore'), midL); await sleep(1200);
await ed(() => clRoleCheck()); await sleep(4500);
ok(await ed(() => !!window.BRO && !window.BRO.ruolo && !clIsComm()), 'cambio in diretta: da Commissario torna Lettore');
await pd.ctx.close();

// ───── 5. il Capo Gruppo legge il parere con nome e carica; cambia ruolo: da Commissario a Lettore ─────
await ea(() => sgLoad(true)); await sleep(1500);
const sgA = await ea(() => SG.list.map(x => x.autore_nome).join());
ok(/Marco Rossi · Commissario di Sezione/.test(sgA), 'il Capo Gruppo legge il parere firmato: ' + sgA);
const mid = db.t.pee_membri.find(m => m.email === 'comm@x.it').id;
await ea(m => clSetRole(m, 'lettore'), mid); await sleep(1200);
ok(db.t.pee_membri.find(m => m.email === 'comm@x.it').ruolo === 'lettore', 'il Capo Gruppo può riportare il Commissario a Lettore');
const o3 = await ea(() => dbShared().then(r => 1));
await pa.ctx.close();
const dbs = await (async () => { const pe = await person(br, db); await loginAs(pe.page, base, cm); await sleep(2500); const r = await pe.page.evaluate(() => dbShared().then(l => l.map(x => x.ruolo).join())); await pe.ctx.close(); return r; })();
ok(dbs === 'lettore', 'dopo il cambio il progetto risulta al Commissario come «lettore»: ' + dbs);

await br.close(); process.exit(summary() ? 1 : 0);
