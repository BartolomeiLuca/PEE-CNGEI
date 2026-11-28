// 27/11 sera: Verbali delle riunioni degli adulti (staff di Unità → Comitato di Sezione).
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const _arg = process.argv[2] || 'chromium'; const _prof = PROFILES[_arg];
const engine = _prof ? _prof[0] : _arg; const DEV = Object.assign({}, _prof ? _prof[1] : {}); delete DEV.defaultBrowserType; if(engine === 'firefox') delete DEV.isMobile;
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof2 = (k, nome, ruolo, o) => { o = o || {}; U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:['cu', 'senior'].includes(ruolo) ? 'E' : '', sezione:o.sez || 'Pesaro', gruppo:o.gr === undefined ? (['cg', 'vcg', 'cu', 'senior'].includes(ruolo) ? 'Pesaro 1' : '') : o.gr, area_rcdf:'altoadriatico', dashboard:o.dash || {}}); };
prof2('cu', 'Ugo CU', 'cu'); prof2('cu2', 'Ugo Due', 'cu', {gr:'Pesaro 2'}); prof2('cg', 'Carla CG', 'cg'); prof2('cds', 'Dino Commissario', 'cds'); prof2('pres', 'Piero Presidente', 'pres');
prof2('snr', 'Sara Senior', 'snr'); prof2('altro', 'Olga Altrove', 'cds', {sez:'Fano'}); prof2('vol', 'Vera Volontaria', 'volontario', {dash:{cos:{membro:true}}});
const mk = async (k, w) => { const pa = await person(br, db, {ctx:Object.assign({}, DEV, {viewport:(w || !DEV.viewport) ? {width:w || 1280, height:900} : DEV.viewport, acceptDownloads:true})}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2200); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const errs = [];
db.sqlVerb = true;
const A = await mk('cu'); A.P.on('pageerror', e => errs.push(e.message));
await sleep(1200);
const over = () => A.ev(() => {
  const els = [...document.querySelectorAll('input:not([type=hidden]),select,textarea,button,label,h1,h2,h3,.pn-row,.pn-card')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== 'hidden' && cs.display !== 'none'; });
  const bad = [];
  for(let i = 0; i < els.length; i++) for(let j = i + 1; j < els.length; j++){
    const a = els[i], b = els[j]; if(a.contains(b) || b.contains(a)) continue;
    if(a.tagName === 'LABEL' && a.control === b || b.tagName === 'LABEL' && b.control === a) continue;
    const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
    const w = Math.min(x.right, y.right) - Math.max(x.left, y.left), h = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
    if(w > 3 && h > 3) bad.push((a.id || a.className || a.tagName) + ' ⟷ ' + (b.id || b.className || b.tagName) + ' [' + Math.round(w) + 'x' + Math.round(h) + ']');
  }
  const wide = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  return {bad: bad.slice(0, 8), wide, vw: innerWidth};
});
const rep = async (nome) => { const r = await over(); console.log(nome, JSON.stringify(r)); ok(r.bad.length === 0 && r.wide <= 1, nome + ' · nessuna sovrapposizione né scroll orizzontale'); };
await A.ev(() => verbOpen()); await sleep(1200); await rep('elenco vuoto');
await A.ev(() => verbNuovo()); await sleep(500); await rep('editor');
await A.ev(() => { verbAzAdd(); verbAzAdd(); verbAzAdd(); verbSet('partecipanti', 'Ugo, Ugo Due, Carla Capogruppo, Dino Commissario, Piero Presidente, Sara Senior, Olga, Vera'); verbSet('odg', 'Uno\nDue\nTre\nQuattro'); verbSet('luogo', 'Sede del Gruppo in via Molto Lunga 123, Pesaro, primo piano'); verbAz(0,'testo','Preparare la lista del materiale per il campo estivo e verificare le disponibilità'); verbAz(0,'chi','Ugo Due'); }); await sleep(400);
await A.ev(() => window.scrollTo(0, 0)); await rep('editor con azioni');
await A.ev(() => { verbSet('titolo', 'Staff di giugno'); verbSet('data', '2026-12-05'); verbSet('sintesi', 'Si è parlato del campo.'); verbSet('decisioni', 'Si va a luglio.'); verbSet('stato', 'condiviso', true); });
await A.ev(() => { window.confirm = () => true; }); await A.P.click('#vb-salva'); await sleep(1500); await rep('dopo salvataggio');
await A.ev(() => { const l = SH._verb.rows[0]; if(l) verbApri(l.id); }); await sleep(600); await rep('lettura');
ok(errs.length === 0, 'nessun errore · ' + errs.join(' | '));
await br.close(); process.exit(summary() ? 1 : 0);
