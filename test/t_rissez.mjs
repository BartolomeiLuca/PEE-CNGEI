// «Riservato» sugli eventi dell'Unità: non salgono al calendario della Sezione. Compare solo per le uscite, i bivacchi e i campi dell'Unità (non le riunioni, non gli eventi dello staff).
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const _arg = process.argv[2] || 'chromium'; const _prof = PROFILES[_arg];
const engine = _prof ? _prof[0] : _arg; const DEV = Object.assign({}, _prof ? _prof[1] : {}); delete DEV.defaultBrowserType; if(engine === 'firefox') delete DEV.isMobile;

const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db, {ctx:Object.assign({}, DEV)}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(1200);
await loginAs(P, base, A); await ev(() => exStart('AN')); await sleep(3500); await ev(() => { try{ clClose(); }catch(e){} });
const r = await ev(async () => {
  const w = ms => new Promise(r => setTimeout(r, ms)); shCal(); await w(600);
  const M = uscMap(); const mk = (m, dest) => { const id = uscNewId('u'); M[id] = {id, modello:m, testo:'Prova ' + m + (dest || ''), ax:{data:'2027-05-14', durata:'1'}, dest:dest || 'unita', cr:Date.now()}; return id; };
  const idG = mk('giorno'), idS = mk('sede'), idSt = mk('giorno', 'staff'); const out = {};
  const sp = id => { shSrUsc(id, 0, ''); return w(500).then(() => !!document.querySelector('input[onchange^="uscSetRisSez"]')); };
  out.giorno = await sp(idG); out.sede = await sp(idS); out.staff = await sp(idSt);
  await sp(idG); const cb = document.querySelector('input[onchange^="uscSetRisSez"]'); cb.checked = true; cb.dispatchEvent(new Event('change')); await w(300);
  out.on = M[idG].risSez === true; await sp(idG); const cb2 = document.querySelector('input[onchange^="uscSetRisSez"]'); out.spuntato = !!(cb2 && cb2.checked);
  cb2.checked = false; cb2.dispatchEvent(new Event('change')); await w(300); out.off = M[idG].risSez === undefined;
  return out;
});
console.log(JSON.stringify(r));
ok(r.giorno === true, 'uscita dell’Unità: la spunta «Riservato» c’è');
ok(r.sede === false, 'riunione: nessuna spunta (non sale mai)');
ok(r.staff === false, 'evento dello staff: nessuna spunta (non sale mai)');
ok(r.on === true && r.spuntato === true, 'spuntando, l’evento resta segnato «Riservato» (anche riaprendolo)');
ok(r.off === true, 'togliendo la spunta il segno sparisce');
ok(!pa.errors.length, 'nessun errore ' + pa.errors.slice(0, 2).join('|'));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
