// Giro del Piano di Gruppo (24/11): apertura, carte di ambito (con nome, a vista incrociata), Mazzo persona anonimo, chiusura e registro,
// poi con il database NON aggiornato (db.sqlGiri = false).
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
const lett = await entra('lett', 'Lettore Cu', 'cu'), cu2 = await entra('cu2', 'Capo Unita', 'cu'), cu3 = await entra('cu3', 'Terzo Capo', 'cu');
const txt = (w, sel) => w.ev((s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const cnt = (w, sel) => w.ev((s) => document.querySelectorAll(s).length, sel);
const giSalvato = async (w, ms = 6000) => { const t0 = Date.now(); while(Date.now() - t0 < ms){ if(await w.ev(() => !GI.drDirty && !GI.saving)) return true; await sleep(150); } return false; };
const apri = async (w, id) => { await w.ev(i => { pnOpen(i); }, id); await sleep(1200); };
const vaiGiro = async w => { await w.ev(() => pnSez('g-giro')); await sleep(800); };
const sez = async (w, id) => { await w.ev(i => pnSez(i), id); await sleep(500); };

// ── un piano con persone invitate (inserite direttamente) ──
const pid = await luca.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Piano di prova', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
for(const [w, ru, et] of [[vice, 'cotitolare', 'Vice Capo Gruppo'], [coll, 'collaboratore', 'Capo Unità'], [lett, 'lettore', 'Capo Unità'], [cu2, 'lettore', 'Capo Unità']])
  db.t.pee_piani_membri.push({id:'m-' + w.u.email, piano_id:pid, email:w.u.email, ruolo:ru, etichetta:et, nome:w.u.meta.nome, visto_il:null, invitato_da:luca.u.id, created_at:'2026-11-24T10:00:00Z'});
for(const w of [luca, vice, coll, lett, cu2]) await apri(w, pid);

// ── 1. schede e giro non ancora aperto ──
ok(await cnt(luca, '#pn-sb-pan') === 1 && await cnt(luca, '#pn-sb-g-giro') === 1, 'nel menu a sinistra ci sono «Il Piano» e «Il giro»');
ok(await cnt(luca, '.pn-card') >= 2, 'la parte «Il Piano» è come prima');
await vaiGiro(luca);
ok(await cnt(luca, 'input[name="gi-rit"]') === 3 && await cnt(luca, '#gi-apri') === 1, 'Capo Gruppo: senza giro vede i tre ritmi e «Apri il giro»');
ok(/Prima di parlarne/.test(await txt(luca, '#gi-t ~ .sh-sub')) , 'tono di apertura del giro');
await vaiGiro(coll);
ok(await cnt(coll, '#gi-apri') === 0 && /Non c’è ancora nessun giro aperto/.test(await txt(coll, 'main.pn')), 'un collaboratore non può aprire il giro: gli viene detto che non c’è ancora');
const err = await coll.ev(async id => { try{ await PIANI.giroApri(id, {}); return 'ok'; }catch(e){ return pianoErr(e); } }, pid);
ok(/Solo il titolare o un co-titolare/.test(err), 'il database rifiuta anche la chiamata diretta di un collaboratore (' + err + ')');

// ── 2. si apre il giro ──
await luca.P.click('input[name="gi-rit"][value="rapido"]'); await sleep(150);
const sc4 = await luca.ev(() => document.getElementById('gi-sc').value);
await luca.P.click('input[name="gi-rit"][value="standard"]'); await sleep(150);
const sc7 = await luca.ev(() => document.getElementById('gi-sc').value);
ok(sc4 < sc7, 'cambiando ritmo cambia la scadenza proposta (' + sc4 + ' → ' + sc7 + ')');
await luca.P.click('#gi-apri'); await sleep(1500);
ok(db.t.pee_piani_giri.length === 1 && db.t.pee_piani_giri[0].stato === 'aperto' && db.t.pee_piani_giri[0].ritmo === 'standard' && db.t.pee_piani_giri[0].scadenza === sc7, 'il giro è aperto, ritmo standard, con la scadenza');
ok(/Giro 1 · ritmo standard/.test(await txt(luca, '#gi-t')) && await cnt(luca, '#gi-pas-t') === 1, 'la pagina mostra il giro e «I tuoi passi»');
await sez(luca, 'g-carte');
ok(await cnt(luca, '.gi-carta') >= 5, 'le carte ci sono');
await sez(luca, 'g-giro');
ok((await txt(luca, '#pn-sb-g-giro')).includes('aperto'), 'la voce di menu dice che il giro è aperto');
const err2 = await luca.ev(async id => { try{ await PIANI.giroApri(id, {}); return 'ok'; }catch(e){ return pianoErr(e); } }, pid);
ok(/già un giro aperto/.test(err2), 'un secondo giro insieme al primo non si apre (' + err2 + ')');
await sleep(800);
ok(await cnt(coll, '#pn-sb-g-giro') === 1, 'le altre persone vedono la voce del giro');
await coll.ev(() => giCarica(false)); await sleep(500);
await sez(coll, 'g-carte');
ok(await cnt(coll, '.gi-carta') >= 5 && await cnt(coll, '#gi-ca-t') === 1, 'chi è invitato vede le sue carte (tempo reale)');
ok(await cnt(coll, '#pn-sb-g-altre') === 0, 'prima di consegnare non si vedono le carte delle altre persone');

// ── 3. le carte: bozza, consegna, vista incrociata ──
await coll.P.fill('#gi-c-educativa-v', 'I passaggi di branca sono un po’ improvvisati'); await coll.P.fill('#gi-c-educativa-p', 'Una riunione dei Capi Unità prima dei passaggi');
await coll.P.check('#gi-c-gestionale-b');
ok(await giSalvato(coll), 'la bozza si salva da sola');
let row = db.t.pee_piani_contributi.find(c => c.autore_id === coll.u.id);
ok(row && row.tipo === 'carte' && !row.consegnato && row.data.a.educativa.p.includes('riunione dei Capi Unità') && row.autore_nome === 'Collab Orata', 'nel database: bozza con il nome di chi scrive, non consegnata');
await coll.P.click('button >> text=Consegna le carte'); await sleep(1200);
row = db.t.pee_piani_contributi.find(c => c.autore_id === coll.u.id);
ok(row.consegnato && !!row.consegnato_il, 'consegnate');
await sez(coll, 'g-altre');
ok(await cnt(coll, '#gi-al-t') === 1 && /Ancora nessuna carta consegnata da altre persone/.test(await txt(coll, '#gi-al-t ~ .sh-sub')), 'dopo la consegna compare la sezione delle carte altrui (ancora vuota)');
// lett non ha consegnato: non vede le carte di coll, nemmeno chiedendole direttamente
await sez(lett, 'g-carte');
const vede = await lett.ev(async g => (await PIANI.contributi(g)).length, db.t.pee_piani_giri[0].id);
ok(vede === 0 && await cnt(lett, '#pn-sb-g-altre') === 0, 'chi non ha consegnato non vede le carte delle altre persone (nemmeno dal database)');
await lett.P.fill('#gi-c-territorio-c', 'Nessuno in paese sa chi siamo');
await lett.P.click('button >> text=Consegna le carte'); await sleep(300);
await sleep(1200);
await sez(lett, 'g-altre');
ok(await cnt(lett, '#gi-al-t') === 1 && /Collab Orata/.test(await txt(lett, '#gi-al-t ~ details')) && /improvvisati/.test(await txt(lett, 'main.pn')), 'consegnate le proprie, si leggono quelle delle altre persone, con il nome');
// consegna con tutto vuoto: rifiutata
await sez(cu2, 'g-carte');
await cu2.P.click('button >> text=Consegna le carte'); await sleep(500);
ok(!db.t.pee_piani_contributi.some(c => c.autore_id === cu2.u.id && c.consegnato), 'con tutte le carte vuote la consegna non parte');

// ── 4. chi coordina vede chi ha consegnato, non cosa ──
await luca.ev(() => giCarica(false)); await sleep(800);
const tab = await luca.ev(() => [...document.querySelectorAll('table[aria-label="Consegne del giro"] tbody tr')].map(r => [...r.children].map(c => c.textContent.replace(/\s+/g, ' ').trim())));
ok(tab.length === 5, 'tabella con le cinque persone');
const rc = n => tab.find(r => r[0].includes(n));
ok(rc('Collab')[1] === '●' && rc('Lettore')[1] === '●' && rc('Capo Unita')[1] !== '●' && rc('Vice')[1] !== '●', 'consegnato / non consegnato per persona');
ok(/2 su 5 hanno consegnato le carte/.test(await txt(luca, '#gi-co-t ~ .sh-hint ~ .sh-hint') || await txt(luca, 'main.pn')), 'riepilogo «2 su 5»');
ok(await cnt(coll, '#gi-co-t') === 0, 'chi non coordina non vede la tabella');
const errS = await coll.ev(async g => { try{ await PIANI.giroStato(g); return 'ok'; }catch(e){ return pianoErr(e); } }, db.t.pee_piani_giri[0].id);
ok(/Solo il titolare o un co-titolare/.test(errS), 'e non può chiederla al database');

// ── 5. Mazzo persona: anonimo ──
const gid = db.t.pee_piani_giri[0].id;
await sez(coll, 'g-pers');
await coll.P.click('input[name="gi-p1"][value="piu"]'); await coll.P.fill('#gi-p1-t', 'La burocrazia'); await coll.P.click('input[name="gi-p4"][value="tutor"]'); await coll.P.click('input[name="gi-p4"][value="nessuno"]');
await coll.P.click('input[name="gi-p7"][value="tratti"]'); await coll.P.fill('#gi-p8-t', 'Le riunioni finiscono tardi');
await coll.P.click('#gi-pe-ok'); await sleep(1500);
const ps = db.t.pee_piani_giri_persona.filter(x => x.giro_id === gid), vs = db.t.pee_piani_voci_anonime.filter(x => x.giro_id === gid);
ok(ps.length === 1 && ps[0].user_id === coll.u.id, 'registrato solo che la persona ha risposto');
ok(vs.length === 4 && vs.every(v => Object.keys(v).sort().join() === 'giorno,giro_id,id,piano_id,q,scelta,testo'), 'le risposte non hanno autore né ora (' + vs.map(v => v.q).join(',') + ')');
ok(vs.find(v => v.q === 'p4').scelta.length === 2 && /Le riunioni/.test(vs.find(v => v.q === 'p8').testo) && /^Da sapere: Le riunioni/.test(vs.find(v => v.q === 'p8').testo), 'scelta multipla e testi salvati');
ok(/Hai risposto il/.test(await txt(coll, '#gi-pe-t ~ .sh-sub')) && await cnt(coll, '#gi-pe-ok') === 0, 'dopo l’invio non si può rispondere di nuovo');
const e3 = await coll.ev(async g => { try{ await PIANI.personaInvia(g, [{q:'p1', scelta:['no']}]); return 'ok'; }catch(e){ return pianoErr(e); } }, gid);
ok(/già risposto/.test(e3), 'nemmeno dal database (' + e3 + ')');
ok((await luca.ev(g => PIANI.personaVoci(g), gid)).length === 0, 'a giro aperto nemmeno il titolare legge le risposte');
await luca.ev(() => giCarica(false)); await sleep(800);
const tab2 = await luca.ev(() => [...document.querySelectorAll('table[aria-label="Consegne del giro"] tbody tr')].map(r => [...r.children].map(c => c.textContent.replace(/\s+/g, ' ').trim())));
ok(tab2.find(r => r[0].includes('Collab'))[3] === '●' && tab2.find(r => r[0].includes('Lettore'))[3] !== '●', 'chi coordina vede chi ha risposto, non cosa');
await sez(luca, 'g-pers');
ok(/1 persona ha risposto/.test(await txt(luca, '#gi-pe-t ~ .pn-avv')), 'e quante persone hanno risposto');
await sez(luca, 'g-giro');

// ── 6. scadenza e chiusura anticipata ──
await luca.P.fill('#gi-sc2', '2026-12-31'); await luca.P.click('button >> text=Sposta la scadenza'); await sleep(600);
ok(db.t.pee_piani_giri[0].scadenza === '2026-12-31', 'la scadenza si sposta');
await luca.P.click('button >> text=Chiudi il giro'); await sleep(500);
ok(/Mancano le carte di 3 persone/.test(await txt(luca, '#sh-dlg')), 'la finestra di chiusura dice quante carte mancano');
await luca.P.click('#gi-ch-ok'); await sleep(1500);
const g1 = db.t.pee_piani_giri[0];
ok(g1.stato === 'chiuso' && g1.chiusura_tipo === 'anticipata', 'giro chiuso in anticipo');
const reg = db.t.pee_piani_giri_registro.find(x => x.giro_id === gid);
ok(reg && reg.data.senza_carte.map(x => x.nome).sort().join('|') === 'Capo Unita|Luca Titolare|Vice Cotitolare', 'il registro tiene i nomi di chi non ha consegnato');
ok(reg.data.risposte_persona === 1 && reg.data.senza_persona.length === 4, 'e di chi non ha risposto al Mazzo persona');
ok(/Chi non ha consegnato le carte/.test(await txt(luca, 'main.pn')) && /Vice Cotitolare/.test(await txt(luca, '.pn-avv')) && /Il giro è chiuso\. Ora le carte sono scoperte/.test(await txt(luca, 'main.pn')), 'chi coordina vede i nomi, e il messaggio di chiusura');
await sez(luca, 'g-pers');
ok(/Hanno risposto 1 persona su 5: sotto le 4/.test(await txt(luca, '#gi-pe-t ~ .pn-avv')), 'con meno di 4 risposte restano nascoste (anche a giro chiuso)');
ok((await luca.ev(g => PIANI.personaVoci(g), gid)).length === 0, 'anche chiedendole al database');
await sez(vice, 'g-altre');
ok(await cnt(vice, '#gi-al-t') === 1 && /Collab Orata/.test(await txt(vice, 'main.pn')), 'a giro chiuso le carte sono scoperte anche per chi non le aveva consegnate');
await sez(vice, 'g-carte');
ok(await cnt(vice, '.gi-carta textarea:not([disabled])') === 0, 'e quelle proprie non si cambiano più');
const e4 = await coll.ev(async g => { try{ await PIANI.contributoSalva(g, 'carte', {v:1, a:{}}, true); return 'ok'; }catch(e){ return pianoErr(e); } }, gid);
ok(e4 !== 'ok', 'dopo la chiusura il database rifiuta nuove consegne (' + e4 + ')');
const e5 = await cu2.ev(async g => { try{ await PIANI.personaInvia(g, [{q:'p1', scelta:['no']}]); return 'ok'; }catch(e){ return pianoErr(e); } }, gid);
ok(/chiuso/.test(e5), 'e nuove risposte anonime (' + e5 + ')');

// ── 7. secondo giro: con 4 risposte le risposte anonime si leggono, mescolate ──
await luca.ev(async id => { await PIANI.giroApri(id, {ritmo:'rapido'}); }, pid);
await sleep(600);
const gid2 = db.t.pee_piani_giri.find(x => x.n === 2).id;
const risposte = [[luca, 'p1', 'come'], [vice, 'p1', 'meno'], [coll, 'p1', 'piu'], [lett, 'p1', 'come']];
for(const [i, [w, q, s]] of risposte.entries()) await w.ev(async ([g, q, s, t]) => { await PIANI.personaInvia(g, [{q, scelta:[s], testo:t}, {q:'p7', scelta:['fatica'], testo:''}]); }, [gid2, q, s, 'testo ' + s + ' ' + (i + 1)]);
await luca.ev(g => PIANI.giroChiudi(g, 'completa'), gid2); await sleep(500);
const v2 = await luca.ev(g => PIANI.personaVoci(g), gid2);
ok(v2.length === 8, 'con 4 risposte chi coordina le legge (' + v2.length + ' voci)');
const e6 = await coll.ev(async g => (await PIANI.personaVoci(g)).length, gid2);
ok(e6 === 0, 'chi non coordina non le legge mai');
await luca.ev(() => giCarica(false)); await sleep(1000);
await sez(luca, 'g-pers');
const html = await luca.ev(() => document.getElementById('gi-pe-t').parentNode.textContent.replace(/\s+/g, ' '));
ok(/Hanno risposto 4 persone/.test(html) && /Più di quanto mi aspettassi: 1/.test(html) && /Come me lo aspettavo: 2/.test(html), 'si vedono i conteggi delle risposte chiuse');
ok(/in ordine casuale/.test(html) && /testo come/.test(html) && /C’è chi fa fatica/.test(html), 'testi liberi in ordine casuale e segnale di disagio aggregato');
ok(!/Luca Titolare|Vice Cotitolare|Collab Orata|Lettore Cu/.test(html), 'nessun nome accanto alle risposte');

// ── 8. database non aggiornato ──
db.t.pee_piani_giri.length = 0;
db.sqlGiri = false;
const nuova = await entra('late', 'Persona Tardiva', 'cg');
const pid2 = await nuova.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Altro piano', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
await apri(nuova, pid2);
ok(await cnt(nuova, '#pn-sb-g-giro') === 0 && await cnt(nuova, '.pn-card') >= 2, 'senza lo script del 24 novembre il piano funziona come prima, senza schede del giro');
const m = await nuova.ev(async () => { try{ await PIANI.giroApri(PN.p.id, {}); return 'ok'; }catch(e){ return pianoErr(e); } });
ok(/24 novembre/.test(m), 'messaggio chiaro se si prova ad aprire un giro (' + m + ')');
for(const k of Object.keys(W)){ const e = W[k].pa.errors; if(e.length) console.log('  errori pagina', k, e.slice(0, 2).join(' | ').slice(0, 300)); }
const nerr = Object.values(W).reduce((n, w) => n + w.pa.errors.length, 0);
ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')');
await br.close(); const f = summary(); process.exit(f ? 1 : 0);
