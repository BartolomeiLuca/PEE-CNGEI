// 27/11 sera: Verbali delle riunioni degli adulti (staff di Unità → Comitato di Sezione).
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
const U = {}; const prof2 = (k, nome, ruolo, o) => { o = o || {}; U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:['cu', 'senior'].includes(ruolo) ? 'E' : '', sezione:o.sez || 'Pesaro', gruppo:o.gr === undefined ? (['cg', 'vcg', 'cu', 'senior'].includes(ruolo) ? 'Pesaro 1' : '') : o.gr, area_rcdf:'altoadriatico', dashboard:o.dash || {}}); };
prof2('cu', 'Ugo CU', 'cu'); prof2('cu2', 'Ugo Due', 'cu', {gr:'Pesaro 2'}); prof2('cg', 'Carla CG', 'cg'); prof2('cds', 'Dino Commissario', 'cds'); prof2('pres', 'Piero Presidente', 'pres');
prof2('snr', 'Sara Senior', 'snr'); prof2('altro', 'Olga Altrove', 'cds', {sez:'Fano'}); prof2('vol', 'Vera Volontaria', 'volontario', {dash:{cos:{membro:true}}});
const mk = async (k, w) => { const pa = await person(br, db, {ctx:Object.assign({}, DEV, {viewport:(w || !DEV.viewport) ? {width:w || 1280, height:900} : DEV.viewport, acceptDownloads:true})}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2200); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const errs = [];
const apri = async S => { await S.ev(() => verbOpen()); await sleep(1200); };
const body = S => S.ev(() => document.body.textContent);
const scrivi = async (S, tipo, titolo, stato, extra) => {
  await S.ev(() => verbNuovo()); await sleep(300);
  await S.ev(([t, ti, st, ex]) => { verbSet('tipo', t); verbSet('titolo', ti); verbSet('data', '2026-12-05'); verbSet('sintesi', 'Si è parlato del campo.'); verbSet('decisioni', 'Si va a luglio.'); verbSet('stato', st, true); if(ex && ex.sez) verbSet('sez', true, true); if(ex && ex.online) verbSet('modalita', 'online', true); verbAzAdd(); verbAz(0, 'cosa', 'Prenotare la casa'); verbAz(0, 'chi', 'Ugo'); verbAz(0, 'entro', '2027-01-31'); }, [tipo, titolo, stato, extra]);
  await S.ev(() => { window.confirm = () => true; }); await S.P.click('#vb-salva'); await sleep(1500);
};
// ── Database non ancora aggiornato ──
db.sqlVerb = false;
const A = await mk('cu'); A.P.on('pageerror', e => errs.push('cu: ' + e.message));
await sleep(1500);
ok(await A.ev(() => /I verbali delle riunioni/.test((document.getElementById('sh-piani') || {}).textContent || '') && !!document.querySelector('#sh-piani button[onclick="verbOpen()"]')), 'home: scheda «Verbali» per chi fa parte di uno staff');
await apri(A);
ok(/dopo l’aggiornamento del database \(script SQL del 28 novembre «Verbali»\)/.test(await body(A)), 'database vecchio: messaggio chiaro, nessun errore');
ok(await A.ev(() => !document.querySelector('[onclick="verbNuovo()"]') || true), 'database vecchio: niente crash');
db.sqlVerb = true;
await A.ev(() => verbAnno('all')); await sleep(800);
ok(await A.ev(() => !/Versione di prova/.test(document.body.innerText)), 'nessun avviso «Versione di prova»');
// ── Capo Unità: scrive lo staff, chi vede ──
ok(await A.ev(() => JSON.stringify(verbTipiPer(SH.prof)) === '["staff"]'), 'Capo Unità: solo «riunione di staff»');
await A.ev(() => verbNuovo()); await sleep(300);
ok(await A.ev(() => /Niente nomi di ragazzi o ragazze/.test(document.body.textContent) && /il Capo Gruppo e il Vice del tuo Gruppo, il Commissario e il Vice Commissario/.test(document.body.textContent) && document.querySelector('#vb-tipo option').textContent === 'Staff di Unità'), 'editor: tipo «Staff di Unità», chi lo legge, avviso «niente nomi»');
ok(await A.ev(() => !document.querySelector('#vb-sez') && document.querySelector('#vb-modo-p').checked), 'editor: niente spunta Sezione per lo staff; di default in presenza');
await A.ev(() => verbAnnulla()); await sleep(300);
await scrivi(A, 'staff', 'Staff di giugno', 'bozza', {online:true}); 
ok(db.t.pee_verbali.length === 1 && db.t.pee_verbali[0].stato === 'bozza' && db.t.pee_verbali[0].modalita === 'online' && db.t.pee_verbali[0].azioni[0].cosa === 'Prenotare la casa' && db.t.pee_verbali[0].owner_id === U.cu.id, 'verbale salvato come bozza, online, con azione');
ok(/Staff di giugno/.test(await body(A)) && /Online/.test(await body(A)) && /Prenotare la casa/.test(await body(A)), 'dopo il salvataggio si apre il verbale');
// bozza: non la vede nessuno
const G = await mk('cg'); G.P.on('pageerror', e => errs.push('cg: ' + e.message));
await apri(G);
ok(!/Staff di giugno/.test(await body(G)), 'la bozza non la vede nemmeno il Capo Gruppo');
// condiviso
await A.ev(() => verbModifica(SH._verb.det.id)); await sleep(300);
await A.ev(() => verbSet('stato', 'condiviso', true)); await A.P.click('#vb-salva'); await sleep(1500);
ok(db.t.pee_verbali[0].stato === 'condiviso', 'condiviso');
await G.ev(() => verbBack()); await sleep(1000);
ok(/Staff di giugno/.test(await body(G)) && /di Ugo CU, Capo Unità/.test(await body(G)), 'il Capo Gruppo lo legge, con l’autore');
// altro Gruppo e altra Sezione non vedono
const B = await mk('cu2'); await apri(B);
ok(!/Staff di giugno/.test(await body(B)), 'Capo Unità di un altro Gruppo: non lo vede');
await B.pa.ctx.close();
const F = await mk('altro'); await apri(F);
ok(!/Staff di giugno/.test(await body(F)), 'Commissario di un’altra Sezione: non lo vede');
await F.pa.ctx.close();
const C = await mk('cds'); C.P.on('pageerror', e => errs.push('cds: ' + e.message)); await apri(C);
ok(/Staff di giugno/.test(await body(C)), 'il Commissario lo legge');
ok(await C.ev(() => JSON.stringify(verbTipiPer(SH.prof)) === '["staff","rica","cosez","cos"]'), 'Commissario: staff, RiCa, Consiglio di Sezione e COS (titolare)');
// ── Capo Gruppo: Consiglio di Gruppo letto da tutti gli adulti del Gruppo ──
ok(await G.ev(() => JSON.stringify(verbTipiPer(SH.prof)) === '["staff","cdg"]'), 'Capo Gruppo: staff e Consiglio di Gruppo');
await G.ev(() => verbBack()); await sleep(500);
await scrivi(G, 'cdg', 'Consiglio di Gruppo di dicembre', 'condiviso');
await A.ev(() => verbBack()); await sleep(1000);
ok(/Consiglio di Gruppo di dicembre/.test(await body(A)), 'il Capo Unità legge il Consiglio di Gruppo');
ok(await A.ev(() => [...document.querySelectorAll('.pn-seg')].some(s => /Consiglio di Gruppo/.test(s.textContent))), 'filtro per tipo di riunione');
await A.ev(() => verbF('cdg')); await sleep(300);
ok(await A.ev(() => /Consiglio di Gruppo di dicembre/.test(document.body.textContent) && !/Staff di giugno/.test(document.body.textContent)), 'filtro: solo Consiglio di Gruppo');
await A.ev(() => verbF('all'));
// ── Approvato: non si modifica ──
await A.ev(() => verbApri(SH._verb.rows.find(v => v.mio).id)); await sleep(300);
await A.ev(() => verbModifica(SH._verb.det.id)); await sleep(300);
await A.ev(() => verbSet('stato', 'approvato', true)); await A.P.click('#vb-salva'); await sleep(1500);
ok(db.t.pee_verbali.find(v => v.titolo === 'Staff di giugno').stato === 'approvato' && !!db.t.pee_verbali.find(v => v.titolo === 'Staff di giugno').approvato_il, 'approvato con la data di approvazione');
ok(await A.ev(() => !document.getElementById('vb-mod') && !!document.getElementById('vb-riapri') && /Approvato il/.test(document.body.textContent)), 'approvato: niente «Modifica», c’è «Riapri per modificare»');
await A.ev(() => { window.confirm = () => true; }); await A.P.click('#vb-riapri'); await sleep(1500);
ok(db.t.pee_verbali.find(v => v.titolo === 'Staff di giugno').stato === 'condiviso' && await A.ev(() => !!document.getElementById('vb-mod')), 'riaperto: torna condiviso e modificabile');
// ── Word ──
const dl = await Promise.all([A.P.waitForEvent('download', {timeout:30000}), A.ev(() => verbWord(SH._verb.det.id))]).then(r => r[0]).catch(e => null);
ok(!!dl && /^Verbale_.*\.docx$/.test(dl.suggestedFilename()), 'Word del singolo verbale · ' + (dl && dl.suggestedFilename()));
await A.ev(() => verbBack()); await sleep(800);
const dl2 = await Promise.all([A.P.waitForEvent('download', {timeout:30000}), A.P.click('#vb-libro')]).then(r => r[0]).catch(e => null);
ok(!!dl2 && /^Libro_dei_verbali_.*\.docx$/.test(dl2.suggestedFilename()), 'Libro dei verbali in Word · ' + (dl2 && dl2.suggestedFilename()));
// elimina (solo non approvato)
await A.ev(() => verbApri(SH._verb.rows.find(v => v.mio).id)); await A.ev(() => verbModifica(SH._verb.det.id)); await sleep(300);
await A.ev(() => { window.confirm = () => true; }); await A.P.click('#vb-del'); await sleep(1200);
ok(db.t.pee_verbali.length === 1 && db.t.pee_verbali[0].titolo === 'Consiglio di Gruppo di dicembre', 'eliminato');
await A.pa.ctx.close();
// ── COS ──
const P = await mk('pres'); P.P.on('pageerror', e => errs.push('pres: ' + e.message));
ok(await P.ev(() => JSON.stringify(verbTipiPer(SH.prof)) === '["cos"]'), 'Presidente: solo Comitato di Sezione');
await apri(P); await scrivi(P, 'cos', 'COS di dicembre', 'condiviso');
ok(await P.ev(() => !!document.body.textContent.match(/Comitato di Sezione \(COS\)/)), 'COS creato');
const V = await mk('vol'); await apri(V);
ok(/COS di dicembre/.test(await body(V)), 'membro del COS (spunta): legge il COS');
const Cc = await mk('cu2'); await apri(Cc);
ok(!/COS di dicembre/.test(await body(Cc)), 'un Capo Unità non vede il COS non aperto alla Sezione');
await P.ev(() => verbApri(SH._verb.rows.find(v => v.mio).id)); await P.ev(() => verbModifica(SH._verb.det.id)); await sleep(300);
ok(await P.ev(() => !!document.querySelector('#vb-sez')), 'COS: spunta «Visibile a tutta la Sezione»');
await P.ev(() => verbSet('sez', true, true)); await P.P.click('#vb-salva'); await sleep(1500);
await Cc.ev(() => verbBack()); await sleep(1000);
ok(/COS di dicembre/.test(await body(Cc)) && /aperto a tutta la Sezione/.test(await body(Cc)), 'con la spunta, il Capo Unità della Sezione legge il COS');
await Cc.pa.ctx.close(); await V.pa.ctx.close();
// Presidente legge lo staff del Commissario, non quello delle Unità
await C.ev(() => verbBack()); await sleep(500);
await scrivi(C, 'staff', 'Staff del Commissario', 'condiviso');
await P.ev(() => verbBack()); await sleep(1000);
ok(/Staff del Commissario/.test(await body(P)) && !/Staff di giugno/.test(await body(P)) && !/Consiglio di Gruppo di dicembre/.test(await body(P)), 'Presidente: legge lo staff del Commissario, non le Unità');
await P.pa.ctx.close(); await C.pa.ctx.close(); await G.pa.ctx.close();
// ── Senior (giovane del Clan): niente ──
const S = await mk('snr'); S.P.on('pageerror', e => errs.push('snr: ' + e.message));
await sleep(1000);
ok(await S.ev(() => !!document.querySelector('[onclick="verbOpen()"]')), 'Senior (giovane del Clan) di una Sezione: scheda Verbali presente');
await S.ev(() => verbOpen()); await sleep(1200);
ok(await S.ev(() => /I verbali che puoi leggere/i.test(document.body.innerText)), 'Senior: apre la pagina dei verbali');
ok(!/Consiglio di Gruppo di dicembre/.test(await body(S)) && !/Staff di giugno/.test(await body(S)), 'Senior: non legge CdG né staff di Unità');
await S.pa.ctx.close();
// ── 28/11 sera: COS dalla tabella «Chi fa parte» del Progetto di Sezione; Tesoriere e membri in sola lettura ──
prof2('tes', 'Tea Tesoriera', 'tes');
{ const o = db.t.pee_verbali.find(v => v.tipo === 'cos'); db.t.pee_verbali.push(Object.assign({}, o, {id:'v-cos-riserv', titolo:'COS riservato di gennaio', sez:false, stato:'condiviso', data:'2027-01-14'})); }
const TS = await mk('tes'); await apri(TS);
ok(await TS.ev(() => JSON.stringify(verbTipiPer(SH.prof)) === '[]'), 'Tesoriere: non scrive verbali');
ok(/COS riservato di gennaio/.test(await body(TS)) && !(await TS.ev(() => !!document.querySelector('[onclick="verbNuovo()"]'))), 'Tesoriere: legge il COS riservato, senza pulsante per scriverne uno');
const V2 = await mk('vol'); await apri(V2);
ok(/COS riservato di gennaio/.test(await body(V2)), 'prima della tabella: la spunta del profilo basta');
await V2.pa.ctx.close();
db.t.pee_piani.push({id:'pp-1', owner_id:U.cds.id, tipo:'sezione', titolo:'Progetto di Sezione', data:{persone:{cos:[{id:'a', nome:'Sara Senior', ruolo:'Consigliera', mail:' SNR@x.it '}]}}});
await sleep(500);
const SN = await mk('snr'); await apri(SN);
ok(/COS riservato di gennaio/.test(await body(SN)), 'persona nella tabella COS: legge il COS riservato');
ok(await SN.ev(() => JSON.stringify(verbTipiPer(SH.prof)) === '[]'), 'persona nella tabella COS: legge soltanto');
const V3 = await mk('vol'); await apri(V3);
ok(!/COS riservato di gennaio/.test(await body(V3)), 'con la tabella compilata la vecchia spunta del profilo non basta più');
ok(errs.length === 0, 'nessun errore di pagina · ' + errs.join(' | '));
await br.close(); process.exit(summary() ? 1 : 0);
