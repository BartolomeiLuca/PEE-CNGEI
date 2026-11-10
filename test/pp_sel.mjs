import { FakeDB, serve, launch, person, sleep, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine === 'chromium' || engine === 'firefox' || engine === 'webkit' ? engine : 'chromium');
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const LONG = ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'.repeat(5);
const att = (t, aid, d) => ({testo:t, link:'', lancio:'L ' + t + LONG, sviluppo:'S' + LONG, conclusione:'C' + LONG, vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'PP', sez3Pri:1, annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'},
    priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0]}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[Object.assign(att('Gioco A', 'a1', '2026-11-08'),{vBene:'ok bene P',vMigl:'m'}), att('Gioco B', 'a2', '')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Gioco C', 'a3', '')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', 'a4', '')]}],
    uscite:{u1:{id:'u1', cr:1, testo:'Uscita', modello:'giorno', ax:{data:'2026-11-08', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{m1:{k:'att', tipo:'att', pid:'P1', aid:'a1', g:1, f:['lsc','mat']}}, hid:{}, own:{}}}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
P.on('dialog', d => d.accept().catch(() => {}));
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
console.log(JSON.stringify(await ev(() => ({ch:ppChosenPid(), opt:['P1','C1','S1'].map(ppOptPid), chk:ppChecks().c2.map(x=>x.l+':'+x.ok+':'+x.det)}))));
await ev(() => { schedaStep='ver'; gGo && 0; }); 
const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx('completo'))]);
await dl.saveAs('/tmp/pp_sel.docx'); await br.close(); process.exit(0);
