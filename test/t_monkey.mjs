// «Utenti a caso»: click, campi e tendine casuali; cerca errori JS, blocchi e pagine larghe
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium', scen = process.argv[3] || 'E', N = +(process.argv[4] || 250), seed0 = +(process.argv[5] || 1);
let seed = seed0; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const base = await serve(); const db = new FakeDB(); db.sql13 = true; const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
const pa = await person(br, db, scen === 'phone' ? {ctx: {viewport: {width: 390, height: 800}}} : undefined);
const P = pa.page, ev = (f, a) => P.evaluate(f, a); P.__answer = false;
const trace = [];
if (scen === 'acc' || scen === 'staffacc') { await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500); }
else { await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800); await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1500); }
if (scen === 'L' || scen === 'R') await ev(f => selectFascia(f), scen);
if (scen === 'staff' || scen === 'staffacc') { await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = 'CU'; startTool(); }); await sleep(3500);
  await ev(() => { STAFF_MEMBERS.push('Lia', 'Marco'); staffObs.Lia = {P1:'6', C2:'4'}; saveData(true); try{ renderStaffPhase1(); }catch(e){} }); await sleep(500); }
const BAD = 'Elimina|Esci|Cancella|Rimuovi|Ripristina|Revoca|Scollega|Svuota|Sostituisci|Carica file|Accedi|Crea account|Cambia email|password|Torna alla home|Home';
let wide = 0, stuck = 0, lastErr = 0;
for (let i = 0; i < N; i++) {
  const act = await ev(([r1, r2, BADs]) => {
    const BAD = new RegExp(BADs, 'i');
    const vis = el => { const b = el.getBoundingClientRect(); return b.width > 2 && b.height > 2 && getComputedStyle(el).visibility !== 'hidden' && el.offsetParent !== null; };
    const pool = [...document.querySelectorAll('button, a[href="#"], a[onclick], summary, :is(input,textarea):not([type=file]):not([type=hidden]), textarea, select')]
      .filter(e => vis(e) && !e.disabled && !BAD.test((e.textContent || e.value || e.title || e.getAttribute('aria-label') || '').slice(0, 80)));
    if (!pool.length) return {k: 'none'};
    const el = pool[Math.floor(r1 * pool.length)]; const tag = el.tagName, txt = (el.textContent || el.placeholder || el.name || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    try {
      el.scrollIntoView({block: 'center'});
      if (tag === 'SELECT') { const o = el.options; if (o.length) { el.selectedIndex = Math.floor(r2 * o.length); el.dispatchEvent(new Event('change', {bubbles: true})); } return {k: 'select', txt}; }
      if (tag === 'TEXTAREA' || (tag === 'INPUT' && /^(text|search|email|tel|url|)$/.test(el.type))) { el.value = ['Prova', 'àèìòù «test» 😀', '', '1234', 'x'.repeat(300), '<b>tag</b>'][Math.floor(r2 * 6)]; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); return {k: 'type', txt}; }
      if (tag === 'INPUT' && el.type === 'number') { el.value = String(Math.floor(r2 * 30) - 3); el.dispatchEvent(new Event('input', {bubbles: true})); return {k: 'num', txt}; }
      el.click(); return {k: 'click', tag, txt};
    } catch (e) { return {k: 'err', txt, m: e.message}; }
  }, [rnd(), rnd(), BAD]).catch(e => ({k: 'eval-fail', m: e.message.slice(0, 80)}));
  trace.push(act);
  if (rnd() < 0.08) { const k = ['1a','1b','1d','2','3','4','5','chk'][Math.floor(rnd() * 8)]; await ev(k => { try{ if (MODE === 'giovani') gGo(k); else goPhaseInternal(k === '1a' ? 1 : 2); }catch(e){} }, k).catch(() => {}); trace.push({k: 'goto', txt: k}); }
  if (rnd() < 0.06) { await ev(() => { try{ modalClose(); }catch(e){} document.querySelectorAll('.cl-ov.show').forEach(o => o.classList.remove('show')); }).catch(() => {}); }
  await sleep(50 + Math.floor(rnd() * 100));
  if (pa.errors.length > lastErr) { console.log('ERRORE dopo', JSON.stringify(trace.slice(-4)), '\n   ', pa.errors[pa.errors.length - 1].split('\n').slice(0, 3).join(' | ')); lastErr = pa.errors.length; }
  if (i % 25 === 24) { const w = await ev(() => document.documentElement.scrollWidth - innerWidth).catch(() => 0); if (w > 2) { wide++; console.log('LARGA di', w, 'px dopo', JSON.stringify(trace.slice(-2))); }
    const alive = await Promise.race([ev(() => 1).then(() => true).catch(() => true), sleep(8000).then(() => false)]); if (!alive) { stuck++; console.log('BLOCCATA dopo', JSON.stringify(trace.slice(-3))); break; } }
}
const sv = await ev(() => { try{ saveData(true); const s = localStorage.getItem(LSK); return !!s && !!JSON.parse(s); }catch(e){ return 'ERR ' + e.message; } }).catch(e => 'eval ' + e.message);
ok(sv === true, scen + ': i dati si salvano e si rileggono dopo ' + N + ' azioni (' + sv + ')');
ok(!stuck, scen + ': la pagina non si è bloccata');
ok(!wide, scen + ': nessuna pagina più larga dello schermo (' + wide + ')');
ok(!pa.errors.length, scen + ': nessun errore JS (' + pa.errors.length + ')');
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
