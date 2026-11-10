import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const row = (id, anno, titolo, tipo, data, ts) => ({id, user_id:u.id, anno, titolo, meta:{mode:'giovani', fascia:'E', tipo, nome:'Reparto Kontiki'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Kontiki'}, data), created_at:ts, updated_at:ts});
// PP 2026 con contenuto; PE 2026 vuota; PE 2025 con contesto, sede, staff e verifiche
db.t.pee_archivi.push(row('pe', 2026, 'Programmazione Annuale 2026-27 · Reparto Kontiki', 'AN', {scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}}}, '2026-10-21T10:00:00Z'));

const fs = (await import('fs')).default; const { execSync } = await import('child_process'); const JSZip = (await import('/home/claude/work/node_modules/jszip/lib/index.js')).default; const OUT = '/tmp/t_staffcirc'; fs.mkdirSync(OUT, {recursive:true});
await loginAs(P, base, u); await sleep(1200);
P.evaluate(() => shOpen('pe', 0)).catch(() => {}); await sleep(3000);
await ev(() => { try{ if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }catch(e){} }); await sleep(2500);
const r = await ev(() => { UNIT_NAME = 'Reparto Kontiki2'; const id = uscNewId('u'); uscMap()[id] = {id, cr:Date.now(), testo:'Bivacco di staff', modello:'sede', ax:{data:'2026-12-05', durata:'giorno', pres:{ad:['Giulia (CU)','Paolo (VCU)']}, luogo:{tipo:'sede'}, cibo:{carico:'ragazzi'}}, prog:{}, hid:{}, own:{}, dest:'staff', riservata:false}; saveData(true); USC_CUR = id; gGo('usc'); const j = uscJ(id); return {id, j}; });
await sleep(800);
await ev(() => { const id = USC_CUR; uscRe(); });
//console.log(JSON.stringify(await ev(() => ({MODE, cur:USC_CUR, ax:window._axP, P:USC_P, st:uscSt(), axst:axSt(), dest:(uscGet(USC_CUR)||{}).dest, step:schedaStep}))));

const BAD=/ragazz|pattuglia|quadrato|alzabandiera|pelliccia|squadrigli|lupett|esplorator|branco|\bcapi\b|famiglie/i;
await ev(() => { uscSchema(1,'arrivo'); });
await sleep(500);
const tabs = await ev(() => [...document.querySelectorAll('#usc-tabs button, #usc-tabs [onclick]')].map(b => b.getAttribute('onclick')).filter(Boolean));
console.log('TABS', JSON.stringify(tabs));
const seen = new Set();
for (const oc of tabs) {
  await ev(([o]) => { try { new Function(o)(); } catch(e){} }, [oc]); await sleep(400);
  const txt = await ev(() => document.querySelector('#usc-page, .usc-page, #screen-usc, body').innerText);
  const hits = [...new Set((txt.match(new RegExp('.{0,40}(' + BAD.source + ').{0,40}', 'gi')) || []).map(s => s.replace(/\s+/g, ' ')))];
  hits.forEach(h => seen.add(oc.slice(0,30) + ' → ' + h));
}
console.log([...seen].join('\n'));
await br.close(); process.exit(0);
