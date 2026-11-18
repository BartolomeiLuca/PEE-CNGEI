import { FakeDB, serve, launch, person, sleep, loginAs, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(process.argv[2] || 'chromium');
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
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
await ev(() => { scheda.pp.ctxSez = 'Prima riga\nSeconda riga subito sotto\n\nNuovo paragrafo dopo riga vuota\n\n\nUltimo dopo due righe vuote';
  const a = scheda.percorsiExtra[0].attivita[0]; a.ax = Object.assign(a.ax || {}, {mat:[{cosa:'Corda da 10 m', chi:'Anna Verdi'}, {cosa:'Fogli e pennarelli', chi:''}]}); a.sviluppo = 'Primo capoverso\n\nSecondo capoverso\nterza riga'; saveData(true); });
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => exportSchedaDocx('completo'))]);
const path = await dl.path(); fs.copyFileSync(path, '/tmp/word2.docx');
const z = await JSZip.loadAsync(fs.readFileSync(path)); const x = await z.file('word/document.xml').async('string');
// a capo: «Prima riga» e «Seconda riga» vicine, «Nuovo paragrafo» staccato
const paraOf = txt => { const i = x.indexOf(txt); if(i < 0) return null; const s = x.lastIndexOf('<w:p>', i), s2 = x.lastIndexOf('<w:p ', i), st = Math.max(s, s2); return x.slice(st, x.indexOf('</w:p>', i)); };
const aft = p => { const m = p && /<w:spacing[^>]*w:after="(\d+)"/.exec(p); return m ? +m[1] : null; };
console.log('after Prima:', aft(paraOf('Prima riga')), '· Seconda:', aft(paraOf('Seconda riga subito')), '· Nuovo:', aft(paraOf('Nuovo paragrafo')), '· Ultimo:', aft(paraOf('Ultimo dopo')));
ok(aft(paraOf('Prima riga')) === 40, 'a capo semplice: stacco stretto');
ok(aft(paraOf('Seconda riga subito')) === 160, 'riga vuota: stacco più ampio dopo il paragrafo');
ok(aft(paraOf('Nuovo paragrafo')) === 160, 'due righe vuote: un solo stacco');
ok(aft(paraOf('Ultimo dopo')) === 40, 'l’ultimo paragrafo non ha lo stacco');
ok(aft(paraOf('Primo capoverso')) !== null && /Secondo capoverso/.test(x), 'attività: capoversi nel Word');
const i1 = x.indexOf('Corda da 10 m'), iT = x.lastIndexOf('<w:tbl>', i1), iH = x.lastIndexOf('Materiale', i1);
ok(i1 > 0 && iH > 0 && iT > 0, 'materiali: tabella con intestazione «Materiale»');
ok(x.indexOf('Chi se ne occupa') > 0 && x.indexOf('Anna Verdi', i1) > 0 && x.indexOf('Fogli e pennarelli') > i1, 'materiali: colonna «Chi se ne occupa» con il nome, righe una sotto l’altra');
ok(!/chi lo procura:/.test(x), 'il vecchio paragrafo unico non c’è più');
// ogni cella termina con un paragrafo (requisito del Word)
const bad = (x.match(/<\/w:tbl><\/w:tc>/g) || []).length; ok(bad === 0, 'nessuna cella termina con una tabella (' + bad + ')');
await br.close(); summary(); process.exit(0);
