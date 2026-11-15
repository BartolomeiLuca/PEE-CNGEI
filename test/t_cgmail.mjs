import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB();
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(process.argv[2] || 'chromium');
const pa = await person(br, db, {}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await ev(() => exStart('PP')); await sleep(2500);
// senza mail: modale
await ev(() => { scheda.pp.nome='Anna Rossi'; scheda.pp.mail={area:'altoadriatico',tutorMail:'t@x.it',cgMail:'',cdsMail:''}; scheda.pp.staffTab=[{ruolo:'CU',nome:'Anna',mail:'anna@x.it'},{ruolo:'CG',nome:'Mario Bianchi',mail:'',tel:'333 1234567'}]; saveData(true); });
await ev(() => { window._mt=null; ppCgAvvisa('mail'); }); await sleep(300);
ok(await ev(() => !!document.getElementById('cg-mail-in')), 'manca la mail: si chiede');
await ev(() => { document.getElementById('cg-mail-in').value='cg@x.it'; });
await P.evaluate(() => { const h=Object.getOwnPropertyDescriptor(window,'location'); }).catch(()=>{});
await ev(() => { window.__href=''; try{ ppCgAvvisa('mail','cg@x.it'); }catch(e){} }).catch(()=>{});
await sleep(300);
const st = await ev(() => ({row:(scheda.pp.staffTab.find(r=>r.ruolo==='CG')||{}).mail, m:scheda.pp.mail.cgMail}));
ok(st.row==='cg@x.it' && st.m==='cg@x.it', 'la mail chiesta si salva nella tabella: '+JSON.stringify(st));
// già compilata in tabella → giro form precompilato
await ev(() => { scheda.pp.mail.cgMail=''; scheda.pp.staffTab.find(r=>r.ruolo==='CG').mail='mario@x.it'; ppGiroForm(1); }); await sleep(600);
const d = await ev(() => window._giroForm.dest.find(x=>x.k==='cg').email);
ok(d==='mario@x.it', 'pop-up di invio: CG precompilato dalla tabella: '+d);
const ip = await ev(() => { const m=ppMailEmails(); return JSON.stringify(m); });
ok(/mario@x\.it/.test(ip), 'mail composer: CG in copia dalla tabella');
summary(); process.exit(0);
