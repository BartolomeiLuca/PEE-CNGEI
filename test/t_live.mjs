// Correzione 15: testi che si aggiornano subito, senza ricaricare la pagina
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => gGo('3')); await sleep(900);
const iP = await ev(() => getAllPercorsi().findIndex(p => p.percorsoId === 'P5'));
// titolo dell'attività chiusa
await ev(i => { const d = document.getElementById('att-' + i + '-0'); d.open = true; }, iP);
const tin = P.locator(`#att-${iP}-0 input[oninput*="'testo'"]`);
await tin.fill('Cantiere delle Pattuglie'); await sleep(150);
ok(await P.locator(`#att-sumt-${iP}-0`).textContent() === 'Attività 1 — Cantiere delle Pattuglie', 'il titolo dell’attività (anche chiusa) cambia mentre si scrive');
await ev(i => { document.getElementById('att-' + i + '-0').open = false; }, iP);
ok(await P.locator(`#att-sumt-${iP}-0`).isVisible(), '…e si legge con l’attività chiusa');
// conteggio del percorso
await ev(i => attAdd(i), iP); await sleep(400);
const cnt = () => P.locator(`#pc-card-${iP} .pcx-sum`).textContent();
const c0 = await cnt();
await P.locator(`#att-${iP}-3 input[oninput*="'testo'"]`).fill('Quarta attività'); await sleep(150);
ok(c0 === '3 attività scritte' && await cnt() === '4 attività scritte', 'il conteggio del percorso si aggiorna (' + c0 + ' → ' + await cnt() + ')');
// linea del tempo
const [iS, jS] = await ev(() => [getAllPercorsi().findIndex(x => x.percorsoId === 'S3'), 1]);
await P.locator(`#att-${iS}-${jS} input[oninput*="'testo'"]`).fill('Hike delle stelle'); await sleep(900);
ok(await ev(() => /Hike delle stelle/.test((document.getElementById('tl-all-wrap') || {}).textContent || '')), 'la linea del tempo mostra subito il nuovo nome');
// dopo lo spostamento la numerazione è giusta anche mentre si scrive
await P.locator(`#att-${iP}-0 .att-mv-dn`).click(); await sleep(400);
await P.locator(`#att-${iP}-0 input[oninput*="'testo'"]`).fill('Cantiere'); await sleep(150);
ok(await P.locator(`#att-sumt-${iP}-0`).textContent() === 'Attività 2 — Cantiere', 'dopo uno spostamento il numero resta giusto mentre si scrive');
// Sezione 1.1: nome nella tabella dello staff → «Chi ha osservato» nelle occasioni osservative
await ev(() => gGo('1a')); await sleep(800); await ev(() => occAdd()); await sleep(300);
const nmCell = P.locator('#staff-tab textarea[oninput*="\'nome\'"]').first();
await nmCell.fill('Giulia Nuovonome'); await sleep(900);
ok(await ev(() => [...document.querySelectorAll('#occ-tab select.occ-chi option')].some(o => o.textContent === 'Giulia Nuovonome')), '1.1: il nome nuovo compare subito tra chi può osservare');
// staff: nome della persona nella colonna mentre si scrive
await ev(() => { confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); }); await sleep(2500);
await ev(() => { STAFF_MEMBERS.push('Paolo Riva'); staffProfiles['Paolo Riva'] = {}; saveData(true); CURRENT_MEMBER = 'Paolo Riva'; STAFF_VIEW = 'prof'; renderStaffPhase1(); }); await sleep(600);
const ni = P.locator('#st-main input[placeholder="Nome e cognome"]').first();
await ni.fill('Paolo Rivabella'); await sleep(150);
ok(await ev(() => [...document.querySelectorAll('#st-side .st-nm')].some(e => e.textContent === 'Paolo Rivabella')), 'staff: il nome nella colonna cambia mentre si scrive');
await ni.press('Tab'); await sleep(500);
ok(await ev(() => STAFF_MEMBERS.includes('Paolo Rivabella') && !STAFF_MEMBERS.includes('Paolo Riva')), 'staff: uscendo dal campo il nome resta salvato');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
