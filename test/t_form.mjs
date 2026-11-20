// Tendina «Formazione» a scelta multipla: tabella staff, livello calcolato, nessuna perdita di testo, profili, compatibilità
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const ev = (p, f, a) => p.evaluate(f, a);
const pa = await person(br, db), P = pa.page;
const errs = []; P.on('pageerror', e => errs.push(String(e && e.message || e)));
await loginAs(P, base, A); await ev(P, () => exStart()); await sleep(3000);

// ── 1. tabella dello staff dell'Unità con testi vecchi ──
const LEG3 = 'Ex Rover, primo anno in staff; Campo di formazione per Aiuti in programma a febbraio';
await ev(P, L3 => { scheda.pp.staffTab = [
  {ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34', form:'Wood Badge'},
  {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24', form:'corso Base'},
  {ruolo:'SiS', nome:'Elena Sarti', mail:'elena@x.it', eta:'19', form:L3},
  {ruolo:'CG', nome:'Gigi Neri', mail:'gigi@x.it', eta:'50', form:''}];
  document.body.insertAdjacentHTML('beforeend', '<div id="staff-tab" style="position:fixed;left:0;top:0;width:1200px;z-index:99999;background:#fff"></div>');
  document.getElementById('staff-tab').innerHTML = staffTabHTML(); }, LEG3);
await sleep(300);
const cell = i => ev(P, i => { const e = document.querySelector('[data-fm="t:' + i + '"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; }, i);
const row = i => ev(P, i => JSON.parse(JSON.stringify(scheda.pp.staffTab[i])), i);
let c0 = await cell(0), c1 = await cell(1), c2 = await cell(2), c3 = await cell(3);
ok(/Wood Badge/.test(c0) && /Livello: Wood Badge/.test(c0), 'riga con «Wood Badge» scritto a mano: letta, livello Wood Badge · ' + c0);
ok(/Modulo Associativo/.test(c1) && /Livello: Iniziale/.test(c1), '«corso Base» diventa Modulo Associativo, livello Iniziale · ' + c1);
ok(c2.includes(LEG3) && /nessuna scelta/.test(c2) && !/Livello/.test(c2), 'testo non riconoscibile: resta intero come «Scritto prima», senza livello inventato');
ok(/nessuna scelta/.test(c3), 'riga vuota: nessuna scelta');
const r2 = await row(2);
ok(r2.form === LEG3 && !('formc' in r2), 'aprire la tabella non modifica i dati salvati (testo identico, nessun campo nuovo)');
ok(await ev(P, () => document.querySelectorAll('#staff-tab textarea[aria-label^="Formazione"]').length) === 0, 'la colonna Formazione non è più un campo di testo libero');

// ── 2. scelta multipla su una riga con testo vecchio: il testo resta ──
await ev(P, () => document.querySelector('[data-fm="t:2"] button[aria-expanded]').click()); await sleep(150);
ok(await ev(P, () => document.querySelectorAll('[data-fm="t:2"] input[type=checkbox]').length) === 19, 'si apre l’elenco: 19 voci (Unità, ruoli, brevetti, percorsi precedenti, Nessuna)');
await ev(P, () => document.querySelector('[data-fm="t:2"] input[data-fc="for_m_e"]').click()); await sleep(100);
await ev(P, () => document.querySelector('[data-fm="t:2"] input[data-fc="for_g"]').click()); await sleep(100);
c2 = await cell(2); const w2 = await row(2);
ok(/Livello: Avanzata/.test(c2), 'FOR.M Branca E + FOR.G = livello Avanzata · ' + c2.slice(0, 80));
ok(JSON.stringify(w2.formc) === '["for_m_e","for_g"]' && w2.form === 'FOR.M Branca E; FOR.G; Scritto prima: ' + LEG3, 'doppia scrittura: formc + testo «FOR.M Branca E; FOR.G; Scritto prima: …» ' + w2.form.slice(0, 60));
ok(await ev(P, () => document.querySelector('[data-fm="t:2"] input[data-fc="for_g"]').checked) === true && await ev(P, () => !!document.querySelector('[data-fm="t:2"] input[type=checkbox]')), 'l’elenco resta aperto dopo la spunta');
await ev(P, () => [...document.querySelectorAll('[data-fm="t:2"] button')].find(b => /togli/.test(b.textContent)).click()); await sleep(100);
const w2b = await row(2);
ok(w2b.form === 'FOR.M Branca E; FOR.G' && w2b.formn === '', 'solo se lo chiedo io, la nota vecchia si toglie');

// ── 3. regole: Wood Badge 3/4 a cascata, «Nessuna» esclusiva ──
await ev(P, () => document.querySelector('[data-fm="t:3"] button[aria-expanded]').click()); await sleep(100);
await ev(P, () => document.querySelector('[data-fm="t:3"] input[data-fc="wb4"]').click()); await sleep(100);
ok(JSON.stringify((await row(3)).formc) === '["wb","wb3","wb4"]', 'Wood Badge 4 spunta da sé 3 e 1');
await ev(P, () => document.querySelector('[data-fm="t:3"] input[data-fc="wb3"]').click()); await sleep(100);
ok(JSON.stringify((await row(3)).formc) === '["wb"]', 'tolgo Wood Badge 3: toglie anche il 4, resta il primo');
await ev(P, () => document.querySelector('[data-fm="t:3"] input[data-fc="wb"]').click()); await sleep(100);
await ev(P, () => document.querySelector('[data-fm="t:3"] input[data-fc="for_in"]').click()); await sleep(100);
await ev(P, () => document.querySelector('[data-fm="t:3"] input[data-fc="nessuna"]').click()); await sleep(100);
ok(JSON.stringify((await row(3)).formc) === '["nessuna"]' && /Livello: Nessuna/.test(await cell(3)), '«Nessuna» toglie le altre voci');
await ev(P, () => document.querySelector('[data-fm="t:3"] input[data-fc="for_a"]').click()); await sleep(100);
ok(JSON.stringify((await row(3)).formc) === '["for_a"]' && /Livello: Avanzata/.test(await cell(3)), 'scegliere una voce toglie «Nessuna»; FOR.A da solo = Avanzata');
// il testo cambiato altrove (versione principale) rivince su formc
await ev(P, () => { scheda.pp.staffTab[3].form = 'Wood Badge 3'; document.getElementById('staff-tab').innerHTML = staffTabHTML(); }); await sleep(100);
ok(/Livello: Wood Badge/.test(await cell(3)) && /Wood Badge 3/.test(await cell(3)), 'se il testo viene modificato a mano altrove, vale il testo nuovo');
// salvataggio
await ev(P, () => { _clTouched = true; _clUserAt = Date.now(); saveData(true); });
let saved = ''; for(let k = 0; k < 20; k++){ await sleep(500); saved = JSON.stringify((db.t.pee_archivi.find(r => /Esempio · Reparto/.test(r.titolo)) || {}).data || {}); if(/for_m_e/.test(saved)) break; }
ok(/formc/.test(saved) && /for_m_e/.test(saved), 'le scelte sono nel progetto salvato');

// ── 4. livelli: tabella completa ──
const lv = await ev(P, () => {
  const L = c => formLevel(c), o = {};
  o.a = L(['for_in']); o.b = L(['mod_ass']); o.c = L(['senior']); o.d = L(['for_m_r']); o.e = L(['for_s']); o.f = L(['mora']); o.g = L(['tdm']); o.h = L(['pe_fad']);
  o.i = L(['for_a']); o.j = L(['mod_wb']); o.k = L(['for_m_l', 'for_c']); o.l = L(['wb']); o.m = L(['wb4', 'wb3', 'wb']); o.n = L(['nessuna']); o.o = L([]); o.p = L(['for_in', 'for_g']);
  return o; });
ok(lv.a === 'iniz' && lv.b === 'iniz' && lv.c === 'iniz', 'Iniziale: FOR.IN, Modulo Associativo, Percorso Senior');
ok(lv.d === 'inter' && lv.e === 'inter' && lv.f === 'inter' && lv.g === 'inter' && lv.h === 'inter' && lv.p === 'inter', 'Intermedia: FOR.M, FOR.S da solo, MoRA, Testa di Moro, Programmazione Educativa');
ok(lv.i === 'avanz' && lv.j === 'avanz' && lv.k === 'avanz', 'Avanzata: FOR.A da solo, Modulo WB, FOR.M + ruolo');
ok(lv.l === 'wb' && lv.m === 'wb' && lv.n === 'nessuna' && lv.o === '', 'Wood Badge; Nessuna; vuoto = nessun livello');

// ── 5. modalità staff: profili collegati e a mano ──
await ev(P, () => { document.getElementById('staff-tab').remove(); scheda.pp.staffTab = [
  {ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34', form:'FOR.M Branca E; FOR.G'},
  {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24', form:'corso Base'},
  {ruolo:'SiS', nome:'Elena Sarti', mail:'elena@x.it', eta:'19', form:'Testa di Moro'}];
  scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo Pesaro'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await ev(P, () => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); }); await sleep(3500);
await ev(P, () => goPhaseInternal(1)); await sleep(500);
const auto = await ev(P, () => ({n: autoProfile.nome, f: autoProfile.formazione}));
ok(auto.n === 'Anna Rossi' && auto.f === 'avanz', 'auto osservazione dalla riga «FOR.M Branca E; FOR.G»: livello Avanzata · ' + JSON.stringify(auto));
await ev(P, () => { stAddFromUnit; const s = document.getElementById('st-pick'); });
await ev(P, () => { stAddRow(ST_UNIT.rows.find(r => r.nome === 'Paolo Riva')); stAddRow(ST_UNIT.rows.find(r => r.nome === 'Elena Sarti')); }); await sleep(400);
const lp = await ev(P, () => ({p: staffProfiles['Paolo Riva'].formazione, e: staffProfiles['Elena Sarti'].formazione, pt: formProfTxt(staffProfiles['Paolo Riva']), et: formProfTxt(staffProfiles['Elena Sarti'])}));
ok(lp.p === 'iniz' && lp.e === 'inter', 'profili collegati: «corso Base» → Iniziale, «Testa di Moro» → Intermedia · ' + JSON.stringify(lp));
// persona a mano
await ev(P, () => { STAFF_MEMBERS.push('Luca Verdi'); staffProfiles['Luca Verdi'] = {ruolo:'CU', eta:'40', formazione:'base'}; CURRENT_MEMBER = 'Luca Verdi'; STAFF_VIEW = 'prof'; renderStaffPhase1(); }); await sleep(500);
const mi = await ev(P, () => STAFF_MEMBERS.indexOf('Luca Verdi'));
const wtxt = await ev(P, i => { const e = document.querySelector('[data-fm="m:' + i + '"]'); return e ? e.innerText.replace(/\s+/g, ' ') : null; }, mi);
ok(wtxt && /Modulo Associativo/.test(wtxt) && /Iniziale/.test(wtxt), 'profilo a mano con vecchio codice «base»: mostrato come Modulo Associativo, Iniziale · ' + wtxt);
await ev(P, i => { document.querySelector('[data-fm="m:' + i + '"] button[aria-expanded]').click(); }, mi); await sleep(100);
await ev(P, i => { document.querySelector('[data-fm="m:' + i + '"] input[data-fc="mod_ass"]').click(); }, mi); await sleep(100);
await ev(P, i => { document.querySelector('[data-fm="m:' + i + '"] input[data-fc="wb3"]').click(); }, mi); await sleep(100);
const lv2 = await ev(P, () => ({f: staffProfiles['Luca Verdi'].formazione, c: staffProfiles['Luca Verdi'].formc}));
ok(lv2.f === 'wb' && JSON.stringify(lv2.c) === '["wb","wb3"]', 'profilo a mano: tolgo la voce vecchia, spunto Wood Badge 3 → livello Wood Badge · ' + JSON.stringify(lv2));
// consigli: da Intermedia in su, stesso testo; Iniziale no
const adv = await ev(P, () => { const f = lvl => { const lab = ({iniz:1, inter:1, avanz:1, wb:1})[lvl] ? 1 : 0; return lab; }; return ['iniz', 'inter', 'avanz', 'wb', 'nessuna', 'base', 'tdm'].map(x => x + ':' + (['inter', 'avanz', 'wb'].includes(stFormLvl(x)) ? 'consiglio' : '-')).join(' '); });
ok(adv === 'iniz:- inter:consiglio avanz:consiglio wb:consiglio nessuna:- base:- tdm:consiglio', 'il commento «sa come si fa ma non lo applica» vale da Intermedia, non per l’Iniziale · ' + adv);
// esportazione
const ex = await ev(P, () => formProfTxt(staffProfiles['Luca Verdi']));
ok(/Wood Badge 3/.test(ex) && /livello Wood Badge/.test(ex), 'esportazioni Word/Excel: testo + livello · ' + ex);
ok(errs.length === 0, 'nessun errore JavaScript nella pagina ' + JSON.stringify(errs.slice(0, 3)));
await br.close(); process.exit(summary() ? 1 : 0);
