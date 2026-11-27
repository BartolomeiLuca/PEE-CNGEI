// 28/11 Progetto di Clan: richieste «Chi: Clan» dei Gruppi, «Disponibilità e prospettive» e «Dal Clan» nel Progetto di Sezione.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}}); };
const prof2 = (k, nome, ruolo, gr, dash, sez) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:sez || 'Pesaro', gruppo:gr || '', area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof2('coord', 'Cora Coordinatrice', 'coords'); prof2('comm', 'Dino Commissario', 'cds'); prof2('cg1', 'Carla CG', 'cg', '1'); prof2('cg2', 'Gigi CG', 'cg', '2'); prof2('cgF', 'Fabio Fano', 'cg', '1', {}, 'Fano'); prof2('sen', 'Sara Senior', 'senior', '1');
const az = (id, o, t, chi, x) => Object.assign({id, ob:o, testo:t, inizio:2, mese:'2027-06', verifica:'ogni', indicatore:'INDICATORE RISERVATO', chi, ref:'NOME RISERVATO', stato:'in_corso', genitori:false}, x || {});
const ob = (id, t, aree, ind) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false, indirizzi:ind || []});
const dati = x => Object.assign({v:1, titolareNome:'x', analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], disp:[], spg:[], tappe:[], delibera:{data:'', luogo:''}, sezione:'Pesaro'}, x || {});
const push = (id, own, tipo, stato, anno, d) => db.t.pee_piani.push({id, owner_id:U[own].id, owner_email:own + '@x.it', tipo, titolo:tipo === 'sezione' ? 'Progetto di Sezione Pesaro' : 'Piano di Gruppo', anno_inizio:anno, durata:3, stato, archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:d});
push('c1', 'coord', 'clan', 'bozza', 2026, dati({obiettivi:[ob('k1', 'Accogliere nuovi Senior', ['formativa'])]}));
push('s1', 'comm', 'sezione', 'bozza', 2026, dati({}));
push('g1', 'cg1', 'gruppo', 'bozza', 2026, dati({obiettivi:[ob('a1', 'Campi estivi per tutte le Unità', ['educativa']), ob('a2', 'Rinnovare la sede', ['gestionale'])], azioni:[az('x1', 'a1', 'Quattro persone per il campo di Lupetti', ['cdg', 'clan'], {genitori:true}), az('x2', 'a1', 'Preparare il materiale', ['cg']), az('x3', 'a2', 'Aiuto per il trasloco', ['clan'], {inizio:1, mese:'2026-12', stato:'da_iniziare'})]}));
push('g2', 'cg2', 'gruppo', 'deliberato', 2026, dati({obiettivi:[ob('b1', 'Formare i Capi Unità', ['formativa'])], azioni:[az('y1', 'b1', 'Un Senior al Consiglio di Unità', ['clan'])]}));
push('g3', 'cgF', 'gruppo', 'bozza', 2026, dati({obiettivi:[ob('f1', 'OBIETTIVO DI FANO', ['educativa'])], azioni:[az('z1', 'f1', 'RICHIESTA DI FANO', ['clan'])]}));
push('g4', 'cg1', 'gruppo', 'approvato', 2020, dati({obiettivi:[ob('o1', 'PIANO VECCHIO', ['educativa'])], azioni:[az('w1', 'o1', 'RICHIESTA VECCHIA', ['clan'])]}));
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}, acceptDownloads:true}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2000); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const txt = x => x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const dbp = id => db.t.pee_piani.find(p => p.id === id);
// ── il Coordinatore Senior nel Progetto di Clan ──
const K = await mk('coord');
await K.ev(() => pnOpen('c1')); await sleep(1900);
const voci = await K.ev(() => [...document.querySelectorAll('.pn-side .sh-si')].map(b => b.textContent.trim()));
ok(voci.includes('Richieste dei Gruppi') && voci.includes('Disponibilità e prospettive') && !voci.includes('Spunti dalle Unità'), 'menu del Progetto di Clan: Richieste dei Gruppi e Disponibilità e prospettive, senza «Spunti dalle Unità» (' + voci.join(' | ') + ')');
await K.ev(() => pnSez('pan')); await sleep(500);
ok(await K.ev(() => /3 richieste da 2 Gruppi/.test(document.querySelector('#pn-ricp').textContent)), 'Panoramica: «3 richieste da 2 Gruppi»');
await K.ev(() => pnSez('ric')); await sleep(500);
const ric = await K.ev(() => document.querySelector('#pn-ric').textContent.replace(/\s+/g, ' '));
ok(await K.ev(() => document.querySelectorAll('#pn-ric > details').length) === 2, 'Richieste: un riquadro per ognuno dei 2 Gruppi di Pesaro');
ok(/Quattro persone per il campo di Lupetti/.test(ric) && /Aiuto per il trasloco/.test(ric) && /Un Senior al Consiglio di Unità/.test(ric), 'ci sono le tre richieste «Chi: Clan»');
ok(!/Preparare il materiale|RICHIESTA DI FANO|RICHIESTA VECCHIA|RISERVAT/.test(ric), 'non ci sono le azioni senza «Clan», né quelle di altre Sezioni o altri trienni, né referenti e indicatori');
await K.ev(() => document.querySelectorAll('#pn-ric details').forEach(d => d.open = true)); await sleep(300);
const r1 = await K.ev(() => document.querySelector('#pn-ric-g1').textContent.replace(/\s+/g, ' '));
ok(/Per l’obiettivo: Campi estivi per tutte le Unità/.test(r1) && /anno 2 · giugno 2027 · in corso · con i genitori/.test(r1) && /anno 1 · dicembre 2026 · da iniziare/.test(r1), 'per ogni richiesta: obiettivo, anno, mese, stato, «con i genitori» (' + r1.slice(0, 200) + ')');
ok(await K.ev(() => /Non avete ancora scritto le disponibilità/.test(document.body.textContent) && !document.querySelector('#pn-ric button[onclick*="pnPdcPorta"]')), 'accanto alle richieste, le disponibilità del Clan (ancora vuote); le richieste sono solo da leggere');
// Disponibilità e prospettive
await K.P.click('button[onclick="pnSez(\'dis\')"]'); await sleep(600);
await K.P.click('.pn-sug >> nth=0'); await sleep(600);
ok(await K.ev(() => document.querySelectorAll('[id^="pn-dpc-"]').length) === 1 && await K.ev(() => document.querySelector('[id^="pn-dpc-"]').value) === 'Persone per i campi estivi', 'un suggerimento aggiunge una voce già compilata');
await K.P.click('textarea[aria-label="Quante persone o quanto"]');
await K.P.keyboard.type('6'); await K.P.keyboard.press('Tab'); await K.P.keyboard.type('luglio'); await sleep(2800);
const d1 = () => dbp('c1').data.disp;
ok(d1().length === 1 && d1()[0].quanti === '6' && d1()[0].quando === 'luglio', 'quante e quando si salvano nel piano (' + JSON.stringify(d1()) + ')');
await K.P.click('button[onclick="pnDisAdd(\'\')"]'); await sleep(500); await K.P.keyboard.type('Aiuto in sede'); await sleep(2800);
ok(d1().length === 2 && d1()[1].cosa === 'Aiuto in sede', 'una voce libera');
ok(await K.ev(() => !!document.querySelector('.sh-msg.err') && /Niente nomi di persone/.test(document.querySelector('.sh-msg.err').textContent)), 'avviso: niente nomi di persone');
// Word
const [dl] = await Promise.all([K.P.waitForEvent('download', {timeout:40000}), K.ev(() => pnScarica())]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const t = txt(await z.file('word/document.xml').async('string'));
ok(/Disponibilità e prospettive/.test(t) && /Persone per i campi estivi/.test(t) && /Aiuto in sede/.test(t), 'Word: sezione «Disponibilità e prospettive» con le voci');
// eliminare
await K.ev(() => { window.confirm = () => true; pnDisDel(document.querySelector('[id^="pn-dpc-"]').id.slice(7)); }); await sleep(2800);
ok(d1().length === 1 && d1()[0].cosa === 'Aiuto in sede', 'eliminare una voce');
// spunti già scritti restano raggiungibili
dbp('c1').data.spunti = [{id:'sp1', da:'Unità X', testo:'spunto vecchio'}];
const K2 = await mk('coord'); await K2.ev(() => pnOpen('c1')); await sleep(1900);
ok(await K2.ev(() => [...document.querySelectorAll('.pn-side .sh-si')].some(b => /Spunti dalle Unità/.test(b.textContent))), 'se il Progetto di Clan ha già degli spunti, la voce «Spunti dalle Unità» resta');
// ── il Commissario nel Progetto di Sezione ──
const C = await mk('comm');
await C.ev(() => pnOpen('s1')); await sleep(2000); await C.ev(() => pnSez('pan')); await sleep(500);
ok(await C.ev(() => /Progetto di Clan 2026-28 · bozza · 1 obiettivo · 1 disponibilità/.test(document.querySelector('#pn-pdcp').textContent.replace(/\s+/g, ' '))), 'Panoramica: riga «Progetto di Clan … 1 obiettivo · 1 disponibilità»');
await C.ev(() => pnSez('obi')); await sleep(600);
ok(await C.ev(() => !!document.querySelector('#pn-pdc')) && await C.ev(() => /Accogliere nuovi Senior/.test(document.querySelector('#pn-pdc').textContent)) && await C.ev(() => /Aiuto in sede/.test(document.querySelector('#pn-pdc').textContent)), '«Dal Clan»: obiettivi e disponibilità');
ok(await C.ev(() => !/Persone per i campi|spunto vecchio|INDICATORE|RISERVAT/.test(document.querySelector('#pn-pdc').textContent)), 'la voce eliminata non c’è, né altro di riservato');
await C.ev(() => document.querySelectorAll('#pn-pdc details').forEach(d => d.open = true)); await sleep(300);
await C.P.click('#pn-pdc .pn-ni button'); await sleep(2000);
const so = () => dbp('s1').data.obiettivi;
ok(so().length === 1 && so()[0].origine === 'clan' && so()[0].clanRif === 'c1:k1' && /Progetto di Clan 2026-28 · obiettivo 1/.test(so()[0].rif) && JSON.stringify(so()[0].aree) === '["formativa"]', 'Porta nel Progetto: obiettivo con origine «Progetto di Clan» e riferimento');
await C.ev(() => document.querySelectorAll('#pn-pdc details').forEach(d => d.open = true)); await sleep(300);
ok(await C.ev(() => /Già nel Progetto/.test(document.querySelector('#pn-pdc').textContent)), 'diventa «Già nel Progetto»');
await C.ev(() => pnPdcPorta('c1', 'k1')); await sleep(400); ok(so().length === 1, 'portarlo di nuovo non duplica');
ok(await C.ev(() => document.querySelector('select[id^="pn-obo-"]').value) === 'clan', 'in «Da dove viene» risulta «Progetto di Clan»');
// chi non deve vedere
const G = await mk('cg1'); await G.ev(() => pnOpen('g1')); await sleep(1900); await G.ev(() => pnSez('obi')); await sleep(500);
ok(await G.ev(() => !document.querySelector('#pn-pdc') && !document.querySelector('#pn-ric') && ![...document.querySelectorAll('.pn-side .sh-si')].some(b => /Richieste dei Gruppi|Disponibilità/.test(b.textContent))), 'il Capo Gruppo non vede né le richieste né le disponibilità');
// database non aggiornato
db.sqlClan = false;
const K3 = await mk('coord'); await K3.ev(() => pnOpen('c1')); await sleep(1900); await K3.ev(() => pnSez('ric')); await sleep(500);
ok(await K3.ev(() => /non riesco a leggere le richieste/.test(document.querySelector('#pn-ric').textContent)), 'database non aggiornato: messaggio chiaro nella pagina delle richieste');
await K3.ev(() => pnSez('pan')); await sleep(400); ok(await K3.ev(() => !document.querySelector('#pn-ricp') && !!document.querySelector('#pn-st-t')), 'database non aggiornato: la Panoramica funziona come prima');
const C2 = await mk('comm'); await C2.ev(() => pnOpen('s1')); await sleep(1900); await C2.ev(() => pnSez('obi')); await sleep(500);
ok(await C2.ev(() => !document.querySelector('#pn-pdc') && document.querySelectorAll('.pn-ob').length === 1), 'database non aggiornato: il Progetto di Sezione funziona come prima');
const tutti = [K, K2, C, G, K3, C2]; const nerr = tutti.reduce((n, x) => n + x.pa.errors.length, 0); ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(tutti.flatMap(x => x.pa.errors));
await br.close(); process.exit(summary() ? 1 : 0);
