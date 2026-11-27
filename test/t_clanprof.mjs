// Progetto di Clan sui dispositivi: Richieste dei Gruppi, Disponibilità e prospettive, «Dal Clan» (larghezza, bersagli da toccare, niente fuori scheda)
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
const db = new FakeDB(); const u = db.addUser('luca@x.it', 'password123', 'Cora Coordinatrice');
db.t.pee_profili.push({user_id:u.id, nome:'Cora Coordinatrice', ruolo:'coords', branca:null, sezione:'Pesaro', gruppo:'', area_rcdf:'altoadriatico', dashboard:{}});
const br = await launch(engine); const d = Object.assign({}, dev); delete d.defaultBrowserType; if(engine === 'firefox') delete d.isMobile;
const pa = await person(br, db, {ctx: d}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
console.log('— ' + name + ' (' + engine + ', ' + (d.viewport || {}).width + '×' + (d.viewport || {}).height + ')');
await loginAs(P, base, u); await sleep(2000);
const lungo = 'Costruire un rapporto stabile con le famiglie, con incontri regolari e momenti di festa condivisi tra tutte le Unità di tutti i Gruppi della Sezione';
const now = new Date().toISOString(); const dd = x => Object.assign({v:1, titolareNome:'x', sezione:'Pesaro', analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], disp:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}, x);
const put = (id, own, em, tipo, tit, d) => db.t.pee_piani.push({id, owner_id:own, owner_email:em, tipo, titolo:tit, anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:now, created_at:now, data:d});
put('c1', u.id, 'luca@x.it', 'clan', 'Progetto di Clan con un nome davvero molto molto lungo', dd({obiettivi:[{id:'k1', testo:lungo, aree:['formativa', 'educativa'], ricadute:false, origine:'', rif:'', indirizzi:[]}], disp:[0, 1, 2].map(n => ({id:'d' + n, cosa:lungo + ' ' + n, quanti:'Sei persone', quando:'Luglio e agosto', note:lungo}))}));
put('s1', u.id, 'luca@x.it', 'sezione', 'Progetto di Sezione', dd({}));
[['ga', '1'], ['gb', '2'], ['gc', '3']].forEach(([k, gr]) => { const g = db.addUser(k + '@x.it', 'password123', 'Capo ' + k); db.t.pee_profili.push({user_id:g.id, nome:'Capo ' + k, ruolo:'cg', branca:'', sezione:'Pesaro', gruppo:gr, area_rcdf:'altoadriatico', dashboard:{}});
  put('pg' + k, g.id, k + '@x.it', 'gruppo', 'Piano di Gruppo', dd({obiettivi:[{id:k + 'o', testo:lungo, aree:['educativa'], ricadute:false, origine:'', rif:'', indirizzi:[]}], azioni:[0, 1].map(n => ({id:k + n, ob:k + 'o', testo:lungo + ' ' + k + n, inizio:2, mese:'2027-06', verifica:'ogni', indicatore:'', chi:['cdg', 'clan'], ref:'', stato:'in_corso', genitori:true}))})); });
await ev(() => location.reload()); await sleep(3000);
const sw = async (e) => { const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth, rw: document.getElementById('sh-root').scrollWidth, rc: document.getElementById('sh-root').clientWidth})); ok(w.sw - w.iw <= 1 && w.rw - w.rc <= 1, e + ': niente scorrimento orizzontale'); };
const piccoli = () => ev(() => [...document.querySelectorAll('.pn-chip, .pn-sug, .pn-ib, .sh-btn, .pn-det > summary')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40); }).map(e => e.className + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
const fuori = sel => ev(s => [...document.querySelectorAll(s)].filter(e => { const r = e.getBoundingClientRect(), c = e.closest('.pn-card'); if(!c || r.width === 0) return false; const k = c.getBoundingClientRect(); return r.right > k.right + 1 || r.left < k.left - 1; }).length, sel);
await ev(() => pnOpen('c1')); await sleep(2000); await ev(() => pnSez('ric')); await sleep(600);
await ev(() => document.querySelectorAll('#pn-ric details').forEach(d => d.open = true)); await sleep(300);
ok(await ev(() => document.querySelectorAll('#pn-ric > details').length) === 3, 'Richieste dei Gruppi: 3 Gruppi con richieste');
await sw('Richieste dei Gruppi'); ok(await fuori('#pn-ric .pn-ni, #pn-ric .pn-det') === 0, 'Richieste: niente esce dalle schede');
const p1 = await piccoli(); ok(!p1.length, 'Richieste: righe e pulsanti abbastanza grandi' + (p1.length ? ' («' + p1.slice(0, 4).join(', ') + '»)' : ''));
await ev(() => pnSez('dis')); await sleep(600);
ok(await ev(() => document.querySelectorAll('[id^="pn-dpc-"]').length) === 3, 'Disponibilità e prospettive: 3 voci');
await sw('Disponibilità e prospettive'); ok(await fuori('.pn-sp, .pn-sug') === 0, 'Disponibilità: niente esce dalla scheda');
const p2 = await piccoli(); ok(!p2.length, 'Disponibilità: suggerimenti e pulsanti abbastanza grandi' + (p2.length ? ' («' + p2.slice(0, 5).join(', ') + '»)' : ''));
await P.click('.pn-sug >> nth=0'); await sleep(2800);
ok(db.t.pee_piani.find(p => p.id === 'c1').data.disp.length === 4, 'si aggiunge una voce anche da questo dispositivo, e si salva');
await ev(() => pnSez('pan')); await sleep(500); await sw('Panoramica del Clan');
// il Commissario
db.t.pee_profili.find(x => x.user_id === u.id).ruolo = 'cds';
await ev(() => location.reload()); await sleep(3000);
await ev(() => pnOpen('s1')); await sleep(2000); await ev(() => pnSez('obi')); await sleep(700);
await ev(() => document.querySelectorAll('#pn-pdc details').forEach(d => d.open = true)); await sleep(300);
ok(await ev(() => document.querySelectorAll('#pn-pdc .pn-ni').length) === 1, '«Dal Clan»: 1 obiettivo');
await sw('Dal Clan'); ok(await fuori('#pn-pdc .pn-ni, #pn-pdc .pn-det, #pn-pdc .pn-ul') === 0, 'Dal Clan: niente esce dalla scheda');
const p3 = await piccoli(); ok(!p3.length, 'Dal Clan: pulsanti e righe da toccare abbastanza grandi' + (p3.length ? ' («' + p3.slice(0, 4).join(', ') + '»)' : ''));
await P.click('#pn-pdc .pn-ni button'); await sleep(2800);
ok(db.t.pee_piani.find(p => p.id === 's1').data.obiettivi.some(o => o.clanRif === 'c1:k1'), 'si porta un obiettivo dal Clan anche da questo dispositivo, e si salva');
ok(!pa.errors.length, 'nessun errore nella pagina' + (pa.errors.length ? ': ' + pa.errors[0].slice(0, 160) : ''));
process.exit(summary() ? 1 : 0);
