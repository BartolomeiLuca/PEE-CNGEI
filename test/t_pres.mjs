// 27/11 sera: Senior (giovani del Clan) leggono in automatico il Progetto di Clan deliberato; Progetto di Sezione letto da Tesoriere e da chi ha la spunta del Comitato.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof2 = (k, nome, ruolo, gr, dash, sez, br2) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:br2 || '', sezione:sez || 'Pesaro', gruppo:gr || '', area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof2('coord', 'Cora Coordinatrice', 'coords'); prof2('comm', 'Dino Commissario', 'cds'); prof2('pres', 'Pia Presidente', 'pres'); prof2('tes', 'Tina Tesoriera', 'tes');
prof2('snr', 'Sandro Senior', 'snr'); prof2('snr2', 'Sara Senior', 'snr'); prof2('snrF', 'Sofia Senior Fano', 'snr', '', {}, 'Fano'); prof2('sis', 'Sergio Servizio', 'senior', '1', {}, 'Pesaro', 'E');
prof2('cuC', 'Ugo Capo Comitato', 'cu', '1', {cos:{membro:true}}, 'Pesaro', 'E'); prof2('cuN', 'Ugo Capo Libero', 'cu', '1', {}, 'Pesaro', 'E'); prof2('vol', 'Vera Volontaria', 'volontario', '1', {cos:{membro:true}});
const ob = (id, t, aree) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false, indirizzi:[]});
const dati = x => Object.assign({v:1, titolareNome:'x', analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], disp:[], spg:[], tappe:[], delibera:{data:'', luogo:''}, sezione:'Pesaro'}, x || {});
const push = (id, own, tipo, stato, anno, d, tit) => db.t.pee_piani.push({id, owner_id:U[own].id, owner_email:own + '@x.it', tipo, titolo:tit || (tipo === 'sezione' ? 'Progetto di Sezione Pesaro' : 'Progetto di Clan Pesaro'), anno_inizio:anno, durata:3, stato, archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:d});
push('c0', 'coord', 'clan', 'bozza', 2026, dati({obiettivi:[ob('b0', 'BOZZA DEL CLAN NON SI VEDE', ['formativa'])]}), 'Clan bozza');
push('c1', 'coord', 'clan', 'deliberato', 2026, dati({obiettivi:[ob('k1', 'Accogliere nuovi Senior', ['formativa']), ob('k2', 'Il Clan al servizio dei Gruppi', ['educativa'])], disp:[{id:'d1', cosa:'Persone per i campi estivi', quanti:'6', quando:'luglio', note:'solo aggregato'}], analisi:[{id:'n1', titolo:'Dove siamo del Clan'}]}), 'Clan deliberato Pesaro');
push('cF', 'coord', 'clan', 'deliberato', 2026, dati({obiettivi:[ob('x1', 'OBIETTIVO DI ALTRA SEZIONE', ['educativa'])], sezione:'Fano'}), 'Clan di Fano');
db.t.pee_piani[db.t.pee_piani.length - 1].owner_id = U.snrF.id;   // il Clan di Fano ha un titolare di Fano
push('s0', 'comm', 'sezione', 'bozza', 2026, dati({obiettivi:[ob('z0', 'PDS BOZZA NON SI VEDE', ['gestionale'])]}), 'PdS bozza');
push('s1', 'comm', 'sezione', 'deliberato', 2026, dati({obiettivi:[ob('z1', 'Formare più Capi in Sezione', ['formativa']), ob('z2', 'Rinnovare le sedi', ['gestionale'])]}), 'Progetto di Sezione Pesaro');
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2200); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const home = S => S.ev(() => (document.getElementById('sh-piani') || {}).textContent || '');
const errs = [];
// ── Senior: legge il Progetto di Clan deliberato, in sola lettura ──
const S = await mk('snr'); S.P.on('pageerror', e => errs.push('snr: ' + e.message));
let h = await home(S);
ok(/Il Progetto di Clan della tua Sezione/.test(h) && /Clan deliberato Pesaro/.test(h) && !/Clan bozza|Clan di Fano/.test(h), 'Senior: in home il Progetto di Clan deliberato della sua Sezione (non la bozza, non un’altra Sezione)');
ok(await S.ev(() => !document.querySelector('#sh-piani button[onclick*="pnNuovo"]')), 'Senior: nessun pulsante «Nuovo…»');
await S.ev(() => document.querySelector('#sh-piani button[onclick*="pnOpen"]').click()); await sleep(2200);
ok(await S.ev(() => SH.view === 'piano' && PN.p && PN.p.id === 'c1' && PN.ruolo === 'lettore'), 'Senior: «Leggi» apre il piano, in sola lettura');
ok(await S.ev(() => /Sola lettura/.test(document.getElementById('pn-st').textContent)), 'Senior: «Sola lettura» in alto');
const voci = await S.ev(() => [...document.querySelectorAll('.pn-side .sh-si')].map(b => b.textContent.trim()));
ok(voci.includes('Disponibilità e prospettive') && voci.includes('Obiettivi e azioni') && !voci.includes('Richieste dei Gruppi'), 'Senior: nel menu non ci sono le richieste dei Gruppi (' + voci.join(' | ') + ')');
await S.ev(() => pnSez('obi')); await sleep(500);
const t1 = await S.ev(() => document.getElementById('pn-pane').textContent);
ok(/Accogliere nuovi Senior/.test(t1) && /Il Clan al servizio dei Gruppi/.test(t1), 'Senior: legge gli obiettivi del Clan');
ok(await S.ev(() => ![...document.querySelectorAll('#pn-pane textarea, #pn-pane input:not([type=hidden])')].some(e => !e.disabled && !e.readOnly) || !document.querySelector('#pn-pane textarea:not([readonly]):not([disabled])')), 'Senior: niente da modificare (campi non scrivibili)');
await S.ev(() => pnSez('dis')); await sleep(500);
ok(await S.ev(() => /Persone per i campi estivi/.test(document.getElementById('pn-pane').textContent + ' ' + [...document.querySelectorAll('#pn-pane textarea, #pn-pane input')].map(e => e.value).join(' '))), 'Senior: legge le disponibilità del Clan');
await S.P.evaluate(async () => { await new Promise(r => setTimeout(r, 400)); });
ok(db.t.pee_piani.find(p => p.id === 'c1').rev === 1, 'Senior: il piano non è stato toccato (rev invariata)');
await S.ev(() => pnBack()); await sleep(1200);
ok(await S.ev(() => SH.view === 'home'), 'Senior: «Torna ai piani» riporta in home');
await S.pa.ctx.close();
// ── Senior senza Progetto deliberato / altra Sezione / senza database aggiornato ──
{ const S2 = await mk('snrF'); S2.P.on('pageerror', e => errs.push('snrF: ' + e.message)); const h2 = await home(S2);
  ok(/OBIETTIVO|Clan di Fano/.test(h2) === true && !/Clan deliberato Pesaro/.test(h2), 'Senior di Fano: vede solo il Clan di Fano'); await S2.pa.ctx.close(); }
{ db.t.pee_piani.find(p => p.id === 'c1').stato = 'bozza'; const S3 = await mk('snr2'); const h3 = await home(S3);
  ok(/Quando il Coordinatore Senior delibera il Progetto di Clan/.test(h3) && !/Clan deliberato Pesaro/.test(h3), 'Senior: senza Progetto deliberato un messaggio chiaro'); await S3.pa.ctx.close(); db.t.pee_piani.find(p => p.id === 'c1').stato = 'deliberato'; }
{ db.sqlPres = false; const S4 = await mk('snr2'); S4.P.on('pageerror', e => errs.push('snr2 vecchio: ' + e.message)); ok(await S4.ev(() => SH.view === 'home' && !!document.querySelector('.sh-prof-line')), 'database non aggiornato: la home del Senior si apre lo stesso'); await S4.pa.ctx.close(); db.sqlPres = true; }
// il Senior in Servizio non è un Senior: nessuna lettura del Clan
{ const S5 = await mk('sis'); const h5 = await home(S5); ok(!/Progetto di Clan/.test(h5), 'Senior in Servizio: nessun Progetto di Clan'); await S5.pa.ctx.close(); }
// ── Progetto di Sezione: Tesoriere e chi ha la spunta del Comitato ──
const letto = async k => { const X = await mk(k); X.P.on('pageerror', e => errs.push(k + ': ' + e.message)); const hh = await home(X); const o = await X.ev(() => [...document.querySelectorAll('#sh-piani details')].map(d => d.textContent.replace(/\s+/g, ' '))); await X.pa.ctx.close(); return {hh, o}; };
for(const k of ['tes', 'cuC', 'vol']){
  const {hh, o} = await letto(k);
  ok(/Il Progetto di Sezione/.test(hh) && o.length === 1 && /Formare più Capi in Sezione/.test(o[0]) && /Rinnovare le sedi/.test(o[0]) && !/PDS BOZZA/.test(hh), k + ': in home gli obiettivi del Progetto di Sezione deliberato (non la bozza)');
}
{ const {hh} = await letto('cuN'); ok(!/Il Progetto di Sezione/.test(hh), 'Capo Unità senza la spunta del Comitato: nessuna lettura in home'); }
{ const {hh} = await letto('snr2'); ok(!/Il Progetto di Sezione/.test(hh), 'Senior senza spunta: non legge il Progetto di Sezione'); }
// Presidente: scrive il Progetto di Sezione; nessuna card di lettura doppia
{ const X = await mk('pres'); X.P.on('pageerror', e => errs.push('pres: ' + e.message)); const hh = await home(X);
  ok(/\+ Nuovo Progetto di Sezione/.test(hh) && !(await X.ev(() => !!document.querySelector('#sh-piani details'))), 'Presidente: può creare il Progetto di Sezione, senza doppia lettura'); await X.pa.ctx.close(); }
ok(errs.length === 0, 'nessun errore di pagina (' + errs.join(' · ') + ')');
await br.close(); process.exit(summary() ? 1 : 0);
