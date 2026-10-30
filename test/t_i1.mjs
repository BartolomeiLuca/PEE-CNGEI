import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const mk = (id, titolo, meta, scheda, extra = {}) => db.t.pee_archivi.push({id, user_id:u.id, anno:2026, titolo, meta, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, scheda}, extra), created_at:'2026-10-20T10:00:00Z', updated_at: id==='c1' ? '2026-10-22T10:00:00Z' : '2026-10-26T10:00:00Z'});
const base_ = {tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'}};
// due cicli dello stesso anno: il primo senza nome di ciclo, il secondo «Ciclo 2»
mk('c1', 'Programmazione Annuale 2026-27', {mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1', ciclo:true}, base_);
mk('c2', 'Programmazione Annuale 2026-27 · Ciclo 2', {mode:'giovani', fascia:'E', tipo:'AN', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1', ciclo:true, cn:'Ciclo 2', cdal:'2027-01', cal:'2027-04'}, Object.assign({}, base_, {ciclo:{nome:'Ciclo 2', dal:'2027-01', al:'2027-04'}}));
mk('p1', 'Progetto Personale 2026-27', {mode:'giovani', fascia:'E', tipo:'PP', vruolo:'cu', vbranca:'E', sez:'Pesaro', gr:'1'}, Object.assign({}, base_, {tipoProgetto:'PP'}));
await loginAs(P, base, u); await sleep(1500);

// ── elenco: il contenitore dei cicli ha uno sfondo diverso dalla pagina; il primo ciclo si chiama «Ciclo 1»
let s = await ev(() => { const a = document.querySelector('.sh-an'); if(!a) return null; const bg = getComputedStyle(a).backgroundColor, pg = getComputedStyle(document.body).backgroundColor; return {bg, pg, txt: a.textContent}; });
ok(s && s.bg !== s.pg, 'il contenitore dei cicli ha uno sfondo diverso dalla pagina (' + (s && s.bg) + ' / ' + (s && s.pg) + ')');
ok(s && /Ciclo 1/.test(s.txt) && /Ciclo 2/.test(s.txt), 'in elenco ci sono «Ciclo 1» e «Ciclo 2»');

// ── Programmazione: Priorità → Obiettivi → Percorso: i pulsanti portano lo stesso nome della voce di menu
await ev(() => shOpen('c1', 0)); await sleep(3500);
const menu = await ev(() => window.shNavItems().filter(i => i.t).map(i => i.t));
await ev(() => shSub('1d', '')); await sleep(700);
const nextPri = await ev(() => [...document.querySelectorAll('#panel-ppp button, #val-root button, #panel4 button, .panel.active button')].map(b => b.textContent.trim()).filter(t => /Avanti|←|→/.test(t)));
ok(nextPri.some(t => /Obiettivi e indicatori/.test(t)) && !nextPri.some(t => /Sezione \d/.test(t)), 'Priorità: «Avanti — Obiettivi e indicatori», niente «Sezione N» (' + nextPri.join(' | ') + ')');
await ev(() => shSec('2')); await sleep(800);
const ob = await ev(() => [...document.querySelectorAll('.panel.active button, #val-root button')].map(b => b.textContent.trim()).filter(t => /→|←/.test(t)));
ok(ob.some(t => /^← Priorità$/.test(t)) && ob.some(t => /^Percorso Personale →$/.test(t)) && !ob.some(t => /Sezione \d|1\.4/.test(t)), 'Obiettivi: «← Priorità» e «Percorso Personale →» (' + ob.join(' | ') + ')');
ok(menu.includes('Priorità') && menu.includes('Percorso Personale') && menu.includes('Obiettivi e indicatori'), 'le voci di menu esistono con quei nomi');
const nMode = await ev(() => document.querySelectorAll('#mv-mode').length + document.querySelectorAll('.mv-mode-t').length);
ok(nMode === 0, 'in Obiettivi non compare «Tipo di osservazione» (' + nMode + ')');
await ev(() => shSub('1a', '', 'occ')); await sleep(900);
const nOcc = await ev(() => document.querySelectorAll('#mv-mode').length);
ok(nOcc === 1, 'in «Come osservo» compare una volta sola (' + nOcc + ')');
for (const f of ["shPerc('P')", "shSec('4')", "shSec('5')", "shSub('1c','')", "shSub('1d','')", "shSub('1b','P')"]) {
  await ev(f => eval(f), f); await sleep(700);
  const n = await ev(() => document.querySelectorAll('#mv-mode').length);
  ok(n === 0, 'fuori da «Come osservo» (' + f + ') nessun «Tipo di osservazione»');
}
// ── Percorso → verifica → valutazione: pulsanti con i nomi del menu
await ev(() => shPerc('P')); await sleep(900);
let bt = await ev(() => [...document.querySelectorAll('.panel.active button, #val-root button')].map(b => b.textContent.trim()).filter(t => /→|←/.test(t)));
ok(bt.some(t => /^← Obiettivi e indicatori$/.test(t)) && bt.some(t => /^Verifica delle attività →$/.test(t)), 'Percorso: «← Obiettivi e indicatori», «Verifica delle attività →» (' + bt.join(' | ') + ')');
await ev(() => shSec('4')); await sleep(800);
bt = await ev(() => [...document.querySelectorAll('.panel.active button, #val-root button')].map(b => b.textContent.trim()).filter(t => /→|←/.test(t)));
ok(bt.some(t => /^← Percorso Personale$/.test(t)) && bt.some(t => /^Valutazione finale →$/.test(t)), 'Verifica: «← Percorso Personale», «Valutazione finale →» (' + bt.join(' | ') + ')');
await ev(() => shSec('5')); await sleep(800);
bt = await ev(() => [...document.querySelectorAll('.panel.active button, #val-root button')].map(b => b.textContent.trim()).filter(t => /→|←/.test(t)));
ok(!bt.some(t => /Sezione \d/.test(t)), 'Valutazione: nessun «Sezione N» nei pulsanti (' + bt.join(' | ') + ')');

// ── ricerca di vecchie etichette in tutte le pagine della Programmazione
const pages = ["shDash()", "shSub('1a','','unit')", "shSub('1a','','ctx')", "shSub('1a','','staff')", "shSub('1a','','occ')", "shSub('1b','P')", "shSub('1b','C')", "shSub('1b','S')", "shSub('1c','')", "shSub('1d','')", "shSec('2')", "shPerc('P')", "shPerc('C')", "shPerc('S')", "shSec('4')", "shSec('5')", "shSec('chk')", "shSec('usc')"];
for (const f of pages) {
  await ev(f => eval(f), f); await sleep(650);
  const t = await ev(() => { const a = document.querySelector('#panel-dash.active, .panel.active, #panel-pp.active') || document.body; return (document.querySelector('main') || document.body).innerText; });
  const bad = (t.match(/(?:nella |della |dalla |alla )?Sezione [1-5]\b(?!\.\d)|\b1\.[1-4]\b|in quattro passi|Vai a Sezione/gi) || []);
  ok(bad.length === 0, 'nessuna vecchia etichetta in ' + f + (bad.length ? ' → ' + [...new Set(bad)].join(', ') : ''));
}
// ── date: la fine, se vuota, si apre sull'inizio
await ev(() => shCal()); await sleep(700);
await ev(() => calNew('bivacco')); await sleep(400);
await P.fill('#cal-d1', '2027-03-12'); await P.focus('#cal-d2'); await sleep(200);
let v = await ev(() => document.getElementById('cal-d2').value);
ok(v === '2027-03-12', 'Nuovo bivacco: la data di fine, appena toccata, parte dall’inizio (' + v + ')');
await P.focus('#cal-nt'); await sleep(200);
v = await ev(() => document.getElementById('cal-d2').value);
ok(v === '', 'se non la cambio e esco, la fine torna vuota (' + v + ')');
await P.fill('#cal-d2', '2027-03-14'); await P.focus('#cal-nt'); await sleep(200);
v = await ev(() => document.getElementById('cal-d2').value);
ok(v === '2027-03-14', 'se la scelgo, resta (' + v + ')');
// ── tempistica: l'anno di fine parte dall'anno d'inizio
await ev(() => { try{ scheda.priorita = scheda.priorita || []; }catch(e){} });
const html = await ev(() => tmSelHTML('', 'x', '2027-03'));
ok(/<option[^>]*>2027<\/option>/.test(html) && !/<option[^>]*>2025<\/option>/.test(html), 'il menu degli anni di fine parte dall’anno d’inizio (2027…)');
const html2 = await ev(() => tmSelHTML('2026-05', 'x', '2027-03'));
ok(/selected[^>]*>2026</.test(html2) || /<option selected>2026<\/option>/.test(html2), 'un anno già salvato prima dell’inizio resta nell’elenco (nessuna perdita)');
// ── Progetto Personale: resta con le Sezioni
await ev(() => shGoHome()); await sleep(1200);
await ev(() => shOpen('p1', 0)); await sleep(3500);
const pm = await ev(() => [...document.querySelectorAll('#sh-side .sh-si')].map(b => b.textContent.trim()));
ok(pm.some(t => /^2 · Obiettivi/.test(t)), 'PP: voci numerate nel menu (' + pm.join(' | ') + ')');
await ev(() => shPP('1')); await sleep(900);
await ev(() => shPP('2')); await sleep(900);
const pb = await ev(() => [...document.querySelectorAll('.panel.active button, #val-root button')].map(b => b.textContent.trim()).filter(t => /→|←/.test(t)));
ok(pb.some(t => /Sezione 3 →/.test(t)), 'PP: i pulsanti restano «Sezione 3 →» come nelle Linee Guida (' + pb.join(' | ') + ')');
process.exit(summary() ? 1 : 0);
