import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
// barra di formattazione: lo strumento attivo si vede (serve RT=1: il banco di prova di solito spegne il testo formattato)
process.env.RT = '1';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'R', sezione:'Pesaro', gruppo:'1', area_rcdf:'x', dashboard:{}});
const pri = [{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tempistica:''}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0], tempistica:''}];
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'X', meta:{mode:'giovani', fascia:'R', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'R', UNIT_NAME:'', obs:{}, pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', priorita:pri, pp:{}, percorsiExtra:[]}}, created_at:'2026-10-20T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
await ev(() => shSub('1d', '')); await sleep(1000);
await sleep(2500); await P.locator('.rt-ed:visible').first().click().catch(() => {}); await sleep(500);
const has = await ev(() => !!document.querySelector('.rt-ed:focus'));
ok(has, 'il campo lungo diventa un editor con barra di formattazione');
if(has){
  await P.keyboard.type('prova '); await P.keyboard.press('Control+b'); await P.keyboard.type('grasso'); await sleep(300);
  ok(await ev(() => document.querySelector('#rt-bar button[data-rt="b"]').classList.contains('on')), 'scrivendo in grassetto, il pulsante G è acceso');
  ok(await ev(() => !document.querySelector('#rt-bar button[data-rt="i"]').classList.contains('on')), 'corsivo resta spento');
  await P.keyboard.press('Control+b'); await P.keyboard.type(' normale'); await sleep(300);
  ok(await ev(() => !document.querySelector('#rt-bar button[data-rt="b"]').classList.contains('on')), 'tornando al testo normale il pulsante G si spegne');
}
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
summary(); await br.close(); process.exit(0);
