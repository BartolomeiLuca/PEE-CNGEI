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
db.sqlVerb = true; db.sqlCal = true; db.sqlPres = true;
for(const k of ['cu','cds']){
  db.log.length = 0;
  const t0 = Date.now(); const A = await mk(k); await sleep(2500);
  const c = {}; db.log.forEach(x => { c[x] = (c[x] || 0) + 1; });
  console.log('=== ' + k + ' · ' + db.log.length + ' richieste');
  Object.entries(c).sort((a, b) => b[1] - a[1]).forEach(([x, n]) => console.log('  ' + n + '× ' + x));
  await A.pa.ctx.close();
}
await br.close(); process.exit(0);
