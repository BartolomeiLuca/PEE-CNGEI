// Parte 2 — progetti con dati malformati (file JSON rovinato o ostile): l'app non deve restare bloccata
import { FakeDB, serve, launch, person, loginAs, sleep } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch(process.argv[2] || 'chromium');
const CASES = {
  'scheda è un testo': {v:1, MODE:'giovani', FASCIA:'E', obs:{}, pris:{}, scheda:'ciao'},
  'scheda è una lista': {v:1, MODE:'giovani', FASCIA:'E', obs:{}, pris:{}, scheda:[1,2]},
  'obs e pris sbagliati': {v:1, MODE:'giovani', FASCIA:'E', obs:'x', pris:[1], scheda:{pp:null}},
  'fascia e modo sconosciuti': {v:1, MODE:'boh', FASCIA:'Z', obs:{}, pris:{}, scheda:{}},
  'priorità e percorsi rovinati': {v:1, MODE:'giovani', FASCIA:'E', obs:{}, pris:{P1:true}, scheda:{priorita:'no', percorsi:{a:1}, percorsiExtra:[null, 5, {percorsoId:'XX', attivita:'no'}, {percorsoId:'P1', attivita:[null, 'x', {testo:5, ax:'no'}]}], uscite:[1, null], pp:{staffTab:'x'}, ciclo:'x'}},
  'eventi rovinati': {v:1, MODE:'giovani', FASCIA:'E', obs:{}, pris:{}, scheda:{uscite:{a:null, b:'x', c:{id:'c', prog:'no', ax:null}, d:{id:'d', testo:{}, prog:{k:null, j:{k:'att', g:'x'}}, ax:{data:'non-una-data', pres:'x'}}}, pp:{}}},
  'staff rovinato': {v:1, MODE:'staff', STAFF_MEMBERS:'x', staffObs:[1], staffProfiles:null, scheda:{}},
  'vuoto': {},
};
const T = (p, ms, tag) => Promise.race([p, new Promise(r => setTimeout(() => r('TEMPO SCADUTO ' + tag), ms))]);
const ONLY = process.env.ONLY;
for(const [name, data] of Object.entries(CASES)){ if(ONLY && name !== ONLY) continue; console.log('· ' + name);
  const db = new FakeDB(); const u = db.addUser('anna@x.it', 'password123', 'Anna');
  db.t.pee_profili.push({user_id:u.id, nome:'Anna', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
  db.t.pee_archivi.push({id:'bad', user_id:u.id, anno:2026, titolo:'Rovinato', meta:{mode:data.MODE || 'giovani', fascia:'E'}, data, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
  db.t.pee_archivi.push({id:'good', user_id:u.id, anno:2026, titolo:'Buono', meta:{mode:'giovani', fascia:'E'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'OK', obs:{}, pris:{}, scheda:{pp:{}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
  const pa = await person(br, db); const P = pa.page; await loginAs(P, base, u); await sleep(1200);
  const o1 = await T(P.evaluate(() => { shOpen('bad', 0); return 'avviato'; }).catch(e => 'ecc'), 8000, 'apertura'); await sleep(3000); const alive = await T(P.evaluate(() => 'viva').catch(() => 'ecc'), 8000, 'pagina bloccata dopo apertura'); if(alive !== 'viva'){ console.log('  ✗ ' + name + ': ' + alive + ' | ' + (pa.errors[0] || '').split('\n')[0].slice(0, 120)); await T(pa.ctx.close(), 5000, 'x'); continue; }
  for(const f of ["gGo('3')", "shCal()", "shSec('2')", "gGo('1')"]){ const rr = await T(P.evaluate(f => { try{ (0, eval)(f); }catch(e){ window.__ne = (window.__ne || 0) + 1; } return 1; }, f).catch(() => {}), 10000, f); if(rr !== 1) console.log('    ' + rr); await sleep(500); }
  const e1 = pa.errors.length;
  await T(P.reload({waitUntil:'domcontentloaded'}).catch(() => {}), 15000, 'ricarica'); await sleep(3000);
  // la persona riesce a tornare ai suoi progetti e ad aprirne uno buono?
  await T(P.evaluate(() => { try{ shGoHome(); }catch(e){} return 1; }).catch(() => {}), 8000, 'home'); await sleep(2000);
  const listed = await T(P.evaluate(() => /Buono/.test(document.body.innerText) && /Rovinato/.test(document.body.innerText)).catch(() => 'ecc'), 8000, 'elenco');
  await T(P.evaluate(() => { try{ shOpen('good', 0); }catch(e){} return 1; }).catch(() => {}), 8000, 'apri buono'); await sleep(4500);
  const back0 = await T(P.evaluate(() => (typeof UNIT_NAME !== 'undefined' && UNIT_NAME === 'OK' && CL.ctx && CL.ctx.id === 'good') ? 'ok' : 'non aperto (' + (CL.ctx && CL.ctx.id) + ')').catch(e => 'eccezione'), 8000, 'stato');
  const back = (listed === true ? '' : 'elenco progetti: ' + listed + '; ') + back0 === 'ok' ? 'ok' : (listed === true ? '' : 'elenco progetti: ' + listed + '; ') + back0;
  const cloudBad = JSON.stringify(db.t.pee_archivi.find(r => r.id === 'bad').data) === JSON.stringify(data);
  console.log((back === 'ok' ? '  ✓ ' : '  ✗ ') + name + ': errori JS ' + e1 + '→' + pa.errors.length + '; ritorno a un progetto buono: ' + back + '; dati nel cloud ' + (cloudBad ? 'intatti' : 'riscritti') + (pa.errors[0] ? ' | ' + pa.errors[0].split('\n')[0].slice(0, 110) : ''));
  await T(pa.ctx.close(), 8000, 'chiusura'); }
await br.close(); process.exit(0);
