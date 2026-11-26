// 26/11: Consigli di Gruppo con data (facoltativi) come tappe del piano e Sezione nel piano (carta intestata): Verifiche, Quadro (timeline, calendario, elenco), Word, Excel.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}}); };
prof('luca', 'Luca Titolare', 'cg'); prof('vera', 'Vera Vice', 'vcg');
const ob = (id, t, aree) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false});
const az = (id, o, t, x) => Object.assign({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'', chi:['cdg'], ref:'', stato:'da_iniziare', genitori:false}, x || {});
const dati = x => Object.assign({v:1, titolareNome:'Luca', analisi:[], swot:null, obiettivi:[ob('o1', 'Più famiglie nel Gruppo', ['educativa'])], azioni:[az('a1', 'o1', 'Serate con le famiglie', {mese:'2027-03', tipo:'cont', fine:'2027-06', stato:'in_corso', step:'cdg'})], uniti:[], spunti:[], spg:[], delibera:{data:'', luogo:''}}, x);
const piano = (id, tit, d) => db.t.pee_piani.push({id, owner_id:U.luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:tit, anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), data:d});
piano('p1', 'Piano con Consigli', dati({sezione:'Ancona', tappe:[
  {id:'t1', anno:1, tipo:'cdg', data:'2026-12-18', fatta:false, note:'Ordine del giorno'}, {id:'t2', anno:1, tipo:'cdg', data:'2027-02-12', fatta:true, note:'Si è detto: serate ok'},
  {id:'t3', anno:1, tipo:'cdg', data:'', fatta:false, note:''}, {id:'t4', anno:1, tipo:'meta', data:'2027-03-20', fatta:false, note:''}]}));
piano('p2', 'Piano vecchio', dati({tappe:[{id:'v1', anno:1, tipo:'fine', data:'2027-06-20', fatta:false, note:''}]}));   // senza «sezione» e senza Consigli: un piano di prima
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'lettore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}, acceptDownloads:true}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const txt = x => x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const dbp = id => db.t.pee_piani.find(p => p.id === id);
const L = await mk('luca');
await L.ev(() => pnOpen('p1')); await sleep(1600);
// ── Sezione nel piano ──
ok(await L.ev(() => document.querySelector('#pn-sez') && document.querySelector('#pn-sez').value) === 'Ancona', 'Stato del piano: campo Sezione, con quella scritta nel piano');
ok(await L.ev(() => document.querySelectorAll('#pn-dl-sez option').length) > 50, 'la Sezione si sceglie dall’elenco');
// ── Verifiche ──
await L.P.click('#pn-sb-ver'); await sleep(400);
ok(await L.ev(() => [...document.querySelectorAll('button')].filter(b => /\+ Consiglio di Gruppo/.test(b.textContent)).length) === 3, 'Verifiche: «+ Consiglio di Gruppo» in ogni anno');
ok(await L.ev(() => [...document.querySelectorAll('.pn-ve b')].filter(b => b.textContent === 'Consiglio di Gruppo').length) === 3 && await L.ev(() => /Almeno ogni due mesi/.test(document.body.textContent)), 'i tre Consigli già segnati compaiono, con la cadenza del Regolamento');
ok(await L.ev(() => [...document.querySelectorAll('label')].filter(l => l.textContent === 'Cosa si è detto del Piano').length) === 3, 'per i Consigli il campo note chiede «Cosa si è detto del Piano»');
ok(await L.ev(() => /Azioni da guardare · 1/.test(document.querySelector('#pn-ve-t1') ? document.querySelector('#pn-ve-t1').textContent : '')), 'il Consiglio mostra le azioni da guardare a ogni Consiglio');
await L.P.click('#pn-sb-pan'); await sleep(300);
ok(await L.ev(() => /Verifica di metà anno/.test(document.querySelector('#pn-prox').textContent) && !/Consiglio/.test(document.querySelector('#pn-prox').textContent)), 'la «prossima verifica» non è mai un Consiglio di Gruppo');
await L.P.click('#pn-sb-ver'); await sleep(300);
await L.P.click('button:has-text("+ Consiglio di Gruppo") >> nth=1'); await sleep(1200);
ok(dbp('p1').data.tappe.filter(t => t.tipo === 'cdg' && t.anno === 2).length === 1, 'un nuovo Consiglio nell’anno 2 si salva (tipo cdg)');
await L.ev(() => pnTappa(PN.d.tappe.find(t => t.tipo === 'cdg' && t.anno === 2).id, 'data', '2027-10-15')); await sleep(1500);
ok(dbp('p1').data.tappe.find(t => t.tipo === 'cdg' && t.anno === 2).data === '2027-10-15', 'la data del Consiglio si salva');
// ── Quadro: timeline ──
await L.P.click('#pn-sb-qua'); await sleep(400); await L.P.click('#pn-qv-tl'); await sleep(300);
ok(await L.ev(() => document.querySelectorAll('.pn-tc').length) === 3, 'timeline: un triangolo per ogni Consiglio con data (3, quello senza data no)');
ok(await L.ev(() => /Consigli di Gruppo/.test(document.querySelector('.pn-tl').textContent) && document.querySelectorAll('.pn-tc.fatta').length === 1), 'timeline: riga «Consigli di Gruppo»; quello fatto è pieno');
ok(await L.ev(() => /Consiglio di Gruppo/.test(document.querySelector('.pn-tl-leg').textContent)), 'timeline: legenda col Consiglio di Gruppo');
ok(await L.ev(() => document.querySelectorAll('.pn-tv').length) === 3, 'le verifiche restano a parte (metà anno datata + 2 suggerite)');
// ── calendario ──
await L.P.click('#pn-qv-cal'); await sleep(300);
ok(await L.ev(() => [...document.querySelectorAll('.pn-cm')].filter(m => /Consiglio di Gruppo/.test(m.textContent)).map(m => m.getAttribute('aria-label')).join()) === 'dicembre 2026,febbraio 2027', 'calendario anno 1: il Consiglio compare nel suo mese (dicembre, febbraio)');
await L.P.click('#pn-qv-tab'); await sleep(300);
ok(await L.ev(() => !document.querySelector('.pn-tc')), 'la Tabella non cambia');
// ── Word ──
await L.P.click('#pn-sb-pan'); await sleep(300);
const [dl] = await Promise.all([L.P.waitForEvent('download', {timeout:40000}), L.P.click('button[onclick="pnScarica()"]')]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const x = await z.file('word/document.xml').async('string'), t = txt(x);
ok(/Consiglio di Gruppo/.test(t.slice(0, t.indexOf('Quadro del Piano'))) && /Si è detto: serate ok/.test(t) && /18\/12\/2026/.test(t), 'Word: i Consigli sono tra le Verifiche, con data e note');
const q = t.slice(t.indexOf('Quadro del Piano')); ok(/Consigli di Gruppo/.test(q) && /▲/.test(q), 'Word: riga «Consigli di Gruppo» nella timeline orizzontale');
let hh = ''; for(const n of Object.keys(z.files).filter(n => /^word\/header\d+\.xml$/.test(n))) hh += txt(await z.file(n).async('string')) + '\n';
ok(/CNGEI Ancona/.test(hh) && !/CNGEI Pesaro/.test(hh), 'carta intestata: la Sezione del piano (Ancona), non quella del profilo (Pesaro)');
// ── Excel ──
await L.P.click('#pn-sb-qua'); await sleep(400);
const [dx] = await Promise.all([L.P.waitForEvent('download', {timeout:60000}), L.P.click('#pn-q-xl')]);
const xz = await JSZip.loadAsync(fs.readFileSync(await dx.path())); const ss = txt(await xz.file('xl/sharedStrings.xml').async('string'));
ok(/Consigli di Gruppo/.test(ss) && /CNGEI Ancona/.test(ss) && /Si è detto: serate ok/.test(ss), 'Excel: riga Consigli di Gruppo, Sezione del piano e note nel foglio Verifiche');
// ── lettore ──
const V = await mk('vera');
await V.ev(() => pnOpen('p1')); await sleep(1600);
ok(await V.ev(() => document.querySelector('#pn-sez').disabled && document.querySelector('#pn-sez').value) === 'Ancona', 'chi legge vede la Sezione ma non la modifica');
await V.P.click('#pn-sb-ver'); await sleep(300);
ok(await V.ev(() => ![...document.querySelectorAll('button')].some(b => /\+ Consiglio di Gruppo/.test(b.textContent))), 'chi legge non ha «+ Consiglio di Gruppo»');
await V.P.click('#pn-sb-qua'); await sleep(300); await V.P.click('#pn-qv-tl'); await sleep(300);
ok(await V.ev(() => document.querySelectorAll('.pn-tc').length) === 3, 'chi legge vede i Consigli nella timeline');
// ── telefono: elenco per scadenza ──
const M = await mk('luca', 400);
await M.ev(() => pnOpen('p1')); await sleep(1600); await M.P.click('#pn-sb-qua').catch(() => {}); await sleep(300);
if(!(await M.ev(() => !!document.querySelector('#pn-qv-tl')))){ await M.ev(() => pnSez('qua')); await sleep(300); }
await M.P.click('#pn-qv-tl'); await sleep(300);
ok(await M.ev(() => [...document.querySelectorAll('.pn-tl-ls li.v')].filter(l => /▲/.test(l.textContent)).length) === 3, 'telefono: i Consigli sono nell’elenco per scadenza');
// ── piano di prima: senza Sezione né Consigli ──
await L.ev(() => pnOpen('p2')); await sleep(1500);
ok(await L.ev(() => document.querySelector('#pn-sez').value) === '' && /Se la lasci vuota/.test(await L.ev(() => document.querySelector('#pn-sezh').textContent)), 'piano di prima: Sezione vuota, con avviso che si usa quella del profilo');
await L.ev(() => { pnTappaAdd(1); }); await sleep(1500);
ok(dbp('p2').data.sezione === 'Pesaro', 'al primo salvataggio del titolare la Sezione si riempie con quella del profilo');
ok(dbp('p2').data.tappe.some(t => t.id === 'v1' && t.data === '2027-06-20'), 'le tappe di prima restano');
await L.P.click('#pn-sb-pan'); await sleep(300); await L.P.fill('#pn-sez', 'Anzio Nettuno'); await sleep(1500);
ok(dbp('p2').data.sezione === 'Anzio Nettuno', 'cambiando la Sezione nel piano si salva e resta (non viene riscritta dal profilo)');
// ── nuovo piano: parte con la Sezione del profilo ──
await L.ev(() => pnNuovo()); await sleep(500); await L.P.click('#pn-n-ok'); await sleep(2000);
ok(db.t.pee_piani.filter(p => p.id !== 'p1' && p.id !== 'p2').every(p => p.data.sezione === 'Pesaro') && db.t.pee_piani.length === 3, 'un piano nuovo parte con la Sezione del profilo');
const nerr = L.pa.errors.length + V.pa.errors.length + M.pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log([...L.pa.errors, ...V.pa.errors, ...M.pa.errors].slice(0, 3).join(' | ').slice(0, 400));
await br.close(); process.exit(summary() ? 1 : 0);
