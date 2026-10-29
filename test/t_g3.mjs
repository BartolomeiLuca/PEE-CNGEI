import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
async function mk(vw, vh, tipo = 'AN', branca = 'E'){
  const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:vw, height:vh}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
  const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
  db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
  db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Progetto 2026-27', meta:{mode:'giovani', fascia:branca, tipo}, data:{v:1, MODE:'giovani', FASCIA:branca, UNIT_NAME:'X', scheda:{tipoProgetto:tipo, annoScout:'2026-27'}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
  await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
  return {P, ev, pa};
}
const vis = (ev, sel) => ev(sel => { const e = document.querySelector(sel); if(!e) return false; const cs = getComputedStyle(e), b = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0 && b.right > 0 && b.left < innerWidth; }, sel);
const noHScroll = ev => ev(() => document.documentElement.scrollWidth <= innerWidth + 1);
// computer
{ const {P, ev, pa} = await mk(1280, 800);
  ok(await vis(ev, '#sh-side') && !(await vis(ev, '#sh-hb')) && !(await vis(ev, '#sh-bb')), '1280 px: menu laterale fisso, niente pulsante menu né barra in basso');
  ok(await noHScroll(ev), '1280 px: nessuna barra di scorrimento orizzontale');
  ok(await ev(() => document.getElementById('main-app').getBoundingClientRect().left >= 248), '1280 px: il contenuto non finisce sotto il menu');
  ok(!pa.errors.length, 'nessun errore JS (1280)'); }
// tablet
{ const {P, ev, pa} = await mk(820, 1000);
  ok(!(await vis(ev, '#sh-side')) && await vis(ev, '#sh-hb') && !(await vis(ev, '#sh-bb')), '820 px: menu nascosto, pulsante menu visibile, niente barra in basso');
  ok(await noHScroll(ev), '820 px: nessuna barra di scorrimento orizzontale');
  ok(await ev(() => document.getElementById('sh-hb').getBoundingClientRect().width >= 44), '820 px: il pulsante menu è almeno 44 px');
  await P.click('#sh-hb'); await sleep(400);
  ok(await vis(ev, '#sh-side') && await ev(() => document.getElementById('sh-hb').getAttribute('aria-expanded') === 'true'), '820 px: il pulsante apre il menu a cassetto');
  await P.keyboard.press('Escape'); await sleep(400);
  ok(!(await vis(ev, '#sh-side')), '820 px: Esc chiude il cassetto');
  await P.click('#sh-hb'); await sleep(300); await ev(() => shGrp('Progettare')); await sleep(200); await P.click('#sh-side .sh-si:has-text("Percorso Personale")'); await sleep(500);
  ok(!(await vis(ev, '#sh-side')) && await ev(() => schedaStep === 'C'), '820 px: scegliere una voce chiude il cassetto e apre la sezione');
  await P.click('#sh-hb'); await sleep(300); await P.mouse.click(800, 500); await sleep(400);
  ok(!(await vis(ev, '#sh-side')), '820 px: un tocco fuori dal cassetto lo chiude');
  ok(!pa.errors.length, 'nessun errore JS (820)'); }
// telefono · Programmazione Annuale
{ const {P, ev, pa} = await mk(390, 844, 'AN', 'R');
  ok(await vis(ev, '#sh-bb') && !(await vis(ev, '#sh-side')) && !(await vis(ev, '#sh-hb')), '390 px: barra in basso, niente menu laterale né pulsante menu');
  ok(await noHScroll(ev), '390 px: nessuna barra di scorrimento orizzontale');
  ok((await ev(() => [...document.querySelectorAll('#sh-bb .sh-bbb')].map(b => b.textContent.trim()))).join('|') === 'Dashboard|Osservare|Progettare|Altro', '390 px: Dashboard, Osservare, Progettare, Altro');
  ok(await ev(() => [...document.querySelectorAll('#sh-bb .sh-bbb')].every(b => { const r = b.getBoundingClientRect(); return r.height >= 44 && r.width >= 44; })), '390 px: pulsanti di almeno 44 px');
  await P.click('#sh-bb .sh-bbb:has-text("Progettare")'); await sleep(300);
  ok((await ev(() => document.querySelectorAll('#sh-sheet-in .sh-si').length)) === 9, '390 px: «Progettare» elenca Obiettivi, i tre Percorsi, Visione d’insieme, Percorso formativo, Calendario, Elenco e Check dello staff');
  await P.click('#sh-sheet-in .sh-si:has-text("Obiettivi e indicatori")'); await sleep(500);
  ok(await ev(() => schedaStep === 'B' && !document.getElementById('sh-sheet').classList.contains('show')), '390 px: scegliere una Sezione chiude il foglio e la apre');
  ok(await ev(() => document.querySelector('#sh-bb .sh-bbb.on').textContent.trim()) === 'Progettare', '390 px: la barra evidenzia «Progettare»');
  await P.click('#sh-bb .sh-bbb:has-text("Altro")'); await sleep(300);
  const alt = await ev(() => document.getElementById('sh-sheet-in').innerText);
  ok(/Verifica delle attività/.test(alt) && /I tuoi progetti/.test(alt) && /Guida e video/.test(alt) && /Profilo/.test(alt) && /Archivio degli anni/.test(alt), '390 px: «Altro» elenca Verifica, Valutazione, Archivio, Condividi, Controllo, I tuoi progetti, Guida, Profilo');
  await P.keyboard.press('Escape'); await sleep(200);
  ok(await ev(() => getComputedStyle(document.querySelector('#hdr')).backgroundColor) === 'rgb(196, 35, 31)', '390 px: Branca R → intestazione rossa');
  ok(!pa.errors.length, 'nessun errore JS (390)'); }
// telefono · Progetto Personale, Branca L
{ const {P, ev, pa} = await mk(390, 844, 'PP', 'L');
  ok((await ev(() => [...document.querySelectorAll('#sh-bb .sh-bbb')].map(b => b.textContent.trim()))).join('|') === 'Stato|Sezioni|Invii|Altro', '390 px · PP: Stato, Sezioni, Invii, Altro');
  ok(await ev(() => getComputedStyle(document.querySelector('#hdr')).backgroundColor) === 'rgb(240, 230, 3)' && await ev(() => getComputedStyle(document.querySelector('#hdr')).color) === 'rgb(26, 24, 0)', '390 px · Branca L: intestazione gialla con testo scuro');
  await P.click('#sh-bb .sh-bbb:has-text("Invii")'); await sleep(300);
  ok(/Invii del Progetto Personale/.test(await ev(() => document.getElementById('panel-pp').innerText)), '390 px · PP: «Invii» apre la pagina degli invii');
  ok(await noHScroll(ev), '390 px · PP: nessuna barra di scorrimento orizzontale');
  ok(!pa.errors.length, 'nessun errore JS (PP)'); }
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
