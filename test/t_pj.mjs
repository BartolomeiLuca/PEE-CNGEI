// Unità e staff: progetti distinti
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const B = db.addUser('bruno@x.it', 'password123', 'Bruno Verdi');
const br = await launch(engine); const ev = (p, f, a) => p.evaluate(f, a);
const toMode = async (P, m) => { await ev(P, m => { confirmBackToLanding(); selectMode(m); if(m === 'staff'){ try{ selectRuolo('CU'); }catch(e){} STAFF_RUOLO = STAFF_RUOLO || 'CU'; } startTool(); }, m); await sleep(3500); };
const pa = await person(br, db), P = pa.page;
await loginAs(P, base, A); await ev(P, () => exStart()); await sleep(3000);
const ex = db.t.pee_archivi.find(r => /Esempio/.test(r.titolo));
const exObs = JSON.stringify(ex.data.obs);
// 1. dall'esempio (Unità) scelgo «Il mio staff»
await toMode(P, 'staff');
const st = db.t.pee_archivi.filter(r => r.user_id === A.id && r.meta && r.meta.mode === 'staff');
ok(st.length === 1 && /^Staff \d{4}$/.test(st[0].titolo), 'nuovo progetto staff: ' + st.map(r => r.titolo));
const cur = await ev(P, () => ({mode: MODE, id: CL.ctx && CL.ctx.id, main: document.getElementById('main-app').style.display}));
ok(cur.mode === 'staff' && cur.id === (st[0]||{}).id && cur.main === 'block', 'si apre il progetto staff ' + JSON.stringify(cur));
const ex2 = db.t.pee_archivi.find(r => r.id === ex.id);
ok(ex2.data.MODE === 'giovani' && JSON.stringify(ex2.data.obs) === exObs, 'il progetto dell’Unità resta com’era');
// lavoro sullo staff: un membro
await ev(P, () => { STAFF_MEMBERS.push({id:'m1', nome:'Paolo'}); _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(3000);
// 2. torno all'Unità: riapre l'esempio, non ne crea un altro
await toMode(P, 'giovani');
const cur2 = await ev(P, () => ({mode: MODE, id: CL.ctx && CL.ctx.id, staff: STAFF_MEMBERS.length}));
ok(cur2.mode === 'giovani' && cur2.id === ex.id && cur2.staff === 0, 'tornando all’Unità si riapre il suo progetto ' + JSON.stringify(cur2));
ok(db.t.pee_archivi.filter(r => r.user_id === A.id && r.meta && r.meta.mode === 'staff').length === 1, 'sempre un solo progetto staff per anno');
const stD = db.t.pee_archivi.find(r => r.id === st[0].id).data;
ok((stD.STAFF_MEMBERS||[]).length === 1 && !Object.values(stD.obs||{}).some(v => v && v !== 'n'), 'il progetto staff ha solo lo staff');
// 3. archivio: etichette distinte
await ev(P, () => clOpen()); await sleep(1500);
const tags = await ev(P, () => [...document.querySelectorAll('#cl-arclist .cl-row')].map(r => (r.querySelector('.cl-type')||{}).textContent + ':' + r.querySelector('.t').textContent.slice(0, 40)));
ok(tags.some(t => /^Reparto:/.test(t)) && tags.some(t => /^Staff:/.test(t)), 'archivio: etichette Unità e Staff ' + JSON.stringify(tags));
await ev(P, () => clClose());
// 4. progetto misto già esistente → separato in automatico
const mix = db.t.pee_archivi.find(r => r.id === ex.id);
const misto = JSON.parse(JSON.stringify(mix.data)); misto.STAFF_MEMBERS = [{id:'x', nome:'Lia'}]; misto.staffObs = {x:{P1:5}};
const C = db.addUser('carla@x.it', 'password123', 'Carla Neri');
const pc = await person(br, db); 
const row = {id:'misto1', user_id:C.id, anno:2026, titolo:'PEE 2026', data:misto, meta:{mode:'giovani', staff:1}, updated_at:new Date().toISOString()};
db.t.pee_archivi.push(row);
await loginAs(pc.page, base, C); await sleep(1000);
await ev(pc.page, () => clOpenProject('misto1')); await sleep(7000);
const cRows = db.t.pee_archivi.filter(r => r.user_id === C.id);
const sR = cRows.find(r => r.meta && r.meta.mode === 'staff'), uR = cRows.find(r => r.id === 'misto1');
ok(sR && (sR.data.STAFF_MEMBERS||[]).length === 1 && uR && !(uR.data.STAFF_MEMBERS||[]).length && Object.values(uR.data.obs||{}).some(v => v && v !== 'n'), 'progetto misto separato: ' + cRows.map(r => r.titolo + '/' + (r.meta||{}).mode));
// 5. collaboratore: avvia lo staff nel proprio archivio
const pb = await person(br, db); await loginAs(pb.page, base, B); await sleep(800);
db.t.pee_membri.push({id:'mm1', archivio_id:ex.id, email:'bruno@x.it', owner_email:'Anna Rossi (anna@x.it)', ruolo:'collaboratore', created_at:new Date().toISOString(), visto_il:new Date().toISOString()});
await ev(pb.page, id => clOpenShared(id), ex.id); await sleep(3500);
ok(await ev(pb.page, () => CL.ctx && CL.ctx.ruolo === 'collaboratore'), 'Bruno nel progetto di Anna come collaboratore');
await toMode(pb.page, 'staff');
const bS = db.t.pee_archivi.filter(r => r.user_id === B.id && r.meta && r.meta.mode === 'staff');
ok(bS.length === 1 && await ev(pb.page, () => !CL.ctx.ruolo && MODE === 'staff'), 'il collaboratore apre lo staff nel suo archivio');
ok(db.t.pee_archivi.find(r => r.id === ex.id).data.MODE === 'giovani', 'il progetto di Anna non cambia tipo');
// 6. senza account: due spazi sul dispositivo
const pn = await person(br, db), N = pn.page;
await N.goto(base); await ev(N, () => localStorage.setItem('bussola_tour_v3', '1')); await N.reload(); await sleep(800);
await ev(N, () => { selectMode('giovani'); FASCIA = 'E'; startTool(); obs.P1 = 7; saveData(true); }); await sleep(300);
await toMode(N, 'staff');
ok(await ev(N, () => MODE === 'staff' && !Object.values(obs).some(v => v && v !== 'n')), 'senza account: lo staff parte vuoto');
await toMode(N, 'giovani');
ok(await ev(N, () => MODE === 'giovani' && obs.P1 === 7), 'senza account: tornando all’Unità ritrovo il lavoro');
const errs = [pa, pb, pc, pn].flatMap(x => x.errors); ok(!errs.length, 'nessun errore ' + errs.slice(0, 2).join('|'));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
