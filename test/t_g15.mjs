import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
const obs = {}; ['P','C','S'].forEach(a => { for(let i = 1; i <= 8; i++) obs[a + i] = [1,3,5,7,9,6,4,8][i - 1]; });
db.t.pee_archivi.push({id:'pp1', user_id:u.id, anno:2026, titolo:'PP', meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto X', obs, pris:{P1:true, C2:true, S3:true}, scheda:{tipoProgetto:'PP', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, _p2Seen:true}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('pp1', 0)); await sleep(3500);
// sottomenu
await P.click('#sh-side .sh-si[data-id="pp1"]'); await sleep(800);
let s = await ev(() => [...document.querySelectorAll('#sh-side .sh-ss')].map(x => x.textContent));
ok(s.join('|') === 'Contesto|KOS e Occasioni osservative|Sviluppo Personale|Sviluppo Comunitario|Sviluppo Spirituale|Lettura del gruppo|Priorità', 'PP: sottovoci della Sezione 1 nel menu: ' + s.join(' / '));
await P.click('#sh-side .sh-ss[data-sub="1b:C"]'); await sleep(900);
s = await ev(() => ({vis:[...document.querySelectorAll('#percorsi-root .ambito-sec')].map(e => getComputedStyle(e).display !== 'none'), on:document.querySelector('#sh-side .sh-ss.on')?.textContent, foot:getComputedStyle(document.getElementById('amb-foot')).display}));
ok(s.vis.join() === 'false,true,false' && s.on === 'Sviluppo Comunitario' && s.foot !== 'none', 'una pagina per Ambito: solo il Comunitario in vista, voce accesa, piè di pagina precedente/successivo');
await P.click('#amb-foot .btn-primary'); await sleep(900);
ok(await ev(() => [...document.querySelectorAll('#percorsi-root .ambito-sec')].map(e => getComputedStyle(e).display !== 'none').join()) === 'false,false,true', '«Sviluppo Spirituale →» porta alla pagina dello Spirituale');
await ev(() => gotoObs('P3')); await sleep(900);
ok(await ev(() => getComputedStyle(document.getElementById('card-P3')).display !== 'none' && document.body.dataset.amb === 'P'), 'gotoObs(P3) apre la pagina del Personale e mostra il percorso');
// istruzioni LG
s = await ev(() => { const d = document.getElementById('lg-istr'); return d ? {open:d.open, txt:d.textContent} : null; });
ok(s && s.open === false && /Compilazione della scheda di osservazione utilizzando il Kit/.test(s.txt) && /Descrizione oggettiva e non giudicante/.test(s.txt), 'Scheda: istruzioni delle Linee Guida in un paragrafo chiuso');
for(const [k, re] of [['1a', /Contesto territoriale/], ['1c', /Analisi delle dinamiche/], ['1d', /Breve spiegazione finale/], ['2', /Almeno un obiettivo per ogni Ambito/], ['3', /Presenza di momento\/i di rielaborazione/], ['4', /Analisi oggettiva e non auto-giustificativa/], ['5', /Onestà nella valutazione/]]){
  await ev(k => { if(/^1/.test(k)) shSub(k, ''); else shPP(k); }, k); await sleep(700);
  const t = await ev(() => (document.getElementById('lg-istr') || {textContent:''}).textContent);
  ok(re.test(t), 'istruzioni LG della pagina ' + k);
}
// Sezione 3: niente campi di Realizzare nel PP
await ev(() => shPP('3')); await sleep(900);
await ev(() => { const el = document.querySelector('.pc-hdr'); });
const n0 = await ev(() => document.querySelectorAll('textarea[oninput*="\'lancio\'"]').length);
if(!n0){ await ev(() => { try{ attAdd(0); }catch(e){} }); await sleep(600); }
s = await ev(() => ({att:document.querySelectorAll('.att-links').length, extra:document.querySelectorAll('details.att-extra').length, prop:document.querySelectorAll('.an-prop').length, txt:document.body.innerText.includes('Allegati e link'), lanc:document.querySelectorAll('textarea[oninput*="\'lancio\'"]').length}));
ok(s.lanc >= 1 && s.att === 0 && s.extra === 0 && s.prop === 0 && !s.txt, 'PP Sezione 3: tolti Allegati e link, «Quando arriva il momento», «Proponi all’archivio» (attività: ' + s.lanc + ')');
// link nel testo → cliccabile nel Word
await ev(() => { updateAttivita(0, 0, 'titolo', 'Gioco'); updateAttivita(0, 0, 'testo', 'Gioco'); updateAttivita(0, 0, 'sviluppo', 'Usate la scheda su https://drive.google.com/file/d/abc123 e poi scrivete'); saveData(true); });
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => exportSchedaDocx('full'))]);
const path = await dl.path();
const rels = execSync('unzip -p ' + path + ' word/_rels/document.xml.rels').toString(); const xml = execSync('unzip -p ' + path + ' word/document.xml').toString();
ok(/drive\.google\.com\/file\/d\/abc123/.test(rels) && /<w:hyperlink/.test(xml), 'Word: il link scritto nello Sviluppo è un collegamento cliccabile');
// domande guida
await ev(() => shSub('1c', '')); await sleep(700);
ok(await ev(() => !!document.querySelector('textarea[placeholder^="Come si relaziona il gruppo"]')) && await ev(() => !!document.querySelector('textarea[placeholder^="Che cosa funziona già bene"]')), 'campi con domande guida (dinamiche, aspetti positivi)');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
