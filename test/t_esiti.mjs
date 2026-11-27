// Esito per azione dentro le tappe di verifica (27/11): Sì / In parte / No / Rimandata + nota; si salva, si rivede, va nel Word e nell'Excel; chi legge non scrive.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare'), vera = db.addUser('vera@x.it', 'password123', 'Vera Lettrice');
[[luca, 'cg'], [vera, 'vcg']].forEach(([u, r]) => db.t.pee_profili.push({user_id:u.id, nome:u.nome || 'x', ruolo:r, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}}));
const ob = (id, t, aree) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false});
const az = (id, o, t, x) => Object.assign({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'', chi:['cdg'], ref:'', stato:'in_corso', genitori:false}, x || {});
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null, obiettivi:[ob('o1', 'Più famiglie nel Gruppo', ['educativa'])],
    azioni:[az('a1', 'o1', 'Serate con le famiglie', {indicatore:'Almeno 3 serate fatte?', step:'meta', mese:'2027-03'}), az('a2', 'o1', 'Festa di Gruppo', {mese:'2026-12'})],
    uniti:[], spunti:[], spg:[], tappe:[{id:'t1', anno:1, tipo:'meta', data:'', fatta:false, note:'Si parte'}, {id:'t2', anno:1, tipo:'fine', data:'', fatta:false, note:''}], delibera:{data:'', luogo:''}}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'lettore', etichetta:'Vice', nome:'Vera', invitato_da:luca.id, visto_il:null, created_at:new Date().toISOString()});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, luca); await sleep(1800); await ev(() => pnOpen('p1')); await sleep(1600);
await P.click('#pn-sb-ver'); await sleep(500);
ok(/Azioni da guardare · 1/.test(await ev(() => document.querySelector('#pn-vl-t1 summary').textContent)), 'nella verifica di metà anno c’è 1 azione da guardare');
await ev(() => document.querySelectorAll('.pn-ve details').forEach(d => d.open = true)); await sleep(200);
await P.selectOption('#pn-es-t1-a1', 'parte'); await P.fill('#pn-esn-t1-a1', 'Fatte due serate su tre'); await sleep(2800);
let t1 = () => db.t.pee_piani.find(p => p.id === 'p1').data.tappe.find(t => t.id === 't1');
ok(t1().esiti && t1().esiti.a1 && t1().esiti.a1.e === 'parte' && t1().esiti.a1.n === 'Fatte due serate su tre', 'l’esito e la nota si salvano nella tappa');
ok(/1 con esito/.test(await ev(() => document.querySelector('#pn-vl-t1 summary').textContent)), 'il titolo dell’elenco dice «1 con esito»');
ok(await ev(() => !!document.querySelector('#pn-es-t2-a1') && !!document.querySelector('#pn-es-t2-a2')), 'la verifica di fine anno ha le sue azioni, separate');
ok(!db.t.pee_piani.find(p => p.id === 'p1').data.tappe.find(t => t.id === 't2').esiti, 'l’altra tappa non ha esiti');
// azzerando esito e nota la voce sparisce
await P.selectOption('#pn-es-t1-a1', ''); await P.fill('#pn-esn-t1-a1', ''); await sleep(2800);
ok(!t1().esiti || !t1().esiti.a1, 'senza esito e senza nota la voce sparisce');
await P.selectOption('#pn-es-t1-a1', 'si'); await P.fill('#pn-esn-t1-a1', 'Fatte <3> serate & oltre'); await sleep(2800);
// l'azione diventa «fatta»: resta nell'elenco perché ha un esito
await ev(() => { const a = PN.d.azioni.find(x => x.id === 'a1'); a.stato = 'fatta'; pnTouch(); pnRender(); }); await sleep(2800);
await ev(() => document.querySelectorAll('.pn-ve details').forEach(d => d.open = true));
ok(await ev(() => document.getElementById('pn-es-t1-a1') && document.getElementById('pn-es-t1-a1').value) === 'si', 'un’azione già «fatta» resta nella verifica in cui ha un esito');
// ricarico: si rivede
await P.reload(); await sleep(2200); await ev(() => pnOpen('p1')); await sleep(1600); await P.click('#pn-sb-ver'); await sleep(500);
await ev(() => document.querySelectorAll('.pn-ve details').forEach(d => d.open = true));
ok(await ev(() => document.getElementById('pn-esn-t1-a1').value) === 'Fatte <3> serate & oltre', 'dopo aver ricaricato si rivede');
// Word
await P.click('#pn-sb-pan'); await sleep(400);
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('button[onclick="pnScarica()"]')]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const x = await z.file('word/document.xml').async('string');
const t = x.replace(/<w:br\/>/g, '\n').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
ok(/Si parte/.test(t) && /Ob\. 1 · Serate con le famiglie: Sì — Fatte <3> serate & oltre/.test(t), 'Word: nelle Verifiche c’è l’esito per azione');
// Excel
await P.click('#pn-sb-qua'); await sleep(400);
const [dx] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('#pn-q-xl')]);
const zx = await JSZip.loadAsync(fs.readFileSync(await dx.path())); const ss = await zx.file('xl/sharedStrings.xml').async('string');
ok(/Ob\. 1 · Serate con le famiglie: Sì/.test(ss), 'Excel: l’esito è nel foglio «Verifiche»');
// chi legge vede ma non scrive
await P.evaluate(() => { try{ CL.sb.auth.signOut(); }catch(e){} });
const pb = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const Q = pb.page;
await loginAs(Q, base, vera); await sleep(1800); await Q.evaluate(() => pnOpen('p1')); await sleep(1600); await Q.click('#pn-sb-ver'); await sleep(500);
await Q.evaluate(() => document.querySelectorAll('.pn-ve details').forEach(d => d.open = true));
ok(await Q.evaluate(() => document.getElementById('pn-es-t1-a1').disabled && document.getElementById('pn-esn-t1-a1').disabled), 'chi legge vede l’esito ma non lo modifica');
const nerr = pa.errors.length + pb.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(pa.errors.concat(pb.errors).slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
