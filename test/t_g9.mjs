import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
db.t.pee_archivi.push({id:'pp1', user_id:u.id, anno:2026, titolo:'PP', meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{P1:3, C1:3, S1:3}, pris:{P1:true}, scheda:{tipoProgetto:'PP', annoScout:'2026-27', priorita:[{ambito:'P',necessita:'n',percorso:'P1',pid:'P1',obiettivi:[0],idr:[0,1],tempistica:''},{ambito:'',necessita:'',percorso:'',obiettivi:[],idr:[],tempistica:''},{ambito:'',necessita:'',percorso:'',obiettivi:[],idr:[],tempistica:''}]}}, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-10-01T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('pp1', 0)); await sleep(3500);
await P.click('#sh-side .sh-si:has-text("2 · ")'); await sleep(600);
const n0 = await ev(() => document.querySelectorAll('.idr-row').length);
ok(n0 >= 3 && await ev(() => !!document.querySelector('button[onclick*="idrEditStart"]')), 'Sezione 2: ogni IdR ha «Adatta» (' + n0 + ' righe)');
const base0 = await ev(() => idrBase('P1', 0));
await ev(() => document.querySelectorAll('details.u-ob').forEach(d => { d.open = true; })); await sleep(200);   // le priorità compilate partono chiuse
await P.click('button[onclick*="idrEditStart(\'P1\',0)"]'); await sleep(300);
await P.fill('textarea.idr-ed', 'Testo adattato da me'); await sleep(200);
await P.click('button[onclick*="idrEditEnd"]'); await sleep(400);
ok(await ev(() => idrTxt('P1', 0) === 'Testo adattato da me' && idrTag('P1', 0) === 'adattato') && await ev(() => /adattato/.test(document.querySelector('.idr-row').innerText)), 'adattato: testo nuovo con etichetta «adattato»');
await P.click('button[onclick*="idrRestore(\'P1\',0)"]'); await sleep(400);
ok(await ev((b) => idrTxt('P1', 0) === b && idrTag('P1', 0) === '', base0), 'Ripristina: torna il testo del Manuale');
await P.click('button[onclick*="idrEditStart(\'P1\',1)"]'); await sleep(300);
await P.fill('textarea.idr-ed', 'Altro testo adattato'); await P.click('button[onclick*="idrEditEnd"]'); await sleep(300);
await P.click('button[onclick*="idrExtraAdd"]'); await sleep(500);
await P.fill('textarea.idr-ed', 'Un indicatore mio'); await P.click('button[onclick*="idrEditEnd"]'); await sleep(400);
ok(await ev(() => scheda.priorita[0].idr.includes(100) && idrTxt('P1', 100) === 'Un indicatore mio' && idrTag('P1', 100) === 'personalizzato'), 'indicatore personalizzato: creato, selezionato, con etichetta');
// Word
const exp = async () => { const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => exportSchedaDocx('full'))]); return execSync('unzip -p ' + await dl.path() + ' word/document.xml').toString().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };
const xml = await exp();
ok(xml.includes('Altro testo adattato [adattato]') && xml.includes('Un indicatore mio [personalizzato]'), 'Word: IdR con etichette «adattato» e «personalizzato»');
// salvataggio
await ev(() => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2500);
await P.reload(); await sleep(2500); await ev(() => shOpen('pp1', 0)); await sleep(3500);
ok(await ev(() => idrTxt('P1', 1) === 'Altro testo adattato' && idrTxt('P1', 100) === 'Un indicatore mio'), 'dopo il ricaricamento le modifiche agli IdR ci sono ancora');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
