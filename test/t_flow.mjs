// Giro completo dell'app su un profilo (motore + dispositivo): sezioni, larghezza, Word ed Excel
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const name = process.argv[2] || 'chrome-win';
const [engine, dev] = PROFILES[name];
const base = await serve();
const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
const d = Object.assign({}, dev); delete d.defaultBrowserType; if(engine === 'firefox') delete d.isMobile;
const pa = await person(br, db, {ctx: d});
const P = pa.page, ev = (f, a) => P.evaluate(f, a);
console.log('— ' + name + ' (' + engine + ', ' + (d.viewport||{}).width + '×' + (d.viewport||{}).height + ')');
await loginAs(P, base, A);
await ev(() => exStart()); await sleep(2500);
ok(await ev(() => UNIT_NAME === 'Reparto Kontiki'), 'progetto di esempio aperto');
const over = [];
for(const k of ['1a', '1b', '1c', '1d', '2', '3', '4', '5', 'chk']){
  await ev(k => { if(k === '1c') goPhaseInternal(2); else gGo(k); }, k); await sleep(700);
  const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth}));
  if(w.sw - w.iw > 1) over.push(k + ':' + w.sw + '>' + w.iw);
}
ok(!over.length, 'nessuna sezione più larga dello schermo' + (over.length ? ' (' + over.join(', ') + ')' : ''));
// organizzazione dell'attività e materiali di pattuglia
await ev(() => { gGo('3'); }); await sleep(600);
await ev(() => { const x = axX(0, 0); x.sqSel = ['Tenda', 'Cassone di pattuglia completo']; x.sqAltro = 'Pentolone'; x.portareSel = ['Maglia termica', 'Sacco a pelo']; saveData(true); axRe(0, 0); });
async function dl(fn, label){
  const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(fn)]);
  const f = await d.path(); const b = fs.readFileSync(f);
  return {name: d.suggestedFilename(), size: b.length, buf: b};
}
async function xml(b){ const z = await JSZip.loadAsync(b); const f = z.file('word/document.xml'); return f ? (await f.async('string')).replace(/<[^>]+>/g, '') : ''; }
try{ const c = await dl(() => axMsgDocx(0, 0)); const t = await xml(c.buf);
  ok(c.size > 5000 && /Di pattuglia/.test(t) && /cassone di pattuglia completo/i.test(t) && /Maglia termica/.test(t), 'Word della circolare: ' + c.name + ' (' + Math.round(c.size/1024) + ' KB), con «Di pattuglia» e «Maglia termica»'); }
catch(e){ ok(false, 'Word della circolare: ' + e.message); }
try{ const c = await dl(() => axDocx(0, 0)); const t = await xml(c.buf); ok(c.size > 5000 && /Di pattuglia/.test(t), 'Word della scheda dell’attività: ' + c.name + ' (' + Math.round(c.size/1024) + ' KB)'); }
catch(e){ ok(false, 'Word dell’attività: ' + e.message); }
try{ await ev(() => fdgOpen(0, 0)); await sleep(500); const c = await dl(() => fdgDocx()); ok(c.size > 4000, 'Word del foglio del giorno: ' + c.name + ' (' + Math.round(c.size/1024) + ' KB)'); await ev(() => { try{ modalClose(); }catch(e){} document.querySelectorAll('.modal-overlay.show').forEach(o => o.classList.remove('show')); }); }
catch(e){ ok(false, 'Word del foglio del giorno: ' + e.message); }
try{ await ev(() => { scheda.pp.prog = 'cond'; saveData(true); }); const c = await dl(() => exportSchedaDocx()); const t = await xml(c.buf);
  ok(c.size > 10000 && /Sezione/.test(t) && !/Come programmi|Programmazione condivisa|Programmazione individuale/.test(t), 'Word della Scheda: ' + c.name + ' (' + Math.round(c.size/1024) + ' KB), senza «Come programmi?»'); }
catch(e){ ok(false, 'Word della Scheda: ' + e.message); }
try{ const c = await dl(() => exportExcel()); ok(c.size > 4000, 'Excel: ' + c.name + ' (' + Math.round(c.size/1024) + ' KB)'); }
catch(e){ ok(false, 'Excel: ' + e.message); }
// finestre principali a schermo piccolo: dentro lo schermo
await ev(() => { clOpen(); }); await sleep(800);
const ov = await ev(() => { const b = document.querySelector('#cl-ov .cl-box').getBoundingClientRect(); return b.left >= -1 && b.right <= window.innerWidth + 1; });
ok(ov, 'archivio dentro lo schermo');
await ev(() => clClose());
await ev(() => { gGo('1a'); progSet('cond'); }); await sleep(800);
const st = await ev(() => document.querySelectorAll('#staff-tab .st-chk').length);
ok(st > 0, 'tabella dello staff con le spunte di condivisione');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
