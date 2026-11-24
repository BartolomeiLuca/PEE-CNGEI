// Carta di Unità: aspetto e uso sui dispositivi (nome profilo come argomento)
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
const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare'), anna = db.addUser('anna@x.it', 'password123', 'Anna Maria Verdi Rossi');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_profili.push({user_id:anna.id, nome:'Anna Maria Verdi Rossi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const lungo = 'Costruire un rapporto stabile con le famiglie, con incontri regolari e momenti di festa condivisi tra tutte le Unità del Gruppo';
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di Gruppo · Pesaro · Gruppo con un nome molto molto lungo', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:{v:1, analisi:[], swot:null, obiettivi:[], azioni:[]}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'anna@x.it', ruolo:'lettore', etichetta:'Capo Unità', nome:'Anna Maria Verdi Rossi', visto_il:null, invitato_da:luca.id, created_at:'2026-11-24T10:00:00Z'});
db.t.pee_archivi.push({id:'a1', user_id:anna.id, anno:2026, titolo:'Programmazione 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto Aquile'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Aquile', obs:{}, pris:{P1:true}, scheda:{tipoProgetto:'AN', percorsiExtra:[], uscite:{}, annoScout:'2026-27',
    priorita:[{ambito:'P', pid:'P1', necessita:lungo, obiettivi:[0], idr:[], percorso:'', tempistica:''}], pp:{numTot:'22', numM:'10', numF:'12', numAnn:['8', '6', '5', '3'], staffTab:[{ruolo:'CU'}, {ruolo:'VCU'}, {ruolo:'CG'}]}}}});
const br = await launch(engine); const d = Object.assign({}, dev); delete d.defaultBrowserType; if(engine === 'firefox') delete d.isMobile;
const pa = await person(br, db, {ctx: d}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
console.log('— ' + name + ' (' + engine + ', ' + (d.viewport || {}).width + '×' + (d.viewport || {}).height + ')');
await loginAs(P, base, anna); await sleep(2000);
const sw = async (et) => { const w = await ev(() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth, rw: document.getElementById('sh-root').scrollWidth, rc: document.getElementById('sh-root').clientWidth})); ok(w.sw - w.iw <= 1 && w.rw - w.rc <= 1, et + ': niente scorrimento orizzontale (' + w.sw + '/' + w.iw + ')'); };
const piccoli = (sel) => ev(s => [...document.querySelectorAll(s)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 36 || r.width < 36); }).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 4), sel);
// 1. pagina dentro la programmazione
await ev(() => shOpen('a1', 0)); await sleep(3500);
await ev(() => shCdU()); await sleep(1200);
ok(await ev(() => !!document.getElementById('cdu-b1')), 'la Carta si apre');
await sw('Carta nella programmazione');
await P.fill('#cdu-b1', lungo + ' ' + lungo); await P.fill('#cdu-b3', lungo); await P.fill('#cdu-b7r', lungo);
await P.click('input[name="cdu-s-b3"][value="r"]').catch(async () => { await P.locator('input[name="cdu-s-b3"][value="r"]').check({force:true}); });
await sleep(400); await sw('Carta compilata con testi lunghi');
if(process.env.SHOT) await P.screenshot({path:process.env.SHOT + '/carta_' + name + '.png', fullPage:true});
const pc = await piccoli('#panel-pp .gi-rit, #panel-pp .sh-btn, #panel-pp .pn-chk');
ok(!pc.length, 'Carta: pulsanti e scelte abbastanza grandi da toccare' + (pc.length ? ' («' + pc.join(', ') + '»)' : ''));
const fuori = await ev(() => [...document.querySelectorAll('#panel-pp .gi-carta, #panel-pp textarea, #panel-pp .gi-rit')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1); }).length);
ok(fuori === 0, 'Carta: nessun elemento esce dallo schermo');
// 2. giro aperto: consegna
db.giroRpc('pee_piano_giro_apri', {p:'p1', ritmo_:'standard', fase_:'giro1', scadenza_:null}, luca.id, luca);
await ev(() => shCdU()); await sleep(1500);
if(await ev(() => !!document.getElementById('cdu-go'))){ await P.click('#cdu-go'); await sleep(1500); ok(db.t.pee_piani_contributi.some(c => c.tipo === 'unita' && c.consegnato), 'la Carta si consegna dal dispositivo'); }
else ok(false, 'pulsante di consegna non trovato');
await sw('Carta dopo la consegna');
// 3. modulo di ripiego nella pagina del giro (senza programmazione): rimuovo la programmazione e riapro
db.t.pee_archivi.length = 0; db.t.pee_piani_contributi.length = 0;
await ev(() => shGoHome()); await sleep(1500); await ev(id => pnOpen(id), 'p1'); await sleep(1500); await ev(() => giVai('giro')); await sleep(1000);
ok(await ev(() => !!document.getElementById('gcu-b1')), 'modulo di ripiego nella pagina del giro');
await P.fill('#gcu-n-nome', 'Reparto con un nome molto molto molto lungo ' + lungo); await P.fill('#gcu-b1', lungo + ' ' + lungo); await P.fill('#gcu-b5', lungo);
await sleep(400); await sw('giro: modulo di ripiego');
if(process.env.SHOT) await P.screenshot({path:process.env.SHOT + '/giro_ripiego_' + name + '.png', fullPage:true});
const pg = await piccoli('.gi-rit, .pn-tabb, .sh-btn, .pn-chk');
ok(!pg.length, 'giro: pulsanti e scelte abbastanza grandi da toccare' + (pg.length ? ' («' + pg.join(', ') + '»)' : ''));
const fg = await ev(() => [...document.querySelectorAll('.pn-card .gi-carta, .pn-card .gi-carta textarea, .pn-card .gi-carta input')].filter(e => { const cc = e.closest('.pn-card'); if(!cc) return true; const r = e.getBoundingClientRect(), c = cc.getBoundingClientRect(); return r.width > 0 && (r.right > c.right + 1 || r.left < c.left - 1); }).map(e => e.tagName + '.' + e.className + '#' + e.id).slice(0, 4));
ok(fg.length === 0, 'giro: nessun elemento esce dalla sua scheda');
ok(pa.errors.length === 0, 'nessun errore di pagina (' + pa.errors.length + ')'); if(pa.errors.length) console.log('  ', pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
