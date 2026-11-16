import fs from 'fs';
// Revisione a turni: colori degli stati, «Ho fatto» / «Ho un dubbio», sezioni comprimibili, «Ho finito» con domande aperte
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default;
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it'}; saveData(true); }); await sleep(500);
await ev((b) => ppGiroForm(b), process.env.BLK2 ? 2 : 1); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', false)); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0], aid = g0.archivio_id;
let v = db.t.pee_revisioni[0];
ok(db.t.pee_revisioni.length === 1 && v.stato === 'aperta' && v.fase === 'revisore' && v.revisore_email === 'luca.bartolomei@cngei.it', 'il primo invio apre la revisione e fissa il revisore: ' + JSON.stringify(v && [v.stato, v.fase, v.revisore_email]));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(900);
const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(9000);
const pe = (f, a) => pop.evaluate(f, a);
await pe(() => { const a = _rd.anchors.find(x => /contesto-territoriale/.test(x.key)); rvDocOpen(a.key); });
await pe(() => { const t = document.querySelector('#rv-doc textarea'); t.value = 'Aggiungi il quartiere'; const b = Array.from(document.querySelectorAll('#rv-doc button')).find(x => /Aggiungi richiest/.test(x.textContent)); b.click(); }); await sleep(900);
ok(db.t.pee_revisioni_punto.length === 1 && db.t.pee_revisioni_punto[0].stato === 'da_fare', 'il commento diventa un punto «da fare»');
await pe(() => rvSync()); await sleep(1200);
let s = await pe(() => document.getElementById('rv-dock').innerText);
ok(/Tocca a te/.test(s) && /Invia le richieste di revisione \(1\)/.test(s) && await pe(() => { const b = Array.from(document.querySelectorAll('#rv-dock .rv-b')).find(x => x.textContent.trim() === 'Approva'); return !!b && b.disabled; }), 'revisore: turno, richieste inviabili e «Approva» spento con punti da fare');
await pe((a) => rvAzione(a, 'rimanda'), aid); await sleep(900);
ok(db.t.pee_revisioni[0].fase === 'compilatore', '«Rimanda» passa il turno al compilatore');
s = await pe(() => document.getElementById('rv-dock').innerText); ok(/Tocca a chi ha scritto/.test(s), 'revisore: ora tocca al compilatore');
// compilatore
await ev(() => rpLoad()); await sleep(900); await ev(() => rpTog()); await sleep(600);
const keys = await pe(() => _rd.anchors.map(a => ({chiave: a.key, label: a.label})));
const inject = () => ev(([ks, real]) => { _rp.pts = ks.map((k, i) => ({id: 'x' + i, chiave: k.chiave, sec: +k.chiave.split('|')[0].slice(2), txt: (real ? rpLabel(k.chiave).txt : k.label), testo: 'Prova ' + i, n: 1, user_id: 'u1', autore_nome: 'Revisore', recepita: false})); }, [keys, !!process.env.REAL]);
await ev(() => { window.rpLoad = async function(){}; });
await inject();
const out = [];
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
for(let i = 0; i < keys.length; i++){ if(only && !only.test(keys[i].chiave)) continue;
  await inject();
  const _e = await ev(async (i) => { try{ await rpGo(i); return ""; }catch(e){ return "ERR " + e.message + " " + (e.stack||"").slice(0,200); } }, i); if(_e) console.log(keys[i].chiave, _e); await sleep(900); for(let q = 0; q < 12 && !(await ev(() => !!document.querySelector(".rp-inl"))); q++) await sleep(500); if(process.env.DBG) { const w = await ev(() => document.querySelector(".rp-inl") ? 1 : 0); if(!w) console.log("NOPANEL", keys[i].chiave); }
  const r = await ev(() => { const b = document.querySelector('.rp-inl'); const fl = !!document.getElementById('rp-float'); if(!b) return {none: true};
    const tr = b.closest('.rp-inl-tr'); const pv = (tr || b).previousElementSibling; const par = b.parentElement;
    const ctx = pv ? (pv.innerText || pv.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) : ('PARENT ' + (par.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 50));
    const host = b.closest('.pc,.pcx,details.u-ob'); const where = host ? (host.id || '') + ':' + ((host.querySelector('.pcx-hd,.u-ttl,.pc-hd') || host).textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) : ''; const cd = b.closest('.profile-card,.val-card'), vcc = b.closest('.ver-c'), card = cd ? ((cd.querySelector('.val-card-name')||cd.firstElementChild).textContent||'').trim().replace(/\s+/g,' ').slice(0,60) : '', att = vcc ? (vcc.querySelector('.ver-tt')||{textContent:''}).textContent.trim().slice(0,40) : '', pv2 = (() => { let n = vcc; while(n){ n = n.previousElementSibling; if(n && !n.classList.contains('ver-c') && /^Percorso/.test(n.textContent.trim())) return n.textContent.trim().slice(0,50); } return ''; })(), lbl = (() => { const t = b.previousElementSibling; return t ? (t.textContent||'').trim().slice(0,30) : ''; })();
    return {fl, card, att, pv2, lbl, n: document.querySelectorAll('.rp-inl').length, pk: b.dataset.pk, where, ctx, vis: b.offsetParent !== null, y: Math.round(b.getBoundingClientRect().top)}; });
  if(r.fl && process.env.DBG){ r.dbg = await ev((i) => { const t = rpTarget(_rp.pts[i]); const g = document.querySelectorAll('#val-root .ver-c').length; return JSON.stringify({t: !!t, vc: g, act: document.querySelector('.panel.active') && document.querySelector('.panel.active').id, vr: !!document.getElementById('val-root'), vis: document.getElementById('val-root') && document.getElementById('val-root').offsetParent !== null, ta: Array.from(document.querySelectorAll('#val-root .ver-c')).map(v => Array.from(v.querySelectorAll('textarea')).filter(t => (t.value||'').trim()).length).join(',')}); }, i); }
  r.exp = (/^Sviluppo (\w+)/.exec(keys[i].label)||[])[1]||''; r.ok = !r.pk || r.pk.indexOf(keys[i].chiave + '|') === 0; out.push({k: keys[i].chiave, ...r});
}
fs.writeFileSync(process.env.OUT || '/tmp/cov.json', JSON.stringify(out));
const fl = out.filter(o => o.fl || o.none).length; console.log('COV tot', out.length, 'primo piano/nessuno', fl, 'invisibili', out.filter(o => !o.fl && !o.none && !o.vis).length);
await br.close(); process.exit(0);
