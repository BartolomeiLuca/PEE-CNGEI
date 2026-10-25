// Richieste del 25 ottobre (4-13): cosa osservo, adulti ×, togli dall'uscita, Ritrovo e spostamenti + sede 1.1, «Per te» preciso,
// strumenti del metodo, «Chi paga?», ragazzi da 1.1, cibo in un solo modo
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('dialog', d => d.accept().catch(() => {}));
const errs = []; P.on('pageerror', e => errs.push(e.message));
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => { scheda.pp.staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it', eta:'34'}]; scheda.pp.sezione = 'Pesaro'; scheda.pp.sedeVia = 'Via Roma 1'; scheda.pp.sedeCitta = '61122 Pesaro (PU)'; scheda.pp.numTot = '18'; scheda.pp.numF = '7'; saveData(true); });
await ev(() => gGo('3')); await sleep(800);
const [p, j] = await ev(() => { const all = getAllPercorsi(); const i = all.findIndex(x => x.percorsoId === 'S3'); return [i >= 0 ? i : 0, 1]; });
await ev(([p, j]) => { ['chi','log','durante','mat','pasti','costi','sic','circ'].forEach(k => axOpen[p + '-' + j + '-' + k] = true); const x = axX(p, j); x.durata = 'piu'; x.data = '2026-12-27'; x.dataFine = '2026-12-29'; axSave(); axRe(p, j); }, [p, j]); await sleep(500);
await ev(([p, j]) => { pcxOpen(p); let e = document.getElementById('ax-' + p + '-' + j); while(e){ if(e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } document.querySelectorAll('#ax-' + p + '-' + j + ' details').forEach(d => d.open = true); }, [p, j]); await sleep(500);
const AX = `#ax-${p}-${j}`;
const txt = () => P.locator(AX).innerText();
// 7. nome del modulo
ok(/Ritrovo e spostamenti/.test(await txt()) && !/Logistica/.test(await txt()), '7: il modulo si chiama «Ritrovo e spostamenti»');
// 8. sede 1.1
ok(await P.locator(`${AX} button:visible`, {hasText:'Usa l’indirizzo della sede'}).count() >= 1, '8: pulsante «Usa l’indirizzo della sede»');
await P.locator(`${AX} button:visible`, {hasText:'Usa l’indirizzo della sede'}).first().click(); await sleep(400);
ok(await ev(([p, j]) => axX(p, j).luogo.ritrovoDove, [p, j]) === 'Via Roma 1, 61122 Pesaro (PU)', '8: ritrovo = indirizzo della sede');
// 12. ragazzi da 1.1
await P.locator(`${AX} button:visible`, {hasText:'Prendi i ragazzi dell’Unità'}).first().click(); await sleep(400);
const pr = await ev(([p, j]) => axX(p, j).pres, [p, j]); ok(String(pr.rag) === '18' && String(pr.ragF) === '7', '12: ragazzi = 18, ragazze = 7 (' + JSON.stringify(pr) + ')');
// 5. adulto non dello staff con ×
await ev(([p, j]) => { const x = axX(p, j); x.pres.ad = [axPeople()[0], 'Ospite Verdi']; axSave(); axRe(p, j); }, [p, j]); await sleep(300);
ok(await P.locator(`${AX} .ax-chipw button[title^="Togli"]`).count() === 1, '5: la × compare solo per chi non è nello staff');
await P.locator(`${AX} .ax-chipw button[title^="Togli"]`).click(); await sleep(300);
ok(!(await ev(([p, j]) => axX(p, j).pres.ad, [p, j])).includes('Ospite Verdi'), '5: l’ospite è tolto del tutto');
// 4. cosa osservo: altri indicatori + libero
const o1 = await ev(([p, j]) => document.querySelector(`#ax-${p}-${j} .ax-oss-add select`) ? document.querySelectorAll(`#ax-${p}-${j} .ax-oss-add select option`).length : 0, [p, j]);
ok(o1 > 3, '4: menù per osservare indicatori di altri percorsi (' + o1 + ' opzioni)');
await ev(([p, j]) => { const s = document.querySelector(`#ax-${p}-${j} .ax-oss-add select`); const o = s.querySelectorAll('option')[2]; s.value = o.value; s.dispatchEvent(new Event('change')); }, [p, j]); await sleep(300);
ok((await ev(([p, j]) => axX(p, j).ossX || [], [p, j])).length === 1, '4: indicatore di un altro percorso aggiunto');
await P.locator(`${AX} button:visible`, {hasText:'Aggiungi altro da osservare'}).first().click().catch(() => {}); await sleep(300);
// 10. strumenti del metodo
const nS = await ev(([p, j]) => { const s = [...document.querySelectorAll(`#ax-${p}-${j} select`)].find(z => /altro strumento del metodo/.test(z.options[0].text)); return s ? s.options.length : 0; }, [p, j]);
ok(nS > 2, '10: posso aggiungere altri strumenti del metodo (' + nS + ')');
await ev(([p, j]) => { const s = [...document.querySelectorAll(`#ax-${p}-${j} select`)].find(z => /altro strumento del metodo/.test(z.options[0].text)); s.value = s.options[1].value; s.dispatchEvent(new Event('change')); }, [p, j]); await sleep(300);
ok((await ev(([p, j]) => axX(p, j).strum || [], [p, j])).length === 1, '10: strumento aggiunto e selezionato');
// 11. chi paga?
await ev(([p, j]) => { axX(p, j).spese = [{voce:'Ingressi', importo:50, modo:'forfait'}]; axSave(); axRe(p, j); }, [p, j]); await sleep(300);
ok(/Chi paga\?/.test(await txt()) && /Come si calcola/.test(await txt()), '11: «Chi paga?» e «Come si calcola» sopra le tendine');
// 13. cibo
const x13 = async (f) => ev(([p, j, f]) => { const x = axX(p, j); return eval(f); }, [p, j, f]);
await ev(([p, j]) => { const x = axX(p, j); x.cibo = {modo:'dettaglio'}; x.piatti = [{g:1, pasto:'pranzo', nome:'Pasta', per:'tutti', ingr:[{nome:'Pasta', dose:100, um:'g', prezzo:2}]}]; axSave(); axRe(p, j); }, [p, j]); await sleep(300);
const cD = await ev(([p, j]) => axFoodCost(axX(p, j)), [p, j]); ok(cD > 0, '13: dagli ingredienti il costo c’è (' + cD.toFixed(2) + ')');
ok(/Come entra il cibo nella quota/.test(await txt()), '13: in cima la scelta «Come entra il cibo nella quota»');
await ev(([p, j]) => axCiboModo(p, j, 'medio'), [p, j]); await sleep(300);
await ev(([p, j]) => { axX(p, j).cibo.medio = '8'; axSave(); axRe(p, j); }, [p, j]);
const cM = await ev(([p, j]) => [axFoodCost(axX(p, j)), axN(axX(p, j)).tot, axFoodDays(axX(p, j))], [p, j]);
ok(Math.abs(cM[0] - 8 * cM[1] * cM[2]) < 0.001 && cM[2] === 3, '13: 8 € al giorno a persona × ' + cM[1] + ' persone × 3 giorni = ' + cM[0] + ' (il menù non si somma)');
ok(await P.locator(`${AX} input[title="Prezzo indicativo"]`).count() === 0, '13: con il costo a persona i prezzi degli ingredienti spariscono');
await ev(([p, j]) => axCiboModo(p, j, 'servizio'), [p, j]);
ok(await ev(([p, j]) => axFoodCost(axX(p, j)), [p, j]) === 0, '13: con il servizio cambusa il cibo non entra nella quota');
ok(errs.length === 0, 'nessun errore di pagina ' + errs.join('|'));
// 9. «Per te»: apre proprio la parte affidata
await ev(([p, j]) => { ['chi','log','durante','mat','pasti','costi','sic','circ'].forEach(k => delete axOpen[p + '-' + j + '-' + k]); axRe(p, j); document.querySelectorAll('#ax-' + p + '-' + j + ' details[data-k]').forEach(d => d.open = false); }, [p, j]); await sleep(300);
await ev(([p, j]) => ptOpenPart(p, j, ['costi']), [p, j]); await sleep(900);
ok(await ev(([p, j]) => { const d = document.querySelector('#ax-' + p + '-' + j + ' details[data-k="costi"]'); return !!(d && d.open); }, [p, j]), '9: «Per te» apre la parte «Cassa e costi» dentro l’attività');
ok(await ev(([p, j]) => { const d = document.querySelector('#ax-' + p + '-' + j + ' details[data-k="log"]'); return !(d && d.open); }, [p, j]), '9: le altre parti restano chiuse');
ok(await ev(() => { const old = CL.user; CL.user = {email:'anna@x.it'}; const it = affMine([{attivita:[{testo:'x', condivisa:true, ax:{ref:{cassa:'anna@x.it'}}}]}], [{nome:'Anna Rossi', mail:'anna@x.it'}]); CL.user = old; return JSON.stringify(it.map(i => i.gk)); }) === '[["costi"]]', '9: l’elenco «Per te» sa quale parte è tua');
// 6. togli l'attività dall'uscita senza andare all'uscita
await ev(() => gGo('usc')).catch(() => {}); await sleep(600);
await ev(() => { if(typeof uscHome === 'function') uscHome(); }).catch(() => {}); await sleep(300);
await ev(() => uscNewStart()); await sleep(400);
await P.fill('#usc-new-t', 'Campo prova');
await P.fill('#usc-new-d1', '2026-12-27'); await P.locator('#usc-new-d1').dispatchEvent('change');
await P.fill('#usc-new-d2', '2026-12-29'); await P.locator('#usc-new-d2').dispatchEvent('change'); await sleep(100);
await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
const uid = await ev(() => uscCur().id);
const kk = await ev(([p, j, uid]) => uscAttInto(p, j, uid, true), [p, j, uid]);
await ev(() => gGo('3')); await sleep(600);
await ev(([p, j]) => { pcxOpen(p); let e = document.getElementById('ax-' + p + '-' + j); while(e){ if(e.tagName === 'DETAILS') e.open = true; e = e.parentElement; } axRe(p, j); }, [p, j]); await sleep(400);
const htm = await ev(([p, j]) => uscAttHTML(p, j, getAllPercorsi()[p].attivita[j]), [p, j]);
ok(/Togli da/.test(htm), '6: in «Hai un’uscita o un campo?» c’è «Togli da …»');
await ev(([p, j, uid, kk]) => uscAttOut(p, j, uid, kk), [p, j, uid, kk]); await sleep(300);
ok(await ev(([uid, kk]) => !!uscGet(uid).prog[kk].del, [uid, kk]), '6: l’attività è tolta dall’uscita');
ok(!/Togli da/.test(await ev(([p, j]) => uscAttHTML(p, j, getAllPercorsi()[p].attivita[j]), [p, j])), '6: ora non risulta più nell’uscita');
ok(errs.length === 0, 'nessun errore di pagina (2) ' + errs.join('|'));
summary();
await br.close(); process.exit(0);
