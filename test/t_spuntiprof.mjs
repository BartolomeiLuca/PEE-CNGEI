// Bacheca «Dal giro al Piano», Verifiche e «I tuoi passi» sui dispositivi: larghezza, bersagli da toccare, finestra «Dove lo porti?»
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
const lungo = 'Costruire un rapporto stabile con le famiglie, con incontri regolari e momenti di festa condivisi tra tutte le Unità del Gruppo';
const ob = {id:'o1', testo:lungo, aree:['educativa'], origine:'', rif:'', ricadute:false};
db.t.pee_piani.push({id:'p1', owner_id:u.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, analisi:[], swot:null, obiettivi:[ob], azioni:[{id:'a1', ob:'o1', testo:lungo, inizio:1, verifica:'ogni', indicatore:'Fatto?', chi:[], ref:'', stato:'da_iniziare', genitori:false, step:'meta'}], uniti:[], spunti:[], tappe:[], delibera:{data:'', luogo:''}}});
db.t.pee_piani_giri.push({id:'g1', piano_id:'p1', n:1, stato:'chiuso', ritmo:'standard', fase:'giro1', scadenza:null, creato_da:u.id, created_at:'2026-11-24T10:00:00Z', chiuso_il:'2026-11-25T10:00:00Z', chiusura_tipo:'anticipata'});
const carte = a => ({id:'c' + Math.random(), giro_id:'g1', piano_id:'p1', autore_id:'u' + Math.random(), autore_nome:'Persona con un nome molto lungo e complicato', tipo:'carte', consegnato:true, consegnato_il:'2026-11-25T09:00:00Z', data:{v:1, a}});
db.t.pee_piani_contributi.push(Object.assign(carte({educativa:{v:lungo, c:lungo, p:lungo + ' ' + lungo, b:false}, gestionale:{v:'', c:'', p:lungo, b:false}}), {autore_id:u.id, autore_nome:'Luca Titolare'}), carte({sviluppo:{v:'', c:lungo, p:lungo, b:false}, territorio:{v:'', c:'', p:lungo, b:false}}));
db.t.pee_piani_contributi.push({id:'cu1', giro_id:'g1', piano_id:'p1', autore_id:'zz', autore_nome:'Marco', tipo:'unita', consegnato:true, consegnato_il:'2026-11-25T09:00:00Z', data:{v:1, unita:'Reparto Aquile', b:{b7r:lungo, b7o:lungo}, s:{}, n:{}}});
await ev(() => shGoHome()); await sleep(1500);
const sw = async (etichetta) => { const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth, rw: document.getElementById('sh-root').scrollWidth, rc: document.getElementById('sh-root').clientWidth})); ok(w.sw - w.iw <= 1 && w.rw - w.rc <= 1, etichetta + ': la pagina non scorre di lato'); };
await ev(() => pnOpen('p1')); await sleep(1800);
const piccoli = sel => ev(s => [...document.querySelectorAll(s)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 36 || r.width < 36); }).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)), sel);
const fuori = sel => ev(s => [...document.querySelectorAll(s)].filter(e => { const r = e.getBoundingClientRect(), c = e.closest('.pn-card'); if(!c) return false; const q = c.getBoundingClientRect(); return r.width > 0 && (r.right > q.right + 1 || r.left < q.left - 1); }).length, sel);
// giro: I tuoi passi
await ev(() => pnSez('g-giro')); await sleep(600); await sw('giro con «I tuoi passi»');
let pg = await piccoli('.gi-pas .sh-btn, .pn-side .sh-si'); ok(!pg.length, 'I tuoi passi: pulsanti da toccare abbastanza grandi' + (pg.length ? ' («' + pg.join(', ') + '»)' : ''));
// bacheca
await ev(() => pnSez('g-spu')); await sleep(700); await sw('bacheca');
pg = await piccoli('.spg-f, .spg-c .sh-btn'); ok(!pg.length, 'bacheca: filtri e pulsanti abbastanza grandi da toccare' + (pg.length ? ' («' + pg.join(', ') + '»)' : ''));
ok(await fuori('.spg-c, .spg-fr, .spg-f') === 0, 'bacheca: nulla esce dalla scheda');
ok(await ev(() => document.querySelectorAll('.spg-c').length) === 8, 'bacheca: 8 spunti da decidere');
await P.click('.spg-c >> nth=0 >> button >> text=Nel Piano'); await sleep(600);
const f = await ev(() => { const dl = document.getElementById('sh-dlg').getBoundingClientRect(); const ov = document.getElementById('sh-ov'); return dl.left >= -1 && dl.right <= window.innerWidth + 1 && (dl.bottom <= window.innerHeight + 1 || getComputedStyle(ov).overflowY !== 'visible'); });
ok(f, 'finestra «Dove lo porti?» dentro lo schermo (o scorrevole)');
pg = await piccoli('#sh-dlg .sh-btn, #sh-dlg .gi-rit'); ok(!pg.length, 'finestra: pulsanti e scelte abbastanza grandi' + (pg.length ? ' («' + pg.join(', ') + '»)' : ''));
await P.click('#spg-ok'); await sleep(700);
ok(await ev(() => PN.d.obiettivi.length) === 2 && await ev(() => document.querySelectorAll('.spg-c').length) === 7, 'dal dispositivo: lo spunto diventa obiettivo');
// verifiche
await ev(() => pnSez('ver')); await sleep(500); await P.click('button[onclick="pnTappeProponi()"]'); await sleep(600); await sw('verifiche');
pg = await piccoli('.pn-ve .sh-in, .pn-ve .pn-chip, .pn-ve .pn-ib, .pn-card .sh-btn'); ok(!pg.length, 'verifiche: campi e pulsanti abbastanza grandi' + (pg.length ? ' («' + pg.join(', ') + '»)' : ''));
ok(await fuori('.pn-ve, .pn-ve .sh-in, .pn-ve .pn-chip') === 0, 'verifiche: nulla esce dalla scheda');
const t1 = await ev(() => PN.d.tappe[0].id); await P.fill('#pn-vd-' + t1, '2027-02-20'); await P.fill('#pn-vn-' + t1, lungo + ' ' + lungo); await sleep(2800);
ok(await ev(() => !PN.dirty) && db.t.pee_piani[0].data.tappe.length === 6 && db.t.pee_piani[0].data.tappe[0].data === '2027-02-20', 'verifiche: data e note si salvano dal dispositivo');
await ev(() => pnSez('pan')); await sleep(400); await sw('panoramica con «Prossima verifica»');
ok(!pa.errors.length, 'nessun errore nella pagina' + (pa.errors.length ? ': ' + pa.errors[0].slice(0, 160) : ''));
await br.close(); process.exit(summary() ? 1 : 0);
