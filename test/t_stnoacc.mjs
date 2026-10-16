// Senza account: lo staff nuovo prende subito nome, Sezione e Gruppo dall'Unità di questo dispositivo
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await ev(() => { window._pjPick = true; selectMode('giovani'); selectFascia('E'); startTool(); }); await sleep(1500);
await ev(() => { UNIT_NAME = 'Reparto Falco'; scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo Uno'; scheda.pp.staffTab = [{ruolo:'VCU', nome:'Lia Verdi'}]; saveData(true); }); await sleep(800);
await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = 'CU'; startTool(); });
await P.waitForFunction(() => MODE === 'staff' && document.getElementById('main-app').style.display === 'block', null, {timeout: 15000}); await sleep(1500);
const ins = await ev(() => [...document.querySelectorAll('input')].filter(i => i.offsetParent).map(i => i.value));
ok(ins.includes('Staff Reparto Falco') && ins.includes('Pesaro'), 'senza account: nome e Sezione a schermo ' + JSON.stringify(ins.slice(0, 4)));
ok(await ev(() => scheda.pp.gruppo === 'Gruppo Uno'), 'senza account: anche il Gruppo');
await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('giovani'); selectFascia('E'); startTool(); });
await P.waitForFunction(() => MODE === 'giovani' && document.getElementById('main-app').style.display === 'block', null, {timeout: 15000}); await sleep(800);
ok(await ev(() => UNIT_NAME === 'Reparto Falco' && (scheda.pp.staffTab || []).length === 1), 'tornando all’Unità ritrovo il suo lavoro');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
