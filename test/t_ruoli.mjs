// «Ruoli passati» a scelta multipla (23/11): tabella staff, testi vecchi mai persi, esclusività di «Nessuno», Word
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const ev = (p, f, a) => p.evaluate(f, a);
const pa = await person(br, db, {ctx:{viewport:{width:1400, height:900}, acceptDownloads:true}}), P = pa.page;
const errs = []; P.on('pageerror', e => errs.push(String(e && e.message || e)));
await loginAs(P, base, A); await ev(P, () => exStart()); await sleep(3000);
const LEG = 'Aiuto in Reparto per due anni, poi Capo Sezione Rover';
await ev(P, L => { scheda.pp.staffTab = [
  {ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34', ruoli:'VCB, CB'},
  {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24', ruoli:'SiSB, Membro di CoS'},
  {ruolo:'SiS', nome:'Elena Sarti', mail:'elena@x.it', eta:'19', ruoli:L},
  {ruolo:'CG', nome:'Gigi Neri', mail:'gigi@x.it', eta:'50', ruoli:'', car:'Persona solare e disponibile.\n\nCOSA OFFRO', prof:'Operaio'}];
  document.body.insertAdjacentHTML('beforeend', '<div id="staff-tab" style="position:fixed;left:0;top:0;width:1300px;z-index:99999;background:#fff"></div>');
  document.getElementById('staff-tab').innerHTML = staffTabHTML(); }, LEG);
await sleep(300);
const cell = i => ev(P, i => { const e = document.querySelector('[data-rm="t:' + i + '"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, i);
const row = i => ev(P, i => JSON.parse(JSON.stringify(scheda.pp.staffTab[i])), i);
const c0 = await cell(0), c1 = await cell(1), c2 = await cell(2), c3 = await cell(3);
ok(/^CB, VCB/.test(c0) && !/Scritto prima/.test(c0), '«VCB, CB» scritto a mano: letto, mostrato nell’ordine dell’elenco · ' + c0);
ok(/SiSB, Membro di CoS/.test(c1) && !/Scritto prima/.test(c1), '«Membro di CoS» riconosciuto · ' + c1);
ok(c2.includes(LEG) && /nessuna scelta/.test(c2), 'testo non riconoscibile: resta intero come «Scritto prima»');
ok(/nessuna scelta/.test(c3), 'riga vuota: nessuna scelta');
const r0 = await row(0);
ok(r0.ruoli === 'VCB, CB' && !('ruolic' in r0), 'aprire la tabella non modifica i dati salvati');
ok(await ev(P, () => document.querySelectorAll('#staff-tab textarea[aria-label^="Ruoli"]').length) === 0, 'la colonna Ruoli passati non è più un campo libero');
// scelta
await ev(P, () => ruoliOpen('t',3)); await sleep(200);
ok(await ev(P, () => document.querySelectorAll('[data-rm="t:3"] input[data-rc]').length) === 19, '19 voci: CU…VCR, CG, SiSB…Senior, Commissario, Presidente, Tesoriere, Membro di CoS, Nessuno');
await ev(P, () => { [...document.body.children].forEach(e => { if(e.id !== 'staff-tab') e.style.display = 'none'; }); document.body.style.background = '#fff'; });
await P.screenshot({path:'/tmp/ruoli_aperto.png', clip:{x:0, y:0, width:1300, height:520}});
await ev(P, () => { [...document.body.children].forEach(e => { if(e.id !== 'staff-tab') e.style.display = ''; }); });
for(const c of ['vcu','cu','cg']) await ev(P, c => document.querySelector('[data-rm="t:3"] input[data-rc="' + c + '"]').click(), c);
await sleep(200);
let r3 = await row(3);
ok(r3.ruoli === 'CU, VCU, CG' && r3.ruolit === 'CU, VCU, CG' && r3.ruolic.join() === 'cu,vcu,cg', 'tre spunte: testo «CU, VCU, CG» scritto nel campo (ordine dell’elenco)');
ok(r3.car === 'Persona solare e disponibile.\n\nCOSA OFFRO' && r3.prof === 'Operaio', 'gli altri campi della riga restano intatti');
await ev(P, () => document.querySelector('[data-rm="t:3"] input[data-rc="nessuno"]').click()); await sleep(150);
r3 = await row(3); ok(r3.ruoli === 'Nessuno', '«Nessuno» toglie le altre voci');
await ev(P, () => document.querySelector('[data-rm="t:3"] input[data-rc="cc"]').click()); await sleep(150);
r3 = await row(3); ok(r3.ruoli === 'CC', 'una spunta dopo «Nessuno» lo toglie');
// testo vecchio non perso
await ev(P, () => ruoliOpen('t',2)); await sleep(150);
await ev(P, () => document.querySelector('[data-rm="t:2"] input[data-rc="cr"]').click()); await sleep(150);
let r2 = await row(2);
ok(r2.ruoli === 'CR; ' .replace(';', ',') + 'Scritto prima: ' + LEG && r2.ruolin === LEG, 'scegliendo un ruolo, il testo vecchio resta in «Scritto prima»: ' + r2.ruoli);
await ev(P, () => ruoliClearNote('t',2)); await sleep(150);
r2 = await row(2); ok(r2.ruoli === 'CR' && r2.ruolin === '', '«× togli» cancella solo il testo vecchio, solo su richiesta');
// il testo cambiato a mano rivince
await ev(P, () => { scheda.pp.staffTab[3].ruoli = 'CB'; document.getElementById('staff-tab').innerHTML = staffTabHTML(); }); await sleep(150);
ok(await ev(P, () => document.querySelector('[data-rm="t:3"] > div').innerText.trim()) === 'CB', 'testo cambiato altrove: rivince sulle spunte salvate');
// esporta in Word
await ev(P, () => { document.getElementById('staff-tab').remove(); });
await ev(P, () => { scheda.pp.staffTab[0].ruolic = undefined; });
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(P, () => exportSchedaDocx('completo'))]);
await dl.saveAs('/tmp/ruoli.docx');
const x = execSync('unzip -p /tmp/ruoli.docx word/document.xml').toString();
ok(/VCB, CB/.test(x) && /CC/.test(x), 'Word: la colonna «Ruoli passati» mostra i ruoli scelti');
// scheda di una persona dello staff non presente nella tabella (dati in src): si entra in modalità staff
await ev(P, () => { scheda.pp.staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34'}]; scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo Pesaro'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await ev(P, () => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); }); await sleep(3500);
await ev(P, () => goPhaseInternal(1)); await sleep(500);
await ev(P, () => { STAFF_MEMBERS.push('Luca Verdi'); staffProfiles['Luca Verdi'] = {ruolo:'CU', eta:'40', src:{ruoli:'VCB, Capo Sezione Rover'}}; CURRENT_MEMBER = 'Luca Verdi'; STAFF_VIEW = 'prof'; renderStaffPhase1(); }); await sleep(600);
const mi = await ev(P, () => STAFF_MEMBERS.indexOf('Luca Verdi'));
const pw = await ev(P, i => { const e = document.querySelector('[data-rm="m:' + i + '"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, mi);
ok(pw && /^VCB/.test(pw) && /Scritto prima: VCB, Capo Sezione Rover/.test(pw), 'Profilo: «Ruoli passati» è una scelta multipla; il testo vecchio resta in «Scritto prima» · ' + pw);
ok(await ev(P, () => staffProfiles['Luca Verdi'].src.ruoli) === 'VCB, Capo Sezione Rover', 'Profilo: aprire la scheda non cambia i dati');
await ev(P, i => ruoliOpen('m', i), mi); await sleep(150);
await ev(P, i => document.querySelector('[data-rm="m:' + i + '"] input[data-rc="cos"]').click(), mi); await sleep(150);
const ps = await ev(P, () => staffProfiles['Luca Verdi'].src);
ok(ps.ruoli === 'VCB, Membro di CoS, Scritto prima: VCB, Capo Sezione Rover' && ps.ruolic.join() === 'vcb,cos', 'Profilo: la spunta aggiorna il testo in src (usato da Word, Excel e riepiloghi) · ' + ps.ruoli);
ok(!errs.length, 'nessun errore JS' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
