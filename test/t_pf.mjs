// Momenti formativi: esempio, calendario («Da collocare»), eventi e scelta dal percorso formativo
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const errs = []; P.on('pageerror', e => errs.push(String(e.message || e)));
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3500);
const st = await ev(() => { const U = scheda.uscite || {}; const pf = scheda.pf || []; return pf.map(x => { let n = 0, where = ''; Object.values(U).forEach(u => Object.values(u.prog || {}).forEach(m => { if(m && m.pfId === x.id && !m.del){ n++; where = u.testo; } })); return {nome:x.nome, ev:x.ev, n, where}; }); });
console.log(JSON.stringify(st));
ok(st.length >= 4 && st.every(x => x.n === 1), 'esempio: ogni attività del percorso formativo è anche un momento dentro il suo evento: ' + st.map(x => x.n).join(','));
await ev(() => shCal()); await sleep(800);
let t = await ev(() => document.getElementById('panel-pp').innerText);
ok(/Momento formativo/i.test(t) && /Tela dell.accordo di squadra/.test(t), 'calendario: gli eventi dello staff mostrano i momenti formativi che contengono');
// un momento senza evento compare in «Da collocare»
await ev(() => { scheda.pf.push({id:'ftest1', nome:'Termometro dello staff (prova)', cat:'x', sit:'', ev:'', lancio:'a', sviluppo:'b', conclusione:'c'}); shCal(); }); await sleep(600);
t = await ev(() => document.querySelector('.cal-pool').innerText);
ok(/Per lo staff/i.test(t) && /Termometro dello staff \(prova\)/.test(t), 'Da collocare: il momento formativo non collocato compare nella sezione «Per lo staff»');
const nOpt = await ev(() => document.querySelectorAll('.cal-pool .cal-b[style*="7a3f8f"] select option').length); ok(nOpt >= 2, 'il momento ha il menù «Metti in…» con gli eventi dello staff: ' + nOpt);
// lo metto in un evento dello staff
const evId = await ev(() => Object.values(scheda.uscite).find(u => u.dest === 'staff' && !u.del).id);
await ev(id => { const s = document.querySelector('.cal-pool .cal-b[style*="7a3f8f"] select'); s.value = id; calPfSel(s, 'ftest1'); }, evId); await sleep(900);
const placed = await ev(id => { let n = 0; Object.values(scheda.uscite[id].prog).forEach(m => { if(m && m.pfId === 'ftest1' && !m.del) n++; }); return {n, ev:scheda.pf.find(x => x.id === 'ftest1').ev}; }, evId);
ok(placed.n === 1 && placed.ev === evId, 'messo in un evento: il momento nasce dentro l’evento e il percorso lo sa: ' + JSON.stringify(placed));
t = await ev(() => document.querySelector('.cal-pool').innerText); ok(!/Termometro dello staff \(prova\)/.test(t), 'e sparisce da «Da collocare»');
// filtro
await ev(() => { scheda.pf.push({id:'ftest2', nome:'Altra attività (prova)', ev:''}); shCal(); }); await sleep(500);
const nE = await ev(() => document.querySelectorAll('.cal-pool .cal-b:not([style*="7a3f8f"])').length);
const flt = await ev(() => !!document.querySelector('.cal-pf')); ok(flt === (nE > 0), 'il filtro compare solo se ci sono sia attività dei percorsi sia momenti formativi da collocare: ' + flt + ' / ' + nE + ' attività dei percorsi');
await ev(() => calPoolF('for')); await sleep(300); t = await ev(() => document.querySelector('.cal-pool').innerText); ok(/Altra attività \(prova\)/.test(t) && !/Per l.Unità/.test(t), 'filtro «Percorso formativo»: solo i momenti formativi');
// dentro l'evento: scegliere dal percorso formativo
await ev(id => { shSrUsc(id); }, evId); await sleep(1500);
const sel0 = await ev(id => { const u = uscCur(); const k = 'mtest'; u.prog[k] = {k:'mf', tipo:'mom', g:1, ord:99, dur:30, t:'Momento formativo', f:USC_BT.mf[2].slice(), cr:Date.now()}; return typeof uscMfPfOpts === 'function' ? uscMfPfOpts().length : -1; }, evId);
const r2 = await ev(() => { const html = uscMfHTML('mtest', uscCur().prog.mtest, true); return /Usa un’attività del tuo percorso formativo/.test(html) && /Altra attività \(prova\)/.test(html); });
ok(r2, 'nell’evento, nel momento formativo c’è la scelta dal percorso formativo');
await ev(() => uscMfFromPf('mtest', 'ftest2')); await sleep(500);
const r3 = await ev(id => { const u = scheda.uscite[id]; const m = u.prog.mtest; return {t:m.t, pf:m.pfId, ev:scheda.pf.find(x => x.id === 'ftest2').ev === id, n:Object.values(u.prog).filter(q => q && q.pfId === 'ftest2' && !q.del).length}; }, evId);
ok(r3.t === 'Altra attività (prova)' && r3.pf === 'ftest2' && r3.ev && r3.n === 1, 'scelta dal percorso: il momento diventa quell’attività, una sola volta: ' + JSON.stringify(r3));
ok(errs.length === 0, 'nessun errore di pagina: ' + errs.slice(0, 2).join(' | '));
summary(); process.exit(0);
