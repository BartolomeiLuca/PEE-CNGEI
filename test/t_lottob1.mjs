// Lotto B1 (27/11): «giro» diventa «Ascolto»; ordine del menu; un piano nuovo e vuoto si apre sull'Ascolto; messaggi del database senza «giro».
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo, br_, sez, gr) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:br_, sezione:sez, gruppo:gr, area_rcdf:'altoadriatico', dashboard:{}}); };
prof('luca', 'Luca Titolare', 'cg', '', 'Pesaro', 'Pesaro 1'); prof('ugo', 'Ugo Capo', 'cu', 'E', 'Pesaro', 'Pesaro 1');
const mk = async k => { const pa = await person(br, db); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const L = await mk('luca');
const ob = (id, t) => ({id, testo:t, aree:['educativa'], origine:'', rif:'', ricadute:false});
const pieno = await L.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Piano pieno', anno_inizio:annoScoutStart(), durata:3, data:Object.assign(pnVuoto(), {obiettivi:[{id:'o1', testo:'Più famiglie', aree:['educativa'], origine:'', rif:'', ricadute:false}]})})).id);
const vuoto = await L.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Piano vuoto', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
const clan = await L.ev(async () => (await PIANI.crea({tipo:'sezione', titolo:'Piano di Sezione', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);

// 1. piano vuoto di Gruppo: si apre sull'Ascolto
await L.ev(id => pnOpen(id), vuoto); await sleep(2200);
ok(await L.ev(() => PN.sez) === 'g-giro', 'un piano di Gruppo nuovo e vuoto si apre sull’Ascolto (' + await L.ev(() => PN.sez) + ')');
const ordine = await L.ev(() => [...document.querySelectorAll('[id^="pn-sb-"]')].map(b => b.id.slice(6)));
ok(JSON.stringify(ordine.filter(x => ['pan', 'g-giro', 'ana', 'obi', 'ver'].includes(x))) === '["pan","g-giro","ana","obi","ver"]', 'ordine del menu: Panoramica, Ascolto, Dove siamo, Obiettivi, Verifiche (' + ordine.join(',') + ')');
const etich = await L.ev(() => [...document.querySelectorAll('[id^="pn-sb-"]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).join(' | '));
ok(/Ascolto/.test(etich) && !/\bgiro\b/i.test(etich), 'nel menu la parola è «Ascolto», mai «giro» (' + etich + ')');
// 2. piano con contenuti: resta la Panoramica
await L.ev(id => pnOpen(id), pieno); await sleep(2200);
ok(await L.ev(() => PN.sez) === 'pan', 'un piano che ha già contenuti si apre sulla Panoramica');
// 3. piano non di Gruppo: niente Ascolto, apre la Panoramica
await L.ev(id => pnOpen(id), clan); await sleep(1800);
ok(await L.ev(() => PN.sez) === 'pan' && !(await L.ev(() => !!document.getElementById('pn-sb-g-giro'))), 'un Progetto di Sezione non ha l’Ascolto e apre la Panoramica');
// 4. i testi della pagina Ascolto
await L.ev(id => pnOpen(id), vuoto); await sleep(2000);
const pg = await L.ev(() => (document.getElementById('sh-root') || document.body).innerText.replace(/\s+/g, ' '));
ok(/Ascolto/.test(pg) && !/\bgiro\b/i.test(pg), 'la pagina dell’Ascolto non dice «giro» (' + pg.slice(0, 120) + ')');
// 5. messaggi del database senza «giro»
const m = await L.ev(() => ['Solo il titolare o un co-titolare apre un giro', 'C’è già un giro aperto: chiudilo prima di aprirne un altro', 'Il giro è già chiuso'].map(t => pianoErr({code:'P0001', message:t})));
ok(m.every(t => !/\bgiro\b/i.test(t) && /Ascolto/.test(t)), 'i messaggi del database dicono «Ascolto» (' + m.join(' / ') + ')');
// 6. un Capo Unità: la pagina della sua Carta è in sola lettura
await L.ev(async (id) => { await PIANI.giroApri(id, {ritmo:'standard'}); }, vuoto); await sleep(300);
db.t.pee_piani_membri.push({id:'m1', piano_id:vuoto, email:'ugo@x.it', ruolo:'lettore', etichetta:'Capo Unità', nome:'Ugo Capo', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});
const G = await mk('ugo'); await G.ev(id => pnOpen(id), vuoto); await sleep(2200);
ok(await G.ev(() => PN.sez) === 'g-giro', 'chi è invitato a un piano vuoto con un Ascolto aperto lo trova aperto sull’Ascolto');
await G.ev(() => pnSez('g-cdu')); await sleep(900);
ok(await G.ev(() => document.querySelectorAll('section[aria-labelledby="gi-cu-t"] textarea, section[aria-labelledby="gi-cu-t"] input').length) === 0, 'la Carta di Unità nel piano non ha campi da scrivere');
const nerr = [L, G].reduce((n, w) => n + w.pa.errors.length, 0);
ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')');
await br.close(); process.exit(summary() ? 1 : 0);
