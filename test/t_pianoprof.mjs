// Piano di Gruppo: aspetto e uso sui dispositivi (larghezza, bersagli da toccare, finestre, quadro sinottico, salvataggio)
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
const azs = obs.flatMap((o, i) => [0, 1].map(j => ({id:'a' + i + j, ob:o.id, testo:'Organizzare una serata con i genitori e una festa di Gruppo ' + j, inizio:1 + j, verifica:'ogni', indicatore:'Abbiamo coinvolto almeno metà delle famiglie?', chi:['cdg', 'unita'], ref:'Anna Maria Rossi Bianchi', stato:'in_corso', genitori:true})));
db.t.pee_piani.push({id:'p1', owner_id:u.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di Gruppo · Pesaro · Gruppo Pesaro con un nome molto molto lungo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:{v:1, analisi:[{id:'t1', titolo:'Punti di forza e di debolezza', testo:lungo}], swot:null, obiettivi:obs, azioni:azs, uniti:[], spunti:[{id:'s1', da:'Lupetti e Lupette', testo:lungo}], delibera:{data:'', luogo:''}}});
await ev(() => shGoHome()); await sleep(1500);
const sw = async (etichetta) => { const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth, rw: document.getElementById('sh-root').scrollWidth, rc: document.getElementById('sh-root').clientWidth})); ok(w.sw - w.iw <= 1 && w.rw - w.rc <= 1, etichetta + ': niente scorrimento orizzontale della pagina (' + w.sw + '/' + w.iw + ')'); };
await sw('home con un piano');
await P.click('#sh-piani .pn-row button'); await sleep(1500);
ok(await ev(() => SH.view) === 'piano' && await ev(() => document.querySelectorAll('.pn-ob').length) === 8, 'il piano con 8 obiettivi si apre');
await sw('pagina del piano');
// il quadro sinottico può scorrere dentro il suo riquadro, la pagina no
const sin = await ev(() => { const w = document.querySelector('.pn-tw'); const r = w.getBoundingClientRect(); return {vis: r.width > 0 && r.right <= window.innerWidth + 1, rows: document.querySelectorAll('#pn-sin tbody tr').length}; });
ok(sin.vis && sin.rows === 8, 'il quadro sinottico sta nello schermo (8 righe)');
// bersagli da toccare: almeno 40 px (44 dove possibile) per pulsanti, caselle e selezioni
const piccoli = await ev(() => [...document.querySelectorAll('.pn-ib, .pn-chip, .pn-sug, .sh-btn, .pn-sel, .pn-back')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 40 || r.width < 40); }).map(e => (e.className + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height))).slice(0, 5));
ok(!piccoli.length, 'pulsanti e caselle abbastanza grandi da toccare' + (piccoli.length ? ' («' + piccoli.join(', ') + '»)' : ''));
// nessun testo tagliato fuori: ogni campo sta dentro la larghezza della scheda
const fuori = await ev(() => [...document.querySelectorAll('.pn .sh-in, .pn select, .pn-chip, .pn-ob, .pn-az')].filter(e => { const r = e.getBoundingClientRect(), c = e.closest('.pn-card').getBoundingClientRect(); return r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1); }).length);
ok(fuori === 0, 'nessun campo esce dalla sua scheda');
// scrivere e salvare
await P.fill('#pn-obt-o0', 'Famiglie coinvolte, aggiornato dal telefono'); await sleep(2800);
ok(await ev(() => !PN.dirty) && db.t.pee_piani[0].data.obiettivi[0].testo === 'Famiglie coinvolte, aggiornato dal telefono', 'una modifica si salva da sola');
// finestre: ci stanno nello schermo e si possono chiudere
for(const [btn, sel, chiudi] of [['Chi ha accesso', '#pn-i-m', 'Chiudi'], ['Storico', '#pn-v-n', 'Chiudi']]){
  await P.click('.pn-bar button >> text=' + btn); await sleep(700);
  const f = await ev((s) => { const dl = document.getElementById('sh-dlg').getBoundingClientRect(); const e = document.querySelector(s); const ov = document.getElementById('sh-ov'); return {ok: dl.left >= -1 && dl.right <= window.innerWidth + 1 && (dl.bottom <= window.innerHeight + 1 || ov.scrollHeight > ov.clientHeight), campo: !!e}; }, sel);
  ok(f.ok && f.campo, 'finestra «' + btn + '» dentro lo schermo (o scorrevole)');
  await P.click('#sh-dlg >> text=' + chiudi); await sleep(250);
}
// unire dal telefono
await P.check('.pn-ob >> nth=0 >> .pn-sel input'); await P.check('.pn-ob >> nth=1 >> .pn-sel input');
await P.click('#pn-unisci'); await sleep(400);
const f2 = await ev(() => { const dl = document.getElementById('sh-dlg').getBoundingClientRect(); const ov = document.getElementById('sh-ov'); return dl.left >= -1 && dl.right <= window.innerWidth + 1 && (dl.bottom <= window.innerHeight + 1 || ov.scrollHeight > ov.clientHeight); });
ok(f2, 'finestra «Unisci» dentro lo schermo');
await P.click('#sh-dlg >> text=Annulla'); await sleep(200);
await P.click('.pn-back'); await sleep(1200);
ok(await ev(() => SH.view) === 'home', 'si torna alla home');
ok(!pa.errors.length, 'nessun errore nella pagina' + (pa.errors.length ? ': ' + pa.errors[0].slice(0, 160) : ''));
process.exit(summary() ? 1 : 0);
