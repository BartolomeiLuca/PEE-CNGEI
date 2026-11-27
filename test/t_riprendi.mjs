// «Riprendi da dove eri» nel piano (27/11): compare nella Panoramica aprendo il piano, porta all'ultima voce; per piano; sparisce dopo la prima mossa.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const mkp = id => db.t.pee_piani.push({id, owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano ' + id, anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
mkp('p1'); mkp('p2');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, luca); await sleep(1800);
await ev(() => pnOpen('p1')); await sleep(1500);
ok(!(await ev(() => !!document.getElementById('pn-riprendi'))), 'piano mai aperto prima: nessun «Riprendi»');
await P.click('#pn-sb-ver'); await sleep(400);
ok(!(await ev(() => !!document.getElementById('pn-riprendi'))), 'dopo la prima mossa non c’è');
await P.click('#pn-sb-pan'); await sleep(400);
ok(!(await ev(() => !!document.getElementById('pn-riprendi'))), 'tornando alla Panoramica a mano non compare');
await ev(() => pnOpen('p2')); await sleep(1500);
ok(!(await ev(() => !!document.getElementById('pn-riprendi'))), 'è per piano: l’altro piano non ha niente');
await ev(() => pnOpen('p1')); await sleep(1500);
ok(await ev(() => !!document.getElementById('pn-riprendi') && /Verifiche/.test(document.querySelector('#pn-riprendi').closest('section').textContent)), 'riaprendo il piano: «L’ultima volta eri in Verifiche»');
await P.click('#pn-riprendi'); await sleep(500);
ok(await ev(() => PN.sez === 'ver' && !!document.getElementById('pn-ve-t')), 'il pulsante porta alle Verifiche');
// dopo ricarica della pagina
await P.reload(); await sleep(2200); await ev(() => pnOpen('p1')); await sleep(1500);
ok(await ev(() => !!document.getElementById('pn-riprendi')), 'resta anche dopo aver ricaricato la pagina');
const nerr = pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')');
await br.close(); process.exit(summary() ? 1 : 0);
