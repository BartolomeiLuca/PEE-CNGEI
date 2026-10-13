// Rimandi: un dato cambiato all'origine arriva aggiornato ovunque (anche dopo una seconda modifica)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
const iS = await ev(() => getAllPercorsi().findIndex(p => p.percorsoId === 'S3'));
// data dell'attività → circolare, calendario, foglio del giorno, stato
for(const [d, giorno] of [['2026-11-14', 'sabato 14 novembre'], ['2026-11-21', 'sabato 21 novembre']]){
  await ev(([p, d]) => { axSet(p, 1, 'data', d); axSet(p, 1, 'dataFine', ''); axSet(p, 1, 'durata', 'giorno'); }, [iS, d]); await sleep(300);
  const r = await ev(p => ({msg: axMsgText(p, 1), ics: (icsEvent(p, 1) || {}).text || JSON.stringify(icsEvent(p, 1) || ''), fdg: fdgHTML(p, 1)}), iS);
  ok(r.msg.toLowerCase().includes(giorno), 'data ' + d + ' → messaggio alle famiglie');
  ok(r.ics.includes(d.replace(/-/g, '')), 'data ' + d + ' → calendario');
  ok(r.fdg.toLowerCase().includes(giorno.split(' ').slice(1).join(' ')), 'data ' + d + ' → foglio del giorno');
}
// ritrovo → circolare
for(const h of ['15:30', '16:00']){ await ev(([p, h]) => axSet(p, 1, 'luogo.ritrovo', h), [iS, h]); ok((await ev(p => axMsgText(p, 1), iS)).includes(h), 'ora del ritrovo ' + h + ' → messaggio'); }
// costi → quota
await ev(p => { const x = axX(p, 1); x.pres = Object.assign({}, x.pres, {rag: 20}); x.spese = [{voce:'Affitto rifugio', importo: 200, carico:'ragazzi'}]; axSave(); }, iS);
const q1 = await ev(p => axQuota(axX(p, 1)), iS);
await ev(p => { axX(p, 1).spese[0].importo = 300; axSave(); }, iS);
const q2 = await ev(p => axQuota(axX(p, 1)), iS);
ok(q2 > q1, 'costi → quota a testa (' + q1 + ' → ' + q2 + ')');
// nome nella tabella dello staff → «Chi ha osservato», persone dell'organizzazione, contatti
await ev(() => { scheda.pp.staffTab[1].nome = 'Paolo Rivabella'; scheda.pp.staffTab[1].tel = '3331112222'; saveData(true); });
const st = await ev(() => ({occ: occChiNames(), ppl: axPeople(), cont: axStaffContatti().map(c => c.n + ':' + (c.tel||''))}));
ok(st.occ.includes('Paolo Rivabella') && st.ppl.some(n => /Paolo Rivabella/.test(n)) && st.cont.some(c => /Paolo/.test(c)), 'nome nello staff → «Chi ha osservato», persone, contatti');
// verifica degli Indicatori → Sezione 5 (segue finché non la si cambia lì)
const iP = await ev(() => getAllPercorsi().findIndex(p => p.percorsoId === 'P5'));
const k = await ev(p => { const per = getAllPercorsi()[p]; const ids = axIdr(per); const x = axX(p, 0); x.oss = x.oss || {}; x.oss[ids[0].k] = {on: true}; saveData(true); return ids[0].k; }, iP);
await ev(([p, k]) => verIdrSet(p, 0, k, 'c', 'stimolato'), [iP, k]);
const c1 = await ev(k => ((scheda.idrComp.P5 || {})[k] || {}).c, k);
await ev(([p, k]) => verIdrSet(p, 0, k, 'c', 'spontaneo'), [iP, k]);
const c2 = await ev(k => ((scheda.idrComp.P5 || {})[k] || {}).c, k);
ok(c1 === 'stimolato' && c2 === 'spontaneo', 'verifica → Sezione 5, anche alla seconda modifica (' + c1 + ' → ' + c2 + ')');
await ev(k => ppIdrSet('P5', k, 'c', 'no'), k);
await ev(([p, k]) => verIdrSet(p, 0, k, 'c', 'stimolato'), [iP, k]);
ok(await ev(k => scheda.idrComp.P5[k].c, k) === 'no', 'scelta fatta a mano nella Sezione 5: la verifica non la sovrascrive');
// Sezione 2 → 3: obiettivo e indicatori
await ev(() => { toggleObiettivo(0, 1, true); toggleIdr(0, 2, true); });
const ob = await ev(() => ({ob: scheda.priorita[0].obiettivi.includes(1), idr: getAllPercorsi()[0].idrSelezionati.includes(2) || scheda.priorita[0].idr.includes(2)}));
ok(ob.ob && ob.idr, 'obiettivi e indicatori della Sezione 2 → Sezione 3');
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 2).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
