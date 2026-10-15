// Domande di feedback: quando compaiono, invio, «Non ora», «Non chiedermelo più», mai nel progetto di esempio
process.env.SV = '1';
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const sent = []; let fail = false;
await P.route(/api\.web3forms\.com/, async r => { const b = r.request().postData() || ''; if (fail) return r.fulfill({status: 500, body: '{}'}); sent.push(b); await r.fulfill({status: 200, contentType: 'application/json', body: '{"success":true}'}); });
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1500);
const shown = () => ev(() => !!document.querySelector('#g-modal.show .sv-box'));
// progetto di esempio: mai
await ev(() => gGo('4')); await sleep(2500);
ok(!(await shown()), 'nel progetto di esempio le domande non compaiono');
// progetto «vero»
await ev(() => { window._exNoAcc = false; UNIT_NAME = 'Reparto Prova'; window._svShown = false; gGo('3'); }); await sleep(400);
ok(await ev(() => svAttCount() >= 3), 'ci sono almeno tre attività scritte');
await ev(() => gGo('4')); await sleep(2500);
ok(await shown(), 'dopo la Sezione 3 compare la domanda «Hai progettato le prime attività»');
ok(await ev(() => /Hai progettato le prime attività/.test(document.querySelector('.sv-box').textContent)), 'titolo giusto');
await P.click('.sv-v[data-v="4"]'); await P.fill('#sv-a', 'La lettura del gruppo'); await P.fill('#sv-b', 'Più esempi per il Branco'); await P.click('#sv-go'); await sleep(2200);
const body = decodeURIComponent(sent.join('\n'));
ok(sent.length === 1 && /Utilità \(1-5\): 4/.test(body) && /La lettura del gruppo/.test(body) && /Più esempi per il Branco/.test(body) && /Feedback/.test(body), 'invio con voto e risposte');
ok(!/Quartiere residenziale|Capo di esempio|Kontiki/.test(body), 'nessun dato del progetto nella mail');
ok(await ev(() => svGet('sez3') === 'fatto' && !document.querySelector('#g-modal.show')), 'dopo l’invio la finestra si chiude e non viene più chiesta');
await ev(() => { window._svShown = false; gGo('5'); }); await sleep(2500);
ok(!(await shown()), 'la stessa domanda non torna');
// «Non ora» al massimo due volte
for (let i = 0; i < 2; i++) { await ev(() => { window._svShown = false; svAfter('word', 0); }); await sleep(400); ok(await shown(), '«Hai scaricato la Scheda» compare (volta ' + (i + 1) + ')'); await P.locator('.sv-btns button', {hasText: 'Non ora'}).click(); await sleep(300); }
await ev(() => { window._svShown = false; svAfter('word', 0); }); await sleep(400);
ok(!(await shown()), 'dopo due «Non ora» non viene più chiesta');
// errore di rete: resta da chiedere
fail = true; await ev(() => { window._svShown = false; localStorage.removeItem('bussola_sv_staff'); svAfter('staff', 0); }); await sleep(400);
await P.click('.sv-v[data-v="2"]'); await P.click('#sv-go'); await sleep(1500);
ok(await ev(() => /Non riesco/.test(document.getElementById('sv-msg').textContent) && svGet('staff') !== 'fatto'), 'senza rete: messaggio chiaro, la domanda resta da fare');
fail = false;
// «Non chiedermelo più»
await P.locator('.sv-never').click(); await sleep(300);
await ev(() => { window._svShown = false; svAfter('staff', 0); }); await sleep(400);
ok(!(await shown()) && await ev(() => svGet('off') === '1'), '«Non chiedermelo più» le spegne tutte');
// una sola domanda per visita
await ev(() => { localStorage.removeItem('bussola_sv_off'); localStorage.removeItem('bussola_sv_staff'); window._svShown = false; svAfter('staff', 0); svAfter('word', 0); }); await sleep(500);
ok(await ev(() => document.querySelectorAll('#g-modal.show .sv-box').length === 1), 'mai due domande insieme');
await P.locator('.sv-btns button', {hasText: 'Non ora'}).click();
// chiudere con la X conta come «Non ora»
await ev(() => { localStorage.removeItem('bussola_sv_staff'); window._svShown = false; svAfter('staff', 0); }); await sleep(400);
await ev(() => modalClose()); await sleep(200);
ok(await ev(() => svGet('staff') === '1'), 'chiudere con la X conta come «Non ora»');
// sul telefono la finestra sta nello schermo
await P.setViewportSize({width: 375, height: 700}); await ev(() => { localStorage.removeItem('bussola_sv_staff'); window._svShown = false; svAfter('staff', 0); }); await sleep(500);
ok(await ev(() => { const b = document.querySelector('#g-modal .sv-box').getBoundingClientRect(); return b.width <= 375 && document.documentElement.scrollWidth <= 376; }), 'sul telefono la finestra sta nello schermo');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
