// 26/11 B2e: Piano strategico nazionale — indirizzi sugli obiettivi, pagina «Piano nazionale», Word/Excel, contratto pnSliceNaz (solo ID e conteggi), piani di prima.
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
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}, acceptDownloads:true}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const txt = x => x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const dbp = id => db.t.pee_piani.find(p => p.id === id);
const ob2 = (id, t, aree, ind) => Object.assign(ob(id, t, aree), {indirizzi:ind});
// p1: tipo sezione con due obiettivi collegati (uno a un indirizzo prioritario, uno a un indirizzo non prioritario + un ID di una versione futura)
db.t.pee_piani.push({id:'p1', owner_id:U.luca.id, owner_email:'luca@x.it', tipo:'sezione', titolo:'Progetto di Sezione', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(),
  data:dati({sezione:'Ancona', obiettivi:[ob2('o1', 'Più famiglie nel Gruppo', ['educativa'], ['ps26:4.2']), ob2('o2', 'Formare i Capi', ['educativa'], ['ps26:1.1', 'pt99:9.9'])]})});
// p2: un piano di prima, senza «indirizzi» sugli obiettivi
db.t.pee_piani.push({id:'p2', owner_id:U.luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano vecchio', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), data:dati({})});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'lettore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});
const L = await mk('luca');
await L.ev(() => pnOpen('p1')); await sleep(1600);
// ── menu e pagina ──
ok(await L.ev(() => !!document.querySelector('#pn-sb-naz') && /Piano nazionale/.test(document.querySelector('#pn-sb-naz').textContent)), 'menu: voce «Piano nazionale»');
ok(await L.ev(() => PN_NAZ.indirizzi.length === 18 && PN_NAZ.pilastri.length === 4 && PN_NAZ.indirizzi.filter(i => i.prior).length === 12), 'costante nazionale: 4 pilastri, 18 indirizzi, 12 prioritari');
ok(await L.ev(() => PN_NAZ.indirizzi.every(i => i.id && i.t && i.assi.length && i.mon.length)) && await L.ev(() => new Set(PN_NAZ.indirizzi.map(i => i.id)).size === 18), 'ogni indirizzo ha ID unico, titolo, assi e indicatori');
await L.P.click('#pn-sb-naz'); await sleep(400);
ok(await L.ev(() => document.querySelectorAll('.pn-ni').length) === 18, 'pagina: 18 indirizzi');
ok(await L.ev(() => /1 dei 12 indirizzi prioritari/.test(document.querySelector('#pn-naz-sum').textContent) && /1 altro indirizzo collegato/.test(document.querySelector('#pn-naz-sum').textContent)), 'sintesi: 1 prioritario e 1 altro collegati (p1)');
ok(await L.ev(() => !!document.querySelector('#pn-naz-manca') && /Non è un obbligo/.test(document.querySelector('#pn-naz-manca').textContent)), 'Progetto di Sezione: elenco dei prioritari senza obiettivi, senza obbligo');
ok(await L.ev(() => /pt99:9\.9/.test(document.body.textContent)), 'un ID di un’altra versione non si perde e resta visibile');
ok(await L.ev(() => /Traguardo 2030/.test(document.querySelector('#pn-nz-4\\.2') ? document.querySelector('#pn-nz-4\\.2').textContent : '')), 'ogni indirizzo mostra i KPI e i traguardi 2030');
// ── collegamento dall'obiettivo ──
await L.P.click('#pn-sb-obi'); await sleep(400);
ok(await L.ev(() => document.querySelectorAll('.pn-nchip').length) >= 3, 'scheda obiettivo: gli indirizzi collegati si vedono come etichette');
await L.ev(() => pnInd('o1', 'ps26:2.1', true)); await sleep(1500);
ok(JSON.stringify(db.t.pee_piani.find(p => p.id === 'p1').data.obiettivi[0].indirizzi.sort()) === JSON.stringify(['ps26:2.1', 'ps26:4.2']), 'aggiungere un indirizzo si salva');
await L.ev(() => pnInd('o1', 'ps26:2.1', false)); await sleep(1500);
ok(db.t.pee_piani.find(p => p.id === 'p1').data.obiettivi[0].indirizzi.length === 1, 'togliere un indirizzo si salva');
// ── contratto verso l'alto ──
const sl = await L.ev(() => pnSliceNaz()); const js = JSON.stringify(sl);
ok(sl.schema === 'pee-naz-1' && sl.ps === 'ps26' && sl.piano.sezione === 'Ancona' && sl.piano.tipo === 'sezione', 'pnSliceNaz: schema, versione, tipo e Sezione');
ok(sl.indirizzi['ps26:4.2'].obiettivi === 1 && sl.indirizzi['ps26:4.2'].azioni === 1, 'pnSliceNaz: conteggi per indirizzo');
ok(!/famiglie|Capi|Luca|Vera|luca@|serate|Serate/i.test(js), 'pnSliceNaz: nessun testo, nome o email del piano');
// ── Word ──
await L.P.click('#pn-sb-pan'); await sleep(300);
const [dl] = await Promise.all([L.P.waitForEvent('download', {timeout:40000}), L.P.click('button[onclick="pnScarica()"]')]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const t = txt(await z.file('word/document.xml').async('string'));
ok(/Piano strategico nazionale/.test(t) && /4\.2/.test(t), 'Word: sezione «Piano strategico nazionale» con gli indirizzi collegati');
// ── Excel ──
await L.P.click('#pn-sb-qua'); await sleep(400);
const [dx] = await Promise.all([L.P.waitForEvent('download', {timeout:60000}), L.P.click('#pn-q-xl')]);
const xz = await JSZip.loadAsync(fs.readFileSync(await dx.path())); const ss = txt(await xz.file('xl/sharedStrings.xml').async('string'));
ok(/Indirizzi del Piano nazionale/.test(ss) && /4\.2/.test(ss), 'Excel: colonna «Indirizzi del Piano nazionale»');
// ── lettore ──
const V = await mk('vera');
await V.ev(() => pnOpen('p1')); await sleep(1600);
await V.P.click('#pn-sb-naz'); await sleep(300);
ok(await V.ev(() => document.querySelectorAll('.pn-ni').length) === 18, 'chi legge vede la pagina Piano nazionale');
await V.P.click('#pn-sb-obi'); await sleep(300);
ok(await V.ev(() => document.querySelectorAll('.pn-chip input[disabled]').length) > 0 || await V.ev(() => document.querySelectorAll('.pn-ni-sel .pn-nchip').length) > 0, 'chi legge non modifica gli indirizzi');
// ── piano di prima ──
await L.ev(() => pnOpen('p2')); await sleep(1500);
await L.P.click('#pn-sb-naz'); await sleep(300);
ok(await L.ev(() => /0 dei 12 indirizzi prioritari/.test(document.querySelector('#pn-naz-sum').textContent) && !document.querySelector('#pn-naz-manca')), 'piano di prima (Gruppo): pagina vuota, senza elenco di mancanze');
ok(JSON.stringify(await L.ev(() => pnSliceNaz().indirizzi)) === '{}', 'piano di prima: nessun indirizzo salito');
const nerr = L.pa.errors.length + V.pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log([...L.pa.errors, ...V.pa.errors]);
await br.close(); process.exit(summary() ? 1 : 0);
