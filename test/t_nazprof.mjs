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
// scelta nell'obiettivo
await ev(() => pnSez('obi')); await sleep(400); await ev(() => pnObTutti(true)); await sleep(400);
await ev(() => document.querySelectorAll('.pn-ob .pn-det').forEach(d => d.open = true)); await sleep(300);
ok(await ev(() => document.querySelectorAll('.pn-chip.pi').length) === 36, 'obiettivi: 18 indirizzi scegliibili per obiettivo');
await sw('obiettivi con gli indirizzi aperti'); ok(await fuori() === 0, 'obiettivi: nessun indirizzo esce dalla scheda');
const pc2 = await piccoli(); ok(!pc2.length, 'obiettivi: caselle degli indirizzi abbastanza grandi' + (pc2.length ? ' («' + pc2.slice(0, 4).join(', ') + '»)' : ''));
await P.click('#pn-ob-o2 .pn-chip.pi >> nth=0'); await sleep(2800);
ok(db.t.pee_piani[0].data.obiettivi[1].indirizzi.length === 1, 'si sceglie un indirizzo anche da questo dispositivo, e si salva');
// Piano di Gruppo con il Progetto di Sezione deliberato della propria Sezione
const uc = db.addUser('comm@x.it', 'password123', 'Dino Commissario'); db.t.pee_profili.push({user_id:uc.id, nome:'Dino Commissario', ruolo:'cds', branca:null, sezione:'Pesaro', gruppo:'', area_rcdf:'altoadriatico', dashboard:{}});
const lungo2 = 'Costruire un rapporto stabile con le famiglie, con incontri regolari e momenti di festa condivisi tra tutte le Unità di tutti i Gruppi della Sezione';
db.t.pee_piani.push({id:'s1', owner_id:uc.id, owner_email:'comm@x.it', tipo:'sezione', titolo:'Progetto di Sezione Pesaro', anno_inizio:2026, durata:3, stato:'deliberato', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, sezione:'Pesaro', analisi:[], swot:null, obiettivi:[0, 1, 2, 3].map(n => ({id:'so' + n, testo:lungo2 + ' ' + n, aree:['educativa', 'gestionale', 'territorio'], ricadute:false, origine:'', rif:'', indirizzi:['ps26:1.1', 'ps26:2.1', 'ps26:4.2']})), azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
db.t.pee_piani.push({id:'g1', owner_id:u.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di Gruppo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca', sezione:'Pesaro', analisi:[], swot:null, obiettivi:[ob('go1', 'Più famiglie nel Gruppo', [])], azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
await ev(() => pnOpen('g1')); await sleep(1800); await ev(() => pnSez('obi')); await sleep(600);
ok(await ev(() => document.querySelectorAll('#pn-pds .pn-ni').length) === 4, 'Piano di Gruppo: elenco «Dal Progetto di Sezione» con 4 obiettivi');
await sw('Dal Progetto di Sezione'); ok(await fuori() === 0, 'Dal Progetto di Sezione: niente esce dalle schede');
const pc3 = await piccoli(); ok(!pc3.length, 'Dal Progetto di Sezione: pulsanti abbastanza grandi' + (pc3.length ? ' («' + pc3.slice(0, 4).join(', ') + '»)' : ''));
await ev(() => pnObTutti(true)); await sleep(400);
const selOk = await ev(() => { const e = document.querySelector('#pn-obs-go1'); if(!e) return false; const r = e.getBoundingClientRect(), c = e.closest('.pn-card').getBoundingClientRect(); return r.height >= 40 && r.left >= c.left - 1 && r.right <= c.right + 1; });
ok(selOk, 'la scelta «Dal Progetto di Sezione» sull’obiettivo sta nella scheda ed è grande abbastanza');
await sw('obiettivo con la scelta dal Progetto di Sezione');
await P.click('#pn-pds-so0 button'); await sleep(2800);
ok(db.t.pee_piani.find(p => p.id === 'g1').data.obiettivi.length === 2, 'si porta un obiettivo nel piano anche da questo dispositivo, e si salva');
// Progetto di Sezione: «Dai Gruppi della Sezione» (il titolare diventa Commissario)
db.t.pee_profili.find(x => x.user_id === u.id).ruolo = 'cds';
const mkG = (k, gr) => { const g = db.addUser(k + '@x.it', 'password123', 'Capo ' + k); db.t.pee_profili.push({user_id:g.id, nome:'Capo ' + k, ruolo:'cg', branca:'', sezione:'Pesaro', gruppo:gr, area_rcdf:'altoadriatico', dashboard:{}}); return g; };
[['ga', '1'], ['gb', '2'], ['gc', '3']].forEach(([k, gr]) => { const g = mkG(k, gr); db.t.pee_piani.push({id:'pg' + k, owner_id:g.id, owner_email:k + '@x.it', tipo:'gruppo', titolo:'Piano di Gruppo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, sezione:'Pesaro', analisi:[], swot:null, obiettivi:[0, 1, 2].map(n => ({id:k + n, testo:lungo2 + ' ' + k + n, aree:['educativa', 'gestionale', 'territorio'], ricadute:false, origine:'', rif:'', indirizzi:['ps26:1.1', 'ps26:4.2']})), azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}}); });
await ev(() => location.reload()); await sleep(3000);
await ev(() => pnOpen('p1')); await sleep(1900); await ev(() => pnSez('obi')); await sleep(700);
ok(await ev(() => document.querySelectorAll('#pn-pdg > details').length) === 4, 'Progetto di Sezione: «Dai Gruppi della Sezione» con i 4 Piani di Gruppo della Sezione');
await ev(() => document.querySelectorAll('#pn-pdg details').forEach(d => d.open = true)); await sleep(300);
await sw('Dai Gruppi della Sezione'); const pc4 = await piccoli(); ok(!pc4.length, 'Dai Gruppi: pulsanti e righe da toccare abbastanza grandi' + (pc4.length ? ' («' + pc4.slice(0, 4).join(', ') + '»)' : ''));
ok(await ev(() => [...document.querySelectorAll('#pn-pdg .pn-ni, #pn-pdg summary, #pn-pdg .pn-nchip')].filter(e => { const r = e.getBoundingClientRect(), c = document.querySelector('#pn-pdg').getBoundingClientRect(); return r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1); }).length) === 0, 'Dai Gruppi: niente esce dalla scheda');
await P.click('#pn-pdg-pgga .pn-ni >> nth=0 >> button'); await sleep(2800);
ok(db.t.pee_piani.find(p => p.id === 'p1').data.obiettivi.some(o => /^pgga:/.test(o.pdgRif || '')), 'si porta un obiettivo dal Gruppo anche da questo dispositivo, e si salva');
ok(!pa.errors.length, 'nessun errore nella pagina' + (pa.errors.length ? ': ' + pa.errors[0].slice(0, 160) : ''));
process.exit(summary() ? 1 : 0);
