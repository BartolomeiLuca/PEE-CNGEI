// 28/11 sera: «Chi fa parte» nei piani (Gruppo / Sezione / Clan) + staff delle Unità autorizzato dal Capo Unità.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const _arg = process.argv[2] || 'chromium'; const _prof = PROFILES[_arg];
const engine = _prof ? _prof[0] : _arg; const DEV = Object.assign({}, _prof ? _prof[1] : {}); delete DEV.defaultBrowserType; if(engine === 'firefox') delete DEV.isMobile;
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof2 = (k, nome, ruolo, o) => { o = o || {}; U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:['cu', 'senior'].includes(ruolo) ? 'E' : '', sezione:'Pesaro', gruppo:['cg', 'vcg', 'cu', 'senior'].includes(ruolo) ? (o.gr || 'Pesaro 1') : '', area_rcdf:'altoadriatico'}); };
prof2('cg', 'Carla CG', 'cg'); prof2('cu', 'Ugo CU', 'cu'); prof2('cu2', 'Ugo Due', 'cu'); prof2('cu3', 'Ugo Tre', 'cu'); prof2('cds', 'Dino Commissario', 'cds'); prof2('coords', 'Cora Senior', 'coords');
const mk = async (k, w) => { const pa = await person(br, db, {ctx:Object.assign({}, DEV, {viewport:(w || !DEV.viewport) ? {width:w || 1280, height:900} : DEV.viewport, acceptDownloads:true})}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(2200); return {P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const errs = [];
const crea = async (S, tipo) => { await S.ev(t => pnNuovo(t), tipo); await sleep(400); await S.P.click('#pn-n-ok'); await sleep(2200); };
const body = S => S.ev(() => document.body.innerText);
// progetti di Unità già salvati: cu (Reparto Aquile, 2 persone), cu2 (nessun progetto), cu3 (progetto con tabella vuota)
const arc = (k, nome, tab) => db.t.pee_archivi.push({id:'a-' + k, user_id:U[k].id, anno:2026, titolo:nome, updated_at:new Date().toISOString(), meta:{mode:'giovani', nome, fascia:'E'}, data:{scheda:{pp:{staffTab:tab}}}});
arc('cu', 'Reparto Aquile', [{ruolo:'CU', nome:'Ugo CU', mail:'cu@x.it'}, {ruolo:'VCU', nome:'Bea Verdi', mail:'Bea@x.it'}, {ruolo:'SiS', nome:'Gino Neri', mail:'gino@x.it'}]);
arc('cu3', 'Reparto Gufi', []);
// ── database non aggiornato ──
db.sqlStaff = false;
const G = await mk('cg'); G.P.on('pageerror', e => errs.push('cg: ' + e.message));
await crea(G, 'gruppo');
ok(await G.ev(() => !!document.querySelector('#pn-sb-per') && /Chi fa parte/.test(document.querySelector('#pn-sb-per').textContent)), 'Piano di Gruppo: voce «Chi fa parte» nel menu');
await G.ev(() => pnSez('per')); await sleep(900);
ok(/dopo l’aggiornamento del database/.test(await body(G)), 'database vecchio: messaggio chiaro');
ok(await G.ev(() => /Solo adulti/.test(document.body.textContent) && /Consiglio di Gruppo/.test(document.body.textContent)), 'avviso «Solo adulti» e organo «Consiglio di Gruppo»');
// ── database aggiornato ──
db.sqlStaff = true;
await G.ev(() => { PER.st = ''; PER.pid = ''; pnRender(); }); await sleep(1500);
let b = await body(G);
ok(/Ugo Due: non ti ha ancora autorizzato/i.test(b) && /Ugo CU: non ti ha ancora autorizzato/i.test(b), 'allerta: i Capi Unità del Gruppo che non hanno autorizzato');
ok(!/Reparto Aquile/.test(b), 'senza autorizzazione lo staff non si vede');
// Capo Unità autorizza dalla sua tabella
const C = await mk('cu'); C.P.on('pageerror', e => errs.push('cu: ' + e.message));
await C.ev(() => exStart()); await sleep(2500); await C.ev(() => gGo('1a')); await sleep(1500);
ok(await C.ev(() => !!document.getElementById('cons-box') && /Chi vede la tabella del mio staff/.test(document.getElementById('cons-box').textContent)), 'Capo Unità: casella «Chi vede la tabella del mio staff»');
await C.ev(() => { document.getElementById('cons-mail').value = 'non-una-mail'; consAutorizza(); }); await sleep(300);
ok(await C.ev(() => /Controlla l’email/.test(document.getElementById('cons-box').textContent)) && db.t.pee_staff_consensi.length === 0, 'email non valida: rifiutata');
await C.ev(() => { document.getElementById('cons-mail').value = 'cu@x.it'; consAutorizza(); }); await sleep(900);
ok(await C.ev(() => /Non puoi autorizzare te stesso/.test(document.getElementById('cons-box').textContent)) && db.t.pee_staff_consensi.length === 0, 'non si autorizza da solo');
await C.ev(() => { document.getElementById('cons-mail').value = ' CG@x.it '; consAutorizza(); }); await sleep(900);
ok(db.t.pee_staff_consensi.length === 1 && db.t.pee_staff_consensi[0].email === 'cg@x.it' && await C.ev(() => /cg@x\.it/.test(document.getElementById('cons-box').textContent)), 'autorizzazione salvata (minuscole) e mostrata');
// il Capo Gruppo ricarica: vede lo staff
await G.ev(() => { PER.st = ''; PER.pid = ''; pnRender(); }); await sleep(1500);
b = await body(G);
ok(/Reparto Aquile/.test(b) && /Bea Verdi/.test(b) && /Gino Neri/.test(b) && /Bea@x\.it/i.test(b), 'il Capo Gruppo vede lo staff della Unità autorizzata');
ok(!/Ugo CU: non ti ha ancora/i.test(b) && /Ugo Due: non ti ha ancora/i.test(b), 'l’allerta resta solo per chi non ha autorizzato');
ok(await G.ev(() => pnPerRighe('cdg').length === 3), 'per i verbali: le tre persone dello staff (Ugo, Bea, Gino) · ' + await G.ev(() => JSON.stringify(pnPerRighe('cdg').map(r => r.nome))));
// persone scritte a mano + senza doppioni
await G.ev(() => pnPerAdd('cdg')); await sleep(400);
await G.ev(() => { const r = PN.d.persone.cdg[0]; pnPerSet('cdg', r.id, 'nome', 'Bea Verdi'); pnPerSet('cdg', r.id, 'ruolo', 'Vice Capo Unità'); pnPerSet('cdg', r.id, 'mail', 'bea@x.it'); });
ok(await G.ev(() => PN.d.persone.cdg.length === 1 && pnPerRighe('cdg').filter(r => r.mail === 'bea@x.it').length === 1), 'stessa email a mano e dalle Unità: una sola persona');
await G.ev(() => { const r = PN.d.persone.cdg[0]; pnPerSet('cdg', r.id, 'mail', 'bea@'); }); await sleep(200);
ok(await G.ev(() => /Controlla l’email/.test(document.getElementById('pn-pmb-' + PN.d.persone.cdg[0].id).textContent)), 'email incompleta: segnalata');
await G.ev(() => pnPerSet('cdg', 'inesistente', 'nome', 'x')); await G.ev(() => pnPerSet('sez', 'x', 'nome', 'x')); await G.ev(() => pnPerAdd('cos'));
ok(await G.ev(() => !(PN.d.persone.cos) && PN.d.persone.cdg.length === 1), 'organi non del piano: ignorati');
await G.ev(() => { window.confirm = () => true; pnPerDel('cdg', PN.d.persone.cdg[0].id); }); await sleep(300);
ok(await G.ev(() => PN.d.persone.cdg.length === 0), 'persona tolta');
// Capo Unità toglie l’autorizzazione
await C.ev(() => { window.confirm = () => true; consTogli('cg@x.it'); }); await sleep(900);
ok(db.t.pee_staff_consensi.length === 0, 'autorizzazione revocata');
await G.ev(() => { PER.st = ''; PER.pid = ''; pnRender(); }); await sleep(1500);
ok(!/Reparto Aquile/.test(await body(G)), 'dopo la revoca lo staff sparisce');
// ── Sezione e Clan ──
const S = await mk('cds'); S.P.on('pageerror', e => errs.push('cds: ' + e.message));
await crea(S, 'sezione');
await S.ev(() => pnSez('per')); await sleep(800);
b = await body(S);
ok(/Consiglio di Sezione/i.test(b) && /Comitato di Sezione \(COS\)/i.test(b) && !(await S.ev(() => !!document.getElementById('pn-per-u'))), 'Sezione: tabelle CoSez e COS, niente blocco «Dalle Unità» · ' + await S.ev(() => [...document.querySelectorAll('h2')].map(h => h.textContent).join(' | ')));
await S.ev(() => { pnPerAdd('cos'); }); await sleep(300);
await S.ev(() => { const r = PN.d.persone.cos[0]; pnPerSet('cos', r.id, 'nome', 'Piero Presidente'); pnPerSet('cos', r.id, 'ruolo', 'Presidente'); pnPerSet('cos', r.id, 'mail', 'Piero@x.it'); });
ok(await S.ev(() => JSON.stringify(PN.d.persone.cos.map(r => [r.nome, r.ruolo, r.mail])) === '[["Piero Presidente","Presidente","Piero@x.it"]]'), 'COS: persona scritta e salvata nel piano');
const K = await mk('coords'); K.P.on('pageerror', e => errs.push('coords: ' + e.message));
await crea(K, 'clan');
await K.ev(() => pnSez('per')); await sleep(800);
ok(await K.ev(() => /Adulti del Clan/i.test(document.body.innerText) && /Solo adulti/.test(document.body.textContent)), 'Clan: tabella degli adulti');
ok(errs.length === 0, 'nessun errore di pagina · ' + errs.join(' | '));
await br.close(); process.exit(summary() ? 1 : 0);
