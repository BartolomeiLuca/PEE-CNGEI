// Lotto B2c (27/11): Quadro in tre viste: Tabella, Timeline (barre sui mesi, rombi, verifiche, linea di oggi), Calendario (mese per mese, con i ritmi fissi); su telefono la timeline è un elenco per scadenza.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}}); };
prof('luca', 'Luca Titolare', 'cg'); prof('vera', 'Vera Vice', 'vcg');
const ob = (id, t, aree) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false});
const az = (id, o, t, x) => Object.assign({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'', chi:['cdg'], ref:'', stato:'da_iniziare', genitori:false}, x || {});
db.t.pee_piani.push({id:'p1', owner_id:U.luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca', analisi:[], swot:null,
    obiettivi:[ob('o1', 'Più famiglie nel Gruppo', ['educativa', 'territorio']), ob('o2', 'Una sede più grande', ['gestionale']), ob('o3', 'Formare gli adulti', ['formativa'])],
    azioni:[az('a1', 'o1', 'Serate con le famiglie', {mese:'2027-03', tipo:'cont', fine:'2027-06', ref:'Anna Rossi', stato:'in_corso'}),
            az('a2', 'o1', 'Festa di Gruppo', {mese:'2026-12', tipo:'una', urgente:true}),
            az('a3', 'o1', 'Azione senza mese', {}),
            az('a4', 'o2', 'Cercare un locale', {mese:'2027-01', tipo:'cont', fine:'piano', stato:'fatta'}),
            az('a5', 'o2', 'Sistemare la sede', {mese:'2027-09', tipo:'cont', fine:''})],
    uniti:[], spunti:[], spg:[],
    tappe:[{id:'t1', anno:1, tipo:'fine', data:'2027-06-20', fatta:false, note:''}, {id:'t2', anno:2, tipo:'meta', data:'2028-02-10', fatta:true, note:''}],
    delibera:{data:'', luogo:''}}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'lettore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});
const mk = async (k, w) => { const pa = await person(br, db, {ctx:{viewport:{width:w || 1280, height:900}}}); await pa.page.clock.setFixedTime(new Date('2026-12-10T10:00:00+01:00')); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const L = await mk('luca');
await L.ev(() => pnOpen('p1')); await sleep(1600); await L.P.click('#pn-sb-qua'); await sleep(400);
ok(await L.ev(() => [...document.querySelectorAll('.pn-seg .pn-segb')].map(b => b.textContent + ':' + b.getAttribute('aria-pressed')).join()) === 'Tabella:true,Timeline:false,Calendario:false', 'tre viste: Tabella, Timeline, Calendario (si parte dalla Tabella)');
// ── timeline ──
await L.P.click('#pn-qv-tl'); await sleep(300);
ok(await L.ev(() => !!document.querySelector('.pn-tl') && !document.querySelector('.pn-qt')), 'la timeline sostituisce la tabella');
ok(await L.ev(() => document.querySelectorAll('.pn-tl-a').length) === 6, 'una riga per azione, più «nessuna azione» per l’obiettivo vuoto (' + await L.ev(() => document.querySelectorAll('.pn-tl-a').length) + ')');
const st = id => L.ev(i => { const e = document.querySelector('[href="#pn-az-' + i + '"].pn-tb, [href="#pn-az-' + i + '"].pn-td'); return e ? {l:e.style.left, w:e.style.width, c:e.className, t:e.getAttribute('aria-label')} : null; }, id);
const b1 = await st('a1'), b2 = await st('a2'), b4 = await st('a4'), b5 = await st('a5'), b3 = await st('a3');
ok(b1 && b1.l === '16.667%' && b1.w === '11.111%' && /pn-tb/.test(b1.c) && !/open/.test(b1.c), 'continuativa: barra da marzo 2027 a giugno 2027 (' + JSON.stringify(b1) + ')');
ok(b2 && b2.l === '9.722%' && /pn-td/.test(b2.c), 'una volta sola: rombo a dicembre 2026');
ok(b4 && b4.w === '88.889%' && !/open/.test(b4.c), 'fino a fine piano: arriva in fondo');
ok(b5 && /open/.test(b5.c), 'continuativa senza fine: bordo tratteggiato (aperta)');
ok(b3 === null && /mese da scegliere/.test(await L.ev(() => document.querySelector('.pn-tl-a .pn-manca').textContent)), 'senza mese: nessuna barra, lo dice a parole');
ok(/da marzo 2027 a giugno 2027, in corso/.test(b1.t), 'ogni barra ha il testo per chi non vede i colori (' + b1.t + ')');
ok(/pn-tb s-in_corso/.test(b1.c) && /s-fatta/.test(b4.c), 'lo stato cambia il riempimento (a righe, pieno)');
const ver = await L.ev(() => ({n:document.querySelectorAll('.pn-tv').length, sug:document.querySelectorAll('.pn-tv.sug').length, f:document.querySelectorAll('.pn-tv.fatta').length, t:[...document.querySelectorAll('.pn-tv.sug')].map(e => e.getAttribute('aria-label')).join('|')}));
ok(ver.n === 4 && ver.sug === 2 && ver.f === 1, 'verifiche: 2 con data, 2 suggerite (entro marzo) dove manca la tappa di metà anno, 1 fatta (' + JSON.stringify(ver) + ')');
ok(/suggerita: entro marzo/.test(ver.t), 'la suggerita si riconosce anche a parole');
const oggi = await L.ev(() => { const e = document.querySelector('.pn-tl-oggi'); return e ? parseFloat(e.style.getPropertyValue('--f')) : null; });
ok(oggi !== null && Math.abs(oggi - (3 + 9 / 31) / 36) < 0.003, 'la linea di oggi sta a metà dicembre 2026 (' + oggi + ')');
ok(await L.ev(() => { const t = document.querySelector('.pn-tw'); return t.scrollWidth >= t.clientWidth && document.documentElement.scrollWidth <= window.innerWidth + 1; }), 'la pagina non scorre in orizzontale');
ok(await L.ev(() => getComputedStyle(document.querySelector('.pn-tl-ls')).display) === 'none', 'a schermo largo l’elenco per scadenza è nascosto');
// filtri
await L.P.selectOption('#pn-qf-ref', 'Anna Rossi'); await sleep(200);
ok(await L.ev(() => document.querySelectorAll('.pn-tb, .pn-td').length) === 1, 'il filtro per referente vale anche nella timeline');
await L.P.selectOption('#pn-qf-ref', ''); await sleep(100);
// clic su una barra → modifica
await L.ev(() => document.querySelector('[href="#pn-az-a2"].pn-td').click()); await sleep(900);
ok(await L.ev(() => PN.sez) === 'obi' && await L.ev(() => !!document.getElementById('pn-azt-a2') && document.getElementById('pn-azt-a2').offsetParent !== null), 'un clic su un rombo apre l’azione da modificare');
// ── calendario ──
await L.P.click('#pn-sb-qua'); await sleep(300);
ok(await L.ev(() => document.querySelector('#pn-qv-tl').getAttribute('aria-pressed')) === 'true', 'tornando al Quadro si ritrova la vista scelta');
await L.P.click('#pn-qv-cal'); await sleep(300);
const cards = () => L.ev(() => Object.fromEntries([...document.querySelectorAll('.pn-cm')].map(c => [c.getAttribute('aria-label'), c.textContent.replace(/\s+/g, ' ').trim()])));
let C = await cards();
ok(Object.keys(C).length === 12 && Object.keys(C)[0] === 'settembre 2026' && Object.keys(C)[11] === 'agosto 2027', 'dodici mesi, da settembre ad agosto (anno 1)');
ok(/◆ Festa di Gruppo/.test(C['dicembre 2026']) && /questo mese/.test(C['dicembre 2026']), 'dicembre: la festa (rombo) e il mese corrente segnato');
ok(/Inizia: Serate con le famiglie/.test(C['marzo 2027']) && /Verifica di metà anno \(suggerita: entro marzo\)/.test(C['marzo 2027']), 'marzo: l’inizio della serata e la verifica suggerita');
ok(/Finisce: Serate con le famiglie/.test(C['giugno 2027']) && /Verifica di fine anno · 20 giugno/.test(C['giugno 2027']), 'giugno: la fine e la verifica con la data');
ok(/\+ 2 azioni in corso/.test(C['aprile 2027']), 'aprile: due azioni in corso, solo conteggiate');
ok(/Niente in programma/.test(C['ottobre 2026']), 'un mese vuoto lo dice');
ok(/almeno ogni due mesi/.test(await L.ev(() => document.querySelector('.pn-cal-rit').textContent)) && /entro marzo/.test(await L.ev(() => document.querySelector('.pn-cal-rit').textContent)), 'i ritmi fissi sono scritti, con la fonte');
ok(/1 azione senza mese/.test(await L.ev(() => document.querySelector('#pn-qb').textContent)), 'le azioni senza mese sono segnalate');
await L.P.click('button:has-text("Anno 2")'); await sleep(300); C = await cards();
ok(Object.keys(C)[0] === 'settembre 2027' && /Verifica di metà anno · 10 febbraio · fatta/.test(C['febbraio 2028']) && !/suggerita/.test(C['marzo 2028']), 'anno 2: la verifica di metà anno con data e «fatta», e nessuna suggerita');
// ── sola lettura e telefono ──
const V = await mk('vera'); await V.ev(() => pnOpen('p1')); await sleep(1600); await V.P.click('#pn-sb-qua'); await sleep(300); await V.P.click('#pn-qv-tl'); await sleep(300);
ok(await V.ev(() => document.querySelectorAll('.pn-tl').length) === 1 && await V.ev(() => document.querySelectorAll('.pn-tl input, .pn-tl textarea').length) === 0, 'chi legge vede la timeline, senza campi da scrivere');
const M = await mk('luca', 390); await M.ev(() => pnOpen('p1')); await sleep(1600); await M.P.click('#pn-sb-qua'); await sleep(300); await M.P.click('#pn-qv-tl'); await sleep(300);
const tel = await M.ev(() => ({box:getComputedStyle(document.querySelector('.pn-tl-box')).display, ls:getComputedStyle(document.querySelector('.pn-tl-ls')).display, h:[...document.querySelectorAll('.pn-tl-mh')].map(h => h.textContent), sw:document.documentElement.scrollWidth, iw:window.innerWidth}));
ok(tel.box === 'none' && tel.ls === 'block', 'sul telefono la timeline diventa un elenco per scadenza');
ok(tel.h.join('|') === 'dicembre 2026|marzo 2027|giugno 2027|febbraio 2028|marzo 2029|agosto 2029|Mese da scegliere', 'i mesi sono in ordine, con «Mese da scegliere» in fondo (' + tel.h.join('|') + ')');
ok(tel.sw <= tel.iw + 1, 'e la pagina non scorre in orizzontale');
ok(await M.ev(() => [...document.querySelectorAll('.pn-tl-ul li a')].every(a => a.getBoundingClientRect().height >= 40)), 'i collegamenti dell’elenco si toccano bene (≥ 40 px)');
await M.P.click('#pn-qv-cal'); await sleep(300);
ok(await M.ev(() => document.documentElement.scrollWidth <= window.innerWidth + 1 && document.querySelectorAll('.pn-cm').length === 12), 'calendario sul telefono: dodici mesi, nessuno scorrimento orizzontale');
const nerr = [L, V, M].reduce((n, w) => n + w.pa.errors.length, 0); ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log([L, V, M].flatMap(w => w.pa.errors).slice(0, 3).join(' | ').slice(0, 400));
await br.close(); process.exit(summary() ? 1 : 0);
