// separazione Unità/staff: niente copie a catena (le copie identiche NON si tolgono più da sole: l’utente può tenere più PEE nello stesso anno)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
const ex = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
// rendo misto il progetto aperto (come succedeva prima) e simulo una pagina che continua a salvare
await ev(() => { MODE = 'staff'; STAFF_RUOLO = 'CU'; STAFF_MEMBERS.push('Lia'); _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(2500);
// copie identiche già create dal difetto
const misto = JSON.parse(JSON.stringify(db.t.pee_archivi.find(r => r.id === ex.id).data));
const copia = {v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'', obs:misto.obs, pris:misto.pris, vals:misto.vals, scheda:misto.scheda};
for(let i = 0; i < 4; i++) db.t.pee_archivi.push({id:'dup' + i, user_id:A.id, anno:ex.anno, titolo:'PEE ' + ex.anno + ' (' + (i + 2) + ')', data:JSON.parse(JSON.stringify(copia)), meta:{nome:'', mode:'giovani', fascia:'E', staff:0, osservati:Object.values(copia.obs||{}).filter(v => v && v !== 'n').length}, updated_at:new Date(Date.now() - 100000 + i).toISOString()});
console.log('inizio', db.t.pee_archivi.filter(r => r.user_id === A.id).map(r => r.titolo + '/' + (r.meta||{}).mode + '/S' + ((r.data||{}).STAFF_MEMBERS||[]).length + '/M' + (r.data||{}).MODE).join(' | '));
const tick = setInterval(() => ev(() => { try{ if(MODE && document.getElementById('main-app').style.display === 'block'){ _clTouched = true; _clUserAt = Date.now(); saveData(true); } }catch(e){} }).catch(() => {}), 300);
for(let k = 0; k < 3; k++){ await P.reload(); await sleep(6000); console.log('giro', k, await ev(() => (CL.ctx||{}).titolo + ' MODE=' + MODE).catch(() => '?'), db.t.pee_archivi.filter(r => r.user_id === A.id).map(r => r.titolo + '/' + (r.meta||{}).mode + '/S' + ((r.data||{}).STAFF_MEMBERS||[]).length + '/M' + (r.data||{}).MODE).join(' | ')); }
clearInterval(tick);
P.on('console', m => { if(/pjDedupe|pjSplit/.test(m.text())) console.log('PAGE', m.text().slice(0,300)); });



await sleep(8000);
const mine = db.t.pee_archivi.filter(r => r.user_id === A.id);
const byMode = m => mine.filter(r => (r.meta||{}).mode === m).length;
console.log(mine.map(r => r.titolo + '/' + (r.meta||{}).mode).join(' | '));
ok(byMode('giovani') <= 5 && byMode('staff') === 1, 'niente copie a catena (al massimo 4 già presenti + 1 dalla separazione) e le copie dell’utente non si cancellano da sole (' + byMode('giovani') + '/' + byMode('staff') + ')');
const cur = await ev(() => ({mode: MODE, id: CL.ctx && CL.ctx.id}));
const nav0 = []; P.on('framenavigated', f => { if(f === P.mainFrame()) nav0.push(1); });
await ev(() => clOpen()); await sleep(6000);
ok(nav0.length === 0, 'aprendo l’archivio la pagina non si ricarica');
ok(!pa.errors.length, 'nessun errore ' + pa.errors.slice(0,2).join('|'));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
