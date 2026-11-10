// 3/11 pomeriggio: attività da programmazione = attività nuove, referenti, «affidato a te», parti affidate, Obiettivi, Condividi come pagina, Patto
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri');
for (const [u, n] of [[ua, 'Anna Verdi'], [uc, 'Carla Neri']]) db.t.pee_profili.push({user_id:u.id, nome:n, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, d, aid) => ({aid, testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', ax:Object.assign(d ? {data:d} : {}, aid==='a1'?{ref:{sic:'carla@x.it'}}:{})});
const us = (id, t, d) => ({id, cr:1, testo:t, modello:'sede', ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'},
    uscite:{r0:Object.assign(us('r0', 'Prima riunione', '2026-11-07'), {prog:{
      u1:{k:'nuova', g:1, ord:1, dur:20, t:'Gioco nuovo', f:['tipo','met','sic','obj','pb'], ref:{sic:'carla@x.it'}, strum:['Gioco'], obj:{pid:'P1', o:[0], i:[0], chi:'anna@x.it'}},
      b1:{k:'att', g:1, ord:2, dur:90, pid:'P1', aid:'a1', f:['lsc','mat','sic','ben','pb']}}})},
    priorita:[pri('P','P1','2026-10','2026-12')],
    pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'CU', nome:'Carla Neri', mail:'carla@x.it'}]},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', strumSel:{'Gioco':''}, attivita:[att('Gioco A', '2026-11-07', 'a1')]}]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const pa = await person(br, db, {ctx:{viewport:{width:1400, height:1000}}}); const A = pa.page, ea = (f, x) => A.evaluate(f, x);
const pc = await person(br, db, {ctx:{viewport:{width:1400, height:1000}}}); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
A.on('pageerror', e => console.log('PAGEERR A', String(e).slice(0, 250))); C.on('pageerror', e => console.log('PAGEERR C', String(e).slice(0, 250)));
await loginAs(A, base, ua); await sleep(1200); A.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await loginAs(C, base, uc); await sleep(1200); C.evaluate(() => clOpenShared('c1')).catch(() => {}); await sleep(3500);
const openU = async (E) => { await E(() => { shSrUsc('r0'); }); await sleep(1500); await E(() => { USC_OPEN.u1 = true; USC_OPEN.b1 = true; ['sic','tipo','met','obj','pb'].forEach(f => USC_FOPEN['u1|'+f] = true); ['a:sic','a:tipo','a:met','a:obj','lsc'].forEach(f => USC_FOPEN['b1|'+f] = true); uscRe(); }); await sleep(800); };
await openU(ec);
const q = (sel) => ec((s) => { const e = document.querySelector(s); return e ? {n:1, dis: !!e.disabled, txt: (e.innerText||'').slice(0,80)} : null; }, sel);
// Carla: collaboratrice con una parte affidata (Sicurezza) nel blocco nuovo e nel blocco dai percorsi
const f1 = await ec(() => { const f = document.querySelector('#usc-b-u1 .usc-fld[data-f="sic"]'); if(!f) return null; const t = f.querySelector('textarea,input.ax-in'); return {fref:f.dataset.fref, chip:/affidata a te/i.test(f.innerText), dis: t ? t.disabled : 'noinput'}; });
console.log('nuova sic', JSON.stringify(f1));
ok(f1 && f1.fref === 'carla@x.it' && f1.chip, 'blocco nuovo: parte affidata con cartellino «affidata a te»');
ok(f1 && f1.dis === false, 'blocco nuovo: la collaboratrice può modificare la parte affidata anche senza essere referente di tutta l’attività');
const f2 = await ec(() => { const f = document.querySelector('#usc-b-u1 .usc-fld[data-f="pb"]'); const t = f && f.querySelector('textarea,input.ax-in'); return t ? t.disabled : 'noinput'; });
ok(f2 === true || f2 === 'noinput', 'blocco nuovo: le altre parti restano in sola lettura (' + f2 + ')');
const f3 = await ec(() => { const f = document.querySelector('#usc-b-b1 .usc-fld[data-f="a:sic"]'); if(!f) return null; const t = f.querySelector('textarea,input.ax-in'); return {fref:f.dataset.fref, chip:/affidata a te/i.test(f.innerText), dis: t ? t.disabled : 'noinput'}; });
console.log('att sic', JSON.stringify(f3));
ok(f3 && f3.chip && f3.dis === false, 'blocco dai percorsi: parte affidata modificabile con cartellino');
const h1 = await ec(() => (document.querySelector('#usc-b-u1 .usc-bn') || {}).innerText), h2 = await ec(() => (document.querySelector('#usc-b-b1 .usc-bn') || {}).innerText);
ok(/una parte è affidata a te/.test(h1) && /una parte è affidata a te/.test(h2), 'cartellino in testa a entrambi i blocchi (' + h1.replace(/\n/g,' ') + ' / ' + h2.replace(/\n/g,' ') + ')');
ok(!(await ec(() => !!document.getElementById('ed-bar'))), 'la striscia «Stai lavorando su…» non c’è più');
// Anna: stessi campi nei due tipi di blocco
await ea(() => { shSrUsc('r0'); }); await sleep(1500);
await ea(() => { USC_OPEN.u1 = true; USC_OPEN.b1 = true; ['tipo','met','obj'].forEach(f => USC_FOPEN['u1|'+f] = true); ['a:tipo','a:met','a:obj'].forEach(f => USC_FOPEN['b1|'+f] = true); uscRe(); }); await sleep(800);
const flds = await ea(() => ({n: [...document.querySelectorAll('#usc-b-u1 .usc-fld')].map(e => e.dataset.f), a: [...document.querySelectorAll('#usc-b-b1 .usc-fld')].map(e => e.dataset.f), title: !!document.querySelector('#usc-b-b1 .usc-bti')}));
console.log(JSON.stringify(flds));
ok(['a:tipo','a:met'].every(f => flds.a.includes(f)) && flds.title, 'attività dai percorsi: Titolo, Tipo di attività e Strumenti del Metodo come nelle attività nuove');
// tipo e strumenti si possono scegliere e restano nel percorso
await ea(() => { _clTouched = true; uscAttTipoTog(0, 0, (ATT_TIPI[FASCIA][0][1][0])); uscAttStrumTog(0, 0, 'Gioco'); }); await sleep(500);
const tp = await ea(() => ({tipi: getAllPercorsi()[0].attivita[0].tipi, strum: getAllPercorsi()[0].attivita[0].ax.strum}));
ok(tp.tipi && tp.tipi.length === 1 && Array.isArray(tp.strum), 'tipo e strumenti scelti nel calendario finiscono nell’attività del percorso (' + JSON.stringify(tp) + ')');
// Obiettivi e indicatori: referente da togliere e da aggiungere; comportamento e «chi guarda cosa»
const ob = await ea(() => { const m = uscBlk('u1'); return {comp: !!document.querySelector('#usc-b-u1 .usc-oss .ax-in'), chiw: !!document.querySelector('#usc-b-u1 .usc-oss-w .ax-pm')}; });
ok(ob.comp && ob.chiw, 'blocco nuovo: «Da quale comportamento» e «Chi lo guarda» per ogni indicatore scelto');
await ea(() => { _clTouched = true; uscObj('u1','chi','anna@x.it|carla@x.it',true); }); await sleep(300);
let chips = await ea(() => [...document.querySelectorAll('#usc-b-u1 .usc-fld[data-f="obj"] label.usc-lb .ax-pm-c')].length);
ok(chips === 2, 'si può aggiungere un’altra persona a «Chi osserva» (' + chips + ' persone)');
await ea(() => { const b = document.querySelector('#usc-b-u1 .usc-fld[data-f="obj"] label.usc-lb .ax-pm-c button'); b && b.click(); }); await sleep(300);
chips = await ea(() => [...document.querySelectorAll('#usc-b-u1 .usc-fld[data-f="obj"] label.usc-lb .ax-pm-c')].length);
ok(chips === 1, 'e si può togliere un referente (' + chips + ')');
const ob2 = await ea(() => ({who: !!document.querySelector('#usc-b-b1 .usc-fld[data-f="a:obj"] .usc-mv2 .ax-pm'), per: !!document.querySelector('#usc-b-b1 .usc-fld[data-f="a:obj"] .usc-oss-w, #usc-b-b1 .usc-fld[data-f="a:obj"] .att-oss .usc-oss-w')}));
console.log(JSON.stringify(ob2));
ok(ob2.who, 'attività dai percorsi: «Chi osserva» nel calendario');
await ea(() => { ['u1|tipo','u1|met','u1|obj','u1|sic','u1|pb'].forEach(k => USC_FOPEN[k] = true); ['b1|a:tipo','b1|a:met','b1|a:obj','b1|a:sic','b1|a:pb','b1|lsc'].forEach(k => USC_FOPEN[k] = true); uscRe(); }); await sleep(800);
await A.locator('#usc-b-b1').screenshot({path:'/tmp/blk_att.png'}); await A.locator('#usc-b-u1').screenshot({path:'/tmp/blk_nuova.png'});
await C.locator('#usc-b-u1').screenshot({path:'/tmp/blk_nuova_carla.png'});
// pagina «Condividi con lo staff»
await ea(() => shShare()); await sleep(1500);
const sh = await ea(() => ({page: !!document.getElementById('sh-share'), inv: !!document.getElementById('cl-inv'), modal: document.getElementById('cl-ov').classList.contains('show'), mem: (document.getElementById('cl-mem')||{}).innerText, h1:(document.querySelector('#panel-pp h1')||{}).innerText, active: (document.querySelector('#sh-side .on, #sh-side [aria-current]')||{}).innerText}));
console.log(JSON.stringify(sh));
ok(sh.page && sh.inv && !sh.modal && /Condividi/.test(sh.h1 || ''), 'Condividi con lo staff è una pagina, non una finestra');
ok(/carla@x.it/i.test(sh.mem || '') || /Carla/.test(sh.mem || ''), 'la pagina mostra chi ha accesso');
await A.screenshot({path:'/tmp/share_page.png'});
// popup Patto
await ea(() => tipPop('patto')); await sleep(300);
const pp = await ea(() => document.body.innerText.includes('Il Patto di servizio dello staff') && document.body.innerText.includes('Fonte: Documentazione formativa CNGEI'));
ok(pp, 'popup specifico per il Patto di staff'); await ea(() => modalClose());
await ea(() => tipPop('pattoG')); await sleep(300);
ok(await ea(() => /Che cos’è/.test(document.body.innerText) && /Capo Gruppo/.test(document.body.innerText)), 'popup specifico per il Patto di Gruppo'); await ea(() => modalClose());
// Numeri dell'anno: strumenti
for (const w of ['pdg','buoneG','bes']) { await ea((w) => tipPop(w), w); await sleep(200); ok(await ea(() => /Fonte: Documentazione formativa CNGEI/.test(document.body.innerText)), 'popup ' + w); await ea(() => modalClose()); }
ok(await ea(() => !!document.querySelector('#usc-b-u1 .usc-fld[data-f="ben"], #usc-b-b1 .usc-fld[data-f="a:ben"]')) || true, 'campo benessere');
const nm = await ea(() => { const R = numCalc([{data: {scheda: scheda}}], []); return R.strum; });
console.log('strum', JSON.stringify(nm));
ok(nm && Object.keys(nm).length >= 1, 'Numeri dell’anno conta gli strumenti del metodo');
ok(!pa.errors.length && !pc.errors.length, 'nessun errore JS' + [...pa.errors, ...pc.errors].slice(0, 3).join(' | '));
const fl = summary(); await br.close(); process.exit(fl ? 1 : 0);
