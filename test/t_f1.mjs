// F1: con un solo Progetto Personale d'esempio, aprire la Programmazione non chiede «Cosa porto?»
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
const row = (id, anno, titolo, tipo, data, ts) => ({id, user_id:u.id, anno, titolo, meta:{mode:'giovani', fascia:'E', tipo, nome:'Reparto Kontiki'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Kontiki'}, data), created_at:ts, updated_at:ts});
db.t.pee_archivi.push(row('ppx', 2026, 'Esempio · Progetto Personale 2026-27', 'PP', {scheda:{tipoProgetto:'PP', annoScout:'2026-27', esempio:true, pp:{nome:'Anna', ctxTerr:'Quartiere di esempio', ctxSez:'Sezione di esempio'}}}, '2026-10-20T10:00:00Z'));
db.t.pee_archivi.push(row('pe', 2026, 'Programmazione Annuale 2026-27 · Reparto Kontiki', 'AN', {scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}}}, '2026-10-21T10:00:00Z'));
await loginAs(P, base, u); await sleep(1200);
P.evaluate(() => shOpen('pe', 0)).catch(() => {}); await sleep(3500);
const asked = await ev(() => !!document.querySelector('#g-modal.show .ppb-ask'));
ok(!asked, 'solo un Progetto Personale d’esempio: nessuna domanda «Cosa porto dal Progetto Personale?»');
const d = db.t.pee_archivi.find(r => r.id === 'pe').data;
ok(!((d.scheda || {}).ppImp) && !((d.scheda || {}).pp || {}).ctxTerr, 'nulla di esempio è stato copiato nel progetto vero: ' + JSON.stringify(((d.scheda||{}).pp)||{}));
// con un Progetto Personale vero dello stesso anno la domanda compare (altro utente, partenza pulita)
const db2 = new FakeDB(); const pb = await person(br, db2, {ctx:{viewport:{width:1280, height:900}}}); const P2 = pb.page;
const u2 = db2.addUser('bea@x.it', 'password123', 'Bea Neri');
db2.t.pee_profili.push({user_id:u2.id, nome:'Bea Neri', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const row2 = (id, anno, titolo, tipo, data, ts) => ({id, user_id:u2.id, anno, titolo, meta:{mode:'giovani', fascia:'E', tipo, nome:'Reparto Kontiki'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Kontiki'}, data), created_at:ts, updated_at:ts});
db2.t.pee_archivi.push(row2('ppv', 2026, 'Progetto Personale 2026-27', 'PP', {obs:{P1:7, C2:5}, scheda:{tipoProgetto:'PP', annoScout:'2026-27', pp:{nome:'Bea', tutor:'Mario', sezione:'Pesaro', gruppo:'1', ctxTerr:'Quartiere con parco e bus', ctxSez:'Sezione di 4 gruppi', condizioni:'Osservato a settembre'}}}, '2026-10-20T10:00:00Z'));
db2.t.pee_archivi.push(row2('pe', 2026, 'Programmazione Annuale 2026-27 · Reparto Kontiki', 'AN', {scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}}}, '2026-10-21T10:00:00Z'));
await loginAs(P2, base, u2); await sleep(1200);
P2.evaluate(() => shOpen('pe', 0)).catch(() => {}); await sleep(3500);
ok(await P2.evaluate(() => !!document.querySelector('#g-modal.show .ppb-ask')), 'con un Progetto Personale vero la domanda compare');
await br.close(); summary(); process.exit(0);
