import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
// Il colore dell'interfaccia e della barra in alto viene dal PROFILO: E verde, L giallo, R rosso; Capo Gruppo, Commissario e chi non indica la Branca: blu.
// Mai verde, tranne per la Branca E (e prima del profilo, al primo accesso).
const cols = {E:'rgb(37, 115, 78)', L:'rgb(240, 230, 3)', R:'rgb(196, 35, 31)', S:'rgb(29, 79, 143)'};
async function run(label, prof, exp){
  const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:800}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
  const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
  db.t.pee_profili.push(Object.assign({user_id:u.id, nome:'Anna Verdi', sezione:'Pesaro', gruppo:'1', dashboard:{}}, prof));
  const mk = (id, B) => ({id, user_id:u.id, anno:2026, titolo:'P' + id, meta:{mode:'giovani', fascia:B, tipo:'AN', nome:'U'}, data:{v:1, MODE:'giovani', FASCIA:B, UNIT_NAME:'U', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
  db.t.pee_archivi.push(mk('pL', 'L'), mk('pE', 'E'));   // due progetti di Branche diverse: il colore non cambia
  await loginAs(P, base, u); await sleep(1500);
  const th = () => ev(() => document.body.getAttribute('data-theme'));
  const bg = () => ev(() => { const h = [...document.querySelectorAll('.sh-top, #hdr')].find(e => e.getBoundingClientRect().height > 0); return h ? getComputedStyle(h).backgroundColor : null; });
  ok(await th() === exp && await bg() === cols[exp], label + ': elenco progetti, tema ' + exp + ' (' + await bg() + ')');
  await ev(() => shOpen('pL', 0)); await sleep(3000);
  ok(await th() === exp && await bg() === cols[exp], label + ': progetto Branco, stesso colore');
  await ev(() => shOpen('pE', 0)).catch(() => {}); await sleep(3000);
  ok(await th() === exp && await bg() === cols[exp], label + ': progetto Reparto, stesso colore');
  await ev(() => shProfileOpen()); await sleep(700);
  ok(await th() === exp && await bg() === cols[exp], label + ': pagina del profilo, stesso colore');
  ok(!pa.errors.length, label + ': nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
  await P.context().close();
}
await run('Capo Unità Branca E', {ruolo:'cu', branca:'E'}, 'E');
await run('Capo Unità Branca L', {ruolo:'cu', branca:'L'}, 'L');
await run('Capo Unità Branca R', {ruolo:'cu', branca:'R'}, 'R');
await run('Capo Gruppo', {ruolo:'cg'}, 'S');
await run('Commissario di Sezione', {ruolo:'cds', gruppo:null}, 'S');
await run('Adulto in formazione senza Branca', {ruolo:'volontario'}, 'S');
await run('Adulto in formazione con Branca L', {ruolo:'volontario', branca:'L'}, 'L');
// cambio di Branca dal profilo: la barra cambia subito
{
  const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:800}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
  const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
  db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
  await loginAs(P, base, u); await sleep(1500);
  ok(await ev(() => document.body.getAttribute('data-theme')) === 'E', 'cambio Branca: parte da E');
  await ev(() => shProfileOpen()); await sleep(700);
  await P.check('input[name="sh-branca"][value="R"]', {force:true}); await P.click('#sh-psave'); await sleep(1800);
  ok(await ev(() => document.body.getAttribute('data-theme')) === 'R', 'cambio Branca: dopo il salvataggio la barra diventa rossa, non resta verde');
}
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
