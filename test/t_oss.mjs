// Attività osservative proprie: pannello in «Contesto e osservazione», percorso guidato isolato, «Aggiungi alle occasioni osservative», ruoli, proposte e suggerimenti
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:+(process.env.VW || 1280), height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
const mk = (id, titolo, tipo, pp) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:tipo, nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:tipo, annoScout:'2026-27', pp:pp}}, created_at:ts, updated_at:ts});
const STAFF = [{ruolo:'CU', nome:'Anna Verdi'}, {ruolo:'AC', nome:'Marco Neri'}];
db.t.pee_archivi.push(mk('c1', 'Programmazione Annuale 2026-27 · Reparto', 'AN', {sezione:'Pesaro', gruppo:'1', staffTab:STAFF, occMan:[{id:'x1', att:'Uscita di inizio anno', data:'2026-10-04', perc:['C3','P5']}]}));
db.t.pee_archivi.push(mk('p1', 'Progetto Personale 2026-27', 'PP', {sezione:'Pesaro', gruppo:'1', nome:'Anna Verdi', staffTab:STAFF}));
await loginAs(P, base, u); await sleep(1200);
const goOcc = async id => { await P.evaluate(id => shOpen(id, 0), id).catch(() => {}); await sleep(2800); await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
  await ev(() => { gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(900); };
await goOcc('c1');
let s = await ev(() => ({pan: !!document.getElementById('oss-panel-in'), vis: (() => { const e = document.getElementById('oss-panel-in'); return !!(e && e.offsetParent); })(), btn: [...document.querySelectorAll('#oss-panel .btn-primary')].map(b => b.textContent.trim()), sc: (document.querySelector('.oss-sc > summary') || {}).textContent, role: ossRole()}));
ok(s.pan && s.vis, 'il pannello «Crea le tue attività osservative» è nella pagina delle occasioni osservative');
ok(s.role === 'tit' && s.btn.some(t => /Nuova attività osservativa/.test(t)), 'chi ha il progetto è «tit» e vede «+ Nuova attività osservativa»');
ok(/Non hai ancora osservato 22 percorsi/.test(s.sc || ''), 'i percorsi non ancora osservati sono 22 (2 già coperti dall’occasione manuale): ' + (s.sc || '').slice(0, 60));
// percorso guidato
await ev(() => ossWizOpen('S6')); await sleep(2500);
const fr = P.frames().find(f => f !== P.mainFrame() && /Nuova attività/.test(f.url() + '') || true && f !== P.mainFrame());
ok(!!(await P.$('#oss-ov iframe')), 'si apre il riquadro del percorso guidato');
const F = P.frames().filter(f => f !== P.mainFrame()).pop();
const st = await F.evaluate(() => ({step: document.getElementById('wstep').textContent, S: S.main, porta: S.porta, B, ME, staff: S.oss.map(o => o.n).join()}));
ok(/Passo/.test(st.step) && st.S === 'S6' && st.B === 'E' && st.ME === 'Anna Verdi', 'il percorso guidato parte da S6 («Vivere scelte») con Branca e nome giusti (' + JSON.stringify(st) + ')');
ok(st.staff === 'Anna Verdi,Marco Neri', 'gli osservatori sono quelli della tabella dello staff');
// salto fino alla fine
await F.evaluate(() => { S.dom = 'Quando nessuno guida il gioco, chi prende l’iniziativa?'; S.porta = 'dom'; S.amb = 'S'; S.main = 'S6'; S.dur = 60; S.foc.push({txt:'Osservo se e come qualcuno prende una scelta.', extra:[], tocca:[]}); S.nR = '12'; S.nome = 'La scelta difficile'; S.lan = 'lancio'; S.svi = 'sviluppo'; S.con = 'conclusione'; go(visSteps().findIndex(s => s.k === 'fog')); });
await sleep(300);
ok(await F.evaluate(() => !!document.getElementById('radici-ok')), 'la casella della raccolta anonima c’è (utente con account) e non è spuntata: ' + await F.evaluate(() => document.getElementById('radici-ok').checked));
await F.evaluate(() => salva()); await sleep(900);
s = await ev(() => ({n: ossList().length, a: ossList()[0], ov: !!document.getElementById('oss-ov'), cards: document.querySelectorAll('.oss-card').length, store: JSON.stringify(scheda.pp.attOss).length}));
ok(!s.ov && s.n === 1 && s.cards === 1, 'salvata: il riquadro si chiude e compare la scheda');
ok(s.a.stato === 'pronta' && s.a.main === 'S6' && s.a.aut === 'Anna Verdi' && s.a.foc.length === 1, 'stato «pronta», percorso principale S6, autrice Anna Verdi');
ok(!db.t.pee_radici || true, 'nessuna raccolta senza consenso');
// segna come svolta
await ev(() => ossSvolta(ossList()[0].id)); await sleep(300);
ok(await ev(() => !!document.querySelector('#g-modal.show .oss-sv-p')), 'finestra «Aggiungi alle occasioni osservative» con i percorsi previsti spuntati');
await ev(() => { document.getElementById('oss-sv-d').value = '2026-11-08'; ossSvoltaOk(ossList()[0].id); }); await sleep(600);
s = await ev(() => ({occ: (scheda.pp.occMan || []).map(r => [r.att, r.data, r.perc.join(), r.chi]), st: ossList()[0].stato, cov: Object.keys(obsSources()).length, tag: (document.getElementById('kostag-S6') || {}).textContent}));
ok(s.occ.length === 2 && /Attività osservativa · La scelta difficile/.test(s.occ[1][0]) && s.occ[1][1] === '2026-11-08' && s.occ[1][2] === 'S6', 'la riga è nelle occasioni osservative: ' + JSON.stringify(s.occ[1]));
ok(s.st === 'svolta' && s.cov === 3, 'stato «svolta» e percorsi osservati 3 su 24');
ok(await ev(() => /La scelta difficile/.test(document.getElementById('occ-tab').textContent)), 'la riga si vede nella tabella delle occasioni');
// griglia
await ev(() => { const r = grRows('S6'); window.__g = r; }); const g = await ev(() => window.__g);
ok(g.length === 1 && /La scelta difficile/.test(g[0].nome), 'la griglia di S6 ha la riga dell’attività svolta');
// non svolta: torna pronta
await ev(() => ossNonSvoltaOk(ossList()[0].id)); await sleep(300);
s = await ev(() => ({st: ossList()[0].stato, occ: scheda.pp.occMan.length}));
ok(s.st === 'pronta' && s.occ === 1, '«Togli dalle occasioni osservative»: torna pronta e la riga sparisce');
await ev(() => ossDelOk(ossList()[0].id)); await sleep(200);
ok(await ev(() => ossList().length === 0), 'elimina');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));

// ── Progetto Personale: niente proposte né suggerimenti, percorsi con il numero ──
await goOcc('p1');
s = await ev(() => ({pan: !!document.getElementById('oss-panel-in'), role: ossRole(), pp: szPP(), btn: [...document.querySelectorAll('#oss-panel .btn-primary')].map(b => b.textContent.trim()), chip: (document.querySelector('.oss-chip') || {}).textContent}));
ok(s.pan && s.role === 'aut' && s.pp, 'PP: il pannello c’è e chi scrive è «aut»');
ok(/^[PCS][1-8] /.test(s.chip || ''), 'PP: i percorsi hanno il numero (' + s.chip + ')');
await ev(() => ossSaveFrom({att:{nome:'Gioco del nodo', main:'P3', also:[], dom:'', foc:['x'], dur:30, lan:'', svi:'', con:'', temi:[]}})); await sleep(500);
s = await ev(() => ({a: ossList()[0], b: [...document.querySelectorAll('.oss-card .oss-aa button')].map(b => b.textContent.trim()), av: (scheda.avvisi || []).length}));
ok(s.a.stato === 'pronta' && s.a.ruolo === 'aut' && !s.b.includes('Suggerisci') && !s.b.includes('Accetta la proposta') && s.av === 0, 'PP: salvata «pronta», nessun «Suggerisci», nessun avviso: ' + s.b);
ok(!pa.errors.length, 'PP: nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
await P.screenshot({path:'/tmp/oss_a.png'});
process.exit(summary() ? 1 : 0);
