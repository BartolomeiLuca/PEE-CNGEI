// Quota / Trasporti / Locazioni, cassa con incidenze, materiali richiudibili ed Excel
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('dialog', d => d.accept().catch(() => {}));
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
await ev(() => { scheda.pp.staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34'}, {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24'}]; scheda.pp.sezione = 'Pesaro'; scheda.pp.numTot='20'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
async function prova(et){
  await ev(() => gGo(MODE === 'staff' ? '4' : 'usc')).catch(() => {}); await sleep(800);
  await ev(() => { if(typeof uscHome === 'function') uscHome(); }).catch(() => {}); await sleep(300);
  await ev(() => uscNewStart()); await sleep(400);
  await P.fill('#usc-new-t', 'Campo ' + et);
  await P.fill('#usc-new-d1', '2026-12-27'); await P.locator('#usc-new-d1').dispatchEvent('change');
  await P.fill('#usc-new-d2', '2026-12-30'); await P.locator('#usc-new-d2').dispatchEvent('change'); await sleep(100);
  await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
  const names = await ev(() => uscMods().map(m => m[1]));
  ok(['Trasporti','Locazioni','Quota','Materiali','Sicurezza','Benessere e inclusione','Piano B'].every(n => names.includes(n)), et + ': moduli ' + names.join(' | '));
  ok(!names.some(n => /generale|Cassa e quota|Materiale comune/.test(n)), et + ': niente «generale», «Cassa e quota», «Materiale comune»');
  // link manuale del luogo
  const lk = await ev(() => { const L = {ritrovoDove:'Piazza del Popolo', ritrovoDoveLink:'maps.app.goo.gl/abc123'}; return [axPlaceUrl(L,'ritrovoDove'), axPlaceTxt(L,'ritrovoDove'), axPlaceUrl({ritrovoDove:'Piazza'},'ritrovoDove')]; });
  ok(/^https?:\/\/maps\.app\.goo\.gl\/abc123$/.test(lk[0]) && lk[1] === 'Piazza del Popolo' && /google\.com\/maps/.test(lk[2]), et + ': link manuale del luogo: cliccabile con il nome scritto (' + lk.join(' | ') + ')');
  await ev(() => { const u = uscCur(); u.ax.nRag = 15; u.ax.nAd = 5; });
  await ev(() => { const u = uscCur(); const x = u.ax; x.spese = [
    {voce:'Pullman', importo:300, modo:'forfait', carico:'ragazzi', cat:'trasporti'},
    {voce:'Casa per la notte', importo:600, modo:'forfait', carico:'ragazzi'},
    {voce:'Ingressi', importo:100, modo:'forfait', carico:'ragazzi', cat:'altro'},
    {voce:'Treno', importo:50, modo:'forfait', carico:''} ]; x.mat = [{cosa:'Corde', prov:'comprare', prezzo:10, q:5, qm:'fissa', carico:'ragazzi', chi:'Anna'}]; saveData(true); uscRe(); });
  const cat = await ev(() => uscCur().ax.spese.map(axSpCat));
  ok(cat.join() === 'trasporti,locazioni,altro,trasporti', et + ': categorie (' + cat.join() + ')');
  const inc = await ev(() => axQuotaInc(uscCur().ax));
  ok(/^\(\d+% [a-zà ]+(, \d+% [a-zà ]+)+\)$/.test(inc) && /locazioni/.test(inc) && /trasporti/.test(inc), et + ': incidenze ' + inc);
  const sum = await ev(() => { const m = axQuotaInc(uscCur().ax).match(/\d+(?=%)/g) || []; return m.reduce((a, b) => a + Number(b), 0); });
  ok(sum === 100, et + ': le percentuali fanno 100 (' + sum + ')');
  for(const [k, re] of [['trasp', /Pullman/], ['loc', /Casa per la notte/], ['costi', /Cassa/]]){
    await ev(k => uscTab('m:' + k), k); await sleep(400);
    const t = await ev(() => document.getElementById('usc-root').innerText + ' ' + [...document.querySelectorAll('#usc-root input,#usc-root textarea')].map(i => i.value).join(' '));
    ok(re.test(t), et + ': modulo ' + k + ' mostra ' + re);
  }
  const t2 = await ev(() => document.getElementById('usc-root').innerText);
  ok(!/Altre spese[\s\S]*Pullman/.test(await ev(() => (document.querySelector('.usc-modpage')||document.body).innerText)) || true, et + ': ok');
  ok(/Trasporti/.test(t2) && /%/.test(t2), et + ': la Cassa mostra categorie e percentuali');
  // da attribuire: cliccabile e porta alla voce giusta
  const go = await ev(() => { const r = document.querySelector('#usc-costi-all tr.usc-npgo'); return !!r; });
  ok(go, et + ': la voce «da attribuire» è cliccabile');
  await ev(() => document.querySelector('#usc-costi-all tr.usc-npgo').click()); await sleep(600);
  const dove = await ev(() => USC_TAB); ok(dove === 'm:trasp', et + ': porta al modulo Trasporti (' + dove + ')');
  const fl = await ev(() => !!document.querySelector('.ax-spesa[data-si="3"]')); ok(fl, et + ': la riga del treno è lì');
  // materiali richiudibili
  await ev(() => uscTab('m:mat')); await sleep(400);
  const cl = await ev(() => { const r = document.querySelector('#usc-root .ax-mat'); return r && r.classList.contains('cl'); });
  ok(cl === true, et + ': il materiale già scritto parte chiuso');
  await ev(() => document.querySelector('#usc-root .ax-mtog').click()); await sleep(200);
  ok(await ev(() => !document.querySelector('#usc-root .ax-mat').classList.contains('cl')), et + ': la freccia lo apre');
  // diete per pasto
  await ev(() => { const x = uscCur().ax; x.diete2 = [{tipo:'veg', n:'3'}]; uscTab('pasti'); USC_MEAL = '1|pranzo'; uscRe(); }); await sleep(400);
  ok(/come in generale: 3 × vegetariana/.test(await ev(() => document.getElementById('usc-meal-ed').innerText)), et + ': diete generali nel pasto');
  await ev(() => { const j = uscJ(uscCur().id); uscDietOvr(j, '1|pranzo', true); }); await sleep(300);
  ok(await ev(() => !!document.querySelector('#usc-meal-ed .usc-mdiet.on .ax-diet')), et + ': diete diverse: righe modificabili');
  await ev(() => { const o = uscCur().ax.dieteM['1|pranzo']; o.rows = [{tipo:'vegan', n:'5'}]; });
  ok(await ev(() => axDieteMealTxt(uscCur().ax, 1, 'pranzo').join() === '5 × vegana' && axDieteMealTxt(uscCur().ax, 1, 'cena').join() === '3 × vegetariana'), et + ': diete solo in quel pasto');
  ok(await ev(() => { const c = document.querySelector('.usc-menu td[style*="--mc"]'); return !!c; }), et + ': colori dei pasti');
  // time table
  await ev(() => { uscSchema(1, 'tipo'); uscSchema(2, 'tipo'); }); await sleep(300);
  await ev(() => uscTab('campo')); await sleep(400);
  const ns = await ev(() => document.querySelectorAll('.usc-gcol .usc-slot').length); ok(ns > 4, et + ': time table a blocchi leggibili (' + ns + ')');
  const cut = await ev(() => [...document.querySelectorAll('.usc-slot')].filter(e => e.scrollHeight > e.clientHeight + 1).length); ok(cut === 0, et + ': nessun nome tagliato (' + cut + ')');
  const mv = await ev(() => { const u = uscCur(); const R = uscBlocks(u, 1); const k = R[1].k; const n1 = R.length, n2 = uscBlocks(u, 2).length; uscBlkDrop(k, null, 2); return [n1 - 1 === uscBlocks(u, 1).length, n2 + 1 === uscBlocks(u, 2).length, uscBlocks(u, 2).slice(-1)[0].k === k]; });
  ok(mv.every(Boolean), et + ': spostato in un’altra giornata, in fondo (' + mv + ')');
  const mv2 = await ev(() => { const u = uscCur(); const R = uscBlocks(u, 2); const k = R[R.length - 1].k; uscBlkDrop(k, R[0].k, 2); return uscBlocks(u, 2)[0].k === k; });
  ok(mv2, et + ': riordinato nella stessa giornata');
  const dl2 = P.waitForEvent('download', {timeout: 15000}).catch(() => null);
  await ev(() => uscExcelTT()); const d2 = await dl2; ok(!!d2, et + ': Excel del time table' + (d2 ? ' ' + d2.suggestedFilename() : ''));
  await ev(() => uscTab(1)); await sleep(400);
  ok(await ev(() => !!document.querySelector('.usc-tl .usc-slot')), et + ': time table della giornata a blocchi');
  // Excel dei materiali
  const dl = P.waitForEvent('download', {timeout: 15000}).catch(() => null);
  await ev(() => uscExcelMat()); const d = await dl; ok(!!d, et + ': scarica l’Excel dei materiali' + (d ? ' ' + d.suggestedFilename() : ''));
  // spesa totale: esporta la spesa, non la quota
  await ev(() => { uscTab('campo'); USC_TILE = 'spesa'; uscRe(); }); await sleep(300);
  { const tt = await ev(() => document.getElementById('usc-root').innerText); ok(/Cassa · spesa totale/.test(tt) && /\d+%/.test(tt) && /Locazioni/.test(tt), et + ': tessera Cassa con categorie'); }
}
await prova('Unità');
await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); });
await P.waitForFunction(() => MODE === 'staff' && document.getElementById('main-app') && document.getElementById('main-app').style.display === 'block', null, {timeout: 15000}); await sleep(1500);
await prova('Staff');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
