import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => shSub('1a', '', 'occ')); await sleep(1000);
let s = await ev(() => { const m = document.getElementById('mv-mode'); return {in: !!m && !!m.closest('#val-root .profile-card'), vis: !!m && m.offsetParent !== null, txt: m ? m.textContent : '', inPerc: !!document.querySelector('#percorsi-root #mv-mode')}; });
ok(s.in && s.vis, '«Come osservo»: l’interruttore c’è e si vede (anche senza persone invitate)');
ok(/Osservazione individuale/.test(s.txt) && /Osservazione condivisa/.test(s.txt) && !/Osservo da solo/.test(s.txt), 'etichette: «Osservazione individuale» / «Osservazione condivisa»');
const amb = async (a) => { await ev(a2 => shSub('1b', a2), a); await sleep(700); return ev(() => { const cards = [...document.querySelectorAll('#percorsi-root .pc')].filter(c => c.offsetParent !== null); return {n: cards.length, ids: [...new Set(cards.map(c => c.id.replace('card-', '')[0]))], mv: !!document.querySelector('#percorsi-root #mv-mode')}; }); };
for (const a of ['P', 'C', 'S']) { s = await amb(a); ok(s.n === 8 && s.ids.length === 1 && s.ids[0] === a && !s.mv, 'individuale · Sviluppo ' + a + ': 8 comportamenti, tutti dell’Ambito giusto, nessun interruttore dentro (' + JSON.stringify(s) + ')'); }
await ev(() => shSub('1a', '', 'occ')); await sleep(500);
await ev(() => { window.confirm = () => true; scheda.pp.prog = 'cond'; mvSetMode(true); }); await sleep(1200);
ok(await ev(() => mvOn()), 'osservazione condivisa attiva');
for (const a of ['P', 'C', 'S']) { s = await amb(a); ok(s.n === 8 && s.ids.length === 1 && s.ids[0] === a && !s.mv, 'condivisa · Sviluppo ' + a + ': 8 comportamenti nell’Ambito giusto (' + JSON.stringify(s) + ')'); }
// il valore si può dare in condivisa
await ev(() => shSub('1b', 'P')); await sleep(600);
await ev(() => { const sel = document.getElementById('sel-P1'); sel.value = '6'; sel.dispatchEvent(new Event('change', {bubbles: true})); }); await sleep(500);
ok(await ev(() => mvMineAns('P1') === 6), 'condivisa: il tuo valore si dà e si salva');
// interruttore sempre disponibile
await ev(() => shSub('1a', '', 'occ')); await sleep(500);
await P.click('#mv-mode .mv-opt >> nth=0'); await sleep(1000);
ok(await ev(() => !mvOn() && !!document.getElementById('mv-mode')), 'passando a «individuale» l’interruttore resta (la condivisa si può riattivare da qui)');
ok(await ev(() => scheda.mv.by[mvMe()].v.P1 === 6), 'i valori della condivisa restano conservati');
await P.click('#mv-mode .mv-opt >> nth=1'); await sleep(1000);
ok(await ev(() => mvOn() && mvMineAns('P1') === 6), 'tornando a «condivisa» ritrovo il mio valore');
// confronto
await ev(() => { scheda.griglia = {P1: {x: {pos: 'Collaborano nel gioco', mig: 'Poco ascolto', note: 'Marco in difficoltà'}}}; mvNote('P1', 'Nota mia'); saveData(true); });
await ev(() => shSub('1s', '')); await sleep(1200);
s = await ev(() => ({t: document.getElementById('panel-pp').textContent}));
ok(/Sintesi dello staff per questo percorso/.test(s.t) && /Precompila dalla griglia/.test(s.t) && /Porta le sintesi nella Lettura del gruppo/.test(s.t), 'Confronto e sintesi: testi e pulsanti chiariti');
ok(/Nota mia/.test(s.t), 'Confronto: la nota personale compare');
await ev(() => { window._cf.sel = 'P1'; confRender(); }); await sleep(400);
await ev(() => cfFromGrid('P1')); await sleep(400);
ok(await ev(() => (scheda.mv.sint.P1.pos || '').includes('Collaborano') && (scheda.mv.sint.P1.mig || '').includes('Poco ascolto')), '«Precompila dalla griglia»: i testi vanno nella sintesi del percorso');
await ev(() => cfToLettura('P')); await sleep(400);
ok(await ev(() => (scheda.osservazione.P.positivi || '').includes('Collaborano')), '«Porta le sintesi nella Lettura del gruppo»: in coda alla Sezione 1.3');
// spunti → focus
await ev(() => { scheda.griglia = {P1: {'k:x': {}}}; });
process.exit(summary() ? 1 : 0);
