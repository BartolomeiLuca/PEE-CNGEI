// COLLAUDO DEFINITIVO — incroci tra ruoli, dispositivi, uscite, Cerca, Proponi, scalette, archivio nazionale
// uso: node t_coll.mjs <motore> [profili separati da virgola]   (profili: desktop + nomi dei dispositivi di Playwright)
import { devices } from 'playwright';
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const DEVS = (process.argv[3] || 'desktop,iPhone SE,iPhone 13,Pixel 7,Galaxy S9+,iPad (gen 7),iPad Pro 11 landscape,Galaxy Tab S4').split(',');
const base = await serve(); const db = new FakeDB(); db.sql13 = true;
const U = {
  anna: db.addUser('anna@x.it', 'password123', 'Anna Rossi'), bruno: db.addUser('bruno@x.it', 'password123', 'Bruno Verdi'),
  carla: db.addUser('carla@x.it', 'password123', 'Carla Neri'), dario: db.addUser('dario@x.it', 'password123', 'Dario Blu'),
  elena: db.addUser('elena@x.it', 'password123', 'Elena Gialli'), luca: db.addUser('luca.bartolomei@cngei.it', 'password123', 'Luca Bartolomei') };
const br = await launch(engine);
const ctxFor = d => { if(d === 'desktop') return {}; const x = Object.assign({}, devices[d]); delete x.defaultBrowserType; if(engine === 'firefox') delete x.isMobile; return {ctx: x}; };
const innerHeightOf = d => d === 'desktop' ? 900 : devices[d].viewport.height;
const errsAll = [];
const open = async (dev, user) => { db.t.pee_membri.forEach(m => { m.visto_il = null; }); const p = await person(br, db, ctxFor(dev)); await p.ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = 'html{scroll-behavior:auto!important}'; document.head.appendChild(s); }); }); await loginAs(p.page, base, user); p.ev = (f, a) => p.page.evaluate(f, a); return p; };
const noOverflow = p => p.ev(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
const openInv = async p => { for (let i = 0; i < 8; i++) { if (await p.ev(() => (CL._inv || []).length)) break; await sleep(500); } await p.ev(pid => { const x = (CL._inv || [])[0]; if (x) clInvOpen(x.id); else clOpenProject(pid); }, pid); await sleep(3800); };
const finish = p => { errsAll.push(...p.errors); return p.ctx.close().catch(() => {}); };

// ───────── 1. Anna prepara il progetto condiviso ─────────
const pa = await open('desktop', U.anna), A = pa.page, ea = pa.ev;
await ea(() => exStart()); await sleep(3500);
const pid = await ea(() => CL.ctx.id);
await ea(() => gGo('3')); await sleep(900);
const iP = await ea(() => getAllPercorsi().findIndex(p => (p.attivita || []).some(a => (a.testo || '').trim())));
const jA = await ea(i => getAllPercorsi()[i].attivita.findIndex(a => (a.testo || '').trim()), iP);
const ttl = await ea(([i, j]) => getAllPercorsi()[i].attivita[j].testo, [iP, jA]);
await ea(([i, j]) => { axTT(i, j, 0, 'start', '15:00'); axTT(i, j, 0, 'cosa', 'Primo'); axTT(i, j, 0, 'dur', 20); axTT(i, j, 1, 'cosa', 'Secondo'); axTT(i, j, 1, 'dur', 30); axTT(i, j, 2, 'cosa', 'Terzo'); axTT(i, j, 2, 'dur', 10); }, [iP, jA]);
await ea(() => { window._uscNoPrint = true; uscNewStart(); }); await sleep(400);
await A.fill('#usc-new-t', 'Uscita collaudo'); await A.fill('#usc-new-d1', '2026-11-14'); await A.locator('#usc-new-d1').dispatchEvent('change'); await sleep(100);
await A.locator('button', {hasText: 'Crea l’uscita'}).click(); await sleep(900);
const piN = await ea(() => USC_PALS.findIndex(z => z[0] === 'nuova')); await ea(i => uscBlkAdd(i), piN); await sleep(300);
const kN = await ea(() => Object.keys(uscCur().prog).find(k => uscCur().prog[k].k === 'nuova'));
await ea(k => { uscBlkSet(k, 't', 'Caccia al tesoro del bosco'); uscBlkSet(k, 'desc', 'Le pattuglie cercano gli indizi.'); uscBlk(k).tt = [{cosa:'Spiegazione', dur:10}, {cosa:'Caccia', dur:40}, {cosa:'Giro finale', dur:15}]; uscSave(); uscRe(); }, kN);
const uid = await ea(() => uscCur().id);
await ea(async () => { for (const [m, r] of [['bruno@x.it', 'cotitolare'], ['carla@x.it', 'collaboratore'], ['dario@x.it', 'lettore']]) await dbInvite(CL.ctx.id, m, r); await clMemLoad(); saveData(true); });
await sleep(9000);
const dbAff = () => { try { return row().data.scheda.percorsiExtra[iP].attivita[jA].aff; } catch (e) { return 'ERR'; } };
const row = () => db.t.pee_archivi.find(r => r.id === pid);
const dbTT = () => { const r = row(); try { return r.data.scheda.percorsiExtra[iP].attivita[jA].ax.tt2.map(z => z.cosa).join(','); } catch (e) { return 'ERR'; } };
const dbTTu = () => { try { return row().data.scheda.uscite[uid].prog[kN].tt.map(z => z.cosa).join(','); } catch (e) { return 'ERR'; } };
ok(dbTT() === 'Primo,Secondo,Terzo' && db.t.pee_membri.length === 3, 'preparazione: progetto condiviso con 3 persone, scaletta salvata (' + dbTT() + ')');
ok(dbTTu() === 'Spiegazione,Caccia,Giro finale', 'preparazione: uscita con attività salvata');

// ───────── 2. matrice ruolo × dispositivo ─────────
const ROLES = [['bruno', 'cotitolare', true], ['carla', 'collaboratore', true], ['dario', 'lettore', false]];
for (const dev of DEVS) for (const [nome, ruolo, edita] of ROLES) {
  const L = `${ruolo}/${dev}`; let p;
  try {
    p = await open(dev, U[nome]); const P = p.page, ev = p.ev; await sleep(1500);
    await openInv(p);
    const st = await ev(() => ({bro: !!window.BRO, id: CL.ctx && CL.ctx.id, ruolo: CL.ctx && CL.ctx.ruolo, nu: Object.keys(scheda.uscite || {}).length}));
    ok(st.id === pid && st.bro === !edita && st.nu === 1, `${L}: apre il progetto condiviso (${edita ? 'modifica' : 'sola lettura'}) con l’uscita ${JSON.stringify(st)}`);
    // Sezione 3: scaletta
    await ev(() => gGo('3')); await sleep(1100);
    const [i, j] = await ev(() => { const L2 = getAllPercorsi(); const i = L2.findIndex(p => (p.attivita || []).some(a => (a.testo || '').trim())); return [i, L2[i].attivita.findIndex(a => (a.testo || '').trim())]; });
    await ev(([i, j]) => axRe(i, j), [i, j]); await sleep(400);
    ok(await noOverflow(p), `${L}: Sezione 3 senza scorrimento orizzontale`);
    const mv = P.locator(`#ax-${i}-${j} .ax-ttr .ax-mv .ax-x`);
    const before = dbTT();
    if (nome === 'carla') {
      const dis = await ev(([i, j]) => [...document.querySelectorAll(`#ax-${i}-${j} .ax-ttr .ax-mv .ax-x`)].every(b => b.disabled), [i, j]);
      ok(dis, `${L}: attività NON affidata a lei → frecce bloccate (può solo leggere)`);
      const nw = await ev(([i, j]) => { const d = document.getElementById('att-' + i + '-' + j); const t = d && d.querySelector('.ed-txt'); return t ? t.textContent : ''; }, [i, j]);
      ok(/non è affidata a te|affidata/.test(nw), `${L}: spiega perché è bloccata («${nw.slice(0, 60)}»)`);
      await ea(([i, j]) => { affSet(i, j, 'carla@x.it'); _clTouched = true; _clUserAt = Date.now(); saveData(true); }, [iP, jA]);
      await sleep(12000);
      const en = await ev(([i, j]) => [...document.querySelectorAll(`#ax-${i}-${j} .ax-ttr .ax-mv .ax-x`)].some(b => !b.disabled), [i, j]);
      console.log('   [aff]', JSON.stringify(dbAff()));
      ok(en, `${L}: Anna le affida l’attività → in tempo reale le frecce si sbloccano`);
    }
    if (edita) {
      const n = await mv.count(); ok(n >= 3, `${L}: frecce ↑ ↓ × visibili (${n})`);
      await ev(([i, j]) => { document.querySelectorAll(`#ax-${i}-${j} details`).forEach(d => d.open = true); for (let e = document.getElementById(`ax-${i}-${j}`); e; e = e.parentElement) if (e.tagName === 'DETAILS') e.open = true; }, [i, j]); await sleep(300);
      const bb = await mv.nth(1).boundingBox(); ok(bb && bb.width >= 24 && bb.height >= (devices[dev] && devices[dev].hasTouch ? 32 : 16), `${L}: la freccia ↓ è toccabile (${bb && Math.round(bb.width)}×${bb && Math.round(bb.height)})`);
      await ev(([i, j]) => { document.querySelectorAll(`#ax-${i}-${j} details`).forEach(d => d.open = true); for (let e = document.getElementById(`ax-${i}-${j}`); e; e = e.parentElement) if (e.tagName === 'DETAILS') e.open = true; }, [i, j]); await sleep(300);
      const tap = async sel => { const r = await ev(([i, j, t]) => { const b = [...document.querySelectorAll(`#ax-${i}-${j} .ax-ttr .ax-mv .ax-x`)].find(x => x.textContent.trim() === t); const y = b.getBoundingClientRect().top + scrollY; window.scrollTo(0, Math.max(0, y - Math.round(innerHeight / 2))); return true; }, [i, j, sel]); await sleep(400);
        const c = await ev(([i, j, t]) => { const b = [...document.querySelectorAll(`#ax-${i}-${j} .ax-ttr .ax-mv .ax-x`)].find(x => x.textContent.trim() === t); const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return {x: r.left + r.width / 2, y: r.top + r.height / 2, hit: e === b || b.contains(e)}; }, [i, j, sel]);
        if (!c.hit) console.log('   [hit]', JSON.stringify(await ev(([i, j, t]) => { const b = [...document.querySelectorAll(`#ax-${i}-${j} .ax-ttr .ax-mv .ax-x`)].find(x => x.textContent.trim() === t); const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return {sy: scrollY, vh: innerHeight, r: [r.left, r.top, r.width, r.height], e: e ? e.tagName + '.' + e.className + '#' + e.id : null}; }, [i, j, sel])));
        ok(c.hit, `${L}: il tasto ${sel} è davvero raggiungibile (nessun elemento sopra)`);
        if (devices[dev] && devices[dev].hasTouch) await P.touchscreen.tap(c.x, c.y); else await P.mouse.click(c.x, c.y); await sleep(500); };
      await tap('↓');
      const loc = await ev(([i, j]) => getAllPercorsi()[i].attivita[j].ax.tt2.map(r => r.cosa).join(','), [i, j]);
      ok(loc === 'Secondo,Primo,Terzo' || loc === 'Primo,Secondo,Terzo'.split(',').reverse().join(',') || loc !== 'Primo,Secondo,Terzo', `${L}: ↓ sposta la riga (${loc})`);
      await ev(() => { _clTouched = true; _clUserAt = Date.now(); saveData(true); }); await sleep(7000);
      ok(dbTT() !== before && /^(Secondo,Primo,Terzo|Primo,Terzo,Secondo|Secondo,Terzo,Primo|Terzo,Primo,Secondo|Terzo,Secondo,Primo|Primo,Secondo,Terzo)$/.test(dbTT()) && dbTT() !== 'ERR', `${L}: lo spostamento arriva a tutti (${before} → ${dbTT()})`);
      // rimette in ordine per il prossimo
      await ev(([i, j]) => { const t = getAllPercorsi()[i].attivita[j].ax.tt2; const o = ['Primo', 'Secondo', 'Terzo']; t.sort((a, b) => o.indexOf(a.cosa) - o.indexOf(b.cosa)); axRe(i, j); _clTouched = true; _clUserAt = Date.now(); saveData(true); }, [i, j]); await sleep(7000);
      ok(dbTT() === 'Primo,Secondo,Terzo', `${L}: ordine ripristinato (${dbTT()})`);
      if (nome === 'carla') { await ea(([i, j]) => { affSet(i, j, ''); _clTouched = true; _clUserAt = Date.now(); saveData(true); }, [iP, jA]); await sleep(4000); console.log('   [aff dopo]', JSON.stringify(dbAff()), dbTTu()); }
    } else {
      const n = await mv.count(); let moved = false;
      if (n) { await mv.first().click({force: true}).catch(() => {}); await sleep(500); moved = (await ev(([i, j]) => getAllPercorsi()[i].attivita[j].ax.tt2.map(r => r.cosa).join(','), [i, j])) !== 'Primo,Secondo,Terzo'; }
      ok(!moved, `${L}: il lettore non riesce a spostare le righe (frecce: ${n})`);
      await sleep(4000); ok(dbTT() === 'Primo,Secondo,Terzo', `${L}: …e nel database non cambia nulla`);
    }
    // Proponi / Cerca
    const prop = await ev(() => { anBars(); return [...document.querySelectorAll('.an-prop')].filter(b => b.style.display !== 'none' && b.offsetParent !== null).length; });
    await ev(() => gGo('3')); await sleep(700);
    ok(await P.locator('#an-open').count() === 1, `${L}: barra «Cerca un’attività» presente`);
    await ev(() => anOpen()); await sleep(1800);
    ok(await P.locator('#an-ov .an-box').isVisible() && await noOverflow(p) && await ev(() => { const b = document.querySelector('#an-ov .an-box').getBoundingClientRect(); return b.left >= -1 && b.right <= window.innerWidth + 1; }), `${L}: finestra Cerca dentro lo schermo`);
    await P.fill('#an-q', 'tesoro'); await sleep(300);
    ok(await P.locator('.an-card').count() === 1, `${L}: Cerca «tesoro» trova l’attività dell’uscita`);
    const btn = await ev(() => [...document.querySelectorAll('.an-card .an-act button, .an-card button')].map(b => b.textContent.trim()).filter(Boolean));
    await P.locator('.an-card .an-ct').first().click().catch(() => {}); await sleep(300);
    const acts = await ev(() => [...document.querySelectorAll('.an-act button')].map(b => b.textContent.trim()));
    ok(acts.includes('Apri'), `${L}: nel dettaglio c’è «Apri» (${acts.join(' / ')})`);
    ok(edita ? acts.some(a => /Riusa|Aggiungi/.test(a)) : !acts.some(a => /Riusa|Aggiungi/.test(a)), `${L}: «Riusa» ${edita ? 'presente' : 'assente per il lettore'}`);
    await P.locator('.an-act button', {hasText: 'Apri'}).click(); await sleep(2600);
    const pos = await ev(k => { const e = document.getElementById('usc-b-' + k); const h = document.querySelector('.hdr').getBoundingClientRect().height; const sb = document.getElementById('g-subnav'); const sh = sb && getComputedStyle(sb).position === 'sticky' ? sb.getBoundingClientRect().height : 0; return e ? {top: Math.round(e.getBoundingClientRect().top), bar: Math.round(h + sh), step: schedaStep, fine: Math.round(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 4} : null; }, kN);
    ok(pos && pos.step === 'usc' && pos.top >= pos.bar - 2 && (pos.top <= pos.bar + 80 || (pos.fine && pos.top < innerHeightOf(dev))), `${L}: «Apri» porta al blocco dell’uscita sotto le barre fisse (${JSON.stringify(pos)})`);
    // uscita: strumenti e Proponi
    await ev(k => { USC_OPEN[k] = true; uscRe(); }, kN); await sleep(500);
    const nPal = await P.locator('.usc-pal').count(), nProp = await P.locator(`#usc-b-${kN} .an-prop`).evaluate(e => e && e.offsetParent !== null && getComputedStyle(e).display !== 'none').catch(() => false);
    ok(edita ? nProp : !nProp, `${L}: «Proponi all’archivio» ${edita ? 'visibile nel blocco' : 'nascosto al lettore'}`);
    if (!edita) ok(nPal === 0, `${L}: il lettore non ha la tavolozza dei momenti`);
    ok(await noOverflow(p), `${L}: Uscite senza scorrimento orizzontale`);
    if (edita && nome === 'bruno') {   // co-titolare: scaletta dell'uscita
      const bef = dbTTu(); await ev(k => { _clTouched = true; _clUserAt = Date.now(); uscRowMove(k, 'tt', 2, -1); uscSave(); }, kN); await sleep(7000);
      ok(dbTTu() === 'Spiegazione,Giro finale,Caccia', `${L}: sposta una riga della scaletta dell’uscita e arriva a tutti (${bef} → ${dbTTu()})`);
      await ev(k => { _clTouched = true; _clUserAt = Date.now(); uscRowMove(k, 'tt', 2, -1); uscSave(); }, kN); await sleep(7000);
      ok(dbTTu() === 'Spiegazione,Caccia,Giro finale', `${L}: …e la rimette a posto (${dbTTu()})`);
    }
    // Word: capitolo Adulti in staff
    if (dev === 'desktop' && nome === 'dario') {
      const JSZip = (await import('/home/claude/work/libs/node_modules/jszip/lib/index.js')).default; const fs = (await import('fs')).default;
      await ev(() => gGo('1a')); await sleep(400);
      const [d] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx())]);
      const z = await JSZip.loadAsync(fs.readFileSync(await d.path())); const t = (await z.file('word/document.xml').async('string')).replace(/<[^>]+>/g, '');
      ok(/Contesto Sezione e Gruppo/.test(t) && /Adulti in staff/.test(t) && t.indexOf('Contesto Sezione e Gruppo') < t.indexOf('Adulti in staff'), `${L}: il lettore scarica il Word con il capitolo «Adulti in staff»`);
    }
    ok(!p.errors.length, `${L}: nessun errore JS` + (p.errors.length ? ' — ' + p.errors[0].slice(0, 160) : ''));
  } catch (e) { ok(false, `${L}: ECCEZIONE ${String(e).slice(0, 1500)}`); }
  if (p) await finish(p);
}

// ───────── 3. estraneo: non vede nulla, non può entrare ─────────
{ const p = await open('desktop', U.elena); await sleep(1500);
  const r = await p.ev(async pid => { const g = await dbGet(pid).catch(e => null); const L = await dbList().catch(() => []); return {g: !!(g && g.data), n: L.filter(x => x.id === pid).length, inv: (CL._inv || []).length}; }, pid);
  ok(!r.g && r.n === 0 && r.inv === 0, 'estraneo: non vede il progetto condiviso né inviti ' + JSON.stringify(r));
  await finish(p); }

// ───────── 4. archivio nazionale end-to-end ─────────
const propose = async (p, titolo) => {   // dal progetto aperto, apre il modulo, compila e invia
  await p.ev(([i, j]) => { gGo('3'); anPropose(i, j); }, [iP, jA]); await sleep(900);
  await p.page.fill('#anp-t', titolo); await p.page.check('#anp-ok'); await p.page.locator('#anp-go').click(); await sleep(1500); };
const pB = await open('desktop', U.bruno); await sleep(1500);
await openInv(pB);
await propose(pB, 'Proposta di Bruno');
const pC = await open('iPhone SE', U.carla); await sleep(1500);
await openInv(pC);
await pC.ev(([i, j]) => { gGo('3'); anPropose(i, j); }, [iP, jA]); await sleep(900);
ok(await pC.ev(() => { const b = document.querySelector('#an-ov .an-box').getBoundingClientRect(); return b.left >= -1 && b.right <= window.innerWidth + 1; }) && await noOverflow(pC), 'iPhone SE: modulo «Proponi» dentro lo schermo');
await pC.page.fill('#anp-t', 'Proposta di Carla'); await pC.page.locator('#anp-go').scrollIntoViewIfNeeded(); await pC.page.locator('#anp-go').tap().catch(() => pC.page.locator('#anp-go').click());
await sleep(700); ok(/Spunta la casella/.test(await pC.page.locator('#anp-r').textContent()), 'senza spunta di controllo la proposta non parte');
await pC.page.check('#anp-ok'); await pC.page.locator('#anp-go').click(); await sleep(1500);
const an = () => db.t.pee_archivio_nazionale;
ok(an().length === 2 && an().every(r => r.stato === 'in_attesa'), 'le due proposte sono in attesa (' + an().map(r => r.titolo + ':' + r.stato).join('; ') + ')');
ok(an().every(r => !/Anna|Bruno|Carla|Dario|Kontiki/.test(JSON.stringify(r.contenuto))), 'nelle proposte non restano nomi dello staff né dell’Unità');
// il lettore e l'estraneo non vedono le proposte in attesa
const pD = await open('desktop', U.dario); await sleep(1500);
await openInv(pD);
await pD.ev(() => anOpen('an')); await sleep(1800);
ok(await pD.ev(() => AN.st) === 'ok' && await pD.ev(() => (AN.rows || []).length) === 0, 'lettore: non vede le proposte in attesa degli altri');
ok(await pD.page.locator('.an-prop:visible').count() === 0, 'lettore: nessun «Proponi» visibile');
const att = await pD.ev(async () => { const r = await CL.sb.from(AN_T).insert({titolo: 'Intruso', stato: 'approvata'}); return r.error ? 'rifiutato' : 'inserito'; });
ok(att === 'rifiutato', 'regole archivio: nessuno può inserire direttamente una proposta già approvata');
// un altro utente non può approvare né cancellare
const hack = await pD.ev(async id => { const a = await CL.sb.from(AN_T).update({stato: 'approvata'}).eq('id', id).select(); const b = await CL.sb.from(AN_T).delete().eq('id', id); return [a.data && a.data.length, b.error ? 'err' : 'ok']; }, an()[0].id);
ok(an().every(r => r.stato === 'in_attesa') && an().length === 2, 'regole archivio: un non-amministratore non approva né cancella le proposte altrui ' + JSON.stringify(hack));
// amministratore
const pL = await open('desktop', U.luca); await sleep(1500);
await pL.ev(() => exStart()); await sleep(3500);
await pL.ev(() => anOpen('pend')); await sleep(1800);
ok(await pL.ev(() => anIsAdmin() && AN.rows.filter(r => r.stato === 'in_attesa').length) === 2 && await pL.page.locator('.an-card').count() === 2, 'amministratore: vede le 2 proposte da approvare');
const idB = an().find(r => r.titolo === 'Proposta di Bruno').id, idC = an().find(r => r.titolo === 'Proposta di Carla').id;
await pL.ev(id => anDecide(id, 'approvata'), idB); await sleep(1200); await pL.ev(id => anDecide(id, 'rifiutata'), idC); await sleep(1200);
ok(an().find(r => r.id === idB).stato === 'approvata' && an().find(r => r.id === idB).approvata_da === 'luca.bartolomei@cngei.it' && an().find(r => r.id === idC).stato === 'rifiutata', 'amministratore: approva Bruno, rifiuta Carla');
// ora tutti vedono quella approvata, non quella rifiutata
for (const [nome, p] of [['lettore (desktop)', pD]]) { await p.ev(() => anOpen('an')); await sleep(1800);
  const t = await p.ev(() => (AN.rows || []).map(r => r.titolo)); ok(t.length === 1 && t[0] === 'Proposta di Bruno', nome + ': vede solo l’approvata (' + t.join(',') + ')'); }
await pC.ev(() => anOpen('mie')); await sleep(1800);
ok(/Non approvata|non approvata/i.test(await pC.page.locator('#an-ov').textContent()), 'Carla (iPhone SE): vede che la sua è «Non approvata»');
await pC.ev(() => { const r = AN.rows.find(x => x.stato === 'rifiutata'); anDel(r.id); }); await sleep(1500);
ok(!an().some(r => r.id === idC), 'Carla ritira la sua proposta non approvata');
const del = await pB.ev(async id => { const e = await CL.sb.from(AN_T).delete().eq('id', id); return e.error ? 'err' : 'ok'; }, idB); await sleep(300);
ok(an().some(r => r.id === idB), 'Bruno non può ritirare la sua proposta già approvata (resta nell’archivio)');
// estranea vede l'approvata in Cerca; la riusa nel suo progetto
const pE = await open('Pixel 7', U.elena); await sleep(1500); await pE.ev(() => exStart()); await sleep(3500);
await pE.ev(() => anOpen('an')); await sleep(1800);
ok(await pE.page.locator('.an-card').count() === 1 && await noOverflow(pE), 'Elena (Pixel 7): trova l’attività approvata in Cerca, schermo a posto');
// salto fra progetti: Anna, da un altro suo progetto, va al blocco dell'uscita del primo
await pa.ev(() => { try { CL.ctx.udirty && clSaveCtx(); } catch (e) {} });
const pA2 = await open('desktop', U.anna); await sleep(2500);
await pA2.ev(() => exStart()).catch(() => {}); await sleep(5000);
let id2 = await pA2.ev(() => CL.ctx && CL.ctx.id);
if (!id2 || id2 === pid) { await pA2.ev(() => { window._appReload = false; return newProjectForTest ? 1 : 0; }).catch(() => {}); }
if (id2 && id2 !== pid) {
  await pA2.ev(() => anOpen()); await sleep(3500); await pA2.page.fill('#an-q', 'tesoro'); await sleep(400);
  const ix = await pA2.ev(pid => AN_CUR.findIndex(r => r.proj === pid && r.usc), pid);
  ok(ix >= 0, 'salto fra progetti: dal secondo progetto Anna trova l’attività dell’uscita del primo');
  if (ix >= 0) { await pA2.ev(i => anGoMine(i), ix); await sleep(9000);
    ok(await pA2.ev(([pid, k]) => CL.ctx.id === pid && schedaStep === 'usc' && !!document.getElementById('usc-b-' + k), [pid, kN]), 'salto fra progetti: si apre il primo progetto dritto sul blocco'); }
} else ok(false, 'salto fra progetti: secondo progetto non creato (id ' + id2 + ')');
ok(await pC.ev(async () => { await anLoadMine(); return AN.mine.every(r => !r.proj || r.proj === 'cur' || r.proj === CL.ctx.id); }), 'collaboratrice: «Le mie attività» non include i progetti altrui condivisi (solo i suoi)');
await finish(pA2);
for (const p of [pB, pC, pD, pL, pE]) await finish(p);
await finish(pa);
ok(errsAll.length === 0, 'nessun errore JS in tutto il collaudo' + (errsAll.length ? ': ' + errsAll.slice(0, 3).map(e => e.slice(0, 160)).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
