// Piano di Gruppo (23/11): la pagina — home, creazione, obiettivi/azioni, quadro sinottico, avvisi, unione obiettivi,
// salvataggio automatico, modifiche di due persone insieme, ruoli, accesso, storico. Poi con il database NON aggiornato.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB();
const W = {};
async function entra(chi, nome, ruolo = 'cg'){
  const pa = await person(br, db); const P = pa.page;
  const u = db.addUser(chi + '@x.it', 'password123', nome);
  db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
  await loginAs(P, base, u); await sleep(2200);
  W[chi] = {pa, P, u, ev: (f, a) => P.evaluate(f, a)}; return W[chi];
}
const luca = await entra('luca', 'Luca Titolare'), vice = await entra('vice', 'Vice Cotitolare', 'vcg'), coll = await entra('coll', 'Collab Orata', 'cu');
const lett = await entra('lett', 'Lettore Commissario', 'cds'), cu2 = await entra('cu2', 'Capo Unita', 'cu');
const dbPiano = () => db.t.pee_piani[0];
// aspetta che la pagina abbia salvato
const salvato = async (w, ms = 6000) => { const t0 = Date.now(); while(Date.now() - t0 < ms){ if(await w.ev(() => !PN.dirty && !PN.saving)) return true; await sleep(150); } return false; };
const txt = (w, sel) => w.ev((s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const cnt = (w, sel) => w.ev((s) => document.querySelectorAll(s).length, sel);
const fill = async (w, sel, v) => { await w.P.fill(sel, v); };
const sez = async (w, id) => { await w.ev(i => pnSez(i), id); await sleep(300); };

// ── 1. home ──
ok(await cnt(luca, "#sh-piani button[onclick=\"pnNuovo('gruppo')\"]") === 1, 'il Capo Gruppo vede «+ Nuovo Piano di Gruppo» in home');
ok(await cnt(coll, "#sh-piani button[onclick=\"pnNuovo('gruppo')\"]") === 0, 'un Capo Unità non vede il pulsante');
ok(await cnt(cu2, '#sh-piani button') === 0, 'chi non ha piani e non può crearli (Capo Unità) non vede nulla');
ok(await cnt(lett, "#sh-piani button[onclick=\"pnNuovo('sezione')\"]") === 1, 'il Commissario vede «+ Nuovo Progetto di Sezione», non quello di Gruppo');

// ── 2. creare ──
await luca.P.click("#sh-piani button[onclick=\"pnNuovo('gruppo')\"]"); await sleep(400);
ok(await cnt(luca, '#sh-dlg #pn-n-anno') === 1 && /Pesaro/.test(await luca.ev(() => document.getElementById('pn-n-tit').value)), 'si apre la finestra di creazione, con titolo suggerito dal profilo');
const anni = await luca.ev(() => [...document.getElementById('pn-n-anno').options].map(o => o.textContent));
ok(anni.length === 3 && /\d{4}.{1,3}\d{2,4}/.test(anni[0]), 'tre anni scout tra cui scegliere («' + anni.join(' | ') + '»)');
await luca.P.click('#pn-n-ok'); await sleep(1200);
ok(await luca.ev(() => SH.view) === 'piano' && !!dbPiano() && dbPiano().tipo === 'gruppo' && dbPiano().durata === 3, 'il piano è creato e si apre la pagina');
const pid = dbPiano().id;
ok((await txt(luca, '.pn-card .sh-sub')) .includes('anno 1 di 3') || /anno 1 di 3|inizia nell/.test(await txt(luca, '.pn-card .sh-sub')), 'la testata dice a che anno siamo');
await sez(luca, 'ana');
ok(await cnt(luca, '.pn-sug') >= 6, 'ci sono i suggerimenti per i titoli di «Dove siamo»');
await sez(luca, 'pan');
ok(await cnt(luca, '#pn-sin table') === 0 && /compare quando scrivi/.test(await txt(luca, '#pn-sin')), 'il quadro sinottico è in vista, con la spiegazione quando è vuoto');

// ── 3. dove siamo ──
await sez(luca, 'ana');
await luca.P.click('.pn-sug >> text=Punti di forza e di debolezza'); await sleep(200);
ok(await cnt(luca, '.pn-an') === 1, 'un suggerimento aggiunge un titolo');
await luca.P.fill('.pn-an .pn-ta', 'Tanti Capi giovani, sede piccola'); await sleep(200);
const sv = await salvato(luca); ok(sv && dbPiano().data.analisi[0].testo === 'Tanti Capi giovani, sede piccola' && dbPiano().rev >= 2, 'il testo si salva da solo (rev ' + dbPiano().rev + ', salvato=' + sv + ', db=' + JSON.stringify(dbPiano().data.analisi) + ')');
ok(!(await luca.ev(() => [...document.querySelectorAll('.pn-sug')].some(b => /Punti di forza/.test(b.textContent)))), 'il titolo già usato non è più suggerito');

// ── 4. obiettivi e azioni ──
await sez(luca, 'obi');
await luca.P.click('text=+ Obiettivo'); await sleep(250);
await luca.P.fill('.pn-ob .pn-ta >> nth=0', 'Più tempo con le famiglie'); await sleep(150);
await luca.P.click('.pn-ob .pn-chip >> text=Educativa'); await luca.P.click('.pn-ob .pn-chip >> text=Territorio'); await sleep(200);
await luca.P.click('.pn-ob button >> text=+ Azione'); await sleep(250);
await luca.P.fill('.pn-az .pn-ta >> nth=0', 'Due serate con i genitori'); await sleep(100);
await luca.P.fill('.pn-az [id^="pn-azd-"]', 'Abbiamo fatto due serate?');
await luca.P.selectOption('.pn-az select[id^="pn-azr-"]', '__altro'); await luca.P.fill('.pn-az [id^="pn-azrx-"]', 'Anna Rossi'); await sleep(100);
await luca.P.click('.pn-az .pn-chip >> text=Consiglio di Gruppo');
await luca.P.selectOption('.pn-az select[id^="pn-azs-"]', 'in_corso');
await luca.P.selectOption('.pn-az select[id^="pn-azi-"]', await luca.ev(() => document.querySelector('.pn-az select[id^="pn-azi-"] option[value^="20"]').value));   // 27/11: il mese di inizio
ok(await salvato(luca), 'tutto salvato');
const dd = dbPiano().data;
ok(dd.obiettivi.length === 1 && dd.obiettivi[0].aree.join() === 'educativa,territorio' && dd.azioni.length === 1 && dd.azioni[0].ob === dd.obiettivi[0].id, 'obiettivo con due aree (in ordine) e un\'azione collegata');
ok(dd.azioni[0].ref === 'Anna Rossi' && dd.azioni[0].chi.join() === 'cdg' && dd.azioni[0].stato === 'in_corso' && dd.azioni[0].indicatore === 'Abbiamo fatto due serate?', 'referente, chi, stato e indicatore salvati');
await sez(luca, 'pan');
ok(await cnt(luca, '#pn-sin table tbody tr') === 1 && /1 azioni: 0 fatte, 1 in corso, 0 da iniziare/.test(await txt(luca, '#pn-sin')), 'il quadro sinottico mostra l\'obiettivo e il conto delle azioni');
const tot = await luca.ev(() => [...document.querySelectorAll('#pn-sin tfoot td')].map(x => x.textContent.trim()));
ok(tot.join() === '1,0,0,0,1,0', 'totali per area: educativa 1, territorio 1 («' + tot.join() + '»)');
ok(await cnt(luca, '.pn-avv') === 0, 'con un piano in ordine non compaiono consigli');

// ── 5. avvisi ──
await sez(luca, 'obi');
await luca.P.click('text=+ Obiettivo'); await sleep(200);
let av = await txt(luca, '.pn-avv');
ok(av && /Senza azioni: obiettivo 2/.test(av) && /Senza etichetta di area: obiettivo 2/.test(av), 'un obiettivo senza azioni e senza area fa comparire il consiglio');
for(let i = 0; i < 9; i++){ await luca.P.click('text=+ Obiettivo', {timeout:3000}); await sleep(60); }
av = await txt(luca, '.pn-avv');
ok(/Ci sono 11 obiettivi: di solito ne bastano 6-8/.test(av), 'sopra 10 obiettivi: avviso gentile («' + (av || '').slice(0, 80) + '…»)');
ok(await salvato(luca) && dbPiano().data.obiettivi.length === 11, 'il piano con 11 obiettivi si salva comunque (l\'avviso non blocca)');

// ── 6. unire ──
await luca.ev(() => { PN.d.obiettivi = PN.d.obiettivi.slice(0, 3); PN.d.azioni = PN.d.azioni.filter(a => PN.d.obiettivi.some(o => o.id === a.ob)); pnTouch(); pnRender(); });
await luca.P.fill('#pn-obt-' + await luca.ev(() => PN.d.obiettivi[1].id), 'Famiglie coinvolte nella vita del Gruppo');
await luca.P.click('.pn-ob >> nth=1 >> .pn-chip >> text=Educativa'); await sleep(150);
ok(await luca.ev(() => document.getElementById('pn-unisci').disabled) === true, '«Unisci» è spento con meno di due obiettivi selezionati');
await luca.P.check('.pn-ob >> nth=0 >> .pn-sel input'); await luca.P.check('.pn-ob >> nth=1 >> .pn-sel input'); await sleep(100);
ok(await luca.ev(() => document.getElementById('pn-unisci').disabled) === false, 'con due selezionati si accende');
await luca.P.click('#pn-unisci'); await sleep(300);
ok(/Più tempo con le famiglie/.test(await luca.ev(() => document.getElementById('pn-u-t').value)) && /Famiglie coinvolte/.test(await luca.ev(() => document.getElementById('pn-u-t').value)), 'la finestra propone il testo unendo i due');
await luca.P.fill('#pn-u-t', 'Famiglie protagoniste del Gruppo'); await luca.P.click('text=Unisci >> nth=-1'); await sleep(500);
const du = await luca.ev(() => PN.d);
ok(du.obiettivi.length === 2 && du.obiettivi[0].testo === 'Famiglie protagoniste del Gruppo' && du.obiettivi[0].aree.join() === 'educativa,territorio', 'due obiettivi diventano uno, con le aree sommate');
ok(du.uniti.length === 2 && du.azioni.every(a => a.ob === du.obiettivi[0].id) && du.azioni.length === 1, 'gli originali restano come nota e l\'azione passa al nuovo obiettivo');
await sez(luca, 'uni');
ok(await cnt(luca, '.pn-un') === 2, 'gli obiettivi uniti si leggono in fondo alla pagina');
ok(await salvato(luca), 'salvato dopo l\'unione');

// ── 7. spunti ──
await sez(luca, 'spu');
await luca.P.click('text=+ Uno spunto'); await sleep(150);
await luca.P.fill('.pn-sp [id^="pn-spd-"]', 'Lupetti'); await luca.P.fill('.pn-sp [id^="pn-spx-"]', 'Servono più giochi di squadra tra le Unità'); await sleep(100);
await luca.P.click('.pn-sp button >> text=→ Obiettivo'); await sleep(300);
const d7 = await luca.ev(() => PN.d);
ok(d7.spunti.length === 0 && d7.obiettivi.length === 3 && d7.obiettivi[2].origine === 'unita' && d7.obiettivi[2].ricadute === true && /Lupetti/.test(d7.obiettivi[2].rif), 'lo spunto diventa obiettivo con origine «Unità» e ricadute');

// ── 8. stato e delibera ──
await sez(luca, 'pan');
ok(await luca.ev(() => document.getElementById('pn-delw').hidden) === true, 'in bozza la delibera è nascosta');
await luca.P.selectOption('#pn-stato', 'deliberato'); await sleep(300);
ok(await luca.ev(() => !document.getElementById('pn-delw').hidden), 'deliberato: compaiono data e luogo');
await luca.P.fill('#pn-delD', '2026-10-15'); await luca.P.fill('#pn-delL', 'Sede del Gruppo');
ok(await salvato(luca) && dbPiano().stato === 'deliberato' && dbPiano().data.delibera.data === '2026-10-15', 'stato e delibera salvati');
await sleep(600);
ok(db.t.pee_piani_versioni.some(v => v.motivo === 'stato' && v.stato === 'deliberato'), 'il cambio di stato lascia una versione nello storico');

// ── 9. accesso ──
await luca.P.click('text=Chi ha accesso'); await sleep(500);
ok(await cnt(luca, '#pn-sh #pn-i-m') === 1, 'il titolare vede il modulo di invito');
await luca.P.fill('#pn-i-m', 'VICE@x.it'); await luca.P.selectOption('#pn-i-e', 'Vice Capo Gruppo');
ok(await luca.ev(() => document.getElementById('pn-i-r').value) === 'collaboratore', 'scegliendo «Vice Capo Gruppo» il ruolo suggerito è collaboratore');
await luca.P.selectOption('#pn-i-r', 'cotitolare'); await luca.P.click('#pn-i-ok'); await sleep(700);
ok(await luca.ev(() => /Invitato/.test(document.getElementById('pn-sh-msg').textContent)) && db.t.pee_piani_membri.some(m => m.email === 'vice@x.it' && m.ruolo === 'cotitolare'), 'invito al co-titolare registrato');
await luca.P.fill('#pn-i-m', 'coll@x.it'); await luca.P.selectOption('#pn-i-r', 'collaboratore'); await luca.P.click('#pn-i-ok'); await sleep(600);
await luca.P.fill('#pn-i-m', 'lett@x.it'); await luca.P.selectOption('#pn-i-e', 'Commissario di Sezione'); await luca.P.click('#pn-i-ok'); await sleep(600);
ok(db.t.pee_piani_membri.length === 3 && db.t.pee_piani_membri.find(m => m.email === 'lett@x.it').ruolo === 'lettore', 'tre persone invitate, il Commissario come lettore');
await luca.P.fill('#pn-i-m', 'sbagliata'); await luca.P.click('#pn-i-ok'); await sleep(200);
ok(/non è valido/.test(await txt(luca, '#pn-sh-msg')), 'e-mail non valida: messaggio chiaro');
await luca.P.click('#sh-dlg >> text=Chiudi'); await sleep(200);

// ── 10. ruoli: aprire il piano da altre persone ──
await lett.ev(() => { shGoHome(); }); await sleep(1200);
ok(await cnt(lett, '#sh-piani .pn-row') === 1 && /nuovo/.test(await txt(lett, '#sh-piani')), 'il Commissario trova il piano tra i condivisi, segnato «nuovo»');
await lett.P.click('#sh-piani .pn-row button'); await sleep(1200);
await sez(lett, 'obi');
ok(await lett.ev(() => PN.ruolo) === 'lettore' && await cnt(lett, 'button[onclick="pnObAdd()"]') === 0 && await cnt(lett, '.pn-ob .pn-ta:not([disabled])') === 0, 'il lettore vede il piano ma non può scrivere nulla');
ok(/Sola lettura/.test(await txt(lett, '#pn-st')) && await lett.ev(() => !db_visto()).catch(() => true), 'la pagina dice «Sola lettura»');
await sleep(500);
ok(db.t.pee_piani_membri.find(m => m.email === 'lett@x.it').visto_il != null, 'aprire il piano segna l\'invito come visto');
ok(await cnt(lett, '#pn-ob-t ~ * #pn-unisci') === 0 && await cnt(lett, '.pn-sel') === 0, 'il lettore non ha «Unisci» né le caselle di selezione');
await lett.P.click('text=Chi ha accesso'); await sleep(500);
ok(await cnt(lett, '#pn-i-m') === 0, 'il lettore non può invitare');
await lett.P.click('#sh-dlg >> text=Chiudi'); await sleep(200);

// collaboratore: solo le azioni di cui è referente (clMyName() è «Collab Orata»)
await luca.ev(() => { const a = PN.d.azioni[0]; a.ref = 'Collab Orata'; PN.d.azioni.push({id:'zz1', ob:PN.d.obiettivi[0].id, testo:'Azione di altri', inizio:1, verifica:'ogni', indicatore:'', chi:[], ref:'Altra Persona', stato:'da_iniziare', genitori:false}); pnTouch(); });
ok(await salvato(luca), 'il titolare affida un\'azione al collaboratore');
await coll.ev(() => { shGoHome(); }); await sleep(1000);
await coll.P.click('#sh-piani .pn-row button'); await sleep(1200);
ok(await coll.ev(() => PN.ruolo) === 'collaboratore', 'il collaboratore apre il piano');
await sez(coll, 'obi');
const dis = await coll.ev(() => [...document.querySelectorAll('.pn-az')].map(a => [a.querySelector('.pn-ta').disabled, a.querySelector('select').disabled]));
ok(dis.length === 2 && dis[0][0] === false && dis[0][1] === false && dis[1][0] === true && dis[1][1] === true, 'può modificare solo l\'azione di cui è referente');
ok(await cnt(coll, 'button[onclick="pnObAdd()"]') === 0 && await cnt(coll, '.pn-tit:not([disabled])') === 0, 'non aggiunge obiettivi né cambia il titolo');
const idA = await coll.ev(() => PN.d.azioni[0].id);
await coll.P.selectOption('#pn-azs-' + idA, 'fatta'); await coll.P.fill('#pn-azd-' + idA, 'Fatte due serate: sì');
ok(await salvato(coll) && dbPiano().data.azioni[0].stato === 'fatta' && dbPiano().data.azioni[0].indicatore === 'Fatte due serate: sì', 'il collaboratore salva lo stato della sua azione');
ok(dbPiano().data.obiettivi.length === 3 && dbPiano().titolo, 'il resto del piano è rimasto com\'era');

// ── 11. due persone insieme ──
// vice e luca aprono lo stesso piano; luca scrive A, vice scrive B su un altro obiettivo → entrambi restano
await vice.ev(() => { shGoHome(); }); await sleep(1000);
await vice.P.click('#sh-piani .pn-row button'); await sleep(1200);
await luca.ev(() => pnRicarica(false)); await sleep(500);
await luca.ev(() => { PN.live && 0; });
// blocco gli aggiornamenti in tempo reale per simulare il conflitto
const idObs = await luca.ev(() => PN.d.obiettivi.map(o => o.id));
await vice.ev((i) => { const o = PN.d.obiettivi.find(x => x.id === i); o.testo = 'Testo scritto da Vice'; pnTouch(); }, idObs[1]);
await luca.ev((i) => { const o = PN.d.obiettivi.find(x => x.id === i); o.testo = 'Testo scritto da Luca'; PN.d.analisi[0].testo = 'Analisi di Luca'; pnTouch(); }, idObs[2]);
ok(await salvato(vice) && await salvato(luca, 9000), 'entrambi salvano senza errori');
await sleep(500);
const fin = dbPiano().data;
ok(fin.obiettivi[1].testo === 'Testo scritto da Vice' && fin.obiettivi[2].testo === 'Testo scritto da Luca' && fin.analisi[0].testo === 'Analisi di Luca', 'le modifiche su punti diversi si sommano: nessuno perde nulla');
// stesso punto: vince chi salva per ultimo, ma la versione dell'altro resta nello storico
const nv = db.t.pee_piani_versioni.length;
await luca.ev((i) => { PN.d.obiettivi.find(x => x.id === i).testo = 'Versione di Luca'; pnTouch(); }, idObs[0]);   // Luca ha scritto ma non ha ancora salvato
await vice.ev((i) => { PN.d.obiettivi.find(x => x.id === i).testo = 'Versione di Vice'; pnTouch(); pnSave(); }, idObs[0]);
await sleep(300);
ok(await salvato(luca, 9000) && await salvato(vice, 9000), 'stesso punto toccato da entrambi: salvataggi conclusi');
await sleep(500);
ok(db.t.pee_piani_versioni.length > nv && db.t.pee_piani_versioni.some(v => v.motivo === 'auto' && /due persone/.test(v.nota)), 'prima di unire resta una copia automatica nello storico');
ok(/Versione di (Luca|Vice)/.test(dbPiano().data.obiettivi[0].testo), 'il piano ha una delle due versioni, non un miscuglio («' + dbPiano().data.obiettivi[0].testo + '»)');
// unit test dell'unione
const m = await luca.ev(() => {
  const base = {obiettivi:[{id:'a', testo:'A'}, {id:'b', testo:'B'}], azioni:[{id:'x', ob:'a', testo:'X'}], t:'1'};
  const loc = {obiettivi:[{id:'a', testo:'A2'}, {id:'b', testo:'B'}, {id:'c', testo:'C'}], azioni:[{id:'x', ob:'a', testo:'X'}], t:'1'};
  const rem = {obiettivi:[{id:'a', testo:'A'}, {id:'b', testo:'B2'}, {id:'d', testo:'D'}], azioni:[{id:'x', ob:'a', testo:'X'}, {id:'y', ob:'b', testo:'Y'}], t:'2'};
  const r = pnMerge(base, loc, rem); return {o:r.data.obiettivi.map(o => o.id + ':' + o.testo).join(), a:r.data.azioni.map(a => a.id).join(), t:r.data.t, overl:r.overl};
});
ok(m.o === 'a:A2,b:B2,d:D,c:C' && m.a === 'x,y' && m.t === '2' && m.overl === 0, 'unione: A2 (mio), B2 (altro), nuovi D e C, azione Y, testo 2 («' + m.o + ' | ' + m.a + '»)');
const m2 = await luca.ev(() => { const r = pnMerge({o:[{id:'a', testo:'A'}]}, {o:[]}, {o:[{id:'a', testo:'A cambiato'}]}); return {n:r.data.o.length, overl:r.overl}; });
ok(m2.n === 1 && m2.overl === 1, 'un obiettivo tolto da me ma modificato da altri non si perde');

// ── 12. storico ──
await luca.P.click('.pn-bar button >> text=Storico'); await sleep(600);
ok(await cnt(luca, '#pn-sv .pn-sh-r') >= 2, 'lo storico elenca le versioni');
await luca.P.fill('#pn-v-n', 'Dopo il Consiglio di ottobre'); await luca.P.click('#pn-v-ok'); await sleep(700);
ok(db.t.pee_piani_versioni.some(v => v.motivo === 'manuale' && v.nota === 'Dopo il Consiglio di ottobre'), 'si salva una versione a mano con la nota');
await luca.ev(() => shDlgClose()); await sleep(200);
const nObPrima = dbPiano().data.obiettivi.length;
await luca.ev(() => { PN.d.obiettivi.pop(); pnTouch(); }); await salvato(luca);
await luca.P.click('.pn-bar button >> text=Storico'); await sleep(500);
await luca.P.click('#pn-sv .pn-sh-r:has-text("Dopo il Consiglio") button >> text=Ripristina'); await sleep(1200);
ok(dbPiano().data.obiettivi.length === nObPrima, 'ripristinare riporta gli obiettivi com\'erano');
ok(db.t.pee_piani_versioni.some(v => v.motivo === 'auto' && /prima di ripristinare/i.test(v.nota)), 'prima di ripristinare resta una copia di com\'era');
await lett.P.click('.pn-bar button >> text=Storico'); await sleep(500);
ok(await cnt(lett, '#pn-v-n') === 0 && await cnt(lett, 'button[onclick^="pnRipristina"]') === 0, 'il lettore vede lo storico ma non salva né ripristina');
await lett.P.click('#sh-dlg >> text=Chiudi');

// ── 13. durata e anno ──
ok(await luca.ev(() => pnAnnoTxt({anno_inizio:annoScoutStart(), durata:3})) === 'anno 1 di 3', 'primo anno: «anno 1 di 3»');
ok(await luca.ev(() => pnAnnoTxt({anno_inizio:annoScoutStart() - 3, durata:4})) === 'quarto anno: staffetta', 'quarto anno: staffetta');
ok(await luca.ev(() => pnAnnoTxt({anno_inizio:annoScoutStart() - 5, durata:3})) === 'periodo concluso', 'oltre la durata: periodo concluso');
ok(await luca.ev(() => pnAnnoTxt({anno_inizio:annoScoutStart() + 1, durata:3})) !== '', 'piano che inizia l\'anno dopo: testo chiaro');

// ── 14. tornare alla home ──
await luca.ev(() => { PN.d.analisi[0].testo = 'Ultima modifica'; pnTouch(); });
await luca.P.click('.pn-back'); await sleep(1500);
ok(await luca.ev(() => SH.view) === 'home' && dbPiano().data.analisi[0].testo === 'Ultima modifica', 'tornando alla home si salva ciò che non era ancora salvato');
ok(await cnt(luca, '#sh-piani .pn-row') === 1 && /Piano di Gruppo/.test(await txt(luca, '#sh-piani .pn-row b')), 'il piano compare in «I tuoi piani»');
ok(await cnt(luca, '#sh-piani .pn-row') === 1 && await luca.ev(() => !!document.querySelector('#sh-piani h2')), 'titolo dell\'elenco presente');

// ── 15. database non ancora aggiornato ──
const db2 = new FakeDB(); db2.sqlPiani = false;
const pb = await person(br, db2); const u2 = db2.addUser('old@x.it', 'password123', 'Capo Gruppo Vecchio');
db2.t.pee_profili.push({user_id:u2.id, nome:'Capo Gruppo Vecchio', ruolo:'cg', branca:null, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
await loginAs(pb.page, base, u2); await sleep(2500);
ok(/script SQL del 23 novembre/.test(await pb.page.evaluate(() => (document.getElementById('sh-piani') || {}).textContent || '')) && await pb.page.evaluate(() => document.querySelectorAll('#sh-piani button').length) === 0, 'senza tabelle: la home dice che serve l\'aggiornamento e non offre il pulsante');
const rest = await pb.page.evaluate(() => !!document.querySelector('.sh-wrap') && !!document.querySelector('.sh-prof-line'));
ok(rest, 'il resto della home funziona come prima');

// ── errori di pagina ──
const pg = await luca.ev(async () => { pnOpen('00000000-0000-0000-0000-000000000000'); await new Promise(r => setTimeout(r, 900)); return document.querySelector('.sh-wrap h1') ? document.querySelector('.sh-wrap h1').textContent : null; });
ok(pg === 'Piano non trovato', 'un piano che non esiste: messaggio chiaro («' + pg + '»)');

for(const k of Object.keys(W)){ const er = W[k].pa.errors; ok(!er.length, 'nessun errore di pagina per ' + k + (er.length ? ': ' + er[0].slice(0, 200) : '')); }
process.exit(summary() ? 1 : 0);
