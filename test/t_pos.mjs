// Correzioni 1-3: riapertura dove si era rimasti, progetto dall'archivio da 1.1, pagina dall'alto cambiando sezione
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
// --- senza account
{ const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
  await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
  await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
  ok(await ev(() => gCur()) === '1b', 'il progetto di esempio si apre come prima dalla 1.2 (' + await ev(() => gCur()) + ')');
  await ev(() => gGo('3')); await sleep(800);
  const H = await ev(() => document.documentElement.scrollHeight);
  await ev(() => window.scrollTo(0, 1600)); await sleep(900);
  const y0 = await ev(() => window.scrollY);
  await P.reload(); await sleep(2500);
  const r = await ev(() => ({k: gCur(), y: window.scrollY}));
  ok(r.k === '3', 'ricaricando si torna alla stessa sezione (' + r.k + ')');
  ok(Math.abs(r.y - y0) < 80, 'e allo stesso punto della pagina (' + y0 + ' → ' + r.y + ', pagina ' + H + ')');
  // cambio sezione dal fondo: si apre dall'alto
  await ev(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(500);
  await P.locator('#gt-4:visible, #gm-4:visible').first().click(); await sleep(700);
  ok(await ev(() => window.scrollY) < 5, 'cambiando sezione (3 → 4) la pagina si apre dall’alto (' + await ev(() => window.scrollY) + ')');
  await ev(() => window.scrollTo(0, document.documentElement.scrollHeight)); await sleep(400);
  await P.locator('#gt-1:visible, #gm-1:visible').first().click(); await sleep(700);
  ok(await ev(() => window.scrollY) < 5, 'anche tornando alla Sezione 1 (' + await ev(() => window.scrollY) + ')');
  await ev(() => gGo('1b')); await sleep(400); await ev(() => window.scrollTo(0, 900)); await sleep(300);
  await P.locator('.gsn-step:visible', {hasText:'1.1'}).first().click().catch(async () => { await ev(() => gGo('1a')); }); await sleep(700);
  ok(await ev(() => window.scrollY) < 5, 'passi della Sezione 1 (1.2 → 1.1) dall’alto');
  ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
  await pa.ctx.close(); }
// --- con account: progetto aperto dall'archivio
{ const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
  await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
  const ex = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
  const d2 = JSON.parse(JSON.stringify(ex.data)); d2.UNIT_NAME = 'Reparto Altro';
  db.t.pee_archivi.push({id:'p2', user_id:A.id, anno:2025, titolo:'Reparto Altro 2025', data:d2, meta:{mode:'giovani', fascia:'E'}, updated_at:new Date().toISOString()});
  await ev(() => { gGo('2'); }); await sleep(600);
  await ev(() => clOpenProject('p2')); await sleep(3500);
  const r = await ev(() => ({id: CL.ctx && CL.ctx.id, k: gCur(), y: window.scrollY}));
  ok(r.id === 'p2' && r.k === '1a' && r.y < 5, 'aperto dall’archivio (con osservazione già fatta) parte dalla 1.1, in alto ' + JSON.stringify(r));
  await ev(() => gGo('4')); await sleep(1200);
  await ev(id => clOpenProject(id), ex.id); await sleep(3500);
  const r2 = await ev(() => ({id: CL.ctx && CL.ctx.id, k: gCur()}));
  ok(r2.id === ex.id && r2.k === '2', 'riaprendo l’altro progetto si torna dove lo si era lasciato ' + JSON.stringify(r2));
  await ev(() => clOpenProject('p2')); await sleep(3500);
  ok(await ev(() => gCur()) === '4', 'e ognuno ricorda il suo punto (p2 → Sezione 4)');
  ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
  await pa.ctx.close(); }
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
