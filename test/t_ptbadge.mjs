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
await ev(() => { const d = new Date(Date.now() + 2*864e5).toISOString().slice(0,10); const a = scheda.percorsiExtra[0].attivita[1]; a.ax = Object.assign(a.ax || {}, {data:d, mat:[{cosa:'Corda da 10 m', chi:'Anna Verdi'}]}); _clTouched = true; saveData(true); });
await ev(() => clPerTe()); await sleep(2500);
const r = await ev(() => ({ n: (document.querySelector('.hd-lnk[data-n]')||{getAttribute:()=>null}).getAttribute('data-n'), perte: (CL.perte||[]).map(x => x.k + (x.self?'(self)':'') + (x.hot?'*':'')), scad: (CL.scad||[]).map(x => x.k + (x.self?'(self)':'') + (x.hot?'*':'')), hotN: ptHotN(CL.perte||[]), boxes: document.querySelectorAll('#sh-perte details').length, cn: CL._ptN }));
ok(r.scad.some(x => /mat\(self\)/.test(x)), 'titolare: il materiale affidato a sé è in «Prossime scadenze»');
ok(r.perte.length === 0 && r.boxes === 0, 'titolare: niente «Per te» per ciò che si è affidata da sola');
ok(r.n === null && r.cn === 0, 'titolare: nessun numerino su «Progetti» (' + JSON.stringify(r.n) + ')');
await br.close(); summary(); process.exit(0);
