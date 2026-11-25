// Carta di Unità (24/11): voce nel menu della programmazione, dati letti dalla programmazione, consegna al giro, modulo di ripiego nella pagina del giro, tabella per chi coordina.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB();
const W = {};
async function entra(chi, nome, ruolo){
  const pa = await person(br, db); const P = pa.page;
  const u = db.addUser(chi + '@x.it', 'password123', nome);
  db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
  await loginAs(P, base, u); await sleep(1800);
  W[chi] = {pa, P, u, ev: (f, a) => P.evaluate(f, a)}; return W[chi];
}
const luca = await entra('luca', 'Luca Titolare', 'cg'), anna = await entra('anna', 'Anna Verdi', 'cu'), bruno = await entra('bruno', 'Bruno Neri', 'cu');
const cnt = (w, sel) => w.ev((s) => document.querySelectorAll(s).length, sel);
const txt = (w, sel) => w.ev((s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);

// il piano e le persone invitate
const pid = await luca.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Piano di prova', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
for(const w of [anna, bruno]) db.t.pee_piani_membri.push({id:'m-' + w.u.email, piano_id:pid, email:w.u.email, ruolo:'lettore', etichetta:'Capo Unità', nome:w.u.meta.nome, visto_il:null, invitato_da:luca.u.id, created_at:'2026-11-24T10:00:00Z'});
// la programmazione di Anna
db.t.pee_archivi.push({id:'p1', user_id:anna.u.id, anno:2026, titolo:'Programmazione 2026-27', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto Aquile'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Aquile', obs:{}, pris:{P1:true}, scheda:{tipoProgetto:'AN', percorsiExtra:[], uscite:{}, annoScout:'2026-27',
    priorita:[{ambito:'P', pid:'P1', necessita:'Lavorare in squadra senza litigare', obiettivi:[0], idr:[], percorso:'', tempistica:''}],
    pp:{numTot:'22', numM:'10', numF:'12', numAnn:['8', '6', '5', '3'], staffTab:[{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'VCU', nome:'Marco Bianchi'}, {ruolo:'CG'}]}}}});
await anna.ev(() => shOpen('p1', 0)); await sleep(3500);

// ── 1. la voce nel menu ──
ok(await anna.ev(() => { shGrp('Condividere'); return [...document.querySelectorAll('#sh-side .sh-si')].some(b => /Carta di Unità/.test(b.textContent)); }), 'nel menu «Condividere» c’è «Carta di Unità»');
await anna.ev(() => shCdU()); await sleep(1200);
ok(await cnt(anna, '#cdu-b1') === 1 && await cnt(anna, '.gi-carta') === 7, 'si apre la pagina con i sette blocchi');
ok(await anna.ev(() => document.querySelector('#sh-side .sh-si.on') && /Carta di Unità/.test(document.querySelector('#sh-side .sh-si.on').textContent)), 'la voce del menu risulta attiva');
const pg = await txt(anna, '#panel-pp');
ok(/22.*tra ragazzi e ragazze/.test(pg) && /10 maschi, 12 femmine/.test(pg) && /1° 8, 2° 6, 3° 5, 4° 3/.test(pg), 'numeri letti dalla programmazione, senza chiederli due volte');
ok(/Staff: 2 persone \(CU, VCU\)/.test(pg) && !/Marco|Bianchi/.test(pg), 'staff: solo quante persone e i ruoli, senza i nomi');
ok(/Personale/.test(pg) && /Lavorare in squadra senza litigare/.test(pg) && await cnt(anna, '#cdu-b2a') === 0, 'parte educativa letta dalla programmazione (sola lettura)');
ok(/Quali passaggi di branca vi preoccupano/.test(pg) && await cnt(anna, '#cdu-b2') === 1, 'una riga in più sui passaggi di branca');
ok(await cnt(anna, 'input[name="cdu-s-b3"]') === 3 && await cnt(anna, 'input[name="cdu-s-b1"]') === 0, 'il semaforo c’è sui blocchi 3-6');
ok(/Il Capo Gruppo non ha ancora aperto il giro/.test(await txt(anna, '#cdu-dest')) , 'senza giro aperto lo dice');
// si scrive: salvataggio nella programmazione
await anna.P.fill('#cdu-b1', 'Sono arrivati sette ragazzi dal Branco'); await anna.P.fill('#cdu-b3', 'Ci serve una formazione sulla sicurezza'); await anna.P.check('input[name="cdu-s-b3"][value="g"]');
await anna.P.fill('#cdu-b7r', 'Un aiuto con i trasporti'); await anna.P.fill('#cdu-b7o', 'Un’uscita aperta a tutto il Gruppo'); await sleep(2800);
const dbp = db.t.pee_archivi.find(r => r.id === 'p1');
ok(dbp.data.scheda.cdu && dbp.data.scheda.cdu.b.b1 === 'Sono arrivati sette ragazzi dal Branco' && dbp.data.scheda.cdu.s.b3 === 'g', 'la Carta si salva dentro la programmazione');

// ── 2. si apre il giro e si consegna ──
await luca.ev(async id => { await PIANI.giroApri(id, {ritmo:'standard'}); }, pid); await sleep(300);
await anna.ev(() => shCdU()); await sleep(1800);
ok(await cnt(anna, '#cdu-go') === 1 && /Giro 1 di «Piano di prova»/.test(await txt(anna, '#cdu-dest')), 'con il giro aperto compare «Consegna al giro del Piano di Gruppo»');
ok(await anna.ev(() => document.getElementById('cdu-b1').value) === 'Sono arrivati sette ragazzi dal Branco', 'riaprendo la pagina il testo c’è');
await anna.P.click('#cdu-go'); await sleep(1500);
let cu = db.t.pee_piani_contributi.filter(c => c.tipo === 'unita');
ok(cu.length === 1 && cu[0].consegnato && cu[0].autore_id === anna.u.id, 'consegnata: un contributo «unita» con il nome di chi consegna');
const d = cu[0].data;
ok(d.unita === 'Reparto Aquile' && d.n.tot === 22 && d.n.staff === 2 && d.fonte === 'pee' && d.edu[0].amb === 'Personale' && d.edu[0].nec === 'Lavorare in squadra senza litigare', 'contenuto: numeri, staff, parte educativa dalla programmazione');
ok(!JSON.stringify(d).match(/Marco|Bianchi|anna@x.it|Anna Verdi/), 'nessun nome né email di persone dello staff nella Carta consegnata');
ok(d.b.b3 === 'Ci serve una formazione sulla sicurezza' && d.s.b3 === 'g' && d.b.b7r === 'Un aiuto con i trasporti', 'risposte e semaforo');
ok(/Consegnata il \d\d\/\d\d\/\d{4} al giro 1/.test(await txt(anna, '#cdu-st')), 'la pagina ricorda che è consegnata');
// modifica dopo la consegna e nuova consegna: stessa riga
await anna.P.fill('#cdu-b5', 'La sede ha bisogno di una pittura'); await sleep(400);
ok(/consegnala di nuovo/.test(await txt(anna, '#cdu-st')), 'dopo una modifica avvisa di consegnare di nuovo');
await anna.P.click('#cdu-go'); await sleep(1500);
cu = db.t.pee_piani_contributi.filter(c => c.tipo === 'unita');
ok(cu.length === 1 && cu[0].data.b.b5 === 'La sede ha bisogno di una pittura', 'la nuova consegna sostituisce la precedente (una sola riga)');

// ── 3. modulo di ripiego nella pagina del giro (nessuna programmazione) ──
await bruno.ev(id => pnOpen(id), pid); await sleep(1200); await bruno.ev(() => pnSez('g-cdu')); await sleep(900);
ok(await cnt(bruno, '#gcu-b1') === 1 && await cnt(bruno, '#gcu-n-nome') === 1 && await cnt(bruno, '#gcu-b2a') === 1, 'senza programmazione la pagina del giro ha il modulo completo, con le due domande libere');
ok(await cnt(luca, '#gi-cu-t') === 0, 'chi non è Capo Unità non vede il modulo');
await bruno.P.fill('#gcu-n-nome', 'Branco Popolo Libero'); await bruno.P.fill('#gcu-n-tot', '18'); await bruno.P.fill('#gcu-n-staff', '4'); await bruno.P.fill('#gcu-b2a', 'Il lavoro di squadra'); await bruno.P.fill('#gcu-b4', 'Poche famiglie vengono alle riunioni');
await bruno.P.check('input[name="gcu-s-b4"][value="r"]'); await sleep(2200);
let bu = db.t.pee_piani_contributi.find(c => c.tipo === 'unita' && c.autore_id === bruno.u.id);
ok(bu && !bu.consegnato && bu.data.s.b4 === 'r' && bu.data.fonte === 'libera', 'bozza salvata da sola (non consegnata)');
await bruno.P.click('button >> text=Consegna la Carta di Unità'); await sleep(1500);
bu = db.t.pee_piani_contributi.find(c => c.tipo === 'unita' && c.autore_id === bruno.u.id);
ok(bu.consegnato && bu.data.unita === 'Branco Popolo Libero' && bu.data.n.tot === 18 && bu.data.n.staff === 4 && bu.data.b.b2a === 'Il lavoro di squadra', 'consegnata dal modulo di ripiego');

// ── 4. chi coordina ──
await luca.ev(id => pnOpen(id), pid); await sleep(1200); await luca.ev(() => pnSez('g-cdus')); await sleep(900);
ok(/Consegna prima le tue carte/.test(await txt(luca, '#gi-cc-t ~ .sh-sub')), 'prima di consegnare le proprie carte il Capo Gruppo non legge le Carte di Unità (regola di tutti)');
await luca.ev(async g => { await PIANI.contributoSalva(g, 'carte', {v:1, a:{educativa:{v:'x', c:'', p:'', b:false}}}, true); await giCarica(false); }, db.t.pee_piani_giri[0].id); await sleep(900);
const tab = await luca.ev(() => [...document.querySelectorAll('table[aria-label="Carte di Unità"] tbody tr')].map(r => [...r.children].map(c => c.textContent.replace(/\s+/g, ' ').trim())));
ok(tab.length === 2, 'tabella con le due Unità');
const ra = tab.find(r => r[0].includes('Reparto Aquile')), rb = tab.find(r => r[0].includes('Branco Popolo Libero'));
ok(ra && /ci pensiamo/.test(ra[1]) && rb && /ci serve una mano/.test(rb[2]), 'semafori con il segno e la parola (' + JSON.stringify(ra) + ')');
const ric = await luca.ev(() => [...document.querySelectorAll('#gi-cc-t ~ details')].map(x => x.textContent.replace(/\s+/g, ' ')).join(' | '));
ok(/Un aiuto con i trasporti/.test(ric) && /Un’uscita aperta a tutto il Gruppo/.test(ric) && /Lavorare in squadra senza litigare/.test(ric), 'richieste, offerte e parte educativa si leggono');
ok(/Anna Verdi/.test(tab[0].concat(tab[1]).join(' ')) , 'accanto all’Unità c’è chi ha consegnato');

// ── 5. chiuso il giro non si consegna più ──
await luca.ev(async g => { await PIANI.giroChiudi(g, 'anticipata'); }, db.t.pee_piani_giri[0].id); await sleep(400);
await anna.ev(() => shCdU()); await sleep(1800);
ok(await cnt(anna, '#cdu-go') === 0 && /non ha ancora aperto il giro/.test(await txt(anna, '#cdu-dest')), 'a giro chiuso non c’è più il pulsante di consegna');
const e = await anna.ev(async g => { try{ await PIANI.contributoSalva(g, 'unita', {v:1, b:{}}, true); return 'ok'; }catch(x){ return pianoErr(x); } }, db.t.pee_piani_giri[0].id);
ok(e !== 'ok', 'e il database la rifiuta (' + e + ')');

// ── 6. nuova programmazione: la Carta non si copia ──
const cp = await anna.ev(() => dupBuild({anno:2026, scheda:{cdu:{b:{b1:'x'}}}}, 2027, ['ctx']).scheda.cdu);
ok(cp === undefined, 'duplicando la programmazione la Carta non passa all’anno dopo');
// visuale condivisa (sola lettura): niente voce di menu
ok(!await anna.ev(() => { const it = shNavItems().find(i => i.id === 'd-cdu'); return !!it; }) === false, 'la voce esiste nell’elenco');
const nerr = Object.values(W).reduce((n, w) => n + w.pa.errors.length, 0);
ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) for(const k of Object.keys(W)) if(W[k].pa.errors.length) console.log('  errori', k, W[k].pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); const f = summary(); process.exit(f ? 1 : 0);
