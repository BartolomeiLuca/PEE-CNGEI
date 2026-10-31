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
const hasFac = await ev(() => { const h = document.body.innerHTML; return /class="ax-opt">facoltativo/.test(h); });
ok(!hasFac, 'nessuna etichetta «facoltativo» nell’interfaccia');
const src = await (await fetch(base)).text().catch(() => '');
ok(!/\(facoltativ[oa]\)/.test(src.replace(/materiali:"[^"]*"/g, '')), 'niente «(facoltativo)» tra parentesi nei testi dell’interfaccia');

// assicura gli id delle attività nel ciclo aperto
await ev(() => { getAllPercorsi().forEach(p => { try{ attIdsEnsure(p); }catch(e){} }); saveData(true); });

// ── A. Il mio anno: barra fissa, segnaposto, clic ──
await P.click('.sh-seg button:has-text("Il mio anno")'); await sleep(3500);
await ev(() => { annoRe(); }); await sleep(800);
const stk = await ev(() => { const e = document.querySelector('.vis-stk'); return e ? getComputedStyle(e).position : null; });
ok(stk === 'sticky', 'barra di mesi e zoom: sticky (' + stk + ')');
await ev(() => { const e = document.querySelector('.vis-stk'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + 120); }); await sleep(500);
const top = await ev(() => { const e = document.querySelector('.vis-stk'); const r = e.getBoundingClientRect(); return {t:Math.round(r.top), h:Math.round(r.height), hdr:Math.round(document.getElementById('hdr') ? document.getElementById('hdr').getBoundingClientRect().height : 0)}; });
ok(top.t >= 0 && top.t < 130, 'dopo lo scorrimento la barra resta in alto (top ' + top.t + ', intestazione ' + top.hdr + ')');
const ph0 = await ev(() => document.querySelectorAll('.vis-bar.ph').length);
await ev(() => { scheda.priorita[2].tDal = ''; scheda.priorita[2].tAl = ''; (scheda.percorsiExtra || []).forEach(p => { if(p.prioritaIdx === 2){ p.tDal = ''; p.tAl = ''; } }); SH._ay = null; annoRe(); }); await sleep(3500);
const ph1 = await ev(() => document.querySelectorAll('.vis-bar.ph').length);
ok(ph1 > ph0, 'percorso senza periodo: segnaposto col periodo del ciclo (' + ph0 + ' → ' + ph1 + ')');
const nGo = await ev(() => document.querySelectorAll('.vis-wrap [data-go]').length);
ok(nGo > 8, 'elementi della linea del tempo cliccabili (' + nGo + ')');
await ev(() => { const m = [...document.querySelectorAll('.vis-mk.vis-at.vis-go')].find(e => /Gioco B/.test(e.getAttribute('aria-label') || '')); if(m) m.click(); }); await sleep(1800);
const dest = await ev(() => { const L = getAllPercorsi(); const j = L[0].attivita.findIndex(a => a.testo === 'Gioco B'); const d = document.getElementById('att-0-' + j); return {j, ex:!!d, open:d ? d.open : null, top:d ? Math.round(d.getBoundingClientRect().top) : null}; });
ok(dest.ex && dest.open, 'clic su «Gioco B»: si apre proprio quell’attività (att-0-' + dest.j + ', aperta: ' + dest.open + ', top ' + dest.top + ')');
await ev(() => { shDash(); }); await sleep(1500);
await P.click('.sh-seg button:has-text("Il mio anno")').catch(() => {}); await sleep(2500);
await ev(() => { const l = document.querySelector('.vis-l b.vis-go[data-pid="C1"]'); if(l) l.click(); }); await sleep(1500);
const per = await ev(() => { const L = getAllPercorsi(); const i = L.findIndex(p => p.percorsoId === 'C1'); const c = document.getElementById('pc-card-' + i); return {i, ex:!!c, closed:c ? c.classList.contains('closed') : null}; });
ok(per.ex && per.closed === false, 'clic sul percorso C1: si apre la sua scheda (pc-card-' + per.i + ')');
await ev(() => { const e = [...document.querySelectorAll('.vis-wrap .vis-oc.vis-go')][0]; if(!e) return; });

// ── B. Calendario: ciclo in base alla data ──
await ev(() => { shCal(); }); await sleep(3500);
await ev(() => { calScopeSet('anno'); }); await sleep(3500);
await ev(() => calNew('sede')); await sleep(400);
await ev(() => { document.getElementById('cal-d1').value = '2027-02-10'; document.getElementById('cal-d1').dispatchEvent(new Event('input', {bubbles:true})); }); await sleep(300);
const hint = await ev(() => (document.getElementById('cal-cyh') || {}).textContent);
ok(/II trimestre/.test(hint || ''), 'la data di febbraio 2027 dice «II trimestre»: «' + (hint || '').slice(0, 80) + '»');
await ev(() => { document.getElementById('cal-nt').value = 'Riunione nuova'; calMake(); }); await sleep(3000);
const c2 = db.t.pee_archivi.find(r => r.id === 'c2'); const inC2 = Object.values((c2.data.scheda.uscite) || {}).some(u => u.testo === 'Riunione nuova');
const c1 = db.t.pee_archivi.find(r => r.id === 'c1');
ok(inC2, 'la riunione di febbraio finisce nel II trimestre (non nel ciclo aperto)');
await ev(() => calNew('sede')); await sleep(300);
await ev(() => { document.getElementById('cal-d1').value = '2026-11-05'; document.getElementById('cal-nt').value = 'Riunione novembre'; calMake(); }); await sleep(2000);
ok(await ev(() => uscListAll().some(u => u.testo === 'Riunione novembre')), 'una data di novembre 2026 resta nel ciclo aperto');

// ── C. attività nell'evento e indicazione sotto l'uscita ──
await ev(() => calMoveX({cy:'', i:0, j:0, from:''}, 's1', '')); await sleep(1500);
await ev(() => { shCal(); }); await sleep(2500);
const ap = await ev(() => [...document.querySelectorAll('.cal-ap')].map(e => e.textContent));
ok(ap.some(t => /Gioco A/.test(t) && /P1/.test(t)), 'sotto l’uscita compare l’attività del percorso e quale (' + ap.length + ')');

// ── D. Spostare l'attività in un ciclo nuovo ──
const nBefore = db.t.pee_archivi.length;
await ev(() => attMoveAsk(0, 1)); await sleep(800);
ok(await ev(() => !!document.querySelector('#amv-c option[value="__new"]')), 'nella finestra di spostamento c’è «Un ciclo nuovo…»');
await ev(() => { const s = document.getElementById('amv-c'); s.value = '__new'; amvFill(); }); await sleep(300);
ok(await ev(() => document.getElementById('amv-nc').style.display !== 'none'), 'scegliendolo compaiono nome, dal e al');
await ev(() => { const p = document.getElementById('amv-p'); p.value = 'P1'; amvGo(); }); await sleep(3500);
ok(db.t.pee_archivi.length === nBefore + 1, 'nasce un nuovo ciclo (' + nBefore + ' → ' + db.t.pee_archivi.length + ')');
const nw = db.t.pee_archivi[db.t.pee_archivi.length - 1];
ok(nw && Object.values(nw.data.scheda.percorsiExtra || []).some(p => (p.attivita || []).some(a => a.testo === 'Gioco B')), 'il nuovo ciclo contiene l’attività spostata');
ok(await ev(() => !getAllPercorsi()[0].attivita.some(a => a.testo === 'Gioco B')), 'e qui l’attività non c’è più');

// ── E. Cambiare ciclo a un’uscita ──
await ev(() => { shSrUsc('s1'); }); await sleep(1500);
ok(await ev(() => !!document.querySelector('.usc-hero button[onclick^="uscCicloAsk"]')), 'dentro l’uscita c’è il pulsante «Ciclo: …»');
await ev(() => uscCicloGo('s1', 'c2')); await sleep(3500);
const c2b = db.t.pee_archivi.find(r => r.id === 'c2');
ok(Object.values(c2b.data.scheda.uscite || {}).some(u => u.id === 's1' && !u.del), 'l’uscita ora è nel II trimestre');
ok(await ev(() => !uscListAll().some(u => u.id === 's1')), 'e non è più nel ciclo aperto');

// ── F. Indicatori scelti → percorso e obiettivo in chiaro ──
await ev(() => { const L = getAllPercorsi(); const i = L.findIndex(p => p.percorsoId === 'P1'); anJump({t:'att', pid:'P1', aid:L[i].attivita[0].aid, pi:i, j:0}); }); await sleep(2000);
const po = await ev(() => { const e = document.querySelector('.att-pobj'); return e ? e.textContent : ''; });
ok(/P1/.test(po) && /Obiettivo/.test(po), 'nel pannello dell’attività: percorso e obiettivo in chiaro («' + po.slice(0, 90) + '»)');
const pageErr = await ev(() => 1); 
process.exit(summary() ? 1 : 0);
