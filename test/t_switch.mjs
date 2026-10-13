// Cambio di account nello stesso browser: nessuno vede il progetto dell'altro
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A);
await ev(() => exStart()); await sleep(3000);
ok(await ev(() => UNIT_NAME === 'Reparto Kontiki' && CL.ctx && CL.ctx.uid), 'Anna lavora sull’esempio (progetto con proprietario annotato)');
// esce
await ev(() => clLogout()).catch(() => {}); await sleep(3000);
const out = await ev(() => ({user: !!CL.user, ctx: CL.ctx, local: localStorage.getItem(LSK), welcome: document.getElementById('welcome-screen').style.display !== 'none', unit: UNIT_NAME}));
ok(!out.user && !out.ctx && !out.local && out.welcome && out.unit !== 'Reparto Kontiki', 'uscendo: browser svuotato, pagina iniziale');
ok(db.t.pee_archivi.some(r => r.user_id === A.id && r.data && r.data.UNIT_NAME === 'Reparto Kontiki'), 'il progetto di Anna resta nel cloud');
// Bruno si registra nello stesso browser
await ev(() => clOpen()); await sleep(300);
await P.click('#cl-ov >> text=Crea account');
await P.fill('#cl-nome', 'Bruno Verdi'); await P.fill('#cl-email', 'bruno@x.it'); await P.fill('#cl-pw', 'password123'); await P.fill('#cl-pw2', 'password123');
await P.click('#cl-go'); await sleep(3000);
const b = await ev(() => ({t: document.getElementById('cl-title').textContent, body: document.getElementById('cl-body').textContent, unit: UNIT_NAME, titolo: CL.ctx && CL.ctx.titolo}));
ok(/Account creato/.test(b.t) && /bruno@x\.it/.test(b.body), 'Bruno: «Account creato, ti abbiamo mandato una mail»');
ok(b.unit !== 'Reparto Kontiki' && !/Esempio/.test(b.titolo || ''), 'Bruno non vede il progetto di Anna (' + b.titolo + ')');
const B = db.users.find(u => u.email === 'bruno@x.it');
ok(!db.t.pee_archivi.some(r => r.user_id === B.id && r.data && r.data.UNIT_NAME === 'Reparto Kontiki'), 'nel cloud di Bruno non finisce nulla di Anna');
// caso vecchio: progetto aperto senza proprietario annotato, entra un altro account senza uscire
await ev(() => clClose());
await ev(() => clLogout()).catch(() => {}); await sleep(3000);
await loginAs(P, base, A); await sleep(2500);
ok(await ev(() => /Esempio/.test((CL.ctx||{}).titolo || '')), 'Anna rientra e ritrova il suo progetto');
await ev(() => { delete CL.ctx.uid; localStorage.setItem(CL_CTX, JSON.stringify(CL.ctx)); });
await ev(u => localStorage.setItem('fake_sb_session', JSON.stringify({user:{id:u.id, email:u.email, user_metadata:{}}, access_token:'t'})), {id:B.id, email:B.email});
await P.reload(); await sleep(4000);
const c = await ev(() => ({unit: UNIT_NAME, titolo: CL.ctx && CL.ctx.titolo, user: CL.user && CL.user.email}));
ok(c.user === 'bruno@x.it' && c.unit !== 'Reparto Kontiki' && !/Esempio/.test(c.titolo || ''), 'progetto di prima senza proprietario: per Bruno sparisce (' + c.titolo + ')');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
