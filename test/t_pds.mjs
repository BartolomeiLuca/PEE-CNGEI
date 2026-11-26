// 28/11: il Piano di Gruppo legge il Progetto di Sezione della propria Sezione (obiettivi, aree, indirizzi nazionali) e lo porta nel piano; database non aggiornato; altra Sezione; lettore; Word.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}}); };
prof('luca', 'Luca Capo Gruppo', 'cg'); prof('vera', 'Vera Vice', 'vcg'); prof('comm', 'Dino Commissario', 'cds'); prof('fano', 'Fabio Fano', 'cg');
db.t.pee_profili.find(x => x.user_id === U.fano.id).sezione = 'Fano';
const ob = (id, t, aree, ind) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false, indirizzi:ind || []});
const dati = x => Object.assign({v:1, titolareNome:'Luca', analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}, sezione:'Pesaro'}, x || {});
const push = (id, own, tipo, stato, anno, d) => db.t.pee_piani.push({id, owner_id:U[own].id, owner_email:own + '@x.it', tipo, titolo:tipo === 'sezione' ? 'Progetto di Sezione Pesaro' : 'Piano di Gruppo', anno_inizio:anno, durata:3, stato, archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:d});
push('s1', 'comm', 'sezione', 'deliberato', 2026, dati({obiettivi:[ob('so1', 'Formare più Capi in Sezione', ['formativa', 'personale'], ['ps26:1.1']), ob('so2', 'Rafforzare i rapporti con le famiglie', ['educativa'], [])]}));
push('s2', 'comm', 'sezione', 'bozza', 2027, dati({obiettivi:[ob('sb1', 'OBIETTIVO DI BOZZA da non vedere', ['educativa'])]}));
push('g1', 'luca', 'gruppo', 'bozza', 2026, dati({obiettivi:[ob('go1', 'Più famiglie nel Gruppo', ['educativa'])]}));
db.t.pee_piani_membri.push({id:'m1', piano_id:'g1', email:'vera@x.it', ruolo:'lettore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});
push('g2', 'fano', 'gruppo', 'bozza', 2026, dati({sezione:'Fano', obiettivi:[]}));
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}, acceptDownloads:true}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const txt = x => x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const dbp = id => db.t.pee_piani.find(p => p.id === id);
const L = await mk('luca');
await L.ev(() => pnOpen('g1')); await sleep(1800);
await L.ev(() => pnSez('obi')); await sleep(500);
ok(await L.ev(() => !!document.querySelector('#pn-pds')) && await L.ev(() => document.querySelectorAll('#pn-pds .pn-ni').length) === 2, 'Obiettivi: elenco «Dal Progetto di Sezione» con i 2 obiettivi deliberati (la bozza no)');
ok(await L.ev(() => !/OBIETTIVO DI BOZZA/.test(document.body.textContent) && /Progetto di Sezione 2026-28/.test(document.querySelector('#pn-pds').textContent) && /deliberato/.test(document.querySelector('#pn-pds').textContent)), 'titolo del Progetto, periodo e stato; la bozza non si vede');
ok(await L.ev(() => /1\.1 /.test(document.querySelector('#pn-pds-so1').textContent) && document.querySelectorAll('#pn-pds-so1 .pn-nchip').length === 1), 'l’indirizzo nazionale dell’obiettivo si vede');
ok(await L.ev(() => document.querySelector('#pn-obs-go1') && document.querySelectorAll('#pn-obs-go1 option').length === 3), 'sull’obiettivo c’è la scelta «Dal Progetto di Sezione» (nessuno + 2)');
// porta nel piano
await L.P.click('#pn-pds-so1 button'); await sleep(1800);
const g = () => dbp('g1').data.obiettivi;
ok(g().length === 2 && g()[1].testo === 'Formare più Capi in Sezione' && g()[1].origine === 'sezione' && g()[1].pdsRif === 's1:so1' && /Progetto di Sezione 2026-28 · obiettivo 1/.test(g()[1].rif), 'Porta nel piano: nuovo obiettivo con testo, origine «Progetto di Sezione» e riferimento');
ok(JSON.stringify(g()[1].indirizzi) === '["ps26:1.1"]' && JSON.stringify(g()[1].aree) === '["formativa"]', 'arrivano l’indirizzo nazionale e le aree (solo quelle valide: «personale» non è un’area del piano)');
ok(await L.ev(() => /Già nel piano/.test(document.querySelector('#pn-pds-so1').textContent) && !document.querySelector('#pn-pds-so1 button')), 'l’obiettivo portato diventa «Già nel piano», senza doppio pulsante');
ok(await L.ev(() => document.activeElement && /pn-obt-/.test(document.activeElement.id)), 'il cursore va sul testo, per adattarlo al Gruppo');
await L.ev(() => pnPdsPorta('so1')); await sleep(500);
ok(g().length === 2, 'portarlo una seconda volta non duplica');
// scelta sull'obiettivo esistente
await L.ev(() => pnPdsLega('go1', 's1:so2')); await sleep(1800);
ok(g()[0].pdsRif === 's1:so2' && g()[0].origine === 'sezione' && /obiettivo 2/.test(g()[0].rif) && g()[0].testo === 'Più famiglie nel Gruppo', 'scegliere dall’elenco: lega l’obiettivo, il testo resta quello del Gruppo');
ok(await L.ev(() => document.querySelector('#pn-obs-go1').value) === 's1:so2', 'la scelta resta visibile nell’elenco a tendina');
await L.ev(() => pnPdsLega('go1', '')); await sleep(1500);
ok(g()[0].pdsRif === '' && /obiettivo 2/.test(g()[0].rif), '«nessuno» toglie il legame ma non il testo scritto');
await L.ev(() => pnPdsLega('go1', 's1:so1')); await sleep(1500);
ok(JSON.stringify(g()[0].indirizzi) === '["ps26:1.1"]', 'legando a un obiettivo con indirizzo, un obiettivo senza indirizzo lo riceve');
await L.ev(() => pnInd('go1', 'ps26:2.1', true)); await L.ev(() => pnPdsLega('go1', 's1:so2')); await sleep(1500);
ok(g()[0].indirizzi.includes('ps26:2.1') && g()[0].indirizzi.includes('ps26:1.1'), 'un indirizzo già scelto non viene sovrascritto');
// Word
await L.ev(() => pnSez('pan')); await sleep(400);
const [dl] = await Promise.all([L.P.waitForEvent('download', {timeout:40000}), L.P.click('button[onclick="pnScarica()"]')]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const t = txt(await z.file('word/document.xml').async('string'));
ok(/Da dove viene: Progetto di Sezione \(Progetto di Sezione 2026-28 · obiettivo/.test(t), 'Word: «Da dove viene: Progetto di Sezione (… obiettivo N)»');
// lettore
const V = await mk('vera');
await V.ev(() => pnOpen('g1')); await sleep(1800); await V.ev(() => pnSez('obi')); await sleep(500);
ok(await V.ev(() => !!document.querySelector('#pn-pds') && !document.querySelector('#pn-pds button')), 'chi legge vede l’elenco ma non ha «Porta nel piano»');
ok(await V.ev(() => !document.querySelector('select[id^="pn-obs-"]:not([disabled])')), 'chi legge non può cambiare il legame');
// altra Sezione
const F = await mk('fano');
await F.ev(() => pnOpen('g2')); await sleep(1800); await F.ev(() => pnSez('obi')); await sleep(500);
ok(await F.ev(() => !document.querySelector('#pn-pds')), 'un Gruppo di un’altra Sezione non vede il Progetto di Pesaro');
// il Progetto di Sezione stesso
const C = await mk('comm');
await C.ev(() => pnOpen('s1')); await sleep(1800); await C.ev(() => pnSez('obi')); await sleep(500);
ok(await C.ev(() => !document.querySelector('#pn-pds') && !document.querySelector('select[id^="pn-obs-"]')), 'nel Progetto di Sezione non c’è l’elenco «Dal Progetto di Sezione»');
// database non aggiornato
db.sqlPds = false;
const L2 = await mk('luca');
await L2.ev(() => pnOpen('g1')); await sleep(1800); await L2.ev(() => pnSez('obi')); await sleep(500);
ok(await L2.ev(() => !document.querySelector('#pn-pds') && document.querySelectorAll('.pn-ob').length === 2), 'database non aggiornato: nessun elenco, il piano funziona come prima');
const nerr = [L, V, F, C, L2].reduce((n, x) => n + x.pa.errors.length, 0); ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log([L, V, F, C, L2].flatMap(x => x.pa.errors));
await br.close(); process.exit(summary() ? 1 : 0);
