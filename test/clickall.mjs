// «L'anno di solito»: griglia uniforme, intestazioni bloccate, popup, mobile
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); db.sql13 = true;
const ua = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:ua.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1'});

const p = await person(br, db, {ctx:{viewport:{width:1500, height:1000}}}); const A = p.page, ea=(f,x)=>A.evaluate(f,x);
await loginAs(A, base, ua); await sleep(1500);
await ea(() => shTip()); await ea(()=>{document.getElementById('main-app').style.display='block'; document.querySelectorAll('body > *').forEach(e=>{if(e.id!=='main-app'&&!e.contains(document.getElementById('main-app'))&&e.tagName!=='SCRIPT')e.style.display='none'})}); await sleep(300);
let bad=0,tot=0;
for (const k of ['G','L','E','R']) { await ea(k => tipSet(k), k); await sleep(200);
 const res = await ea(async () => { const out=[]; const bs=[...document.querySelectorAll('.tg-t .tgi')]; for (const b of bs){ b.click(); await new Promise(r=>setTimeout(r,30)); const m=document.querySelector('#modal-ov, .modal, #g-modal, [id*=modal]'); const dl=document.querySelector('.tg-dl'); const vis=!!dl&&dl.offsetParent!==null; out.push([b.textContent.trim(), /ⓘ/.test(b.textContent), vis, dl?dl.innerText.length:0]); try{modalClose()}catch(e){} } return out; });
 for (const r of res){ tot++; if(!r[2]||r[3]<40){bad++; console.log(k,JSON.stringify(r));} } }
console.log('tot',tot,'bad',bad);
await br.close(); process.exit(0);
