import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:700}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
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

await P.setViewportSize({width:1280, height:800});
await P.click('.sh-seg button:has-text("Il mio anno")'); await sleep(3000);
await ev(() => {
  window._log = []; const L = (w, extra) => window._log.push({t: Math.round(performance.now()), w, y: Math.round(scrollY), extra});
  const st = window.scrollTo.bind(window); window.scrollTo = function(){ L('scrollTo(' + [].slice.call(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(',') + ')', new Error().stack.split('\n').slice(2, 5).map(x => x.trim().slice(0, 90)).join(' < ')); return st.apply(null, arguments); };
  window.addEventListener('scroll', () => L('scroll'), {passive:true});
  const t = document.getElementById('an-year'); if(t) new MutationObserver(m => L('mut an-year ' + m.length + ' h=' + t.offsetHeight + ' docH=' + document.documentElement.scrollHeight)).observe(t, {childList:true, subtree:false});
  ['annoRe','shDash','visRe','calRe','shSync','annoLoad'].forEach(n => { const f = window[n]; if(typeof f === 'function'){ window[n] = function(){ L('CALL ' + n); return f.apply(this, arguments); }; } });
});
await ev(() => { const d = document.getElementById('panel-dash'); new MutationObserver(m => window._log.push({t: Math.round(performance.now()), w:'DASH-REPLACED', y:Math.round(scrollY), extra:'docH=' + document.documentElement.scrollHeight})).observe(d, {childList:true}); });
const H = await ev(() => document.documentElement.scrollHeight); console.log('docH', H);
await P.mouse.move(640, 400);
for(let i = 0; i < 14; i++){ await P.mouse.wheel(0, 140); await sleep(450); }
await sleep(6000);
const log = await ev(() => window._log);
const ys = log.filter(x => x.w === 'scroll').map(x => x.y);
console.log('max y', Math.max(...ys), 'final', ys[ys.length - 1]);
log.filter(x => x.w !== 'scroll').forEach(x => console.log(x.t, x.y, x.w, x.extra || ''));
let prev = 0, jumps = 0; ys.forEach(y => { if(prev - y > 300) jumps++; prev = y; });
const rep = log.filter(x => x.w === 'DASH-REPLACED').length;
ok(rep === 0, 'la dashboard non viene rimpiazzata di continuo mentre si legge (rimpiazzi: ' + rep + ')');
ok(Math.max(...ys) >= H - 800 - 5, 'si arriva in fondo alla pagina senza essere tagliati (max ' + Math.max(...ys) + ' su ' + (H - 800) + ')');
ok(jumps === 0, 'la pagina non risale da sola (salti verso l’alto: ' + jumps + ')');
process.exit(summary() ? 1 : 0);
