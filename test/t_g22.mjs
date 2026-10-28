// Verifica e autovalutazione dello staff: schede, categorie, picker, stampa, guida per chi conduce
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
db.t.pee_profili.push({user_id:A.id, nome:'Anna Rossi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const br = await launch(engine); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await sleep(1500);
const r = await ev(() => { const ids = SITUAZIONI_STAFF.map(s => s.id), n = SITUAZIONI_STAFF.reduce((t, s) => t + s.attivita.length, 0);
  const miss = []; SITUAZIONI_STAFF.forEach(s => s.attivita.forEach(a => { const k = ATT_SCHEDE[a.nome]; if(!k) miss.push(a.nome); else if(!k.passi.length || !k.prep.length || !k.domande.length || !k.attenzione.length || !k.scopo) miss.push('vuota:' + a.nome); }));
  return {ids, n, miss, tot: Object.keys(ATT_SCHEDE).length}; });
ok(r.ids.includes('verifica') && r.ids.includes('autovalutazione') && r.ids.length === 10, 'dieci aree, comprese verifica e autovalutazione ' + r.ids.join());
ok(r.n === 50 && !r.miss.length, '50 attività, tutte con la scheda completa ' + JSON.stringify(r.miss));
const pk = await ev(() => { const k = Object.keys(ATT_SCHEDE); return ['Termometro dello staff', 'La scultura del ruolo', 'La barca dello staff'].every(n => k.includes(n)); });
ok(pk, 'le nuove attività sono nell’elenco richiamabile nei momenti formativi');
const st = await ev(() => { const o = {}; SITUAZIONI_STAFF.filter(s => s.id === 'verifica' || s.id === 'autovalutazione').forEach(s => s.attivita.forEach(a => o[a.cat] = (o[a.cat] || 0) + 1)); return {o}; });
ok(st.o.vf === 5 && st.o.av === 5, 'cinque di verifica e cinque di autovalutazione ' + JSON.stringify(st.o));
// scheda con pulsante Stampa e testo stampabile completo
await ev(() => attSchedaOpen('Semaforo dello staff')); await sleep(500);
ok(await ev(() => /Stampa la scheda/.test(document.getElementById('g-modal').textContent)), 'la scheda ha «Stampa la scheda»');
const ph = await ev(() => attSchedaPrintHTML('Semaforo dello staff'));
ok(/Prima di cominciare/.test(ph) && /passo per passo/.test(ph) && /Attenzione a/.test(ph), 'testo di stampa completo');
// guida per chi conduce
await ev(() => { closeModal(); facGuideOpen(); }); await sleep(500);
let g = await ev(() => document.getElementById('g-modal').textContent);
ok(/Quando farle/.test(g) && /Prima di cominciare/.test(g) && /Le schede per condurla/.test(g) && /Fonti/.test(g), 'guida per chi conduce: sezioni presenti');
ok(await ev(() => document.querySelectorAll('#g-modal .fac-chk input').length === 7 && document.querySelectorAll('#g-modal .fac-sch button').length === 10), 'sette voci da spuntare e dieci schede collegate');
await P.click('#g-modal .fac-chk input >> nth=0'); await sleep(300);
ok(await ev(() => !!(window._facTmp && window._facTmp.luogo) || !!(scheda.facCheck && scheda.facCheck.luogo)), 'la spunta resta registrata');
const fh = await ev(() => { let t = ''; const o = printDoc; window.printDoc = (a, b) => { t = b; }; facGuidePrint(); window.printDoc = o; return t; });
ok(/Segnali a cui fare attenzione/.test(fh) && /class="c"/.test(fh), 'guida stampabile con caselle da spuntare');
await P.click('#g-modal .fac-sch button >> nth=0'); await sleep(500);
ok(await ev(() => /Termometro dello staff/.test(document.getElementById('g-modal').textContent)), 'dalla guida si apre la scheda');
// dalla Guida del menu
await ev(() => { closeModal(); faqOpen(); }); await sleep(500);
ok(await ev(() => /Per chi conduce la verifica dello staff/.test(document.getElementById('g-modal').textContent)), 'la Guida rimanda alla guida per chi conduce');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
