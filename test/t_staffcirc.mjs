import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const row = (id, anno, titolo, tipo, data, ts) => ({id, user_id:u.id, anno, titolo, meta:{mode:'giovani', fascia:'E', tipo, nome:'Reparto Kontiki'}, data:Object.assign({v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto Kontiki'}, data), created_at:ts, updated_at:ts});
// PP 2026 con contenuto; PE 2026 vuota; PE 2025 con contesto, sede, staff e verifiche
db.t.pee_archivi.push(row('pe', 2026, 'Programmazione Annuale 2026-27 · Reparto Kontiki', 'AN', {scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}}}, '2026-10-21T10:00:00Z'));

const fs = (await import('fs')).default; const { execSync } = await import('child_process'); const JSZip = (await import('/home/claude/work/node_modules/jszip/lib/index.js')).default; const OUT = '/tmp/t_staffcirc'; fs.mkdirSync(OUT, {recursive:true});
await loginAs(P, base, u); await sleep(1200);
P.evaluate(() => shOpen('pe', 0)).catch(() => {}); await sleep(3000);
await ev(() => { try{ if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }catch(e){} }); await sleep(2500);
const r = await ev(() => { UNIT_NAME = 'Reparto Kontiki2'; const id = uscNewId('u'); uscMap()[id] = {id, cr:Date.now(), testo:'Bivacco di staff', modello:'sede', ax:{data:'2026-12-05', durata:'giorno', pres:{ad:['Giulia (CU)','Paolo (VCU)']}, luogo:{tipo:'sede'}, cibo:{carico:'ragazzi'}}, prog:{}, hid:{}, own:{}, dest:'staff', riservata:false}; saveData(true); USC_CUR = id; gGo('usc'); const j = uscJ(id); return {id, j}; });
await sleep(800);
await ev(() => { const id = USC_CUR; uscRe(); });
console.log(JSON.stringify(await ev(() => ({MODE, cur:USC_CUR, ax:window._axP, P:USC_P, st:uscSt(), axst:axSt(), dest:(uscGet(USC_CUR)||{}).dest, step:schedaStep}))));
const [html, msg] = await ev(([j]) => { window._axP = USC_P; const u = uscByJ(j); const h = axCirc(USC_P, j, u, u.ax); return [h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), axMsgText(USC_P, j)]; }, [r.j]);
ok(/Cosa portano i partecipanti/.test(html), 'circolare staff: titolo «Cosa portano i partecipanti»');
ok(/Di Staff di Unità/.test(html) && !/Di pattuglia/.test(html), 'circolare staff: «Di Staff di Unità», non «Di pattuglia»');
ok(/Conferma di presenza/.test(html) && !/Autorizzazioni/.test(html), 'circolare staff: conferma di presenza, niente autorizzazioni');
ok(!/ragazzi/i.test(html), 'circolare staff: nessun riferimento ai ragazzi: ' + (html.match(/.{30}ragazz.{30}/i) || [''])[0]);
ok(/lo staff del Reparto «Kontiki2»/.test(msg), 'messaggio: lo staff del Reparto «Kontiki2»');
ok(!/ragazzi|Reparto Kontiki2 vive|il Reparto /.test(msg.replace('lo staff del Reparto','')), 'messaggio senza «ragazzi»: ' + (msg.match(/.{20}ragazz.{20}/i) || [''])[0]);
console.log(msg.slice(0, 900));
// Word
const [d] = await Promise.all([P.waitForEvent('download', {timeout:30000}), ev(([j]) => { window._axP = USC_P; return axMsgDocx(USC_P, j); }, [r.j])]);
fs.copyFileSync(await d.path(), OUT + '/s.docx');
const z = await JSZip.loadAsync(fs.readFileSync(OUT + '/s.docx')); const dx = (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
ok(/[Ll]o staff del Reparto «Kontiki2»/.test(dx), 'Word: lo staff del Reparto «nome»');
ok(!/ragazzi/i.test(dx), 'Word senza «ragazzi»: ' + (dx.match(/.{30}ragazz.{30}/i) || [''])[0]);
// unità subito dopo: i tipi sono quelli dell'Unità
await ev(() => { shCal(); });
await sleep(500);
await ev(() => { SH._calDest = null; calNew('sede'); }); await sleep(400);
const tipi = await ev(() => [...document.querySelectorAll('#cal-tp option')].map(o => o.textContent));
ok(!tipi.some(t => /Bivacco di staff|Riunione di staff|formativa/i.test(t)) && tipi.length > 3, 'calendario: dopo uno staff, l’attività per l’Unità ha i tipi dell’Unità: ' + tipi.join(' | '));
summary(); await br.close(); process.exit(0);
