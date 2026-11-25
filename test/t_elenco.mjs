// Elenco delle persone iscritte per invitare ai piani (SQL del 25 novembre) + frase di privacy nel profilo
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo, sez, gr, dash) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'E', sezione:sez, gruppo:gr, area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof('luca', 'Luca Titolare', 'cg', 'Pesaro', 'Pesaro 1'); prof('vcg', 'Vera Vice', 'vcg', ' pesaro', 'PESARO 1'); prof('cu1', 'Ugo Capo', 'cu', 'Pesaro', 'Pesaro 1'); prof('cu2', 'Uma Vice', 'vcu', 'Pesaro', 'Pesaro 1');
prof('altro', 'Otto Altro Gruppo', 'cu', 'Pesaro', 'Pesaro 2'); prof('cds', 'Dino Commissario', 'cds', 'Pesaro', ''); prof('pres', 'Cora Presidente', 'cos', 'Pesaro', '', {cos:{incarichi:['Presidente']}});
prof('coords', 'Sara Senior', 'coords', 'Pesaro', ''); prof('fano', 'Alba Fano', 'cg', 'Fano', 'Fano 1');
const mk = async (k) => { const pa = await person(br, db); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const L = await mk('luca');
const pid = await L.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Piano di prova', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
await L.ev(id => pnOpen(id), pid); await sleep(1500);
await L.ev(() => pnShare()); await sleep(1200);
const lista = () => L.ev(() => [...document.querySelectorAll('#pn-el .pn-chk')].map(l => l.textContent.replace(/\s+/g, ' ').trim()));
let el = await lista();
ok(el.length === 6 && el.some(x => /Vera Vice/.test(x)) && el.some(x => /Ugo Capo/.test(x)) && el.some(x => /Dino Commissario/.test(x)) && !el.some(x => /Otto|Alba|Luca/.test(x)), 'elenco: persone del Gruppo e figure di Sezione, non altri Gruppi né altre Sezioni, non sé stesso (' + el.length + ')');
ok(/Capo Unità|Vice Capo Unità/.test(el.find(x => /Uma/.test(x))) && /Comitato di Sezione \(Presidente\)/.test(el.find(x => /Cora/.test(x))), 'accanto al nome il ruolo (e gli incarichi del Comitato)');
ok(await L.ev(() => !document.getElementById('pn-el').textContent.includes('@')), 'le e-mail non sono scritte a video');
ok(await L.ev(() => /compaiono le persone iscritte/i.test(document.getElementById('pn-sh').textContent)), 'frase che spiega chi vede cosa');
ok(await L.ev(() => !/Attenzione: il Progetto di Clan/.test(document.getElementById('pn-sh').textContent)), 'sul Piano di Gruppo non compare l’avviso del Clan');
ok(await L.ev(() => document.getElementById('pn-el-r-0') && document.querySelectorAll('#pn-el select').length === 6), 'per ogni persona si sceglie cosa può fare');
const tocca = await L.ev(() => [...document.querySelectorAll('#pn-el .pn-chk')].filter(e => { const r = e.getBoundingClientRect(); return r.height < 36; }).length);
ok(tocca === 0, 'righe abbastanza grandi da toccare');
// senza spunte
await L.P.click('#pn-el-ok'); await sleep(300);
ok(/Spunta almeno una persona/.test(await L.ev(() => document.getElementById('pn-sh-msg').textContent)), 'senza spunte lo dice');
// invito di due persone
const idx = async (re) => L.ev(r => [...document.querySelectorAll('#pn-el input[type=checkbox]')].findIndex(c => new RegExp(r).test(c.dataset.n)), re);
await L.P.check(`#pn-el input[data-n="Vera Vice"]`); await L.P.check(`#pn-el input[data-n="Ugo Capo"]`); await L.P.click('#pn-el-ok'); await sleep(1500);
const mem = db.t.pee_piani_membri.filter(m => m.piano_id === pid);
const vv = mem.find(m => m.email === 'vcg@x.it'), uc = mem.find(m => m.email === 'cu1@x.it');
ok(mem.length === 2 && vv && vv.ruolo === 'collaboratore' && vv.etichetta === 'Vice Capo Gruppo' && vv.nome === 'Vera Vice', 'Vice CG invitata come collaboratrice, con etichetta e nome');
ok(uc && uc.ruolo === 'lettore' && uc.etichetta === 'Capo Unità', 'Capo Unità invitato come lettore');
ok(/2 persone invitate/.test(await L.ev(() => document.getElementById('pn-sh-msg').textContent)), 'messaggio di conferma');
el = await lista(); ok(el.length === 4 && !el.some(x => /Vera|Ugo/.test(x)), 'chi è già invitato esce dall’elenco');
// ruolo scelto a mano
await L.P.selectOption('#pn-el-r-0', 'cotitolare').catch(() => {}); 
const prima = db.t.pee_piani_membri.length;
const nom0 = await L.ev(() => document.querySelector('#pn-el input[type=checkbox]').dataset.n);
await L.P.check('#pn-el input[type=checkbox] >> nth=0'); await L.P.click('#pn-el-ok'); await sleep(1500);
ok(db.t.pee_piani_membri.length === prima + 1 && db.t.pee_piani_membri.find(m => m.nome === nom0).ruolo === 'cotitolare', 'il ruolo scelto sulla riga viene usato');
// invito doppio: errore leggibile
const dup = await L.ev(async () => { try{ await PIANI.invita(PN.p.id, 'cu1@x.it', 'lettore', '', ''); return 'ok'; }catch(e){ return pianoErr(e); } });
ok(dup !== 'ok', 'un invito doppio è rifiutato (' + dup + ')');
// chi non guida il Gruppo: nessuna sezione (co-titolare Capo Unità)
db.t.pee_piani_membri.find(m => m.email === 'cu1@x.it').ruolo = 'cotitolare';
const C = await mk('cu1'); await C.ev(id => pnOpen(id), pid); await sleep(1500); await C.ev(() => pnShare()); await sleep(1200);
ok(await C.ev(() => !!document.getElementById('pn-i-m') && !document.getElementById('pn-el')), 'un co-titolare che non guida il Gruppo vede solo l’invito per e-mail, senza elenco');
ok(!/non riesco|errore/i.test(await C.ev(() => document.getElementById('pn-sh').textContent)), 'e senza messaggi di errore');
// database non aggiornato
db.sqlPersone = false; await L.ev(() => pnShare()); await sleep(1200);
ok(/serve l’aggiornamento del database del 25 novembre/.test(await L.ev(() => document.getElementById('pn-sh').textContent)) && await L.ev(() => !!document.getElementById('pn-i-m')), 'senza SQL: messaggio chiaro e invito per e-mail ancora possibile');
db.sqlPersone = true;
// Progetto di Clan: avviso, solo lettura, conferma
const S = await mk('coords');
const cid = await S.ev(async () => (await PIANI.crea({tipo:'clan', titolo:'Progetto di Clan', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
await S.ev(id => pnOpen(id), cid); await sleep(1500); await S.ev(() => pnShare()); await sleep(1200);
const cl = await S.ev(() => ({n:document.querySelectorAll('#pn-el .pn-chk').length, av:/Attenzione: il Progetto di Clan contiene le valutazioni sul Clan/.test(document.getElementById('pn-sh').textContent), sel:document.querySelectorAll('#pn-el select').length, nomi:[...document.querySelectorAll('#pn-el input')].filter(i => i.type === 'checkbox').map(i => i.dataset.n).sort().join('|')}));
ok(cl.av && cl.sel === 0, 'Progetto di Clan: avviso specifico e nessuna scelta di ruolo (legge soltanto)');
ok(cl.nomi === ['Cora Presidente', 'Dino Commissario', 'Luca Titolare', 'Vera Vice'].sort().join('|'), 'e l’elenco è quello di Sezione e Capi Gruppo: ' + cl.nomi);
await S.ev(() => { window.__conf = 0; window.__orig = window.confirm; window.confirm = () => { window.__conf++; return false; }; });
await S.P.check('#pn-el input[data-n="Dino Commissario"]'); await S.P.click('#pn-el-ok'); await sleep(800);
const conf = await S.ev(() => window.__conf); ok(conf === 1 && !db.t.pee_piani_membri.some(m => m.piano_id === cid), 'prima di condividere il PdC chiede conferma, e se si annulla non invia nulla');
await S.ev(() => { window.confirm = () => true; });
await S.P.click('#pn-el-ok'); await sleep(1500);
const dm = db.t.pee_piani_membri.find(m => m.piano_id === cid);
ok(dm && dm.email === 'cds@x.it' && dm.ruolo === 'lettore' && dm.etichetta === 'Commissario di Sezione', 'confermato: invitato come lettore');
// Il CG non vede l'elenco di un Progetto di Sezione di cui è titolare? (ruolo non abilitato): niente sezione, niente errore
// profilo: frase di privacy
await L.ev(() => shGoHome()); await sleep(800); await L.ev(() => shProfileOpen()).catch(() => {}); await sleep(800);
const pv = await L.ev(() => { const e = document.getElementById('sh-privel'); return e ? e.textContent : null; });
ok(pv && /compaiono nell’elenco di chi coordina il tuo Gruppo o la tua Sezione/.test(pv), 'nel profilo c’è la frase di privacy');
const nerr = [L, C, S].reduce((n, w) => n + w.pa.errors.length, 0); ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) for(const w of [L, C, S]) if(w.pa.errors.length) console.log('  ', w.pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
