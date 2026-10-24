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
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => gGo('3')); await sleep(800);
const [p, j] = await ev(() => { const all = getAllPercorsi(); const i = all.findIndex(x => x.percorsoId === 'S3'); return [i, 1]; });
const AX = `#ax-${p}-${j}`;
await ev(([p, j]) => { const x = axX(p, j); x.luogo.mezzo = 'bus'; x.luogo.km = ''; delete x.luogo.lat; delete x.luogo.lon; delete x.luogo.nomeAddr; x.luogo.nome = 'Rifugio Cotaline'; axSave(); ['chi','log','durante','mat','pasti','costi','sic','circ','imp'].forEach(k => axOpen[p+'-'+j+'-'+k] = true); axRe(p, j); let e = document.getElementById('ax-'+p+'-'+j); while(e){ if(e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } document.querySelectorAll('#ax-'+p+'-'+j+' details').forEach(d => d.open = true); }, [p, j]); await sleep(300);
const km = () => P.locator(`${AX} #ax-km-${p}-${j}`).inputValue();
const NEWFROM = await P.locator(`${AX} :is(input,textarea)[oninput*="luogo.from"]`).count() === 0;   // anteprima: la partenza è il luogo di ritrovo
const FROM = () => NEWFROM ? P.locator(`${AX} :is(input,textarea)[oninput*="'ritrovoDove'"]`) : P.locator(`${AX} :is(input,textarea)[oninput*="luogo.from"]`);
const RIT = NEWFROM ? 'Pesaro' : 'piazza del Popolo';
// 4. distanza
ok(await P.locator(`${AX} button:visible`, {hasText:'Calcola distanza'}).count() === 1, 'c’è il pulsante «Calcola distanza» accanto ai km');
await FROM().fill('Pesaro'); await sleep(200);
await P.locator(`${AX} button:visible`, {hasText:'Calcola distanza'}).click(); await sleep(1200);
const k1 = await km(); const exp1 = String(Math.round(2 * (0.11 * 111 + 0.51 * 80)));
ok(k1 === exp1, '«Calcola distanza»: km andata e ritorno su strada (' + k1 + ', atteso ' + exp1 + ')');
for(let i = 0; i < 15 && !/km andata e ritorno/.test(await P.locator(`#ax-geo-r-${p}-${j}`).textContent()); i++) await sleep(300);   // su Firefox il ricalcolo automatico può arrivare subito dopo
ok(/Pesaro: \d+ km andata e ritorno, su strada/.test(await P.locator(`#ax-geo-r-${p}-${j}`).textContent()), 'spiega da dove e come li ha calcolati');
await FROM().fill('Fano'); await sleep(2600);
const k2 = await km(); const exp2 = String(Math.round(2 * (0.04 * 111 + 0.62 * 80)));
ok(k2 === exp2, 'cambiando la partenza i km si ricalcolano da soli (' + k1 + ' → ' + k2 + ')');
ok(await ev(() => document.activeElement && /luogo\.from|ritrovoDove/.test(document.activeElement.getAttribute('oninput') || '')), 'il ricalcolo non toglie il cursore dal campo');
await FROM().fill('Pesaro'); await sleep(200);
await P.locator(`${AX} :is(input,textarea)[oninput*="axPlaceIn"][oninput*="'nome'"]`).fill('Urbino'); await sleep(2600);
const k3 = await km(); const exp3 = String(Math.round(2 * (0.18 * 111 + 0.27 * 80)));
ok(k3 === exp3, 'cambiando la destinazione i km si ricalcolano (' + k3 + ', atteso ' + exp3 + ')');
// 5. rientro
const same = () => P.locator(`#ax-same-${p}-${j}`);
ok(await same().isChecked(), '«Rientro nello stesso luogo della partenza» spuntato se ritrovo e rientro coincidono');
ok(await P.locator(`${AX} :is(input,textarea)[oninput*="'rientroDove'"]`).count() === 0, 'con la spunta il campo del rientro non si compila due volte');
await P.locator(`${AX} :is(input,textarea)[oninput*="'ritrovoDove'"]`).fill(RIT); await sleep(400);
ok(await ev(([p, j]) => axX(p, j).luogo.rientroDove, [p, j]) === RIT, 'il rientro segue il ritrovo (anche per la circolare)');
await same().uncheck(); await sleep(300);
ok(await P.locator(`${AX} :is(input,textarea)[oninput*="'rientroDove'"]`).count() === 1, 'togliendo la spunta compare il luogo di rientro');
await P.locator(`${AX} :is(input,textarea)[oninput*="'rientroDove'"]`).fill('Stazione centrale'); await sleep(2600);
const k4 = await km(); const g = (a, b) => Math.abs(a[0] - b[0]) * 111 + Math.abs(a[1] - b[1]) * 80; const exp4 = String(Math.round(g(CITY.pesaro, CITY.urbino) + g(CITY.urbino, CITY.stazione)));
ok(k4 === exp4, 'con un rientro diverso i km sono andata + ritorno fino al rientro (' + k4 + ', atteso ' + exp4 + ')');
await sleep(1200); await P.reload(); await sleep(2500); await ev(() => gGo('3')); await sleep(800);
const openAx = () => ev(([p, j]) => { ['chi','log','durante','mat','pasti','costi','sic','circ','imp'].forEach(k => axOpen[p+'-'+j+'-'+k] = true); axRe(p, j); let e = document.getElementById('ax-'+p+'-'+j); while(e){ if(e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } document.querySelectorAll('#ax-'+p+'-'+j+' details').forEach(d => d.open = true); }, [p, j]);
ok(await ev(([p, j]) => { const L = axX(p, j).luogo; return L.rientroStesso === false && L.rientroDove === 'Stazione centrale'; }, [p, j]), 'la scelta resta dopo il ricaricamento');
// 6. quota
await ev(([p, j]) => { const x = axX(p, j); x.pres = {ad:['Giulia Neri (CU)', 'Paolo Riva (VCU)'], rag:20}; x.mat = []; x.cibo = {}; x.spese = [{voce:'Casa', importo:100, modo:'forfait', carico:'ragazzi'}, {voce:'Pullman', importo:50, modo:'pers', carico:'ragazzi'}]; delete x.capiCarico; axSave(); }, [p, j]); await openAx(); await sleep(300);
ok(await ev(([p, j]) => axQuota(axX(p, j)), [p, j]) === 55, 'fisso 100 € + 50 € a testa di bus, 20 ragazzi e 2 capi: i ragazzi pagano 55 € (non 60)');
const tot = await P.locator(`#ax-tot-${p}-${j}`).textContent();
ok(/Casa € 100,00 ÷ 20 = € 5,00 \+ Pullman € 50,00 a testa = € 55,00 a testa/.test(tot), 'il conto in chiaro: ' + (/Casa[^\n]*a testa/.exec(tot) || [''])[0]);
ok(/Ancora da attribuire: € 100,00[^]*Pullman · parte dei capi/.test(tot), 'la parte dei capi (2 × 50 €) compare a parte, da attribuire');
await P.locator(`#ax-capi-${p}-${j}`).selectOption('sezione'); await sleep(400);
ok(/A carico della Sezione: € 100,00/.test(await P.locator(`#ax-tot-${p}-${j}`).textContent()), 'la parte dei capi si attribuisce (Sezione)');
await P.locator(`#ax-capi-${p}-${j}`).selectOption('ragazzi'); await sleep(400);
ok(await ev(([p, j]) => axQuota(axX(p, j)), [p, j]) === 60, 'se si sceglie «la dividono i ragazzi» la quota torna a includerla (60 €)');
await P.locator(`#ax-capi-${p}-${j}`).selectOption(''); await sleep(300);
{ const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
  const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(([p, j]) => axDocx(p, j), [p, j])]);
  const t = (await (await JSZip.loadAsync(fs.readFileSync(await d.path()))).file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
  ok(/Quota: € 55,00 a testa/.test(t) && !/Come si calcola la quota/.test(t) && /Pullman · parte dei capi/.test(t), 'il Word della scheda organizzativa riporta la quota finale (senza il conto) e la parte dei capi'); }
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
