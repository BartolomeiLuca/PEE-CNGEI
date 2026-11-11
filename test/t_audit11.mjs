// Verifica dell'11/11 (Parte 1 — dati): salvataggio «subito» con un'altra persona al lavoro, cambio di progetto con testo appena scritto,
// «Carica file .json» con l'account, elenco lungo dei campi toccati
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi'), D = db.addUser('dario@x.it', 'password123', 'Dario Blu');
const br = await launch(engine);
const pa = await person(br, db), PA = pa.page; const ea = (f, a) => PA.evaluate(f, a);
await loginAs(PA, base, A); await ea(() => exStart()); await sleep(2500);
await ea(() => gGo('3')); await sleep(900);
const iP = await ea(() => getAllPercorsi().findIndex(p => p.percorsoId === 'P5'));
const pid = await ea(() => CL.ctx.id);
const row = () => db.t.pee_archivi.find(r => r.id === pid);
const lancio = d => { try{ const L = [].concat((d.scheda.percorsi || []), (d.scheda.percorsiExtra || [])); return JSON.stringify(d).includes('(scritto da Dario)'); }catch(e){ return false; } };
// ── 1 · due persone: Dario scrive, Anna (che sta lavorando e non ha ancora ricevuto la modifica) salva «subito» ──
await ea(async () => { await dbInvite(CL.ctx.id, 'dario@x.it', 'cotitolare'); await clMemLoad(); }); await sleep(800);
const pd = await person(br, db), PD = pd.page; const ed = (f, a) => PD.evaluate(f, a);
await loginAs(PD, base, D); await sleep(1200);
await ed(() => { const x = (CL._inv||[])[0]; clInvOpen(x.id); }); await sleep(3500);
await ed(() => gGo('3')); await sleep(1200);
await PA.locator('body').click({position:{x:5, y:5}});
await ea(() => { window.__keepBusy = setInterval(() => { window._clClickAt = Date.now(); }, 200); });   // Anna è al lavoro: l'app non le aggiorna la pagina sotto le dita
await sleep(400);
await PD.locator(`#att-${iP}-0 textarea[oninput*="'lancio'"]`).click(); await PD.keyboard.type(' (scritto da Dario)');
for(let i = 0; i < 40 && !lancio(row().data); i++) await sleep(250);
ok(lancio(row().data), 'il testo di Dario è nel cloud');
const annaHas = await ea(() => JSON.stringify(scheda).includes('(scritto da Dario)'));
ok(!annaHas, 'Anna non ha ancora ricevuto la modifica (sta lavorando)');
const r1 = await ea(async () => { _clTouched = true; _clUserAt = Date.now(); setUnitName('Reparto di Anna'); saveData(true); return (await clPush(true)) || ''; });
await sleep(1500);
ok(lancio(row().data), 'dopo il salvataggio «subito» di Anna il testo di Dario è ancora nel cloud (esito: «' + r1 + '»)');
ok(row().data.UNIT_NAME === 'Reparto di Anna', 'e nel cloud c’è anche la modifica di Anna');
ok(await ea(() => JSON.stringify(scheda).includes('(scritto da Dario)')), 'Anna ora vede il testo di Dario');
await ea(() => clearInterval(window.__keepBusy)); await sleep(6000);
ok(await ed(() => JSON.stringify(scheda).includes('(scritto da Dario)') && UNIT_NAME === 'Reparto di Anna'), 'Dario ha il suo testo e la modifica di Anna');
// «Continua con la versione che ho qui» resta una sostituzione voluta
ok(await ea(() => /force !== 'mine'/.test(String(clPush)) && /clPush\('mine'\)/.test(String(clConflict))), 'la scelta esplicita «la versione che ho qui» sostituisce ancora (con copia in Versioni precedenti)');
await pd.ctx.close();
// ── 2 · testo appena scritto e subito un altro progetto ──
db.t.pee_archivi.push({id:'p-altro', user_id:A.id, anno:2026, titolo:'Altro progetto', meta:{mode:'giovani', fascia:'E'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Altro', obs:{}, pris:{}, scheda:{pp:{}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await ea(() => gGo('3')); await sleep(900);
await PA.locator(`#att-${iP}-1 textarea[oninput*="'sviluppo'"]`).click(); await PA.keyboard.type(' ULTIME-PAROLE');
await ea(() => { clOpenProject('p-altro'); }); await sleep(4500);
ok(JSON.stringify(row().data).includes('ULTIME-PAROLE'), 'il testo scritto un attimo prima di aprire un altro progetto è nel cloud');
ok(await ea(() => CL.ctx && CL.ctx.id === 'p-altro'), 'l’altro progetto si è aperto');
// ── 3 · «Carica file .json» (finestra dell'archivio) con l'account: non sostituisce il progetto aperto ──
const before = JSON.stringify(db.t.pee_archivi.find(r => r.id === 'p-altro').data);
fs.writeFileSync('/tmp/audit_one.json', JSON.stringify({titolo:'Vecchia copia', anno:2025, data:{v:1, MODE:'giovani', FASCIA:'L', UNIT_NAME:'DAL-FILE', obs:{}, pris:{}, scheda:{pp:{nome:'DAL-FILE'}}}}));
await ea(() => clShow('archive')); await sleep(1200);
await PA.locator('#cl-body input[type=file]').setInputFiles('/tmp/audit_one.json'); await sleep(1200);
const s3 = await ea(() => ({tit: document.getElementById('cl-title').textContent, body: document.getElementById('cl-body').textContent.slice(0, 400), ls: (JSON.parse(localStorage.getItem('bussola_pee_v6') || '{}').UNIT_NAME) || ''}));
ok(/Ripristina da file/.test(s3.tit) && /Vecchia copia \(caricato\)/.test(s3.body), 'il file si presenta come progetto da aggiungere all’archivio (' + s3.tit + ')');
ok(s3.ls !== 'DAL-FILE', 'il lavoro aperto su questo dispositivo non è stato sostituito');
await PA.locator('#cl-body button', {hasText:'Aggiungi come copia'}).click(); await sleep(1500);
ok(db.t.pee_archivi.some(r => r.titolo === 'Vecchia copia (caricato)' && r.anno === 2025 && r.data.UNIT_NAME === 'DAL-FILE'), 'aggiunto all’archivio come progetto a sé');
await ea(() => clClose()); await sleep(2500);
ok(JSON.stringify(db.t.pee_archivi.find(r => r.id === 'p-altro').data) === before, 'il progetto aperto nel cloud è rimasto com’era');
// ── 4 · più di 400 campi toccati: restano tutti «miei» ──
const cov = await ea(() => { _clTouched = true; _clUserAt = Date.now(); scheda.pp.provaAudit = {}; for(let i = 0; i < 450; i++) scheda.pp.provaAudit['k' + i] = 'v' + i; saveData(true);
  const up = CL.ctx.upaths || []; let n = 0; for(let i = 0; i < 450; i++) if(clCovers(up, '/scheda/pp/provaAudit/k' + i)) n++; return {n, len: up.length}; });
ok(cov.n === 450 && cov.len <= 400, '450 campi cambiati: tutti coperti dall’elenco delle modifiche fatte dalla persona (' + JSON.stringify(cov) + ')');
ok(!pa.errors.length, 'nessun errore JS ' + pa.errors.slice(0, 3).join(' | '));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
