// Modalità staff: colonna persone, passaggi, dati letti dall'Unità (collegati), Riepilogo di staff
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const ev = (p, f, a) => p.evaluate(f, a);
const toStaff = async P => { await ev(P, () => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); }); await sleep(3500); };
const pa = await person(br, db), P = pa.page;
await loginAs(P, base, A); await ev(P, () => exStart()); await sleep(3000);
const ex = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
ok(!!ex, 'progetto Unità di esempio creato');
// tabella staff dell'Unità con email, età, formazione
await ev(P, () => { scheda.pp.staffTab = [
  {ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34', form:'Wood Badge'},
  {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24', form:'corso Base', tel:'3331112222', car:'Creativo'},
  {ruolo:'SiS', nome:'Elena Sarti', mail:'elena@x.it', eta:'19', form:'nessuna'}]; scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo Pesaro'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(3500);
const unitBefore = JSON.stringify(db.t.pee_archivi.find(r => r.id === ex.id).data);
await toStaff(P);
const st = db.t.pee_archivi.find(r => r.user_id === A.id && r.meta && r.meta.mode === 'staff');
ok(!!st && await ev(P, () => MODE === 'staff'), 'si apre il progetto staff');
const un = await ev(P, () => ({n: UNIT_NAME, s: scheda.pp.sezione, g: scheda.pp.gruppo}));
ok(un.n === 'Staff Reparto Kontiki' && un.s === 'Pesaro' && un.g === 'Gruppo Pesaro', 'nome, sezione e gruppo ripresi dall’Unità ' + JSON.stringify(un));
await ev(P, () => { setUnitName('Staff Mio'); }); await ev(P, () => stUnitLoad(true)); await sleep(500);
ok(await ev(P, () => UNIT_NAME) === 'Staff Mio', 'quello che scrivo a mano non viene più sovrascritto');
ok(await ev(P, () => JSON.stringify((ST_UNIT.rows||[]).map(r => r.nome))) === '["Anna Rossi","Paolo Riva","Elena Sarti"]', 'legge la tabella dello staff dell’Unità dello stesso anno');
// niente priorità/valutazione per lo staff
const vis = await ev(P, () => ['tab3', 'tab4', 'mnav3', 'mnav4'].map(i => { const e = document.getElementById(i); return !e || e.offsetParent === null; }));
ok(vis.every(Boolean), 'Priorità e Valutazione nascoste nello staff ' + JSON.stringify(vis));
await ev(P, () => goPhaseInternal(3)); await sleep(300);
ok(await ev(P, () => document.getElementById('panel2').classList.contains('active') && !document.getElementById('panel3').classList.contains('active')), 'lo staff si ferma al Riepilogo');
await ev(P, () => goPhaseInternal(1)); await sleep(300);
// auto osservazione = la mia riga; tendina senza di me
const auto = await ev(P, () => ({link: autoProfile.link, nome: autoProfile.nome, eta: autoProfile.eta, ruolo: autoProfile.ruolo, form: autoProfile.formazione}));
ok(auto.link && auto.link.mail === 'anna@x.it' && auto.nome === 'Anna Rossi' && auto.eta === '34' && auto.ruolo === 'CU' && auto.form === 'wb', 'auto osservazione presa dalla riga di chi usa l’app ' + JSON.stringify(auto));
await P.click('.st-add'); await sleep(600);
const opts = await ev(P, () => [...document.querySelectorAll('#st-pick option')].map(o => o.textContent));
ok(opts.length === 3 && !opts.some(t => /Anna/.test(t)), 'tendina: le altre persone, non io ' + JSON.stringify(opts));
await ev(P, () => { const s = document.getElementById('st-pick'); s.value = '1'; stAddFromUnit(); }); await sleep(500);
ok(await ev(P, () => STAFF_MEMBERS.join('|')) === 'Paolo Riva', 'aggiunta una persona dalla tabella');
await ev(P, () => stAddToggle()); await sleep(500); await ev(P, () => stAddAll()); await sleep(500);
ok(await ev(P, () => STAFF_MEMBERS.join('|')) === 'Paolo Riva|Elena Sarti', 'aggiungi tutte: nessun doppione');
const pr = await ev(P, () => staffProfiles['Paolo Riva']);
ok(pr.eta === '24' && pr.ruolo === 'VCU' && pr.formazione === 'base' && pr.src.tel === '3331112222', 'età, ruolo, formazione, telefono compilati ' + JSON.stringify(pr).slice(0, 120));
const prof = await ev(P, () => { stPick(0); stGo('prof'); return document.getElementById('st-main').textContent; });
ok(/si modificano\s*lì/.test(prof) && /Creativo/.test(prof) && !(await ev(P, () => !!document.querySelector('#st-main .st-f :is(input,textarea)[type=number]'))), 'Profilo: campi collegati in sola lettura con la nota');
// passaggi in alto
const steps = await ev(P, () => [...document.querySelectorAll('#g-subnav .gsn-step')].map(b => b.textContent));
ok(steps.length === 4 && /Profilo/.test(steps[0]) && /Scheda di osservazione/.test(steps[1]) && /Lettura individuale/.test(steps[2]) && /Evoluzione/.test(steps[3]), 'barra dei passaggi ' + JSON.stringify(steps));
await ev(P, () => stGo('oss')); await sleep(300);
ok(!(await ev(P, () => /Come Capo Gruppo/.test(document.getElementById('percorsi-root').textContent))), 'tolto «Come Capo Gruppo — strategia di osservazione»');
ok(await ev(P, () => document.querySelectorAll('#st-main .pc').length) === 24, '24 schede percorso');
// osservazione: Paolo 4, Elena 8 su P1; Paolo 6 su C1
await ev(P, () => { stSetObs(0, 'P1', '4'); stSetObs(1, 'P1', '8'); stSetObs(0, 'C1', '6'); }); await sleep(200);
ok(await ev(P, () => staffObs['Paolo Riva'].P1 === 4 && staffObs['Elena Sarti'].P1 === 8), 'valori salvati per persona');
ok(/2 \/ 24/.test(await ev(P, () => document.getElementById('st-side').textContent)), 'segno di avanzamento nella colonna');
// i dati restano collegati: cambio nell'Unità nome/età/telefono
const exRow = db.t.pee_archivi.find(r => r.id === ex.id); exRow.data.scheda.pp.staffTab[1] = {ruolo:'VCU', nome:'Paolo R. Riva', mail:'paolo@x.it', eta:'25', form:'Testa di Moro', tel:'3339998888'}; exRow.updated_at = new Date().toISOString();
await ev(P, () => stUnitRefresh()); await sleep(1500);
const ch = await ev(P, () => ({m: STAFF_MEMBERS.join('|'), p: staffProfiles['Paolo R. Riva'], v: (staffObs['Paolo R. Riva']||{}).P1, old: !!staffObs['Paolo Riva'], cur: CURRENT_MEMBER}));
ok(ch.m === 'Paolo R. Riva|Elena Sarti' && ch.p.eta === '25' && ch.p.formazione === 'tdm' && ch.p.src.tel === '3339998888' && ch.v === 4 && !ch.old, 'cambi nell’Unità (nome, età, telefono) arrivano nello staff senza perdere le osservazioni ' + JSON.stringify(ch).slice(0, 160));
// riga tolta dall'Unità: resta l'ultima copia
exRow.data.scheda.pp.staffTab.splice(2, 1); exRow.updated_at = new Date().toISOString(); const unitMine = JSON.stringify(exRow.data);
await ev(P, () => stUnitRefresh()); await sleep(1500);
await ev(P, () => { stSetObs(0, 'P2', '5'); }); await sleep(2500);
const gone = await ev(P, () => ({g: staffProfiles['Elena Sarti'].link.gone, eta: staffProfiles['Elena Sarti'].eta, v: staffObs['Elena Sarti'].P1}));
ok(gone.g === true && gone.eta === '19' && gone.v === 8, 'riga sparita dall’Unità: si tiene l’ultima copia ' + JSON.stringify(gone));
// mai scrivere nell'Unità: dopo tutto il lavoro dello staff il progetto Unità è com'ero io l'ho lasciato
ok(db.t.pee_archivi.find(r => r.id === ex.id).updated_at === exRow.updated_at && JSON.stringify(db.t.pee_archivi.find(r => r.id === ex.id).data) === unitMine, 'l’Unità non viene riscritta dal progetto staff');
// Riepilogo
await ev(P, () => goPhaseInternal(2)); await sleep(800);
const rie = await ev(P, () => { const o = [...document.querySelectorAll('#panel2 .rie-radar, #panel2 .rie-grid, #rie-staff-extra .st-sech')].map(e => e.className.includes('st-sech') ? e.textContent : (e.className.includes('rie-radar') ? 'COPERTURA' : 'PANNELLI')); return o; });
ok(rie.join('|') === 'COPERTURA|PANNELLI|Profilo|Ambito più scoperto|Spazio sicuro e simili|Attività formative per lo staff' || rie.join('|') === 'COPERTURA|PANNELLI|Profilo|Ambito più scoperto|Attività formative per lo staff', 'Riepilogo nell’ordine deciso ' + rie.join('|'));
const cell = await ev(P, () => [...document.querySelectorAll('.cov-cell')][0].title);
ok(/punteggio 6 su 10/.test(cell), 'la copertura usa la media dello staff (4 e 8 → 6): ' + cell);
const miss = await ev(P, () => [...document.querySelectorAll('.st-miss-r')].length);
ok(miss > 0, 'percorsi mancanti in colonna: ' + miss);
await P.click('.st-miss-r >> nth=0'); await sleep(900);
ok(await ev(P, () => document.getElementById('panel1').classList.contains('active') && /^card-/.test(document.querySelector('.pc.expanded').id)), 'cliccando un percorso mancante si va alla scheda di osservazione');
await ev(P, () => goPhaseInternal(2)); await sleep(300);
ok(await ev(P, () => document.querySelectorAll('#rie-staff-extra .st-fold').length > 0 && [...document.querySelectorAll('#rie-staff-extra .st-fold')].every(d => !d.open)), 'safe space e attività: chiusi, si aprono con la freccia');
ok(await ev(P, () => document.getElementById('g-subnav').style.display === 'none'), 'nel Riepilogo la barra dei passaggi non c’è');
// Word ed Excel dello staff: solo Riepilogo
const dl = [];
P.on('download', d => dl.push(d.suggestedFilename()));
await ev(P, () => exportExcel()); await sleep(3500);
ok(dl.some(f => /\.xlsx$/.test(f)), 'Excel dello staff scaricato ' + dl.join(','));
await ev(P, () => { showExportDialog(); document.querySelector(':is(input,textarea)[value="aggregated"]').checked = true; executeExport(); }); await sleep(3500);
ok(dl.some(f => /VistaAggregata/.test(f)), 'Word (vista aggregata) scaricato');
// «Scarica tutto»: un unico Word con l'aggregata e poi gli individuali
{ const waitDl = P.waitForEvent('download');
  await ev(P, () => { showExportDialog(); executeExport(); });
  const d = await waitDl; const fp = '/tmp/staff_tutto.docx'; await d.saveAs(fp);
  const { execSync } = await import('child_process');
  const xml = execSync('unzip -p ' + fp + ' word/document.xml').toString().replace(/<[^>]+>/g, ' ');
  const names = await ev(P, () => STAFF_MEMBERS.slice());
  ok(/Vista aggregata/.test(xml) && names.length > 0 && names.every(n => xml.includes(n)), 'Word «Scarica tutto»: aggregata + tutti i membri (' + names.join(', ') + ')');
  ok(xml.indexOf('Vista aggregata') < xml.indexOf(names[0]), 'Word «Scarica tutto»: prima l’aggregata, poi gli individuali'); }
// evoluzione: scatto, colori dei cambi, eliminazione che ripristina
await ev(P, () => { CURRENT_MEMBER = STAFF_MEMBERS[0]; staffObs[CURRENT_MEMBER] = Object.assign(staffObs[CURRENT_MEMBER] || {}, {P1: 4}); staffTimeline[CURRENT_MEMBER] = []; STAFF_VIEW = 'evo'; renderStaffPhase1(); });
await sleep(300);
const evo = await ev(P, () => { document.getElementById('tl-obs-P1').value = '8'; tlRowPaint('P1'); const up = document.getElementById('tl-row-P1').classList.contains('tl-up'); addTimelineEntry(CURRENT_MEMBER); return {up, now: staffObs[CURRENT_MEMBER].P1, chip: !!document.querySelector('.tl-ch.up')}; });
ok(evo.up && evo.now === 8 && evo.chip, 'scatto: la riga e il cambiamento si colorano di verde se migliora ' + JSON.stringify(evo));
await ev(P, () => removeTimelineEntry(CURRENT_MEMBER, 0)); await sleep(300);
ok(await ev(P, () => staffObs[CURRENT_MEMBER].P1) === 4, 'scatto eliminato: il percorso torna al valore di prima (4)');
// telefono: la colonna diventa una fila da scorrere
const pb = await person(br, db, {ctx: {viewport: {width: 390, height: 844}}}); await loginAs(pb.page, base, A);
await ev(pb.page, () => clOpenProject && 0); await sleep(300);
await toStaff(pb.page); await sleep(1500);
const ph = await ev(pb.page, () => { const s = document.getElementById('st-side'); const c = getComputedStyle(s); return {dir: c.flexDirection, ox: c.overflowX, hs: document.documentElement.scrollWidth <= window.innerWidth + 1}; });
ok(ph.dir === 'row' && ph.ox === 'auto' && ph.hs, 'telefono: fila di nomi da scorrere, senza scorrimento della pagina ' + JSON.stringify(ph));
ok(!pa.errors.length && !pb.errors.length, 'nessun errore JS' + (pa.errors.concat(pb.errors).length ? ': ' + pa.errors.concat(pb.errors).slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
