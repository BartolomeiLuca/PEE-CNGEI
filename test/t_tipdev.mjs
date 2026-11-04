// «L'anno di solito» su 12 profili di dispositivo: niente scorrimento laterale della pagina, griglia o schede visibili, popup apribile
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import { devices } from 'playwright';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const P = [['iPhone 13','webkit'],['iPhone SE','webkit'],['iPad (gen 7)','webkit'],['iPad (gen 7) landscape','webkit'],['Desktop Safari','webkit'],['Desktop Firefox','firefox'],['Pixel 5','chromium'],['Galaxy S9+','chromium'],['Galaxy Tab S4','chromium'],['Desktop Chrome','chromium'],['Desktop Edge','chromium'],['Galaxy S8','chromium']];
const only = process.argv[2];
for (const [n, eng] of P) { if (only && eng !== only) continue;
  const br = await launch(eng); const db = new FakeDB(); db.sql13 = true; const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
  db.t.pee_profili.push({user_id:ua.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1'});
  const d = devices[n] || {viewport:{width:1280, height:800}}; const {defaultBrowserType, ...ctx} = d;
  const p = await person(br, db, {ctx}); const A = p.page; const errs = []; A.on('pageerror', e => errs.push(String(e).slice(0,150)));
  await loginAs(A, base, ua); await sleep(1500); await A.evaluate(() => shTip()); await sleep(400);
  for (const k of ['G','L','E','R']) { await A.evaluate(k => tipSet(k), k); await sleep(150); }
  const r = await A.evaluate(() => ({ow: document.documentElement.scrollWidth <= innerWidth + 2, vis: [...document.querySelectorAll('.tg-sc,.tg-mob')].some(e => getComputedStyle(e).display !== 'none')}));
  await A.evaluate(() => document.querySelector('.tgi').click()); await sleep(250);
  const pop = await A.evaluate(() => /Fonte: Documentazione formativa CNGEI/.test(document.body.innerText));
  ok(r.ow && r.vis && pop && !errs.length, n + ' ' + JSON.stringify(r) + ' popup=' + pop + ' ' + errs.join('|'));
  await br.close();
}
summary(); process.exit(0);
