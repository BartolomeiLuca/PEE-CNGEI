// giro 10/11: appunti anno precedente, ordine campi attività, referenti multipli, promozione lettore, X pasti, staff, ciclo, Word PP
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:ua.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', dashboard:{}});
const att = (t, d, extra) => Object.assign({aid:'a'+t.replace(/\W/g,''), testo:t, lancio:'L '+t, sviluppo:'S', conclusione:'C', vBene:'', vMigl:'', vAgg:'', ax:d ? {data:d} : undefined}, extra||{});
const us = (id, t, d, extra) => Object.assign({id, cr:1, testo:t, modello:'sede', ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{}, hid:{}, own:{}}, extra||{});
const pri = (a, p) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0,1], tempistica:'', tDal:'2026-10', tAl:'2027-02'});
const staffTab = [{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'VCU', nome:'Carla Neri', mail:'carla@x.it'}, {ruolo:'VCU', nome:'Dario Blu', mail:'dario@x.it'}];
// anno scorso, con una verifica
db.t.pee_archivi.push({id:'old', user_id:ua.id, anno:2025, titolo:'Programmazione Annuale 2025-26 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', scheda:{tipoProgetto:'AN', annoScout:'2025-26', pp:{staffTab}, percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco vecchio', '2025-11-07', {vBene:'Bene davvero', vMigl:'Tempi'})]}], valCompl:{P1:'Obiettivo raggiunto in parte'}}}, created_at:'2025-10-01T09:00:00Z', updated_at:'2025-10-01T09:00:00Z'});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'},
    pp:{sezione:'Pesaro', gruppo:'1', staffTab, condivisa:true},
    uscite:{r0:us('r0', 'Riunione', '2026-11-07', {prog:{b1:{k:'att', g:1, ord:1, dur:60, pid:'P1', aid:'aGiocoA', f:[]}}}), s1:us('s1', 'Riunione di staff', '2026-11-22', {dest:'staff'})},
    priorita:[pri('P','P1'), pri('C','C1'), pri('S','S1')],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', '2026-11-07')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Cerchio', '2026-11-14')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', '2026-11-28')]}]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'lettore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'}, {id:'m2', archivio_id:'c1', email:'dario@x.it', ruolo:'lettore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const pa = await person(br, db, {ctx:{viewport:{width:1400, height:900}}}); const P = pa.page, ev = (f, x) => P.evaluate(f, x);
P.on('dialog', d => d.accept().catch(() => {}));
await loginAs(P, base, ua); await sleep(2500);
ok(await ev(() => { const e = document.getElementById('boot-ld'); return !e || getComputedStyle(e).display === 'none' || e.classList.contains('off'); }), 'la schermata di caricamento sparisce');
await ev(() => shOpen('c1', 0)); await sleep(5000);
ok(await ev(() => { const e = document.getElementById('boot-ld'); return !e || getComputedStyle(e).display === 'none' || e.classList.contains('off'); }), 'dopo l’apertura del progetto la schermata di caricamento sparisce');
// 1. appunti
await ev(() => shDash()); await sleep(1500);
await ev(() => { try{ shGrp('Capire'); }catch(e){} }); await sleep(800);
const hasMenu = await ev(() => ({el: !!document.querySelector('[data-id="a-prev"]'), prev: !!(SH && SH._prev)}));
console.log(JSON.stringify(hasMenu));
ok(hasMenu.el, 'nel menu c’è «Appunti dalla programmazione precedente»');
await ev(() => shPrev('note')); await sleep(1500);
const md = await ev(() => document.body.innerText);
ok(/Bene davvero/.test(md) && /Obiettivo raggiunto in parte/.test(md), 'gli appunti mostrano verifiche e valutazione dell’anno scorso');
await ev(() => modalClose()); await sleep(300);
ok(await ev(() => !/in 1\.1/.test(document.documentElement.innerHTML.replace(/<script[\s\S]*?<\/script>/g,''))), 'nessun «in 1.1» nelle pagine');
// 3. ordine campi attività
await ev(() => shPerc('P')); await sleep(1500);
await ev(() => { const d = document.getElementById('att-0-0'); if(d) d.open = true; }); await sleep(300);
const ord = await ev(() => { const d = document.getElementById('att-0-0'); const t = d.innerText; return [t.indexOf('Strumenti del Metodo di questa attività'), t.indexOf('Tipo di attività'), t.indexOf('Lancio')]; });
ok(ord[0] > 0 && ord[0] < ord[1] && ord[1] < ord[2], 'ordine: Strumenti del Metodo, Tipo di attività, Lancio (' + ord + ')');
// 4. referenti multipli dai percorsi + 7. promozione
await ev(() => affSet(0, 0, 'Carla Neri')); await sleep(1200);
const q1 = await ev(() => ({t: (document.getElementById('cl-ov')||{}).innerText || '', show: document.getElementById('cl-ov').classList.contains('show')}));
ok(q1.show && /Carla Neri/.test(q1.t) && /collaboratore/.test(q1.t), 'affidando a una lettrice chiede di farla collaboratrice');
await ev(() => refInvDone()); await sleep(600);
const sel1 = await ev(() => { const s = document.querySelector('[data-attshare="0-0"] .ax-pm-s'); const o = [...s.options].find(o => /Dario/.test(o.textContent)); s.value = o.value; s.dispatchEvent(new Event('change')); return true; }); await sleep(1200);
const v2 = await ev(() => getAllPercorsi()[0].attivita[0].aff);
ok(/Carla/.test(v2) && /Dario/.test(v2), 'si aggiunge una seconda persona (' + v2 + ')');
const q2 = await ev(() => document.getElementById('cl-ov').innerText);
ok(/Dario/.test(q2) && !/Carla Neri<\/b> vede/.test(q2), 'la domanda arriva per la persona nuova (Dario)');
await ev(() => refInvDone()); await sleep(500);
await ev(() => { const b = [...document.querySelectorAll('[data-attshare="0-0"] .ax-pm-c button')].find(b => /Carla/.test(b.getAttribute('aria-label'))); b.click(); }); await sleep(800);
const v3 = await ev(() => [getAllPercorsi()[0].attivita[0].aff, uscGet('r0').prog.b1.aff, [...document.querySelectorAll('[data-attshare="0-0"] .ax-pm-c')].map(x=>x.innerText).join(',')]);
ok(!/Carla/.test(v3[0]) && /Dario/.test(v3[0]) && !/Carla/.test(v3[1]||'') && !/Carla/.test(v3[2]), 'togliendo Carla sparisce dai percorsi, dal programma dell’uscita e dalla schermata (' + JSON.stringify(v3) + ')');
// 12. ciclo nelle riunioni di staff
await ev(() => { USC_CUR = 's1'; USC_TAB = 1; gGo('usc'); }); await sleep(1200);
ok(await ev(() => !/Ciclo:/.test(document.getElementById('usc-root').innerText)), 'nella riunione di staff non c’è la scelta del ciclo');
await ev(() => { USC_CUR = 'r0'; USC_TAB = 1; gGo('usc'); }); await sleep(1200);
ok(await ev(() => /Ciclo:/.test(document.getElementById('usc-root').innerText)), 'nella riunione dei ragazzi la scelta del ciclo resta');
// 6. X pasti in alto a destra
await ev(() => { uscTab('pasti'); }); await sleep(800);
const xr = await ev(() => { const x = document.querySelector('.usc-modpage .usc-mx'); const h = document.querySelector('.usc-modpage .usc-mph'); if(!x||!h) return null; const a = x.getBoundingClientRect(), b = h.getBoundingClientRect(); return {top:a.top-b.top, right:b.right-a.right}; });
ok(xr && xr.top < 12 && xr.right < 12, 'la X del modulo Pasti è in alto a destra (' + JSON.stringify(xr) + ')');
await P.setViewportSize({width:1180, height:820});
await ev(() => shPerc('P')); await sleep(1200);
await ev(() => { const d=[...document.querySelectorAll('details')].find(d=>/Scegli tra gli strumenti/.test(d.querySelector('summary')?.innerText||'')); if(d){ d.open=true; d.scrollIntoView(); } }); await sleep(500);
await ev(() => { const d=[...document.querySelectorAll('details')].find(d=>/Scegli tra gli strumenti/.test(d.querySelector('summary')?.innerText||'')); window._sd=d; });
await P.locator('details:has(> summary:has-text("Scegli tra gli strumenti"))').first().screenshot({path:'/tmp/g10_strum.png'}).catch(e=>console.log('shot',e.message));
await P.setViewportSize({width:1024, height:1300});
await ev(() => { try{ shSub('1s',''); }catch(e){ console.log(e); } }); await sleep(1500);
await P.screenshot({path:'/tmp/g10_conf.png'});
await P.setViewportSize({width:1280, height:900});
await ev(() => shPerc('P')); await sleep(1000); await ev(() => { const d = document.getElementById('att-0-0'); if(d) d.open = true; const m=document.querySelector('[data-attmet="0-0"] details'); if(m) m.open=true; }); await sleep(300);
const n0 = await ev(() => (getAllPercorsi()[0].attivita[0].ax||{}).strum ? getAllPercorsi()[0].attivita[0].ax.strum.length : 0);
await ev(() => { const cb=[...document.querySelectorAll('[data-attmet="0-0"] input[type=checkbox]')].filter(c=>!c.checked).slice(0,2); cb.forEach(c=>{ c.checked=true; c.dispatchEvent(new Event('change')); }); }); await sleep(300);
const met = await ev(() => ({n:getAllPercorsi()[0].attivita[0].ax.strum.length, open:document.querySelector('[data-attmet="0-0"] details').open, cnt:document.getElementById('att-met-cnt-0-0').textContent}));
ok(met.n === n0 + 2 && met.open && met.cnt == met.n, 'strumenti dell’attività: se ne spuntano più di uno di fila, l’elenco resta aperto (' + JSON.stringify(met) + ')');
await P.locator('[data-attmet="0-0"]').screenshot({path:'/tmp/g10_met.png'});
await ev(() => faqOpen()); await sleep(500);
ok(await ev(() => !/Per chi conduce la verifica dello staff/.test(document.getElementById('g-modal').innerText)), 'nella Guida non c’è più la voce per chi conduce');
await ev(() => modalClose()); await ev(() => shPF()); await sleep(1500);
const pf = await ev(() => ({own: !!document.querySelector('#pf-mine .pf-ownb button'), help: /Per chi conduce la verifica dello staff/.test(document.body.innerText)}));
ok(pf.own && pf.help, 'Percorso formativo: «+ Una mia attività nuova» sotto «Il tuo percorso» e la guida unica (' + JSON.stringify(pf) + ')');
await ev(() => facGuideOpen()); await sleep(500);
ok(await ev(() => /Aiuti per chi conduce/i.test(document.getElementById("g-modal").innerText) && /Come fare un buon debrief/i.test(document.getElementById('g-modal').innerText)), 'la guida contiene anche gli aiuti per chi conduce');
await P.setViewportSize({width:1280, height:500}); await sleep(300);
ok(await ev(() => { const b=document.querySelector('#g-modal > div'); const r=b.getBoundingClientRect(); return r.top>=0 && r.bottom<=innerHeight+1 && b.scrollHeight>b.clientHeight; }), 'la finestra resta dentro lo schermo e si scorre');
await P.screenshot({path:'/tmp/g10_pf.png'}); await ev(() => modalClose());
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0,3).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
