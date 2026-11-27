// 27/11: calendario dentro i piani (Gruppo, Sezione, Clan): eventi per adulti, «Riservato», tipi per piano, Quadro, sola lettura.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const _arg = process.argv[2] || 'chromium'; const _prof = PROFILES[_arg];
const engine = _prof ? _prof[0] : _arg; const DEV = Object.assign({}, _prof ? _prof[1] : {}); delete DEV.defaultBrowserType; if(engine === 'firefox') delete DEV.isMobile;

process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof2 = (k, nome, ruolo, dash) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:ruolo === 'cu' || ruolo === 'senior' ? 'E' : '', sezione:'Pesaro', gruppo:['cg', 'vcg', 'cu', 'senior'].includes(ruolo) ? 'Pesaro 1' : '', area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof2('cg', 'Carla CG', 'cg'); prof2('cds', 'Dino Commissario', 'cds'); prof2('coords', 'Cora Senior', 'coords'); prof2('snr', 'Sara Senior', 'snr');
const mk = async (k, w) => { const pa = await person(br, db, {ctx:Object.assign({}, DEV, {viewport:(w || !DEV.viewport) ? {width:w || 1280, height:900} : DEV.viewport, acceptDownloads:true})}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2200); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const errs = [];
const crea = async (S, tipo) => { await S.ev(t => pnNuovo(t), tipo); await sleep(400); await S.P.click('#pn-n-ok'); await sleep(2200); };
const tipi = S => S.ev(() => [...document.getElementById('pn-cal-t').parentNode.querySelector('.pn-chips').querySelectorAll('button')].map(b => b.textContent.replace(/^\+ /, '')));
// ── Piano di Gruppo ──
const G = await mk('cg'); G.P.on('pageerror', e => errs.push('cg: ' + e.message));
await crea(G, 'gruppo');
ok(await G.ev(() => !!document.querySelector('#pn-sb-cal') && /Calendario/.test(document.querySelector('#pn-sb-cal').textContent)), 'Piano di Gruppo: voce «Calendario» nel menu');
await G.ev(() => pnSez('cal')); await sleep(500);
ok(await G.ev(() => /Calendario del Gruppo/.test(document.body.textContent) && /Ancora nessun appuntamento/.test(document.body.textContent)), 'calendario vuoto con il titolo giusto');
ok(JSON.stringify(await tipi(G)) === JSON.stringify(['Riunione', 'Uscita', 'Bivacco', 'Campo', 'Altro']), 'Gruppo: tipi senza Consiglio e senza Assemblea (i Consigli di Gruppo stanno nelle Verifiche) · ' + JSON.stringify(await tipi(G)));
await G.ev(() => pnCalAdd('campo')); await sleep(500);
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'titolo', 'Campo estivo', true); pnCalSet(e.id, 'd1', '2027-07-20'); }); await sleep(400);
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'd2', '2027-07-28'); }); await sleep(400);
ok(await G.ev(() => PN.d.cal.length === 1 && PN.d.cal[0].tipo === 'campo' && PN.d.cal[0].d1 === '2027-07-20' && PN.d.cal[0].d2 === '2027-07-28' && PN.d.cal[0].ris === false), 'evento aggiunto con titolo e date');
ok(await G.ev(() => /Sale al calendario della Sezione/.test(document.getElementById('pn-ces-' + PN.d.cal[0].id).textContent)), 'un campo con data sale al calendario della Sezione');
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'ris', true); }); await sleep(300);
ok(await G.ev(() => /Riservato: resta nel piano/.test(document.getElementById('pn-ces-' + PN.d.cal[0].id).textContent) && PN.d.cal[0].ris === true), 'Riservato: non sale');
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'ris', false); pnCalSet(e.id, 'tipo', 'riunione'); }); await sleep(300);
ok(await G.ev(() => /Le riunioni restano nel calendario del piano/.test(document.getElementById('pn-ces-' + PN.d.cal[0].id).textContent)), 'una riunione non sale');
ok(await G.ev(() => { const e = PN.d.cal[0]; const s = document.getElementById('pn-cem-' + e.id); return !!s && [...s.options].map(o => o.textContent).join('|') === 'Da decidere|In presenza|Online' && s.value === '' && e.modo === ''; }), 'riunione: tendina «presenza / online», di default «Da decidere»');
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'modo', 'online'); }); await sleep(300);
ok(await G.ev(() => PN.d.cal[0].modo === 'online' && document.getElementById('pn-cem-' + PN.d.cal[0].id).value === 'online'), 'riunione: «Online» salvato nel piano');
await G.ev(() => { pnCalSet(PN.d.cal[0].id, 'modo', 'boh'); }); await sleep(200);
ok(await G.ev(() => PN.d.cal[0].modo === 'online'), 'valore non valido: ignorato');
await G.ev(() => { pnCalSet(PN.d.cal[0].id, 'tipo', 'uscita'); }); await sleep(300);
ok(await G.ev(() => !document.getElementById('pn-cem-' + PN.d.cal[0].id)), 'uscita: nessuna tendina presenza/online');
await G.ev(() => { pnCalSet(PN.d.cal[0].id, 'tipo', 'riunione'); }); await sleep(300);
ok(await G.ev(() => document.getElementById('pn-cem-' + PN.d.cal[0].id).value === 'online'), 'cambiando tipo e tornando a riunione, la scelta resta');
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'tipo', 'uscita'); pnCalSet(e.id, 'd2', '2027-07-10'); }); await sleep(300);
ok(await G.ev(() => !!document.querySelector('#pn-ce-' + PN.d.cal[0].id + ' [role=alert]')), 'data di fine prima dell’inizio: avviso');
await G.ev(() => { const e = PN.d.cal[0]; pnCalSet(e.id, 'd2', ''); pnCalSet(e.id, 'd1', '2027-01-15'); pnCalSet(e.id, 'titolo', 'Uscita di Gruppo', true); }); await sleep(300);
await G.ev(() => pnCalAdd('altro', 'Riunione dei genitori')); await sleep(300);
ok(await G.ev(() => PN.d.cal.length === 2 && PN.d.cal[1].titolo === 'Riunione dei genitori' && PN.d.cal[1].d1 === ''), 'suggerimento: aggiunto senza data');
ok(await G.ev(() => !/Riunione dei genitori ·/.test([...document.querySelectorAll('.pn-chips button')].map(b => b.textContent).join('|'))), 'il suggerimento già aggiunto non si ripropone');
await sleep(1800);
const pg = db.t.pee_piani.find(p => p.tipo === 'gruppo');
ok(pg.data.cal.length === 2 && pg.data.cal[0].titolo === 'Uscita di Gruppo' && pg.data.cal[0].d1 === '2027-01-15', 'salvato nel database dentro i dati del piano');
// Quadro: l'evento compare nel mese
await G.ev(() => { pnObAdd(); PN.d.obiettivi[0].testo = 'Un obiettivo'; PN.qf = {vista:'cal', anno:1}; pnSez('qua'); }); await sleep(600);
ok(await G.ev(() => { const t = document.querySelector('.pn-cal'); return !!t && /Uscita: Uscita di Gruppo/.test(t.textContent); }), 'il Quadro mostra l’evento nel suo mese');
// eliminazione
await G.ev(() => { pnSez('cal'); }); await sleep(300);
await G.ev(() => { window.confirm = () => true; pnCalDel(PN.d.cal[1].id); }); await sleep(300);
ok(await G.ev(() => PN.d.cal.length === 1), 'eliminazione');
// i dati vecchi (senza «cal») si aprono lo stesso
await G.ev(() => pnBack()); await sleep(1200); { const r = db.t.pee_piani.find(p => p.id === pg.id); r.data = Object.assign({}, r.data); delete r.data.cal; } await G.ev(id => pnOpen(id), pg.id); await sleep(1900); await G.ev(() => pnSez('cal')); await sleep(400);
ok(await G.ev(() => Array.isArray(PN.d.cal) && PN.d.cal.length === 0 && /Ancora nessun appuntamento/.test(document.body.textContent)), 'piano senza «cal» nei dati: si apre vuoto, senza errori');
await G.pa.ctx.close();
// ── Progetto di Sezione ──
const C = await mk('cds'); C.P.on('pageerror', e => errs.push('cds: ' + e.message));
await crea(C, 'sezione'); await C.ev(() => pnSez('cal')); await sleep(500);
ok(JSON.stringify(await tipi(C)) === JSON.stringify(['Riunione', 'Uscita', 'Bivacco', 'Campo', 'Consiglio di Sezione', 'Assemblea', 'Altro']), 'Sezione: Consiglio di Sezione e Assemblea · ' + JSON.stringify(await tipi(C)));
ok(await C.ev(() => /Calendario della Sezione/.test(document.body.textContent)), 'titolo: Calendario della Sezione');
await C.ev(() => pnCalAdd('assemblea', 'Assemblea di Sezione')); await sleep(300); await C.ev(() => pnCalSet(PN.d.cal[0].id, 'd1', '2027-03-20')); await sleep(2000);
ok(db.t.pee_piani.find(p => p.tipo === 'sezione').data.cal[0].tipo === 'assemblea', 'Assemblea salvata');
await C.pa.ctx.close();
// ── Progetto di Clan ──
const K = await mk('coords'); K.P.on('pageerror', e => errs.push('coords: ' + e.message));
await crea(K, 'clan'); await K.ev(() => pnSez('cal')); await sleep(500);
ok(JSON.stringify(await tipi(K)) === JSON.stringify(['Riunione', 'Uscita', 'Bivacco', 'Campo', 'Consiglio di Clan', 'Altro']), 'Clan: Consiglio di Clan, senza Assemblea · ' + JSON.stringify(await tipi(K)));
ok(await K.ev(() => /Appuntamenti tipici/.test(document.body.textContent) && /Consiglio di Clan · Promemoria, non un obbligo: almeno ogni 2 mesi/.test(document.body.textContent) && /Riunione di tutti i Senior/.test(document.body.textContent) && /Incontro di primavera/.test(document.body.textContent)), 'Clan: gli appuntamenti tipici delle fonti');
await K.ev(() => pnCalAdd('consiglio', 'Consiglio di Clan')); await sleep(300);
ok(await K.ev(() => PN.d.cal[0].tipo === 'consiglio'), 'Consiglio di Clan creato');
await sleep(1800);
// sola lettura: il Senior che legge il Progetto di Clan deliberato
const pc = db.t.pee_piani.find(p => p.tipo === 'clan'); pc.stato = 'deliberato'; pc.data.cal[0].d1 = '2027-02-10';
await K.pa.ctx.close();
const S = await mk('snr'); S.P.on('pageerror', e => errs.push('snr: ' + e.message));
await S.ev(id => pnOpen(id), pc.id); await sleep(2000); await S.ev(() => pnSez('cal')); await sleep(500);
ok(await S.ev(() => PN.ruolo === 'lettore' && /Consiglio di Clan/.test(document.body.textContent) && [...document.querySelectorAll('#pn-cal-t ~ * input, #pn-cal-t ~ * select, #pn-cal-t ~ * textarea')].every(x => x.disabled) && !document.querySelector('.pn-chips button[onclick^="pnCalAdd"]')), 'Senior (lettore): vede il calendario del Clan, senza poter modificare né aggiungere');
await S.pa.ctx.close();
ok(errs.length === 0, 'nessun errore di pagina (' + errs.join(' · ') + ')');
await br.close(); process.exit(summary() ? 1 : 0);
