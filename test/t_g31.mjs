import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'R', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const pri = [{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0], tempistica:''}];
const usc = (id, md, t, d) => ({id, cr:1, testo:t, modello:md, ax:{data:d, durata:'giorno', pres:{ad:[]}, luogo:md === 'sede' ? {tipo:'sede'} : {}}, prog:{}, hid:{}, own:{}});
const row = (id, titolo, sc, extra = {}) => db.t.pee_archivi.push({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'R', tipo:'AN'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'R', UNIT_NAME:'', obs:{}, pris:{P1:true, C1:true, S1:true}, scheda:Object.assign({tipoProgetto:'AN', annoScout:'2026-27', priorita:pri, pp:{}, percorsiExtra:[]}, sc)}, extra), created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
row('p0', 'Compagnia Orsa · autunno', {ciclo:{nome:'Autunno'}, pp:{nome:'Anna Verdi', sezione:'Pesaro', gruppo:'1', ctxTerr:'Vicino al bosco', numTot:12, iban:'IT00X'}}, {UNIT_NAME:'Orsa'});
row('p1', 'Compagnia Orsa · inverno', {cicloDa:'p0', ciclo:{nome:'Inverno'}, pp:{}, uscite:{u1:usc('u1', 'giorno', 'Uscita al parco', '2026-11-15'), u2:usc('u2', 'sede', 'Riunione di novembre', '2026-11-08'), u3:usc('u3', 'bivacco', 'Bivacco di gennaio', '2027-01-16')}});
await loginAs(P, base, u); await sleep(1200);
await ev(() => shOpen('p1', 0)); await sleep(3500);
// 1 · apertura, intestazione, interruttore
let s = await ev(() => ({dash: document.getElementById('panel-dash').classList.contains('active'), name: document.getElementById('sh-pjn').textContent, seg:[...document.querySelectorAll('.sh-seg button')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')).join(),
  num: (document.querySelector('[data-c="numeri"]') || {}).innerText || ''}));
ok(s.dash, 'il progetto si apre sulla dashboard');
ok(/^Branca R: Compagnia Orsa · inverno · Inverno$/.test(s.name), 'intestazione: nome vero del progetto e del ciclo (' + s.name + ')');
ok(s.seg === 'Il mio ciclo:true,Il mio anno:false', 'interruttore: «Il mio ciclo» per primo e acceso (' + s.seg + ')');
// 2 · il pannello del ciclo non si chiude se scelgo le date
await ev(() => cfOpen()); await sleep(200);
await P.selectOption('#sh-cf select >> nth=0', {index: 2}); await sleep(500);
ok(await ev(() => document.getElementById('sh-cf').open), 'scegliendo la data di inizio il pannello «Nome e periodo» resta aperto');
await P.selectOption('#sh-cf select >> nth=1', {index: 6}); await sleep(500);
ok(await ev(() => document.getElementById('sh-cf').open), 'scegliendo anche la fine resta aperto');
// 3 · «Numeri e cassa» con Rover; prossime attività con tipo
await ev(() => { scheda.pp = scheda.pp || {}; scheda.pp.numTot = 13; scheda.pp.numM = 6; scheda.pp.numF = 7; shDash(); }); await sleep(400);
s = await ev(() => ({num: document.querySelector('[data-c="numeri"]').innerText, pr: document.querySelector('[data-c="prossime"]').innerText}));
ok(/Rover: 6 maschi e 7 femmine/.test(s.num) && !/Lupetti/.test(s.num), 'Numeri e cassa: «Rover» in Branca R (' + s.num.replace(/\n/g, ' ') + ')');
ok(/Bivacco di gennaio/.test(s.pr) && /Riunione di novembre/.test(s.pr) && /Bivacco/.test(s.pr), '«Prossime attività»: riunioni, uscite e bivacchi con il tipo');
// 4 · Riprendi dal ciclo precedente
await ev(() => { shSub('1a', '', 'unit'); }); await sleep(1200);
s = await ev(() => ({bar: !!document.getElementById('sh-prev'), nome: (scheda.pp || {}).nome, sez: (scheda.pp || {}).sezione}));
ok(s.nome === 'Anna Verdi' && s.sez === 'Pesaro', 'nome, Sezione e Gruppo si precompilano dal profilo (' + s.nome + ', ' + s.sez + ')');
ok(s.bar, 'il riquadro «Riprendi dal ciclo precedente» c’è');
await ev(() => shPrev()); await sleep(1500);
s = await ev(() => ({keys: [...document.querySelectorAll('.sh-pvc')].map(i => i.value + ':' + i.checked).join()}));
ok(/chi:/.test(s.keys) && /uname:true/.test(s.keys) && /iban:true/.test(s.keys) && /ctx:true/.test(s.keys), 'tra le voci da riprendere: chi compila, nome dell’Unità, contesto, IBAN (' + s.keys + ')');
await ev(() => shPrevApply()); await sleep(900);
s = await ev(() => ({bar: !!document.getElementById('sh-prev'), un: UNIT_NAME, ctx: scheda.pp.ctxTerr, done: scheda.prevDone}));
ok(!s.bar && s.done, 'dopo «Riprendi» il riquadro sparisce');
ok(s.un === 'Orsa' && s.ctx === 'Vicino al bosco', 'ripresi nome dell’Unità e contesto (' + s.un + ', ' + s.ctx + ')');
// 5 · «Adulti in staff» in Branca R, nella pagina Il mio staff; io già nella tabella
await ev(() => shSub('1a', '', 'staff')); await sleep(900);
s = await ev(() => ({lab: [...document.querySelectorAll('#val-root .profile-card > div')].some(e => /^Adulti in staff/.test(e.textContent.trim()) && getComputedStyle(e).display !== 'none'), tab: !!document.getElementById('staff-tab') && document.getElementById('staff-tab').offsetParent !== null,
  t: scheda.pp.staffTab.map(r => r.ruolo + ':' + (r.nome || '') + ':' + (r.mail || '')).join('|'), old: /Adulti in Compagnia/.test(document.body.innerText)}));
ok(s.lab && s.tab && !s.old, 'la tabella «Adulti in staff» sta in «Il mio staff» (anche in Branca R)');
ok(/^CC:Anna Verdi:anna@x\.it/.test(s.t), 'chi compila è già nella tabella con il ruolo e l’email (' + s.t + ')');
// 6 · pagine con pulsanti coerenti con il menu
await ev(() => shSub('1d', '')); await sleep(700);
s = await ev(() => ({prev: document.getElementById('p3-prev').textContent.trim(), next: document.getElementById('p3-next').textContent.trim()}));
ok(s.prev === '← Lettura del gruppo' && s.next === 'Obiettivi e indicatori →', 'Priorità: indietro e avanti seguono il menu (' + s.prev + ' / ' + s.next + ')');
await ev(() => shSub('1c', '')); await sleep(700);
s = await ev(() => ({prev: document.getElementById('f2-prev').textContent.trim(), next: document.getElementById('f2-next').textContent.trim()}));
ok(/^← (Sviluppo Spirituale|Confronto e sintesi)$/.test(s.prev) && s.next === 'Priorità →', 'Lettura del gruppo: pulsanti coerenti (' + s.prev + ' / ' + s.next + ')');
// 7 · intestazione per tipo di evento e colore del blocco
await ev(() => { uscOpen('u3'); gGo('usc'); }); await sleep(900);
s = await ev(() => ({h: document.getElementById('hero-title4').textContent, c: USC_BT.att[1]}));
ok(s.h === 'Organizzazione Bivacco', 'intestazione: «Organizzazione Bivacco» (' + s.h + ')');
ok(s.c === '#8f1d19', 'il blocco «Attività del percorso» è rosso scuro in Branca R (distinto dalle cerimonie) (' + s.c + ')');
await ev(() => { uscOpen('u2'); uscRe(); }); await sleep(500);
ok(await ev(() => document.getElementById('hero-title4').textContent) === 'Organizzazione Riunione', 'cambiando evento cambia anche l’intestazione');
// 9 · Elenco dell'anno: i filtri
await ev(() => shEle()); await sleep(1200);
s = await ev(() => ({n: document.querySelectorAll('.ele-t tbody tr').length}));
await P.selectOption('#ele-f', 'Bivacco'); await sleep(400);
const nb = await ev(() => document.querySelectorAll('.ele-t tbody tr').length);
await P.selectOption('#ele-s', 'staff'); await sleep(400);
const ns = await ev(() => document.querySelectorAll('.ele-t tbody tr').length);
ok(s.n === 3 && nb === 1 && ns === 0, 'Elenco: il filtro Formato (3 → 1) e «Solo staff» (0) funzionano (' + s.n + '/' + nb + '/' + ns + ')');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
