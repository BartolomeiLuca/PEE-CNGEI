import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'R', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const mk = (id, titolo, meta, data) => db.t.pee_archivi.push({id, user_id:u.id, anno:2026, titolo, meta, data, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
mk('c1', 'Programmazione Annuale 2026-27 · Compagnia Aquila · Ciclo 1', {mode:'giovani', fascia:'R', tipo:'AN', vruolo:'cu', vbranca:'R', sez:'Pesaro', gr:'1', cn:'Ciclo 1', cdal:'2026-09', cal:'2026-12'}, {v:1, MODE:'giovani', FASCIA:'R', UNIT_NAME:'Aquila', scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'R'}, ciclo:{nome:'Ciclo 1', dal:'2026-09', al:'2026-12'}}});
mk('c2', 'Programmazione Annuale 2026-27 · Compagnia Aquila · Ciclo 2', {mode:'giovani', fascia:'R', tipo:'AN', vruolo:'cu', vbranca:'R', sez:'Pesaro', gr:'1', cn:'Ciclo 2', cdal:'2027-01', cal:'2027-04'}, {v:1, MODE:'giovani', FASCIA:'R', UNIT_NAME:'Aquila', scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'R'}, ciclo:{nome:'Ciclo 2', dal:'2027-01', al:'2027-04'}}});
mk('g1', 'Capo Gruppo 2026-27', {mode:'staff', tipo:'AN', vruolo:'cg', vbranca:'', sez:'Pesaro', gr:'1', sruolo:'CG'}, {v:1, MODE:'staff', STAFF_TYPE:'misto', STAFF_RUOLO:'CG', UNIT_NAME:'', scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cg', branca:''}}});
mk('e1', 'Vecchio progetto Esploratori', {mode:'giovani', fascia:'E', tipo:'AN'}, {v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{}}});
await loginAs(P, base, u); await sleep(1500);
let s = await ev(() => ({vg: [...document.querySelectorAll('.sh-vg .sh-vh h2')].map(h => h.textContent), an: document.querySelectorAll('.sh-an').length, nc: document.querySelectorAll('.sh-an .sh-anh button').length, rows: document.querySelectorAll('.sh-vg .sh-pr').length, txt: document.getElementById('sh-root').textContent}));
ok(s.vg.length === 3, 'tre vesti nella lista: ' + s.vg.join(' | '));
ok(s.vg[0] === 'Come Capo Compagnia', 'prima la veste del profilo (Capo Compagnia)');
ok(s.vg.includes('Come Capo Gruppo') && s.vg.some(x => /Capo Reparto|Capo Unità/.test(x)), 'Capo Gruppo e il progetto vecchio di Branca E restano a parte');
ok(s.an === 2 && s.nc === 2, 'una scheda per anno e veste «Programmazione di Unità · anno» con «+ Nuovo ciclo»');
ok(/2 cicli/.test(s.txt) && /Ciclo 1/.test(s.txt) && /Ciclo 2/.test(s.txt), 'due cicli raggruppati sotto l’anno');
// nuovo progetto: veste
await ev(() => shNew('AN')); await sleep(300);
ok(await ev(() => !!document.getElementById('sh-nru') && /In che veste/.test(document.getElementById('sh-dlg').textContent)), 'Nuovo progetto: «In che veste lo crei?»');
await P.selectOption('#sh-nru', 'cg'); await sleep(150);
ok(await ev(() => document.getElementById('sh-nbrw').hidden && document.getElementById('sh-nunw').hidden), 'Capo Gruppo: niente Branca né Nome Unità');
await P.selectOption('#sh-nru', 'cu'); await P.selectOption('#sh-nbr', 'E'); await P.fill('#sh-nun', 'Kontiki2'); await P.selectOption('#sh-nas', { index: 2 }); await P.click('#sh-ncre'); await sleep(4500);
s = await ev(() => ({th: document.body.getAttribute('data-theme'), v: scheda.veste, f: FASCIA, r: SH.prof.branca}));
ok(s.th === 'E' && s.f === 'E' && s.v && s.v.ruolo === 'cu' && s.v.branca === 'E', 'progetto Branca E creato dal profilo Rover: colore e veste del progetto (' + s.th + ' · ' + JSON.stringify(s.v) + ')');
ok(s.r === 'R', 'il profilo resta Rover');
// torno alla lista: colore del profilo
await ev(() => shGoHome()); await sleep(1500);
ok(await ev(() => document.body.getAttribute('data-theme')) === 'R', 'fuori dal progetto il colore torna a quello del profilo');
// cestino
await ev(() => { window.confirm = () => true; });
await ev(() => shDel('e1')); await sleep(1500);
s = await ev(() => ({tr: !!document.querySelector('#sh-trash .sh-trash'), txt: document.getElementById('sh-trash').textContent, rows: [...document.querySelectorAll('.sh-vg .t')].map(x => x.textContent)}));
ok(s.tr && /Vecchio progetto Esploratori/.test(s.txt), 'eliminato: sta nel cestino della lista');
ok(!s.rows.some(x => /Vecchio progetto/.test(x)), 'e non è più tra i progetti');
await ev(() => shTrashRestore('e1')); await sleep(1500);
ok(await ev(() => [...document.querySelectorAll('.sh-vg .t')].some(x => /Vecchio progetto Esploratori/.test(x.textContent))), 'recuperato dal cestino');
// elimina un ciclo
await ev(() => shDel('c2')); await sleep(1500);
ok(await ev(() => /Un ciclo/.test(document.querySelector('.sh-an').textContent)), 'eliminato un ciclo: ne resta uno');
// nuovo ciclo dalla lista
await ev(() => { const b = document.querySelector('.sh-an .sh-anh button'); b.click(); }); await sleep(5000);
s = await ev(() => ({sc: SH.dscope, f: !!document.getElementById('nc-n'), id: CL.ctx && CL.ctx.id}));
ok(s.sc === 'anno' && s.f, '«+ Nuovo ciclo»: apre il progetto sul «Mio anno» con il modulo del ciclo (' + JSON.stringify(s) + ')');
process.exit(summary() ? 1 : 0);
