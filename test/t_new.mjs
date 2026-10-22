// 22 ottobre: link preciso, attività delle uscite in Cerca e archivio, liberatoria, scalette spostabili, 30 video
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine);
const pa = await person(br, db), P = pa.page, ev = (f, a) => P.evaluate(f, a);
const errs = []; P.on('pageerror', e => errs.push(String(e)));
await loginAs(P, base, A); await ev(() => exStart()); await sleep(3000);
// ---- video
ok(await ev(() => VIDEOS.length) === 30 && await ev(() => vidGroups().reduce((n,g)=>n+g.L.length,0)) === 30, '30 video in 9 gruppi');
await ev(() => vidOpen(30)); await sleep(400);
const src = await ev(() => document.querySelector('video.vid-v').getAttribute('src'));
ok(/\/video\/pee-30\.mp4/.test(src), 'il video 30 punta a /video/');
const st = await ev(async s => (await fetch(s)).status, src); ok(st === 200, 'il file del video 30 si scarica (200)');
const st2 = await ev(async () => (await fetch('/video/pee-17.jpg')).status); ok(st2 === 200, 'copertina 17 raggiungibile');
await ev(() => modalClose && modalClose());
ok(await ev(() => { gGo('1a'); return vidHere(); }) === 7 && await ev(() => { gGo('2'); return vidHere(); }) === 13, 'vidHere: 1.1→7, Sezione 2→13');
// ---- scalette spostabili nelle attività
await ev(() => gGo('3')); await sleep(900);
const iP = await ev(() => getAllPercorsi().findIndex(p => (p.attivita||[]).some(a => (a.testo||'').trim())));
const jA = await ev(i => getAllPercorsi()[i].attivita.findIndex(a => (a.testo||'').trim()), iP);
await ev(([i,j]) => { axTT(i,j,0,'start','15:00'); axTT(i,j,0,'cosa','Primo'); axTT(i,j,0,'dur',20); axTT(i,j,1,'cosa','Secondo'); axTT(i,j,1,'dur',30); axTT(i,j,2,'cosa','Terzo'); axTT(i,j,2,'dur',10); }, [iP, jA]);
await ev(([i,j]) => axTTMove(i,j,0,1), [iP, jA]);
let o = await ev(([i,j]) => getAllPercorsi()[i].attivita[j].ax.tt2.map(r => r.cosa+'|'+(r.start||'')), [iP, jA]);
ok(o.join(',') === 'Secondo|15:00,Primo|,Terzo|', 'scaletta: giù sposta la riga e l’ora d’inizio resta alla prima ('+o.join(',')+')');
await ev(([i,j]) => axTTMove(i,j,2,-1), [iP, jA]);
o = await ev(([i,j]) => getAllPercorsi()[i].attivita[j].ax.tt2.map(r => r.cosa), [iP, jA]); ok(o.join(',') === 'Secondo,Terzo,Primo', 'scaletta: su sposta');
await ev(([i,j]) => axTTMove(i,j,0,-1), [iP, jA]); o = await ev(([i,j]) => getAllPercorsi()[i].attivita[j].ax.tt2.map(r => r.cosa), [iP, jA]); ok(o.join(',') === 'Secondo,Terzo,Primo', 'ai bordi non succede nulla');
await ev(([i,j]) => axRe(i,j), [iP, jA]); await sleep(300);
ok(await P.locator(`#ax-${iP}-${jA} .ax-ttr .ax-mv`).count() >= 3, 'frecce ↑ ↓ × visibili sulle righe');
// ---- liberatoria
const html = await ev(([i,j]) => document.getElementById('ax-'+i+'-'+j).innerHTML, [iP, jA]);
ok(/Vademecum_cassetta_primo_soccorso\.pdf/.test(html) && /Liberatoria_somministrazione_farmaci\.pdf/.test(html) && /Liberatoria assunzione farmaci/.test(html), 'attività: link al Vademecum e «Liberatoria assunzione farmaci»');
ok(html.indexOf('Vademecum') < html.indexOf('Liberatoria assunzione farmaci'), '…la liberatoria sta sotto il Vademecum');
const lib = await ev(async () => (await fetch('circolare/Liberatoria_somministrazione_farmaci.pdf')).status); ok(lib === 200, 'il PDF della liberatoria si apre');
// ---- uscita con attività nuova
await ev(() => { window._uscNoPrint = true; uscNewStart(); }); await sleep(400);
await P.fill('#usc-new-t', 'Uscita di prova'); await P.fill('#usc-new-d1', '2026-11-14'); await P.locator('#usc-new-d1').dispatchEvent('change'); await sleep(100);
await P.locator('button', {hasText:'Crea l’uscita'}).click(); await sleep(900);
const pi = await ev(() => USC_PALS.findIndex(z => z[0] === 'nuova'));
await ev(i => uscBlkAdd(i), pi); await sleep(400);
const kN = await ev(() => Object.keys(uscCur().prog).find(k => uscCur().prog[k].k === 'nuova'));
await ev(k => { uscBlkSet(k,'t','Caccia al tesoro del bosco'); uscBlkSet(k,'desc','Le pattuglie cercano gli indizi lungo il sentiero.'); const m = uscBlk(k); m.tt = [{cosa:'Spiegazione',dur:10},{cosa:'Caccia',dur:40},{cosa:'Giro finale',dur:15}]; uscSave(); uscRe(); }, kN); await sleep(300);
await ev(k => uscRowMove(k,'tt',2,-1), kN);
o = await ev(k => uscBlk(k).tt.map(r => r.cosa), kN); ok(o.join(',') === 'Spiegazione,Giro finale,Caccia', 'blocco uscita: scaletta spostabile ('+o.join(',')+')');
await ev(k => USC_OPEN[k] = true, kN); await ev(() => uscRe()); await sleep(300);
ok(await P.locator(`#usc-b-${kN} .usc-scr .ax-mv`).count() >= 3, 'blocco uscita: frecce visibili');
// pasto non proponibile
const kP = await ev(() => { const id = uscNewId('m'); uscCur().prog[id] = {k:'pasto',tipo:'mom',g:1,ord:99,dur:45,t:'Pranzo',desc:'Pasta',f:['menu','chi'],cr:Date.now()}; return id; });
const fl = await ev(() => anFlatUsc({uscite:scheda.uscite}, 'E', null).map(z => z.titolo+'|'+z.uk));
ok(fl.length === 1 && /Caccia al tesoro/.test(fl[0]), 'anFlatUsc: solo l’attività, non il pasto ('+fl.join(';')+')');
const flAll = await ev(() => anFlat(scheda, 'E', 'cur').filter(z => z.usc).length); ok(flAll === 1, 'anFlat include le attività delle uscite');
// pulsante Proponi nel blocco
await ev(k => { USC_OPEN[k] = true; uscRe(); }, kN); await sleep(300);
ok(await P.locator(`#usc-b-${kN} .an-prop button`).count() === 1 && /Proponi all’archivio nazionale/.test(await P.locator(`#usc-b-${kN} .an-prop`).textContent()), 'blocco uscita: «Proponi all’archivio nazionale»');
ok(await P.locator(`#usc-b-${kP} .an-prop`).count() === 0, '…ma non nel pasto');
ok(await P.locator('#an-open').count() === 1, 'barra «Cerca un’attività» anche nelle Uscite');
// ---- Cerca: l'attività dell'uscita c'è e «Apri» porta nel punto esatto
await ev(() => gGo('1a')); await sleep(500);
await ev(() => anOpen()); await sleep(1500);
await P.fill('#an-q', 'tesoro'); await sleep(300);
ok(await P.locator('.an-card').count() === 1, 'Cerca «tesoro»: trovata l’attività dell’uscita');
await P.locator('.an-card button', {hasText:'Apri'}).click(); await sleep(2200);
const pos = await ev(k => { const e = document.getElementById('usc-b-'+k); const h = document.querySelector('.hdr').getBoundingClientRect().height; const sb = document.getElementById('g-subnav'); const sh = sb && getComputedStyle(sb).position === 'sticky' ? sb.getBoundingClientRect().height : 0; return e ? {top: Math.round(e.getBoundingClientRect().top), bar: Math.round(h+sh), step: schedaStep, cur: USC_CUR===uscCur()?.id} : null; }, kN);
ok(pos && pos.step === 'usc' && pos.top >= pos.bar - 2 && pos.top <= pos.bar + 60, 'Apri → uscita aperta e blocco subito sotto le barre fisse ('+JSON.stringify(pos)+')');
// ---- Cerca → attività del percorso, punto preciso
await ev(() => anOpen()); await sleep(1500); await P.fill('#an-q', '');
const nm = await ev(([i,j]) => getAllPercorsi()[i].attivita[j].testo, [iP, jA]);
await P.fill('#an-q', nm.split(' ')[0]); await sleep(300);
const idx = await ev(n => AN_CUR.findIndex(r => r.titolo === n && !r.usc), nm);
ok(idx >= 0, 'Cerca: trovata l’attività del percorso «'+nm+'»');
await ev(i => anGoMine(i), idx); await sleep(2500);
const pos2 = await ev(([i,j]) => { const e = document.getElementById('att-'+i+'-'+j); const h = document.querySelector('.hdr').getBoundingClientRect().height; const sb = document.getElementById('g-subnav'); const sh = sb && getComputedStyle(sb).position === 'sticky' ? sb.getBoundingClientRect().height : 0; return e ? {top: Math.round(e.getBoundingClientRect().top), bar: Math.round(h+sh), open: e.open} : null; }, [iP, jA]);
ok(pos2 && pos2.open && pos2.top >= pos2.bar - 2 && pos2.top <= pos2.bar + 60, 'Apri → attività aperta e inizio subito sotto le barre fisse ('+JSON.stringify(pos2)+')');
// salto in sospeso (altro progetto): consumato dal controllo periodico
await ev(() => gGo('1a')); await sleep(500);
await ev(k => { sessionStorage.setItem('pee_jump', JSON.stringify({t:'usc',u:uscCur().id,k:k,g:1})); anJumpWatch(); }, kN); await sleep(4000);
ok(await ev(() => !sessionStorage.getItem('pee_jump') && schedaStep === 'usc'), 'salto in sospeso eseguito dopo l’apertura del progetto');
// riusa nell'uscita aperta
await ev(() => anOpen()); await sleep(1500); await P.fill('#an-q', 'tesoro'); await sleep(300);
ok(await P.locator('.an-card button', {hasText:'Aggiungi all’uscita aperta'}).count() === 1, 'dentro le Uscite: «Aggiungi all’uscita aperta»');
const nb = await ev(() => Object.keys(uscCur().prog).length);
await P.locator('.an-card button', {hasText:'Aggiungi all’uscita aperta'}).click(); await sleep(800);
ok(await ev(() => Object.keys(uscCur().prog).length) === nb + 1, '…aggiunge un momento all’uscita');
// guida / FAQ
ok(await ev(() => FAQ.some(f => /cerco un’attività/i.test(f[1])) && TOUR.length === 6 && /Trenta video|trenta video/.test(NOVITA[0].i.join(' '))), 'FAQ, giro guidato e Novità aggiornati');
ok(errs.length === 0, 'nessun errore di pagina '+errs.slice(0,2).join(' | '));
await br.close(); summary();
