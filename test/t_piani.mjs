// Piani (23/11): livello dati nell'app — crea, apri, salva con controllo delle modifiche contemporanee, storico, inviti al piano
// 5 persone: titolare, co-titolare, collaboratore, lettore, estranea. Poi lo stesso con il database NON ancora aggiornato.
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
const lett = await entra('lett', 'Lettore Commissario', 'cds'), estr = await entra('estr', 'Estranea', 'cu');
const errDi = async (w, code) => w.ev(`(async () => { try{ ${code}; return null; }catch(e){ return {code:e.code || '', msg:pianoErr(e), conflitto:!!e.conflitto, raw:String(e.message || e)}; } })()`);

// ── 1. «pronto» ──
ok(await luca.ev(() => PIANI.pronto()) === true, 'il database con le tabelle dei piani risulta pronto');

// ── 2. creare, aprire ──
const p0 = await luca.ev(() => PIANI.crea({tipo:'gruppo', titolo:'Piano di Gruppo 2026-2029', anno_inizio:2026, durata:3, data:{analisi:{}, obiettivi:[{id:'o1', testo:'Più Capi Unità'}], azioni:[]}}));
ok(p0 && p0.id && p0.rev === 1 && p0.ruolo === 'titolare' && p0.owner_email === 'luca@x.it', 'il titolare crea un piano (rev 1, ruolo titolare)');
ok((await errDi(luca, `await PIANI.crea({tipo:'inventato', anno_inizio:2026})`)) !== null, 'un tipo di piano non ammesso è rifiutato');
ok((await errDi(luca, `await PIANI.crea({tipo:'clan', anno_inizio:2026, durata:5})`)) !== null, 'una durata diversa da 3 o 4 è rifiutata');
ok((await luca.ev(() => PIANI.elenco())).length === 1 && (await luca.ev(() => PIANI.elenco('clan'))).length === 0, 'l\'elenco mostra il piano e filtra per tipo');
ok((await luca.ev(() => PIANI.elenco()))[0].data === undefined, 'l\'elenco non porta il contenuto');
ok((await estr.ev(() => PIANI.elenco())).length === 0 && await estr.ev((id) => PIANI.apri(id), p0.id) === null, 'un\'estranea non vede nulla');

// ── 3. inviti ──
await luca.ev((id) => PIANI.invita(id, 'VICE@x.it', 'cotitolare', 'Vice Capo Gruppo', 'Vice'), p0.id);
await luca.ev((id) => PIANI.invita(id, 'coll@x.it', 'collaboratore', '', ''), p0.id);
await luca.ev((id) => PIANI.invita(id, 'lett@x.it', 'lettore', 'Commissario', 'Commissario'), p0.id);
ok((await luca.ev((id) => PIANI.membri(id), p0.id)).length === 3, 'il titolare ha invitato tre persone (e-mail con maiuscole sistemata)');
const dup = await errDi(luca, `await PIANI.invita('${p0.id}', 'lett@x.it', 'lettore')`);
ok(dup && /già accesso/.test(dup.msg), 'invitare due volte la stessa persona: messaggio chiaro («' + (dup && dup.msg) + '»)');
const nonInv = await errDi(coll, `await PIANI.invita('${p0.id}', 'altra@x.it', 'lettore')`);
ok(nonInv && /permesso/.test(nonInv.msg), 'un collaboratore non può invitare («' + (nonInv && nonInv.msg) + '»)');
ok(await errDi(lett, `await PIANI.invita('${p0.id}', 'altra@x.it', 'lettore')`) !== null, 'un lettore non può invitare');
ok(await errDi(vice, `await PIANI.invita('${p0.id}', 'altra@x.it', 'cotitolare')`) !== null, 'il co-titolare non crea altri co-titolari');
ok(await errDi(vice, `await PIANI.invita('${p0.id}', 'altra@x.it', 'lettore')`) === null, 'il co-titolare invita un lettore');
// inviti ricevuti
const inv = await lett.ev(() => PIANI.inviti());
ok(inv.length === 1 && inv[0].id === p0.id && inv[0].ruolo === 'lettore' && inv[0].nuovo === true && inv[0].etichetta === 'Commissario', 'il lettore trova il piano tra i suoi inviti, «nuovo», con l\'etichetta «Commissario»');
await lett.ev((m) => PIANI.visto(m), inv[0].mid);
ok((await lett.ev(() => PIANI.inviti()))[0].nuovo === false, '«visto» toglie la novità');
ok((await vice.ev(() => PIANI.inviti())).length === 1 && (await estr.ev(() => PIANI.inviti())).length === 0, 'il co-titolare vede il suo invito, l\'estranea nessuno');
ok((await lett.ev((id) => PIANI.membri(id), p0.id)).length === 1 && (await vice.ev((id) => PIANI.membri(id), p0.id)).length === 4, 'il lettore vede solo il proprio invito, il co-titolare tutti');

// ── 4. ruoli ──
const ap = async (w) => (await w.ev((id) => PIANI.apri(id), p0.id));
ok((await ap(vice)).ruolo === 'cotitolare' && (await ap(coll)).ruolo === 'collaboratore' && (await ap(lett)).ruolo === 'lettore' && (await ap(luca)).ruolo === 'titolare', 'ogni persona apre il piano con il proprio ruolo');
ok(await lett.ev(() => PIANI.puoScrivere('lettore')) === false && await luca.ev(() => PIANI.puoScrivere('collaboratore')) === true, 'puoScrivere: lettore no, collaboratore sì');

// ── 5. salvare ──
let pl = await ap(luca);
let n1 = await luca.ev((p) => PIANI.salva(p, {titolo:'Piano di Gruppo 26-29'}), pl);
ok(n1.rev === 2 && n1.titolo === 'Piano di Gruppo 26-29' && n1.ruolo === 'titolare', 'il titolare salva: rev 2');
// il co-titolare ha letto la versione 2 e salva il contenuto
let pv = await ap(vice);
let n2 = await vice.ev((p) => PIANI.salva(p, {data:Object.assign({}, p.data, {obiettivi:p.data.obiettivi.concat([{id:'o2', testo:'Dialogo con le famiglie'}])})}), pv);
ok(n2.rev === 3 && n2.data.obiettivi.length === 2 && n2.updated_by_nome === 'Vice Cotitolare', 'il co-titolare aggiunge un obiettivo (rev 3, autore registrato)');
// conflitto: il titolare salva con la versione vecchia (rev 2)
const conf = await errDi(luca, `await PIANI.salva(${JSON.stringify(n1)}, {titolo:'Sovrascrivo!'})`);
ok(conf && conf.conflitto && conf.code === '40001' && /altra persona/.test(conf.msg), 'salvare con una versione vecchia: conflitto riconosciuto («' + (conf && conf.msg).slice(0, 50) + '…»)');
const dopo = await ap(luca);
ok(dopo.titolo === 'Piano di Gruppo 26-29' && dopo.data.obiettivi.length === 2 && dopo.rev === 3, 'il lavoro del co-titolare non è stato cancellato');
// collaboratore
let pc = await ap(coll);
let n3 = await coll.ev((p) => PIANI.salva(p, {data:Object.assign({}, p.data, {obiettivi:p.data.obiettivi.concat([{id:'o3', testo:'Campo di Gruppo'}])})}), pc);
ok(n3.rev === 4 && n3.data.obiettivi.length === 3, 'il collaboratore aggiunge un obiettivo');
pc = await ap(coll);
const c1 = await errDi(coll, `await PIANI.salva(${JSON.stringify(pc)}, {titolo:'Cambio io'})`);
ok(c1 && /collaboratore non può/i.test(c1.raw) , 'il collaboratore non cambia il titolo («' + (c1 && c1.msg) + '»)');
ok(await errDi(coll, `await PIANI.salva(${JSON.stringify(pc)}, {stato:'approvato'})`) !== null, 'il collaboratore non cambia lo stato');
ok(await errDi(coll, `await PIANI.salva(${JSON.stringify(pc)}, {data:{}})`) !== null, 'il collaboratore non cancella parti del piano');
// lettore
const pL = await ap(lett);
const l1 = await errDi(lett, `await PIANI.salva(${JSON.stringify(pL)}, {titolo:'Cambio io'})`);
ok(l1 && /permesso/.test(l1.msg), 'il lettore non può salvare («' + (l1 && l1.msg) + '»)');
ok((await ap(luca)).titolo === 'Piano di Gruppo 26-29', '…e il titolo è rimasto com\'era');
// stato
let pd = await ap(vice);
const n4 = await vice.ev((p) => PIANI.salva(p, {stato:'deliberato'}), pd);
ok(n4.stato === 'deliberato' && n4.rev === 5, 'il co-titolare segna «deliberato»');
// grandezza
const grande = await errDi(luca, `await PIANI.salva(${JSON.stringify(await ap(luca))}, {data:{x:'a'.repeat(2100000)}})`);
ok(grande && /troppo grande/.test(grande.msg), 'un piano oltre 2 MB è rifiutato con un messaggio chiaro');

// ── 6. storico ──
pl = await ap(luca);
const v1 = await luca.ev((p) => PIANI.versione(p, {motivo:'verifica', nota:'Verifica del primo anno'}), pl);
ok(v1.n === 1 && v1.motivo === 'verifica' && v1.stato === 'deliberato', 'il titolare salva la versione 1 (stato e contenuto del piano)');
const v2 = await coll.ev((p) => PIANI.versione(p, {motivo:'auto'}), await ap(coll));
ok(v2.n === 2, 'il collaboratore salva la versione 2 (numero dal database)');
ok(await errDi(lett, `await PIANI.versione(${JSON.stringify(pL)}, {motivo:'manuale'})`) !== null, 'il lettore non salva versioni');
ok((await lett.ev((id) => PIANI.versioni(id), p0.id)).length === 2 && (await lett.ev((id) => PIANI.versioni(id), p0.id))[0].n === 2, 'il lettore legge lo storico (dal più recente)');
const vd = await lett.ev((id) => PIANI.versioneDati(id), v1.id);
ok(vd && vd.data.obiettivi.length === 3, 'la versione conserva il contenuto di allora');
ok((await estr.ev((id) => PIANI.versioni(id), p0.id)).length === 0, 'l\'estranea non vede lo storico');

// ── 7. cambiare ruolo, revocare, uscire ──
const mlett = (await luca.ev((id) => PIANI.membri(id), p0.id)).find(m => m.email === 'lett@x.it');
await luca.ev((m) => PIANI.cambiaRuolo(m, 'collaboratore'), mlett.id);
ok((await ap(lett)).ruolo === 'collaboratore', 'il titolare promuove il lettore a collaboratore');
const mcoll = (await vice.ev((id) => PIANI.membri(id), p0.id)).find(m => m.email === 'coll@x.it');
await vice.ev((m) => PIANI.revoca(m), mcoll.id);
ok(await coll.ev((id) => PIANI.apri(id), p0.id) === null, 'il co-titolare toglie l\'accesso a un collaboratore: non vede più il piano');
const mlett2 = (await lett.ev(() => PIANI.inviti()))[0];
await lett.ev((m) => PIANI.revoca(m), mlett2.mid);
ok(await lett.ev((id) => PIANI.apri(id), p0.id) === null, 'chi è invitato può uscire dal piano');
// i dati restano al titolare
ok((await ap(luca)).data.obiettivi.length === 3, 'uscite e revoche non toccano il contenuto del piano');

// ── 8. progetto collegato e eliminazione ──
const e1 = await errDi(vice, `await PIANI.elimina('${p0.id}')`);
ok(e1 !== null && (await ap(luca)) !== null, 'il co-titolare non elimina il piano');
await luca.ev((id) => PIANI.elimina(id), p0.id);
ok(await luca.ev((id) => PIANI.apri(id), p0.id) === null && db.t.pee_piani_membri.length === 0 && db.t.pee_piani_versioni.length === 0, 'il titolare elimina il piano: spariscono anche inviti e storico');

// ── 9. database NON ancora aggiornato ──
db.sqlPiani = false;
ok(await luca.ev(() => PIANI.pronto(true)) === false, 'senza lo script SQL: «pronto» dice no');
const mancante = await errDi(luca, `await PIANI.elenco()`);
ok(mancante && /script SQL del 28 novembre/.test(mancante.msg), 'senza lo script SQL: messaggio chiaro («' + (mancante && mancante.msg) + '»)');
ok(await luca.ev(() => PIANI.ok) === false, 'l\'app ricorda che le tabelle mancano (nessuna richiesta ripetuta)');
db.sqlPiani = true;
ok(await luca.ev(() => PIANI.pronto(true)) === true, 'dopo lo script SQL: «pronto» dice sì');

// ── 10. nessun errore di pagina e nessun effetto sul resto ──
for(const k of Object.keys(W)){ const er = await W[k].ev(() => window.__errs || []); ok(!er.length, k + ': nessun errore di pagina' + (er.length ? ' ' + JSON.stringify(er).slice(0, 200) : '')); }
for(const k of Object.keys(W)) await W[k].pa.ctx.close();
await br.close(); process.exit(summary() ? 1 : 0);
