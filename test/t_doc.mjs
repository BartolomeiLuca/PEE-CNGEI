// Vista di revisione basata sul Word: commenti puntuali, compilatore, iPad
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova'), G = db.addUser('cg@x.it', 'password123', 'Capo Gruppo');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart()); await sleep(2500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it', cgMail:'cg@x.it'}; saveData(true); }); await sleep(500);
await ev(() => ppGiroForm(1)); await sleep(1000);
await ev(() => { ppGiroDest(0, 'app', true); ppGiroDest(2, 'app', true); ppGiroDest(0, 'mail', false); ppGiroDest(1, 'mail', false); ppGiroDest(2, 'mail', false); ppGiroDest(3, 'mail', false); });
await ev(() => ppGiroCongela()); await sleep(2500);
const g0 = db.t.pee_giri[0]; ok(g0 && g0.meta && g0.meta.nome === 'Anna Rossi', 'il giro porta l’intestazione leggera (nome): ' + JSON.stringify(g0 && g0.meta));
// revisore
const pl = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PL = pl.page, el = (f, a) => PL.evaluate(f, a);
await loginAs(PL, base, L); await sleep(1500);

// «Scarica il Word» dall'elenco: solo download, nessuna scheda nuova
let nPages = PL.context().pages().length;
const [dlw] = await Promise.all([PL.waitForEvent('download', {timeout:60000}).catch(() => null), el(id => rvWord(id), g0.id)]);
ok(!!dlw && /\.docx$/i.test(dlw.suggestedFilename()) && PL.context().pages().length === nPages, 'il Word si scarica senza aprire schede: ' + (dlw && dlw.suggestedFilename()) + ' / schede ' + nPages + '→' + PL.context().pages().length);
const [pop] = await Promise.all([PL.context().waitForEvent('page', {timeout:15000}), el(id => rvOpen(id), g0.id)]);
await pop.waitForLoadState('domcontentloaded'); await sleep(9000);
const pe = (f, a) => pop.evaluate(f, a);
let s = await pe(() => ({doc:!!document.getElementById('rv-doc'), h2:document.querySelectorAll('#rv-doc h2').length, cb:document.querySelectorAll('#rv-doc .rd-cb').length, main:getComputedStyle(document.getElementById('main-app')).display, side:getComputedStyle(document.getElementById('sh-side')).display, t:(document.getElementById('rv-doc')||{textContent:''}).textContent.slice(0,200)}));
ok(s.doc && s.h2 >= 3 && s.cb > 10, 'vista del Word: sezioni e pulsanti di commento: ' + JSON.stringify({h2:s.h2, cb:s.cb}));
ok(s.main === 'none' && s.side === 'none', 'la copia dell’app e il menu sono nascosti');
// commento puntuale su una voce
const key = await pe(() => { const a = _rd.anchors.find(x => x.kind === 'row' && x.sec > 0); a.el.cells[0].querySelector('.rd-cb').click(); return a.key; });
await sleep(300);
await pe(() => { const t = document.querySelector('#rv-doc .rd-cm textarea'); t.value = 'Qui manca il riferimento al KOS'; t.dispatchEvent(new Event('change', {bubbles:true})); }); await sleep(700);
const rows = db.t.pee_giri_rev.filter(x => x.giro_id === g0.id && x.tipo === 'nota' && x.chiave.startsWith('c:'));
ok(rows.length === 1 && rows[0].chiave === key && /^s\d$/.test(rows[0].valore) && /KOS/.test(rows[0].testo), 'il commento puntuale è salvato con ancora stabile: ' + key.slice(0, 60));
const on = await pe(k => _rd.anchors.find(x => x.key === k).el.cells[0].querySelector('.rd-cb').classList.contains('on'), key);
ok(on, 'il pulsante resta evidenziato');
// dock: clic sulla check-list non lo chiude
await pe(() => { const d = document.getElementById('rv-dock'); d.classList.add('open'); document.querySelector('#rv-dock .rv-ck .rv-sh').click(); }); await sleep(300);
await pe(() => rvCk('a1', 'si')); await sleep(400);
s = await pe(() => ({ck:!!document.querySelector('#rv-dock .rv-ck.open'), open:document.getElementById('rv-dock').classList.contains('open')}));
ok(s.ck && s.open, 'dopo un clic sulla check-list il pannello e la lista restano aperti: ' + JSON.stringify(s));

const [dlD] = await Promise.all([pop.waitForEvent('download', {timeout:40000}).catch(() => null), pe(() => rvWordDock())]);
ok(!!dlD && /\.docx$/i.test(dlD.suggestedFilename()), 'il Word dal pannello del revisore si scarica anche se il giro non è approvato: ' + (dlD && dlD.suggestedFilename()));
// voci: Lancio/Sviluppo/Conclusione e le 7 caratteristiche hanno ognuna la propria; le righe vuote seguono la voce
s = await pe(() => ({lan:_rd.anchors.filter(a => /› Lancio/.test(a.label)).length, svi:_rd.anchors.filter(a => /› Sviluppo/.test(a.label)).length, con:_rd.anchors.filter(a => /› Conclusione/.test(a.label)).length, car:_rd.anchors.filter(a => /7 caratteristiche › /.test(a.label)).length, nav:getComputedStyle(document.getElementById('rv-nav')).display, navN:document.querySelectorAll('#rv-nav a').length, bord:getComputedStyle(document.querySelector('#rv-doc td')).borderLeftWidth}));
ok(s.lan >= 3 && s.svi >= 3 && s.con >= 3 && s.car >= 7, 'Lancio/Sviluppo/Conclusione e le 7 caratteristiche hanno ciascuna la propria voce: ' + JSON.stringify(s));
ok(s.nav === 'block' && s.navN > 8 && s.bord === '0px', 'menu delle sezioni a sinistra e celle senza bordi: ' + s.nav + ' ' + s.navN + ' ' + s.bord);
await pe(() => { rvSecTog(1); rvSecTog(2); }); await sleep(300); await pe(() => rvCk('b2', 'si')); await sleep(300);
s = await pe(() => ({o:Object.keys(_rd.open).filter(k => _rd.open[k]).join(), n:document.querySelectorAll('#rv-dock .rv-sec.cur').length}));
ok(s.n === 2 && s.o === '1,2', 'i pannelli delle sezioni si aprono indipendenti e restano aperti dopo un clic: ' + JSON.stringify(s));
// compilatore: vede il commento e lo segna recepito
const pa2 = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), PA = pa2.page;
await loginAs(PA, base, A); await sleep(1500);
PA.evaluate(id => ppGiroApriQui(id), g0.id).catch(() => {}); await sleep(11000); const pop2 = PA;
s = await pop2.evaluate(() => ({doc:!!document.getElementById('rv-doc'), dock:!!document.getElementById('rv-dock'), cm:Array.from(document.querySelectorAll('#rv-doc .rd-cm')).map(x => x.textContent)}));
ok(s.doc && s.dock && s.cm.length === 1 && /KOS/.test(s.cm[0]) && /Luca Prova/.test(s.cm[0]), 'il compilatore vede il commento puntuale con l’autore, con il pannello delle revisioni ricevute: ' + JSON.stringify(s.cm).slice(0, 120));
await pop2.evaluate(() => { document.querySelector('#rv-doc .rd-cm input[type=checkbox]').click(); }); await sleep(700);
ok(db.t.pee_giri_rev.find(x => x.chiave === key).recepita === true, 'il compilatore segna «recepita»');
// iPad: 820x1180 e 1024x768 → pannello laterale visibile
for(const [w, h] of [[820, 1180], [1024, 768]]){
  await pop.setViewportSize({width:w, height:h}); await sleep(700);
  s = await pe(() => { const r = document.getElementById('rv-dock').getBoundingClientRect(), d = document.getElementById('rv-doc').getBoundingClientRect(); return {l:Math.round(r.left), w:Math.round(r.width), vw:innerWidth, docR:Math.round(d.right), docOverlap: Math.round(d.right) > Math.round(r.left) + 1}; });
  ok(s.l >= s.vw - s.w - 1 && s.w > 300 && !s.docOverlap, 'a ' + w + 'x' + h + ' il pannello è un lato visibile e non copre il testo: ' + JSON.stringify(s));
}
await pe(() => document.getElementById('rv-dock').classList.remove('open')); await pop.setViewportSize({width:390, height:760}); await sleep(700);
s = await pe(() => { const r = document.getElementById('rv-dock').getBoundingClientRect(), d = document.getElementById('rv-doc').getBoundingClientRect(); return {dockTop:Math.round(r.top), docBottom:Math.round(d.bottom), vh:innerHeight, sw:document.documentElement.scrollWidth, vw:innerWidth}; });
ok(s.dockTop >= s.vh - 60 && s.docBottom <= s.dockTop + 2 && s.sw <= s.vw + 1, 'su telefono: barra in basso e testo sopra: ' + JSON.stringify(s));
summary();
await br.close(); process.exit(0);
