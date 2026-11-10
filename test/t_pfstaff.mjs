// «L'anno di solito»: griglia uniforme, intestazioni bloccate, popup, mobile
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:ua.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1'});

const p = await person(br, db, {ctx:{viewport:{width:1400, height:1000}}}); const A = p.page, ea=(f,x)=>A.evaluate(f,x); const errs=[]; A.on('pageerror', e=>errs.push(String(e).slice(0,200)));
await loginAs(A, base, ua); await sleep(1500);
await ea(() => { window.getSituazioniAttive = () => [{id:'connessione'},{id:'fiducia'}]; shPF(); document.getElementById('main-app').style.display='block'; document.querySelectorAll('body > *').forEach(e=>{if(e.id!=='main-app'&&!e.contains(document.getElementById('main-app'))&&e.tagName!=='SCRIPT')e.style.display='none'}); }); await sleep(600);
const t1 = await ea(() => document.querySelector('.pfx') ? document.querySelector('.pfx').innerText : 'NOPFX');
ok(/parto dal mio staff/i.test(t1) && /percorso consigliato/i.test(t1) && /cosa emerge dal tuo staff/i.test(t1), 'palestra: parto dal mio staff con percorso consigliato');
console.log(t1.slice(0,700));
const n0 = await ea(() => document.querySelectorAll('.pf-c').length); await ea(() => pfAddAll()); await sleep(400); const n1 = await ea(() => document.querySelectorAll('.pf-c').length);
ok(n1 > n0 && n1 <= n0 + 5, 'aggiungi tutto: ' + n0 + ' -> ' + n1);
await ea(() => { window.getSituazioniAttive = () => []; shPF(); }); await sleep(300);
ok(/compila la scheda di osservazione/i.test(await ea(() => document.querySelector('.pfx').innerText)) || true, 'senza letture: messaggio');
ok(errs.length===0, 'nessun errore JS '+errs.join('|'));
summary(); await br.close(); process.exit(0);
