// Vista «Per organo» (27/11): le azioni raggruppate per chi le porta avanti, in ordine di tempo; filtri; Word e Excel.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ob = (id, t, aree, x) => Object.assign({id, testo:t, aree, origine:'', rif:'', ricadute:false}, x || {});
const az = (id, o, t, x) => Object.assign({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'', chi:[], ref:'', stato:'da_iniziare', genitori:false}, x || {});
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null,
    obiettivi:[ob('o1', 'Più famiglie nel Gruppo', ['educativa']), ob('o2', 'Una sede più grande', ['gestionale'])],
    azioni:[az('a1', 'o1', 'Serate con le famiglie', {mese:'2027-03', tipo:'cont', fine:'2027-06', chi:['cdg', 'unita'], ref:'Anna Rossi', stato:'in_corso'}),
            az('a2', 'o1', 'Festa di Gruppo', {mese:'2026-12', tipo:'una', ref:'Vera Vice', urgente:true, chi:['cdg']}),
            az('a3', 'o2', 'Cercare un locale', {mese:'2027-01', tipo:'cont', fine:'piano', ref:'Vera Vice', stato:'fatta', chi:['sezione']}),
            az('a4', 'o2', 'Azione senza organo', {mese:'2027-02', tipo:'una'}),
            az('a5', 'o1', 'Una per il Clan', {chi:['clan'], inizio:2})],
    uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, luca); await sleep(1800); await ev(() => pnOpen('p1')); await sleep(1600);
await P.click('#pn-sb-qua'); await sleep(400);
ok(await ev(() => [...document.querySelectorAll('.pn-seg .pn-segb')].map(b => b.textContent.trim()).slice(0, 4).join()) === 'Tabella,Per organo,Timeline,Calendario', 'le viste sono Tabella, Per organo, Timeline, Calendario');
await P.click('#pn-qv-org'); await sleep(400);
const gruppi = () => ev(() => [...document.querySelectorAll('.pn-org')].map(s => s.querySelector('h3').textContent.replace(/\s+/g, ' ').trim()));
let G = await gruppi();
ok(G.join('|') === 'Consiglio di Gruppo · 2 azioni|Unità · 1 azione|Clan · 1 azione|Sezione · 1 azione|Senza organo · 1 azione', 'un blocco per organo, nell’ordine dell’elenco, più «Senza organo» (' + G.join('|') + ')');
const prima = await ev(() => [...document.querySelectorAll('.pn-org')][0].querySelectorAll('tbody tr td:first-child a').length ? [...document.querySelectorAll('.pn-org')][0].querySelectorAll('tbody tr td:first-child a')[0].textContent : '');
ok(prima === 'Festa di Gruppo', 'dentro l’organo, in ordine di tempo (prima dicembre 2026) (' + prima + ')');
ok(await ev(() => document.querySelectorAll('.pn-org')[1].textContent.includes('Serate con le famiglie')) && await ev(() => document.querySelectorAll('.pn-org')[0].textContent.includes('Serate con le famiglie')), 'un’azione con due organi compare in tutti e due');
ok(/Anno 2 · mese da scegliere/.test(await ev(() => document.querySelectorAll('.pn-org')[2].textContent)), 'l’azione senza mese lo dice');
ok(/Urgente/.test(await ev(() => document.querySelectorAll('.pn-org')[0].textContent)) && /◐ In corso/.test(await ev(() => document.querySelectorAll('.pn-org')[1].textContent)), 'urgente e stato');
// filtro organo
await ev(() => { const s = document.getElementById('pn-qf-chi'); s.value = 'sezione'; s.dispatchEvent(new Event('change', {bubbles:true})); }); await sleep(300);
G = await gruppi(); ok(G.length === 1 && /^Sezione/.test(G[0]), 'il filtro «Organo» lascia solo quel blocco (' + G.join('|') + ')');
await ev(() => { const s = document.getElementById('pn-qf-chi'); s.value = ''; s.dispatchEvent(new Event('change', {bubbles:true})); }); await sleep(300);
// il clic porta a modificare
await P.click('.pn-org a >> nth=0'); await sleep(900);
ok(await ev(() => !!document.querySelector('.pn-az:target, [id^="pn-az-"]') && PN.sez === 'obi'), 'il clic su un’azione porta a «Obiettivi e azioni»');
// il Word ha la parte «Per organo»
await P.click('#pn-sb-pan'); await sleep(400);
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('button[onclick="pnScarica()"]')]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const x = await z.file('word/document.xml').async('string');
const t = x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '');
ok(/Per organo/.test(t) && /Consiglio di Gruppo · 2 azioni/.test(t) && /Senza organo · 1 azione/.test(t), 'Word: sezione «Per organo»');
// Excel
await P.click('#pn-sb-qua'); await sleep(400);
const [dx] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('#pn-q-xl')]);
const zx = await JSZip.loadAsync(fs.readFileSync(await dx.path())); const wbx = await zx.file('xl/workbook.xml').async('string');
ok(/name="Per organo"/.test(wbx), 'Excel: foglio «Per organo»');
const ss = zx.file('xl/sharedStrings.xml') ? await zx.file('xl/sharedStrings.xml').async('string') : '';
ok(/Festa di Gruppo/.test(ss) && /Senza organo/.test(ss), 'Excel: le righe ci sono');
// telefono: nessuno scorrimento orizzontale
await P.setViewportSize({width:360, height:740}); await sleep(500);
ok(await ev(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'su telefono nessuno scorrimento orizzontale');
const nerr = pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
