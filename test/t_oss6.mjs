// Le attività osservative viaggiano con il progetto: Word, esportazione JSON e ricarica del file
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
const A3 = {id:'a3', nome:'Notte di stelle', aut:'Anna Verdi', ruolo:'tit', stato:'svolta', main:'S3', also:['P5'], dom:'Che cosa li stupisce?', foc:['Guardo lo stupore.'], dur:30, lan:'Si sale sul colle.', svi:'Si guarda il cielo.', con:'Si torna.', at:1, data:'2026-11-02', occId:'x2', sugg:{}};
const A2 = {id:'a2', nome:'La scelta difficile', aut:'Anna Verdi', ruolo:'tit', stato:'pronta', main:'S6', also:['C3'], dom:'', foc:['Osservo chi cede.'], dur:45, lan:'Un bivio.', svi:'Si sceglie.', con:'Si racconta.', at:2, anAt:1762900000000, sugg:{}};
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}],
  occMan:[{id:'x2', att:'Attività osservativa · Notte di stelle', data:'2026-11-02', ctx:'', chi:'Anna Verdi', note:'', perc:['S3','P5']}], attOss:{a2:A2, a3:A3}}}}, created_at:ts, updated_at:ts});
await loginAs(P, base, u); await sleep(1200);
await ev(() => shOpen('c1', 0)).catch(() => {}); await sleep(2800); await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
const dl = async fn => { const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), P.evaluate(fn)]); return d; };
// JSON
await ev(() => clOpen()); await sleep(1500);
const dj = await dl(() => clBackup()); const j = JSON.parse(fs.readFileSync(await dj.path(), 'utf8'));
const oo = (((j.data || j).scheda || {}).pp || {}).attOss || {};
ok(Object.keys(oo).sort().join() === 'a2,a3' && oo.a3.foc[0] === 'Guardo lo stupore.' && oo.a3.occId === 'x2' && oo.a2.anAt === 1762900000000, 'l’esportazione JSON contiene le attività osservative complete');
// ricarica del file come copia
await ev(t => { clRestore({files:[new File([t], 'backup.json', {type:'application/json'})], value:''}); }, JSON.stringify(j)); await sleep(800);
await ev(() => clRestoreOne(0)); await sleep(2500);
const cp = db.t.pee_archivi.find(r => /\(caricato\)/.test(r.titolo));
const co = cp && ((cp.data.scheda || {}).pp || {}).attOss;
ok(!!co && co.a3 && co.a3.nome === 'Notte di stelle' && co.a2.lan === 'Un bivio.' && (cp.data.scheda.pp.occMan || []).length === 1, 'ricaricando il file, la copia ha le stesse attività e la stessa occasione');
ok(db.t.pee_archivi.find(r => r.id === 'c1').data.scheda.pp.attOss.a3.nome === 'Notte di stelle', 'il progetto originale non è cambiato');
// Word
const dw = await dl(() => exportSchedaDocx('completo')); const f = '/tmp/oss6.docx'; await dw.saveAs(f);
const xml = execSync('unzip -p ' + f + ' word/document.xml').toString();
ok(/Notte di stelle/.test(xml) && /Occasioni osservative/i.test(xml), 'il Word contiene l’occasione osservativa «Notte di stelle»');
ok(!/Che cosa li stupisce/.test(xml) && !/Guardo lo stupore/.test(xml), 'nel Word non finiscono la domanda sul gruppo né i focus (restano nell’app)');
ok(pa.errors.length === 0, 'nessun errore JS: ' + JSON.stringify(pa.errors.slice(0, 2)));
summary(); process.exit(0);
