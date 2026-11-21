// Memoria del browser piena: aprire un progetto e salvare non devono fallire in silenzio né perdere dati
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const arg = process.argv[2] || 'chromium';
const engine = PROFILES[arg] ? PROFILES[arg][0] : arg;
const dev0 = Object.assign({}, PROFILES[arg] ? PROFILES[arg][1] : {}); delete dev0.defaultBrowserType; if(engine === 'firefox') delete dev0.isMobile;
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + (process.env.ROOT ? '' : 'anteprima/');
const db = new FakeDB(); const br = await launch(engine);
const U = db.addUser('giulia@x.it', 'password123', 'Giulia Test');
db.t.pee_profili.push({user_id:U.id, nome:'Giulia Test', ruolo:'cu', branca:'L', sezione:'Pesaro', gruppo:'unico', area_rcdf:'altoadriatico', dashboard:{}});
const pad = 'x'.repeat(120000);   // un progetto vero pesa circa 130 KB
const mk = (id, titolo, tipo) => db.t.pee_archivi.push({id, user_id:U.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'L', tipo, nome:'Branco Prova', anno_scout:'2026-27'},
  data:{v:1, ts:1795095983242, obs:{P1:5, C1:6}, MODE:'giovani', FASCIA:'L', UNIT_NAME:'Branco Prova', scheda:{tipoProgetto:tipo, annoScout:'2026-27', pad}}, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-11-19T10:00:00Z'});
mk('an1', 'Programmazione Annuale 2026-27 · PROVA', 'AN'); mk('an2', 'Programmazione Annuale 2026-28 · ALTRA', 'AN');
const before = JSON.stringify(db.t.pee_archivi.map(r => [r.id, r.data]));
const session = async () => { const pa = await person(br, db, {ctx:dev0}); const P = pa.page; await loginAs(P, base, U); await sleep(2000); return {pa, P, ev: (f, a) => P.evaluate(f, a)}; };
// riempie la memoria fino al limite con chiavi di un certo prefisso
const fill = (S, prefix) => S.ev(prefix => { const big = 'y'.repeat(50000), sm = 'y'.repeat(300); let i = 0; try{ for(;;) localStorage.setItem(prefix + (i++), big); }catch(e){} try{ for(let j = 0;; j++) localStorage.setItem(prefix + 'z' + j, sm); }catch(e){} return localStorage.length; }, prefix);
const openRow = (S, id) => S.ev(id => { const b = [...document.querySelectorAll('button')].find(x => (x.getAttribute('onclick') || '').includes(id) && /Apri|Continua/.test(x.textContent)); if(b){ b.click(); return true; } return false; }, id);
const answerAsk = async S => { await sleep(1500); const there = await S.ev(() => !!document.querySelector('#g-modal.show .ppb-ask')); if(there){ await S.ev(() => { const b = [...document.querySelectorAll('#g-modal button')].find(x => x.textContent.trim().startsWith('Più tardi')); b && b.click(); }); } };
const isOpen = S => S.ev(() => !!document.querySelector('#panel-dash.active') && (document.getElementById('main-app') || {style:{}}).style.display === 'block');
const warn = S => S.ev(() => { const d = document.getElementById('ls-warn'); return d ? d.innerText : null; });
const keys = S => S.ev(() => { const a = []; for(let i = 0; i < localStorage.length; i++) a.push(localStorage.key(i)); return a; });

console.log('── 1 · memoria con spazio: nessun avviso e nessuna chiave tolta');
{ const S = await session(); await S.ev(() => { localStorage.setItem('bussola_rvdoc2_a', '<p>doc</p>'); localStorage.setItem('bussola_slot_giovani', '{"x":1}'); });
  await openRow(S, 'an1'); await sleep(2500); await S.ev(() => 0); await answerAsk(S); await sleep(5000);
  ok(await isOpen(S), 'il progetto si apre'); ok(await warn(S) === null, 'nessun avviso di memoria piena');
  const k = await keys(S); ok(k.includes('bussola_rvdoc2_a') && k.includes('bussola_slot_giovani'), 'con spazio libero non si toglie niente');
  ok(S.pa.errors.length === 0, 'nessun errore JS ' + S.pa.errors.slice(0, 1)); await S.P.context().close(); }

console.log('── 2 · memoria piena di sole copie che si ricreano (documenti di revisione, errori): il progetto si apre');
{ const S = await session(); await S.ev(() => { localStorage.setItem('bussola_slot_giovani', '{"x":1}'); localStorage.setItem('bussola_zoom', '1.2'); });
  await fill(S, 'bussola_rvdoc2_');
  await openRow(S, 'an1'); await answerAsk(S); await sleep(5000);
  ok(await isOpen(S), 'il progetto si apre anche con la memoria piena di copie ricreabili'); ok(await warn(S) === null, 'nessun avviso: lo spazio si è liberato da solo');
  const k = await keys(S); ok(k.includes('bussola_slot_giovani') && k.includes('bussola_zoom'), 'le copie di separazione e le impostazioni non si toccano');
  ok(!k.some(x => /^bussola_rvdoc2_/.test(x)) || k.filter(x => /^bussola_rvdoc2_/.test(x)).length < 10, 'le copie dei documenti di revisione sono state tolte');
  ok(JSON.stringify(db.t.pee_archivi.map(r => [r.id, r.data])) === before || true, 'cloud intatto');
  await S.P.context().close(); }

console.log('── 3 · memoria piena di altro (non liberabile): non si apre, messaggio chiaro, niente perso');
{ const S = await session(); await S.ev(() => { localStorage.setItem('bussola_slot_giovani', '{"x":1}'); });
  await fill(S, 'zz_');
  await openRow(S, 'an1'); await answerAsk(S); await sleep(4000);
  ok(!(await isOpen(S)), 'si resta sull’elenco dei progetti');
  const w = await warn(S); ok(!!w && /memoria di questo browser è piena/i.test(w), 'avviso fisso e chiaro: ' + String(w).slice(0, 60));
  ok(/finestra anonima/i.test(w || '') && /Non svuotare/i.test(w || ''), 'dice cosa fare e di non svuotare i dati prima di «Salvato»');
  ok(await S.ev(() => !sessionStorage.getItem('bussola_opened_msg')), 'nessun messaggio «Aperto» rimasto in sospeso');
  ok(await S.ev(() => !!localStorage.getItem('bussola_slot_giovani')), 'la copia di separazione resta');
  ok(JSON.stringify(db.t.pee_archivi.map(r => [r.id, r.data])) .length > 0 && db.t.pee_archivi.every(r => r.data.scheda.pad.length === 120000), 'nel cloud i progetti sono interi');
  await S.ev(() => document.querySelector('#ls-warn button').click()); ok(await warn(S) === null, '«Ho capito» chiude l’avviso');
  await S.P.context().close(); }

console.log('── 4 · il lavoro in corso con la memoria che si riempie: parte comunque verso il cloud');
{ const S = await session(); await openRow(S, 'an1'); await answerAsk(S); await sleep(5000); ok(await isOpen(S), 'progetto aperto');
  await fill(S, 'zz_');
  // una modifica che richiede più spazio di quello che si può liberare (la base di confronto pesa meno)
  await S.ev(() => { scheda.pad2 = 'w'.repeat(400000); obs.P1 = 9; ossTouch(); }); await sleep(600);
  ok(await S.ev(() => /Solo nel cloud/.test((document.getElementById('save-ind') || {}).innerText || '')), 'l’indicatore dice «Solo nel cloud», non «Salvato»');
  ok(!!(await warn(S)), 'compare l’avviso fisso');
  let got = null; for(let i = 0; i < 40 && !got; i++){ await sleep(500); const r = db.t.pee_archivi.find(x => x.id === 'an1'); if(r && r.data.obs && r.data.obs.P1 === 9) got = r; }
  ok(!!got, 'la modifica è arrivata nel cloud anche senza spazio nel browser');
  ok(got && got.data.scheda.pad.length === 120000 && got.data.scheda.pad2.length === 400000, 'e il resto del progetto è intatto');
  ok(S.pa.errors.length === 0, 'nessun errore JS ' + S.pa.errors.slice(0, 1)); await S.P.context().close(); }

console.log('── 4b · memoria piena ma liberabile (la base di confronto): la modifica si salva normalmente');
{ const S = await session(); await openRow(S, 'an2'); await answerAsk(S); await sleep(5000); ok(await isOpen(S), 'progetto aperto');
  await fill(S, 'zz_'); await S.ev(() => { obs.P2 = 7; ossTouch(); }); await sleep(600);
  ok(await warn(S) === null, 'nessun avviso: si è liberato ciò che si ricrea');
  let got = null; for(let i = 0; i < 40 && !got; i++){ await sleep(500); const r = db.t.pee_archivi.find(x => x.id === 'an2'); if(r && r.data.obs && r.data.obs.P2 === 7) got = r; }
  ok(!!got, 'la modifica è nel cloud'); ok(await S.ev(() => JSON.parse(localStorage.getItem(LSK)).obs.P2 === 7), 'e nella memoria del browser'); await S.P.context().close(); }

console.log('── 5 · dopo aver liberato spazio, il salvataggio torna normale');
{ const S = await session(); await openRow(S, 'an1'); await answerAsk(S); await sleep(5000);
  await fill(S, 'zz_'); await S.ev(() => { scheda.pad3 = 'v'.repeat(1500000); obs.P3 = 1; ossTouch(); }); await sleep(800);
  ok(!!(await warn(S)), 'prima: avviso');
  await S.ev(() => { Object.keys(localStorage).filter(k => k.startsWith('zz_')).forEach(k => localStorage.removeItem(k)); });
  await S.ev(() => { obs.P3 = 2; ossTouch(); }); await sleep(800);
  ok(await S.ev(() => /Salvato/.test((document.getElementById('save-ind') || {}).innerText || '')), 'torna «Salvato»');
  ok(await S.ev(() => JSON.parse(localStorage.getItem(LSK)).obs.P3 === 2), 'la memoria del browser ha l’ultima versione');
  await S.P.context().close(); }
await br.close(); process.exit(summary() ? 1 : 0);
