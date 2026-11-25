// Piccoli ritocchi del 25/11: referente scelto tra chi partecipa, data di delibera come data vera, link «segnalalo» per la Sezione
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare'), vera = db.addUser('vera@x.it', 'password123', 'Vera Vice');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
db.t.pee_profili.push({user_id:vera.id, nome:'Vera Vice', ruolo:'vcg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ob = {id:'o1', testo:'Più famiglie', aree:['educativa'], origine:'', rif:'', ricadute:false};
const az = {id:'a1', ob:'o1', testo:'Due serate', inizio:1, verifica:'ogni', indicatore:'', chi:[], ref:'Persona Antica', stato:'da_iniziare', genitori:false};
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano', anno_inizio:2026, durata:3, stato:'deliberato', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(), data:{v:1, analisi:[], swot:null, obiettivi:[ob], azioni:[az], uniti:[], spunti:[], delibera:{data:'15/10/2026', luogo:'Sede'}}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'collaboratore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', visto_il:null, invitato_da:luca.id, created_at:'2026-11-24T10:00:00Z'});
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, luca); await sleep(1800);
await ev(() => pnOpen('p1')); await sleep(2000);
// referente
const opts = () => ev(() => [...document.querySelectorAll('#pn-azr-a1 option')].map(o => o.textContent));
let o = await opts();
ok(await ev(() => document.getElementById('pn-azr-a1').tagName) === 'SELECT', 'il referente è un menu');
ok(o.includes('Luca Titolare') && o.includes('Vera Vice') && o.includes('Altro…') && o[0] === '— scegli —', 'elenco: titolare, persone invitate, «Altro…» (' + o.join(' | ') + ')');
ok(await ev(() => document.getElementById('pn-azr-a1').value) === '__altro' && await ev(() => document.getElementById('pn-azrx-a1').value) === 'Persona Antica', 'un referente scritto a mano prima resta, in «Altro…», senza perdere nulla');
await P.selectOption('#pn-azr-a1', 'Vera Vice'); await sleep(1700);
ok(db.t.pee_piani[0].data.azioni[0].ref === 'Vera Vice' && await ev(() => document.getElementById('pn-azrx-a1').style.display) === 'none', 'scelta una persona: il referente è il suo nome');
await P.selectOption('#pn-azr-a1', '__altro'); await P.fill('#pn-azrx-a1', 'Zio Tom'); await sleep(1700);
ok(db.t.pee_piani[0].data.azioni[0].ref === 'Zio Tom', '«Altro…»: nome scritto a mano');
ok(db.t.pee_piani[0].data.titolareNome === 'Luca Titolare', 'il nome del titolare resta nel piano, per chi non lo vede nell’elenco');
// chi è collaboratore: il referente non si cambia, ma si legge
const V = await person(br, db); await loginAs(V.page, base, vera); await sleep(1800); await V.page.evaluate(() => pnOpen('p1')); await sleep(2000);
ok(await V.page.evaluate(() => { const e = document.getElementById('pn-azr-a1'); return e.tagName !== 'SELECT' && e.disabled && e.value === 'Zio Tom'; }), 'il collaboratore vede il referente ma non lo cambia');
// delibera
ok(await ev(() => document.getElementById('pn-delD').type) === 'date' && await ev(() => document.getElementById('pn-delD').value) === '2026-10-15', 'la data di delibera è un vero campo data e il vecchio «15/10/2026» è stato letto');
await P.fill('#pn-delD', '2026-11-30'); await sleep(1700);
ok(db.t.pee_piani[0].data.delibera.data === '2026-11-30' && db.t.pee_piani[0].data.delibera.luogo === 'Sede', 'nuova data salvata, il luogo resta');
// valore vecchio illeggibile: avviso e nessuna perdita
db.t.pee_piani[0].data.delibera.data = 'primavera'; db.t.pee_piani[0].rev++;
await ev(() => pnOpen('p1')); await sleep(1500);
ok(await ev(() => !!document.getElementById('pn-delOld')) && await ev(() => document.getElementById('pn-delD').value) === '', 'un testo non leggibile come data viene mostrato con un invito a scegliere la data');
// segnalalo
await ev(() => shGoHome()); await sleep(600); await ev(() => shProfileOpen()); await sleep(900);
await P.fill('#sh-sez', 'Villaggio Nuovo'); await P.click('#sh-sezlw a, a:has-text("Segnalalo")'); await sleep(600);
ok(await ev(() => !!document.getElementById('fb-ov') && /Villaggio Nuovo/.test(document.getElementById('fb-txt').value)), 'il link «Segnalalo» apre i suggerimenti con la Sezione già scritta');
ok(pa.errors.length === 0 && V.errors.length === 0, 'nessun errore di pagina (' + (pa.errors.length + V.errors.length) + ')'); if(pa.errors.length) console.log(pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
