import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
db.t.pee_archivi.push({id:'pp1', user_id:u.id, anno:2026, titolo:'PP 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{P1:4, C2:3, S3:5}, scheda:{tipoProgetto:'PP', annoScout:'2026-27'}}, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-10-01T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('pp1', 0)); await sleep(3500);
const st = () => ev(() => ({own: document.getElementById('panel-pp').classList.contains('active'), act:[1,2,3,4].filter(i => document.getElementById('panel'+i).classList.contains('active')), on:(document.querySelector('#sh-side .sh-si.on')||{}).textContent||'', txt:document.getElementById('main-app').innerText.slice(0,3000), isPP:isPP()}));
let s = await st();
ok(s.isPP && s.own && /A che punto sei/.test(s.on), 'PP: si apre su «A che punto sei»');
for (const [n, re, onre] of [['1', /Osservazione|Contesto/, /^1 · Osservazione/], ['2', /Obiettivi/, /^2 · Obiettivi/], ['3', /Percorso Educativo/, /^3 · Percorso/], ['4', /Verifica/, /^4 · Verifica/], ['5', /Valutazione/, /^5 · Valutazione/]]) {
  await P.click('#sh-side .sh-si:has-text("' + n + ' · ")'); await sleep(500); s = await st();
  ok(!s.own && !/In costruzione/.test(s.txt) && re.test(s.txt) && onre.test(s.on.trim()), 'PP: la Sezione ' + n[0] + ' mostra il contenuto vero e la voce di menu è attiva (' + s.on.trim().slice(0, 30) + ')');
}
await P.click('#sh-side .sh-si:has-text("Checklist dei criteri")'); await sleep(500); s = await st();
ok(!s.own && !/In costruzione/.test(s.txt) && /Checklist/.test(s.on), 'PP: Checklist dei criteri = la checklist vera');
await P.click('#sh-side .sh-si:has-text("Invii del Progetto")'); await sleep(400); s = await st();
ok(s.own, 'PP: Invii resta nella pagina del guscio');
await P.click('#sh-side .sh-si:has-text("1 · ")'); await sleep(500);
await ev(() => gGo('1b')); await sleep(500); s = await st();
ok(!s.own && /^1 · Osservazione/.test(s.on.trim()), 'PP: passando a 1.2 con i pulsanti dell’app si resta nella Sezione 1');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
