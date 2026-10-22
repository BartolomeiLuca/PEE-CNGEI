// Priorità sempre P-C-S, necessità e date dalla Sezione 2 alla 3, cambio di percorso, progetti vecchi, bozza della 1.3
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
if(process.env.FASCIA){ await ev(f => { FASCIA = f; try{ saveData(true); }catch(e){} try{ renderSchedaC(); }catch(e){} }, process.env.FASCIA); await sleep(500); }
// tolgo le priorità dell'esempio e le rimetto in ordine S, C, P
await ev(() => { ['P5','C3','S3'].forEach(id => { if(pris[id]) togglePri(id, id[0]); }); });
await ev(() => { goPhaseInternal(3); }); await sleep(500);
for(const id of ['S3','C3','P5']){ await P.click('#pri-' + id); await sleep(200); }
const ord = await ev(() => ({sel: priSel().join(','), amb: scheda.priorita.map(p => p.ambito).join(','), per: getAllPercorsi().map(p => p.percorsoId).join(',')}));
ok(ord.sel === 'P5,C3,S3' && ord.amb === 'P,C,S' && ord.per.startsWith('P5,C3,S3'), 'scelte in ordine S, C, P → Sezioni 2 e 3 in ordine P, C, S: ' + JSON.stringify(ord));
ok(await ev(() => getAllPercorsi()[0].attivita[0].testo === 'Officina di Pattuglia'), 'le attività restano attaccate al loro percorso (P5)');
// Sezione 2 → 3: necessità
await ev(() => { gGo('2'); }); await sleep(600);
const nec = P.locator(':is(input,textarea)[oninput="priNec(0,this.value)"]');
await nec.fill('Necessità P scritta nella Sezione 2'); await sleep(300);
await ev(() => { gGo('3'); }); await sleep(600);
const s3 = P.locator(':is(input,textarea)[oninput="priNec(0,this.value)"]');
ok((await s3.inputValue()) === 'Necessità P scritta nella Sezione 2', 'necessità: dalla 2 alla 3');
await ev(() => { gGo('2'); }); await sleep(500); await nec.fill('Necessità P cambiata'); await sleep(300);
await ev(() => { gGo('3'); }); await sleep(500);
ok((await s3.inputValue()) === 'Necessità P cambiata', 'necessità: cambiata nella 2, aggiornata nella 3');
await s3.fill('Necessità P riscritta nella 3'); await sleep(300);
ok(await ev(() => scheda.priorita[0].necessita) === 'Necessità P riscritta nella 3', 'necessità: scritta nella 3, è la stessa della 2');
// date
await ev(() => { scheda.priorita[1].tDal = '2026-11'; scheda.priorita[1].tAl = '2027-02'; const p = getAllPercorsi()[1]; p.tDal = ''; p.tAl = ''; p.dal = ''; p.al = ''; saveData(true); });
const d1 = await ev(() => percTempoTxt(getAllPercorsi()[1]));
await ev(() => { scheda.priorita[1].tAl = '2027-04'; saveData(true); });
const d2 = await ev(() => percTempoTxt(getAllPercorsi()[1]));
ok(/novembre/i.test(d1) && /aprile/i.test(d2), 'date: la 3 segue la 2 (' + d1 + ' → ' + d2 + ')');
// cambio di percorso nello stesso ambito e ambito tolto e rimesso
await ev(() => { goPhaseInternal(3); }); await sleep(400);
await P.click('#pri-C5'); await sleep(300);
const c = await ev(() => ({pid: scheda.priorita[1].pid, amb: scheda.priorita.map(p => p.ambito).join(','), dal: scheda.priorita[1].tDal, act: getAllPercorsi()[1].attivita[0].testo}));
ok(c.pid === 'C5' && c.amb === 'P,C,S' && c.dal === '2026-11' && c.act === 'Capi Pattuglia per un giorno', 'Comunitario cambiato da C3 a C5: date e attività restano, ordine giusto');
await P.click('#pri-P5'); await sleep(300);
const off = await ev(() => ({sel: priSel().join(','), amb: scheda.priorita.map(p => p.ambito).join(','), first: getAllPercorsi()[0].percorsoId}));
ok(off.sel === 'C5,S3' && off.amb.startsWith('C,S') && off.first === 'C5', 'Personale tolto: restano C, S in ordine');
await P.click('#pri-P5'); await sleep(300);
const back = await ev(() => ({amb: scheda.priorita.map(p => p.ambito).join(','), nec: scheda.priorita[0].necessita, act: getAllPercorsi()[0].attivita[0].testo}));
ok(back.amb === 'P,C,S' && back.nec === 'Necessità P riscritta nella 3' && back.act === 'Officina di Pattuglia', 'Personale rimesso: ritrova necessità e attività');
// progetto vecchio, salvato nell'ordine dei clic (S, C, P)
await ev(() => {
  const d = JSON.parse(localStorage.getItem(LSK));
  d.pris = {S3:true, C3:true, P5:true};
  const ex = d.scheda.percorsiExtra; const byId = id => ex.find(x => x.percorsoId === id || x.percorsoId === (id === 'C3' ? 'C5' : id));
  const pS = byId('S3'), pC = byId('C3'), pP = byId('P5'); pC.percorsoId = 'C3';
  pS.prioritaIdx = 0; pC.prioritaIdx = 1; pP.prioritaIdx = 2;
  const pr = d.scheda.priorita; const [prP, prC, prS] = pr;
  [prS, prC, prP].forEach(x => { delete x.pid; }); prS.necessita = 'NEC-S'; prS.ambito = 'S'; prC.ambito = 'C'; prP.ambito = 'P';
  d.scheda.priorita = [prS, prC, prP]; d.scheda.sez3Pri = 0; delete d.scheda.priPark;
  localStorage.setItem(LSK, JSON.stringify(d));
});
await P.reload(); await sleep(3000);
const old = await ev(() => ({amb: scheda.priorita.map(p => p.ambito).join(','), per: getAllPercorsi().slice(0, 3).map(p => p.percorsoId).join(','), necS: scheda.priorita[2].necessita, actP: getAllPercorsi()[0].attivita[0].testo, sez: scheda.sez3Pri}));
ok(old.amb === 'P,C,S' && old.per === 'P5,C3,S3' && old.necS === 'NEC-S' && old.actP === 'Officina di Pattuglia' && old.sez === 2, 'progetto vecchio (ordine S, C, P): riordinato P, C, S senza perdere nulla ' + JSON.stringify(old));
// Word della Scheda: Sezione 2 in ordine P, C, S
const [dl] = await Promise.all([P.waitForEvent('download'), ev(() => exportSchedaDocx())]);
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const t = (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
const iP = t.indexOf('Sviluppo Personale'), iC = t.indexOf('Sviluppo Comunitario'), iS = t.indexOf('Sviluppo Spirituale');
ok(iP >= 0 && iP < iC && iC < iS, 'Word: Personale, poi Comunitario, poi Spirituale');
// bozza della 1.3: valori salvati come testo e ambito senza valori bassi
await ev(() => { obs.P1 = '3'; obs.P2 = '2'; ossAutoSync('P'); });
ok(/Corporeità/.test(await ev(() => ossDraft('P', 'neg'))), '1.3: valori salvati come testo letti correttamente');
await ev(() => { DB.S.forEach(p => { obs[p.id] = 7; }); scheda.osservazione.S.necessita = 'Il mio testo'; (scheda._userEditedA = scheda._userEditedA || {}).S_neg = true; goPhaseInternal(2); });
await sleep(600);
await P.locator('#g-lettura button[onclick*="ossResync(\'S\',\'neg\'"]').click(); await sleep(400);
ok(await ev(() => scheda.osservazione.S.necessita) === 'Il mio testo', '1.3: senza valori bassi la bozza non cancella il testo');
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 2).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
