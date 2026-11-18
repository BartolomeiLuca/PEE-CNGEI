// Nuovi campi: «Appunti dal Piano di Gruppo e dal Progetto di Sezione» (1.1, dopo gli adulti) e «Appunti dalla Programmazione dell’anno precedente» (1.3); Word solo se compilati
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const mode = process.argv[2] || 'AN';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); const br = await launch(process.argv[3] || 'chromium');
const U = db.addUser('anna@x.it', 'password123', 'Anna Rossi'); db.t.pee_profili.push({user_id:U.id, nome:'Anna Rossi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const errs = []; P.on('pageerror', e => errs.push(e.message));
await loginAs(P, base, U); await sleep(1200); await ev(m => exStart(m), mode); await sleep(3500);
await ev(() => { try{ if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }catch(e){} }); await sleep(1500);
async function dl(fn){ const [d] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(fn)]); return fs.readFileSync(await d.path()); }
const xml = async b => { const z = await JSZip.loadAsync(b); return (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, ''); };
await ev(() => { delete scheda.pp.appPdg; delete scheda.pp.appPrec; saveData(true); });
const t0 = await xml(await dl(() => exportSchedaDocx()));
ok(!/Appunti dal Piano di Gruppo|Appunti dalla Programmazione dell’anno precedente/.test(t0), 'Word: vuoti, i due campi non compaiono');
// 1.1: pagina «Staff» (PE) o pagina del contesto (PP)
await ev(m => { window._ctxF = m === 'PP' ? 'pctx' : 'staff'; gGo('1a'); }, mode); await sleep(1200);
const L = P.locator('textarea[oninput*="appPdg"]');
ok(await L.count() === 1 && await L.first().isVisible(), 'il campo Piano di Gruppo / Progetto di Sezione è visibile nella pagina degli adulti in staff');
const order = await ev(() => { const a = document.getElementById('staff-tab'), t = document.querySelector('textarea[oninput*="appPdg"]'); return !!(a.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING); });
ok(order, 'sta subito dopo la tabella degli adulti');
await L.first().fill('Il Piano di Gruppo chiede più uscite congiunte'); await sleep(300);
ok(await ev(() => scheda.pp.appPdg) === 'Il Piano di Gruppo chiede più uscite congiunte', 'si salva in scheda.pp.appPdg');
// 1.3
await ev(() => { gGo('1c'); }, null); await sleep(1200);
const A = P.locator('#app-prec'); ok(await A.count() === 1 && await A.isVisible(), 'il campo appunti anno precedente è visibile in 1.3');
const o3 = await ev(() => { const t = [...document.querySelectorAll('#val-root .gblock label, .gblock label')].map(e => e.textContent.trim().slice(0, 28)).filter(x => /^(Analisi delle dinamiche|Appunti dalla Programmazione|Aspetti positivi e)/.test(x)); return t; });
ok(o3.length === 3 && /^Analisi/.test(o3[0]) && /^Appunti/.test(o3[1]) && /^Aspetti/.test(o3[2]), 'ordine in 1.3: dinamiche → appunti anno precedente → aspetti positivi: ' + o3.join(' | '));
await A.fill('Lo scorso anno le serate lunghe hanno stancato il gruppo'); await sleep(300);
ok(await ev(() => scheda.pp.appPrec) === 'Lo scorso anno le serate lunghe hanno stancato il gruppo', 'si salva in scheda.pp.appPrec');
// pulsante «porta qui»: simulo il testo dell'anno scorso
await ev(() => { SH._prevTxt = 'Verifica dell’anno: tanti giochi'; modalClose(); shPrevToField(); }); await sleep(300);
ok(await ev(() => document.getElementById('app-prec').value.includes('Verifica dell’anno: tanti giochi') && document.getElementById('app-prec').value.includes('serate lunghe')), 'portare gli appunti NON cancella quello già scritto');
await ev(() => { SH._prevTxt = 'Verifica dell’anno: tanti giochi'; shPrevToField(); }); await sleep(200);
ok(await ev(() => (document.getElementById('app-prec').value.match(/tanti giochi/g) || []).length) === 1, 'e riportarli due volte non li duplica');
// Word
const t1 = await xml(await dl(() => exportSchedaDocx()));
ok(/Appunti dal Piano di Gruppo e dal Progetto di Sezione/.test(t1) && /uscite congiunte/.test(t1) && /Appunti dalla Programmazione dell’anno precedente/.test(t1) && /serate lunghe/.test(t1), 'Word: i due campi compilati compaiono');
const iD = t1.indexOf('Analisi delle dinamiche'), iA = t1.indexOf('Appunti dalla Programmazione dell’anno precedente'), iP = t1.indexOf('Aspetti positivi', iA);
ok(iD >= 0 && iA > iD && iP > iA, 'Word: ordine dinamiche → appunti anno precedente → aspetti positivi');
ok(errs.length === 0, 'nessun errore di pagina ' + errs.slice(0, 2).join('|'));
await br.close(); summary(); process.exit(0);
