import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const row = (id, anno, titolo, tipo, data, ts) => ({id, user_id:u.id, anno, titolo, meta:{mode:'giovani', fascia:'E', tipo, nome:'Reparto Kontiki'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Kontiki'}, data), created_at:ts, updated_at:ts});
// PP 2026 con contenuto; PE 2026 vuota; PE 2025 con contesto, sede, staff e verifiche
db.t.pee_archivi.push(row('pp', 2026, 'Progetto Personale 2026-27', 'PP', {obs:{P1:7, C2:5}, scheda:{tipoProgetto:'PP', annoScout:'2026-27', pp:{nome:'Anna', tutor:'Mario', sezione:'Pesaro', gruppo:'1', ctxTerr:'Quartiere con parco e bus', ctxSez:'Sezione di 4 gruppi', condizioni:'Osservato a settembre'}, osservazione:{P:{positivi:'Sanno collaborare', necessita:'', singoli:''}, C:{positivi:'', necessita:'', singoli:''}, S:{positivi:'', necessita:'', singoli:''}}}}, '2026-10-20T10:00:00Z'));
db.t.pee_archivi.push(row('pe', 2026, 'Programmazione Annuale 2026-27 · Reparto Kontiki', 'AN', {scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}}}, '2026-10-21T10:00:00Z'));
db.t.pee_archivi.push(row('pe25', 2025, 'Programmazione Annuale 2025-26 · Reparto Kontiki', 'AN', {scheda:{tipoProgetto:'AN', annoScout:'2025-26', pp:{sezione:'Pesaro', gruppo:'1', ctxTerr:'Territorio dell’anno scorso', sedeVia:'Via Roma 1', sedeCitta:'Pesaro', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}]}, valCompl:{P1:'Obiettivo raggiunto in buona parte'}, percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[{testo:'Gioco notturno', vBene:'Molto coinvolgente', vMigl:'Più tempo per la rielaborazione'}]}]}}, '2025-10-20T10:00:00Z'));
await loginAs(P, base, u); await sleep(1200);
const get = id => db.t.pee_archivi.find(r => r.id === id).data;
// 1 · apro la Programmazione 2026: le sezioni comuni arrivano dal PP
await ev(() => shOpen('pe', 0)); await sleep(4500);
let d = get('pe');
ok(d.scheda.pp.ctxTerr === 'Quartiere con parco e bus' && d.scheda.pp.ctxSez === 'Sezione di 4 gruppi' && d.scheda.pp.condizioni === 'Osservato a settembre', 'PP → Programmazione: contesto e condizioni arrivano da soli');
ok(d.obs && d.obs.P1 === 7 && d.obs.C2 === 5 && d.scheda.osservazione.P.positivi === 'Sanno collaborare', 'PP → Programmazione: osservazione dei percorsi e valori');
ok(!d.scheda.pp.tutor && d.scheda.pp.nome !== 'Anna', 'dati propri del PP (nome, tutor) non passano');
ok(await ev(() => scheda.pp.ctxTerr === 'Quartiere con parco e bus' && obs.P1 === 7), 'nell’app aperta i dati ci sono');
ok(db.t.pee_versioni.length === 0, 'progetto nuovo: nessuna copia di sicurezza inutile');
// 2 · la modifico: non viene più sovrascritta; il PP cambia
await ev(() => shGoHome()); await sleep(800);
{ const pe = db.t.pee_archivi.find(r => r.id === 'pe'); pe.data.scheda.pp.ctxTerr = 'Scritto nella Programmazione'; pe.data.scheda.pp.ctxSez = ''; pe.updated_at = '2026-10-22T10:00:00Z'; }   // come se il lavoro fosse stato salvato dall’app
db.t.pee_archivi.find(r => r.id === 'pp').data.scheda.pp.ctxTerr = 'Nuovo testo nel PP';
db.t.pee_archivi.find(r => r.id === 'pp').data.scheda.pp.ctxSez = 'Sezione cambiata';
db.t.pee_archivi.find(r => r.id === 'pp').data.scheda.pp.condizioni = 'Osservato a settembre e ottobre';
db.t.pee_archivi.find(r => r.id === 'pp').updated_at = '2026-10-25T10:00:00Z';
await ev(() => shOpen('pp', 0)); await sleep(3500); await ev(() => shGoHome()); await sleep(800);
await ev(() => shOpen('pe', 0)); await sleep(4500);
d = get('pe');
ok(d.scheda.pp.ctxTerr === 'Scritto nella Programmazione', 'se hai modificato, la tua versione resta');
ok(!d.scheda.pp.ctxSez, 'se hai svuotato, resta vuoto');
ok(d.scheda.pp.condizioni === 'Osservato a settembre e ottobre', 'se non l’hai toccato, arriva l’aggiornamento del PP');
// 3 · dall'anno scorso
await ev(() => shSub('1a', '', 'ctx')); await sleep(2500);
ok(await ev(() => !!document.getElementById('sh-prev') && /Riprendi dall’anno scorso/.test(document.getElementById('sh-prev').textContent)), 'Il mio contesto: barra «Riprendi dall’anno scorso»');
await ev(() => shPrev()); await sleep(1500);
let s = await ev(() => ({t: document.getElementById('g-modal') ? document.getElementById('g-modal').textContent : '', n: document.querySelectorAll('.sh-pvc').length, chk: [...document.querySelectorAll('.sh-pvc')].map(i => i.value + ':' + i.checked).join(',')}));
ok(s.n === 3 && /ctx:false/.test(s.chk) && /sede:true/.test(s.chk) && /staff:true/.test(s.chk), 'voci: sede e staff spuntate, contesto no (hai già scritto) ' + s.chk);
ok(/Appunti dalla programmazione precedente/.test(s.t) && /Gioco notturno/.test(s.t) && /Molto coinvolgente/.test(s.t) && /Obiettivo raggiunto in buona parte/.test(s.t), 'appunti di verifica dell’anno scorso');
await ev(() => shPrevApply()); await sleep(1200);
ok(await ev(() => scheda.pp.sedeVia === 'Via Roma 1' && scheda.pp.staffTab && scheda.pp.staffTab[0].nome === 'Anna Verdi' && scheda.pp.ctxTerr === 'Scritto nella Programmazione'), 'riprese sede e staff, il contesto già scritto non cambia');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
