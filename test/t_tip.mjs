// «L'anno di solito»: griglia uniforme, intestazioni bloccate, popup, mobile
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:ua.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1'});
for (const [w, h] of [[1400, 900], [390, 800]]) {
  const p = await person(br, db, {ctx:{viewport:{width:w, height:h}}}); const A = p.page, ea = (f, x) => A.evaluate(f, x);
  const errs = []; A.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await loginAs(A, base, ua); await sleep(1500);
  await ea(() => shTip()); await sleep(500);
  const tag = w + 'px ';
  for (const k of ['G', 'L', 'E', 'R']) {
    await ea(k => tipSet(k), k); await sleep(200);
    const r = await ea(() => ({ rows: document.querySelectorAll('.tg-t tbody tr').length, th: document.querySelectorAll('.tg-t thead th').length, btn: document.querySelectorAll('.tgi').length, ccpe: /CCPE|Campo scuola|Campo Scuola/i.test(document.querySelector('.tg-t').innerText) }));
    ok(r.rows >= 8 && r.th === 13 && r.btn > 40, tag + k + ' griglia: ' + JSON.stringify(r));
    ok(!r.ccpe, tag + k + ' senza CCPE / campo scuola adulti');
  }
  await ea(() => tipSet('E')); await sleep(200);
  if (w > 760) {
    const st = await ea(() => { const sc = document.querySelector('.tg-sc'); sc.scrollTop = 200; sc.scrollLeft = 300; const th = document.querySelector('.tg-t thead th:nth-child(3)').getBoundingClientRect(), f = document.querySelector('.tg-t tbody th').getBoundingClientRect(), s = sc.getBoundingClientRect(); return { top: Math.abs(th.top - s.top) < 3, left: Math.abs(f.left - s.left) < 3, ov: sc.scrollHeight > sc.clientHeight }; });
    ok(st.top && st.left, tag + 'riga e colonna intestazioni bloccate ' + JSON.stringify(st));
    await ea(() => document.querySelector('.tgi[onclick*="link1"]').click()); await sleep(300);
    const m = await ea(() => document.body.innerText);
    ok(/Da cui parte/.test(m) && /Approfondimenti/.test(m) && /Documentazione formativa CNGEI/.test(m), tag + 'popup con da cui parte, approfondimenti, fonte');
    ok(await ea(() => !!document.querySelector('[onclick*="tipPop(\'pass\')"]')), tag + 'link al popup Passaggi');
    await ea(() => modalClose()); await sleep(200);
    const staff = await ea(() => [...document.querySelectorAll('.tg-t tbody tr')].find(r => /^Staff/.test(r.querySelector('th').innerText)).innerText);
    ok(/CR|Akela/.test(staff), tag + 'riga Staff con impegni di passaggio');
  } else {
    ok(await ea(() => getComputedStyle(document.querySelector('.tg-mob')).display === 'block' && getComputedStyle(document.querySelector('.tg-sc')).display === 'none'), tag + 'mobile: schede per mese');
    ok(await ea(() => document.documentElement.scrollWidth <= innerWidth + 2), tag + 'mobile: nessuno scorrimento orizzontale');
  }
  ok(errs.length === 0, tag + 'nessun errore JS ' + errs.join('|'));
  await p.ctx?.close?.();
}
summary(); await br.close();
