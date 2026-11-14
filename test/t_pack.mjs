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
ok(/progetti personali che segui/i.test(s) && /Anna Rossi/.test(s) && /Giro 1/.test(s) && /Leggi e rivedi/.test(s) && /Scarica il Word/.test(s) && /Concludi la revisione/.test(s), 'home del revisore: pannello per compilatore con «Leggi e rivedi», Word e «Concludi»: ' + s.replace(/\n/g,' | ').slice(0,140));
import { createRequire } from 'module'; const req = createRequire(import.meta.url); const JSZip = req('./libs/node_modules/jszip');
db.delay = +(process.env.DELAY || 0);
if(process.env.FAILDOCX) await PL.context().route(/docx@8\.5\.0/, (() => { let n = 0; return r => (++n > 1 ? r.abort() : r.fallback()); })());
const t0 = Date.now();
const [dl] = await Promise.all([PL.waitForEvent('download', {timeout:200000}).catch(() => null), el(a => rvPackage(a), g0.archivio_id)]);
console.log('download dopo', Math.round((Date.now()-t0)/1000), 's'); if(dl) ok(/ - \d{2}-\d{2}-\d{4}\.zip$/.test(dl.suggestedFilename()), 'nome del pacchetto con data gg-mm-aaaa: ' + dl.suggestedFilename());
if(dl){ const p = await dl.path(); const z = await JSZip.loadAsync((await import('fs')).readFileSync(p)); const names = Object.keys(z.files).filter(n => !z.files[n].dir); console.log(names.join('\n')); const lm = names.find(n => /LEGGIMI/.test(n)); console.log((await z.file(lm).async('string')).split('Note:')[1] || 'nessuna nota'); if(!process.env.FAILDOCX) ok(names.some(n => /copie\/Copia 1 - \d{2}-\d{2}-\d{4}\/.*\.docx$/.test(n)), 'il pacchetto contiene il Word della copia (cartella con data gg-mm-aaaa)'); else ok(!names.some(n => /copie\/.*\.docx$/.test(n)) && /Word non disponibile per la copia 1 \(/.test(await z.file(lm).async('string')), 'senza Word: nota con il motivo'); }
const ro = await el(() => sessionStorage.getItem('bussola_ro')); console.log('bussola_ro dopo il pacchetto:', ro); ok(!ro, 'dopo il pacchetto la scheda principale non resta in modalità copia (un refresh non riapre la revisione)');
summary(); process.exit(0);
