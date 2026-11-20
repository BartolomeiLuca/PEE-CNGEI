// Capo Gruppo / Commissario che sono anche Capi Unità: campo «Ho anche un'Unità» nel profilo, home con due carte grandi e riga lunga, finestra «Nuovo progetto»
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB();
const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const gina = db.addUser('gina@x.it', 'password123', 'Gina Neri');
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(1500);
await P.click('#sh-login'); await sleep(300); await P.fill('#sh-em', 'gina@x.it'); await P.fill('#sh-pw', 'password123'); await P.click('#sh-ago'); await sleep(2000);

// 1 · profilo: il blocco compare solo per Capo Gruppo e Commissario
const unw = () => ev(() => { const e = document.getElementById('sh-unw'); return e ? !e.hidden : null; });
ok(await unw() === false, 'profilo: senza ruolo il blocco «Ho anche un’Unità» non si vede');
await P.check('input[name="sh-ruolo"][value="cu"]'); await sleep(150);
ok(await unw() === false, 'profilo: Capo Unità → nessun blocco (ha già la Branca)');
await P.check('input[name="sh-ruolo"][value="cg"]'); await sleep(150);
ok(await unw() === true && await ev(() => document.getElementById('sh-unf').style.display === 'none'), 'profilo: Capo Gruppo → blocco visibile, campi chiusi finché non si spunta');
await P.check('input[name="sh-ruolo"][value="cds"]'); await sleep(150);
ok(await unw() === true, 'profilo: anche il Commissario di Sezione ha il blocco');
await P.check('input[name="sh-ruolo"][value="cg"]'); await sleep(150);
await P.fill('#sh-sez', 'Pesaro'); await P.dispatchEvent('#sh-sez', 'change'); await sleep(300); await P.selectOption('#sh-grp', '1');
await P.check('#sh-hasun'); await sleep(150);
ok(await ev(() => document.getElementById('sh-unf').style.display === 'flex'), 'spuntando la casella compaiono Branca e Nome Unità');
await P.click('#sh-psave'); await sleep(300);
ok(/Scegli la Branca della tua Unità/.test(await ev(() => document.getElementById('sh-pmsg').textContent)), 'senza Branca dell’Unità non salva');
await P.check('input[name="sh-unbr"][value="E"]'); await P.fill('#sh-unn', 'Reparto Kontiki'); await P.click('#sh-psave'); await sleep(1800);
let prof = db.t.pee_profili[0];
ok(prof && prof.ruolo === 'cg' && !prof.branca && prof.dashboard && prof.dashboard.unita && prof.dashboard.unita.branca === 'E' && prof.dashboard.unita.nome === 'Reparto Kontiki', 'profilo salvato: ruolo Capo Gruppo, Branca vuota, Unità dentro dashboard.unita ('+JSON.stringify(prof && prof.dashboard)+')');

// 2 · home vuota: due carte grandi + riga lunga
let s = await ev(() => ({v: SH.view, big: [...document.querySelectorAll('.sh-big b')].map(b => b.textContent), long: [...document.querySelectorAll('.sh-long')].map(b => b.innerText), txt: document.getElementById('sh-root').innerText}));
ok(s.v === 'home' && s.big.length === 2 && /formativa/i.test(s.big[0]) && /Progetto Personale/.test(s.big[1]), 'home Capo Gruppo: prima «Programmazione formativa annuale», poi «Progetto Personale» (carte grandi) ('+s.big.join(' / ')+')');
ok(s.long.length === 1 && /Programmazione Educativa Annuale/.test(s.long[0]) && /Reparto Kontiki/.test(s.long[0]) && /Esploratori ed Esploratrici/.test(s.long[0]), 'sotto, una riga lunga e piccola: «Sei anche Capo Unità» con Unità e Branca');
const geo = await ev(() => { const l = document.querySelector('.sh-long').getBoundingClientRect(), b = document.querySelector('.sh-big').getBoundingClientRect(); return {lw: l.width, lh: l.height, bh: b.height, below: l.top >= b.bottom - 1}; });
ok(geo.below && geo.lh < geo.bh * 0.6 && geo.lw > geo.bh, 'la riga lunga sta sotto ed è molto più bassa delle carte ('+JSON.stringify(geo)+')');
ok(!/Indicalo nel profilo/.test(s.txt), 'con l’Unità indicata non compare l’invito a indicarla');

// 3 · Progetto Personale dalla carta: veste Capo Unità con Branca e Unità dal profilo
await P.click('.sh-big >> nth=1'); await sleep(300);
let d = await ev(() => ({tipo: document.querySelector('input[name="sh-tipo"]:checked').value, radios: [...document.querySelectorAll('input[name="sh-tipo"]')].map(i => i.value), ruolo: !!document.getElementById('sh-nru'), brHidden: document.getElementById('sh-nbrw').hidden, br: document.getElementById('sh-nbr').value, un: document.getElementById('sh-nun').value, unHidden: document.getElementById('sh-nunw').hidden, hint: document.getElementById('sh-nhint').textContent}));
ok(d.tipo === 'PP' && d.radios.join() === 'AN,PP,EDU' && !d.ruolo, 'Nuovo progetto: tre scelte (formativa, PP, educativa), niente menu del ruolo');
ok(!d.brHidden && !d.unHidden && d.br === 'E' && d.un === 'Reparto Kontiki' && /correggerle/.test(d.hint), 'Branca e Unità già compilate dal profilo (correggibili)');
await P.click('#sh-ncre'); await sleep(3500);
s = await ev(() => ({main: document.getElementById('main-app').style.display, shv: SH.view, mode: MODE, f: FASCIA, tp: scheda.tipoProgetto, un: UNIT_NAME, v: scheda.veste, brand: document.body.getAttribute('data-theme')}));
ok(s.main !== 'none' && !s.shv && s.mode === 'giovani' && s.f === 'E' && s.tp === 'PP' && s.un === 'Reparto Kontiki', 'PP creato: Branca E, tipo PP, Unità dal profilo');
ok(s.v && s.v.ruolo === 'cu' && s.v.branca === 'E' && s.brand === 'E', 'PP: veste «Capo Unità» E e colore della Branca ('+JSON.stringify(s.v)+' tema '+s.brand+')');
let row = db.t.pee_archivi[0];
ok(row.meta.vruolo === 'cu' && row.meta.vbranca === 'E' && row.meta.tipo === 'PP', 'archivio: meta con veste cu/E e tipo PP');

// 4 · «+ Nuovo progetto» dalla lista: formativa di default, poi educativa
await ev(() => shGoHome()); await sleep(1500);
await P.click('text=+ Nuovo progetto'); await sleep(300);
d = await ev(() => ({tipo: document.querySelector('input[name="sh-tipo"]:checked').value, brHidden: document.getElementById('sh-nbrw').hidden, unHidden: document.getElementById('sh-nunw').hidden, hint: document.getElementById('sh-nhint').textContent}));
ok(d.tipo === 'AN' && d.brHidden && d.unHidden && /non scegli Branca/.test(d.hint), 'dalla lista: di default la formativa, senza Branca né Unità');
await P.click('#sh-ncre'); await sleep(1000);
if(await ev(() => { const e = document.getElementById('sh-nprev'); return !!e && !e.hidden; })) { await P.click('#sh-nprev button:has-text("Parto da zero")'); }
await sleep(3500);
s = await ev(() => ({mode: MODE, r: STAFF_RUOLO, tp: scheda.tipoProgetto, v: scheda.veste, brand: document.body.getAttribute('data-theme'), t: CL.ctx && CL.ctx.titolo}));
ok(s.mode === 'staff' && s.r === 'CG' && s.v && s.v.ruolo === 'cg' && s.brand === 'S', 'formativa: modalità staff, ruolo CG, colore blu ('+s.t+')');
await ev(() => shGoHome()); await sleep(1500);
await P.click('text=+ Nuovo progetto'); await sleep(300);
await P.check('input[name="sh-tipo"][value="EDU"]'); await sleep(200);
d = await ev(() => ({brHidden: document.getElementById('sh-nbrw').hidden, br: document.getElementById('sh-nbr').value, un: document.getElementById('sh-nun').value}));
ok(!d.brHidden && d.br === 'E' && d.un === 'Reparto Kontiki', 'scegliendo «Programmazione Educativa (come Capo Unità)» compaiono Branca e Unità già compilate');
await P.click('#sh-ncre'); await sleep(1000);
if(await ev(() => { const e = document.getElementById('sh-nprev'); return !!e && !e.hidden; })) { await P.click('#sh-nprev button:has-text("Parto da zero")'); }
await sleep(3500);
s = await ev(() => ({mode: MODE, f: FASCIA, tp: scheda.tipoProgetto, un: UNIT_NAME, v: scheda.veste, brand: document.body.getAttribute('data-theme'), t: CL.ctx && CL.ctx.titolo, st: (staffTab() || []).map(r => r.ruolo + ':' + (r.nome || '')).join('|')}));
ok(s.mode === 'giovani' && s.f === 'E' && s.tp === 'AN' && s.un === 'Reparto Kontiki' && s.v.ruolo === 'cu' && s.brand === 'E', 'educativa: progetto di Unità, Branca E, ruolo Capo Unità, colore verde ('+s.t+')');
ok(/CU:Gina Neri/.test(s.st) && !/CG:Gina/.test(s.st), 'nella tabella dello staff compare come Capo Unità, non come Capo Gruppo ('+s.st+')');
await ev(() => shGoHome()); await sleep(1500);
const lst = await ev(() => [...document.querySelectorAll('.sh-vh h2')].map(h => h.textContent));
ok(lst.some(t => /Come Capo Reparto/.test(t)) && lst.some(t => /Come Capo Gruppo/.test(t)), 'la lista raggruppa «Come Capo Reparto» (PP + educativa) e «Come Capo Gruppo» (formativa) ('+lst.join(' | ')+')');

// 5 · togliere l'Unità dal profilo: sparisce la riga, il resto del campo dashboard resta
await ev(() => { SH.prof.dashboard = Object.assign({}, SH.prof.dashboard, {visti: {x: 1}}); return SH.profSave({nome: SH.prof.nome, ruolo: SH.prof.ruolo, branca: '', sezione: SH.prof.sezione, gruppo: SH.prof.gruppo, dashboard: SH.prof.dashboard}); });
await ev(() => shProfileOpen()); await sleep(400);
ok(await ev(() => { const c = document.querySelector('input[name="sh-unbr"]:checked'); return document.getElementById('sh-hasun').checked && !!c && c.value === 'E' && document.getElementById('sh-unn').value === 'Reparto Kontiki' && document.getElementById('sh-unf').style.display === 'flex'; }), 'riaprendo il profilo il blocco è già compilato e aperto');
await P.uncheck('#sh-hasun'); await P.click('#sh-psave'); await sleep(1800);
prof = db.t.pee_profili[0];
ok(prof.dashboard && !prof.dashboard.unita && prof.dashboard.visti && prof.dashboard.visti.x === 1, 'casella spenta: si toglie solo l’Unità, il resto di dashboard resta ('+JSON.stringify(prof.dashboard)+')');
await ev(() => shGoHome()); await sleep(1500);
await P.click('text=+ Nuovo progetto'); await sleep(300);
d = await ev(() => ({radios: [...document.querySelectorAll('input[name="sh-tipo"]')].map(i => i.value)}));
ok(d.radios.join() === 'AN,PP', 'senza Unità nel profilo: solo formativa e Progetto Personale');
await P.check('input[name="sh-tipo"][value="PP"]'); await sleep(200);
d = await ev(() => ({br: document.getElementById('sh-nbr').value, first: document.getElementById('sh-nbr').options[0].textContent, hint: document.getElementById('sh-nhint').textContent}));
ok(d.br === '' && /Scegli la Branca/.test(d.first) && /bisogno della Branca/.test(d.hint), 'PP senza Unità: la Branca va scelta');
await P.click('#sh-ncre'); await sleep(500);
ok(/Scegli la Branca/.test(await ev(() => document.getElementById('sh-nmsg').textContent)), 'senza Branca non crea il PP');
await P.selectOption('#sh-nbr', 'R'); await P.click('#sh-ncre'); await sleep(1000);
if(await ev(() => { const e = document.getElementById('sh-nprev'); return !!e && !e.hidden; })) { await P.click('#sh-nprev button:has-text("Parto da zero")'); }
await sleep(3500);
s = await ev(() => ({mode: MODE, f: FASCIA, tp: scheda.tipoProgetto, v: scheda.veste, brand: document.body.getAttribute('data-theme')}));
ok(s.mode === 'giovani' && s.f === 'R' && s.tp === 'PP' && s.v.ruolo === 'cg' && s.v.branca === 'R' && s.brand === 'R', 'PP di un Capo Gruppo senza Unità: Branca R scelta, veste Capo Gruppo ('+JSON.stringify(s.v)+')');

// 6 · home vuota senza Unità: invito a indicarla nel profilo
const pb = await person(br, db); const Q = pb.page, evq = (f, a) => Q.evaluate(f, a);
db.addUser('ugo@x.it', 'password123', 'Ugo Rossi');
await Q.goto(base); await evq(() => localStorage.setItem('bussola_tour_v3', '1')); await Q.reload(); await sleep(1500);
await Q.click('#sh-login'); await sleep(300); await Q.fill('#sh-em', 'ugo@x.it'); await Q.fill('#sh-pw', 'password123'); await Q.click('#sh-ago'); await sleep(2000);
await Q.check('input[name="sh-ruolo"][value="cds"]'); await Q.fill('#sh-sez', 'Pesaro'); await Q.click('#sh-psave'); await sleep(1800);
s = await evq(() => ({long: document.querySelectorAll('.sh-long').length, big: document.querySelectorAll('.sh-big').length, txt: document.getElementById('sh-root').innerText}));
ok(s.big === 2 && s.long === 0 && /Indicalo nel profilo/.test(s.txt), 'Commissario senza Unità: due carte grandi, nessuna riga lunga, invito «Indicalo nel profilo»');
const pu = db.t.pee_profili.find(r => r.user_id === db.users[1].id); ok(pu && !(pu.dashboard && pu.dashboard.unita), 'senza Unità non si scrive nessuna Unità in dashboard ('+JSON.stringify(pu && pu.dashboard)+')');

// 7 · regressione: un Capo Unità vede la finestra di sempre, con il menu del ruolo
const pc = await person(br, db); const R = pc.page, evr = (f, a) => R.evaluate(f, a);
db.addUser('lia@x.it', 'password123', 'Lia Blu');
await R.goto(base); await evr(() => localStorage.setItem('bussola_tour_v3', '1')); await R.reload(); await sleep(1500);
await R.click('#sh-login'); await sleep(300); await R.fill('#sh-em', 'lia@x.it'); await R.fill('#sh-pw', 'password123'); await R.click('#sh-ago'); await sleep(2000);
await R.check('input[name="sh-ruolo"][value="cu"]'); await R.check('input[name="sh-branca"][value="L"]'); await R.fill('#sh-sez', 'Pesaro'); await R.dispatchEvent('#sh-sez', 'change'); await sleep(300); await R.selectOption('#sh-grp', '1'); await R.click('#sh-psave'); await sleep(1800);
await R.click('.sh-big >> nth=1'); await sleep(300);
d = await evr(() => ({ruolo: !!document.getElementById('sh-nru'), sel: document.getElementById('sh-nru') && document.getElementById('sh-nru').value, tipo: document.querySelector('input[name="sh-tipo"]:checked').value, radios: [...document.querySelectorAll('input[name="sh-tipo"]')].map(i => i.value), br: document.getElementById('sh-nbr').value}));
ok(d.ruolo && d.sel === 'cu' && d.tipo === 'AN' && d.radios.join() === 'PP,AN' && d.br === 'L', 'Capo Unità: finestra invariata (menu del ruolo, Progetto Personale / Programmazione Annuale, Branca L)');
await evr(() => { document.getElementById('sh-nru').value = 'cg'; shVeste(); });
d = await evr(() => ({brHidden: document.getElementById('sh-nbrw').hidden, ppHidden: document.getElementById('sh-lbl-pp').hidden, t: document.getElementById('sh-lbl-ant').textContent}));
ok(d.brHidden && d.ppHidden && /formativa/.test(d.t), 'Capo Unità che sceglie «Capo Gruppo» nel menu: come prima (formativa, senza Branca)');

ok(!pa.errors.length && !pb.errors.length && !pc.errors.length, 'nessun errore JS' + [pa, pb, pc].flatMap(x => x.errors).slice(0, 3).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
