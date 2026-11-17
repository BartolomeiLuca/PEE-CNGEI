// Osservazione a più voci: spegnere e riaccendere non cancella ciò che hai scritto da solo (17/11)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_archivi.push({id:'pe', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}}}, created_at:'2026-10-21T10:00:00Z', updated_at:'2026-10-21T10:00:00Z'});
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, u); await sleep(1200); P.evaluate(() => shOpen('pe', 0)).catch(() => {}); await sleep(3500);
const g = () => ev(() => ({P1: obs.P1, C1: obs.C1, S1: obs.S1, vP1: ((scheda.mv.by || {})['anna@x.it'] || {v:{}}).v.P1, vC1: ((scheda.mv.by || {})['anna@x.it'] || {v:{}}).v.C1, vS1: ((scheda.mv.by || {})['anna@x.it'] || {v:{}}).v.S1, dP1: ((scheda.mv.dec || {}).P1 || {}).v, on: !!scheda.mv.on}));
await ev(() => { setObs('P1', 3); setObs('C1', 4); setObs('S1', 6); mvM(); mvSetMode(true); scheda.mv.by['carla@x.it'] = {nome:'Carla', v:{P1:7, C1:4, S1:6}, note:{}, at:{}}; mvRecompute(); });
let s = await g(); ok(s.on && s.P1 === 5 && s.vP1 === 3, 'voci attive: la mia 3 e quella di Carla 7 danno 5 (' + JSON.stringify(s) + ')');
// spento e riacceso senza toccare nulla: la mia voce non cambia
await ev(() => { mvSetMode(false); mvSetMode(true); }); s = await g();
ok(s.vP1 === 3 && s.P1 === 5, 'spento e riacceso senza modifiche: la mia voce resta 3, il valore finale 5 (' + JSON.stringify(s) + ')');
// spento, cambio due valori, riacceso
await ev(() => { mvSetMode(false); setObs('P1', 9); setObs('C1', 'n'); mvSetMode(true); }); s = await g();
ok(s.vP1 === 9 && s.vC1 === 'n' && s.vS1 === 6, 'i valori scritti da spento diventano la mia voce, gli altri non cambiano (' + JSON.stringify(s) + ')');
ok(s.P1 === 8, 'valore finale: media tra la mia voce 9 e quella di Carla 7 = 8 (' + s.P1 + ')');
// con una decisione già presa
await ev(() => { mvDecide('S1', 4, 'Scelgo 4 perché sì, cosi vediamo'); }); s = await g(); ok(s.dP1 === undefined && s.S1 === 4, 'decisione presa su S1: valore 4');
await ev(() => { mvSetMode(false); setObs('S1', 10); mvSetMode(true); }); s = await g();
ok(s.vS1 === 10 && s.S1 === 8, 'valore cambiato da spento al posto di una decisione: la mia voce è 10 e la vecchia decisione non lo sovrascrive (S1 = ' + s.S1 + ')');
ok(await ev(() => scheda.mv.log.some(x => x.pid === 'S1' && /spenta/.test(x.why))), 'la sostituzione della decisione è registrata nel diario');
await br.close(); summary(); process.exit(0);
