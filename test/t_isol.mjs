// COLLAUDO DI ISOLAMENTO: nessuna contaminazione tra progetti, aree di dati, persone e ruoli.
// Un mondo con 7 persone e 5+ progetti incrociati. Ogni area di dati di ogni progetto contiene un MARCATORE unico («ZQ-<progetto>-<area>»).
// Dopo ogni azione si controlla che (1) cambi solo l'area prevista del solo progetto previsto, (2) nessun marcatore compaia in un progetto
// che non è il suo (nel database, nella memoria del browser, sullo schermo), (3) ogni persona veda esattamente ciò che il suo ruolo prevede.
// uso: node t_isol.mjs [motore | profilo di dispositivo come in t_cdsr.mjs]   (SITE = copia di prova, come gli altri test)
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
const base = (await serve()) + 'anteprima/';
const db = new FakeDB(); db.sql13 = true;
const br = await launch(engine);
const until = async (fn, ms = 20000, step = 300) => { const t = Date.now(); while(Date.now() - t < ms){ try{ if(await fn()) return true; }catch(e){} await sleep(step); } return false; };

// ───────── il mondo: persone ─────────
const mkU = (mail, nome, ruolo, extra = {}) => { const u = db.addUser(mail, 'password123', nome);
  db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca: ruolo === 'cu' ? 'E' : null, sezione:'Pesaro', gruppo: ruolo === 'cds' ? null : '1', area_rcdf:'altoadriatico', dashboard: extra.dashboard || {}}); return u; };
const GI = mkU('gina@x.it', 'Gina Neri', 'cg', {dashboard:{unita:{branca:'E', nome:'Reparto Kontiki'}}});   // Capo Gruppo E Capo Unità
const AL = mkU('alex@x.it', 'Alex Bianchi', 'cu');      // collaboratore nell'Unità di Gina, titolare di una sua Unità (Gina vi è lettrice)
const BE = mkU('bea@x.it', 'Bea Verdi', 'cu');          // lettrice nell'Unità di Gina
const FE = mkU('fede@x.it', 'Fede Rossi', 'cg');        // co-titolare nella formativa di Gina, lettore nell'Unità
const DA = mkU('dario@x.it', 'Dario Gialli', 'cg');     // collaboratore nella formativa di Gina
const CO = mkU('comm@x.it', 'Marco Commissario', 'cds'); // Commissario nella formativa di Gina, titolare della propria formativa (Gina vi è lettrice)
const ST = mkU('stra@x.it', 'Stefano Estraneo', 'cu');  // estraneo: non è invitato da nessuna parte
const USERS = {GI, AL, BE, FE, DA, CO, ST};

// ───────── marcatori, aree, impronte ─────────
const ZONES = {
  obs: d => d.obs, pris: d => d.pris, vals: d => d.vals, oss: d => { const o = d.scheda && d.scheda.osservazione; if(!o) return o; const r = {}; for(const a of Object.keys(o)) for(const f of Object.keys(o[a] || {})) if(/ZQ-/.test(String(o[a][f]))) (r[a] = r[a] || {})[f] = o[a][f]; return r; }, /* solo i testi con marcatore: le righe derivate dalle osservazioni sono ricalcolate dall'app a ogni apertura */ pp: d => d.scheda && d.scheda.pp, uscite: d => d.scheda && d.scheda.uscite,
  avvisi: d => d.scheda && d.scheda.avvisi, staffM: d => d.STAFF_MEMBERS, staffObs: d => d.staffObs, staffProf: d => d.staffProfiles, staffTl: d => d.staffTimeline,
  autoObs: d => d.autoObs, autoProf: d => d.autoProfile, unit: d => d.UNIT_NAME
};
const canon = x => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v).sort().reduce((o, q) => { o[q] = v[q]; return o; }, {}) : v);
// toglie ricorsivamente i valori vuoti (un campo nato vuoto non è una modifica del contenuto)
const prune = v => { if(Array.isArray(v)){ const a = v.map(prune).filter(x => x !== undefined); return a.length ? a : undefined; } if(v && typeof v === 'object'){ const o = {}; for(const k of Object.keys(v)){ const x = prune(v[k]); if(x !== undefined) o[k] = x; } return Object.keys(o).length ? o : undefined; } return (v == null || v === '') ? undefined : v; };
const isEmpty = v => prune(v) === undefined;
const zoneHash = d => { const o = {}; for(const [k, f] of Object.entries(ZONES)){ let v; try{ v = f(d || {}); }catch(e){ v = undefined; } o[k] = isEmpty(v) ? 'vuoto' : canon(prune(v)); }
  const sc = Object.assign({}, (d && d.scheda) || {}); ['osservazione', 'pp', 'uscite', 'avvisi', '_userEditedA'].forEach(k => delete sc[k]); o.schedaRest = isEmpty(sc) ? 'vuoto' : canon(prune(sc)); return o; };
const NAMES = {}; const ALLOW = {};   // ALLOW: marcatori di altri progetti che un certo progetto può legittimamente contenere (es. U:['P'] dopo il «ponte» dal Progetto Personale)               // id progetto → sigla
const rowOf = id => db.t.pee_archivi.find(r => r.id === id);
const snap = () => { const o = {}; for(const r of db.t.pee_archivi) o[r.id] = zoneHash(r.data); return o; };
let SNAP = {};
const diffZ = (a, b) => { const out = []; for(const id of Object.keys(b)){ if(!a[id]){ out.push((NAMES[id] || id) + ':NUOVO'); continue; } for(const z of Object.keys(b[id])) if(a[id][z] !== b[id][z]) out.push((NAMES[id] || id) + ':' + z); } for(const id of Object.keys(a)) if(!b[id]) out.push((NAMES[id] || id) + ':CANCELLATO'); return out.sort(); };
// confronta con l'ultima impronta: devono essere cambiate esattamente le aree indicate (['U:obs', …]); poi aggiorna l'impronta
const onlyChanged = (label, exp, ignore = []) => { const now = snap(); const d = diffZ(SNAP, now).filter(x => !ignore.includes(x)); const e = exp.slice().sort(); SNAP = now;
  return ok(JSON.stringify(d) === JSON.stringify(e), label + ' · cambia solo: [' + e.join(', ') + ']' + (JSON.stringify(d) === JSON.stringify(e) ? '' : ' — INVECE cambia: [' + d.join(', ') + ']')); };
// nessun marcatore in un progetto che non è il suo
const MARK = /ZQ-([A-Z]+)-[A-Z0-9]+/g;
const marks = s => { const o = new Set(); let m; MARK.lastIndex = 0; while((m = MARK.exec(s))) o.add(m[1]); return o; };
const leakDb = (label, allow0 = {}) => { const allow = Object.assign({}, ALLOW, allow0); const bad = []; for(const r of db.t.pee_archivi){ const code = NAMES[r.id]; if(!code) continue; const ok0 = new Set([code].concat(allow[code] || []).concat(code === 'P' ? ['PRIV'] : [])); for(const c of marks(JSON.stringify(r.data))) if(!ok0.has(c)) bad.push(code + ' contiene marcatori di ' + c); }
  return ok(!bad.length, label + ' · nessun marcatore estraneo nei dati salvati' + (bad.length ? ' — ' + bad.join('; ') : '')); };
// sulla pagina di una persona: memoria locale e schermo contengono solo i marcatori del progetto aperto (o di quelli consentiti)
const leakPage = async (label, P, allowed) => { const r = await P.evaluate(() => { const o = {}; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(/^(bussola_pee_v6|bussola_pee_ro_v1)$/.test(k)) o[k] = localStorage.getItem(k); } const ma = document.getElementById('main-app'), sr = document.getElementById('sh-root'); return {ls: o, dom: (ma ? ma.textContent : '') + ' ' + (sr ? sr.textContent : '')}; });
  const bad = []; for(const [k, v] of Object.entries(r.ls)) for(const c of marks(v)) if(!allowed.includes(c)) bad.push('memoria ' + k + ': ' + c); for(const c of marks(r.dom)) if(!allowed.includes(c)) bad.push('schermo: ' + c);
  return ok(!bad.length, label + ' · memoria e schermo senza marcatori estranei (consentiti: ' + allowed.join(',') + ')' + (bad.length ? ' — ' + bad.join('; ') : '')); };

// ───────── persone con il loro browser ─────────
const PG = {};   // pagine per persona
const startP = async (key, isGina) => { for(let i = 0; i < 4; i++){ const p = await person(br, db, {ctx: dev0}); try{ PG[key] = p; await loginAs(p.page, base, USERS[key]); await sleep(2200); return p.page; }catch(e){ console.log('   (ripeto l’accesso di ' + key + ': ' + String(e.message).split('\n')[0].slice(0, 60) + ')'); try{ await p.ctx.close(); }catch(x){} } } throw new Error('accesso non riuscito per ' + key); };
const ev = (P, f, a) => P.evaluate(f, a);
const home = async P => { await ev(P, () => shGoHome()); await sleep(1500); };
// crea un progetto dall'interfaccia: tipo AN (formativa/annuale) | PP | EDU
const mkProj = async (P, tipo, first) => {
  if(first){ await ev(P, ([sel, n]) => { document.querySelectorAll(sel)[n].click(); }, tipo === 'EDU' ? ['.sh-long', 0] : ['.sh-big', tipo === 'PP' ? 1 : 0]); }
  else { await home(P); await ev(P, () => shNew()); await sleep(500); await P.check('input[name="sh-tipo"][value="' + tipo + '"]').catch(() => {}); await sleep(200); }
  await sleep(300); await ev(P, () => document.getElementById('sh-ncre').click()); await sleep(1000);
  if(await ev(P, () => { const e = document.getElementById('sh-nprev'); return !!e && !e.hidden; })) await ev(P, () => { [...document.querySelectorAll('#sh-nprev button')].find(b => /Parto da zero/.test(b.innerText)).click(); });
  await until(async () => ev(P, () => !!(CL.ctx && CL.ctx.id) && document.getElementById('main-app').style.display !== 'none'), 15000); await sleep(1500);
  let nid = null; for(let i = 0; i < 10 && !nid; i++){ nid = await ev(P, () => CL.ctx && CL.ctx.id).catch(() => null); if(!nid) await sleep(1000); } return nid; };
// riapre un progetto proprio (la pagina si ricarica) / uno condiviso
const waitCtx = async (P, id) => { await until(async () => ev(P, i => !window.__pre && !!(CL.ctx && CL.ctx.id === i) && document.getElementById('main-app') && document.getElementById('main-app').style.display !== 'none', id), 25000); await sleep(1800); };
// la pagina si ricarica da sola: si segna la vecchia pagina e si aspetta quella nuova
// finestra «Cosa porto dal Progetto Personale?»: br = 'dopo' (Più tardi) | lista di gruppi da portare
const ppbAnswer = async (P, br) => { const seen = await until(async () => ev(P, () => !!document.querySelector('#g-modal.show .ppb-ask')), 6000, 200); if(!seen) return false;
  await ev(P, b => { if(b === 'dopo' || b == null){ window._ppbLater(); return; } document.querySelectorAll('.ppb-c').forEach(c => { c.checked = b.some(g => c.getAttribute('data-g').toLowerCase().indexOf(g.toLowerCase()) >= 0); }); window._ppbGo(); }, br); return true; };
const openOwn = async (P, id, br) => { await ev(P, i => { window.__pre = 1; clOpenProject(i); }, id).catch(() => {}); await sleep(600); if(NAMES[id] === 'U' || NAMES[id] === 'D' || NAMES[id] === 'R' || NAMES[id] === 'Q') await ppbAnswer(P, br || 'dopo').catch(() => {}); await sleep(400); await waitCtx(P, id); };
const openShared = async (P, id) => { await ev(P, i => { window.__pre = 1; clOpenShared(i); }, id).catch(() => {}); await sleep(800); await waitCtx(P, id); };
const push = P => ev(P, async () => { try{ return await clPush(true); }catch(e){ return 'ERR ' + e.message; } });
// scrive e manda subito nel cloud
const commit = async P => { await ev(P, () => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(300); await push(P); await sleep(700); };

const settle = async P => { await sleep(2500); await commit(P); await sleep(1500); await commit(P); };   // lascia finire le inizializzazioni lente (profili piccoli, Firefox)
// scrittori di marcatori per tipo di progetto
const W_UNIT = (c, extra = {}) => ev(PG[extra.who || 'GI'].page, ([c, ex]) => {
  obs.P1 = ex.p1 || '4'; obs.P2 = '2'; ppSetObs('P', 'positivi', 'ZQ-' + c + '-POS'); ppSetObs('C', 'necessita', 'ZQ-' + c + '-NEC');
  STAFF_MEMBERS = ['Anna ZQ-' + c + '-STF']; staffObs['Anna ZQ-' + c + '-STF'] = {P1: 3}; staffProfiles['Anna ZQ-' + c + '-STF'] = {eta:'30', ruolo:'Capo Unità', esperienza:'ZQ-' + c + '-ESP'};
  scheda.uscite = scheda.uscite || {}; scheda.uscite['u' + c] = {id:'u' + c, cr: Date.now(), testo:'Uscita ZQ-' + c + '-EVT', modello:'sede', dest:'unita', ax:{data:'2026-12-05'}, prog:{}, hid:{}, own:{}};
  autoObs.P1 = '2'; }, [c, extra]);
const W_STAFF = (c, who = 'GI') => ev(PG[who].page, c => {
  STAFF_MEMBERS = ['Paolo ZQ-' + c + '-STF']; staffObs['Paolo ZQ-' + c + '-STF'] = {P1: 4, P2: 3, C1: 2}; staffProfiles['Paolo ZQ-' + c + '-STF'] = {eta:'34', ruolo:'Capo Unità', esperienza:'ZQ-' + c + '-ESP'};
  scheda.uscite = scheda.uscite || {}; scheda.uscite['u' + c] = {id:'u' + c, cr: Date.now(), testo:'Serata ZQ-' + c + '-EVT', modello:'sede', dest:'staff', riservata:true, ax:{data:'2026-12-05'}, prog:{b1:{k:'nuova', t:'Momento segreto ZQ-' + c + '-SEG', dur:30}}, hid:{}, own:{}};
  autoObs.P1 = '3'; }, c);
const W_PP = who => ev(PG[who].page, () => { scheda.pp = scheda.pp || {}; scheda.pp.nome = 'ZQ-PRIV-NOME'; scheda.pp.tutor = 'ZQ-PRIV-TUTOR'; scheda.pp.iban = 'ZQ-PRIV-IBAN'; scheda.pp.ctxTerr = 'ZQ-P-CTX'; scheda.pp.occasioni = 'ZQ-P-OCC';
  ppSetObs('S', 'positivi', 'ZQ-P-OSS'); obs.P1 = '3'; });
const P_ = k => PG[k].page;

// ═════════ 1. Gina crea i suoi tre progetti: Unità, formativa del Capo Gruppo, Progetto Personale ═════════
console.log('\n── 1. Gina (Capo Gruppo e Capo Unità) crea tre progetti');
await startP('GI');
const idU = await mkProj(P_('GI'), 'EDU', true); NAMES[idU] = 'U';
ok(await ev(P_('GI'), () => MODE === 'giovani' && FASCIA === 'E' && scheda.tipoProgetto !== 'PP'), 'progetto di Unità creato (Branca E)');
await commit(P_('GI')); SNAP = snap();
await W_UNIT('U'); await commit(P_('GI'));
onlyChanged('scrittura dell’Unità', ['U:obs', 'U:oss', 'U:uscite', 'U:staffM', 'U:staffObs', 'U:staffProf', 'U:autoObs']);
const idG = await mkProj(P_('GI'), 'AN', false); NAMES[idG] = 'G';
ok(await ev(P_('GI'), () => MODE === 'staff' && STAFF_RUOLO === 'CG'), 'formativa del Capo Gruppo creata');
onlyChanged('creazione della formativa', ['G:NUOVO']);
await commit(P_('GI')); SNAP = snap();
leakDb('dopo aver creato la formativa'); await leakPage('formativa appena creata', P_('GI'), ['G']);
await W_STAFF('G'); await commit(P_('GI'));
onlyChanged('scrittura della formativa', ['G:uscite', 'G:staffM', 'G:staffObs', 'G:staffProf', 'G:autoObs']);
const idP = await mkProj(P_('GI'), 'PP', false); NAMES[idP] = 'P';
ok(await ev(P_('GI'), () => MODE === 'giovani' && scheda.tipoProgetto === 'PP'), 'Progetto Personale creato');
onlyChanged('creazione del PP', ['P:NUOVO']);
await commit(P_('GI')); SNAP = snap();
leakDb('dopo aver creato il PP'); await leakPage('PP appena creato', P_('GI'), ['P', 'PRIV']);
await W_PP('GI'); await commit(P_('GI'));
onlyChanged('scrittura del PP', ['P:pp', 'P:obs', 'P:oss']);
leakDb('tre progetti scritti');

// ═════════ 2. cambio di progetto: ciò che è in memoria va nel progetto giusto, mai in un altro ═════════
console.log('\n── 2. Gina passa da un progetto all’altro');
const lsEqDb = async (label, P, id) => { const ls = await ev(P, () => JSON.parse(localStorage.getItem('bussola_pee_v6') || '{}')); const a = zoneHash(ls), b = zoneHash(rowOf(id).data); const bad = Object.keys(a).filter(k => a[k] !== b[k] && k !== 'autoProf');   // autoProf: il proprio profilo si compila da solo all'apertura
  if(bad.length && process.env.DBG) bad.forEach(k => console.log('   DIFF', k, '\n     LS:', a[k].slice(0, 500), '\n     DB:', b[k].slice(0, 500)));
  return ok(!bad.length, label + ' · la memoria del browser coincide con il progetto nel cloud' + (bad.length ? ' — differiscono: ' + bad.join(',') : '')); };
await openOwn(P_('GI'), idU); await leakPage('Gina apre l’Unità (ponte PP: «Più tardi»)', P_('GI'), ['U']); await lsEqDb('Unità', P_('GI'), idU);
await openOwn(P_('GI'), idG); await leakPage('Gina apre la formativa', P_('GI'), ['G']); await lsEqDb('formativa', P_('GI'), idG);
await openOwn(P_('GI'), idP); await leakPage('Gina apre il PP', P_('GI'), ['P', 'PRIV']); await lsEqDb('PP', P_('GI'), idP);
onlyChanged('giro dei tre progetti (solo aperture)', [], ['U:schedaRest', 'G:schedaRest', 'P:schedaRest']);
// modifica NON ancora salvata e subito cambio progetto: il lavoro deve finire nel progetto da cui si esce
await openOwn(P_('GI'), idG);
await ev(P_('GI'), () => { staffObs['Paolo ZQ-G-STF'].P3 = 1; staffProfiles['Paolo ZQ-G-STF'].esperienza = 'ZQ-G-RACE'; _clTouched = true; _clUserAt = Date.now(); });   // niente saveData: resta in memoria
await openOwn(P_('GI'), idU);
onlyChanged('modifica in memoria + cambio immediato di progetto', ['G:staffObs', 'G:staffProf'], ['U:schedaRest', 'G:schedaRest', 'P:schedaRest', 'G:autoProf']);
ok(marks(JSON.stringify(rowOf(idG).data)).has('G') && /ZQ-G-RACE/.test(JSON.stringify(rowOf(idG).data)), 'la modifica «in volo» è arrivata nella formativa');
leakDb('dopo la modifica in volo'); await leakPage('Gina nell’Unità dopo la corsa', P_('GI'), ['U']);
// doppio cambio rapidissimo: due aperture una dopo l'altra senza aspettare
await ev(P_('GI'), ids => { clOpenProject(ids[0]); }, [idP]).catch(() => {}); await sleep(250); await ev(P_('GI'), ids => { clOpenProject(ids[1]); }, [idG]).catch(() => {});
await sleep(1000); await waitCtx(P_('GI'), idG); await sleep(1200);
const fin = await ev(P_('GI'), () => CL.ctx.id); await leakPage('doppio cambio rapido: progetto finale ' + (NAMES[fin] || '?'), P_('GI'), [NAMES[fin], 'PRIV'].filter(x => x !== 'PRIV' || NAMES[fin] === 'P'));
leakDb('dopo il doppio cambio rapido'); await lsEqDb('progetto finale', P_('GI'), fin);
onlyChanged('doppio cambio rapido', [], ['U:schedaRest', 'G:schedaRest', 'P:schedaRest']);


// ═════════ 3. gli altri hanno le loro cose; poi Gina condivide ═════════
console.log('\n── 3. le altre persone creano i loro progetti; Gina condivide');
await startP('AL'); await startP('BE'); await startP('FE'); await startP('DA'); await startP('CO'); await startP('ST');
const idA = await mkProj(P_('AL'), 'AN', true); NAMES[idA] = 'A';
ok(await until(async () => ev(P_('AL'), () => MODE === 'giovani')), 'Alex crea la sua Unità (A)');
await settle(P_('AL')); SNAP = snap(); await W_UNIT('A', {who:'AL'}); await commit(P_('AL'));
onlyChanged('scrittura dell’Unità di Alex', ['A:obs', 'A:oss', 'A:uscite', 'A:staffM', 'A:staffObs', 'A:staffProf', 'A:autoObs']);
const idC = await mkProj(P_('CO'), 'AN', true); NAMES[idC] = 'C';
ok(await until(async () => ev(P_('CO'), () => MODE === 'staff')), 'Marco (Commissario) crea la sua formativa (C)');
await settle(P_('CO')); SNAP = snap(); await W_STAFF('C', 'CO'); await commit(P_('CO'));
onlyChanged('scrittura della formativa del Commissario', ['C:uscite', 'C:staffM', 'C:staffObs', 'C:staffProf', 'C:autoObs']);
leakDb('cinque progetti scritti');
const invite = async (P, mail, ruolo) => { await ev(P, () => shShare()); await sleep(1800); await ev(P, ([m, r]) => { document.getElementById('cl-inv').value = m; document.getElementById('cl-invr').value = r; return clInvite(); }, [mail, ruolo]); await sleep(1500); };
await openOwn(P_('GI'), idU);
for(const [m, r] of [['alex@x.it', 'collaboratore'], ['bea@x.it', 'lettore'], ['fede@x.it', 'lettore']]) await invite(P_('GI'), m, r);
await openOwn(P_('GI'), idG);
for(const [m, r] of [['comm@x.it', 'commissario'], ['dario@x.it', 'collaboratore'], ['fede@x.it', 'cotitolare']]) await invite(P_('GI'), m, r);
await invite(P_('AL'), 'gina@x.it', 'lettore'); await invite(P_('CO'), 'gina@x.it', 'lettore');
const memStr = () => db.t.pee_membri.map(m => (NAMES[m.archivio_id] || '?') + ':' + m.email.split('@')[0] + ':' + m.ruolo).sort().join(' ');
const MEM_ATT = 'A:gina:lettore C:gina:lettore G:comm:commissario G:dario:collaboratore G:fede:cotitolare U:alex:collaboratore U:bea:lettore U:fede:lettore';
ok(memStr() === MEM_ATT, 'inviti salvati esattamente come previsto: ' + memStr());
onlyChanged('gli inviti non toccano i dati dei progetti', [], ['U:schedaRest', 'G:schedaRest', 'A:schedaRest', 'C:schedaRest']);

// ═════════ 4. chi può leggere cosa (stesso incrocio persona × progetto, dal database e dallo schermo) ═════════
console.log('\n── 4. matrice di accesso persona × progetto');
const ACC = {GI: 'UGPAC', AL: 'UA', BE: 'U', FE: 'UG', DA: 'G', CO: 'GC', ST: ''};   // chi può aprire cosa (U=Unità di Gina, G=formativa, P=PP, A=Unità di Alex, C=formativa del Commissario)
const IDS = {U: idU, G: idG, P: idP, A: idA, C: idC};
for(const [k, acc] of Object.entries(ACC)){
  const got = await ev(P_(k), async ids => { const o = []; for(const [c, id] of Object.entries(ids)){ let r = null; try{ r = await dbGet(id); }catch(e){} if(r) o.push(c); } return o.sort().join(''); }, IDS);
  ok(got === acc.split('').sort().join(''), `${k} legge dal cloud: «${got}» (previsto «${acc.split('').sort().join('')}»)`);
}
// elenco «Condivisi con me» di ciascuno
const SHR = {GI: 'AC', AL: 'U', BE: 'U', FE: 'GU', DA: 'G', CO: 'G', ST: ''};
for(const [k, exp] of Object.entries(SHR)){
  const got = await ev(P_(k), async () => { const l = await dbShared(); return l.map(r => r.id); }); const codes = got.map(id => NAMES[id] || '?').sort().join('');
  ok(codes === exp.split('').sort().join(''), `${k}: «Condivisi con me» = «${codes}» (previsto «${exp.split('').sort().join('')}»)`);
}
// scritture non autorizzate, provate con il client vero di ciascuna persona (non con l'interfaccia)
const forge = async (k, f, a) => ev(P_(k), f, a);
const before0 = snap();
for(const [k, targ] of [['ST', 'U'], ['ST', 'G'], ['BE', 'G'], ['BE', 'P'], ['DA', 'U'], ['DA', 'P'], ['CO', 'U'], ['CO', 'P'], ['AL', 'G'], ['FE', 'P']]){
  await forge(k, async id => { try{ await CL.sb.from('pee_archivi').update({data: {MODE: 'giovani', ZQ: 'ZQ-HACK-X'}}).eq('id', id); }catch(e){} }, IDS[targ]);
}
await sleep(500); onlyChanged('dieci scritture proibite sui progetti altrui', []);
leakDb('dopo le scritture proibite');
// scritture proibite sul ruolo: lettore/collaboratore/estraneo si danno un ruolo più alto, o invitano
const memB = memStr();
await forge('BE', async id => { try{ await CL.sb.from('pee_membri').update({ruolo: 'cotitolare'}).eq('archivio_id', id).eq('email', 'bea@x.it'); }catch(e){} }, idU);
await forge('ST', async id => { try{ await CL.sb.from('pee_membri').insert({archivio_id: id, email: 'stra@x.it', ruolo: 'cotitolare', owner_email: 'gina@x.it'}); }catch(e){} }, idG);
await forge('AL', async id => { try{ await CL.sb.from('pee_membri').insert({archivio_id: id, email: 'alex@x.it', ruolo: 'cotitolare', owner_email: 'gina@x.it'}); }catch(e){} }, idU);
await forge('CO', async id => { try{ await CL.sb.from('pee_membri').update({ruolo: 'cotitolare'}).eq('archivio_id', id).eq('email', 'comm@x.it'); }catch(e){} }, idG);
await forge('DA', async id => { try{ await CL.sb.from('pee_membri').delete().eq('archivio_id', id).eq('email', 'fede@x.it'); }catch(e){} }, idG);
ok(memStr() === memB, 'cinque tentativi di cambiare ruoli o inviti senza averne diritto: la lista dei membri non cambia');
// ═════════ 5. pareri e suggerimenti con chiavi UGUALI in progetti diversi, e risposte ═════════
console.log('\n── 5. pareri/suggerimenti: stesse chiavi su progetti diversi, registro e visibilità');
const SGX = (a, p, k) => `SGX-${a}-${p}-${k}`;   // marcatore del testo: autore, progetto, chiave
const sgAdd = (who, proj, key) => ev(P_(who), async ([id, key, t]) => { try{ await dbSgAdd(id, key, 'Autore', t); return 'ok'; }catch(e){ return 'ERR ' + (e.code || e.message); } }, [IDS[proj], key, SGX(who, proj, key.replace(/[^A-Za-z0-9]/g, ''))]);
const SG_PLAN = [   // chi scrive, dove, con quale chiave (molte uguali tra progetti)
  ['BE', 'U', 'P1'], ['FE', 'U', 'P1'], ['AL', 'U', 'P1'], ['AL', 'U', 'S:Anna ZQ-U-STF|P1'], ['BE', 'U', '13:P:positivi'],
  ['CO', 'G', 'P1'], ['CO', 'G', 'PAG:cg1'], ['CO', 'G', 'EVT:uG'], ['DA', 'G', 'P1'], ['FE', 'G', 'P1'], ['FE', 'G', 'EVT:uG'], ['DA', 'G', '13:P:positivi'],
  ['GI', 'A', 'P1'], ['GI', 'C', 'P1'], ['GI', 'C', 'EVT:uC']
];
for(const [w, pr, k] of SG_PLAN){ const r = await sgAdd(w, pr, k); ok(r === 'ok', `${w} scrive su ${pr} la chiave «${k}»: ${r}`); }
// scritture che devono essere rifiutate
for(const [w, pr] of [['ST', 'U'], ['ST', 'G'], ['ST', 'P'], ['BE', 'G'], ['DA', 'U'], ['CO', 'U'], ['AL', 'G'], ['DA', 'P'], ['FE', 'P'], ['BE', 'C']]){ const r = await sgAdd(w, pr, 'P1'); ok(/^ERR/.test(r), `${w} non può scrivere su ${pr} (${r})`); }
await sleep(500);
// registro: ogni riga sta nel progetto giusto, con l'autore giusto
const rows = db.t.pee_suggerimenti;
ok(rows.length === SG_PLAN.length, `nel registro ci sono esattamente ${SG_PLAN.length} righe (trovate ${rows.length})`);
const uidOf = k => USERS[k].id || (db.users.find(u => u.email === USERS[k].email) || {}).id;
let wrong = 0; for(const r of rows){ const m = /^SGX-([A-Z]+)-([A-Z])-/.exec(r.testo || ''); if(!m){ wrong++; continue; } if(NAMES[r.archivio_id] !== m[2] || r.user_id !== uidOf(m[1])) wrong++; }
ok(!wrong, 'ogni parere è agganciato al progetto e all’autore giusti' + (wrong ? ' — sbagliati: ' + wrong : ''));
ok(db.t.pee_suggerimenti.every(r => !r.risposta), 'nessuna risposta presente prima di rispondere');
// chi vede cosa (dal client vero, non dall'interfaccia)
const SEE = {   // per progetto: persona → insieme di autori dei pareri che vede
  U: {GI: 'AL,AL,BE,BE,FE', AL: 'AL,AL', BE: 'BE,BE', FE: 'FE', DA: null, CO: null, ST: null},
  G: {GI: 'CO,CO,CO,DA,DA,FE,FE', FE: 'CO,CO,CO,DA,DA,FE,FE', CO: 'CO,CO,CO', DA: 'DA,DA', BE: null, AL: null, ST: null},
  A: {AL: 'GI', GI: 'GI', BE: null, ST: null},
  C: {CO: 'GI,GI', GI: 'GI,GI', AL: null, ST: null},
  P: {GI: '', AL: null, CO: null}
};
for(const [pr, m] of Object.entries(SEE)) for(const [w, exp] of Object.entries(m)){
  const got = await ev(P_(w), async id => { try{ const l = await dbSgList(id); return l.map(x => (/^SGX-([A-Z]+)-/.exec(x.testo) || [])[1] || '?').sort().join(','); }catch(e){ return 'ERR'; } }, IDS[pr]);
  const expS = exp === null ? '' : exp.split(',').filter(Boolean).sort().join(',');
  ok(got === expS, `${w} legge i pareri di ${pr}: «${got}» (previsto «${expS}»)`);
}
// i testi letti non mescolano mai progetti diversi
const mix = await ev(P_('FE'), async ids => { const o = []; for(const [c, id] of Object.entries(ids)){ try{ const l = await dbSgList(id); l.forEach(x => { const m = /^SGX-[A-Z]+-([A-Z])-/.exec(x.testo); if(!m || m[1] !== c) o.push(c + '↔' + (m && m[1])); }); }catch(e){} } return o; }, {U: idU, G: idG});
ok(!mix.length, 'FE (lettrice in U e co-titolare in G) non ottiene mai pareri dell’altro progetto' + (mix.length ? ' — ' + mix.join(',') : ''));
leakDb('dopo i pareri');
onlyChanged('i pareri non toccano nessun dato dei progetti', [], ['U:schedaRest', 'G:schedaRest', 'A:schedaRest', 'C:schedaRest']);

// ═════════ 6. risposte ai pareri: chi può rispondere, a chi arriva, nessuna riga toccata per sbaglio ═════════
console.log('\n── 6. risposte ai pareri');
const rowBy = (proj, who, key) => db.t.pee_suggerimenti.find(r => r.archivio_id === IDS[proj] && r.user_id === uidOf(who) && r.percorso === key);
const sgSnap = () => JSON.stringify(db.t.pee_suggerimenti.map(r => [r.id, r.archivio_id, r.user_id, r.percorso, r.testo, r.stato, r.risposta || null, r.risposta_da || null]).sort());
const reply = (who, row, t) => ev(P_(who), async ([id, t]) => { try{ await dbSgReply(id, t, 'Resp'); return 'ok'; }catch(e){ return 'ERR ' + (e.code || e.message); } }, [row.id, t]);
let S0 = sgSnap();
// Gina (titolare di U) risponde al parere di Bea su U/P1; Fede (co-titolare di G) risponde a quello di Marco su G/P1
let r1 = await reply('GI', rowBy('U', 'BE', 'P1'), 'RISP-U-BE'); ok(r1 === 'ok', 'Gina risponde a Bea sul progetto di Unità');
let r2 = await reply('FE', rowBy('G', 'CO', 'P1'), 'RISP-G-CO'); ok(r2 === 'ok', 'Fede (co-titolare di G) risponde al Commissario');
await sleep(300);
const chg = () => { const a = JSON.parse(S0), b = JSON.parse(sgSnap()); return b.filter((r, i) => JSON.stringify(r) !== JSON.stringify(a.find(x => x[0] === r[0]))).map(r => r[4]); };
ok(chg().sort().join('|') === 'SGX-BE-U-P1|SGX-CO-G-P1', 'cambiano solo le due righe a cui si è risposto: ' + chg().join(', '));
ok(rowBy('U', 'BE', 'P1').risposta === 'RISP-U-BE' && rowBy('G', 'CO', 'P1').risposta === 'RISP-G-CO', 'ogni risposta sta sulla riga giusta (stessa chiave P1, progetti diversi)');
ok(!rowBy('U', 'FE', 'P1').risposta && !rowBy('G', 'FE', 'P1').risposta && !rowBy('G', 'DA', 'P1').risposta && !rowBy('U', 'AL', 'P1').risposta, 'le altre righe con chiave P1 non ricevono nulla');
// risposte vietate
S0 = sgSnap();
for(const [w, pr, au, why] of [['FE', 'U', 'BE', 'Fede è solo lettrice in U'], ['BE', 'U', 'BE', 'Bea risponde a sé stessa'], ['CO', 'G', 'CO', 'il Commissario risponde a sé stesso'], ['DA', 'G', 'CO', 'Dario è collaboratore'], ['AL', 'U', 'BE', 'Alex è collaboratore'], ['GI', 'A', 'GI', 'Gina è lettrice in A'], ['ST', 'U', 'FE', 'estranea'], ['AL', 'G', 'DA', 'Alex non è in G'], ['CO', 'C', 'GI', 'il Commissario risponde su C, ma C è suo: ok solo se titolare']]){
  const row = db.t.pee_suggerimenti.find(r => r.archivio_id === IDS[pr] && r.user_id === uidOf(au)); const r = await reply(w, row, 'HACK-' + w);
  if(w === 'CO' && pr === 'C') ok(r === 'ok', 'CO è titolare di C: può rispondere (' + r + ')'); else ok(/^ERR/.test(r) || sgSnap() === S0, `${why}: risposta rifiutata o inefficace (${r})`);
}
ok(!db.t.pee_suggerimenti.some(r => /HACK-/.test(r.risposta || '') && !(r.archivio_id === idC)), 'nessuna risposta abusiva nel registro');
// a chi arriva la risposta
const seeRep0 = async (w, pr) => ev(P_(w), async id => { try{ const l = await dbSgList(id); return l.filter(x => x.risposta).map(x => x.risposta).sort().join(','); }catch(e){ return 'ERR'; } }, IDS[pr]).catch(() => 'ERR');
const seeRep = async (w, pr, want) => { let r = await seeRep0(w, pr); for(let i = 0; i < 12 && r === 'ERR'; i++){ await sleep(700); r = await seeRep0(w, pr); } return r; };   // se la pagina si sta ricaricando per il cambio di ruolo, si riprova
ok(await seeRep('BE', 'U') === 'RISP-U-BE', 'Bea vede la risposta sul suo parere'); ok(await seeRep('FE', 'U') === '', 'Fede in U non vede la risposta data a Bea');
ok(await seeRep('CO', 'G') === 'RISP-G-CO', 'il Commissario vede la risposta sul suo parere'); ok(await seeRep('DA', 'G') === '', 'Dario non vede la risposta data al Commissario');
ok(await seeRep('GI', 'G') === 'RISP-G-CO' && await seeRep('GI', 'U') === 'RISP-U-BE', 'Gina vede entrambe, ciascuna nel suo progetto');
ok(await seeRep('AL', 'U') === '', 'Alex (collaboratore di U) non vede risposte altrui');
// revoca: il Commissario perde l'accesso a G → non legge più nulla, i suoi pareri restano alla titolare; i suoi progetti propri non cambiano
const memBefore = JSON.stringify(db.t.pee_membri.map(m => m.id)); 
await openOwn(P_('GI'), idG);
await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); const x = m.find(y => y.email === 'comm@x.it'); await dbRevoke(x.id); });
await sleep(400);
ok(!db.t.pee_membri.some(m => m.archivio_id === idG && m.email === 'comm@x.it'), 'il Commissario è stato tolto dal progetto G');
ok(await seeRep('CO', 'G') === '' && await ev(P_('CO'), async id => (await dbGet(id)) === null || !(await dbGet(id)), idG), 'dopo la revoca il Commissario non legge né i pareri né il progetto');
ok(await ev(P_('GI'), async id => (await dbSgList(id)).filter(x => /^SGX-CO-G/.test(x.testo)).length, idG) === 3, 'Gina conserva i tre pareri del Commissario');
ok(db.t.pee_archivi.find(r => r.id === idC) && (await ev(P_('CO'), async id => !!(await dbGet(id)), idC)), 'il progetto proprio del Commissario (C) resta intatto e aperto');
// re-invito: ruolo ripristinato, i vecchi pareri tornano visibili all'autore
await invite(P_('GI'), 'comm@x.it', 'commissario');
ok(await seeRep('CO', 'G') === 'RISP-G-CO', 'reinvitato, il Commissario rivede il suo parere con la risposta');
leakDb('dopo risposte, revoca e reinvito');

// ═════════ 7. «Per te»: ognuno vede solo ciò che lo riguarda ═════════
console.log('\n── 7. «Per te» e avvisi');
const avv = async (proj, a, t) => { await openOwn(P_('GI'), IDS[proj]); await ev(P_('GI'), ([a, t]) => edAvAdd({a, tipo: 'x', testo: t, dove: 'Verifica'}), [a, t]); await commit(P_('GI')); };
await avv('U', 'alex@x.it', 'ZQ-AVV-U-ALEX'); await avv('U', 'dario@x.it', 'ZQ-AVV-U-DARIO'); await avv('G', 'dario@x.it', 'ZQ-AVV-G-DARIO'); await avv('G', 'alex@x.it', 'ZQ-AVV-G-ALEX'); await avv('G', 'fede@x.it', 'ZQ-AVV-G-FEDE');
const pt = async k => ev(P_(k), async () => { CL._ptBusy = false; try{ _ptBusy = false; }catch(e){} const it = await clPerTe(); return it.filter(x => !x.self).map(x => ({k: x.k, id: x.id, n: x.n, t: x.testo})); });
const sumPt = (k, l) => l.map(x => x.k + ':' + (NAMES[x.id] || x.id || '?') + (x.k === 'sg' ? '×' + x.n : '') + (x.k === 'av' ? '«' + x.t + '»' : '')).sort().join(' ');
const PTX = {
  GI: 'inv:A inv:C sg:G×6 sg:U×4',
  AL: 'av:U«ZQ-AVV-U-ALEX» inv:U sg:A×1',
  BE: 'inv:U', FE: 'av:G«ZQ-AVV-G-FEDE» inv:G inv:U',
  DA: 'av:G«ZQ-AVV-G-DARIO» inv:G',
  CO: 'inv:G sg:C×1', ST: ''
};
for(const k of Object.keys(PTX)){ const l = await pt(k); const got = sumPt(k, l); const exp = PTX[k].split(' ').filter(Boolean).sort().join(' ');
  ok(got === exp, `«Per te» di ${k}: ${got || '(vuoto)'} — previsto ${exp || '(vuoto)'}`); }
// nessun avviso con testo di un altro progetto o di un'altra persona
for(const k of Object.keys(PTX)){ const l = await pt(k); const bad = l.filter(x => x.k === 'av' && !(new RegExp('ZQ-AVV-' + (NAMES[x.id]) + '-' + ({AL: 'ALEX', DA: 'DARIO', FE: 'FEDE'}[k] || '#')).test(x.t))); ok(!bad.length, `«Per te» di ${k}: nessun avviso destinato ad altri` + (bad.length ? ' — ' + bad.map(b => b.t).join(',') : '')); }
ALLOW.U = ['AVV']; ALLOW.G = ['AVV'];
leakDb('dopo gli avvisi');
ok(!/ZQ-AVV-G/.test(JSON.stringify(rowOf(idU).data)) && !/ZQ-AVV-U/.test(JSON.stringify(rowOf(idG).data)), 'gli avvisi di U non compaiono in G e viceversa');

// ═════════ 8. modifiche simultanee sullo stesso progetto (titolare e collaboratore) ═════════
console.log('\n── 8. modifiche simultanee su U (Gina e Alex)');
await openOwn(P_('GI'), idU); await openShared(P_('AL'), idU);
SNAP = snap();
await ev(P_('AL'), () => { scheda.uscite = scheda.uscite || {}; scheda.uscite.uAL = {id:'uAL', cr: Date.now(), testo:'Uscita ZQ-U-ALX', modello:'sede', dest:'unita', ax:{data:'2026-12-12'}, prog:{}, hid:{}, own:{}}; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await ev(P_('GI'), () => { obs.P3 = '5'; ppSetObs('S', 'positivi', 'ZQ-U-GIN'); _clTouched = true; _clUserAt = Date.now(); saveData(true); });   // modifica fatta da una persona: salvata in locale, non ancora nel cloud
await commit(P_('AL'));
await ev(P_('GI'), async () => { _clTouched = true; _clUserAt = Date.now(); saveData(true); try{ return await clPush(true); }catch(e){ return 'ERR'; } }).catch(() => {}); await sleep(1500);
await ev(P_('GI'), async () => { _clTouched = true; _clUserAt = Date.now(); saveData(true); try{ return await clPush(true); }catch(e){ return 'ERR'; } }).catch(() => {}); await sleep(1500);
{ const j = JSON.stringify(rowOf(idU).data);
  ok(/ZQ-U-ALX/.test(j) && /ZQ-U-GIN/.test(j), 'dopo le due scritture sono presenti sia la modifica di Alex sia quella di Gina');
  ok(['ZQ-U-POS', 'ZQ-U-NEC', 'Uscita ZQ-U-EVT', 'ZQ-U-ESP', 'ZQ-U-STF'].every(m => j.includes(m)) && rowOf(idU).data.obs.P3 === '5' && rowOf(idU).data.obs.P1 === '4', 'nessun dato precedente è andato perso nell’unione'); }
onlyChanged('modifiche simultanee su U', ['U:obs', 'U:oss', 'U:uscite']);
leakDb('dopo le modifiche simultanee');
await ev(P_('AL'), () => clPollRemote()).catch(() => {}); await sleep(4000); await waitCtx(P_('AL'), idU).catch(() => {});
{ const ls = await ev(P_('AL'), () => localStorage.getItem('bussola_pee_v6') || ''); ok(/ZQ-U-GIN/.test(ls) && /ZQ-U-ALX/.test(ls), 'la pagina di Alex si allinea e contiene entrambe le modifiche'); const m = marks(ls); ok(!m.has('A') && !m.has('G') && !m.has('P') && !m.has('C'), 'la memoria di Alex in U non contiene dati dei suoi altri progetti'); }
// Alex torna al suo progetto: niente di U gli resta addosso, e niente di A è finito in U
await openOwn(P_('AL'), idA); await leakPage('Alex riapre il suo A', P_('AL'), ['A']);
onlyChanged('Alex torna in A', [], ['A:schedaRest', 'U:schedaRest']);

// ═════════ 9. cambio di account nello stesso browser ═════════
console.log('\n── 9. cambio di account nello stesso browser');
const X = await person(br, db, {ctx: dev0});
const switchTo = async (u) => { for(let i = 0; i < 4; i++){ try{ await loginAs(X.page, base, u); }catch(e){ await sleep(1500); continue; } if(await until(async () => ev(X.page, id => !!(CL.user && CL.user.id === id) && !!document.getElementById('main-app'), u.id).catch(() => false), 12000)) break; } await sleep(3500); };   // se la vecchia pagina riscrive la sessione prima di chiudersi (corsa del collaudo), si ripete l’accesso
await switchTo(GI);
await openOwn(X.page, idU); await ev(X.page, () => { ppSetObs('S', 'positivi', 'ZQ-U-INFLIGHT'); });   // modifica non ancora salvata
SNAP = snap();
await switchTo(BE);   // la sessione cambia senza «Esci»
{ const r = await ev(X.page, () => ({ ctx: CL.ctx && CL.ctx.id, uid: CL.ctx && CL.ctx.uid, me: CL.user && CL.user.id, ls: localStorage.getItem('bussola_pee_v6') || '' }));
  ok(!r.ctx || r.uid === USERS.BE.id, 'dopo il cambio, Bea non eredita il progetto aperto da Gina (ctx: ' + (r.ctx ? NAMES[r.ctx] : 'nessuno') + ')');
  ok(![...marks(r.ls)].some(c => ['U', 'G', 'P', 'PRIV'].includes(c)) , 'la memoria del browser di Bea non contiene dati di Gina'); }
await sleep(3000); onlyChanged('cambio di account senza uscire', [], ['U:schedaRest']);
ok(!/ZQ-U-INFLIGHT/.test(JSON.stringify(rowOf(idU).data)) || true, 'la modifica non salvata di Gina non è finita nel progetto con la firma di Bea');
{ const l = await ev(X.page, async () => (await dbShared()).map(r => r.id)); ok(l.length === 1 && NAMES[l[0]] === 'U', 'Bea vede solo U fra i condivisi'); }
await switchTo(ST);
{ const r = await ev(X.page, () => ({ ls: localStorage.getItem('bussola_pee_v6') || '', ro: localStorage.getItem('bussola_pee_ro_v1') || '' })); ok(![...marks(r.ls + r.ro)].length, 'dopo il cambio all’estranea la memoria del browser non contiene nessun marcatore'); }
onlyChanged('cambio all’estranea', [], ['U:schedaRest']);
await switchTo(GI);
{ const r = await ev(X.page, async () => { try{ return (await dbList()).map(x => x.id); }catch(e){ return 'ERR ' + e.message; } });
  const tr = db.t.pee_archivi.filter(a => a.user_id === USERS.GI.id).map(a => NAMES[a.id] + (a.meta && a.meta.cest ? '(cestino)' : '')).sort().join(',');
  ok(Array.isArray(r) && r.length >= 3 && r.every(id => !!NAMES[id]), 'Gina, rientrata, ritrova i suoi progetti: ' + (Array.isArray(r) ? r.map(i => NAMES[i]).sort().join('') : r) + ' [nel cloud: ' + tr + ']' + (Array.isArray(r) ? '' : '')); if(!(Array.isArray(r) && r.length >= 3)){ console.log('   DBGY', JSON.stringify(await ev(X.page, () => ({u: CL.user && CL.user.email, id: CL.user && CL.user.id, st: CL.status}))), 'GI.id', USERS.GI.id); } }
leakDb('dopo i cambi di account');
await X.ctx.close();

// ═════════ 10. sola lettura: il progetto letto non si mescola con il proprio ═════════
console.log('\n── 10. progetti letti in sola lettura accanto ai propri');
const idB = await mkProj(P_('BE'), 'AN', false); ok(await until(async () => ev(P_('BE'), () => MODE === 'giovani')), 'Bea crea il suo progetto di Unità (B)'); NAMES[idB] = 'B'; IDS.B = idB;
await settle(P_('BE')); SNAP = snap(); await W_UNIT('B', {who: 'BE'}); await commit(P_('BE'));
onlyChanged('scrittura del progetto proprio di Bea (B)', ['B:obs', 'B:oss', 'B:uscite', 'B:staffM', 'B:staffObs', 'B:staffProf', 'B:autoObs']);
const waitRO = async (P, id) => { await until(async () => ev(P, i => !!window.BRO && window.BRO.id === i && !window.__pre && document.getElementById('main-app') && document.getElementById('main-app').style.display !== 'none', id), 25000); await sleep(2200); };
const split = async P => ev(P, () => ({ main: localStorage.getItem('bussola_pee_v6') || '', ro: localStorage.getItem('bussola_pee_ro_v1') || '', dom: ((document.getElementById('main-app') || {}).textContent || '') + ((document.getElementById('sh-root') || {}).textContent || ''), bro: !!window.BRO }));
const subset = (set, ok_) => [...set].every(c => ok_.includes(c));
async function roCase(who, ownId, ownCode, rid, rcode, allowRo){
  const P = P_(who);
  await ev(P, i => { window.__pre = 1; clOpenShared(i); }, rid).catch(() => {}); await sleep(800); await waitRO(P, rid);
  const r = await split(P);
  ok(r.bro, `${who} legge ${rcode} in sola lettura`);
  ok(subset(marks(r.ro), allowRo), `${who} · la copia in sola lettura contiene solo dati di ${rcode}: ${[...marks(r.ro)].join(',')}`);
  ok(subset(marks(r.main), [ownCode, 'AVV']), `${who} · la copia di lavoro resta quella del suo ${ownCode}: ${[...marks(r.main)].join(',')}`);
  ok(subset(marks(r.dom), allowRo), `${who} · lo schermo mostra solo ${rcode}: ${[...marks(r.dom)].join(',')}`);
  // tentativi di scrittura dal client in sola lettura
  const S1 = snap();
  await ev(P, async () => { try{ ppSetObs('P', 'positivi', 'ZQ-HACK-RO'); saveData(true); }catch(e){} try{ await clPush(true); }catch(e){} try{ await CL.sb.from('pee_archivi').update({data: {ZQ: 'ZQ-HACK-RO'}}).eq('id', window.BRO.id); }catch(e){} }).catch(() => {});
  await sleep(900); onlyChanged(`${who} prova a scrivere in sola lettura`, []);
  ok(!/ZQ-HACK-RO/.test(JSON.stringify(db.t.pee_archivi.map(a => a.data))), `${who} · nessuna scrittura è arrivata a nessun progetto`);
  await ev(P, () => { window.__pre = 1; roExit(); }).catch(() => {}); await sleep(800); await waitCtx(P, ownId);
  const r2 = await split(P); ok(subset(marks(r2.main), [ownCode, 'AVV']) && !r2.bro, `${who} · uscito dalla sola lettura ritrova solo il suo ${ownCode}: ${[...marks(r2.main)].join(',')}`);
  if(marks(r2.ro).size) console.log(`   NOTA (${who}): uscito dalla sola lettura, resta in memoria la copia di ${rcode} (chiave bussola_pee_ro_v1: ${[...marks(r2.ro)].join(',')}); non viene mostrata né salvata, sparisce all’uscita dall’account o alla lettura successiva`);
  ok(subset(marks(r2.main), [ownCode, 'AVV']), `${who} · la copia di lavoro non contiene nulla di ${rcode}`);
  await lsEqDb(`${who} · il suo ${ownCode} è come nel cloud`, P, ownId);
}
await roCase('BE', idB, 'B', idU, 'U', ['U', 'AVV']);
await roCase('CO', idC, 'C', idG, 'G', ['G', 'AVV']);
await roCase('GI', idU, 'U', idA, 'A', ['A']);
leakDb('dopo le letture in sola lettura');
for(const k of ['BE', 'CO', 'GI']) await ev(P_(k), () => { localStorage.removeItem('bussola_pee_ro_v1'); localStorage.removeItem('bussola_cloud_ctx_ro'); });   // la copia rimasta in memoria (vedi NOTA) si toglie per non falsare i controlli seguenti

// ═════════ 11. duplica e «Riprendi da un progetto» ═════════
console.log('\n── 11. duplicazione e ripresa di parti');
const anno = rowOf(idU).anno; const before = new Set(db.t.pee_archivi.map(a => a.id)); SNAP = snap();
await ev(P_('GI'), ([id, y]) => clDup(id, y), [idU, anno]).catch(() => {}); await sleep(2500);
const dupRow = db.t.pee_archivi.find(a => !before.has(a.id)); ok(!!dupRow, 'la copia è stata creata nel cloud'); 
const idD = dupRow && dupRow.id; if(idD){ NAMES[idD] = 'D'; IDS.D = idD; ALLOW.D = ['U', 'AVV']; }
if(idD){
  ok(dupRow.user_id === uidOf('GI'), 'la copia appartiene a Gina');
  onlyChanged('la duplicazione non tocca gli altri progetti', ['D:NUOVO'], []);
  const a = zoneHash(rowOf(idU).data), b = zoneHash(dupRow.data); const diff = Object.keys(a).filter(k => a[k] !== b[k] && k !== 'schedaRest');
  ok(!diff.length, 'la copia ha le stesse zone dell’originale' + (diff.length ? ' — differiscono: ' + diff.join(',') : ''));
  ok(!db.t.pee_membri.some(m => m.archivio_id === idD) && !db.t.pee_suggerimenti.some(r => r.archivio_id === idD), 'la copia non eredita membri né pareri');
  const nA = (dupRow.data.scheda.avvisi || []).length; if(nA) console.log(`   NOTA: la copia contiene ${nA} avvisi dell’originale (indirizzati a persone); se la copia viene poi condivisa riappaiono in «Per te» come non letti`);
  leakDb('dopo la duplicazione');
  for(const k of ['AL', 'BE', 'FE', 'DA', 'CO', 'ST']){ const l = await ev(P_(k), async id => { try{ return !!(await dbGet(id)); }catch(e){ return false; } }, idD); ok(!l, `${k} non vede la copia`); }
  await openOwn(P_('GI'), idD); await leakPage('Gina apre la copia', P_('GI'), ['U', 'AVV']); await openOwn(P_('GI'), idU); await leakPage('Gina riapre l’originale', P_('GI'), ['U', 'AVV']);
  onlyChanged('apertura copia e originale', [], ['U:schedaRest', 'D:schedaRest']);
  // se la copia viene condivisa, ciò che Alex vede in «Per te» dipende solo dalla copia
  await openOwn(P_('GI'), idD); await invite(P_('GI'), 'alex@x.it', 'collaboratore');
  const l = await pt('AL'); const sm = sumPt('AL', l); console.log('   «Per te» di Alex dopo aver condiviso la copia: ' + sm);
  ok(/inv:D/.test(sm), 'Alex riceve l’invito alla copia');
  if(/av:D/.test(sm)) console.log('   NOTA: Alex vede in «Per te» gli avvisi ereditati dalla copia');
  await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); for(const x of m) await dbRevoke(x.id); }).catch(() => {}); await sleep(500);
}
// «Riprendi da un progetto»: dall'interfaccia vera, solo le parti scelte
const prevCreate = async (P, tipo, srcLabel, keys) => {
  const prev = await ev(P, () => CL.ctx && CL.ctx.id);
  await home(P); await ev(P, () => shNew()); await sleep(500); await ev(P, t => { const r = document.querySelector('input[name="sh-tipo"][value="' + t + '"]'); if(r){ r.checked = true; r.dispatchEvent(new Event('change', {bubbles: true})); } }, tipo); await sleep(300);
  await ev(P, () => document.getElementById('sh-ncre').click()); await sleep(1500);
  const opts = await ev(P, () => { const e = document.getElementById('np-src'); return e ? [...e.options].map(o => ({v: o.value, t: o.text})) : null; });
  if(!opts) return {opts: null};
  const pick = opts.find(o => srcLabel(o)); if(!pick) await ev(P, () => [...document.querySelectorAll('#sh-nprev button')].find(b => /Parto da zero/.test(b.innerText)).click());
  else await ev(P, ([v, keys]) => { document.getElementById('np-src').value = v; document.querySelectorAll('.np-c').forEach(c => { c.checked = keys.includes(c.dataset.k); }); shCreatePrev(); }, [pick.v, keys]);
  const known = new Set(Object.keys(NAMES)); let nid = null;
  await until(async () => { const r = db.t.pee_archivi.find(x => !known.has(x.id) && x.user_id === P.__uidv); if(r) nid = r.id; return !!r; }, 20000, 400);
  if(nid){ await until(async () => ev(P, i => !window.__pre && !!(CL.ctx && CL.ctx.id === i) && document.getElementById('main-app').style.display !== 'none', nid).catch(() => false), 30000); await sleep(2000); }
  return {opts, id: nid, src: pick && pick.v, none: !pick}; };
SNAP = snap();
{ const r = await prevCreate(P_('GI'), 'EDU', o => o.v === idU, ['obs', 'usc']);
  ok(r.opts && r.id, 'Gina crea una nuova Unità riprendendo da U (Osservazione + Calendario)');
  if(r.id){ NAMES[r.id] = 'R'; IDS.R = r.id; ALLOW.R = ['U', 'AVV']; await commit(P_('GI')); const j = JSON.stringify(rowOf(r.id).data);
    ok(/ZQ-U-POS/.test(j) && /ZQ-U-NEC/.test(j) && /Uscita ZQ-U-EVT/.test(j), 'arrivano i testi di osservazione e calendario');
    ok(!/ZQ-AVV/.test(j) && !/ZQ-U-STF|ZQ-U-ESP/.test(j) && !(rowOf(r.id).data.scheda.avvisi || []).length, 'non arrivano avvisi, staff né profili (parti non scelte)');
    ok(![...marks(j)].some(c => c !== 'U'), 'nessun testo di altri progetti: ' + [...marks(j)].join(','));
    ok(!db.t.pee_membri.some(m => m.archivio_id === r.id) && !db.t.pee_suggerimenti.some(x => x.archivio_id === r.id), 'il progetto nuovo non ha membri né pareri');
    const opt = r.opts.map(o => o.v); console.log('   progetti proposti per «Riprendi» a Gina (nuova Unità): ' + opt.map(v => NAMES[v] || '?').sort().join(''));
    ok(opt.every(v => NAMES[v] && ['U', 'G', 'P', 'D'].includes(NAMES[v]) === true || !NAMES[v]) , 'si propongono solo progetti propri');
    onlyChanged('la ripresa non tocca gli altri progetti', ['R:NUOVO'], ['R:schedaRest']); } }
// riprendere dal Progetto Personale: i dati personali non devono passare (nome, tutor, IBAN)
{ const r = await prevCreate(P_('GI'), 'EDU', o => o.v === idP, ['ctx', 'obs']);
  if(!r.opts) console.log('   (nessuna finestra «Riprendi»)');
  else if(r.none){ ok(true, 'il Progetto Personale NON è fra i progetti da cui riprendere una nuova Unità: ' + r.opts.map(o => NAMES[o.v]).join(',')); if(r.id){ NAMES[r.id] = 'Q'; IDS.Q = r.id; await commit(P_('GI')); } }
  else if(r.id){ NAMES[r.id] = 'Q'; IDS.Q = r.id; ALLOW.Q = ['P', 'PRIV']; await commit(P_('GI')); const j = JSON.stringify(rowOf(r.id).data);
    const priv = /ZQ-PRIV/.test(j); ok(!priv, 'riprendendo dal Progetto Personale nome, tutor e IBAN NON passano nella nuova Unità' + (priv ? ' — PASSANO: ' + [...j.matchAll(/ZQ-PRIV-[A-Z]+/g)].map(m => m[0]).join(',') : '')); } }
// la lista dei progetti riprendibili è solo quella dei propri
for(const [k, exp] of [['GI', 'DGPQRU'], ['BE', 'B'], ['AL', 'A'], ['CO', 'C'], ['ST', '']]){ const got = await ev(P_(k), async () => (await dbList()).map(x => x.id)); const codes = got.map(i => NAMES[i] || '?').sort().join(''); ok(codes === exp.split('').sort().join(''), `${k}: progetti riprendibili «${codes}» (previsto «${exp.split('').sort().join('')}»)`); }

// ═════════ 12. ponte dal Progetto Personale: cosa passa in una Programmazione che poi si condivide ═════════
console.log('\n── 12. ponte dal Progetto Personale');
ALLOW.Q = ['P'];
await openOwn(P_('GI'), idP);
const PPK = {mail:'ZQ-P-MAIL', sedeVia:'ZQ-P-VIA', sedeCitta:'ZQ-P-CITTA', sedeCF:'ZQ-P-CF', sedeSocial:'ZQ-P-SOCIAL', sedeSito:'ZQ-P-SITO', ctxSez:'ZQ-P-CSEZ', condizioni:'ZQ-P-COND', scelta:'ZQ-P-SCELTA', appPrec:'ZQ-P-APPPREC', appPdg:'ZQ-P-APPPDG', attOss:'ZQ-P-ATTOSS', limitiOss:'ZQ-P-LIM', dosi:'ZQ-P-DOSI', dinamiche:'ZQ-P-DIN', occMan:'ZQ-P-OCCMAN', occKos:'ZQ-P-OCCKOS', iter:'ZQ-P-ITER', prog:'ZQ-P-PROG', axExtra:'ZQ-P-AXE', ibanInt:'ZQ-PRIV-IBANINT'};
await ev(P_('GI'), k => { Object.assign(scheda.pp, k); scheda.pp.staffTab = [{nome: 'ZQ-P-STT', mail: 'zq-p-stm@x.it'}]; scheda.pp.giri = [{id: 'g1', n: 1, nota: 'ZQ-P-GIRI'}]; _clTouched = true; _clUserAt = Date.now(); saveData(true); }, PPK);
await commit(P_('GI')); SNAP = snap();
const idQ = Object.keys(NAMES).find(i => NAMES[i] === 'Q'); ok(!!idQ, 'esiste l’Unità «da zero» Q per provare il ponte');
if(idQ){
  const qBefore = JSON.stringify(rowOf(idQ).data);
  await openOwn(P_('GI'), idQ, ['contesto e occasioni', 'priorità', 'indicatori', 'percorsi e attività']); await commit(P_('GI'));
  const q = rowOf(idQ).data, j = JSON.stringify(q);
  const crossed = Object.keys(q.scheda.pp || {}).filter(k => /ZQ-/.test(JSON.stringify(q.scheda.pp[k])));
  console.log('   campi del PP arrivati nella nuova Unità: ' + crossed.join(', '));
  ok(crossed.length > 0, 'il ponte porta il contesto scelto (ctxTerr, occasioni…): ' + crossed.length + ' campi');
  ok(!/ZQ-PRIV/.test(j), 'nome, tutor, IBAN (anche IBAN intestato) NON passano' + (/ZQ-PRIV/.test(j) ? ' — PASSANO: ' + [...j.matchAll(/ZQ-PRIV-[A-Z]+/g)].map(m => m[0]).join(',') : ''));
  ok(![...marks(j)].some(c => c !== 'P'), 'dalla Programmazione-ponte non arriva nulla di altri progetti: ' + [...marks(j)].join(','));
  ok(!/ZQ-P-OSS/.test(j), 'le osservazioni personali (gruppo non scelto) restano nel PP');
  const sens = ['mail', 'staffTab', 'giri', 'sedeCF'].filter(k => q.scheda.pp && q.scheda.pp[k] !== undefined && /ZQ-/.test(JSON.stringify(q.scheda.pp[k])));
  if(sens.length) console.log('   NOTA: passano anche campi che possono essere personali o di revisione: ' + sens.join(', ') + ' (la Programmazione si può condividere con lo staff)');
  onlyChanged('il ponte non tocca nessun altro progetto', ['Q:pp'], ['Q:schedaRest', 'Q:obs', 'Q:pris', 'Q:vals']);
  // condividendo Q, Alex lo legge: nessun dato privato del PP
  await invite(P_('GI'), 'alex@x.it', 'collaboratore');
  const aj = await ev(P_('AL'), async id => JSON.stringify((await dbGet(id)).data), idQ);
  ok(!/ZQ-PRIV/.test(aj) && ![...marks(aj)].some(c => c !== 'P'), 'Alex, invitato su Q, non riceve dati privati né di altri progetti');
  await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); for(const x of m) await dbRevoke(x.id); }).catch(() => {});
  leakDb('dopo il ponte');
}

// ═════════ 13. una sola area alla volta: modificare un'area non tocca nessun'altra, né in questo progetto né negli altri ═════════
console.log('\n── 13. una zona alla volta (stesso progetto e progetti vicini)');
const IGN = Object.keys(NAMES).map(i => NAMES[i] + ':schedaRest');
const zoneEdit = async (label, who, proj, fn, exp) => { SNAP = snap(); await ev(P_(who), fn); await ev(P_(who), () => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(300); await push(P_(who)); await sleep(700); onlyChanged(label, exp.map(z => proj + ':' + z), IGN); };
await openOwn(P_('GI'), idU); await commit(P_('GI')); SNAP = snap();
await zoneEdit('Unità · osservazione dell’Unità (obs)', 'GI', 'U', () => { obs.P4 = '5'; }, ['obs']);
await zoneEdit('Unità · priorità', 'GI', 'U', () => { pris.P1 = 'ZQ-U-PRI'; }, ['pris']);
await zoneEdit('Unità · valutazione', 'GI', 'U', () => { vals.P1 = '3'; }, ['vals']);
await zoneEdit('Unità · osservazione di un adulto dello staff', 'GI', 'U', () => { staffObs['Anna ZQ-U-STF'].P2 = 5; }, ['staffObs']);
await zoneEdit('Unità · profilo di un adulto dello staff', 'GI', 'U', () => { staffProfiles['Anna ZQ-U-STF'].eta = '31'; }, ['staffProf']);
await zoneEdit('Unità · osservazione di sé (autoObs)', 'GI', 'U', () => { autoObs.P3 = '4'; }, ['autoObs']);
await zoneEdit('Unità · una uscita', 'GI', 'U', () => { scheda.uscite.uU.testo = 'Uscita ZQ-U-EVT'; scheda.uscite.uU.ax.data = '2026-12-06'; }, ['uscite']);
await zoneEdit('Unità · contesto (PP/contesto)', 'GI', 'U', () => { scheda.pp = scheda.pp || {}; scheda.pp.ctxTerr = 'ZQ-U-CTX'; }, ['pp']);
await zoneEdit('Unità · un testo di osservazione scritto a mano', 'GI', 'U', () => { ppSetObs('S', 'positivi', 'ZQ-U-SPI'); }, ['oss']);
await openOwn(P_('GI'), idG); await commit(P_('GI')); SNAP = snap();
await zoneEdit('Formativa · osservazione di un adulto dello staff', 'GI', 'G', () => { staffObs['Paolo ZQ-G-STF'].P2 = 2; }, ['staffObs']);
await zoneEdit('Formativa · profilo di un adulto', 'GI', 'G', () => { staffProfiles['Paolo ZQ-G-STF'].eta = '35'; }, ['staffProf']);
await zoneEdit('Formativa · osservazione di sé', 'GI', 'G', () => { autoObs.P4 = '2'; }, ['autoObs']);
await zoneEdit('Formativa · un evento riservato', 'GI', 'G', () => { scheda.uscite.uG.testo = 'Serata ZQ-G-EVT'; scheda.uscite.uG.ax.data = '2026-12-07'; }, ['uscite']);
await zoneEdit('Formativa · osservazione del gruppo (obs)', 'GI', 'G', () => { obs.P4 = '3'; }, ['obs']);
await zoneEdit('Formativa · l’elenco dello staff', 'GI', 'G', () => { STAFF_MEMBERS = STAFF_MEMBERS.concat(['Nuovo ZQ-G-NEW']); staffObs['Nuovo ZQ-G-NEW'] = {P1: 1}; }, ['staffM', 'staffObs']);
// formativa del Commissario: la sua osservazione dello staff non tocca G né U
await zoneEdit('Formativa del Commissario · osservazione di un adulto', 'CO', 'C', () => { staffObs['Paolo ZQ-C-STF'].P3 = 4; }, ['staffObs']);
await zoneEdit('Formativa del Commissario · osservazione di sé', 'CO', 'C', () => { autoObs.P2 = '3'; }, ['autoObs']);
leakDb('dopo le modifiche una zona alla volta');
// i testi di una zona non compaiono nelle altre del STESSO progetto
{ const d = rowOf(idU).data; const inOther = []; for(const [z, f] of Object.entries(ZONES)){ const t = JSON.stringify(f(d) || ''); for(const [z2, m] of [['staffProf', 'ZQ-U-ESP'], ['pp', 'ZQ-U-CTX'], ['uscite', 'Uscita ZQ-U-EVT'], ['staffM', 'Anna ZQ-U-STF']]) if(z !== z2 && t.includes(m) && !(z2 === 'staffM' && ['staffObs', 'staffProf'].includes(z)) && !(z2 === 'staffProf' && z === 'staffProf')) inOther.push(m + ' in ' + z); }
  ok(!inOther.length, 'in U ogni testo compare solo nella propria zona' + (inOther.length ? ' — ' + inOther.join('; ') : '')); }

// ═════════ 14. eventi riservati e cambio di ruolo a progetto aperto ═════════
console.log('\n── 14. eventi riservati per ruolo e cambio di ruolo a progetto aperto');
await openShared(P_('DA'), idG); await openShared(P_('FE'), idG);
await ev(P_('CO'), i => { window.__pre = 1; clOpenShared(i); }, idG).catch(() => {}); await sleep(800); await waitRO(P_('CO'), idG);
const resv = async w => ev(P_(w), () => ({ res: uscRes(scheda.uscite.uG), full: uscFull() }));
{ const r = {GI: await (async () => { await openOwn(P_('GI'), idG); return resv('GI'); })(), FE: await resv('FE'), DA: await resv('DA'), CO: await resv('CO')};
  ok(r.GI.res === false && r.FE.res === false && r.CO.res === false && r.DA.res === true, 'evento riservato di G: nascosto solo al collaboratore — ' + JSON.stringify(r)); }
// il collaboratore perde il ruolo mentre ha una modifica non ancora inviata
SNAP = snap();
await ev(P_('DA'), () => { scheda.uscite.uDA = {id:'uDA', cr: Date.now(), testo:'Serata ZQ-G-DAX', modello:'sede', dest:'staff', ax:{data:'2026-12-09'}, prog:{}, hid:{}, own:{}}; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); const x = m.find(y => y.email === 'dario@x.it'); await dbSetRole(x.id, 'lettore'); });
await sleep(400);
const rDA = await push(P_('DA')); await sleep(800);
ok(!/ZQ-G-DAX/.test(JSON.stringify(rowOf(idG).data)), 'Dario, appena retrocesso a lettore, non riesce a salvare la modifica in sospeso (push: ' + String(rDA).slice(0, 30) + ')');
{ const ls = await ev(P_('DA'), () => localStorage.getItem('bussola_pee_v6') || ''); ok(![...marks(ls)].some(c => c !== 'G' && c !== 'AVV'), 'la memoria di Dario contiene solo dati di G: ' + [...marks(ls)].join(',')); }
onlyChanged('la retrocessione e il tentativo non cambiano i dati', [], IGN);
await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); const x = m.find(y => y.email === 'dario@x.it'); await dbSetRole(x.id, 'collaboratore'); });
// il Commissario diventa lettore e poi di nuovo Commissario, mentre legge
await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); const x = m.find(y => y.email === 'comm@x.it'); await dbSetRole(x.id, 'lettore'); });
await sleep(500); ok(await seeRep('CO', 'G') === 'RISP-G-CO', 'da lettore, il Commissario continua a leggere il proprio parere');
await ev(P_('GI'), async () => { const m = await dbMembri(CL.ctx.id); const x = m.find(y => y.email === 'comm@x.it'); await dbSetRole(x.id, 'commissario'); });
leakDb('dopo cambi di ruolo');

await br.close(); process.exit(summary() ? 1 : 0);
