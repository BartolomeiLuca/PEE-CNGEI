import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import fs from 'fs';
import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const html = fs.readFileSync('/tmp/site_sh/anteprima/index.html', 'utf8');
const KOS2 = JSON.parse(html.match(/const KOS2 = (\{.*?\});\n/s)[1]);
const FOC = JSON.parse(html.match(/const KOS2_FOC = (.*);\n/)[1]);
let key = null, nome = '';
KOS2.E.forEach((inc, i) => inc.a.forEach((a, j) => { if(!key && a.f.includes('P1')){ key = 'E' + i + '_' + j; nome = a.n; } }));
const kosTxt = FOC.E[key].P1;
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
const kd = {}; kd[key] = true;
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{P1:6}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{kosDone:kd, occKos:{[key]:{data:'2026-10-10'}}, occMan:[{att:'Gioco mio', data:'2026-10-20', perc:['P1']}]}}}, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-10-01T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
await ev(() => gGo('1b')); await sleep(800);
await ev(() => document.getElementById('card-P1').classList.add('expanded'));
const s = await ev(() => ({sub:(document.querySelector('#card-P1 .gr-sub')||{}).textContent||'', rows:document.querySelectorAll('#card-P1 .gr-row.gr-hl').length, ta:[...document.querySelectorAll('#card-P1 .gr-foc textarea')].map(t => t.value), note:document.querySelector('#card-P1 .gr-foc .gr-old')?.textContent||'', picks:[...document.querySelectorAll('#card-P1 .gr-row.gr-hl')].map(r => r.querySelectorAll('.gr-pi input').length), els:grElems('P1').length}));
ok(/Corporeità: Espressività, consapevolezza fisica, gestione stress fisico/.test(s.sub), 'sottotitolo del Reparto accanto al percorso');
ok(s.rows === 2 && s.ta.length === 1 && s.ta[0] === kosTxt && /Proposto dal KOS 2\.0/.test(s.note), 'attività del KOS: il focus del KOS 2.0 è già scritto e modificabile; attività propria: nessun testo precompilato');
ok(s.els >= 3 && s.picks.every(n => n === s.els), 'ogni riga ha la tendina con gli spunti «cosa osservare» della Branca (' + s.els + ')');
// spunta
await P.click('#card-P1 .gr-row.gr-hl >> nth=1 >> summary'); await sleep(200);
await P.check('#card-P1 .gr-row.gr-hl >> nth=1 >> .gr-pi input >> nth=0'); await sleep(300);
const el0 = await ev(() => grElems('P1')[0]);
const mid = await ev(() => scheda.pp.occMan[0].id);
ok(await ev(([k, e]) => { const g = (scheda.griglia.P1 || {})[k]; return !!(g && g.fsel && g.fsel.length === 1 && g.fsel[0] === e); }, ['m:' + mid, el0]), 'spunta salvata (anche su attività propria)');
ok(await ev(() => document.querySelectorAll('#card-P1 .gr-row.gr-hl')[1].querySelector('.gr-chip') !== null && document.querySelectorAll('#card-P1 .gr-row.gr-hl')[1].querySelector('.gr-n').textContent === '1'), 'la scelta compare come etichetta e il contatore sale');
// altro
await P.click('#card-P1 .gr-row.gr-hl >> nth=0 >> .gr-add'); await sleep(300);
await P.fill('#card-P1 .gr-row.gr-hl >> nth=0 >> .gr-alt textarea', 'Mio focus speciale'); await sleep(300);
await P.click('#card-P1 .gr-row.gr-hl >> nth=0 >> .gr-add'); await sleep(200);
ok(await ev((k) => { const g = scheda.griglia.P1[k]; return g && g.falt && g.falt[0] === 'Mio focus speciale' && g.falt.length === 2; }, 'k:' + key), '«+ Altro»: più campi liberi, il testo si salva');
// Word
const exp = async () => { const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => exportSchedaDocx('full'))]); const path = await dl.path(); return execSync('unzip -p ' + path + ' word/document.xml').toString().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };
let xml = await exp();
ok(xml.includes('Focus: ' + kosTxt.slice(0, 20)) || xml.includes(kosTxt), 'Word: il focus del KOS 2.0 compare nella cella');
ok(xml.includes(el0) && xml.includes('Mio focus speciale'), 'Word: anche gli spunti scelti e i campi «Altro»');
ok(xml.includes('Attività: ' + nome + ' · 10 ottobre') && xml.includes('Attività: Gioco mio · 20 ottobre'), 'Word: «Attività: nome · data», senza numero');
// svuoto il focus KOS
await P.fill('#card-P1 .gr-row.gr-hl >> nth=0 >> .gr-foc textarea', ''); await sleep(300);
xml = await exp();
ok(!xml.includes(kosTxt) && xml.includes('Mio focus speciale'), 'se cancelli il focus del KOS non rientra da solo; il resto resta');
// dopo il ricaricamento i dati della griglia sono ancora agganciati all'attività propria
await ev(() => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2500);
await P.reload(); await sleep(2500); await ev(() => shOpen('p1', 0)); await sleep(3500); await ev(() => gGo('1b')); await sleep(800);
ok(await ev(() => { const rows = grRows('P1'); const m = rows.find(r => /^m:/.test(r.k)); const g = m && (scheda.griglia.P1 || {})[m.k]; return !!(g && g.fsel && g.fsel.length === 1); }), 'dopo il ricaricamento la scelta sull\'attività propria è ancora lì');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
