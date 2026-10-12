// Account (registrazione con invito, password), «Chi ha osservato», materiali di pattuglia, testi, pagina ferma su Safari
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve();
const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
const ev = (p, f, a) => p.evaluate(f, a);

const pa = await person(br, db);
await loginAs(pa.page, base, A);
await ev(pa.page, () => exStart()); await sleep(2500);
const pid = await ev(pa.page, () => CL.ctx.id);
await ev(pa.page, () => dbInvite(CL.ctx.id, 'elena@x.it', 'collaboratore'));

// ── 1. registrazione di chi è stato invitato: occhietto, «Riscrivi la password», finestra dell'invito ──
const pe = await person(br, db);
await pe.page.goto(base); await ev(pe.page, () => localStorage.setItem('bussola_tour_v3', '1')); await pe.page.reload(); await sleep(800);
await ev(pe.page, () => clOpen()); await sleep(300);
ok(await pe.page.isVisible('#cl-ov >> text=Password dimenticata?'), '1. «Password dimenticata?»');
await pe.page.click('#cl-ov >> text=Crea account');
ok(await pe.page.isVisible('#cl-pw2'), '1. «Riscrivi la password»');
await pe.page.fill('#cl-nome', 'Elena Gialli'); await pe.page.fill('#cl-email', 'elena@x.it');
await pe.page.fill('#cl-pw', 'segreta123'); await pe.page.fill('#cl-pw2', 'segreta124');
await pe.page.click('#cl-ov .cl-pww .cl-eye');
ok(await ev(pe.page, () => document.getElementById('cl-pw').type === 'text'), '1. l’occhietto mostra la password');
await pe.page.click('#cl-go'); await sleep(500);
ok(/non coincidono/.test(await pe.page.textContent('#cl-msg')), '1. password diverse: avviso');
await pe.page.fill('#cl-pw2', 'segreta123'); await pe.page.click('#cl-go'); await sleep(2500);
const pop = await ev(pe.page, () => ({show: document.getElementById('cl-ov').classList.contains('show'), t: document.getElementById('cl-title').textContent, strip: document.querySelectorAll('.cl-invstrip').length}));
ok(pop.show && /Hai un invito su «/.test(pop.t) && pop.strip > 0, '1. appena registrata: finestra «' + pop.t + '» e striscia');
await ev(pe.page, () => clClose());
// password dimenticata: il link va a chi l'ha chiesto
await ev(pe.page, () => clLogout()); await sleep(300);
await ev(pe.page, () => clOpen()); await sleep(300);
await pe.page.click('#cl-ov >> text=Password dimenticata?');
await pe.page.fill('#cl-email', 'elena@x.it'); await pe.page.click('#cl-go'); await sleep(500);
ok(db.mails.some(m => m.tipo === 'reset' && m.to === 'elena@x.it'), '1. password dimenticata: mail di Supabase a chi l’ha chiesta');
await ev(pe.page, () => clClose());

// ── 10. «Chi ha osservato» ──
await ev(pa.page, () => { scheda.pp.staffTab = [{ruolo:'CU',nome:'Anna Rossi',mail:'anna@x.it'},{ruolo:'VCU',nome:'Paolo Riva'}]; scheda.pp.occMan = [{att:'Uscita di Reparto'}]; saveData(true); gGo('1a'); });
await sleep(600);
const opts = await ev(pa.page, () => [...document.querySelectorAll('#occ-tab select.occ-chi')].map(s => [...s.options].map(o => o.textContent)));
ok(opts.length && JSON.stringify(opts[opts.length-1]) === JSON.stringify(['— scegli —','Anna Rossi','Paolo Riva','Tutto lo staff','Altro…']), '10. «Chi ha osservato»: nomi dello staff, Tutto lo staff, Altro: ' + JSON.stringify(opts[opts.length-1]));
await pa.page.locator('#occ-tab select.occ-chi').last().selectOption('Tutto lo staff'); await sleep(200);
ok(await ev(pa.page, () => scheda.pp.occMan[0].chi) === 'Tutto lo staff', '10. scelta salvata');
await pa.page.locator('#occ-tab select.occ-chi').last().selectOption('__a'); await sleep(300);
await pa.page.locator('#occ-tab input.occ-chi').last().fill('Il Capo Gruppo'); await sleep(200);
ok(await ev(pa.page, () => scheda.pp.occMan[0].chi) === 'Il Capo Gruppo', '10. «Altro»: testo libero');
await ev(pa.page, () => occRefresh()); await sleep(200);
ok(await ev(pa.page, () => [...document.querySelectorAll('#occ-tab input.occ-chi')].some(i => i.value === 'Il Capo Gruppo')), '10. il testo libero resta dopo il ridisegno');

// ── 22-23. materiali di pattuglia e maglia termica ──
await ev(pa.page, () => { gGo('3'); }); await sleep(800);
await ev(pa.page, () => { document.querySelectorAll('details.att-extra,details.ax-g').forEach(d => d.open = true); }); await sleep(300);
const sq = await ev(pa.page, () => { const g = document.querySelector('#att-0-0 details.ax-g[data-k="circ"]'); return g ? g.textContent : ''; });
ok(/Di pattuglia/.test(sq) && /Cassone di pattuglia completo/.test(sq) && /Telo \/ tarp/.test(sq) && /Quaderno di pattuglia/.test(sq), '22. «Di pattuglia» con le voci del Reparto');
await pa.page.locator('#att-0-0 details.ax-g[data-k="circ"] .ax-chip', {hasText:'Tenda'}).first().click(); await sleep(300);
await pa.page.locator('#att-0-0 details.ax-g[data-k="circ"] .ax-chip', {hasText:'Bussola'}).first().click(); await sleep(300);
const sqa = await pa.page.locator('#att-0-0 details.ax-g[data-k="circ"] textarea[placeholder="Altro, una cosa per riga"]');
await sqa.fill('Pentolone'); await sleep(300);
const sel = await ev(pa.page, () => { const x = getAllPercorsi()[0].attivita[0].ax; return {sel:x.sqSel, alt:x.sqAltro, txt: axMsgText(0,0)}; });
ok(JSON.stringify(sel.sel) === '["Tenda","Bussola"]' && sel.alt === 'Pentolone', '22. scelte salvate: ' + JSON.stringify(sel.sel));
ok(/• Di pattuglia: Tenda, bussola, pentolone/.test(sel.txt), '22. nel messaggio alle famiglie');
const term = await ev(pa.page, () => axZainoFor().find(g => g[0] === 'Freddo e neve')[1][0]);
ok(term === 'Maglia termica', '23. «Maglia termica» in Freddo e neve');
const muta = await ev(pa.page, () => { const f = FASCIA; FASCIA = 'L'; const l = axSq().lab; FASCIA = 'R'; const r = axSq().lab; FASCIA = f; return [l, r]; });
ok(muta[0] === 'Di muta' && muta[1] === 'Di gruppo', '22. Branco «Di muta», Compagnia «Di gruppo»');

// ── 3, 6, 7. testi ──
const html = await ev(pa.page, () => document.documentElement.innerHTML + TOUR.map(t => typeof t.b === 'function' ? t.b() : t.b).join(''));
ok(!/fase di prova\.<\/li>|sono in fase di prova/.test(html) && !/Altri due ruoli/.test(html), '3. guida: niente più «Altri due ruoli… in fase di prova»');
ok(html.includes('almeno 3 attività (a tua discrezione puoi anche organizzarle nel dettaglio: logistica, materiali, pasti, costi, sicurezza, circolare per le famiglie. Così da avere una scheda di programmazione pronta da essere condivisa.)'), '6. giro guidato: testo del Percorso');
ok(html.includes('In modalità <b>staff</b> il cammino è più breve'), '7. giro guidato: «In modalità staff il cammino è più breve…»');
ok(!/\?ruoli=1/.test(await ev(pa.page, () => clWaText('x@y.it', 'collaboratore'))), '0. messaggio WhatsApp senza ?ruoli=1');

// ── 12. pagina ferma quando arriva una modifica di altri ──
const pb = await person(br, db, {ctx:{viewport:{width:1280, height:800}}});
await loginAs(pb.page, base, A);   // stessa persona su un altro dispositivo
await ev(pb.page, () => clOpenProject(arguments[0]), pid).catch(() => {});
await ev(pb.page, id => clOpenProject(id), pid); await sleep(2500);
await ev(pb.page, () => { gGo('3'); }); await sleep(1000);
// scorro a metà della scheda e misuro, fotogramma per fotogramma, dove sta il punto che guardo
await ev(pb.page, () => { const el = document.getElementById('att-1-1') || document.getElementById('att-0-2'); el.scrollIntoView({block:'start'}); window.scrollBy(0, -120); });
await sleep(800);
await ev(pb.page, () => { window._trk = []; const el = document.getElementById('att-1-1') ? 'att-1-1' : 'att-0-2'; window._trkId = el; const t0 = performance.now();
  const f = () => { const e = document.getElementById(window._trkId); if(e) window._trk.push(Math.round(e.getBoundingClientRect().top)); if(performance.now() - t0 < 9000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
await ev(pa.page, () => { const a = getAllPercorsi()[0].attivita[0]; a.lancio = (a.lancio||'') + ' Arriva un messaggero.'; scheda.osservazione.P.positivi += ' Nuova riga.'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(9500);
const trk = await ev(pb.page, () => window._trk);
const got = await ev(pb.page, () => getAllPercorsi()[0].attivita[0].lancio);
const dev = Math.max(...trk) - Math.min(...trk);
ok(/messaggero/.test(got), '12. la modifica è arrivata sull’altro dispositivo');
ok(trk.length > 30 && dev <= 2, '12. la pagina non salta mentre arriva (scarto massimo ' + dev + ' px su ' + trk.length + ' fotogrammi)');

// caso B: cursore fermo dentro un campo (Safari sposta la pagina quando si rimette il cursore)
await ev(pb.page, () => { const el = document.querySelector('#att-0-2 textarea'); el.scrollIntoView({block:'center'}); el.focus({preventScroll:true}); el.setSelectionRange(2, 2); });
await sleep(3500);
await ev(pb.page, () => { window._trk = []; const t0 = performance.now(); const f = () => { const e = document.querySelector('#att-0-2 textarea'); if(e) window._trk.push(Math.round(e.getBoundingClientRect().top)); if(performance.now() - t0 < 9000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
await ev(pa.page, () => { const a = getAllPercorsi()[0].attivita[1]; a.lancio = (a.lancio||'') + ' Seconda novità.'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(9500);
{ const trk = await ev(pb.page, () => window._trk); const dev = Math.max(...trk) - Math.min(...trk);
  const foc = await ev(pb.page, () => { const a = document.activeElement; return a && a.tagName + ':' + a.selectionStart; });
  ok(/Seconda novità/.test(await ev(pb.page, () => getAllPercorsi()[0].attivita[1].lancio)), '12. B: modifica arrivata con il cursore in un campo');
  ok(trk.length > 30 && dev <= 2, '12. B: la pagina non salta (scarto ' + dev + ' px)'); console.log(trk.filter((v,i)=>i===0||v!==trk[i-1]).join(' '));
  ok(foc === 'TEXTAREA:2', '12. B: il cursore resta dov’era (' + foc + ')'); }

for(const [n, p] of [['Anna', pa], ['Elena', pe], ['Anna 2', pb]]) ok(!p.errors.length, 'nessun errore JS per ' + n + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
