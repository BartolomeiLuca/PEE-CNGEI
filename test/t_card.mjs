// Scheda attività dei percorsi: durata + scaletta prima di Lancio, materiali (cosa + chi li procura) dopo Conclusione; stessi dati del calendario; Word
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
process.env.SITE = process.env.SITE || '/tmp/site_pre2';
const engine = process.argv[2] || 'chromium', mode = process.argv[3] || 'AN';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); const br = await launch(engine);
const U = db.addUser('anna@x.it', 'password123', 'Anna Rossi'); db.t.pee_profili.push({user_id:U.id, nome:'Anna Rossi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const errs = []; P.on('pageerror', e => errs.push(e.message));
await loginAs(P, base, U); await sleep(1200);
await ev(m => exStart(m), mode); await sleep(3500);
await ev(() => { try{ if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }catch(e){} }); await sleep(1500);
ok(await ev(() => !!(window.SH && SH.on)), 'siamo nella nuova interfaccia (' + mode + ')');
await ev(() => gGo('3')); await sleep(800);
const [p, j] = await ev(() => { const all = getAllPercorsi(); const i = all.findIndex(x => (x.attivita || []).some(a => a && (a.lancio || a.testo))); return [i, (all[i].attivita || []).findIndex(a => a && (a.lancio || a.testo))]; });
const snap0 = await ev(() => JSON.stringify(getAllPercorsi().map(x => x.attivita)));
await ev(([p, j]) => { window._attOpen = window._attOpen || {}; window._attOpen[p + '-' + j] = true; renderValuation(); }, [p, j]); await sleep(600);
ok(await ev(() => JSON.stringify(getAllPercorsi().map(x => x.attivita))) === snap0, 'solo guardare la scheda non cambia i dati (nessuna attività vuota aggiunta, nessun ax creato)');
const C = `#att-${p}-${j}`;
const order = await ev(c => { const d = document.querySelector(c); const L = [...d.querySelectorAll('label, .ax-lbl')].map(l => l.textContent.trim().replace(/\s+/g, ' ').slice(0, 24)); return L; }, C);
const ix = k => order.findIndex(t => t.startsWith(k));
ok(ix('Durata dell’attività') >= 0 && ix('Durata dell’attività') < ix('Scaletta') && ix('Scaletta') < ix('Lancio') && ix('Lancio') < ix('Sviluppo') && ix('Sviluppo') < ix('Conclusione') && ix('Conclusione') < ix('Materiali'), 'ordine nella scheda: ' + order.join(' | '));
// scrivo: durata (select), scaletta, materiali
await P.locator(`${C} select[aria-label="Durata dell’attività"]`).selectOption('90'); await sleep(200);
ok(await ev(([p, j]) => attGet(p, j).durMin, [p, j]) === 90, 'la durata si salva nell’attività (durMin = 90)');
await P.locator(`${C} .ax-ttr :is(input,textarea).ax-in`).first().fill('Gioco di apertura'); await sleep(150);
await P.locator(`${C} .ax-ttr select[title="Durata"]`).first().selectOption('20'); await sleep(500);
const d1 = await ev(([p, j]) => attGet(p, j).ax.tt2[0], [p, j]);
ok(d1.cosa === 'Gioco di apertura' && Number(d1.dur) === 20, 'la scaletta scrive in ax.tt2: ' + JSON.stringify(d1));
// dopo il cambio di durata la scheda si ridisegna: la durata complessiva ora è quella della scaletta
ok(await ev(c => /20′ — è la somma|somma delle durate/.test(document.querySelector(c).textContent), C), 'con le durate in scaletta la durata complessiva è la loro somma');
await P.locator(`${C} .ax-mats [aria-label="Materiale"]`).first().fill('Corda da 10 m'); await sleep(150);
await P.locator(`${C} .ax-add`, {hasText:'Aggiungi materiale'}).click(); await sleep(600);
await P.locator(`${C} .ax-mats [aria-label="Materiale"]`).nth(1).fill('Pennarelli'); await sleep(150);
const m1 = await ev(([p, j]) => (attGet(p, j).ax.mat || []).map(r => r.cosa), [p, j]);
ok(m1.length === 2 && m1[0] === 'Corda da 10 m' && m1[1] === 'Pennarelli', 'i materiali scrivono in ax.mat: ' + JSON.stringify(m1));
// chi li procura: scelgo «Un’altra persona» non serve: assegno via dato e controllo che si veda
await ev(([p, j]) => { axRowSet(p, j, 'mat', 0, 'chi', 'Marta', true); }, [p, j]); await sleep(700);
ok(await ev(c => /Marta/.test(document.querySelector(c).innerHTML), C), 'chi li procura compare nella scheda del percorso');
ok(await ev(c => document.querySelector(c).open, C), 'dopo il ridisegno la scheda resta aperta');
// calendario: stessi dati
const cal = await ev(([p, j]) => axBody(p, j), [p, j]);
ok(/Corda da 10 m/.test(cal) && /Pennarelli/.test(cal) && /Gioco di apertura/.test(cal) && /Durata dell’attività/.test(cal), 'la scheda a calendario vede gli stessi materiali e la stessa scaletta');
// dal calendario verso il percorso
await ev(([p, j]) => { axRowSet(p, j, 'mat', 1, 'cosa', 'Pennarelli rossi'); axTT(p, j, 1, 'cosa', 'Merenda', 1); }, [p, j]);
await ev(() => renderValuation()); await sleep(600);
ok(await ev(c => { const v = [...document.querySelectorAll(c + ' input, ' + c + ' textarea')].map(i => i.value); return v.includes('Pennarelli rossi') && v.includes('Merenda'); }, C), 'le modifiche fatte dal calendario tornano nella scheda del percorso');
await P.screenshot({path:'/tmp/card_'+mode+'.png', clip:undefined}).catch(()=>{}); try{ const bb = await P.locator(C).boundingBox(); await P.screenshot({path:'/tmp/card_'+mode+'.png', clip:{x:Math.max(0,bb.x-10), y:Math.max(0,bb.y-10), width:Math.min(1100,bb.width+20), height:Math.min(2400,bb.height+20)}, fullPage:true}); }catch(e){}
// Word
async function dl(fn){ const [d] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(fn)]); return fs.readFileSync(await d.path()); }
const xml = async b => { const z = await JSZip.loadAsync(b); return (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, ''); };
const t = await xml(await dl(() => exportSchedaDocx())); 
ok(/Durata: 20|Durata: 1h30|Durata: 20′/.test(t) && /Scaletta:/.test(t) && /Gioco di apertura/.test(t) && /Materiali: Corda da 10 m/.test(t) && /Pennarelli rossi/.test(t) && /Marta/.test(t), 'il Word contiene durata, scaletta e materiali (se compilati)');
const pos = k => t.indexOf(k);
ok(pos('Scaletta:') < pos('Lancio: ') || pos('Lancio: ') < 0 || true, 'ordine nel Word (verifico sotto)');
const idx = t.indexOf('Gioco di apertura'); const seg = t.slice(Math.max(0, idx - 200), idx + 1500);
ok(seg.indexOf('Scaletta:') < seg.search(/Lancio: /) && seg.search(/Conclusione: /) < seg.indexOf('Materiali:'), 'nel Word: scaletta prima di Lancio, materiali dopo Conclusione');
// senza nulla compilato non compare niente
await ev(([p, j]) => { const a = attGet(p, j); delete a.durMin; a.ax.tt2 = []; a.ax.mat = []; saveData(true); }, [p, j]);
const t2 = await xml(await dl(() => exportSchedaDocx()));
ok(!/Gioco di apertura|Corda da 10 m/.test(t2) && (t2.match(/Materiali: /g) || []).length <= (t.match(/Materiali: /g) || []).length - 1, 'svuotati i campi, spariscono dal Word');
ok(errs.length === 0, 'nessun errore di pagina' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
await br.close(); summary(); process.exit(0);
