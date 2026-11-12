// Giro 3: focus dell'attività nella griglia, focus del KOS raggiungibili, riepilogo in fondo
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import fs from 'fs'; import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
const A = {id:'a1', nome:'Notte di stelle', aut:'Anna Verdi', ruolo:'tit', stato:'pronta', main:'S3', also:['P5'], dom:'', foc:['Guardo lo stupore.', 'Chi si offre per primo.'], focD:[{txt:'Guardo lo stupore.', pid:'S3', extra:[]}, {txt:'Chi si offre per primo.', pid:'P5', extra:['C3']}], dur:30, lan:'l', svi:'s', con:'c', at:1762800000000, sugg:{}};
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}], occMan:[{id:'x1', att:'Uscita di inizio anno', data:'2026-10-04', perc:['C3','P5']}, {id:'x9', att:'Gioco libero', data:'2026-10-11', perc:['C3']}], attOss:{a1:A}}}}, created_at:ts, updated_at:ts});
await loginAs(P, base, u); await sleep(1200);
await ev(() => shOpen('c1', 0)).catch(() => {}); await sleep(2800);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
await ev(() => { gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(900);
// riepilogo in fondo
let s = await ev(() => { const e = document.getElementById('oss-sum'); const rows = [...document.querySelectorAll('#oss-sum .oss-sm-r')]; const btn = [...document.querySelectorAll('button.btn-primary')].find(b => /Avanti — Sviluppo Personale/.test(b.textContent));
  return {has: !!e && !!e.querySelector('.oss-sm'), n: rows.length, last: e && btn ? !!(e.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING) : null, afterTab: e ? !!(document.getElementById('occ-tab').compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING) : null, cols: [...document.querySelectorAll('#oss-sum .oss-sm-t')].map(x => x.textContent).join('|'), txt: e ? e.textContent : ''}; });
ok(s.has && s.n === 24 && s.last && s.afterTab, 'in fondo alla pagina c’è il riepilogo con i 24 percorsi (dopo la tabella, prima di «Avanti»)');
ok(s.cols === 'Sviluppo Personale|Sviluppo Comunitario|Sviluppo Spirituale', 'tre colonne nell’ordine Personale, Comunitario, Spirituale');
ok(/osservato · 2 occasioni/.test(s.txt) && /osservato · 1 occasione/.test(s.txt) && /non osservato/.test(s.txt) && /un solo contesto: cercane un secondo/.test(s.txt), 'conteggi, invito al secondo contesto e «non osservato»');
const same = await ev(() => { const src = obsSources(); return [...document.querySelectorAll('#oss-sum .oss-sm-r')].every((r, i) => { const id = ['P', 'C', 'S'].flatMap(a => DB[a].map(p => p.id))[i]; const n = (src[id] || []).length; return n ? new RegExp('osservato · ' + n + ' ').test(r.textContent) : /non osservato/.test(r.textContent); }); });
ok(same, 'i numeri del riepilogo coincidono con quelli della griglia (obsSources)');
// il riepilogo si aggiorna aggiungendo l'attività alle occasioni
await ev(() => ossSvolta('a1')); await sleep(400);
await ev(() => { document.getElementById('oss-sv-d').value = '2026-11-05'; ossSvoltaOk('a1'); }); await sleep(700);
s = await ev(() => { const r = scheda.pp.occMan.find(x => x.id === ossGet('a1').occId); const rows = [...document.querySelectorAll('#oss-sum .oss-sm-r')].map(x => x.textContent); return {foc: r.foc, perc: r.perc, sum: rows.filter(t => /Vivere i valori|Meravigliarsi/.test(t)).join(' || ')}; });
ok(s.foc.S3 === 'Guardo lo stupore.' && s.foc.P5 === 'Chi si offre per primo.' && s.foc.C3 === undefined && s.perc.join() === 'S3,P5', 'quando l’attività entra nelle occasioni, i focus partono con i loro percorsi: ' + JSON.stringify(s.foc));
ok(/osservato/.test(s.sum), 'il riepilogo si aggiorna subito');
// griglia: il focus specifico è già nella riga
const g = await ev(() => { const id = ossGet('a1').occId; const rowS3 = grRows('S3').find(r => r.k === 'm:' + id), rowP5 = grRows('P5').find(r => r.k === 'm:' + id); return {s3: grFocParts('S3', rowS3, ((scheda.griglia || {}).S3 || {})['m:' + id]), p5: grFocParts('P5', rowP5, ((scheda.griglia || {}).P5 || {})['m:' + id]), html: grInner('S3')}; });
ok(g.s3.join() === 'Guardo lo stupore.' && g.p5.join() === 'Chi si offre per primo.', 'nella griglia, ogni percorso ha il focus pensato per lui: ' + JSON.stringify([g.s3, g.p5]));
ok(/Preso dall’attività osservativa/.test(g.html) && /Guardo lo stupore\./.test(g.html), 'la riga dice che il focus arriva dall’attività e si può modificare');
// focus del KOS raggiungibili
ok(/Focus del KOS 2\.0 su questo percorso/.test(g.html), 'sono raggiungibili anche i focus del KOS 2.0 su quel percorso');
await ev(() => { const id = ossGet('a1').occId; window._k = 'm:' + id; });
await ev(() => { gGo('1b'); }); await sleep(300);
const add = await ev(() => { const box = document.querySelector('.gr-box[data-pid="S3"]'); if(!box) return {no: 1}; const b = box.querySelector('.gr-kadd'); if(!b) return {nob: 1, html: box.innerHTML.length}; const t = b.getAttribute('data-t'); b.click(); const k = window._k; const g = scheda.griglia.S3[k]; return {t, foc: g.foc}; });
ok(add.t && add.foc && add.foc.split('\n').length === 2 && add.foc.indexOf(add.t) >= 0 && add.foc.indexOf('Guardo lo stupore.') === 0, 'un clic aggiunge il focus del KOS accanto a quello dell’attività: ' + JSON.stringify(add).slice(0, 160));
// Word: il focus passa nella griglia (Allegato 1)
const dw = await (async () => { const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), P.evaluate(() => exportSchedaDocx('completo'))]); return d; })();
await dw.saveAs('/tmp/oss9.docx'); const xml = execSync('unzip -p /tmp/oss9.docx word/document.xml').toString();
ok(/Guardo lo stupore/.test(xml) && /Chi si offre per primo/.test(xml), 'nel Word (Allegato 1) ci sono i focus dell’attività');
// vecchie righe e attività senza focD
await ev(() => { const a = ossGet('a1'); delete a.focD; });
const old = await ev(() => JSON.stringify(ossRowFoc({foc:['Uno.', 'Due.'], main:'S3'}, ['S3', 'P5'])));
ok(old === '{"S3":"Uno.\\nDue."}', 'attività senza focus per percorso: vanno tutti sul percorso principale');
ok(pa.errors.length === 0, 'nessun errore JS: ' + JSON.stringify(pa.errors.slice(0, 2)));
summary(); process.exit(0);
