// Spostamento con ritorno in un altro giorno: il ritorno va nella giornata scelta (Unità e staff) e la segue se cambia
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('dialog', d => d.accept().catch(() => {}));
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
await ev(() => { scheda.pp.staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34'}, {ruolo:'VCU', nome:'Paolo Riva', mail:'paolo@x.it', eta:'24'}]; scheda.pp.sezione = 'Pesaro'; scheda.pp.gruppo = 'Gruppo Pesaro'; scheda.pp.numTot='20'; UNIT_NAME = 'Reparto Kontiki'; _clTouched = true; _clUserAt = Date.now(); saveData(true); });
async function prova(etichetta){
  await ev(() => gGo(MODE === 'staff' ? '4' : 'usc')).catch(() => {}); await sleep(800);
  await ev(() => { if(typeof uscHome === 'function') uscHome(); }).catch(() => {}); await sleep(300);
  await ev(() => uscNewStart()); await sleep(400);
  await P.fill('#usc-new-t', 'Campo ' + etichetta);
  await P.fill('#usc-new-d1', '2026-12-27'); await P.locator('#usc-new-d1').dispatchEvent('change');
  await P.fill('#usc-new-d2', '2026-12-30'); await P.locator('#usc-new-d2').dispatchEvent('change'); await sleep(100);
  await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
  await ev(() => uscTripAdd(1)); await sleep(500);
  const k = await ev(() => { const o = uscBlocks(uscCur(), 1).find(o => o.m.k === 'sposta'); return o && o.k; });
  ok(!!k, etichetta + ': spostamento aggiunto');
  await ev(k => { uscTrip(k, 'a', 'Rifugio'); uscTrip(k, 'ar', 'altro', true); uscTrip(k, 'ro', '16:00', true); }, k); await sleep(300);
  // il menu mostra la prima giornata utile (28 dicembre = giorno 2) e il ritorno finisce lì, senza toccare il menu
  await ev(k => uscTripRet(k), k); await sleep(400);
  const g1 = await ev(k => { const u = uscCur(), T = uscBlk(k).trip; return u.prog[T.rk] && u.prog[T.rk].g; }, k);
  ok(g1 === 2, etichetta + ': ritorno messo nella giornata 2, non in quella di partenza (giornata ' + g1 + ')');
  // scelgo un'altra giornata: il ritorno già inserito si sposta
  await ev(k => uscTrip(k, 'rg', '4', true), k); await sleep(300);
  const g2 = await ev(k => { const u = uscCur(), T = uscBlk(k).trip; return u.prog[T.rk] && u.prog[T.rk].g; }, k);
  ok(g2 === 4, etichetta + ': cambiando giorno il ritorno si sposta nella giornata 4 (' + g2 + ')');
  await ev(k => uscTrip(k, 'ro', '18:30', true), k); await sleep(300);
  const ora = await ev(k => { const u = uscCur(), T = uscBlk(k).trip; return u.prog[T.rk] && u.prog[T.rk].ora; }, k);
  ok(ora === '18:30', etichetta + ': cambiando ora il ritorno la segue (' + ora + ')');
  await ev(k => uscTrip(k, 'ar', '', true), k); await sleep(300);
  const del = await ev(k => { const u = uscCur(); return Object.values(u.prog).filter(m => m.k === 'sposta' && /Ritorno/.test(m.t||'') && !m.del).length; }, k);
  ok(del === 0, etichetta + ': «solo andata» toglie il ritorno dal programma');
}
await prova('Unità');
await ev(() => { window._pjPick = true; confirmBackToLanding(); selectMode('staff'); try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; startTool(); });
await P.waitForFunction(() => MODE === 'staff' && document.getElementById('main-app') && document.getElementById('main-app').style.display === 'block', null, {timeout: 15000}); await sleep(1500);
await prova('Staff');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 2).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
