// Elenco persone nel dialogo «Chi ha accesso» e profilo: aspetto sui dispositivi
import { devices } from 'playwright';
import { FakeDB, serve, launch, person, loginAs, sleep, ok } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const name = process.argv[2] || 'chrome-win'; const [engine, dev] = PROFILES[name];
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'Gruppo Pesaro con un nome molto molto lungo', area_rcdf:'altoadriatico', dashboard:{}});
for(let i = 0; i < 9; i++){ const u = db.addUser('p' + i + '@x.it', 'password123', 'P'); db.t.pee_profili.push({user_id:u.id, nome:'Anna Maria Verdi Rossi Bianchi ' + i, ruolo:i % 3 ? 'cu' : 'cos', branca:'E', sezione:'Pesaro', gruppo:'Gruppo Pesaro con un nome molto molto lungo', area_rcdf:'altoadriatico', dashboard:{cos:{incarichi:['Presidente', 'Tesoriere']}}}); }
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di Gruppo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:{v:1, analisi:[], swot:null, obiettivi:[], azioni:[]}});
const br = await launch(engine); const d = Object.assign({}, dev); delete d.defaultBrowserType; if(engine === 'firefox') delete d.isMobile;
const pa = await person(br, db, {ctx: d}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
console.log('— ' + name + ' (' + engine + ', ' + (d.viewport || {}).width + '×' + (d.viewport || {}).height + ')');
await loginAs(P, base, luca); await sleep(2000);
await ev(() => pnOpen('p1')); await sleep(1500); await ev(() => pnShare()); await sleep(1500);
ok(await ev(() => document.querySelectorAll('#pn-el .pn-chk').length) === 9, 'elenco con 9 persone');
const w = await ev(() => { const dl = document.getElementById('sh-dlg'); const r = dl.getBoundingClientRect(); return {sw:dl.scrollWidth, cw:dl.clientWidth, r:r.right, l:r.left, iw:window.innerWidth, dsw:document.documentElement.scrollWidth}; });
ok(w.sw - w.cw <= 1 && w.r <= w.iw + 1 && w.l >= -1 && w.dsw - w.iw <= 1, 'il dialogo sta nello schermo, senza scorrimento orizzontale (' + w.sw + '/' + w.cw + ')');
const fuori = await ev(() => { const dl = document.getElementById('sh-dlg').getBoundingClientRect(); return [...document.querySelectorAll('#pn-el .pn-chk, #pn-el select, #pn-el-ok')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > dl.right + 1 || r.left < dl.left - 1); }).length; });
ok(fuori === 0, 'righe e menu non escono dal dialogo');
const piccoli = await ev(() => [...document.querySelectorAll('#pn-el .pn-chk, #pn-el select, #pn-el-ok')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 36 || r.width < 36); }).length);
ok(piccoli === 0, 'bersagli abbastanza grandi da toccare');
// si raggiunge il pulsante scorrendo nel dialogo
await ev(() => document.getElementById('pn-el-ok').scrollIntoView({block:'center'})); await sleep(200);
const vis = await ev(() => { const r = document.getElementById('pn-el-ok').getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight + 1; });
ok(vis, 'il pulsante «Invita le persone spuntate» si raggiunge scorrendo');
await P.check('#pn-el input[type=checkbox] >> nth=0'); await P.check('#pn-el input[type=checkbox] >> nth=1'); await P.click('#pn-el-ok'); await sleep(1500);
ok(db.t.pee_piani_membri.filter(m => m.piano_id === 'p1').length === 2, 'si invita dal dispositivo');
await ev(() => shDlgClose()); await ev(() => shGoHome()); await sleep(600); await ev(() => shProfileOpen()); await sleep(800);
const pv = await ev(() => { const e = document.getElementById('sh-privel'); if(!e) return null; const r = e.getBoundingClientRect(); return {t:e.textContent.length, ok:r.right <= window.innerWidth + 1 && r.left >= -1, dsw:document.documentElement.scrollWidth - window.innerWidth}; });
ok(pv && pv.ok && pv.dsw <= 1, 'la frase di privacy nel profilo sta nello schermo');
await P.fill('#sh-sez', 'Pesaro CNGEI'); await P.dispatchEvent('#sh-sez', 'input'); await sleep(200);
const sz = await ev(() => { const l = document.getElementById('sh-sezlw').getBoundingClientRect(), h = document.getElementById('sh-sezh').getBoundingClientRect(); return {l:l.right <= window.innerWidth + 1 && l.left >= -1 && l.height >= 36, h:h.right <= window.innerWidth + 1 && h.left >= -1 && h.height > 0, dsw:document.documentElement.scrollWidth - window.innerWidth}; });
ok(sz.l && sz.h && sz.dsw <= 1, 'Sezione: suggerimento e casella «non è in elenco» stanno nello schermo e si toccano bene');
ok(pa.errors.length === 0, 'nessun errore di pagina (' + pa.errors.length + ')');
await br.close(); process.exit(0);
