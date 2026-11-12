// Giro 2: campi salvati, modifica, JSON esporta/importa, Word PE, filtri e lente
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import fs from 'fs'; import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
const OLD = {id:'a2', nome:'La scelta difficile', aut:'Anna Verdi', ruolo:'tit', stato:'pronta', main:'S6', also:['C3'], dom:'', foc:['Osservo chi cede.'], dur:45, lan:'Un bivio.', svi:'Si sceglie.', con:'Si racconta.', at:1762800000000, sugg:{}};
const SV = {id:'a3', nome:'Notte di stelle', aut:'Anna Verdi', ruolo:'tit', stato:'svolta', main:'S3', also:['P5'], dom:'Che cosa li stupisce?', foc:['Guardo lo stupore.'], dur:30, lan:'Si sale sul colle.', svi:'Si guarda il cielo.', con:'Si racconta.', occId:'x2', data:'2026-11-02', at:1762800000000, sugg:{}};
const mk = (id, titolo, tipo, pp) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo, nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:tipo, annoScout:'2026-27', pp}}, created_at:ts, updated_at:ts});
const STAFF = [{ruolo:'CU', nome:'Anna Verdi'}, {ruolo:'AC', nome:'Marco Neri'}];
db.t.pee_archivi.push(mk('c1', 'Programmazione Annuale 2026-27 · Reparto', 'AN', {sezione:'Pesaro', gruppo:'1', staffTab:STAFF, occMan:[{id:'x2', att:'Attività osservativa · Notte di stelle', data:'2026-11-02', ctx:'', chi:'Anna Verdi', note:'', perc:['S3','P5']}], attOss:{a2:OLD, a3:SV}}));
db.t.pee_archivi.push(mk('p1', 'Progetto Personale 2026-27', 'PP', {sezione:'Pesaro', gruppo:'1', nome:'Anna Verdi', staffTab:STAFF, occMan:[{id:'y1', att:'Uscita', data:'2026-10-04', perc:['C3']}], attOss:{b1:Object.assign({}, OLD, {id:'b1', nome:'Prova PP', foc:['Focus del PP.'], dom:'Domanda del PP?'})}}));
await loginAs(P, base, u); await sleep(1200);
const goOcc = async id => { await P.evaluate(id => shOpen(id, 0), id).catch(() => {}); await sleep(2800); await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
  await ev(() => { gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(900); };
await goOcc('c1');
const FR = () => P.frames().filter(f => f !== P.mainFrame()).pop();
const dl = async fn => { const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), P.evaluate(fn)]); return d; };
// 1) nuova attività: salva anche momento, contesto, strumenti, tipo, istantanea
await ev(() => ossWizOpen('S6')); await sleep(2500);
let F = FR();
await F.evaluate(() => { S.dom = 'Quando nessuno guida il gioco, chi prende l’iniziativa?'; S.porta = 'dom'; S.amb = 'S'; S.main = 'S6'; S.mom = 'autunno'; S.ctx = 'libera'; S.dur = 60; S.foc.push({txt:'Osservo chi prende la parola.', extra:[], tocca:[], pid:'S6'}); S.nR = '12'; S.strum = ['GP']; S.strumDet = {GP:[STR.find(s => s.k === 'GP').d.E.split(', ')[0]]}; S.strumAltro = {GP:'Tana segreta'}; S.tipi = ['Gioco']; S.nome = 'Il bivio'; S.lan = 'lancio'; S.svi = 'sviluppo'; S.con = 'conclusione'; });
await F.evaluate(() => salva()); await sleep(900);
let a = await ev(() => ossList().find(x => x.nome === 'Il bivio'));
ok(a && a.mom === 'Prima di Natale' && a.ctx === 'Spazio libero' && a.strum[0] === 'Gruppo di pari' && a.tipi[0] === 'Gioco', 'salvati momento, contesto, strumenti e tipo: ' + JSON.stringify([a && a.mom, a && a.ctx, a && a.strum, a && a.tipi]));
ok(a && a.focD[0].pid === 'S6' && a.strD[0].altro === 'Tana segreta' && a.w && a.w.strumDet.GP.length === 1, 'salvati il focus con il suo percorso, l’«Altro» e l’istantanea per la modifica');
// 2) modifica: riapre il foglio com'era
await ev(id => ossModifica(id), a.id); await sleep(2500); F = FR();
let r = await F.evaluate(() => ({k: visSteps()[S.step].k, nome: S.nome, lan: S.lan, str: S.strum.join(), det: JSON.stringify(S.strumDet), btn: document.querySelector('.aa .btn-primary').textContent, rad: !!document.getElementById('radici-ok'), foc: S.foc.length}));
ok(r.k === 'fog' && r.nome === 'Il bivio' && r.lan === 'lancio' && r.str === 'GP' && r.foc === 1, 'la modifica riapre il foglio con tutto com’era (' + JSON.stringify(r) + ')');
ok(r.btn === 'Salva le modifiche' && !r.rad, 'il pulsante è «Salva le modifiche» e non c’è la raccolta anonima');
await F.evaluate(() => { S.lan = 'lancio nuovo'; S.foc.push({txt:'Secondo focus.', extra:[], tocca:[], pid:'S6'}); salva(); }); await sleep(900);
let b = await ev(id => ({n: ossList().length, a: ossGet(id)}), a.id);
ok(b.n === 3 && b.a.lan === 'lancio nuovo' && b.a.foc.length === 2 && b.a.upd > 0 && b.a.stato === 'pronta' && b.a.aut === 'Anna Verdi' && b.a.id === a.id, 'salvando, la stessa attività si aggiorna (nessun duplicato, stato e autrice invariati)');
// attività vecchia, senza istantanea
await ev(() => ossModifica('a2')); await sleep(2500); F = FR();
r = await F.evaluate(() => ({k: visSteps()[S.step].k, nome: S.nome, main: S.main, also: S.also.join(), foc: S.foc.map(f => f.txt).join()}));
ok(r.k === 'fog' && r.nome === 'La scelta difficile' && r.main === 'S6' && r.also === 'C3' && r.foc === 'Osservo chi cede.', 'anche un’attività salvata prima del giro si riapre per la modifica');
await F.evaluate(() => { S.nome = 'La scelta più difficile'; salva(); }); await sleep(700);
// svolta: cambia il nome nella riga, non i percorsi confermati
await ev(() => ossModifica('a3')); await sleep(2500); F = FR();
await F.evaluate(() => { S.nome = 'Notte di stelle cadenti'; S.also = []; salva(); }); await sleep(700);
b = await ev(() => ({a: ossGet('a3'), r: scheda.pp.occMan.find(x => x.id === 'x2')}));
ok(b.r.att === 'Attività osservativa · Notte di stelle cadenti' && b.r.perc.join() === 'S3,P5' && b.a.stato === 'svolta', 'attività già svolta: la riga cambia nome, i percorsi confermati restano (' + b.r.perc.join() + ')');
// 3) JSON
const dj = await dl(() => ossExportJson('a3')); const j = JSON.parse(fs.readFileSync(await dj.path(), 'utf8'));
ok(j.formato === 'pee-attivita-osservativa' && j.attivita.nome === 'Notte di stelle cadenti' && j.attivita.dom === 'Che cosa li stupisce?' && !j.attivita.occId && !j.attivita.sugg, 'il JSON è completo e non porta con sé dati del progetto');
const dj2 = await dl(() => ossExportJson(ossList().find(x => x.nome === 'Il bivio').id)); const j2 = JSON.parse(fs.readFileSync(await dj2.path(), 'utf8'));
ok(j2.attivita.w && !j2.attivita.w.oss && j2.attivita.strD[0].altro === 'Tana segreta' && j2.attivita.focD.length === 2, 'il JSON dell’attività nuova porta focus, strumenti e istantanea, senza i nomi dello staff');
const nBefore = await ev(() => ossList().length);
await ev(t => ossImportDo(JSON.parse(t)), JSON.stringify(j2)); await sleep(500);
b = await ev(() => ({n: ossList().length, i: ossList().filter(x => x.imp)[0]}));
ok(b.n === nBefore + 1 && b.i.nome === 'Il bivio' && b.i.stato === 'pronta' && b.i.imp.da === 'Anna Verdi' && b.i.id !== j2.attivita.id, 'importando, nasce una nuova attività «pronta» (id nuovo, indicata la fonte)');
await ev(() => ossImportDo({formato:'altro'})); await sleep(200);
ok(await ev(() => ossList().length) === nBefore + 1, 'un file che non è un’attività non crea nulla');
// 4) Word singola e PE
const dw = await dl(() => ossExportWord('a3')); const f1 = '/tmp/oss8a.docx'; await dw.saveAs(f1);
let xml = execSync('unzip -p ' + f1 + ' word/document.xml').toString();
ok(/Notte di stelle cadenti/.test(xml) && /Guardo lo stupore/.test(xml) && /Che cosa li stupisce/.test(xml) && /Si sale sul colle/.test(xml), 'Word della singola attività: titolo, focus, domanda e lancio');
const dw2 = await dl(() => exportSchedaDocx('completo')); const f2 = '/tmp/oss8b.docx'; await dw2.saveAs(f2);
xml = execSync('unzip -p ' + f2 + ' word/document.xml').toString();
ok(/Attività osservative create con lo strumento/.test(xml) && /Guardo lo stupore/.test(xml) && /Che cosa li stupisce/.test(xml) && /Osservo chi prende la parola/.test(xml), 'Word della Programmazione Educativa: sezione con focus, domanda e fasi');
// 5) filtri e lente
await ev(() => anOpen('mine', 'oss')); await sleep(1500);
const sel = await ev(() => [...document.querySelectorAll('#an-ov select')].filter(s => s.offsetParent).map(s => s.options[0].textContent));
ok(sel.includes('Ogni momento dell’anno') && sel.includes('Ogni contesto') && sel.includes('Ogni tipo di attività') && sel.includes('Ogni strumento del Metodo'), 'i filtri ci sono: ' + sel.join(' | '));
await ev(() => { AN.f.mom = 'Prima di Natale'; anRender(); }); await sleep(300);
let t = await ev(() => document.getElementById('an-list').textContent);
ok(/Il bivio/.test(t) && !/La scelta più difficile/.test(t), 'il filtro «momento» lascia solo le attività di quel periodo');
await ev(() => { AN.f.mom = ''; AN.f.str = 'Gruppo di pari'; anRender(); }); await sleep(300);
t = await ev(() => document.getElementById('an-list').textContent);
ok(/Il bivio/.test(t) && !/Notte di stelle/.test(t), 'il filtro «strumento» funziona sulle attività osservative');
await ev(() => anClose());
await ev(() => shSearch()); await sleep(400);
await ev(() => { const i = document.getElementById('sh-sq'); i.value = 'stupore'; i.dispatchEvent(new Event('input', {bubbles:true})); }); await sleep(2500);
t = await ev(() => document.getElementById('sh-sres').textContent);
ok(/Occasioni e attività osservative/.test(t) && /Notte di stelle/.test(t), 'la lente in alto trova le attività osservative anche per focus: ' + t.slice(0, 120));
await ev(() => shSearchClose());
// 6) permessi: chi collabora non modifica le attività altrui
await ev(() => { window._ossRoleX = ossRole; ossRole = () => 'col'; }); 
ok(await ev(() => ossCanEdit(ossGet('a2')) === false), 'chi collabora non può modificare le attività di chi ha il progetto');
await ev(() => { ossRole = window._ossRoleX; });
ok(pa.errors.length === 0, 'nessun errore JS: ' + JSON.stringify(pa.errors.slice(0, 2)));
// 7) Progetto Personale: il Word resta com'è
await goOcc('p1');
const dw3 = await dl(() => exportSchedaDocx('completo')); const f3 = '/tmp/oss8c.docx'; await dw3.saveAs(f3);
xml = execSync('unzip -p ' + f3 + ' word/document.xml').toString();
ok(!/Attività osservative create con lo strumento/.test(xml) && !/Focus del PP/.test(xml) && !/Domanda del PP/.test(xml), 'Progetto Personale: il Word non cambia');
summary(); process.exit(0);
