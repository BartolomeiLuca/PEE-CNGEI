// Verifiche del Piano (25/11): tappe per anno (metà anno, fine anno, altre), controllo intermedio per azione, «Prossima verifica» in panoramica.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare'), lea = db.addUser('lea@x.it', 'password123', 'Lea Lettrice');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_profili.push({user_id:lea.id, nome:'Lea Lettrice', ruolo:'cds', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ob = {id:'o1', testo:'Più famiglie', aree:['educativa'], origine:'', rif:'', ricadute:false};
const az = (id, t, ex) => Object.assign({id, ob:'o1', testo:t, inizio:1, verifica:'ogni', indicatore:'Fatto?', chi:[], ref:'', stato:'da_iniziare', genitori:false}, ex || {});
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano', anno_inizio:new Date().getFullYear(), durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:{v:1, analisi:[], swot:null, obiettivi:[ob], azioni:[az('a1', 'Due serate con le famiglie', {step:'meta'}), az('a2', 'Un bivacco di Gruppo', {step:'cdg'}), az('a3', 'Rifare il sito', {}), az('a4', 'Già fatta', {step:'meta', stato:'fatta'}), az('a5', 'Dal secondo anno', {step:'meta', inizio:2})], uniti:[], spunti:[], delibera:{data:'', luogo:''}}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'lea@x.it', ruolo:'lettore', etichetta:'Commissario di Sezione', nome:'Lea Lettrice', visto_il:null, invitato_da:luca.id, created_at:'2026-11-24T10:00:00Z'});
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const txt = sel => ev(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const cnt = sel => ev(s => document.querySelectorAll(s).length, sel);
const salvato = async () => { for(let i = 0; i < 40; i++){ if(await ev(() => !PN.dirty && !PN.saving)) return true; await sleep(150); } return false; };
await loginAs(P, base, luca); await sleep(1800); await ev(() => pnOpen('p1')); await sleep(1800);

ok(await cnt('#pn-sb-ver') === 1, 'nel menu c’è «Verifiche»');
ok(/Nessuna tappa segnata/.test(await txt('#pn-prox')), 'in panoramica: «Prossima verifica» dice che non c’è nessuna tappa');
await ev(() => pnSez('ver')); await sleep(400);
ok(/Il Manuale del Capo Gruppo \(p\. 51\)/.test(await txt('#pn-ve-t ~ .sh-hint')) && await cnt('button[onclick="pnTappeProponi()"]') === 1, 'la pagina cita il Manuale e offre «Proponi le tappe»');
await P.click('button[onclick="pnTappeProponi()"]'); await sleep(500);
ok(await ev(() => PN.d.tappe.length) === 6 && await cnt('.pn-ve') === 6, 'per tre anni: 6 tappe (metà e fine di ogni anno)');
await P.click('button[onclick="pnTappeProponi()"]'); await sleep(300);
ok(await ev(() => PN.d.tappe.length) === 6, 'proporle di nuovo non crea doppioni');
// azioni da guardare a metà anno 1: a1 (metà) e a2 (cdg), non a3 (solo annuale), non a4 (fatta), non a5 (inizia anno 2)
const meta1 = await ev(() => { const t = PN.d.tappe.find(x => x.anno === 1 && x.tipo === 'meta'); return [...document.querySelectorAll('#pn-ve-' + t.id + ' details li')].map(l => l.textContent.replace(/\s+/g, ' ')); });
ok(meta1.length === 2 && /Due serate/.test(meta1[0]) && /bivacco/.test(meta1[1]), 'a metà anno 1 si guardano le azioni con controllo intermedio non ancora fatte (' + meta1.length + ')');
const fine1 = await ev(() => { const t = PN.d.tappe.find(x => x.anno === 1 && x.tipo === 'fine'); return [...document.querySelectorAll('#pn-ve-' + t.id + ' details li')].map(l => l.textContent.replace(/\s+/g, ' ')); });
ok(fine1.length === 3 && !fine1.some(x => /Già fatta|Dal secondo/.test(x)), 'a fine anno 1 le azioni che si verificano ogni anno, senza le fatte né quelle che iniziano dopo');
const meta2 = await ev(() => { const t = PN.d.tappe.find(x => x.anno === 2 && x.tipo === 'meta'); return document.querySelectorAll('#pn-ve-' + t.id + ' details li').length; });
ok(meta2 === 3, 'a metà anno 2 compare anche l’azione che inizia nell’anno 2');
// data e fatta, note
const t1 = await ev(() => PN.d.tappe.find(x => x.anno === 1 && x.tipo === 'meta').id);
await P.fill('#pn-vd-' + t1, '2027-02-20'); await P.fill('#pn-vn-' + t1, 'Le serate non partono: servono i genitori'); await sleep(200);
ok(await salvato() && db.t.pee_piani[0].data.tappe.find(t => t.id === t1).data === '2027-02-20' && /genitori/.test(db.t.pee_piani[0].data.tappe.find(t => t.id === t1).note), 'data e note si salvano da sole');
await P.check('#pn-ve-' + t1 + ' input[type=checkbox]'); await sleep(200);
ok(await ev(i => document.getElementById('pn-ve-' + i).classList.contains('ok'), t1) && await salvato() && db.t.pee_piani[0].data.tappe.find(t => t.id === t1).fatta === true, '«Fatta» si segna e la tappa cambia aspetto');
// prossima
await P.fill('#pn-vd-' + await ev(() => PN.d.tappe.find(x => x.anno === 1 && x.tipo === 'fine').id), '2027-06-15'); await sleep(200);
await ev(() => pnSez('pan')); await sleep(300);
ok(/Verifica di fine anno · anno 1 · 15\/06\/2027/.test(await txt('#pn-prox')), 'la prossima verifica in panoramica: la prima non fatta con data (' + await txt('#pn-prox') + ')');
// un’altra verifica, eliminare
await ev(() => pnSez('ver')); await sleep(300);
await P.click('button[onclick="pnTappaAdd(2)"]'); await sleep(300);
ok(await ev(() => PN.d.tappe.length) === 7 && await ev(() => PN.d.tappe[6].tipo) === 'altra', 'si aggiunge «Un’altra verifica»');
await ev(() => { window.confirm = () => true; }); await P.click('.pn-ve:last-of-type .pn-ib >> nth=0').catch(() => {}); await sleep(200);
// controllo intermedio nell’azione
await ev(() => { pnSez('obi'); pnObTutti(true); }); await sleep(400);
ok(await cnt('#pn-azk-a1') === 1 && await ev(() => document.getElementById('pn-azk-a1').value) === 'meta' && await ev(() => document.getElementById('pn-azk-a3').value) === '', 'ogni azione ha il «Controllo intermedio»');
await P.selectOption('#pn-azk-a3', 'cdg'); await sleep(300);
ok(await salvato() && db.t.pee_piani[0].data.azioni.find(a => a.id === 'a3').step === 'cdg', 'si sceglie e si salva');
// un piano di prima (senza tappe) funziona
db.t.pee_piani[0].data = {v:1, analisi:[], swot:null, obiettivi:[ob], azioni:[az('a1', 'Una')], uniti:[], spunti:[], delibera:{data:'', luogo:''}}; db.t.pee_piani[0].rev++;
await ev(() => pnOpen('p1')); await sleep(1500); await ev(() => pnSez('ver')); await sleep(300);
ok(/Ancora nessuna tappa/.test(await txt('main.pn')) && await cnt('button[onclick="pnTappeProponi()"]') === 1, 'un piano di prima funziona: nessuna tappa e il pulsante per proporle');
// lettore: sola lettura
const L = await person(br, db); await loginAs(L.page, base, lea); await sleep(1800); await L.page.evaluate(() => pnOpen('p1')); await sleep(1800);
await L.page.evaluate(() => { PN.d.tappe.push({id:'tz', anno:1, tipo:'meta', data:'', fatta:false, note:''}); pnSez('ver'); }); await sleep(500);
ok(await L.page.evaluate(() => document.querySelectorAll('button[onclick="pnTappeProponi()"]').length === 0 && document.getElementById('pn-vd-tz').disabled && document.getElementById('pn-vn-tz').disabled), 'chi può solo leggere vede le tappe ma non le cambia');
const nerr = pa.errors.length + L.errors.length;
ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log((pa.errors.concat(L.errors)).slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
