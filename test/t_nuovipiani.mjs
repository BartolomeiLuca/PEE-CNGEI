// 28/11: chi può aprire quale piano (Gruppo, Sezione, Clan) e il filo completo: il Commissario scrive e delibera il Progetto di Sezione, il Capo Gruppo lo legge e ne porta un obiettivo.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}}); };
const prof2 = (k, nome, ruolo, dash, sez) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:ruolo === 'cu' || ruolo === 'senior' ? 'E' : '', sezione:sez || 'Pesaro', gruppo:['cg', 'vcg', 'cu', 'senior'].includes(ruolo) ? 'Pesaro 1' : '', area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof2('cg', 'Carla CG', 'cg'); prof2('vcg', 'Vera VCG', 'vcg'); prof2('cds', 'Dino Commissario', 'cds'); prof2('vcds', 'Vito Vice', 'vcds');
prof2('cosC', 'Cosimo Comitato Commissario', 'cos', {cos:{incarichi:['commissario']}}); prof2('cosP', 'Cora Presidente', 'cos', {cos:{incarichi:['presidente']}});
prof2('coords', 'Cora Senior', 'coords'); prof2('cu', 'Ugo CU', 'cu'); prof2('vol', 'Vol Volontario', 'volontario');
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}, acceptDownloads:true}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2200); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const bottoni = async S => S.ev(() => [...document.querySelectorAll('#sh-piani button')].filter(b => /^\+ Nuovo/.test(b.textContent.trim())).map(b => b.textContent.trim()));
const attesa = { cg:['+ Nuovo Piano di Gruppo'], vcg:['+ Nuovo Piano di Gruppo'], cds:['+ Nuovo Progetto di Sezione'], vcds:['+ Nuovo Progetto di Sezione'], cosC:['+ Nuovo Progetto di Sezione'], cosP:[], coords:['+ Nuovo Progetto di Clan'], cu:[], vol:[] };
const S = {}; const errs = [];
for(const k of Object.keys(attesa)){ S[k] = await mk(k); const b = await bottoni(S[k]); ok(JSON.stringify(b) === JSON.stringify(attesa[k]), k + ': ' + (attesa[k].length ? attesa[k][0] : 'nessun pulsante «Nuovo…»') + (JSON.stringify(b) === JSON.stringify(attesa[k]) ? '' : ' (trovato: ' + JSON.stringify(b) + ')')); }
// Commissario: crea il Progetto di Sezione
const C = S.cds;
await C.P.click('#sh-piani button:has-text("+ Nuovo Progetto di Sezione")'); await sleep(500);
ok(await C.ev(() => /Nuovo Progetto di Sezione/.test(document.getElementById('sh-dlg').textContent) && document.getElementById('pn-n-tit').value === 'Progetto di Sezione · Pesaro' && !/Regolamento fissa/.test(document.getElementById('sh-dlg').textContent)), 'dialogo: «Nuovo Progetto di Sezione», nome proposto con la Sezione');
await C.P.click('#pn-n-ok'); await sleep(2200);
const ps = db.t.pee_piani.find(p => p.tipo === 'sezione');
ok(!!ps && ps.owner_id === U.cds.id && ps.titolo === 'Progetto di Sezione · Pesaro' && ps.data.sezione === 'Pesaro' && ps.stato === 'bozza', 'si crea un piano di tipo sezione, con la Sezione del profilo, in bozza');
ok(await C.ev(() => document.querySelector('#pn-sb-g-giro') === null && !!document.querySelector('#pn-sb-obi') && !document.querySelector('select[id^="pn-obs-"]')), 'nel Progetto di Sezione: niente Ascolto e niente «Dal Progetto di Sezione»');
await C.ev(() => pnSez('obi')); await sleep(400); await C.ev(() => pnObAdd()); await sleep(500);
await C.ev(() => { const o = PN.d.obiettivi[0]; pnOb(o.id, 'testo', 'Formare più Capi in Sezione'); pnOb(o.id, 'aree', ['formativa']); pnInd(o.id, 'ps26:1.1', true); }); await sleep(1600);
// non deliberato: il Gruppo non lo vede
const G = S.cg; await G.ev(() => pnNuovo('gruppo')); await sleep(400); await G.P.click('#pn-n-ok'); await sleep(2200);
const pg = db.t.pee_piani.find(p => p.tipo === 'gruppo');
ok(!!pg && pg.titolo === 'Piano di Gruppo · Pesaro · ' + (await G.ev(() => grpLabel('Pesaro 1'))) && pg.data.sezione === 'Pesaro', 'il Capo Gruppo crea il Piano di Gruppo come prima (titolo con Sezione e Gruppo)');
await G.ev(() => pnSez('obi')); await sleep(600);
ok(await G.ev(() => !document.querySelector('#pn-pds')), 'finché il Progetto di Sezione è in bozza, il Gruppo non lo vede');
// il Commissario lo delibera
await C.ev(() => pnMeta('stato', 'deliberato')); await sleep(2200);
ok(db.t.pee_piani.find(p => p.id === ps.id).stato === 'deliberato', 'il Commissario delibera il Progetto');
await G.ev(() => pnBack()); await sleep(800); await G.ev(id => pnOpen(id), pg.id); await sleep(1900); await G.ev(() => pnSez('obi')); await sleep(600);
ok(await G.ev(() => !!document.querySelector('#pn-pds') && /Formare più Capi in Sezione/.test(document.querySelector('#pn-pds').textContent) && document.querySelectorAll('#pn-pds .pn-nchip').length === 1), 'deliberato: il Capo Gruppo vede l’obiettivo, con l’indirizzo nazionale');
await G.P.click('#pn-pds .pn-ni button'); await sleep(1900);
const og = db.t.pee_piani.find(p => p.id === pg.id).data.obiettivi;
ok(og.length === 1 && og[0].testo === 'Formare più Capi in Sezione' && og[0].origine === 'sezione' && og[0].indirizzi[0] === 'ps26:1.1', 'lo porta nel Piano di Gruppo, con origine e indirizzo');
// Coordinatore Senior: Progetto di Clan
const K = S.coords;
await K.P.click('#sh-piani button:has-text("+ Nuovo Progetto di Clan")'); await sleep(500);
ok(await K.ev(() => document.getElementById('pn-n-tit').value === 'Progetto di Clan · Pesaro'), 'dialogo del Progetto di Clan: nome proposto con la Sezione');
await K.P.click('#pn-n-ok'); await sleep(2200);
const pc = db.t.pee_piani.find(p => p.tipo === 'clan');
ok(!!pc && pc.owner_id === U.coords.id && pc.data.sezione === 'Pesaro', 'si crea un Progetto di Clan');
ok(await K.ev(() => PN.p.tipo === 'clan' && !!document.querySelector('#pn-sb-obi')), 'il Progetto di Clan si apre con Obiettivi, Quadro e Verifiche');
// il Comitato con incarico Commissario crea; il Presidente no
const Q = S.cosC; await Q.P.click('#sh-piani button:has-text("+ Nuovo Progetto di Sezione")'); await sleep(400); await Q.P.click('#pn-n-ok'); await sleep(2200);
ok(db.t.pee_piani.filter(p => p.tipo === 'sezione' && p.owner_id === U.cosC.id).length === 1, 'Comitato con incarico Commissario: crea il Progetto di Sezione');
const nerr = Object.values(S).reduce((n, x) => n + x.pa.errors.length, 0); ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(Object.values(S).flatMap(x => x.pa.errors));
await br.close(); process.exit(summary() ? 1 : 0);
