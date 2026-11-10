import { FakeDB, serve, launch, person, sleep, loginAs } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch('chromium');
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:800}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('giulia@x.it', 'password123', 'Giulia Cocon');
db.t.pee_profili.push({user_id:u.id, nome:'Giulia Cocon', ruolo:'cu', branca:'L', sezione:'Pesaro', gruppo:'1', dashboard:{}});
const occMan = [
 {id:'m1', att:'Movimento_e Presentazione Corporea', data:'2026-11-07', perc:['P1','P2','S1']},
 {id:'m2', att:'Il Museo _delle_ Emozioni\n- Attività Espressiva e Rielaborativa', data:'2026-11-14', perc:['P1','P2','S4']},
 {id:'m3', att:'Le orme nel bosco\t- Attività espressiva e introspettiva', data:'2026-11-14', perc:['P1','P2']}];
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Prova', meta:{mode:'giovani', fascia:'L', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'L', UNIT_NAME:'Branco X', obs:{P1:6,P2:5,S1:4,S4:3}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{occMan}}}});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
await ev(() => { const G = scheda.griglia = {}; ['P1','P2','S1','S4'].forEach(pid => { G[pid] = {}; grRows(pid).forEach((r, i) => { G[pid][r.k] = {pos:'sono molto coordinati ^^**^^** e attenti\nAnna: ha guidato '+i+' **bene** ^^**^^**', mig:'Rispetto degli spazi altrui', note:i==1?'Achille tende ad essere soverchiante':'', foc:'Consapevolezza corporea\nCome si muovono durante i giochi'}; }); }); });
const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx('consegna1'))]);
await dl.saveAs(process.argv[2] || '/tmp/grid2.docx'); console.log('ok', pa.errors.slice(0,2)); await br.close(); process.exit(0);
