// Lotto B2a (27/11): sulle azioni il mese di inizio, «una volta sola / continuativa», la fine, il segno «Urgente»; piani vecchi intatti.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const u = db.addUser('luca@x.it', 'password123', 'Luca Titolare'); db.t.pee_profili.push({user_id:u.id, nome:'Luca Titolare', ruolo:'cg', branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}});
const ob = (id, t) => ({id, testo:t, aree:['educativa'], origine:'', rif:'', ricadute:false});
const az = (id, o, t, x) => Object.assign({id, ob:o, testo:t, inizio:2, verifica:'ogni', indicatore:'', chi:[], ref:'', stato:'da_iniziare', genitori:false}, x || {});
db.t.pee_piani.push({id:'p1', owner_id:u.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null, obiettivi:[ob('o1', 'Più famiglie')], azioni:[az('a1', 'o1', 'Vecchia azione senza mese'), az('a2', 'o1', 'Seconda azione')], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page; await loginAs(P, base, u); await sleep(1800);
const ev = (f, a) => P.evaluate(f, a);
await ev(() => pnOpen('p1')); await sleep(1600); await ev(() => { PN.sez = 'obi'; pnRender(); pnObTutti(true); }); await sleep(300);
const d0 = () => ev(() => JSON.parse(JSON.stringify(PN.d.azioni)));
// 1. piano vecchio: i dati non cambiano, compare l’avviso
let A = await d0();
ok(A[0].inizio === 2 && !('mese' in A[0]) && !('tipo' in A[0]), 'l’azione vecchia resta com’era (nessun campo nuovo scritto da sola)');
ok(/Manca il mese di inizio in 2 azioni/.test(await ev(() => document.querySelector('.pn-avv') ? document.querySelector('.pn-avv').textContent : '')), 'avviso: manca il mese in 2 azioni');
ok(await ev(() => document.querySelector('#pn-azi-a1 option:checked').textContent) === 'Anno 2 · scegli il mese', 'la tendina dice «Anno 2 · scegli il mese» per l’azione vecchia');
// 2. scelgo il mese: l’anno si ricava dal mese
await P.selectOption('#pn-azi-a1', '2027-10'); await sleep(200);
A = await d0();
ok(A[0].mese === '2027-10' && A[0].inizio === 2, 'ottobre 2027 → anno 2 (' + A[0].mese + ', anno ' + A[0].inizio + ')');
await P.selectOption('#pn-azi-a2', '2028-03'); await sleep(200);
A = await d0(); ok(A[1].mese === '2028-03' && A[1].inizio === 2, 'marzo 2028 → anno 2 (l’anno scout va da settembre ad agosto)');
ok(!/Manca il mese/.test(await ev(() => document.querySelector('.pn-avv') ? document.querySelector('.pn-avv').textContent : '')), 'con tutti i mesi l’avviso sparisce');
// 3. una tantum / continuativa
ok(await ev(() => !document.getElementById('pn-azf-a1')), 'senza tipo non c’è «Fino a»');
await P.selectOption('#pn-azq-a1', 'cont'); await sleep(200);
ok(await ev(() => !!document.getElementById('pn-azf-a1')), 'continuativa → compare «Fino a»');
const opz = await ev(() => [...document.querySelectorAll('#pn-azf-a1 option')].map(o => o.value));
ok(opz.includes('piano') && !opz.includes('2027-09') && opz.includes('2027-10') && opz.includes('2029-08'), '«Fino a» parte dal mese di inizio e arriva ad agosto 2029 (' + opz.length + ' voci)');
await P.selectOption('#pn-azf-a1', '2028-06'); await sleep(200);
A = await d0(); ok(A[0].tipo === 'cont' && A[0].fine === '2028-06', 'fine giugno 2028 salvata');
await P.selectOption('#pn-azi-a1', '2028-09'); await sleep(200);
A = await d0(); ok(A[0].fine === '' && A[0].inizio === 3, 'se sposto l’inizio oltre la fine, la fine si svuota (' + A[0].fine + ')');
await P.selectOption('#pn-azf-a1', 'piano'); await sleep(200);
A = await d0(); ok(A[0].fine === 'piano', '«Fino a fine piano»');
await P.selectOption('#pn-azq-a1', 'una'); await sleep(200);
A = await d0(); ok(A[0].tipo === 'una' && A[0].fine === '' && await ev(() => !document.getElementById('pn-azf-a1')), 'tornando a «Una volta sola» la fine sparisce');
// 4. urgente
await P.check('#pn-ob-o1 input[type=checkbox][onchange*="urgente"]', {force:true}).catch(() => {}); await sleep(200);
A = await d0(); ok(A[0].urgente === true, 'segno «Urgente»');
// 5. a parole
const q = await ev(() => PN.d.azioni.map(a => pnQuando(a, PN.p)));
ok(q[0] === 'settembre 2028' && q[1] === 'marzo 2028', '«quando» a parole (' + q.join(' / ') + ')');
// 6. salvataggio
await sleep(2500); const dbd = db.t.pee_piani.find(x => x.id === 'p1').data.azioni;
ok(dbd[0].mese === '2028-09' && dbd[0].tipo === 'una' && dbd[0].urgente === true && dbd[1].mese === '2028-03', 'tutto salvato nel piano');
ok(pa.errors.length === 0, 'nessun errore di pagina (' + pa.errors.length + ')'); if(pa.errors.length) console.log(pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
