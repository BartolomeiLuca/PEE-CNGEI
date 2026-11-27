// 27/11: pagina «Calendari»: il calendario della Sezione (somma di piani e Unità, sola lettura) e i calendari dei piani.
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
const U = {}; const prof2 = (k, nome, ruolo, sez, gr, dash, brn) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:brn || '', sezione:sez || 'Pesaro', gruppo:gr || '', area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof2('cg', 'Carla CG', 'cg', 'Pesaro', 'Pesaro 1'); prof2('cg2', 'Gigi CG', 'cg', 'Pesaro', 'Pesaro 2'); prof2('cds', 'Dino Commissario', 'cds'); prof2('coords', 'Cora Senior', 'coords'); prof2('snr', 'Sara Senior', 'snr');
prof2('cu', 'Ugo CU', 'cu', 'Pesaro', 'Pesaro 1', {}, 'E'); prof2('cgF', 'Fabio CG', 'cg', 'Fano', 'Fano 1'); prof2('vol', 'Vol Volontario', 'volontario', 'Pesaro', 'Pesaro 1'); prof2('tes', 'Tina Tesoriera', 'tes');
const now = new Date().toISOString();
const push = (id, own, tipo, anno, d, tit) => db.t.pee_piani.push({id, owner_id:U[own].id, owner_email:own + '@x.it', tipo, titolo:tit, anno_inizio:anno, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:now, created_at:now, data:d});
const e = (id, tipo, titolo, d1, d2, extra) => Object.assign({id, tipo, titolo, d1, d2:d2 || '', ris:false, nota:'NOTA SEGRETA'}, extra || {});
push('g1', 'cg', 'gruppo', 2026, {cal:[e('a', 'uscita', 'Uscita di Gruppo', '2027-05-15'), e('b', 'riunione', 'Riunione di staff', '2027-02-01'), e('c', 'campo', 'Campo estivo', '2027-07-20', '2027-07-28'), e('d', 'altro', 'Evento riservato', '2027-03-03', '', {ris:true})], tappe:[]}, 'Piano di Gruppo · Pesaro 1');
push('g2', 'cg2', 'gruppo', 2026, {cal:[e('a', 'uscita', 'Uscita di Pesaro 2', '2027-05-16')], tappe:[]}, 'Piano di Gruppo · Pesaro 2');
push('s1', 'cds', 'sezione', 2026, {cal:[e('a', 'assemblea', 'Assemblea di Sezione', '2027-03-20'), e('b', 'consiglio', 'Consiglio di Sezione', '2027-01-09')]}, 'Progetto di Sezione · Pesaro');
push('c1', 'coords', 'clan', 2026, {cal:[e('a', 'consiglio', 'Consiglio di Clan', '2027-02-10')]}, 'Progetto di Clan · Pesaro');
push('f1', 'cgF', 'gruppo', 2026, {cal:[e('a', 'campo', 'Campo di Fano', '2027-07-20')]}, 'Piano di Gruppo · Fano');
db.t.pee_archivi.push({id:'ar1', user_id:U.cu.id, anno:2026, titolo:'Reparto Aquile 2026-27', meta:{mode:'unita', anno:2026}, updated_at:now, data:{UNIT_NAME:'Reparto Aquile', scheda:{uscite:{u1:{id:'u1', modello:'giorno', testo:'Uscita al mare', ax:{data:'2027-04-10', durata:'1'}, dest:'unita'}, u2:{id:'u2', modello:'giorno', testo:'Uscita riservata', ax:{data:'2027-04-11'}, dest:'unita', risSez:true}, u3:{id:'u3', modello:'sede', testo:'Riunione', ax:{data:'2027-04-12'}, dest:'unita'}}}}});
const errs = [];
const mk = async (k, w) => { const pa = await person(br, db, {ctx:Object.assign({}, DEV, {viewport:(w || !DEV.viewport) ? {width:w || 1280, height:900} : DEV.viewport, acceptDownloads:true})}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); pa.page.on('pageerror', x => errs.push(k + ': ' + x.message)); await loginAs(pa.page, base, U[k]); await sleep(2200); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const apri = async S => { await S.ev(() => calsOpen()); await sleep(1800); };
const righe = S => S.ev(() => [...document.querySelectorAll('#cs-t')].length ? [...document.getElementById('cs-t').parentNode.querySelectorAll('.pn-row b')].map(b => b.textContent) : []);
// ── Commissario ──
let S = await mk('cds');
ok(await S.ev(() => /Il calendario della Sezione/.test((document.getElementById('sh-piani') || {}).textContent || '') && !!document.querySelector('#sh-piani button[onclick="calsOpen()"]')), 'home: la card «Calendari» con il pulsante');
await S.P.click('#sh-piani button[onclick="calsOpen()"]'); await sleep(1800);
ok(await S.ev(() => SH.view === 'calendari' && /Calendario della Sezione/.test(document.body.textContent)), 'si apre la pagina Calendari');
const r1 = await righe(S);
ok(JSON.stringify(r1) === JSON.stringify(['Uscita al mare', 'Consiglio di Sezione', 'Consiglio di Clan', 'Assemblea di Sezione']) === false && r1.includes('Uscita al mare') && r1.includes('Uscita di Gruppo') && r1.includes('Assemblea di Sezione') && r1.includes('Consiglio di Clan') && r1.includes('Campo estivo'), 'somma di Gruppo, Sezione, Clan e Unità · ' + JSON.stringify(r1));
ok(!r1.some(t => /Riunione|riservat|Riservat|Fano/.test(t)) && !(await S.ev(() => /NOTA SEGRETA/.test(document.body.textContent))), 'niente riunioni, riservati, altre Sezioni, note');
ok(JSON.stringify(r1) === JSON.stringify(['Consiglio di Sezione', 'Consiglio di Clan', 'Assemblea di Sezione', 'Uscita al mare', 'Uscita di Gruppo', 'Uscita di Pesaro 2', 'Campo estivo']), 'in ordine di data · ' + JSON.stringify(r1));
ok(await S.ev(() => /Da guardare/.test(document.body.textContent) && /Uscita di Gruppo/.test(document.querySelector('.sh-msg[role=note]').textContent) && /Uscita di Pesaro 2/.test(document.querySelector('.sh-msg[role=note]').textContent)), 'stesso fine settimana di Gruppi diversi: «Da guardare»');
ok(await S.ev(() => /Reparto Aquile · Pesaro 1/.test(document.body.textContent) && /Esploratori|Reparto Aquile/.test(document.body.textContent)), 'l’Unità: nome e Gruppo');
ok(await S.ev(() => /Consiglio di Sezione/.test(document.body.textContent) && !/Consiglio di Unità/.test(document.body.textContent)), 'etichetta del Consiglio secondo l’origine');
await S.ev(() => calsF('g:pesaro 2')); await sleep(300);
ok(JSON.stringify(await righe(S)) === JSON.stringify(['Uscita di Pesaro 2']), 'filtro per Gruppo');
await S.ev(() => calsF('all')); await sleep(200);
await S.ev(() => calsAnno(2027)); await sleep(1200);
ok(await S.ev(() => /Nessun appuntamento pubblicato per 2027/.test(document.body.textContent)), 'anno scout seguente: nessun appuntamento, messaggio chiaro');
await S.ev(() => calsAnno(2026)); await sleep(1200);
ok(await S.ev(() => /Progetto di Sezione · Pesaro/.test(document.getElementById('cm-t').parentNode.textContent) && /Assemblea: Assemblea di Sezione/.test(document.getElementById('cm-t').parentNode.textContent) && /Consiglio di Sezione:/.test(document.getElementById('cm-t').parentNode.textContent)), 'i calendari dei tuoi piani, con i prossimi appuntamenti');
await S.ev(() => document.querySelector('#cm-t').parentNode.querySelector('button').click()); await sleep(2200);
ok(await S.ev(() => SH.view === 'piano' && !!document.getElementById('pn-cal-t')), 'dal calendario si arriva al Calendario del piano');
await S.pa.ctx.close();
// ── Capo Gruppo: vede il suo e quelli degli altri ──
S = await mk('cg'); await apri(S); const rg = await righe(S);
ok(rg.includes('Uscita al mare') && rg.includes('Consiglio di Clan') && rg.length === 7, 'Capo Gruppo: tutta la Sezione (' + rg.length + ')');
ok(await S.ev(() => /Piano di Gruppo · Pesaro 1/.test(document.getElementById('cm-t').parentNode.textContent) && !/Pesaro 2/.test(document.getElementById('cm-t').parentNode.textContent.replace(/\s+/g, ' ').split('Uscita')[0] || '')), 'Capo Gruppo: il suo Piano nei suoi calendari');
await S.pa.ctx.close();
// ── Senior: solo il Clan ──
S = await mk('snr'); await apri(S);
ok(JSON.stringify(await righe(S)) === JSON.stringify(['Consiglio di Clan']) && await S.ev(() => /Come Senior vedi gli appuntamenti del Clan/.test(document.body.textContent)), 'Senior: solo gli appuntamenti del Clan');
await S.pa.ctx.close();
// ── Capo Unità, Tesoriere, Coordinatore: leggono ──
for(const k of ['cu', 'tes', 'coords']){ S = await mk(k); await apri(S); ok((await righe(S)).length === 7, k + ': legge il calendario della Sezione'); await S.pa.ctx.close(); }
// ── Volontario: nessuna card ──
S = await mk('vol'); ok(await S.ev(() => !/Il calendario della Sezione/.test((document.getElementById('sh-piani') || {}).textContent || '')), 'Adulto in formazione: nessun calendario della Sezione in home'); await S.pa.ctx.close();
// ── database non aggiornato ──
db.sqlCal = false; S = await mk('cds'); await apri(S);
ok(await S.ev(() => /sarà disponibile dopo l’aggiornamento del database/.test(document.body.textContent) && /Assemblea/.test(document.getElementById('cm-t').parentNode.textContent)), 'database non aggiornato: messaggio chiaro, i calendari dei piani restano'); await S.pa.ctx.close();
ok(errs.length === 0, 'nessun errore di pagina (' + errs.join(' · ') + ')');
await br.close(); process.exit(summary() ? 1 : 0);
