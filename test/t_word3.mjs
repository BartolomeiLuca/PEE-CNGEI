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
const NOTE = 'Il gruppo ha lavorato bene in sottogruppi, ma durante la parte finale due ragazzi si sono isolati e abbiamo notato fatica nel rispettare i turni di parola; da riprendere alla prossima riunione con un gioco di ascolto.';
await ev((NOTE) => { const o = scheda.osservazione; 
  o.P = {positivi:'Positivo personale', necessita:'Necessità personale', singoli:'Singolo P'}; o.C = {positivi:'Positivo comunitario', necessita:'Necessità comunitaria', singoli:''}; o.S = {positivi:'Positivo spirituale', necessita:'Necessità spirituale', singoli:''};
  scheda.pp.occMan = [{att:'Caccia al tesoro', data:'2026-11-08', ctx:'Riunione', chi:[], note:'Tutti presenti', perc:['P1']}, {att:'Veglia di Reparto', data:'2026-11-15', ctx:'Uscita', chi:[], note:NOTE, perc:['C1']}, {att:'Attività libera', data:'prima del campo', ctx:'Sede', chi:[], note:'', perc:['S1']}];
  const a = scheda.percorsiExtra[0].attivita[0]; a.ax = Object.assign(a.ax || {}, {mat:[{cosa:'Corda da 10 m', chi:'Anna Verdi'}]}); saveData(true); }, NOTE);
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => exportSchedaDocx('completo'))]);
const path = await dl.path(); fs.copyFileSync(path, '/tmp/word3.docx');
const z = await JSZip.loadAsync(fs.readFileSync(path)); const x = await z.file('word/document.xml').async('string');
const txt = x.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
// date brevi
ok(/08\/11\/26/.test(txt) && /15\/11\/26/.test(txt), 'occasioni: date gg/mm/aa');
ok(!/8 novembre/.test(txt.slice(txt.indexOf('occasioni osservative'), txt.indexOf('occasioni osservative') + 2500)), 'occasioni: niente più «8 novembre» nella tabella');
ok(/prima del campo/.test(txt), 'occasioni: una data scritta a mano resta com’è');
// note lunghe
ok(/vedi sotto/.test(txt) && (txt.match(/vedi sotto/g) || []).length === 1, 'note: solo la nota lunga rimanda alla riga sotto');
ok(/Note: Il gruppo ha lavorato bene/.test(txt), 'note: testo completo nella riga a tutta larghezza');
ok(/Tutti presenti/.test(txt), 'note: la nota breve resta nella colonna');
ok(/<w:gridSpan w:val="6"\/>/.test(x), 'note: riga a tutta larghezza (6 colonne unite)');
// colori degli ambiti
const has = c => new RegExp('w:fill="' + c + '"').test(x);
ok(has('BF9000') && has('990000') && has('1155CC'), 'Aspetti positivi: etichette con i colori PEE (ocra, rosso, blu)');
ok(has('FFF8E1') && has('FCECEC') && has('EAF1FC'), 'tinte chiare degli ambiti nelle tabelle');
ok(!/w:fill="404040"/.test(x) === false, 'intestazione neutra nella tabella degli ambiti');
const iS2 = x.indexOf('Sezione 2'), iS3 = x.indexOf('Sezione 3');
const sec2 = x.slice(iS2, iS3);
ok(/w:fill="FCECEC"/.test(sec2) && /w:fill="EAF1FC"/.test(sec2) && /w:fill="FFF8E1"/.test(sec2), 'Sezione 2: tabelle di priorità nel colore del proprio ambito');
const sec3 = x.slice(iS3);
ok(/w:fill="FFF8E1"/.test(sec3) && /w:fill="FCECEC"/.test(sec3), 'Sezione 3: tabelle dei percorsi nel colore del proprio ambito');
ok(!/w:fill="F1F7F3"/.test(sec2 + sec3.slice(0, sec3.indexOf('Sezione 4') > 0 ? sec3.indexOf('Sezione 4') : sec3.length)), 'Sezioni 2-3: non resta il colore della Branca nelle tabelle degli ambiti');

// Sezione 4: tabelle delle verifiche nel colore dell'ambito del percorso
{ const i4 = x.indexOf('Sezione 4'); const i5 = x.indexOf('Sezione 5'); const s4 = i4 > 0 ? x.slice(i4, i5 > 0 ? i5 : undefined) : '';
  ok(s4.length > 0 && /w:fill="FFF8E1"/.test(s4), 'Sezione 4: verifica del percorso Personale nella tinta dell’ambito'); }
// testi lunghi: ogni ambito è una fascia piena a tutta larghezza
await ev(() => { scheda.osservazione.P.positivi = 'x '.repeat(220); saveData(true); });
const [dl2] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => exportSchedaDocx('completo'))]);
const z2 = await JSZip.loadAsync(fs.readFileSync(await dl2.path())); const x2 = await z2.file('word/document.xml').async('string');
ok(/<w:gridSpan w:val="2"\/>[\s\S]{0,400}?BF9000|BF9000[\s\S]{0,400}?<w:gridSpan w:val="2"\/>/.test(x2), 'testi lunghi: fascia dell’ambito a tutta larghezza nel colore PEE');
await br.close(); summary(); process.exit(0);
