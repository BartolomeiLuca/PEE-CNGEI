// Dati salvati con la versione del 14 ottobre: aperti con la versione nuova restano intatti
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
import http from 'http'; import fs from 'fs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
// pagina vecchia servita su un'altra porta
const old = http.createServer((q, r) => { r.setHeader('content-type', 'text/html'); r.end(fs.readFileSync('/tmp/site_leg/index.html')); }).listen(8099);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto('http://127.0.0.1:8099/'); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1500);
// dati ricchi: staff con osservazioni, scatti nel tempo nel vecchio formato
await ev(() => { selectMode('giovani'); scheda.pp.ctxTerr = 'TERRITORIO-LEGACY'; scheda.pp.sezione = 'Pesaro'; saveData(true); });
await sleep(800);
const before = await ev(() => { const d = clSnapshot(); return JSON.stringify({obs: d.obs, pris: d.pris, vals: d.vals, pp: d.scheda.pp, att: (d.scheda.percorsi||d.scheda.perc||[]).length, unit: d.UNIT_NAME}); });
const raw = await ev(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
await P.close();
// stessi dati con la versione nuova
const pb = await person(br, db); const Q = pb.page, evq = (f, a) => Q.evaluate(f, a);
await Q.goto(base); await evq(r => { for (const k in r) localStorage.setItem(k, r[k]); }, raw); await Q.reload(); await sleep(1500);
await Q.locator(':is(a,button):visible', {hasText:/Continua|Apri|Riprendi|Prosegui/}).first().click({timeout: 4000}).catch(() => {}); await sleep(800);
const after = await evq(() => { const d = clSnapshot(); return JSON.stringify({obs: d.obs, pris: d.pris, vals: d.vals, pp: d.scheda.pp, att: (d.scheda.percorsi||d.scheda.perc||[]).length, unit: d.UNIT_NAME}); });
const b = JSON.parse(before), a = JSON.parse(after);
ok(JSON.stringify(b.obs) === JSON.stringify(a.obs) && Object.keys(a.obs).length > 5, 'osservazioni identiche (' + Object.keys(a.obs).length + ')');
ok(JSON.stringify(b.pris) === JSON.stringify(a.pris) && JSON.stringify(b.vals) === JSON.stringify(a.vals), 'priorità e valutazioni identiche');
ok(a.pp.ctxTerr === 'TERRITORIO-LEGACY' && a.pp.sezione === 'Pesaro' && a.unit === b.unit, 'testi e dati di 1.1 identici');
ok(b.att === a.att, 'percorsi e attività identici');
// staff con scatti in vecchio formato
await evq(() => { selectMode('staff'); STAFF_RUOLO = 'CU'; STAFF_MEMBERS.splice(0); STAFF_MEMBERS.push('Lia', 'Marco'); staffObs.Lia = {P1:'a', C1:'p'}; staffTimeline.Lia = [{data:'2026-09-01', note:'vecchio scatto', obs:{P1:'p'}}]; saveData(true); });
await sleep(500);
await evq(() => { try{ STAFF_VIEW = 'evo'; CURRENT_MEMBER = 'Lia'; renderStaffView && renderStaffView(); }catch(e){} try{ stGoto && 0; }catch(e){} });
const err0 = pb.errors.length;
await evq(() => { try{ const f = typeof renderEvoluzionePercorsi === 'function' ? renderEvoluzionePercorsi('Lia', staffTimeline.Lia) : ''; return typeof f; }catch(e){ throw e; } }).catch(e => { pb.errors.push('evo: ' + e.message); });
await evq(() => { removeTimelineEntry && removeTimelineEntry('Lia', 0); }).catch(e => pb.errors.push('rm: ' + e.message));
ok(await evq(() => (staffTimeline.Lia || []).length === 0 && staffObs.Lia.P1 === 'a'), 'scatto vecchio eliminabile senza errori, valori intatti');
ok(!pb.errors.length, 'nessun errore JS' + (pb.errors.length ? ': ' + pb.errors.slice(0, 3).join(' | ') : ''));
old.close(); const f = summary(); await br.close(); process.exit(f ? 1 : 0);
