// Prova completa dei ruoli: Anna (titolare), Bruno (collaboratore), Carla (lettrice), Dario (co-titolare)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve();
const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const B = db.addUser('bruno@x.it', 'password123', 'Bruno Verdi');
const C = db.addUser('carla@x.it', 'password123', 'Carla Neri');
const D = db.addUser('dario@x.it', 'password123', 'Dario Blu');
const br = await launch(engine);
const ev = (p, f, a) => p.evaluate(f, a);

// ── Anna: progetto di esempio senza ricaricare la pagina ──
const pa = await person(br, db);
await loginAs(pa.page, base, A);
const nav0 = await ev(pa.page, () => performance.getEntriesByType('navigation').length);
let reloads = 0; pa.page.on('framenavigated', f => { if(f === pa.page.mainFrame()) reloads++; });
await ev(pa.page, () => { confirmBackToLanding(); });
await sleep(300);
const welcome = await ev(pa.page, () => document.getElementById('welcome-screen').style.display !== 'none');
ok(welcome, '5. torna alla schermata iniziale senza conferma');
ok(!(pa.page.__dialogs||[]).length, '5. nessuna finestra di conferma');
await pa.page.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click();
await sleep(1500);
const ex = await ev(pa.page, () => ({main: document.getElementById('main-app').style.display, ex: !!document.getElementById('ex-bar'), unit: UNIT_NAME, ctx: CL.ctx && CL.ctx.titolo}));
ok(reloads === 0, '4. esempio aperto senza ricaricare la pagina (navigazioni: ' + reloads + ')');
ok(ex.ex && ex.unit === 'Reparto Kontiki' && /Esempio/.test(ex.ctx||''), '4. esempio costruito e salvato in archivio: ' + JSON.stringify(ex));
await sleep(2500);
const saved = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
ok(saved && saved.data && saved.data.UNIT_NAME === 'Reparto Kontiki', '4. esempio arrivato nel cloud');

// staff con le email dei colleghi; un'email sbagliata
await ev(pa.page, () => { scheda.pp.staffTab = [{ruolo:'CU',nome:'Anna Rossi',mail:'anna@x.it'},{ruolo:'VCU',nome:'Bruno Verdi',mail:'bruno@x.it',tel:'3331234567'},{ruolo:'VCU',nome:'Carla Neri',mail:'carla@x.it'},{ruolo:'SiS',nome:'Dario Blu',mail:'dario@x.it'},{ruolo:'CG',nome:'Elena Gialli',mail:'elena@'}];
  _clTouched = true; _clUserAt = Date.now(); saveData(true); gGo('1a'); });
await sleep(800);
// ── 9+11: «Come programmi?» ──
ok(await pa.page.isVisible('#prog-mode'), '9. «Come programmi?» in testa alla 1.1');
await pa.page.click('#prog-mode >> text=Programmazione condivisa');
await sleep(800);
const pm = await ev(pa.page, () => ({p: scheda.pp.prog, mv: !!(scheda.mv && scheda.mv.on), chk: document.querySelectorAll('#staff-tab .st-chk').length, me: document.querySelectorAll('#staff-tab .st-sh.me').length}));
ok(pm.p === 'cond' && pm.mv, '9. condivisa: si accende anche l’osservazione condivisa della 1.2');
ok(pm.chk === 4 && pm.me === 1, '9. spunta a sinistra di ogni persona (4) e «tu» sulla propria riga');
// email sbagliata → casella rossa
await pa.page.locator('#staff-tab .st-chk').nth(3).click();
await sleep(400);
ok(await pa.page.isVisible('#staff-tab .st-bad'), '11. email sbagliata: casella rossa «Controlla l’email»');
const chk3 = await pa.page.locator('#staff-tab .st-chk').nth(3).isChecked();
ok(!chk3, '11. la spunta non resta');
// invito di Bruno come collaboratore, Carla lettrice, Dario co-titolare
async function share(i, ruolo){
  await pa.page.locator('#staff-tab .st-chk').nth(i).check();
  await pa.page.waitForSelector('#g-modal.show');
  await pa.page.click(`#g-modal >> text=${ruolo}`);
  await sleep(700);
  await ev(pa.page, () => modalClose());
}
await share(0, 'Collaboratore'); await share(1, 'Lettore'); await share(2, 'Co-titolare');
const lbl = await ev(pa.page, () => [...document.querySelectorAll('#staff-tab .st-shl')].map(e => e.textContent));
ok(JSON.stringify(lbl) === JSON.stringify(['titolare','condiviso · collaboratore','condiviso · lettore','condiviso · co-titolare']), '9. nella riga «condiviso · ruolo»: ' + JSON.stringify(lbl));
ok(db.t.pee_membri.length === 3, '9. tre inviti nel database');
const pid = saved.id;

// incarichi: attività 1 del percorso 1 a Bruno, attività 2 del percorso 1 a Carla (lettrice), logistica dell'attività 3 a Bruno;
// un materiale a Carla; attività 1 vissuta il 3 ottobre e non verificata
await ev(pa.page, () => {
  const per = getAllPercorsi()[0];
  const a0 = per.attivita[0]; a0.condivisa = true; a0.aff = 'bruno@x.it'; a0.vBene = ''; a0.vMigl = '';
  const a1 = per.attivita[1]; a1.condivisa = true; a1.aff = 'dario@x.it'; a1.ax = a1.ax || {}; a1.ax.mat = [{cosa:'Torce frontali', q:1, chi:'Carla Neri (VCU)'}];
  const a2 = per.attivita[2]; a2.condivisa = true; a2.ax = a2.ax || {}; a2.ax.ref = {log:'Bruno Verdi (VCU)'};
  _clTouched = true; _clUserAt = Date.now(); saveData(true); gGo('3'); });
await sleep(2500);

// ── 18+25: Anna vede in sola lettura le parti affidate a Bruno (collaboratore) e a Dario (co-titolare) ──
await ev(pa.page, () => { document.querySelectorAll('details.att-extra,details.ax-g').forEach(d => d.open = true); edLock(); });
await sleep(500);
const ban = await ev(pa.page, () => [...document.querySelectorAll('.ed-aff')].map(b => b.textContent.replace(/\s+/g,' ').trim()));
ok(ban.some(t => /affidata a Bruno Verdi/.test(t)) && ban.some(t => /affidata a Dario Blu/.test(t)), '18. «Questa parte è affidata a X» per le parti di Bruno e Dario (' + ban.length + ' avvisi)');
const lockA = await ev(pa.page, () => { const d = document.getElementById('att-0-0'); const f = [...d.querySelectorAll('textarea,input,select')]; return {n:f.length, dis:f.filter(e => e.disabled).length}; });
ok(lockA.n > 0 && lockA.dis === lockA.n, '18. attività di Bruno: tutti i campi in sola lettura per Anna (' + lockA.dis + '/' + lockA.n + ')');
const freeA = await ev(pa.page, () => { const d = document.getElementById('att-0-2'); const t = d.querySelector('input[type=text]'); return t && !t.disabled; });
ok(freeA, '18. attività non affidata: Anna modifica liberamente');
const logLock = await ev(pa.page, () => { const g = document.querySelector('#att-0-2 details.ax-g[data-k="log"]'); return g && [...g.querySelectorAll('input,select,textarea')].every(e => e.disabled) && !!g.querySelector('.ed-aff'); });
ok(logLock, '25. la logistica affidata a Bruno è in sola lettura, con l’avviso');
// Suggerisci a Bruno
await pa.page.locator('#att-lock-0-0 .ed-aff >> text=Suggerisci').click();
await pa.page.fill('#ed-sg-t', 'Porta anche le corde lunghe');
await pa.page.click('#g-modal >> text=Invia');
await sleep(400);
// Modifica comunque (con conferma)
pa.page.__answer = true;
await pa.page.locator('#att-lock-0-0 .ed-aff >> text=Modifica comunque').click();
await sleep(500);
const unl = await ev(pa.page, () => { const d = document.getElementById('att-0-0'); const t = d.querySelector('input[type=text]'); return t && !t.disabled; });
ok(unl, '18. «Modifica comunque»: dopo la conferma Anna può modificare');
const av = await ev(pa.page, () => (scheda.avvisi||[]).map(a => a.tipo + ':' + a.a));
ok(JSON.stringify(av) === JSON.stringify(['sugg:bruno@x.it','mod:bruno@x.it']), '18. avvisi per Bruno salvati nel progetto: ' + JSON.stringify(av));
await sleep(2500);

// ── 26: verifica mancante → WhatsApp ──
await ev(pa.page, () => { const a = getAllPercorsi()[0].attivita[0]; a.ax = a.ax || {}; a.ax.data = '2026-10-03'; _clTouched = true; _clUserAt = Date.now(); saveData(true); gGo('4'); });
await sleep(800);
const wa = await ev(pa.page, () => { const a = document.querySelector('[data-verat="0-0"] .ver-wa'); return a ? a.href : ''; });
ok(/^https:\/\/wa\.me\/393331234567\?text=/.test(wa) && /verifica/.test(decodeURIComponent(wa)), '26. «Ricordaglielo su WhatsApp» con il numero di Bruno');
await sleep(2000);

// ── Bruno (collaboratore): finestra dell'invito, striscia in home, permessi ──
const pb = await person(br, db);
await loginAs(pb.page, base, B);
await pb.page.waitForFunction(() => /Hai un invito/.test(document.getElementById('cl-title').textContent) && document.getElementById('cl-ov').classList.contains('show'), null, {timeout:6000}).catch(() => {});
const popB = await ev(pb.page, () => ({show: document.getElementById('cl-ov').classList.contains('show'), t: document.getElementById('cl-title').textContent, strip: document.querySelectorAll('.cl-invstrip').length}));
ok(popB.show && /Hai un invito su «/.test(popB.t), '1. finestra «' + popB.t + '»');
ok(popB.strip >= 1, '1. striscia dell’invito in home');
await pb.page.click('#cl-ov >> text=Più tardi');
await sleep(300);
ok(await pb.page.isVisible('.cl-invstrip'), '1. «Più tardi»: la striscia resta finché non apri');
await pb.page.click('.cl-invstrip button');
await sleep(2500);
const ctxB = await ev(pb.page, () => CL.ctx && {ruolo: CL.ctx.ruolo, id: CL.ctx.id, strip: document.querySelectorAll('.cl-invstrip').length});
ok(ctxB && ctxB.ruolo === 'collaboratore' && ctxB.id === pid, '0. Bruno lavora come collaboratore (senza ?ruoli=1)');
ok(ctxB && ctxB.strip === 0, '1. aperto l’invito, la striscia sparisce');
await ev(pb.page, () => gGo('1a')); await sleep(600);
const b11 = await ev(pb.page, () => { const el = document.getElementById('panel4'); const f = [...el.querySelectorAll('textarea,input,select')].filter(e => !e.closest('.sg13')); const btn = [...el.querySelectorAll('button')].filter(b => /staffTabAdd|staffTabDel|occAdd/.test(b.getAttribute('onclick')||'')); return {n:f.length, dis:f.filter(e => e.disabled).length, bn:btn.length, bd:btn.filter(b => b.disabled).length, prog: document.querySelector('#prog-mode .mv-opt').disabled}; });
ok(b11.n > 0 && b11.dis === b11.n, '15. 1.1: il collaboratore non modifica nulla (' + b11.dis + '/' + b11.n + ')');
ok(b11.bn > 0 && b11.bd === b11.bn, '17. pulsanti di modifica davvero disattivati (' + b11.bd + '/' + b11.bn + ')');
ok(b11.prog, '9. il collaboratore non cambia «Come programmi?»');
await ev(pb.page, () => { gGo('3'); }); await sleep(800);
await ev(pb.page, () => { document.querySelectorAll('details.att-extra,details.ax-g').forEach(d => d.open = true); edLock(); }); await sleep(400);
const b3 = await ev(pb.page, () => {
  const st = id => { const d = document.getElementById(id); const f = [...d.querySelectorAll('textarea,input,select')]; return {n:f.length, en:f.filter(e => !e.disabled && !e.classList.contains('aff-sel') && !e.classList.contains('share-chk')).length}; };
  const g = document.querySelector('#att-0-2 details.ax-g[data-k="log"]'), gs = document.querySelector('#att-0-2 details.ax-g[data-k="sic"]');
  const nav = [...document.querySelectorAll('#panel4 button')].filter(b => /gGo|axDocx|icsOne|fdgOpen/.test(b.getAttribute('onclick')||''));
  const add = [...document.querySelectorAll('#panel4 button')].filter(b => /attAdd|addPercorsoExtra/.test(b.getAttribute('onclick')||''));
  return {mine: st('att-0-0'), other: st('att-0-1'), log: [...g.querySelectorAll('input,select,textarea')].filter(e => !e.disabled && !e.classList.contains('ref-sel')).length, sic: [...gs.querySelectorAll('input,select,textarea')].filter(e => !e.disabled).length,
    navOn: nav.length && nav.every(b => !b.disabled), addOff: add.length && add.every(b => b.disabled), aff: document.querySelector('#att-0-0 .aff-sel') && document.querySelector('#att-0-0 .aff-sel').disabled }; });
ok(b3.mine.en > 10, '21. referente dell’attività: modifica l’attività intera (' + b3.mine.en + ' campi)');
ok(b3.other.en === 0, '16. attività di un altro: nessun campo modificabile');
ok(b3.log > 0 && b3.sic === 0, '24. referente della logistica: modifica solo la logistica');
ok(b3.navOn && b3.addOff, '17. navigazione e Word attivi, «+ Aggiungi» disattivato');
ok(b3.aff, '15. il collaboratore non cambia il referente');
// Bruno modifica la sua attività → arriva ad Anna
await pb.page.fill('#att-0-0 input[type=text]', 'Officina di Pattuglia di Bruno');
await sleep(4500);
const fromB = db.t.pee_archivi.find(r => r.id === pid).data.scheda.percorsiExtra[0].attivita[0].testo;
ok(fromB === 'Officina di Pattuglia di Bruno', '21. la modifica di Bruno è nel progetto comune');
// «Per te» di Bruno: suggerimento e avviso di Anna, logistica affidata, attività da verificare
await ev(pb.page, () => clPerTe()); await sleep(800);
const ptB = await ev(pb.page, () => (CL.perte||[]).map(x => x.k + (x.tipo ? ':' + x.tipo : '')));
ok(ptB.includes('av:sugg') && ptB.includes('av:mod'), '18. «Per te» di Bruno: suggerimento e avviso di Anna ' + JSON.stringify(ptB));
ok(ptB.includes('att') && ptB.includes('ver'), '20. «Per te» di Bruno: parti affidate e verifica da fare');
// segna letto
await ev(pb.page, () => { const x = CL.perte.find(x => x.k === 'av'); ptAvRead(x.av); }); await sleep(3500);
const letto = (db.t.pee_archivi.find(r => r.id === pid).data.scheda.avvisi||[]).filter(a => a.letto).length;
ok(letto === 1, '18. Bruno segna letto: arriva nel progetto');

// ── 14: la priorità scelta da Anna arriva subito a Dario (co-titolare) ──
const pd = await person(br, db);
await loginAs(pd.page, base, D);
await sleep(1000);
await ev(pd.page, () => { const x = (CL._inv||[])[0]; clInvOpen(x.id); });
await sleep(2500);
ok(await ev(pd.page, () => CL.ctx && CL.ctx.ruolo === 'cotitolare'), '0. Dario lavora come co-titolare');
await ev(pa.page, () => goPhaseInternal(3)); await sleep(600);
const before = await ev(pd.page, () => Object.keys(pris).filter(k => pris[k]).sort().join(','));
await pa.page.click('#pri-P1');
await sleep(4500);
const after = await ev(pd.page, () => Object.keys(pris).filter(k => pris[k]).sort().join(','));
ok(before !== after && after.includes('P1'), '14. spunta della priorità arrivata a Dario: ' + before + ' → ' + after);
// co-titolare: anche per lui la parte di Bruno è in sola lettura con l'avviso
await ev(pd.page, () => { gGo('3'); }); await sleep(800);
await ev(pd.page, () => { document.querySelectorAll('details.att-extra,details.ax-g').forEach(d => d.open = true); edLock(); }); await sleep(400);
const dBan = await ev(pd.page, () => !!document.querySelector('#att-lock-0-0 .ed-aff') && !document.querySelector('#att-lock-0-1 .ed-aff'));
ok(dBan, '18. co-titolare: avviso sulla parte di Bruno; la sua attività è libera');

// ── Carla (lettrice): suggerimento nella 1.3, materiale «tocca a te» in «Per te» ──
const pc = await person(br, db);
await loginAs(pc.page, base, C);
await sleep(1000);
await ev(pc.page, () => { const x = (CL._inv||[])[0]; clInvOpen(x.id); });
await sleep(3000);
ok(await ev(pc.page, () => !!window.BRO), '0. Carla legge in sola lettura');
await ev(pc.page, () => goPhaseInternal(2)); await sleep(800);
const add13 = pc.page.locator('.sg13[data-k="13:P:positivi"] .sg-add');
ok(await add13.isVisible(), '13. lettrice: «+ Suggerisci» sotto gli aspetti positivi');
await add13.click();
await pc.page.fill('.sg13[data-k="13:P:positivi"] textarea', 'Le Pattuglie si aiutano nei lavori manuali');
await pc.page.click('.sg13[data-k="13:P:positivi"] >> text=Invia suggerimento');
await sleep(1500);
ok(db.t.pee_suggerimenti.some(x => x.percorso === '13:P:positivi'), '13. suggerimento salvato');
await ev(pa.page, () => goPhaseInternal(2)); await sleep(2500);
const aSees = await ev(pa.page, () => { const w = document.querySelector('.sg13[data-k="13:P:positivi"]'); return w ? w.textContent : ''; });
ok(/Le Pattuglie si aiutano/.test(aSees) && /Segna come letto/.test(aSees), '13. Anna lo legge sotto la cella e può segnarlo letto');
await ev(pc.page, () => clPerTe()); await sleep(1000);
const ptC = await ev(pc.page, () => (CL.perte||[]).map(x => x.k));
ok(ptC.includes('mat'), '20. lettrice: «Per te» le ricorda il materiale da procurare ' + JSON.stringify(ptC));
const hdr = await ev(pc.page, () => (document.querySelector('.hdr .cl-hdrbtn .cl-pt')||{}).textContent || '');
ok(+hdr > 0, '20. numerino «Per te» anche in sola lettura (' + hdr + ')');
await ev(pc.page, () => { gGo('3'); }); await sleep(800);
const tocca = await ev(pc.page, () => [...document.querySelectorAll('.aff-chip.me')].some(e => e.textContent === 'tocca a te'));
ok(tocca, '19. «tocca a te» accanto al materiale da procurare');

// ── Bruno suggerisce nella 1.3 come collaboratore ──
await ev(pb.page, () => goPhaseInternal(2)); await sleep(800);
ok(await pb.page.isVisible('.sg13[data-k="13:C:necessita"] .sg-add'), '13. collaboratore: «+ Suggerisci» sotto le necessità');
const bDis = await ev(pb.page, () => [...document.querySelectorAll('#g-lettura textarea')].filter(t => !t.closest('.sg13')).every(t => t.disabled));
ok(bDis, '15. collaboratore: i testi della 1.3 non si modificano');

// ── 2: cambio email di Carla ──
await ev(pc.page, () => { roExit(); }); await sleep(1500);
await ev(pc.page, () => { clOpen(); }); await sleep(800);
await pc.page.click('#cl-ov >> text=cambia email');
await pc.page.fill('#cl-newmail', 'carla.nuova@x.it');
await pc.page.click('#cl-ov >> text=Invia il link di conferma');
await sleep(800);
ok(/link di conferma/.test(await pc.page.textContent('#cl-msg')), '2. cambio email: messaggio del link di conferma');
ok(db.mails.some(m => m.tipo === 'cambio-email' && m.to === 'carla.nuova@x.it'), '2. mail di conferma alla nuova email');
db.confirmEmail('carla@x.it');
await ev(pc.page, () => sessionStorage.removeItem('bussola_mail_ok'));
await pc.page.reload(); await sleep(2000);
const memC = db.t.pee_membri.find(m => m.email === 'carla.nuova@x.it');
ok(memC && memC.email_prima === 'carla@x.it', '2. l’invito è passato alla nuova email');
await ev(pa.page, () => { clPerTe(); }); await sleep(1200);
await ev(pa.page, () => clOpen()); await sleep(1200);
const em = await ev(pa.page, () => (document.getElementById('cl-perte')||{}).textContent || '');
ok(/Carla Neri ha cambiato email/.test(em) && /Aggiorna nella tabella dello staff/.test(em), '2. Anna: «Carla Neri ha cambiato email» in «Per te»');
await pa.page.click('#cl-perte >> text=Aggiorna nella tabella dello staff');
await sleep(1200);
ok(/Tabella dello staff aggiornata/.test(await pa.page.textContent('#g-modal')), '2. finestra di conferma dell’aggiornamento');
await ev(pa.page, () => modalClose());
const newMail = await ev(pa.page, () => scheda.pp.staffTab.find(r => r.nome === 'Carla Neri').mail);
ok(newMail === 'carla.nuova@x.it', '2. tabella dello staff aggiornata: ' + newMail);
ok(!db.t.pee_membri.find(m => m.email === 'carla.nuova@x.it').email_prima, '2. avviso chiuso');
// ── 8: «Condivisi con me» in cima (Bruno) ──
await ev(pb.page, () => clOpen()); await sleep(1500);
const order = await ev(pb.page, () => { const b = document.getElementById('cl-body').innerHTML; return [b.indexOf('Condivisi con me'), b.indexOf('I miei PEE per anno')]; });
ok(order[0] > 0 && order[0] < order[1], '8. «Condivisi con me» sopra «I miei PEE»');
await ev(pb.page, () => clClose());

// ── 9: Anna torna alla programmazione individuale → chiede se togliere l'accesso ──
await ev(pa.page, () => { clClose(); gGo('1a'); }); await sleep(800);
await pa.page.click('#prog-mode >> text=Programmazione individuale');
await sleep(400);
ok(/togliere l’accesso/.test(await pa.page.textContent('#g-modal')), '9. individuale: chiede se togliere l’accesso alle persone invitate');
await pa.page.click('#g-modal >> text=Sì, togli l’accesso');
await sleep(1500);
ok(db.t.pee_membri.filter(m => m.archivio_id === pid).length === 0 && await ev(pa.page, () => scheda.pp.prog === 'ind'), '9. accesso tolto, programmazione individuale');

for(const [n, p] of [['Anna', pa], ['Bruno', pb], ['Carla', pc], ['Dario', pd]]) ok(!p.errors.length, 'nessun errore JS per ' + n + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
