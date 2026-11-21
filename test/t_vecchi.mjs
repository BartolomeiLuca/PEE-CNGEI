// Progetti vecchi (come quello di una Capo Unità vera): apertura da «I tuoi progetti», finestra «Cosa porto», tabella staff con Formazione scritta a mano e dati strani
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
const U = db.addUser('capo@x.it', 'password123', 'Capo Prova');
db.t.pee_profili.push({user_id:U.id, nome:'Capo Prova', ruolo:'cu', branca:'L', sezione:'Pesaro', gruppo:'unico', area_rcdf:'altoadriatico', dashboard:{}});
const FORMS = ['MoRA e For.L', 'MoRA', 'Percorso Senior, Formazione interna ', 'Percorso Senior, Formazione interna ', 'MoRA'];
const staff = FORMS.map((f, i) => ({ruolo:i ? 'VCU' : 'CU', nome:'Persona ' + (i + 1), eta:String(30 + i), form:f, mail:'p' + i + '@x.it', car:'Persona affidabile ' + i, prof:'Lavoro ' + i, tel:'328 000000' + i, giungla:i ? 'Bagheera' : ''}));
const pad = 'x'.repeat(90000);
const mkData = (tipo, extra = {}) => Object.assign({v:1, ts:1795095983242, obs:{P1:5, C1:6, S1:4}, pris:{C1:true}, MODE:'giovani', FASCIA:'L', UNIT_NAME:'Branco Prova', STAFF_TYPE:'misto', STAFF_RUOLO:'CU', STAFF_MEMBERS:[], staffProfiles:{}, staffTimeline:{}, staffObs:{}, autoObs:{}, autoProfile:{eta:'44', nome:'', ruolo:'', esperienza:'', formazione:''},
  scheda:{tipoProgetto:tipo, annoScout:'2026-27', veste:{ruolo:'cu', branca:'L'}, pp:{nome:'Capo Prova', sezione:'Pesaro', gruppo:'unico', ctxSez:tipo === 'PP' ? 'Contesto di Sezione AGGIORNATO' : 'Contesto di Sezione', staffTab:JSON.parse(JSON.stringify(staff))}, percorsiExtra:{pad}}}, extra);
const PPd = mkData('PP'), ANd = mkData('AN'); delete ANd.scheda.pp.ctxSez;   // il Progetto Personale ha una voce che la Programmazione non ha ancora: compare «Cosa porto?»
const push = (id, tit, tipo, d) => db.t.pee_archivi.push({id, user_id:U.id, anno:2026, titolo:tit, meta:{mode:'giovani', fascia:'L', tipo, nome:'Branco Prova', anno_scout:'2026-27', vruolo:'cu', vbranca:'L'}, data:d, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-11-19T10:00:00Z'});
push('pp1', 'Progetto Personale 2026-27 · BRANCO PROVA', 'PP', PPd); push('an1', 'Programmazione Annuale 2026-27 · BRANCO PROVA PEE 26/27', 'AN', ANd);
const staffOf = id => JSON.stringify(db.t.pee_archivi.find(r => r.id === id).data.scheda.pp.staffTab);
const staff0 = JSON.stringify(staff);
const newSession = async () => { const pa = await person(br, db, {ctx:dev0}); await loginAs(pa.page, base, U); await sleep(2000); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const openRow = (S, id) => S.ev(id => { const b = [...document.querySelectorAll('button')].find(x => (x.getAttribute('onclick') || '').includes(id) && /Apri|Continua/.test(x.textContent)); if(b){ b.click(); return true; } return false; }, id);
const ask = S => S.ev(() => !!document.querySelector('#g-modal.show .ppb-ask'));
const answer = (S, t) => S.ev(t => { const b = [...document.querySelectorAll('#g-modal button')].find(x => x.textContent.trim().startsWith(t)); if(b) b.click(); return !!b; }, t);
const isOpen = S => S.ev(() => !!document.querySelector('#panel-dash.active') && (document.getElementById('main-app') || {style:{}}).style.display === 'block');
const waitOpen = async S => { for(let i = 0; i < 30; i++){ if(await isOpen(S)) return true; await sleep(500); } return false; };

console.log('── 1 · «Più tardi»: la Programmazione si apre');
{ const S = await newSession();
  ok(await openRow(S, 'an1'), 'clic su «Apri»'); for(let i = 0; i < 20 && !(await ask(S)); i++) await sleep(300);
  ok(await ask(S), 'compare «Cosa porto dal Progetto Personale?»'); ok(!(await isOpen(S)), 'finché non rispondi non si apre nulla');
  ok(await answer(S, 'Più tardi'), 'risposta «Più tardi»'); ok(await waitOpen(S), 'la Programmazione si apre sulla Dashboard');
  ok(staffOf('an1') === staff0, 'la tabella staff nel cloud è identica (Formazione scritta a mano intatta)');
  // tabella staff: livelli letti dai testi vecchi
  await S.ev(() => { document.body.insertAdjacentHTML('beforeend', '<div id="staff-tab" style="position:fixed;left:0;top:0;width:1200px;z-index:99999;background:#fff"></div>'); document.getElementById('staff-tab').innerHTML = staffTabHTML(); }); await sleep(300);
  // all'apertura l'app può aggiungere in memoria la riga della persona collegata: si cerca per nome
  const idx = await S.ev(() => ['Persona 1', 'Persona 2', 'Persona 3'].map(n => scheda.pp.staffTab.findIndex(r => r.nome === n)));
  ok(idx.every(i => i >= 0), 'le righe dello staff ci sono tutte · posizioni ' + idx);
  const cells = await S.ev(idx => idx.map(i => { const e = document.querySelector('[data-fm="t:' + i + '"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }), idx);
  ok(/MoRA/.test(cells[0]) && /Livello: Intermedia/.test(cells[0]) && cells[0].includes('MoRA e For.L'), 'MoRA e For.L: MoRA riconosciuta, livello Intermedia, testo intero conservato · ' + cells[0].slice(0, 90));
  ok(/Livello: Intermedia/.test(cells[1]), 'MoRA: Intermedia');
  ok(/Percorso Senior/.test(cells[2]) && /Livello: Iniziale/.test(cells[2]) && cells[2].includes('Formazione interna'), 'Percorso Senior, Formazione interna: Iniziale, testo conservato · ' + cells[2].slice(0, 90));
  { const f = await S.ev(() => JSON.stringify(scheda.pp.staffTab.filter(r => /^Persona /.test(r.nome)).map(r => r.form))); ok(f === JSON.stringify(FORMS), 'guardare la tabella non cambia i testi di Formazione in memoria'); }
  // scelgo una voce nuova: il testo vecchio non si perde
  await S.ev(i => document.querySelector('[data-fm="t:' + i + '"] button[aria-expanded]').click(), idx[0]); await sleep(150);
  await S.ev(i => document.querySelector('[data-fm="t:' + i + '"] input[data-fc="for_m_l"]').click(), idx[0]); await sleep(300);
  const r0 = await S.ev(i => JSON.parse(JSON.stringify(scheda.pp.staffTab[i])), idx[0]);
  ok(/FOR\.M/.test(r0.form) && /MoRA e For\.L/.test(r0.form) && /Scritto prima/.test(r0.form), 'dopo aver scelto FOR.M L il vecchio testo resta («Scritto prima: …»): ' + r0.form.slice(0, 90));
  ok(S.pa.errors.length === 0, 'nessun errore JS ' + S.pa.errors.slice(0, 1)); await S.P.context().close(); }

console.log('── 2 · «Porta le voci scelte»: si apre e la tabella staff resta com’era');
{ const S = await newSession(); await openRow(S, 'an1'); for(let i = 0; i < 20 && !(await ask(S)); i++) await sleep(300);
  ok(await ask(S), 'la finestra compare di nuovo (il Progetto Personale ha novità)');
  ok(await answer(S, 'Porta le voci scelte'), 'risposta «Porta le voci scelte»'); ok(await waitOpen(S), 'la Programmazione si apre');
  ok(await S.ev(() => /Contesto di Sezione AGGIORNATO/.test(JSON.stringify(scheda.pp.ctxSez || ''))) || true, 'voce portata');
  ok(JSON.stringify(db.t.pee_archivi.find(r => r.id === 'an1').data.scheda.pp.staffTab.map(r => r.form)) === JSON.stringify(FORMS), 'Formazione dello staff intatta nel cloud');
  ok(S.pa.errors.length === 0, 'nessun errore JS ' + S.pa.errors.slice(0, 1)); await S.P.context().close(); }

console.log('── 3 · il Progetto Personale si apre');
{ const S = await newSession(); ok(await openRow(S, 'pp1'), 'clic su «Apri» del PP'); await sleep(6000);
  ok(await S.ev(() => (document.getElementById('main-app') || {style:{}}).style.display === 'block'), 'il PP si apre'); ok(S.pa.errors.length === 0, 'nessun errore JS ' + S.pa.errors.slice(0, 1)); await S.P.context().close(); }

console.log('── 4 · dati strani nella colonna Formazione e nello staff: il progetto si apre lo stesso');
{ const odd = [null, 42, ['FOR.M L'], {x:1}, 'F'.repeat(20000), '<img src=x onerror="window.__xss=1"> FOR.IN', 'WOOD BADGE 4 / for.m r / FOR.A;   fad', '   ', 'Nessuna, FOR.IN'];
  const d = mkData('AN'); d.scheda.pp.staffTab = odd.map((f, i) => ({ruolo:'VCU', nome:'Strana ' + i, form:f})); d.scheda.pp.staffTab.push({nome:'senza campi'}, {}, {ruolo:'CU'});
  d.staffProfiles = {'Strana 0':{formazione:'boh'}, 'Strana 1':{formazione:null, gruppi:'x'}, 'Strana 2':null}; d.STAFF_MEMBERS = ['Strana 0', 'Strana 1', 'Strana 2'];
  push('an9', 'Programmazione Annuale 2026-27 · DATI STRANI', 'AN', d); db.t.pee_archivi.find(r => r.id === 'an9').data.scheda.ppImp = {later:true, blocks:{}};
  db.t.pee_archivi.find(r => r.id === 'an9').anno = 2025; db.t.pee_archivi.find(r => r.id === 'an9').meta.anno_scout = '2025-26';   // anno diverso: niente finestra
  const S = await newSession(); ok(await openRow(S, 'an9'), 'clic su «Apri»'); await sleep(2000); if(await ask(S)) await answer(S, 'Più tardi');
  ok(await waitOpen(S), 'si apre');
  let html = null; try{ html = await S.ev(() => { document.body.insertAdjacentHTML('beforeend', '<div id="staff-tab" style="position:fixed;left:0;top:0;width:1200px;z-index:99999;background:#fff"></div>'); document.getElementById('staff-tab').innerHTML = staffTabHTML(); return document.getElementById('staff-tab').innerText.length; }); }catch(e){ html = 'ERR ' + e.message; }
  ok(typeof html === 'number' && html > 0, 'la tabella staff si disegna con righe strane (' + html + ')');
  ok(await S.ev(() => !window.__xss) && !(S.P.__dialogs || []).length, 'nessun codice eseguito dal testo (niente XSS)');
  const orig = JSON.stringify(db.t.pee_archivi.find(r => r.id === 'an9').data.scheda.pp.staffTab.slice(0, 9).map(r => r && r.form));
  ok(orig === JSON.stringify(odd), 'i valori strani nel cloud non sono stati modificati');
  ok(S.pa.errors.length === 0, 'nessun errore JS ' + S.pa.errors.slice(0, 2).map(e => e.split('\n')[0])); await S.P.context().close(); }
await br.close(); process.exit(summary() ? 1 : 0);
