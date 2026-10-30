import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:1000}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d, done) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:done ? 'bene' : '', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const us = (id, t, m, d, dest) => Object.assign({id, cr:1, testo:t, modello:m, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}, dest ? {dest} : {});
const row = (id, titolo, data, ts) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto'}, data), created_at:ts, updated_at:ts});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
const U = {}; ['2026-10-06','2026-10-13','2026-10-20','2026-10-27','2026-11-03','2026-11-10','2026-11-17','2026-11-24'].forEach((d,i)=>U['r'+i]=us('r'+i,'Riunione '+(i+1),'sede',d));
U.s1 = us('s1','Uscita','giorno','2026-11-15'); U.b1 = us('b1','Bivacco','bivacco','2026-12-06'); U.st1 = us('st1','Staff','sede','2026-11-19','staff'); U.c1 = us('c1','Campo','campo','2027-07-12'); U.s2 = us('s2','Uscita 2','giorno','2027-02-20');
db.t.pee_archivi.push(row('c1', 'Programmazione Annuale 2026-27 · Reparto', {obs:{P1:4, P2:6, C1:3}, pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'}, riobs:{P1:7}, uscite:U,
  priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')], pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}]},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-10-03', true), att('Gioco B', '2026-10-17', true), att('Gioco C', '2026-10-24', false), att('Gioco D', '2026-11-14', false), att('Gioco E', '2026-12-05', false), att('Senza data', '', false)]},
  {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Cerchio', '2026-10-10', true), att('Patto', '2026-11-07', false), att('Verifica', '2026-12-12', false)]},
  {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', '2026-11-28', false), att('Silenzio', '2026-12-04', false)]}]}}, '2026-10-20T10:00:00Z'));
db.t.pee_archivi.push(row('c2', 'Programmazione Annuale 2026-27 · Reparto · II trimestre', {pris:{P2:true, C2:true, S2:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'II trimestre', dal:'2027-01', al:'2027-03'}, cicloDa:'c1',
  priorita:[pri('P', 'P2', '2027-01', '2027-03'), pri('C', 'C2', '2027-01', '2027-03'), pri('S', 'S2', '2027-02', '2027-03')], pp:{sezione:'Pesaro', gruppo:'1'},
  percorsiExtra:[{prioritaIdx:0, percorsoId:'P2', ambito:'P', attivita:[att('Caccia al tesoro', '2027-01-18', false), att('Giro', '2027-02-13', false)]}]}}, '2026-10-21T10:00:00Z'));
await loginAs(P, base, u); await sleep(1200); P.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(2500);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(3000);

// ── 1 · Il mio anno: cifre, segni per stato, «oggi», nessuna sovrapposizione
await P.click('.sh-seg button:has-text("Il mio anno")'); await sleep(2500);
const A = () => ev(() => { const q = s => document.querySelectorAll('#an-year ' + s).length; const sum = [...document.querySelectorAll('#an-year .vis-sum b')].map(b => b.textContent).join(',');
  const r = [...document.querySelectorAll('#an-year .vis-mk')].map(e => e.getBoundingClientRect()); let ov = 0; for(let i = 0; i < r.length; i++) for(let j = i + 1; j < r.length; j++){ const a = r[i], b = r[j]; if(a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) ov++; }
  return {sum, ok:q('.vis-at.st-ok'), ver:q('.vis-at.st-ver'), fare:q('.vis-at.st-fare'), td:q('.vis-td'), tdl:q('.vis-tdl'), ev:q('.vis-ev'), grp:q('.vis-grp'), stf:q('.vis-ev.stf'), av:q('.vis-bar.av'), f:q('.vis-bar.av .f'), pg:q('.vis-pg'), n:r.length, ov, aria:[...document.querySelectorAll('#an-year .vis-mk')].every(e => e.getAttribute('aria-label') && e.tabIndex === 0)}; });
let a = await A();
ok(a.sum === '3,1,8,1', 'cifre in alto: vissute e verificate 3, da verificare 1, in programma 8, senza data 1 (' + a.sum + ')');
ok(a.ok === 3 && a.ver === 1 && a.fare === 8, 'segni delle attività per stato: ' + a.ok + ' verificate, ' + a.ver + ' da verificare, ' + a.fare + ' in programma');
ok(a.av === 6 && a.f === 6 && a.pg === 6, 'barre con avanzamento e barra «attività vissute» per percorso (' + a.av + '/' + a.pg + ')');
ok(a.td >= 7 && a.tdl === 1, 'linea «oggi» su ogni riga e etichetta in testa (' + a.td + ',' + a.tdl + ')');
ok(a.ev === 7 && a.grp === 2 && a.stf === 1, 'riunioni e uscite: 7 segni (5 singoli e 2 raggruppati) col numero, 1 dello staff (' + a.ev + ',' + a.grp + ',' + a.stf + ')');
ok(a.ov === 0 && a.aria, 'nessun segno ne copre un altro (1280 px) e tutti hanno nome e tastiera (' + a.ov + ')');
const gr = await ev(() => [...document.querySelectorAll('#an-year .vis-grp')].map(e => e.getAttribute('aria-label')).join(' | '));
ok(/4 riunioni/.test(gr) && /6 ott/.test(gr), 'il segno raggruppato elenca le date (' + gr.slice(0, 80) + ')');
const st = await ev(() => { const g = [...document.querySelectorAll('#an-year .vis-grp')].map(e => e.querySelector('svg').getAttribute('fill')); return g; });
ok(st[0] !== '#fff' && st[1] === '#fff', 'riunioni passate piene, future vuote (' + st.join() + ')');
// ── 2 · tablet: righe con il nome sopra, segni ancora separati
for(const w of [1024, 834, 768]){ await P.setViewportSize({width:w, height:1000}); await sleep(500); a = await A();
  const lay = await ev(() => { const r = document.querySelector('#an-year .vis-r:not(.vis-rh)'); const l = r.querySelector('.vis-l').getBoundingClientRect(), t = r.querySelector('.vis-t').getBoundingClientRect(); const w = document.querySelector('#an-year .vis-wrap').getBoundingClientRect(); return {stack: t.top >= l.bottom - 2, tw: Math.round(t.width), ww: Math.round(w.width), over: document.documentElement.scrollWidth > innerWidth + 1}; });
  ok(a.ov === 0 && !lay.over, w + ' px: segni separati, nessuno scorrimento orizzontale (track ' + lay.tw + ' px, ' + (lay.stack ? 'nome sopra' : 'nome a fianco') + ')');
  if(w <= 960) ok(lay.stack && lay.tw >= 560, w + ' px: il nome sta sopra e la linea usa tutta la larghezza (' + lay.tw + ')'); }
await P.setViewportSize({width:1280, height:1000}); await sleep(400);
// ── 3 · letture «Attività per attività», «Per ciclo», colore per stato
await P.click('.vis-opt .sh-seg >> nth=0 >> button:has-text("Attività per attività")'); await sleep(300);
let b = await ev(() => ({dl: document.querySelectorAll('#an-year .vis-dl').length, tr: document.querySelectorAll('#an-year .vis-lst tbody tr').length}));
ok(b.dl === 12 && b.tr === 12, 'attività per attività: 12 segni e 12 righe in tabella (' + b.dl + '/' + b.tr + ')');
await P.click('.vis-opt .sh-seg >> nth=0 >> button:has-text("Per ciclo")'); await sleep(300);
b = await ev(() => ({sub: document.querySelectorAll('#an-year .vis-sub').length, mk: document.querySelectorAll('#an-year .vis-sub .vis-mk').length}));
ok(b.sub === 6 && b.mk === 12, 'per ciclo: 6 percorsi e 12 segni (' + b.sub + '/' + b.mk + ')');
await P.click('.vis-opt .sh-seg >> nth=1 >> button:has-text("Stato")'); await sleep(300);
ok(await ev(() => /Verificata/.test(document.querySelector('#an-year .vis-leg').textContent) && /vissuta e verificata/.test(document.querySelector('#an-year .vis-leg2').textContent)), 'legenda: stati con parole e simboli');
// ── 4 · Visione d'insieme del ciclo: trascinamento e pulsanti ancora in funzione
await ev(() => shVis()); await sleep(1000);
const v = await ev(() => ({bars: document.querySelectorAll('#panel-pp .vis-bar.av.mv').length, mk: document.querySelectorAll('#panel-pp .vis-at').length, oc: document.querySelectorAll('#panel-pp .vis-oc').length, grp: document.querySelectorAll('#panel-pp .vis-grp').length, td: document.querySelectorAll('#panel-pp .vis-td').length}));
ok(v.bars === 3 && v.mk === 10 && v.grp === 2, 'Visione d’insieme: 3 barre spostabili, 10 segni di attività, 2 raggruppamenti (' + JSON.stringify(v) + ')');
const bw0 = await ev(() => document.querySelector('#panel-pp .vis-bar').style.left);
await P.click('#panel-pp .vis-r >> nth=1 >> button:has-text("un mese ▶")'); await sleep(500);
ok(await ev(() => document.querySelector('#panel-pp .vis-bar').style.left) !== bw0, 'il pulsante «un mese ▶» sposta ancora la barra');
await P.screenshot({path:'/home/claude/studio/k1_vis.png', fullPage:true});
// ── 5 · soglia dello staff
const sx = await ev(() => { STAFF_MEMBERS = ['Ada', 'Bruno']; staffObs = {Ada:{P6:8, C2:7}, Bruno:{P6:9, C2:6}}; const r = uscStaffPrioX(); staffObs = {Ada:{C2:2, P6:8, S3:4}, Bruno:{C2:3, P6:9, S3:5}}; const r2 = uscStaffPrioX(); staffObs = {}; const r3 = uscStaffPrioX();
  staffObs = {Ada:{}}; const o = {}; for(let i = 1; i <= 9; i++) o['P' + i] = 3; staffObs = {Ada:o}; const r4 = uscStaffPrioX(); return {fb:r.fb, ids:r.L.map(p => p.id).join(), fb2:r2.fb, ids2:r2.L.map(p => p.id).join(), n3:r3.L.length, fb3:r3.fb, n4:r4.L.length}; });
ok(sx.fb && sx.ids === 'C2,P6', 'nessuna area ≤ 5: le due più basse, segnalate (' + sx.ids + ')');
ok(!sx.fb2 && sx.ids2 === 'C2,S3', 'aree ≤ 5: solo quelle, la più fragile prima (' + sx.ids2 + ')');
ok(sx.n3 === 0 && !sx.fb3 && sx.n4 === 6, 'senza osservazione nessun suggerimento; con molte aree basse al massimo sei (' + sx.n3 + ',' + sx.n4 + ')');
const sh = await ev(() => { STAFF_MEMBERS = ['Ada', 'Bruno']; staffObs = {Ada:{P6:8, C2:7}, Bruno:{P6:9, C2:6}}; scheda.uscite = scheda.uscite || {}; scheda.uscite.stx = {id:'stx', testo:'Riunione staff', modello:'sede', dest:'staff', ax:{data:'2026-12-01', durata:'giorno'}, prog:{}, hid:{}, own:{}}; USC_CUR = 'stx'; const h = uscObjHTML('k1', {k:'nuova', obj:{}}, true); USC_CUR = null; return {hint:/le due più basse/.test(h), altro:/oppure un altro percorso PEE/.test(h), chips:(h.match(/class="ax-chip/g) || []).length, sel:/<select/.test(h)}; });
ok(sh.hint && sh.altro && sh.sel && sh.chips >= 2, 'evento dello staff: avviso «le due più basse», scelta di un altro percorso (' + JSON.stringify(sh) + ')');
process.exit(summary() ? 1 : 0);
