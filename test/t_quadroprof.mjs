// Quadro del Piano (B2b): aspetto e uso sui dispositivi (nessun scorrimento della pagina, bersagli da toccare, tabella o schede, clic che porta a modificare)
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
// un piano ricco: 8 obiettivi, ognuno con 2 azioni, testi lunghi
const lungo = 'Costruire un rapporto stabile con le famiglie, con incontri regolari e momenti di festa condivisi tra tutte le Unità del Gruppo';
const obs = Array.from({length:8}, (_, i) => ({id:'o' + i, testo:lungo + ' ' + (i + 1), aree:['educativa', 'gestionale', 'territorio'].slice(0, 1 + i % 3), ricadute:i % 2 === 0, origine:'proprio', rif:'Obiettivo 4 del Progetto di Sezione'}));
const azs = obs.flatMap((o, i) => [0, 1].map(j => Object.assign({id:'a' + i + j, ob:o.id, testo:'Organizzare una serata con i genitori e una festa di Gruppo ' + j, inizio:1 + j, verifica:'ogni', indicatore:'Abbiamo coinvolto almeno metà delle famiglie?', chi:['cdg', 'unita'], ref:'Anna Maria Rossi Bianchi', stato:'in_corso', genitori:true}, j === 0 ? {mese:'2026-10', tipo:'cont', fine:'piano', urgente:true} : {mese:'2027-03', tipo:'una'})));   // 27/11: mese, tipo, fine, urgente
db.t.pee_piani.push({id:'p1', owner_id:u.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di Gruppo · Pesaro · Gruppo Pesaro con un nome molto molto lungo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:{v:1, analisi:[{id:'t1', titolo:'Punti di forza e di debolezza', testo:lungo}], swot:null, obiettivi:obs, azioni:azs, uniti:[], spunti:[{id:'s1', da:'Lupetti e Lupette', testo:lungo}], delibera:{data:'', luogo:''}}});
await ev(() => shGoHome()); await sleep(1500);
await P.click('#sh-piani .pn-row button'); await sleep(1500);
await ev(() => { PN.d.azioni.forEach((a, i) => { a.mese = i % 3 === 2 ? '' : (i % 2 ? '2027-03' : '2026-11'); a.tipo = i % 2 ? 'cont' : 'una'; if(a.tipo === 'cont') a.fine = 'piano'; a.ref = i % 4 === 0 ? 'Anna Rossi con un cognome piuttosto lungo' : ''; a.urgente = i === 1; a.chi = ['cdg', 'unita']; a.stato = ['da_iniziare', 'in_corso', 'fatta'][i % 3]; }); });
await P.click('#pn-sb-qua'); await sleep(500); 
ok(await ev(() => document.querySelectorAll('.pn-qa').length) === 16, 'il Quadro mostra tutte le 16 azioni');
const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth, rw: document.getElementById('sh-root').scrollWidth, rc: document.getElementById('sh-root').clientWidth}));
ok(w.sw <= w.iw + 1 && w.rw <= w.rc + 1, 'la pagina non scorre in orizzontale (' + JSON.stringify(w) + ')');
const fuori = await ev(() => [...document.querySelectorAll('.pn-qa td, .pn-qoh, .pn-qf select')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1); }).length);
ok(fuori === 0, 'nessuna cella o filtro esce dallo schermo (' + fuori + ')');
const soglia = (d.hasTouch || (d.viewport || {}).width <= 700) ? 40 : 24;
const piccoli = await ev(min => [...document.querySelectorAll('.pn-qf select, .pn-qf .pn-chip, .pn-qa a, .pn-qoh a')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height < min; }).map(e => (e.id || e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height)).slice(0, 5), soglia);
ok(!piccoli.length, 'filtri e collegamenti abbastanza grandi da toccare' + (piccoli.length ? ' (' + piccoli.join(', ') + ')' : ''));
const stretto = await ev(() => window.innerWidth <= 700);
const lay = await ev(() => { const tr = document.querySelector('.pn-qa'); return getComputedStyle(tr).display; });
ok(stretto ? lay === 'block' || lay === 'grid' || lay === 'flex' : lay === 'table-row', 'su ' + (stretto ? 'telefono: ogni azione è una scheda (' + lay + ')' : 'schermo largo: righe di tabella'));
// etichette di colonna presenti nelle schede (telefono)
if(stretto) ok(await ev(() => document.querySelectorAll('.pn-qa td[data-l]').length) > 0 && await ev(() => getComputedStyle(document.querySelector('.pn-qa td[data-l]'), '::before').content) !== 'none', 'nelle schede ogni dato ha la sua etichetta');
// un filtro e un clic funzionano anche qui
await P.selectOption('#pn-qf-stato', 'fatta'); await sleep(300);
const nf = await ev(() => document.querySelectorAll('.pn-qa').length); ok(nf > 0 && nf < 16, 'il filtro per stato riduce le azioni (' + nf + ')');
await P.selectOption('#pn-qf-stato', ''); await sleep(200);
await P.locator('.pn-qa a').first().click(); await sleep(900);
ok(await ev(() => PN.sez) === 'obi', 'un tocco su un’azione porta a modificarla');
ok(pa.errors.length === 0, 'nessun errore di pagina (' + pa.errors.length + ')');
await br.close(); process.exit(summary() ? 1 : 0);
