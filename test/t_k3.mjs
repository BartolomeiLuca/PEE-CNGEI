import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
let _n = 0; const att = (t, d, done) => ({aid:'z' + (++_n), testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:done ? 'bene' : '', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined});
const us = (id, t, m, d, dest) => Object.assign({id, cr:1, testo:t, modello:m, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}, dest ? {dest} : {});
const row = (id, titolo, data, ts) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto'}, data), created_at:ts, updated_at:ts});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
const U = {}; ['2026-10-06','2026-10-13','2026-10-20','2026-10-27','2026-11-03','2026-11-10','2026-11-17','2026-11-24'].forEach((d,i)=>U['r'+i]=us('r'+i,'Riunione '+(i+1),'sede',d));
U.s1 = us('s1','Uscita','giorno','2026-11-15'); U.s1.prog = {b1:{k:'att', aid:'z4', pid:'P1', g:1, ord:1, dur:60}}; U.b1 = us('b1','Bivacco','bivacco','2026-12-06'); U.st1 = us('st1','Staff','sede','2026-11-19','staff'); U.c1 = us('c1','Campo','campo','2027-07-12'); U.s2 = us('s2','Uscita 2','giorno','2027-02-20');
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

const sn = () => db.t.pee_versioni.length;
// 1 · accordion rinominato e «Sposta» fuori, subito sotto
const h = await ev(() => { const per = getAllPercorsi()[0]; return attObjHTML(0, 0, per.attivita[0]); });
ok(/Indicatori specifici di questa attività/.test(h) && !/Obiettivi e Indicatori di questa attività/.test(h), 'titolo: «Indicatori specifici di questa attività»');
ok(h.indexOf('att-mvb') > h.indexOf('</details>') && h.indexOf('<details') < h.indexOf('</details>') && /attMoveAsk\(0,0\)/.test(h), '«Sposta» vive da solo, subito sotto gli indicatori specifici');
// 1b · solo Indicatori: tutti quelli del percorso, i già scelti per primi e in evidenza, spuntabili
const ind = await ev(() => { const per = getAllPercorsi()[0]; const P = Object.values(DB).flat().find(q => q.id === per.percorsoId); const d = document.createElement('div'); d.innerHTML = attObjHTML(0, 0, per.attivita[0]);
  const labs = [...d.querySelectorAll('label.usc-objl')]; return {tot: P.idr.length, n: labs.length, on: labs.filter(l => l.classList.contains('att-ind-on')).length, firstOn: labs[0] && labs[0].classList.contains('att-ind-on'), onFirst: labs.every((l, i, A) => !l.classList.contains('att-ind-on') || A.slice(0, i).every(x => x.classList.contains('att-ind-on'))), sub: [...d.querySelectorAll('.ax-sub')].map(x => x.textContent), kinds: [...new Set(labs.map(l => /'(\w)'/.exec(l.querySelector('input').getAttribute('onchange'))[1]))], chosen: (scheda.priorita[per.prioritaIdx].idr || []).length}; });
ok(ind.n === ind.tot && ind.kinds.length === 1 && ind.kinds[0] === 'i' && !ind.sub.some(x => /^Obiettivi$/.test(x)), 'elenco: tutti gli Indicatori del percorso (' + ind.n + ' su ' + ind.tot + '), nessun obiettivo (' + JSON.stringify(ind.sub) + ')');
ok(ind.on === ind.chosen && ind.firstOn && ind.onFirst && ind.sub.includes('Scelti per il percorso'), 'quelli già scelti per il percorso stanno per primi, evidenziati (' + ind.on + ')');
const t1 = await ev(() => { const per = getAllPercorsi()[0]; const a = per.attivita[0]; const pr = scheda.priorita[per.prioritaIdx]; a.obj = a.obj || {o: [], i: []}; a.obj.o = [1]; const before = pr.idr.slice(); const nw = [0, 1, 2, 3, 4, 5].find(k => !pr.idr.includes(k));
  attObjTog(0, 0, 'i', nw, true); const added = pr.idr.includes(nw) && a.obj.i.includes(nw); const inPage = (document.querySelector('#pc-card-0') || document.body) && true; const X = uscPercObj(per).i.map(o => o.k).includes(nw);
  attObjTog(0, 0, 'i', nw, false); const gone = !pr.idr.includes(nw) && !a.obj.i.includes(nw); return {nw, added, X, gone, keepO: a.obj.o.join(','), same: JSON.stringify(before) === JSON.stringify(pr.idr)}; });
ok(t1.added && t1.X, 'spuntare un Indicatore non ancora scelto lo aggiunge a «Obiettivi e indicatori» e alla scheda del percorso (' + JSON.stringify(t1) + ')');
ok(t1.gone && t1.same && t1.keepO === '1', 'toglierlo dall’unica attività lo toglie dal percorso; i dati degli obiettivi dell’attività non si perdono');
const t2 = await ev(() => { const per = getAllPercorsi()[0]; const a = per.attivita[0]; const pr = scheda.priorita[per.prioritaIdx]; const k = pr.idr[0];
  attObjTog(0, 0, 'i', k, true); attObjTog(0, 0, 'i', k, false); return {k, still: pr.idr.includes(k)}; });
ok(t2.still, 'un Indicatore scelto da te in «Obiettivi e indicatori» resta anche se lo spunti e lo togli da un’attività (' + JSON.stringify(t2) + ')');
// 2 · data dal Calendario
const tl = await ev(() => tlHTML(0));
ok(/dal Calendario/.test(tl) && /Cambia nel Calendario/.test(tl), 'l’attività messa nel Calendario mostra la data «dal Calendario» (non modificabile a mano)');
const nIn = (tl.match(/class="tl-date"/g) || []).length; ok(nIn === 5, 'le altre attività, senza evento, hanno ancora la data provvisoria modificabile (' + nIn + ')');
// 3 · griglia vicino al Word
await ev(() => gGo('1b')); await sleep(800);
const gd = await ev(() => ({b:getComputedStyle(document.getElementById('gr-dl-btn2')).display, w:getComputedStyle(document.getElementById('g-dl')).display, act:!!document.querySelector('#g-subnav .gsn-act'), same:document.getElementById('gr-dl-btn2').parentElement.id}));
ok(gd.b !== 'none' && gd.w !== 'none' && !gd.act && gd.same === 'g-dl', '«Scarica griglia» è accanto a «Scarica la Scheda (Word)» e non più sopra il titolo (' + JSON.stringify(gd) + ')');
// 4 · il modale
await ev(() => shOpen('c1', 0)).catch(() => {}); await sleep(2500);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
await ev(() => attMoveAsk(0, 0)); await sleep(1500);
const md = await ev(() => ({c:[...document.querySelectorAll('#amv-c option')].map(o => o.textContent), p:[...document.querySelectorAll('#amv-p optgroup')].map(g => g.label)}));
ok(md.c.length === 2 && /Questo ciclo/.test(md.c[0]) && /II trimestre/.test(md.c[1]), 'il modale propone questo ciclo e gli altri cicli dell’anno (' + md.c.join(' | ') + ')');
ok(md.p.some(l => /Percorsi di questo ciclo/.test(l)) && md.p.some(l => /Aggiungi un altro percorso PEE · Spirituale/.test(l)), 'percorsi del ciclo e «Aggiungi un altro percorso PEE» per ambito');
await ev(() => { document.getElementById('amv-c').value = document.querySelectorAll('#amv-c option')[1].value; amvFill(); }); await sleep(300);
const md2 = await ev(() => [...document.querySelectorAll('#amv-p optgroup')].map(g => g.label + ':' + g.querySelectorAll('option').length).join(' | '));
ok(/Percorsi di quel ciclo:3/.test(md2), 'scelto un altro ciclo, si vedono i percorsi di quel ciclo (' + md2 + ')');
await ev(() => modalClose());
// 5 · spostamento in un altro percorso di questo ciclo (esistente)
let r = await ev(() => { const L = getAllPercorsi(); return {p:L[0].attivita.filter(a => a.testo).length, c:L[1].attivita.filter(a => a.testo).length}; });
await ev(() => attMoveRun(0, 0, '', 'C1')); await sleep(500);
let r2 = await ev(() => { const L = getAllPercorsi(); return {p:L[0].attivita.filter(a => a.testo).length, c:L[1].attivita.filter(a => a.testo).length, last:L[1].attivita[L[1].attivita.length - 1].testo, d:L[1].attivita[L[1].attivita.length - 1].ax.data}; });
ok(r2.p === r.p - 1 && r2.c === r.c + 1 && r2.last === 'Gioco A' && r2.d === '2026-10-03', 'in un altro percorso: l’attività passa con testo e data (' + JSON.stringify(r2) + ')');
// 6 · in un percorso nuovo di questo ciclo
const jb = await ev(() => getAllPercorsi()[0].attivita.findIndex(a => a.testo === 'Gioco B')); await ev((j) => attMoveRun(0, j, '', 'P3'), jb); await sleep(500);
const r3 = await ev(() => { const x = getAllPercorsi().find(q => q.percorsoId === 'P3'); return x ? x.attivita.map(a => a.testo).join() : null; });
ok(r3 === 'Gioco B', 'in un percorso nuovo: il percorso entra nel ciclo con l’attività (' + r3 + ')');
// 7 · in un altro ciclo
const v0 = sn();
const jz = await ev(() => getAllPercorsi()[0].attivita.findIndex(a => a.aid === 'z4'));
const placed0 = await ev((j) => window.attCalPlaced(0, j), jz);
await ev((j) => attMoveRun(0, j, 'c2', 'P2'), jz); await sleep(2500);
const c2 = db.t.pee_archivi.find(x => x.id === 'c2'); const P2 = c2.data.scheda.percorsiExtra.find(q => q.percorsoId === 'P2');
ok(P2 && P2.attivita.some(a => a.testo === 'Gioco D' && a.ax.data === '2026-11-14' && a.spostataDa && a.spostataDa.pid === 'P1'), 'nell’altro ciclo l’attività arriva con testo e data (' + (P2 ? P2.attivita.map(a => a.testo).join() : '-') + ')');
ok(sn() > v0, 'prima di scrivere nell’altro ciclo c’è la copia di sicurezza');
const src = await ev(() => ({n:getAllPercorsi()[0].attivita.some(a => a.testo === 'Gioco D'), del:Object.values(scheda.uscite.s1.prog).every(m => m.del === true)}));
ok(!src.n && src.del && placed0.length === 1, 'qui l’attività non c’è più e l’evento del Calendario non la contiene più');
const kept = await ev(() => getAllPercorsi()[0].attivita.filter(a => a.testo).map(a => a.testo).join());
ok(/Gioco C/.test(kept) && /Gioco E/.test(kept), 'le altre attività del percorso restano (' + kept + ')');
process.exit(summary() ? 1 : 0);
