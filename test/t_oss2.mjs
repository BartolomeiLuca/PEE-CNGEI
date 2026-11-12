// Attività osservative proprie con più persone: proposte, suggerimenti, avvisi in «Per te», modifiche simultanee, lettrice
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB();
const ua = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), ub = db.addUser('bruno@x.it', 'password123', 'Bruno Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri'), ud = db.addUser('dario@x.it', 'password123', 'Dario Blu');
for(const u of [ua, ub, uc, ud]) db.t.pee_profili.push({user_id:u.id, nome:u.meta.nome, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const staffTab = [{ruolo:'CU', nome:'Anna Rossi', mail:'anna@x.it'}, {ruolo:'VCU', nome:'Bruno Verdi', mail:'bruno@x.it'}, {ruolo:'VCU', nome:'Carla Neri', mail:'carla@x.it'}, {ruolo:'SiS', nome:'Dario Blu', mail:'dario@x.it'}];
const ts = '2026-10-12T09:00:00Z';
db.t.pee_archivi.push({id:'c2', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1', staffTab, condivisa:true}}}, created_at:ts, updated_at:ts});
const mem = (id, em, r) => ({id, archivio_id:'c2', email:em, ruolo:r, owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
db.t.pee_membri.push(mem('m1', 'bruno@x.it', 'collaboratore'), mem('m2', 'carla@x.it', 'lettore'), mem('m3', 'dario@x.it', 'cotitolare'));
const open = async (u, label, shared) => { const p = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); p.page.on('dialog', d => d.accept().catch(() => {})); await loginAs(p.page, base, u); await sleep(2000);
  await p.page.evaluate(() => { try{ if(document.getElementById('cl-ov').classList.contains('show')) clClose(); }catch(e){} });
  await p.page.evaluate(sh => { if(sh) clOpenShared('c2'); else shOpen('c2', 0); }, shared).catch(() => {}); await sleep(3500);
  await p.page.evaluate(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }).catch(() => {}); await sleep(2000);
  await p.page.evaluate(() => { try{ modalClose(); }catch(e){} gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(900); p.label = label; return p; };
const pa = await open(ua, 'Anna'), pb = await open(ub, 'Bruno', 1), pd = await open(ud, 'Dario', 1), pc = await open(uc, 'Carla', 1);
const ev = (p, f, a) => p.page.evaluate(f, a);
const wait = async (p, f, t = 9000) => { try{ await p.page.waitForFunction(f, null, {timeout: t}); return true; }catch(e){ return false; } };
const roles = await Promise.all([pa, pb, pd, pc].map(p => ev(p, () => ossRole())));
ok(JSON.stringify(roles) === '["tit","col","cot","let"]', 'ruoli riconosciuti: ' + roles);
// Bruno: pannello usabile, non bloccato
let s = await ev(pb, () => ({btn: [...document.querySelectorAll('#oss-panel button')].map(b => [b.textContent.trim().slice(0, 30), b.disabled]), vis: !!(document.getElementById('oss-panel-in') || {}).offsetParent}));
ok(s.vis && s.btn.length >= 1 && s.btn.every(b => !b[1]), 'collaboratore: il pannello si vede e i pulsanti non sono bloccati ' + JSON.stringify(s.btn));
// Bruno propone (come farebbe il percorso guidato)
await ev(pb, () => ossSaveFrom({att:{nome:'Il mercato senza capo', main:'C3', also:['C1'], dom:'Chi prende l’iniziativa?', foc:['Osservo l’iniziativa.'], dur:45, lan:'a', svi:'b', con:'c', temi:[]}, optin:false})); await sleep(800);
let a = await ev(pb, () => ossList()[0]);
ok(a && a.stato === 'proposta' && a.aut === 'Bruno Verdi' && a.autMail === 'bruno@x.it', 'collaboratore: salva come «proposta» con il suo nome');
const dest = await ev(pb, () => (scheda.avvisi || []).filter(v => v.tipo === 'oss' && v.az === 'prop').map(v => v.a).sort().join());
ok(/anna@x.it/.test(dest), 'avviso di proposta a chi ha il progetto (' + dest + '; chi collabora non vede l’elenco dei co-titolari, che trovano la proposta nel pannello)');
// arriva ad Anna e a Dario
ok(await wait(pa, () => ossList().length === 1) && await wait(pd, () => ossList().length === 1), 'la proposta arriva in tempo reale a Anna e a Dario');
ok(await wait(pc, () => ossList().length === 1), 'e anche alla lettrice');
// «Per te» di Anna
await ev(pa, () => clPerTe()); await sleep(800);
let pt = await ev(pa, () => (CL.perte || []).filter(x => x.k === 'av' && x.tipo === 'oss').map(x => [x.az, x.da, x.dove]));
ok(pt.length === 1 && pt[0][0] === 'prop' && pt[0][1] === 'Bruno Verdi', '«Per te» di Anna: avviso della proposta ' + JSON.stringify(pt));
ok(await ev(pa, () => /ha proposto un’attività osservativa/.test(clPerTeHTML())), 'il testo dell’avviso è comprensibile');
// Anna: pulsanti
s = await ev(pa, () => [...document.querySelectorAll('.oss-card .oss-aa button')].map(b => b.textContent.trim()));
ok(s.includes('Accetta la proposta') && s.includes('Suggerisci') && !s.includes('Segna come svolta'), 'titolare: «Accetta la proposta», «Suggerisci»: ' + s);
s = await ev(pb, () => [...document.querySelectorAll('.oss-card .oss-aa button')].map(b => b.textContent.trim()));
ok(!s.includes('Accetta la proposta') && !s.includes('Suggerisci') && s.includes('Elimina'), 'collaboratore (autore): niente «Accetta», niente «Suggerisci»: ' + s);
s = await ev(pc, () => ({b: [...document.querySelectorAll('#oss-panel .oss-card button')].map(b => b.textContent.trim()), role: ossRole(), card: document.querySelectorAll('.oss-card').length}));
ok(s.role === 'let' && s.card === 1 && s.b.every(t => t === 'Apri'), 'lettrice: vede l’attività, solo «Apri»: ' + JSON.stringify(s.b));
// Dario (cot) suggerisce a Bruno
await ev(pd, () => { ossSugg(ossList()[0].id); }); await sleep(300);
await ev(pd, () => { document.getElementById('oss-sgt').value = 'Aggiungi un momento finale.'; ossSuggSend(ossList()[0].id); }); await sleep(800);
ok(await wait(pb, () => Object.keys(ossList()[0].sugg || {}).length === 1), 'il suggerimento di Dario arriva a Bruno');
ok(await ev(pb, () => (scheda.avvisi || []).some(v => v.tipo === 'oss' && v.az === 'sugg' && v.a === 'bruno@x.it')), 'avviso di suggerimento per Bruno');
ok(await ev(pb, () => /Aggiungi un momento finale/.test(document.querySelector('.oss-card').textContent)), 'Bruno legge il suggerimento sotto l’attività');
// Anna accetta
await ev(pa, () => ossAccetta(ossList()[0].id)); await sleep(500);
ok(await wait(pb, () => ossList()[0].stato === 'pronta'), 'Anna accetta: per Bruno diventa «pronta»');
ok(await ev(pb, () => (scheda.avvisi || []).some(v => v.tipo === 'oss' && v.az === 'ok' && v.a === 'bruno@x.it')), 'Bruno riceve l’avviso «ha accettato»');
// modifiche simultanee: Anna crea A, Bruno propone B, nello stesso momento
await Promise.all([ev(pa, () => ossSaveFrom({att:{nome:'Notte di stelle', main:'S3', also:[], dom:'', foc:['x'], dur:60, lan:'', svi:'', con:'', temi:[]}})), ev(pb, () => ossSaveFrom({att:{nome:'La mappa dei sogni', main:'S7', also:[], dom:'', foc:['y'], dur:30, lan:'', svi:'', con:'', temi:[]}}))]);
await sleep(300);
const all3 = async p => wait(p, () => ossList().length === 3, 12000);
ok(await all3(pa) && await all3(pb) && await all3(pd) && await all3(pc), 'modifiche simultanee: tutte e tre le attività su tutti i dispositivi');
const names = await ev(pa, () => ossList().map(a => a.nome).sort().join('|'));
ok(names === 'Il mercato senza capo|La mappa dei sogni|Notte di stelle', 'nessuna attività persa: ' + names);
// Dario (cot) segna come svolta quella di Anna
await ev(pd, () => { const a = ossList().find(x => x.nome === 'Notte di stelle'); ossSvolta(a.id); }); await sleep(300);
await ev(pd, () => { document.getElementById('oss-sv-d').value = '2026-11-09'; ossSvoltaOk(ossList().find(x => x.nome === 'Notte di stelle').id); }); await sleep(800);
ok(await wait(pa, () => (scheda.pp.occMan || []).some(r => /Notte di stelle/.test(r.att || ''))), 'Dario segna come svolta: la riga arriva nelle occasioni di Anna');
ok(await wait(pa, () => ossList().find(x => x.nome === 'Notte di stelle').stato === 'svolta'), 'e l’attività risulta svolta anche per Anna');
// collaboratore non può segnare come svolta le sue
s = await ev(pb, () => [...document.querySelectorAll('.oss-card .oss-aa button')].map(b => b.textContent.trim()).filter(t => /svolta|Rimetti/.test(t)));
ok(s.length === 0, 'il collaboratore non vede «Segna come svolta»');
// dati dell'altra persona intatti
ok(await ev(pa, () => !!document.querySelector('#occ-tab') && /Notte di stelle/.test(document.getElementById('occ-tab').textContent)), 'la riga si vede nella tabella di Anna');
for(const p of [pa, pb, pc, pd]) ok(!p.errors.length, p.label + ': nessun errore JS' + (p.errors.length ? ': ' + p.errors.slice(0, 3).join(' | ') : ''));
process.exit(summary() ? 1 : 0);
