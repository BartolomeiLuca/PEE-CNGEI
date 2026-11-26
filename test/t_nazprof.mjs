// B2e: pagina «Piano nazionale» e scelta degli indirizzi sui dispositivi (larghezza, bersagli da toccare, niente fuori scheda)
import { devices } from 'playwright';
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const name = process.argv[2] || 'chrome-win'; const [engine, dev] = PROFILES[name];
const base = (await serve()) + 'anteprima/';
const db = new FakeDB(); const u = db.addUser('luca@x.it', 'password123', 'Luca Titolare');
db.t.pee_profili.push({user_id:u.id, nome:'Luca Titolare', ruolo:'cg', branca:null, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const br = await launch(engine); const d = Object.assign({}, dev); delete d.defaultBrowserType; if(engine === 'firefox') delete d.isMobile;
const pa = await person(br, db, {ctx: d}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
console.log('— ' + name + ' (' + engine + ', ' + (d.viewport || {}).width + '×' + (d.viewport || {}).height + ')');
await loginAs(P, base, u); await sleep(2000);
const ob = (id, t, ind) => ({id, testo:t, aree:['educativa'], ricadute:false, origine:'', rif:'', indirizzi:ind});
db.t.pee_piani.push({id:'p1', owner_id:u.id, owner_email:'luca@x.it', tipo:'sezione', titolo:'Progetto di Sezione con un nome davvero molto molto lungo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca', sezione:'Pesaro', analisi:[], swot:null, obiettivi:[ob('o1', 'Più famiglie nel Gruppo, con incontri regolari e momenti di festa condivisi', ['ps26:4.2', 'ps26:1.1', 'ps26:2.1']), ob('o2', 'Formare i Capi', [])], azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
await ev(() => shGoHome()); await sleep(1500);
await P.click('#sh-piani .pn-row button'); await sleep(1500);
const sw = async (e) => { const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth, rw: document.getElementById('sh-root').scrollWidth, rc: document.getElementById('sh-root').clientWidth})); ok(w.sw - w.iw <= 1 && w.rw - w.rc <= 1, e + ': niente scorrimento orizzontale della pagina (' + w.sw + '/' + w.iw + ')'); };
const piccoli = () => ev(() => [...document.querySelectorAll('.pn-chip, .pn-ib, .sh-btn, .pn-det > summary')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40); }).map(e => e.className + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
const fuori = () => ev(() => [...document.querySelectorAll('.pn-ni, .pn-chip, .pn-nchip, .pn-det, .pn-ni-ob, .pn-ul')].filter(e => { const r = e.getBoundingClientRect(), c = e.closest('.pn-card'); if(!c || r.width === 0) return false; const k = c.getBoundingClientRect(); return r.right > k.right + 1 || r.left < k.left - 1; }).length);
// pagina Piano nazionale
await ev(() => pnSez('naz')); await sleep(500);
ok(await ev(() => document.querySelectorAll('.pn-ni').length) === 18, 'pagina Piano nazionale: 18 indirizzi');
await sw('Piano nazionale'); ok(await fuori() === 0, 'Piano nazionale: niente esce dalle schede');
await ev(() => document.querySelectorAll('.pn-det').forEach(d => d.open = true)); await sleep(300);
await sw('Piano nazionale con i KPI aperti'); ok(await fuori() === 0, 'KPI aperti: niente esce dalle schede');
const pc = await piccoli(); ok(!pc.length, 'Piano nazionale: riquadri da toccare abbastanza grandi' + (pc.length ? ' («' + pc.slice(0, 4).join(', ') + '»)' : ''));
// scelta nell'obiettivo
await ev(() => pnSez('obi')); await sleep(400); await ev(() => pnObTutti(true)); await sleep(400);
await ev(() => document.querySelectorAll('.pn-ob .pn-det').forEach(d => d.open = true)); await sleep(300);
ok(await ev(() => document.querySelectorAll('.pn-chip.pi').length) === 36, 'obiettivi: 18 indirizzi scegliibili per obiettivo');
await sw('obiettivi con gli indirizzi aperti'); ok(await fuori() === 0, 'obiettivi: nessun indirizzo esce dalla scheda');
const pc2 = await piccoli(); ok(!pc2.length, 'obiettivi: caselle degli indirizzi abbastanza grandi' + (pc2.length ? ' («' + pc2.slice(0, 4).join(', ') + '»)' : ''));
await P.click('#pn-ob-o2 .pn-chip.pi >> nth=0'); await sleep(2800);
ok(db.t.pee_piani[0].data.obiettivi[1].indirizzi.length === 1, 'si sceglie un indirizzo anche da questo dispositivo, e si salva');
ok(!pa.errors.length, 'nessun errore nella pagina' + (pa.errors.length ? ': ' + pa.errors[0].slice(0, 160) : ''));
process.exit(summary() ? 1 : 0);
