// Blocco 1 (2 nov): «Per te» raggruppato nella pagina «I tuoi progetti», scarico JSON, svuota cestino
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi'), uc = db.addUser('carla@x.it', 'password123', 'Carla Neri');
for (const [u, n] of [[ua, 'Anna Verdi'], [uc, 'Carla Neri']]) db.t.pee_profili.push({user_id:u.id, nome:n, ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const pri = (a, p, d, al) => ({ambito:a, necessita:'n', percorso:p, obiettivi:[0], idr:[0], tempistica:'', tDal:d, tAl:al});
const blk = (t, ord, extra) => Object.assign({k:'nuova', g:1, ord, dur:20, t, aff:'carla@x.it', f:[]}, extra || {});
db.t.pee_archivi.push({id:'c1', user_id:ua.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'},
  data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', pris:{P1:true, C1:true, S1:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', ciclo:{nome:'I trimestre', dal:'2026-10', al:'2026-12'},
    uscite:{r0:{id:'r0', cr:1, testo:'Prima riunione', modello:'sede', ax:{data:'2026-11-07', durata:'giorno', pres:{ad:[]}, luogo:{}}, own:{}, hid:{}, prog:{b1:blk('Merenda', 1), b2:blk('Attività nuova', 2), b3:blk('Giochi', 3, {k:'att', pid:'P1', aid:'a1', t:''})}}},
    priorita:[pri('P', 'P1', '2026-10', '2026-12'), pri('C', 'C1', '2026-10', '2026-12'), pri('S', 'S1', '2026-11', '2026-12')],
    pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi', mail:'anna@x.it'}, {ruolo:'CU', nome:'Carla Neri', mail:'carla@x.it'}]},
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[{aid:'a1', testo:'Giochi di presentazione', aff:'carla@x.it', link:'', lancio:'x', sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', ax:{data:'2026-11-07'}}]}]}},
  created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_archivi.push({id:'c9', user_id:uc.id, anno:2025, titolo:'Vecchio progetto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', scheda:{tipoProgetto:'AN'}}, created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_archivi.push({id:'c8', user_id:uc.id, anno:2025, titolo:'Nel cestino', meta:{mode:'giovani', fascia:'E', tipo:'AN', cest:Date.now()}, data:{v:1, MODE:'giovani', scheda:{}}, created_at:'2026-10-12T09:00:00Z', updated_at:'2026-10-12T09:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'c1', email:'carla@x.it', ruolo:'collaboratore', owner_id:ua.id, owner_email:'anna@x.it', visto_il:null, email_prima:null, created_at:'2026-10-12T09:30:00Z'});
const pc = await person(br, db); const C = pc.page, ec = (f, x) => C.evaluate(f, x);
C.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
await loginAs(C, base, uc); await sleep(3500);
const home = () => ec(() => ({v: SH.view, pt: (document.getElementById('sh-perte') || {}).textContent || '', rows: [...document.querySelectorAll('#sh-perte .cl-row .t')].map(e => e.textContent), open: !!document.querySelector('#sh-perte details[open]'), sum: (document.querySelector('#sh-perte summary') || {}).textContent || ''}));
let h = await home(); console.log('  ', JSON.stringify(h.rows), h.sum, JSON.stringify(await ec(() => (CL.perte||[]).map(x => [x.k, x.hot, x.ack]))));
ok(h.v === 'home' && /Per te/.test(h.sum), '«Per te» compare nella pagina «I tuoi progetti»: «' + h.sum.trim() + '»');
ok(/\b2 novit/.test(h.sum), 'il conteggio è sulle righe viste (invito + uscita = 2)');
ok(h.open, 'è aperta perché ci sono novità');
const usc = h.rows.filter(t => /Nell’uscita/.test(t));
ok(usc.length === 1 && /Merenda/.test(usc[0]) && /Attività nuova/.test(usc[0]) && /Giochi di presentazione/.test(usc[0]), 'le voci della stessa uscita sono una sola riga: ' + (usc[0] || '').slice(0, 140));
ok(!h.rows.some(t => /Attività affidata a te/.test(t) && /Giochi di presentazione/.test(t)), 'l’attività già elencata nell’uscita non si ripete');
ok(h.rows.some(t => /Invito/.test(t)), 'l’invito è tra gli avvisi');
await ec(() => { const b = [...document.querySelectorAll('#sh-perte .cl-btn')].find(b => /Ho capito/.test(b.textContent) && /ptAckMany/.test(b.getAttribute('onclick') || '')); if(b) b.click(); }); await sleep(600);
h = await home();
ok(/\b1 novit/.test(h.sum), 'dopo «Ho capito» l’uscita non conta più tra le novità: «' + h.sum.trim() + '»');
// JSON
const [dl] = await Promise.all([C.waitForEvent('download', {timeout: 8000}).catch(() => null), ec(() => shExportJson())]);
let j = null; if(dl){ const fs = await import('fs'); const pth = await dl.path(); j = JSON.parse(fs.readFileSync(pth, 'utf8')); }
ok(j && j.progetti.length === 1 && j.progetti[0].id === 'c9', 'JSON: scarica i propri progetti (' + (j ? j.progetti.map(x => x.id).join(',') : 'nessun file') + '), non quelli nel cestino né i condivisi');
// cestino
await sleep(1500);
ok(await ec(() => !!document.querySelector('.sh-trash') && /Svuota il cestino/.test(document.querySelector('.sh-trash').textContent)), 'cestino: pulsante «Svuota il cestino»');
C.on('dialog', d => d.accept().catch(() => {}));
await ec(() => shTrashEmpty()); await sleep(1500);
ok(!db.t.pee_archivi.some(r => r.id === 'c8') && db.t.pee_archivi.some(r => r.id === 'c9'), 'svuotato: il cestino è vuoto, il progetto normale resta');
ok(!pc.errors.length, 'nessun errore JS' + (pc.errors.length ? ': ' + pc.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
