import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const arg = process.argv[2] || 'chromium';
const engine = PROFILES[arg] ? PROFILES[arg][0] : arg;
const dev0 = Object.assign({}, PROFILES[arg] ? PROFILES[arg][1] : {}); delete dev0.defaultBrowserType; if(engine === 'firefox') delete dev0.isMobile;
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB(); db.sql13 = true;
const br = await launch(engine);
const until = async (fn, ms = 20000, step = 300) => { const t = Date.now(); while(Date.now() - t < ms){ try{ if(await fn()) return true; }catch(e){} await sleep(step); } return false; };
const mkU = (mail, nome, ruolo, gr) => { const u = db.addUser(mail, 'password123', nome); db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:gr, area_rcdf:'altoadriatico', dashboard:{}}); return u; };
const CO = mkU('comm@x.it', 'Marco Commissario', 'cds', null);
const G1 = mkU('g1@x.it', 'Gina Uno', 'cg', '1'), G2 = mkU('g2@x.it', 'Dario Due', 'cg', '2'), G3 = mkU('g3@x.it', 'Tina Tre', 'cg', '3');

// un Capo Gruppo crea il suo progetto formativo dall'interfaccia e lo riempie: n persone osservate con valori fissi per Ambito
async function capoGruppo(u, nomeGruppo, persone, val, cgForm){
  const pa = await person(br, db, {ctx: dev0}), P = pa.page; await loginAs(P, base, u); await sleep(2500);
  await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500);
  await P.evaluate(([nome, ps, v, cf]) => {
    UNIT_NAME = nome; STAFF_MEMBERS = ps.map(p => p.n); STAFF_MEMBERS.forEach((n, k) => { staffProfiles[n] = ps[k].f ? {ruolo:'CU', formc:ps[k].f, formazione:formLevel(ps[k].f)} : {ruolo:'CU'}; staffObs[n] = {}; if(ps[k].obs) ['P', 'C', 'S'].forEach(a => DB[a].forEach(q => { staffObs[n][q.id] = v[a]; })); });
    if(cf) Object.assign(autoProfile, {nome:cf.n, formc:cf.f, formazione:formLevel(cf.f)});
    _clTouched = true; _clUserAt = Date.now(); saveData(true); }, [nomeGruppo, persone, val, cgForm || null]);
  let row = null; await until(async () => { row = db.t.pee_archivi.find(r => r.user_id === u.id && r.data && r.data.STAFF_MEMBERS && r.data.STAFF_MEMBERS.length === persone.length && r.data.UNIT_NAME === nomeGruppo); return !!row; }, 15000);
  await pa.ctx.close(); return row;
}
const R1 = await capoGruppo(G1, 'CdG Alfa', [{n:'ZQ-G1-Anna', obs:1, f:['for_in']}, {n:'ZQ-G1-Piero', obs:1, f:['for_m_e', 'for_g']}, {n:'ZQ-G1-Rita', obs:1, f:['for_in', 'for_m_e']}], {P:8, C:4, S:2}, {n:'Gina Uno', f:['wb']});
const R2 = await capoGruppo(G2, 'CdG Beta', [{n:'ZQ-G2-Luca', obs:1, f:['nessuna']}, {n:'ZQ-G2-Ines', obs:0}], {P:6, C:6, S:6});
const R3 = await capoGruppo(G3, 'CdG Gamma', [{n:'ZQ-G3-Zeno', obs:1}], {P:5, C:5, S:5});
ok(!!R1 && !!R2 && !!R3, 'tre Capi Gruppo hanno creato e riempito il loro progetto formativo');
// il Commissario: progetto proprio, con Gina già nella tabella «I miei Capi Gruppo» (osservata 9/7/5)
const pc = await person(br, db, {ctx: dev0}), C = pc.page, ev = (f, a) => C.evaluate(f, a);
await loginAs(C, base, CO); await sleep(2500);
await C.click('.sh-big >> nth=0'); await sleep(300); await C.click('#sh-ncre'); await sleep(3500);
await ev(() => { STAFF_MEMBERS = ['Gina Uno']; staffProfiles['Gina Uno'] = {ruolo:'CG', link:{mail:'g1@x.it'}}; STAFF_MEMBERS.push('Piero Esterno'); staffProfiles['Piero Esterno'] = {ruolo:'CG'}; staffObs['Piero Esterno'] = {}; ['P', 'C', 'S'].forEach(a => DB[a].forEach(q => { staffObs['Piero Esterno'][q.id] = {P:3, C:3, S:3}[a]; })); staffObs['Gina Uno'] = {}; ['P', 'C', 'S'].forEach(a => DB[a].forEach(q => { staffObs['Gina Uno'][q.id] = {P:9, C:7, S:5}[a]; })); _clTouched = true; _clUserAt = Date.now(); saveData(true); });
await sleep(1500);
const inv = (r, u, mail, ruolo, id) => db.t.pee_membri.push({id, archivio_id:r.id, owner_id:u.id, owner_email:mail, email:'comm@x.it', ruolo, visto_il:null, created_at:'2026-11-01T10:00:00Z'});
inv(R1, G1, 'Gina Uno (g1@x.it)', 'commissario', 'mA'); inv(R2, G2, 'Dario Due (g2@x.it)', 'commissario', 'mB'); inv(R3, G3, 'Tina Tre (g3@x.it)', 'lettore', 'mC');   // G3 lo ha invitato solo come lettore

const me = await ev(() => ({cds: cgCds(), anno: CL.ctx.anno, id: CL.ctx.id}));
ok(me.cds, 'il Commissario ha il suo progetto formativo (veste Commissario)');
// Commissario: il collegamento esplicito «Capo Gruppo → Gruppo» e la timeline della Sezione con le sovrapposizioni
// scenario: Gina (mail riconosciuta → Gruppo Alfa) e Piero Esterno (nessun collegamento); si controlla la tendina, la scelta esplicita che prevale, più Gruppi per un Capo Gruppo,
// il nome del Gruppo nell'osservazione, la scheda del Gruppo, il rinominare la persona; poi la timeline: corsie, colori, sovrapposizioni attese e non attese, vista mese, Unità del Commissario.
const EV = (id, t, mod, a, b, ap) => ({id, cr:Date.now(), testo:t, modello:mod, ax:Object.assign({data:a}, b ? {dataFine:b} : {}), aperta:ap !== false, prog:{}, hid:{}, own:{}, dest:'staff'});
const profOf = n => ev(n0 => staffProfiles[n0], n);
await ev(() => { STAFF_VIEW = 'prof'; CURRENT_MEMBER = 'Gina Uno'; goPhase(1); renderStaffPhase1(); }); await sleep(1500);
const boxes = () => ev(() => [...document.querySelectorAll('#st-main .stg-c')].map(l => [l.innerText.trim(), l.querySelector('input').checked]));
await ev(() => shSez()); await sleep(2500); await ev(() => { STAFF_VIEW = 'prof'; CURRENT_MEMBER = 'Gina Uno'; goPhase(1); renderStaffPhase1(); }); await sleep(1500);
let b1 = await boxes();
ok(b1.length === 2 && JSON.stringify(b1.sort()) === JSON.stringify([['CdG Alfa', true], ['CdG Beta', false]]), 'Profilo di Gina: i due Gruppi in elenco, «CdG Alfa» già spuntato (riconosciuto dalla mail) · ' + JSON.stringify(b1));
ok(/Gruppo riconosciuto dalla mail o dal nome/.test(await ev(() => document.getElementById('st-main').innerText)), 'Profilo di Gina: dice che il Gruppo è stato riconosciuto e che si può cambiare');
const pg0 = await profOf('Gina Uno'); ok(!Array.isArray(pg0.gruppi), 'il riconoscimento automatico non scrive nulla nel progetto finché non scegli tu');
ok(/CdG Alfa/.test(await ev(() => document.getElementById('st-side').innerText)) && /CdG Alfa/.test(await ev(() => document.querySelector('.gsn-title').innerText)), 'colonna delle persone e barra in alto: compare «CdG Alfa» accanto a Gina');
// Piero: nessun Gruppo; lo collego a Beta
await ev(() => { CURRENT_MEMBER = 'Piero Esterno'; STAFF_VIEW = 'prof'; renderStaffPhase1(); }); await sleep(800);
b1 = await boxes(); ok(b1.every(x => !x[1]), 'Profilo di Piero: nessun Gruppo spuntato');
await C.click('#st-main .stg-c:has-text("CdG Beta") input'); await sleep(600);
const pp1 = await profOf('Piero Esterno'); ok(Array.isArray(pp1.gruppi) && pp1.gruppi.length === 1 && pp1.gruppi[0] === R2.id, 'Piero collegato a Beta: salvato come scelta esplicita (id del Gruppo)');
ok(/\(CdG Beta\)/.test(await ev(() => document.querySelector('.gsn-title').innerText)) && /CdG Beta/.test(await ev(() => document.getElementById('st-side').innerText)), 'barra in alto e colonna: «Piero Esterno (CdG Beta)»');
// un altro Gruppo non su PEE
await C.fill('#st-main .st-f:has(.stg-w) :is(input[type=text],textarea)', 'Fano 2'); await sleep(600);
ok(/CdG Beta, Fano 2/.test(await ev(() => document.querySelector('.gsn-title').innerText)), 'Gruppo non su PEE: «Fano 2» si affianca a CdG Beta');
await ev(() => { staffProfiles['Piero Esterno'].gruppoAltro = ''; });
// la scheda di Beta mostra Piero; l'Alfa mostra Gina; il bottone apre la lettura
await ev(() => shSez()); await sleep(2000);
const sB = await ev(() => { const s = [...document.querySelectorAll('#panel-pp section')].find(x => x.getAttribute('aria-label') === 'CdG Beta'); return s ? s.innerText.replace(/\s+/g, ' ') : ''; });
ok(/fatta da te su Piero Esterno/.test(sB) && /Apri la tua lettura di Piero Esterno/.test(sB) && /Personale 3 In sviluppo|Personale\s*3/.test(sB.replace(/Tracce iniziali/, 'x')), 'scheda di Beta: «fatta da te su Piero Esterno», il bottone e i suoi valori (3) · ' + sB.slice(0, 200));
ok(!/Non hai ancora collegato/.test(sB), 'scheda di Beta: sparito l\'invito a collegare');
await C.click('#panel-pp section[aria-label="CdG Beta"] button:has-text("Apri la tua lettura di Piero Esterno")'); await sleep(1500);
ok(await ev(() => document.getElementById('panel1').classList.contains('active') && CURRENT_MEMBER === 'Piero Esterno' && stSel().step === 'let'), 'il bottone apre la lettura individuale di Piero');
// Piero anche in Alfa: Alfa mostra due righe, la media le unisce
await ev(() => { STAFF_VIEW = 'prof'; renderStaffPhase1(); }); await sleep(600);
await C.click('#st-main .stg-c:has-text("CdG Alfa") input'); await sleep(500);
await ev(() => shSez()); await sleep(1800);
const sA = await ev(() => { const s = [...document.querySelectorAll('#panel-pp section')].find(x => x.getAttribute('aria-label') === 'CdG Alfa'); return s ? s.innerText.replace(/\s+/g, ' ') : ''; });
ok(/fatta da te su Gina Uno, Piero Esterno/.test(sA) || /fatta da te su Piero Esterno, Gina Uno/.test(sA), 'Piero in due Gruppi: la scheda di Alfa elenca Gina e Piero · ' + sA.slice(0, 160));
ok(/Apri la tua lettura di Gina Uno/.test(sA) && /Apri la tua lettura di Piero Esterno/.test(sA), 'scheda di Alfa: un bottone per ciascuno dei due Capi Gruppo');
// la scelta esplicita prevale sul riconoscimento: tolgo Alfa a Gina
await ev(() => { CURRENT_MEMBER = 'Gina Uno'; STAFF_VIEW = 'prof'; goPhase(1); renderStaffPhase1(); }); await sleep(800);
await C.click('#st-main .stg-c:has-text("CdG Alfa") input'); await sleep(500);
const pg1 = await profOf('Gina Uno'); ok(Array.isArray(pg1.gruppi) && pg1.gruppi.length === 0, 'Gina senza Gruppo: la scelta «nessuno» è salvata come scelta esplicita');
await ev(() => shSez()); await sleep(1800);
const sA2 = await ev(() => { const s = [...document.querySelectorAll('#panel-pp section')].find(x => x.getAttribute('aria-label') === 'CdG Alfa'); return s ? s.innerText.replace(/\s+/g, ' ') : ''; });
ok(/fatta da te su Piero Esterno/.test(sA2) && !/Gina Uno, |, Gina Uno|su Gina Uno/.test(sA2) , 'scheda di Alfa: ora c\'è solo Piero (la scelta di Gina prevale sulla mail) · ' + sA2.slice(0, 160));
// rinominare la persona non perde il collegamento
await ev(() => { stRename('Piero Esterno', 'Piero E.'); saveData(true); });
const ppR = await profOf('Piero E.'); ok(Array.isArray(ppR.gruppi) && ppR.gruppi.length === 2, 'se rinomini la persona il collegamento ai Gruppi resta');
await ev(() => { stRename('Piero E.', 'Piero Esterno'); saveData(true); });
// nessun dato dei Gruppi è stato scritto nel progetto del Commissario, a parte id e numeri
{ const js = JSON.stringify(db.t.pee_archivi.find(r => r.id === me.id).data); ok(!/ZQ-G1|ZQ-G2/.test(js), 'dati del Commissario: nessun nome dello staff dei Gruppi è stato copiato'); }

// ── timeline ──
const rA = db.t.pee_archivi.find(r => r.id === R1.id), rB = db.t.pee_archivi.find(r => r.id === R2.id);
const put = (r, evs) => { r.data.scheda = r.data.scheda || {}; r.data.scheda.uscite = {}; evs.forEach(e => { r.data.scheda.uscite[e.id] = e; }); r.updated_at = new Date(Date.now() + 9000).toISOString(); };
put(rA, [EV('a1', 'Uscita di Natale', 'giorno', '2026-12-05'), EV('a2', 'Consiglio di Gruppo', 'sede', '2026-12-10'), EV('a3', 'Bivacco di febbraio', 'bivacco', '2027-02-13', '2027-02-14', false)]);
put(rB, [EV('b1', 'Uscita sulla neve', 'giorno', '2026-12-06'), EV('b2', 'Riunione di staff', 'sede', '2026-12-10'), EV('b3', 'Campo di primavera', 'campo', '2027-03-20', '2027-03-22'), EV('b4', 'Cena sociale', 'giorno', '')]);
await ev(([i]) => { const u = uscMap(); u[i[0]] = {id:i[0], cr:Date.now(), testo:'Consiglio di Sezione', modello:'sede', ax:{data:'2027-02-13'}, prog:{}, hid:{}, own:{}, dest:'staff'}; saveData(true); }, [['c1']]);
db.t.pee_archivi.push({id:'unit-1', user_id:CO.id, anno:Number(me.anno), titolo:'Reparto di prova', meta:{mode:'giovani', tipo:'AN', vruolo:'cu', vbranca:'E'}, data:{scheda:{uscite:{u1:EV('u1', 'Uscita di Reparto', 'giorno', '2027-03-21')}}}, created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
await ev(() => { SH._sez.st = 'x'; SH._sezU = null; SH._calV = 'lista'; shCal(); }); await sleep(2500);
ok(await ev(() => !document.querySelector('.sz-wrap')), 'calendario: all\'inizio c\'è l\'elenco, la timeline non è aperta');
await C.click('button:has-text("Timeline")'); await sleep(3500);
ok(await ev(() => !!document.querySelector('.sz-wrap')), 'calendario: «Vista Timeline» apre la timeline della Sezione');
const lanesT = await ev(() => [...document.querySelectorAll('.sz-wrap .sz-r')].slice(1).map(r => r.querySelector('.sz-l').innerText.replace(/\s+/g, ' ').trim()));
ok(lanesT.length === 5 && /Da guardare/.test(lanesT[0]) && /Tu · Sezione/.test(lanesT[1]) && /Tu · Unità/.test(lanesT[2]) && /CdG Alfa/.test(lanesT[3]) && /CdG Beta/.test(lanesT[4]), 'timeline: corsie «Da guardare», Tu · Sezione, Tu · Unità, un Gruppo per corsia · ' + JSON.stringify(lanesT));
const cl = await ev(() => { const g = id => [...document.querySelectorAll('.sz-wrap .sz-sw')].find(s => s.closest('.sz-l').innerText.includes(id)); const c = id => { const e = g(id); return e ? getComputedStyle(e).backgroundColor : ''; }; return {a:c('CdG Alfa'), b:c('CdG Beta'), me:c('Sezione')}; });
ok(cl.a && cl.b && cl.a !== cl.b && cl.me !== cl.a, 'timeline: ogni Gruppo ha il suo colore, diverso da quello degli altri · ' + JSON.stringify(cl));
const sw = await ev(() => [...document.querySelectorAll('.sz-wrap .sz-l .sz-sw')].map(s => s.innerText.trim()));
ok(sw.includes('1') && sw.includes('2'), 'timeline: i Gruppi hanno anche il numero (il colore non è l\'unico segnale) · ' + JSON.stringify(sw));
const ovl = await ev(() => [...document.querySelectorAll('.sz-ov > li')].map(li => li.innerText.replace(/\s+/g, ' ').trim()));
ok(ovl.length === 3, 'sovrapposizioni: 3 («Gruppi insieme» a dicembre, tuo evento a febbraio, tua Unità a marzo) e non la riunione dello stesso giorno · ' + JSON.stringify(ovl));
ok(/sab 5 dic → dom 6 dic.*2 Gruppi insieme/i.test(ovl[0]) && /Uscita di Natale/.test(ovl[0]) && /Uscita sulla neve/.test(ovl[0]) && !/Consiglio di Gruppo|Riunione di staff/.test(ovl[0] + ovl[1] + ovl[2]), 'sovrapposizione 1: le due uscite dello stesso weekend; le due riunioni del 10 dicembre non contano · ' + ovl[0]);
ok(/C’è anche un tuo evento/.test(ovl[1]) && /Bivacco di febbraio/.test(ovl[1]) && /Consiglio di Sezione/.test(ovl[1]) && /Riservato/.test(ovl[1]), 'sovrapposizione 2: il tuo Consiglio di Sezione e il bivacco (riservato) di Alfa · ' + ovl[1]);
ok(/C’è anche un tuo evento/.test(ovl[2]) && /Campo di primavera/.test(ovl[2]) && /Uscita di Reparto/.test(ovl[2]), 'sovrapposizione 3: il campo di Beta e la tua uscita di Reparto (la tua Unità) · ' + ovl[2]);
const nsd = await ev(() => document.querySelector('.sz-wrap').innerText);
ok(/1 evento senza data non compare/.test(nsd), 'timeline: dice che un evento senza data non compare');
const nmk = await ev(() => ({m:document.querySelectorAll('.sz-wrap .sz-m').length, b:document.querySelectorAll('.sz-wrap .sz-b').length}));
ok(nmk.m === 6 && nmk.b === 2, 'timeline anno: 6 segni (giorni singoli) e 2 barre (bivacco e campo) · ' + JSON.stringify(nmk));
// dentro lo schermo + nessuna riga fuori
const fuo = await ev(() => { const W = document.documentElement.clientWidth; return document.documentElement.scrollWidth > W + 2; });
ok(!fuo, 'timeline: la pagina non va in orizzontale (scorre solo la timeline)');
if(process.env.SHOT){ const w = await C.$('.sz-wrap'); await w.screenshot({path: process.env.SHOT + '-anno.png'}); }
// vista mese
await C.click('.sz-ovb >> nth=0'); await sleep(900);
const mm = await ev(() => ({v:document.querySelector('.sz-mn select') && document.querySelector('.sz-mn select').value, days:document.querySelectorAll('.sz-wrap .sz-hd span').length, hi:document.querySelectorAll('.sz-wrap .sz-r:nth-child(2) .sz-g i.al-gr').length}));
ok(mm.v === '2026-12' && mm.days === 31 && mm.hi === 2, 'clic sulla sovrapposizione: apre dicembre (31 giorni), sabato e domenica evidenziati · ' + JSON.stringify(mm));
if(process.env.SHOT){ const w = await C.$('.sz-wrap'); await w.screenshot({path: process.env.SHOT + '-mese.png'}); await C.screenshot({path: process.env.SHOT + '-pag.png', fullPage:true}); }
await C.click('button[aria-label="Mese successivo"]'); await sleep(500);
ok(await ev(() => document.querySelector('.sz-mn select').value) === '2027-01', 'mese successivo: gennaio 2027');
await C.click('button:has-text("Tutto l’anno")'); await sleep(500);
ok(await ev(() => document.querySelectorAll('.sz-wrap .sz-hd span').length) === 12, 'torna a tutto l\'anno (12 mesi)');
// l'elenco sotto: campo colorato col colore del Gruppo; i tuoi eventi hanno «Tu»
const rowsL = await ev(() => [...document.querySelectorAll('.cal-row')].map(r => ({t:r.innerText.replace(/\s+/g, ' '), bg:getComputedStyle(r).backgroundColor, gr:r.classList.contains('cal-gr')})));
ok(rowsL.some(r => r.gr && /1 · CdG Alfa/.test(r.t)) && rowsL.some(r => r.gr && /2 · CdG Beta/.test(r.t)) && rowsL.some(r => !r.gr && /Tu/.test(r.t) && /Consiglio di Sezione/.test(r.t)), 'elenco: gli eventi dei Gruppi portano numero e nome, i tuoi portano «Tu»');
const bgA = rowsL.find(r => r.gr && /1 · CdG Alfa/.test(r.t)).bg, bgB = rowsL.find(r => r.gr && /2 · CdG Beta/.test(r.t)).bg;
ok(bgA !== bgB && bgA !== 'rgba(0, 0, 0, 0)', 'elenco: il campo dell\'evento ha il colore del Gruppo (diverso fra Alfa e Beta) · ' + bgA + ' / ' + bgB);
// i dati degli altri non sono stati toccati dal Commissario
const jsC = JSON.stringify(db.t.pee_archivi.find(r => r.id === me.id).data);
ok(!/Uscita di Natale|Uscita sulla neve|Campo di primavera|Uscita di Reparto/.test(jsC), 'dati del Commissario: gli eventi dei Gruppi e della sua Unità non sono stati copiati nel suo progetto');
const errs = await ev(() => window.__errs || []); ok(!errs.length, 'nessun errore nella pagina del Commissario ' + JSON.stringify(errs).slice(0, 200));
await br.close(); process.exit(summary() ? 1 : 0);
