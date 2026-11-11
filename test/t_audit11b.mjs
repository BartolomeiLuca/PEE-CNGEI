// Verifica dell'11/11 (Parte 2): «Carica da file» nel Calendario, ruoli dopo un errore di rete, funzioni dei pulsanti presenti
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import fs from 'fs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const usc = (id, md, t, d) => ({id, cr:1, testo:t, modello:md, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:md === 'sede' ? {tipo:'sede'} : {}}, prog:{}, hid:{}, own:{}});
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0], tempistica:''}], pp:{},
    uscite:{u1:usc('u1', 'giorno', 'Uscita al parco', '2026-11-15')}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
// 1 · le funzioni usate dal primo script esistono
ok(await ev(() => typeof calRe === 'function' && typeof calCan === 'function' && typeof visRe === 'function'), 'calRe, calCan e visRe sono raggiungibili da tutto il codice');
// 2 · «Carica da file» nel Calendario
await ev(() => shCal()); await sleep(900);
fs.writeFileSync('/tmp/audit_evento.json', JSON.stringify({pee:'evento', v:1, app:'PEE CNGEI', fascia:'E', at:1, u:usc('zz', 'giorno', 'Evento dal file', '2026-12-06'), att:{}}));
const btn = P.locator('[onclick*="calJsonIn"]').first();
ok(await btn.count() > 0, 'nel Calendario c’è il pulsante per caricare un evento da file');
const [fc] = await Promise.all([P.waitForEvent('filechooser', {timeout:8000}).catch(() => null), btn.click().catch(() => {})]);
ok(!!fc, 'il pulsante apre la scelta del file (prima si fermava con un errore)');
if(fc){ await fc.setFiles('/tmp/audit_evento.json'); await sleep(1500); }
const st = await ev(() => ({n: Object.values(scheda.uscite || {}).filter(x => x && !x.del && /Evento dal file/.test(x.testo || '')).length, cal: /Evento dal file/.test((document.getElementById('panel-pp') || {}).textContent || ''), toast: (document.querySelector('.toast,#toast') || {}).textContent || ''}));
ok(st.n === 1, 'l’evento del file è nel progetto una volta sola (' + st.n + ')');
ok(st.cal, 'e compare subito nel Calendario');
await sleep(5000);
ok(Object.values(db.t.pee_archivi[0].data.scheda.uscite).some(x => /Evento dal file/.test(x.testo || '')), 'ed è arrivato al cloud');
// 3 · un errore di rete alla prima domanda sui ruoli non resta in memoria
const r = await ev(async () => { CL.roles = undefined; return true; });
db.offline = true; const r1 = await ev(() => clRolesOk()); db.offline = false; const r2 = await ev(() => clRolesOk());
ok(r1 === false && r2 === true, 'ruoli: con la rete assente «no», tornata la rete «sì» senza ricaricare la pagina (' + r1 + ' → ' + r2 + ')');
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 2).join(' | ').slice(0, 300));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
