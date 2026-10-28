import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:+(process.env.VW || 1280), height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, aid, d) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:'', tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:'', tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0], tempistica:''}], pp:{},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', 'm0', '2026-11-08'), att('Gioco B', 'm1', ''), att('Gioco C', 'm2', '')]}],
    uscite:{u1:{id:'u1', cr:1, testo:'Uscita al parco', modello:'giorno', ax:{data:'2026-11-15', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
await ev(() => shGrp('Progettare')); await sleep(200);
ok(await ev(() => [...document.querySelectorAll('#sh-side .sh-si')].some(b => /Visione d’insieme/.test(b.textContent))), 'menu Progettare: «Visione d’insieme»');
await ev(() => shVis()); await sleep(800);
let s = await ev(() => ({rows: document.querySelectorAll('#panel-pp .vis-r:not(.vis-rh)').length, bars: [...document.querySelectorAll('#panel-pp .vis-bar')].map(b => b.style.left.slice(0, 5) + '/' + b.style.width.slice(0, 5)), dots: document.querySelectorAll('#panel-pp .vis-t .vis-dot').length, oc: document.querySelectorAll('#panel-pp .vis-oc').length, on: document.querySelector('#sh-side .sh-si.on') && document.querySelector('#sh-side .sh-si.on').textContent.trim()}));
ok(s.bars.length === 2 && s.bars[0] === '8.333/33.33' && s.bars[1] === '16.66/33.33', 'blocchi nei mesi giusti: ottobre-gennaio e novembre-febbraio ' + s.bars.join(' '));
ok(s.dots === 1 && s.oc === 1, 'un’attività con data e un’uscita segnate sulla linea');
ok(/Visione d’insieme/.test(s.on || ''), 'voce del menu evidenziata');
// spostare di un mese
await P.click('#panel-pp .vis-r >> nth=1 >> button:has-text("un mese ▶")'); await sleep(400);
let pr = await ev(() => { const p = getAllPercorsi()[0]; return p.tDal + '→' + p.tAl; });
ok(pr === '2026-11→2027-02', 'un mese avanti: novembre-febbraio (' + pr + ')');
ok(await ev(() => scheda.priorita[0].tDal === '2026-10'), 'la Sezione 2 non viene toccata: la modifica vale per il percorso');
// trascinare
const bb = await P.locator('#panel-pp .vis-bar >> nth=0').boundingBox(); const tb = await P.locator('#panel-pp .vis-t >> nth=1').boundingBox(); const col = tb.width / 12;
await P.mouse.move(bb.x + 20, bb.y + 14); await P.mouse.down(); await P.mouse.move(bb.x + 20 + col * 0.6, bb.y + 14, {steps:4}); await P.mouse.move(bb.x + 20 + col * 1.1, bb.y + 14, {steps:4}); await P.mouse.up(); await sleep(500);
pr = await ev(() => { const p = getAllPercorsi()[0]; return p.tDal + '→' + p.tAl; });
ok(pr === '2026-12→2027-03', 'trascinando il blocco di un mese: dicembre-marzo (' + pr + ')');
// scegliere l'inizio di un percorso senza periodo
await P.selectOption('#panel-pp .vis-r >> nth=3 >> select', '4'); await sleep(400);
pr = await ev(() => { const p = getAllPercorsi()[2]; return p.tDal + '→' + p.tAl; });
ok(pr === '2027-01→2027-03', 'senza periodo: «Comincia a gennaio» propone un trimestre (' + pr + ')');
// Percorsi educativi ne risente
await ev(() => shSec('3')); await sleep(800);
ok(await ev(() => { const sl = document.querySelectorAll('#perc-tm-0 select'); return sl.length >= 2 && sl[0].value === '12'; }), '«Percorsi educativi» mostra il periodo spostato (dicembre)');
await ev(() => shVis()); await sleep(400);
for(const w of [820, 390]){ await P.setViewportSize({width:w, height:800}); await sleep(300); ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'nessuno scorrimento orizzontale a ' + w + ' px'); }
await P.screenshot({path:'/tmp/vis_390.png'});
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
