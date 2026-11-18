// Quali punti del revisore non trovano un aggancio nella pagina del compilatore? (ogni ancora del documento, una per una)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';

process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql14 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), L = db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Prova');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const LONG = ' Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'.repeat(5);
const att = (t, aid, d) => ({testo:t, link:'', lancio:'L ' + t + LONG, sviluppo:'S' + LONG, conclusione:'C' + LONG, vBene:'', vMigl:'', vAgg:'', aid, ax:d ? {data:d} : undefined});
db.t.pee_archivi.push({id:'c1', user_id:A.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'PP'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'PP', sez3Pri:1, annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'},
    priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0], idr:[0], tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0]}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[Object.assign(att('Gioco A', 'a1', '2026-11-08'),{vBene:'ok bene P',vMigl:'m'}), att('Gioco B', 'a2', '')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Gioco C', 'a3', '')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Veglia', 'a4', '')]}],
    uscite:{u1:{id:'u1', cr:1, testo:'Uscita', modello:'giorno', ax:{data:'2026-11-08', durata:'giorno', pres:{ad:[]}, luogo:{}}, prog:{m1:{k:'att', tipo:'att', pid:'P1', aid:'a1', g:1, f:['lsc','mat']}}, hid:{}, own:{}}}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});

await loginAs(P, base, A); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => { scheda.pp.nome = 'Anna Rossi'; scheda.pp.mail = {area:'altoadriatico', tutorMail:'luca.bartolomei@cngei.it'}; saveData(true); }); await sleep(500);

const st = () => ev(() => ({locked: rvLocked(), bar: !!document.getElementById('rvl-bar'), ro: Array.from(document.querySelectorAll('#main-app textarea')).filter(t => t.readOnly).length}));
const congela = async (appRev) => {
  await ev(() => ppGiroForm(1)); await sleep(800);
  await ev(a => { ppGiroDest(0, 'app', a); [0, 1, 2, 3].forEach(i => ppGiroDest(i, 'mail', !a)); }, appRev);
  await ev(() => ppGiroCongela()); await sleep(2500);
  await ev(() => window.rpLoad()); await sleep(800);
};
// 1) giro solo congelato / mail, senza revisore in app
await congela(false);
const revs1 = db.t.pee_revisioni.length, r1 = await st();
console.log('revisioni create:', revs1, JSON.stringify(r1));
ok(!r1.locked && !r1.bar && r1.ro === 0, 'senza revisore in app il progetto NON è bloccato');
// 3) registrazione a mano, senza nessun revisore: pulsante, invio, riscontro, approvazioni
await ev(() => { const it = ppIter(); it.apprB1 = {chi:'Tutor Marco', date:'2026-11-10'}; delete it.appr; });
await ev(() => ppGiroForm(2)); await sleep(800);
await ev(() => { [0, 1, 2, 3].forEach(i => { ppGiroDest(i, 'app', false); ppGiroDest(i, 'mail', false); }); });
const lab = await ev(() => document.getElementById('pp-giro-go').textContent), hint = await ev(() => document.getElementById('pp-giro-ov').textContent.includes('Nessun destinatario scelto'));
ok(/Registra l.invio/.test(lab) && hint, 'senza destinatari il pulsante dice «Registra l’invio nello storico» e c’è la spiegazione: ' + lab);
const nG = await ev(() => ppGiriList().length);
await ev(() => ppGiroCongela()); await sleep(2500); await ev(() => window.rpLoad()); await sleep(600);
const nG2 = await ev(() => ppGiriList().length), r3 = await st();
ok(nG2 === nG + 1, 'l’invio a mano è registrato (' + nG + ' → ' + nG2 + ')');
console.log(JSON.stringify(r3));
const html2 = await ev(() => ppBloccoHTML(2));
ok(/apb2-chi/.test(html2) && /fare tutto a mano/.test(html2), 'consegna finale: form di approvazione a mano e frase «fare tutto a mano»');
const html1 = await ev(() => ppBloccoHTML(1)); ok(/fare tutto a mano/.test(html1), 'prima consegna: frase «fare tutto a mano»');
await ev(() => { document.body.insertAdjacentHTML('beforeend', '<div id="zz">' + ppBloccoHTML(2) + '</div>'); document.getElementById('apb2-chi').value = 'ICdF Anna'; document.getElementById('apb2-d').value = '2026-11-17'; ppApprB2Form(); });
await sleep(500);
const ap = await ev(() => { const a = ppIter().appr; return a && a.date ? a : null; }); ok(ap && ap.chi === 'ICdF Anna' && ap.date === '2026-11-17', 'approvazione finale registrata a mano: ' + JSON.stringify(ap));
await ev(() => ppApprB2Set('', '')); ok(!(await ev(() => { const a = ppIter().appr; return a && a.date ? a : null; })), 'approvazione finale tolta');
// riscontro con esito «approva» sul giro della consegna finale
const gid = await ev(() => { const g = ppGiriList().find(x => (x.blk || 1) === 2); ppGRiscAdd(g.id); const rid = Object.keys(ppGiri()[g.id].risc)[0]; ppGRiscSet(g.id, rid, 'da', 'Tutor Marco'); ppGRiscSet(g.id, rid, 'esito', 'approva'); return g.id; });
ok(!!(await ev(() => { const a = ppIter().appr; return a && a.date ? a : null; })), 'riscontro «Approva» sul giro finale registra l’approvazione finale');
// 2) ora lo stesso progetto con revisore in app (Luca): deve bloccarsi
await congela(true);
const r2 = await st(); console.log(JSON.stringify(r2), JSON.stringify(db.t.pee_revisioni.map(v => ({e: v.revisore_email, f: v.fase, s: v.stato}))));
ok(r2.locked && r2.bar, 'con revisore in app tocca al revisore: progetto in sola lettura');

await br.close(); summary(); process.exit(0);
