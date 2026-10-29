import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => shGrp('Osservare')); await sleep(200);
ok(await ev(() => [...document.querySelectorAll('#sh-side .sh-si')].some(b => b.textContent.trim() === 'Il mio staff')), 'menu: «Il mio staff» presente');
ok(await ev(() => { const g = [...document.querySelectorAll('#sh-side .sh-sg, #sh-side .sh-si')].map(e => e.textContent.trim()); const i = g.indexOf('Osservare'); return i >= 0 && g.slice(i, i + 4).includes('Il mio staff'); }), '«Il mio staff» sta sotto «Osservare»');
await ev(() => shStaffPage()); await sleep(1500);
let s = await ev(() => ({open: document.getElementById('sh-disc-staffobs').open, txt: document.getElementById('panel-pp').textContent, on: [...document.querySelectorAll('#sh-side .sh-si.on')].map(x => x.textContent.trim())}));
ok(s.open && /Perché osservare anche gli adulti/.test(s.txt) && /Attenzione ai dati personali/.test(s.txt), 'disclaimer aperti la prima volta, con i quattro testi');
ok(/Lettura d’insieme/.test(s.txt) && /Non hai ancora aperto/.test(s.txt), 'lettura d’insieme in sola lettura (staff non ancora aperto)');
ok(s.on.includes('Il mio staff'), 'voce evidenziata nel menu');
await sleep(1200);
const vis = db.t.pee_profili[0].dashboard && db.t.pee_profili[0].dashboard.visti;
ok(vis && vis.staffobs === 1, 'stato «già visto» salvato nel profilo');
await P.click('#sh-disc-staffobs summary'); await sleep(200);
ok(!(await ev(() => document.getElementById('sh-disc-staffobs').open)), 'richiudibile');
// ricarico: ora parte chiuso
await P.reload(); await sleep(3500); await ev(() => shStaffPage()); await sleep(1200);
ok(!(await ev(() => document.getElementById('sh-disc-staffobs').open)), 'la seconda volta il disclaimer parte chiuso');
// apro lo staff collegato
await ev(() => shStaffOpen()); await sleep(5000);
s = await ev(() => ({m: MODE, sd: scheda.staffDi, v: scheda.veste, un: UNIT_NAME, th: document.body.getAttribute('data-theme'), side: [...document.querySelectorAll('#sh-side .sh-si')].map(x => x.textContent.trim())}));
ok(s.m === 'staff' && s.sd === 'c1' && s.v.branca === 'E', 'creato lo staff collegato all’Unità (' + JSON.stringify([s.m, s.sd, s.v, s.un]) + ')');
ok(s.side.some(x => /Programmazione di Unità/.test(x)), 'menu staff: «← Programmazione di Unità»');
ok(db.t.pee_archivi.length === 2, 'un solo progetto in più');
// disclaimer nella fase 1 dello staff
await ev(() => goPhase(1)); await sleep(1200);
ok(await ev(() => !!document.querySelector('#percorsi-root .sh-disc')), 'disclaimer all’inizio della pagina di osservazione dello staff');
// lista: lo staff sta sotto la stessa veste
await ev(() => shGoHome()); await sleep(1500);
s = await ev(() => ({vg: [...document.querySelectorAll('.sh-vg .sh-vh h2')].map(h => h.textContent), txt: document.querySelector('.sh-vg').textContent}));
ok(s.vg.length === 1 && /Adulti dello staff/.test(s.txt), 'in elenco: stessa veste, etichetta «Adulti dello staff»');
// secondo clic: non ne crea un altro
process.exit(summary() ? 1 : 0);
