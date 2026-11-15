// Correzioni 4-6: «Calcola distanza» e ricalcolo dei km, rientro nello stesso luogo, quota con la parte dei capi a parte
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
// finto OpenStreetMap: ogni città ha le sue coordinate; il percorso su strada = differenza di latitudine × 111 km
const CITY = {pesaro:[43.91, 12.91], urbino:[43.73, 12.64], fano:[43.84, 13.02], cotaline:[43.80, 12.40], stazione:[43.90, 12.90]};
await pa.ctx.route(/nominatim\.openstreetmap\.org/, r => { const q = decodeURIComponent(new URL(r.request().url()).searchParams.get('q') || '').toLowerCase();
  const k = Object.keys(CITY).find(c => q.includes(c)); const res = k ? [{lat:String(CITY[k][0]), lon:String(CITY[k][1]), display_name:k[0].toUpperCase() + k.slice(1) + ', Marche, Italia', address:{city:k}}] : [];
  r.fulfill({status:200, contentType:'application/json', body:JSON.stringify(res)}); });
await pa.ctx.route(/router\.project-osrm\.org/, r => { const m = /driving\/([\d.]+),([\d.]+);([\d.]+),([\d.]+)/.exec(r.request().url());
  const d = Math.abs(+m[2] - +m[4]) * 111000 + Math.abs(+m[1] - +m[3]) * 80000; r.fulfill({status:200, contentType:'application/json', body:JSON.stringify({routes:[{distance:d}]})}); });
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.evaluate(() => exStart('AN')); await sleep(1800); await P.evaluate(() => { window._uscFull = new Proxy({}, {get: () => true}); });
await ev(() => gGo('3')); await sleep(800);
const [p, j] = await ev(() => { const all = getAllPercorsi(); const i = all.findIndex(x => x.percorsoId === 'S3'); return [i, 1]; });
const AX = `#ax-${p}-${j}`;
await ev(([p, j]) => { const x = axX(p, j); x.luogo = x.luogo || {}; x.luogo.mezzo = 'bus'; x.luogo.km = ''; delete x.luogo.lat; delete x.luogo.lon; delete x.luogo.nomeAddr; x.luogo.nome = 'Rifugio Cotaline'; axSave(); ['chi','log','durante','mat','pasti','costi','sic','circ','imp'].forEach(k => axOpen[p+'-'+j+'-'+k] = true); axRe(p, j); let e = document.getElementById('ax-'+p+'-'+j); while(e){ if(e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } document.querySelectorAll('#ax-'+p+'-'+j+' details').forEach(d => d.open = true); }, [p, j]); await sleep(300);
const km = () => P.locator(`${AX} #ax-km-${p}-${j}`).inputValue();
const NEWFROM = await P.locator(`${AX} :is(input,textarea)[oninput*="luogo.from"]`).count() === 0;   // anteprima: la partenza è il luogo di ritrovo
const FROM = () => NEWFROM ? P.locator(`${AX} :is(input,textarea)[oninput*="'ritrovoDove'"]`) : P.locator(`${AX} :is(input,textarea)[oninput*="luogo.from"]`);
const RIT = NEWFROM ? 'Pesaro' : 'piazza del Popolo';
console.log('DBGX', JSON.stringify(await ev(([p,j]) => ({km: !!document.getElementById('ax-km-'+p+'-'+j), grp: [...document.querySelectorAll('#ax-'+p+'-'+j+' details.ax-g')].map(g=>g.dataset.k+(g.open?'+':'-')), body:(document.getElementById('ax-'+p+'-'+j)||{}).innerText.slice(0,300)}), [p,j])));
process.exit(0);
