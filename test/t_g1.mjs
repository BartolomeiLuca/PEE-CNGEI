import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB();
const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
db.addUser('anna@x.it', 'password123', 'Anna Verdi');
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(1500);
// 1 · senza account: schermata di accesso, niente pagina iniziale vecchia
let s = await ev(() => ({show: document.getElementById('sh-root').classList.contains('show'), txt: document.getElementById('sh-root').textContent, wel: getComputedStyle(document.getElementById('welcome-screen')).display, hdr: getComputedStyle(document.getElementById('hdr')).display}));
ok(s.show && /1 · Il tuo account/.test(s.txt) && /2 · Il tuo profilo/.test(s.txt) && /Crea l’account/.test(s.txt), 'senza account: pagina unica «1 · Il tuo account» + «2 · Il tuo profilo»');
ok(s.wel === 'none' && s.hdr === 'none', 'la pagina iniziale e l’intestazione vecchie non si vedono');
// 2 · accesso
await P.click('#sh-login'); await sleep(300);
ok(!(await ev(() => document.getElementById('cl-ov').classList.contains('show'))) && /Accedi/.test(await ev(() => document.getElementById('sh-ago').textContent)), 'Accedi resta nella pagina (nessuna finestra)');
await P.fill('#sh-em', 'anna@x.it'); await P.fill('#sh-pw', 'password123'); await P.click('#sh-ago'); await sleep(2000);
s = await ev(() => ({v: SH.view, ov: document.getElementById('cl-ov').classList.contains('show'), txt: document.getElementById('sh-root').textContent, nome: document.getElementById('sh-nome') && document.getElementById('sh-nome').value}));
ok(s.v === 'profile' && !s.ov, 'dopo l’accesso: schermata del profilo, finestra chiusa');
ok(s.nome === 'Anna Verdi', 'il nome si precompila dall’account');
// 3 · validazione
await P.click('#sh-psave'); await sleep(200);
ok(/Scegli il tuo ruolo/.test(await ev(() => document.getElementById('sh-pmsg').textContent)), 'profilo: senza ruolo chiede il ruolo');
await P.check('input[name="sh-ruolo"][value="cu"]'); await P.click('#sh-psave'); await sleep(200);
ok(/Branca/.test(await ev(() => document.getElementById('sh-pmsg').textContent)), 'profilo: Capo Unità senza Branca → chiede la Branca');
await P.check('input[name="sh-branca"][value="E"]'); await P.fill('#sh-sez', 'Pesaro'); await P.dispatchEvent('#sh-sez', 'change'); await sleep(300);
const gopts = await ev(() => [...document.querySelectorAll('#sh-grp option')].length);
ok(gopts >= 22, 'Gruppo: menu a tendina con Monogruppo e Gruppi 1-20');
await P.selectOption('#sh-grp', '1'); await P.selectOption('#sh-area', 'altoadriatico'); await P.click('#sh-psave'); await sleep(1500);
s = await ev(() => ({v: SH.view, txt: document.getElementById('sh-root').textContent}));
ok(s.v === 'home' && /Che cosa vuoi progettare/.test(s.txt) && /Progetto Personale/.test(s.txt) && /Programmazione Annuale/.test(s.txt), 'senza progetti: home con le due carte (PP e Programmazione Annuale)');
ok(/passo passo, con la struttura indicata nelle Linee Guida/.test(s.txt), 'testo della carta PP come deciso');
const prof = db.t.pee_profili[0];
ok(prof && prof.ruolo === 'cu' && prof.branca === 'E' && prof.sezione === 'Pesaro' && prof.gruppo === '1' && prof.area_rcdf === 'altoadriatico', 'profilo salvato in pee_profili');
// 4 · nuovo progetto PP
await P.click('.sh-big >> nth=0'); await sleep(300);
const dl = await ev(() => ({t: document.getElementById('sh-dlg').textContent, pp: document.querySelector('input[name="sh-tipo"]:checked').value, anni: [...document.querySelectorAll('#sh-nas option')].map(o => o.textContent)}));
ok(dl.pp === 'PP' && /Nome Unità/.test(dl.t) && /Branca/.test(dl.t) && /Anno scout/.test(dl.t), 'finestra Nuovo progetto: tipo PP già scelto, Anno scout, Branca, Nome Unità');
ok(dl.anni[0] === '2026-27' && dl.anni.includes('2025-26'), 'anno scout: 2026-27 per primo (1 settembre – 31 agosto)');
ok(/Pesaro/.test(dl.t), 'Sezione e Gruppo dal profilo');
await P.fill('#sh-nun', 'Reparto Kontiki'); await P.click('#sh-ncre'); await sleep(3500);
s = await ev(() => ({main: document.getElementById('main-app').style.display, shv: SH.view, ctx: CL.ctx && CL.ctx.titolo, mode: MODE, f: FASCIA, tp: scheda.tipoProgetto, un: UNIT_NAME}));
ok(s.main !== 'none' && !s.shv && /Progetto Personale 2026-27 · Reparto Kontiki/.test(s.ctx || ''), 'creato: il progetto si apre');
ok(s.mode === 'giovani' && s.f === 'E' && s.tp === 'PP' && s.un === 'Reparto Kontiki', 'dati: Branca E, nome unità e tipo PP');
let row = db.t.pee_archivi[0];
ok(row && row.meta.tipo === 'PP' && row.data.scheda.tipoProgetto === 'PP' && row.data.scheda.pp.sezione === 'Pesaro' && row.data.scheda.pp.gruppo === '1', 'archivio: tipo nei dati e nel meta, Sezione e Gruppo dal profilo');
// salvataggio: il tipo non si perde
await ev(async () => { scheda.pp.ctxTerr = 'prova'; saveData(true); await clPush(true); }); await sleep(800);
row = db.t.pee_archivi[0];
ok(row.data.scheda.tipoProgetto === 'PP' && row.meta.tipo === 'PP' && row.data.scheda.pp.ctxTerr === 'prova', 'dopo il salvataggio il tipo di progetto resta (dati e meta)');
// 5 · torna a I tuoi progetti, aggiungo condivisi
const anna = db.users[0], marco = db.addUser('marco@x.it', 'password123', 'Marco Bianchi');
const mk = (owner, titolo, ruolo, br) => { const a = {id: 'sh' + titolo.length + ruolo, user_id: owner.id, anno: 2026, titolo, meta: {mode: 'giovani', fascia: br, tipo: 'AN', nome: 'Branco X'}, data: {v: 1, MODE: 'giovani', FASCIA: br}, created_at: '2026-10-20T10:00:00Z', updated_at: '2026-10-26T10:00:00Z'}; db.t.pee_archivi.push(a); db.t.pee_membri.push({id: 'm' + a.id, archivio_id: a.id, owner_id: owner.id, owner_email: owner.email, email: anna.email, ruolo, visto_il: '2026-10-21T10:00:00Z'}); };
mk(marco, 'Programmazione Annuale 2026-27 · A', 'cotitolare', 'L'); mk(marco, 'Progetto Personale 2026-27 · BB', 'collaboratore', 'R'); mk(marco, 'Programmazione Annuale 2026-27 · CCC', 'lettore', 'E');
await ev(() => shGoHome()); await sleep(1500);
const home = await ev(() => document.getElementById('sh-root').innerText);
ok(/I tuoi progetti/.test(home) && /Titolare/.test(home) && /Condivisi con te/i.test(home), 'home con progetti: «I tuoi progetti», Titolare e «Condivisi con te»');
ok(/Il tuo ruolo: Co-titolare/.test(home) && /Il tuo ruolo: Collaboratore/.test(home) && /Il tuo ruolo: Lettore/.test(home), 'condivisi: Co-titolare, Collaboratore e Lettore con il ruolo');
// 6 · Capo Gruppo: niente Branca né Nome Unità
await ev(() => shProfileOpen()); await sleep(300);
await P.check('input[name="sh-ruolo"][value="cg"]'); await sleep(200);
ok(await ev(() => document.getElementById('sh-brw').style.display === 'none'), 'profilo Capo Gruppo: la Branca sparisce');
await P.click('#sh-psave'); await sleep(1500);
await P.click('text=+ Nuovo progetto'); await sleep(300);
const d2 = await ev(() => document.getElementById('sh-dlg').textContent);
ok(!(await ev(() => !!document.getElementById('sh-nun') || !!document.getElementById('sh-nbr'))) && /Capo Gruppo non scegli Branca/.test(d2), 'Nuovo progetto per Capo Gruppo: senza Branca e Nome Unità');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
