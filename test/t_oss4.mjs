// Riquadro KOS (scadenza solo al primo ciclo) + ricerca delle occasioni osservative e attività osservative dentro «Cerca un'attività» + riuso
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:+(process.env.VW || 1280), height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
const mk = (id, titolo, tipo, pp, extra) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:tipo, nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:Object.assign({tipoProgetto:tipo, annoScout:'2026-27', pp:pp}, extra || {})}, created_at:ts, updated_at:ts});
const STAFF = [{ruolo:'CU', nome:'Anna Verdi'}, {ruolo:'AC', nome:'Marco Neri'}];
const A2 = {id:'a2', nome:'La scelta difficile', aut:'Anna Verdi', ruolo:'tit', stato:'pronta', main:'S6', also:['C3'], dom:'Come scelgono quando nessuno li guida?', foc:['Osservo se scelgono da soli.', 'Osservo chi cede.'], dur:45, lan:'Un bivio nel bosco.', svi:'Due squadre scelgono il sentiero.', con:'Ci si racconta com’è andata.', at:2, sugg:{}};
const A3 = {id:'a3', nome:'Notte di stelle', aut:'Anna Verdi', ruolo:'tit', stato:'svolta', main:'S3', also:['P5'], dom:'', foc:['Guardo lo stupore.'], dur:30, lan:'', svi:'Si guarda il cielo.', con:'', at:1, data:'2026-11-02', occId:'x2', sugg:{}};
db.t.pee_archivi.push(mk('c1', 'Programmazione Annuale 2026-27 · Reparto', 'AN', {sezione:'Pesaro', gruppo:'1', staffTab:STAFF, kosDone:{E0_0:true}, occMan:[{id:'x1', att:'Uscita di inizio anno', data:'2026-10-04', ctx:'Fuori sede', chi:'Anna Verdi', note:'Si sono divisi in tre gruppi.', perc:['C3','P5']}, {id:'x2', att:'Attività osservativa · Notte di stelle', data:'2026-11-02', perc:['S3','P5']}], attOss:{a2:A2, a3:A3}}));
db.t.pee_archivi.push(mk('c2', 'Programmazione Annuale 2026-27 · Ciclo 2', 'AN', {sezione:'Pesaro', gruppo:'1', staffTab:STAFF}, {cicloDa:'c1', ciclo:{nome:'Ciclo 2'}}));
db.t.pee_archivi.push(mk('c3', 'Programmazione 2025-26', 'AN', {sezione:'Pesaro', gruppo:'1', staffTab:STAFF, attOss:{z1:{id:'z1', nome:'Il fiume e il ponte', aut:'Anna Verdi', ruolo:'tit', stato:'pronta', main:'C6', also:[], dom:'', foc:['Guardo come collaborano.'], dur:40, lan:'Il ponte è crollato.', svi:'Lo ricostruiscono.', con:'', at:1, sugg:{}}}}));
db.t.pee_archivi.push(mk('p1', 'Progetto Personale 2026-27', 'PP', {sezione:'Pesaro', gruppo:'1', nome:'Anna Verdi', staffTab:STAFF}));
await loginAs(P, base, u); await sleep(1200);
const goOcc = async id => { await P.evaluate(id => shOpen(id, 0), id).catch(() => {}); await sleep(2800); await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
  await ev(() => { gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(900); };
const kosTxt = () => ev(() => { const e = document.getElementById('kos-box'); return e ? e.innerText.replace(/\s+/g, ' ') : ''; });
// ── riquadro KOS al primo ciclo
await goOcc('c1');
let t = await kosTxt();
ok(/Percorso osservativo KOS 2\.0 · Reparto/.test(t) && /3 incontri, circa 10 ore/.test(t), 'riquadro KOS aperto, con titolo, incontri e ore: ' + t.slice(0, 80));
ok(/quanto prima \(entro novembre\)/.test(t), 'al primo ciclo c’è l’invito a chiudere l’osservazione presto per poter partire');
let k = await ev(() => { const src = obsSources(); const per = a => Object.keys(src).filter(id => id[0] === a).length; return {cnt: document.getElementById('kos-cnt').innerText.replace(/\s+/g, ' '), bars: [...document.querySelectorAll('#kos-bars .kos-bar .kb-n')].map(x => x.textContent), att: ['P','C','S'].map(a => per(a) + '/8'), tot: Object.keys(src).length, tit: (document.querySelector('#kos-bars .oss-lbl') || {}).textContent, det: !!document.querySelector('#kos-box details.kosbox-d')}; });
ok(/^1 attività svolte su 15/.test(k.cnt), 'contatore: ' + k.cnt);
ok(k.bars.length === 3 && k.bars.join() === k.att.join() && k.tot >= 5 && new RegExp(': ' + k.tot + ' su 24').test(k.tit), 'barre per Ambito (Personale, Comunitario, Spirituale) uguali ai percorsi osservati di KOS, occasioni e attività svolte: ' + k.bars.join() + ' · ' + k.tit);
ok(k.det, 'sotto c’è «Apri le attività del KOS»');
// il contatore e le barre seguono le spunte
await ev(() => { kosToggle('E0_1', true); }); await sleep(300);
k = await ev(() => document.getElementById('kos-cnt').innerText.replace(/\s+/g, ' '));
ok(/^2 attività/.test(k), 'spuntando un’attività il contatore sale a 2');
await ev(() => { kosToggle('E0_1', false); }); await sleep(200);
// ── ricerca
await ev(() => document.querySelector('#oss-panel .oss-btns .btn-ghost').click()); await sleep(2500);
let r = await ev(() => ({open: !!document.querySelector('#an-ov.show'), gb: [...document.querySelectorAll('#an-ov .an-gb')].map(b => b.textContent.trim() + ':' + b.getAttribute('aria-pressed')), n: [...document.querySelectorAll('#an-ov .an-card b')].map(b => b.textContent.trim()), hint: (document.querySelector('#an-list .ax-hint') || {}).textContent}));
ok(r.open && r.gb.join() === 'Attività educative:false,Occasioni osservative:true', 'si apre «Cerca» con le sole occasioni osservative accese: ' + r.gb.join());
ok(r.n.length === 5 && /5 risultati/.test(r.hint), 'risultati: attività osservative (2 + 1 di un altro progetto), occasione registrata, attività del KOS = 5: ' + r.n.join(' | '));
ok(r.n.includes('La scelta difficile') && r.n.includes('Il fiume e il ponte') && r.n.includes('Uscita di inizio anno') && r.n.some(x => /^KOS: /.test(x)) && !r.n.some(x => /Attività osservativa ·/.test(x)), 'la riga di «Notte di stelle» non è doppia');
const chips = await ev(() => [...document.querySelectorAll('#an-ov .an-card')].map(c => c.querySelector('b').textContent.trim() + ' → ' + [...c.querySelectorAll('.an-chip.go')].map(x => x.textContent).join()));
ok(chips.every(x => /Attività osservativa|Occasione osservativa/.test(x)), 'ogni risultato dice se è attività o occasione: ' + chips.slice(0, 3).join(' ; '));
// filtro percorso: il principale o «osservi anche»
await ev(() => { const s = [...document.querySelectorAll('#an-ov select')].find(x => x.options[0] && /Tutti i percorsi/.test(x.options[0].text)); s.value = 'C3'; s.dispatchEvent(new Event('change')); }); await sleep(300);
r = await ev(() => [...document.querySelectorAll('#an-ov .an-card b')].map(b => b.textContent.trim()));
ok(r.length === 2 && r.includes('La scelta difficile') && r.includes('Uscita di inizio anno'), 'filtro percorso C3: trova anche dove è «osservi anche»: ' + r.join(' | '));
await ev(() => { const s = [...document.querySelectorAll('#an-ov select')].find(x => x.options[1] && /Già svolte/.test(x.options[1].text)); s.value = 'todo'; s.dispatchEvent(new Event('change')); }); await sleep(300);
r = await ev(() => [...document.querySelectorAll('#an-ov .an-card b')].map(b => b.textContent.trim()));
ok(r.length === 1 && r[0] === 'La scelta difficile', '«Ancora da fare» lascia solo l’attività pronta: ' + r.join(' | '));
// accendo anche le educative
await ev(() => { const s = [...document.querySelectorAll('#an-ov select')]; s.forEach(x => { x.value = ''; }); AN.f.perc = ''; AN.f.st = ''; document.querySelectorAll('#an-ov .an-gb')[0].click(); }); await sleep(300);
r = await ev(() => ({gb: [...document.querySelectorAll('#an-ov .an-gb')].map(b => b.getAttribute('aria-pressed')).join(), tipo: [...document.querySelectorAll('#an-ov select')].filter(s => s.offsetParent).length}));
ok(r.gb === 'true,true' && r.tipo >= 7, 'con «e/o» accese i filtri delle educative tornano: ' + JSON.stringify(r));
await ev(() => { document.querySelectorAll('#an-ov .an-gb')[1].click(); }); await sleep(200); await ev(() => { document.querySelectorAll('#an-ov .an-gb')[0].click(); }); await sleep(200);
r = await ev(() => [...document.querySelectorAll('#an-ov .an-gb')].map(b => b.getAttribute('aria-pressed')).join());
ok(r === 'true,false' || r === 'false,true', 'non si possono spegnere entrambe: ' + r);
await ev(() => { AN.f.ga = false; AN.f.go = true; anRender(); }); await sleep(200);
// parole libere: cerca nel testo dell'occasione
await ev(() => { const q = document.getElementById('an-q'); q.value = 'tre gruppi'; q.dispatchEvent(new Event('input')); }); await sleep(300);
r = await ev(() => [...document.querySelectorAll('#an-ov .an-card b')].map(b => b.textContent.trim()));
ok(r.length === 1 && r[0] === 'Uscita di inizio anno', 'le parole cercano anche nelle note dell’occasione: ' + r.join(' | '));
await ev(() => { AN.f.q = ''; anRender(); });
// dettaglio
await ev(() => { [...document.querySelectorAll('#an-ov .an-ct')].find(b => /La scelta difficile/.test(b.textContent)).click(); }); await sleep(300);
let d = await ev(() => document.querySelector('#an-ov .an-box').innerText.replace(/\s+/g, ' '));
ok(/La domanda di partenza/.test(d) && /Osservo chi cede/.test(d) && /Un bivio nel bosco/.test(d) && /Riusa come punto di partenza/.test(d) && /principale/.test(d), 'dettaglio con domanda, percorsi, focus, lancio e «Riusa come punto di partenza»');
// riuso: percorso guidato già compilato sul foglio
await ev(() => { [...document.querySelectorAll('#an-ov .usc-btn')].find(b => /Riusa/.test(b.textContent)).click(); }); await sleep(3000);
const F = P.frames().filter(f => f !== P.mainFrame()).pop();
const w = await F.evaluate(() => ({nome: S.nome, main: S.main, also: S.also.join(), foc: S.foc.map(f => f.txt).join('|'), lan: S.lan, step: visSteps()[S.step].k, dom: S.dom}));
ok(w.nome === 'La scelta difficile' && w.main === 'S6' && w.also === 'C3' && w.step === 'fog' && /Osservo chi cede/.test(w.foc) && w.lan === 'Un bivio nel bosco.', 'il riuso apre «Il tuo foglio» già compilato: ' + JSON.stringify(w));
await F.evaluate(() => { S.nome = 'La scelta difficile (per il mio Reparto)'; salva(); }); await sleep(800);
r = await ev(() => ossList().map(a => a.nome + '/' + a.stato + '/' + (a.lan || '').slice(0, 8)));
ok(r.length === 3 && r.some(x => /\(per il mio Reparto\)\/pronta\/Un bivio/.test(x)), 'salvato come attività nuova, mia, pronta: ' + r.join(' ; '));
// «Apri» di un’occasione: porta alla tabella
await ev(() => document.querySelector('#oss-panel .oss-btns .btn-ghost').click()); await sleep(2500);
await ev(() => { [...document.querySelectorAll('#an-ov .an-card')].find(c => /Uscita di inizio anno/.test(c.textContent)).querySelector('.btn-ghost').click(); }); await sleep(2200);
r = await ev(() => ({closed: !document.querySelector('#an-ov.show'), occ: !!document.getElementById('occ-tab')}));
ok(r.closed && r.occ, '«Apri» su un’occasione porta alla tabella delle occasioni osservative');
// «Apri» di un’attività di un altro progetto: lo apre e si ferma sulla pagina
await ev(() => document.querySelector('#oss-panel .oss-btns .btn-ghost').click()); await sleep(2500);
await ev(() => { [...document.querySelectorAll('#an-ov .an-card')].find(c => /Il fiume e il ponte/.test(c.textContent)).querySelector('.btn-ghost').click(); }); await sleep(7000);
r = await ev(() => ({t: (CL.ctx || {}).titolo, card: !!document.querySelector('[data-oss="z1"]')}));
ok(/2025-26/.test(r.t || '') && r.card, 'l’attività di un altro progetto si apre nel suo progetto e la scheda c’è: ' + r.t);
// ── il secondo ciclo non ha la frase della scadenza
await goOcc('c2');
t = await kosTxt();
ok(/Percorso osservativo KOS 2\.0/.test(t) && !/novembre/.test(t), 'dal secondo ciclo non compare la scadenza di novembre');
// PP: resta la frase del Progetto Personale
await goOcc('p1');
t = await kosTxt();
ok(/Da chiudere entro novembre/.test(t), 'nel Progetto Personale resta «Da chiudere entro novembre»');
ok(pa.errors.length === 0, 'nessun errore JS: ' + JSON.stringify(pa.errors.slice(0, 2)));
summary(); process.exit(0);
