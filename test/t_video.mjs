// Video tutorial: 51 segnaposto, riquadro in cima alle pagine, capitoli, «già visto», filtri per ruolo
import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:+(process.env.VW || 1280), height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
const mk = (id, titolo, tipo, pp) => ({id, user_id:u.id, anno:2026, titolo, meta:{mode:'giovani', fascia:'E', tipo:tipo, nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:tipo, annoScout:'2026-27', pp:pp}}, created_at:ts, updated_at:ts});
db.t.pee_archivi.push(mk('c1', 'Programmazione Annuale 2026-27 · Reparto', 'AN', {sezione:'Pesaro', gruppo:'1'}));
db.t.pee_archivi.push(mk('p1', 'Progetto Personale 2026-27', 'PP', {sezione:'Pesaro', gruppo:'1', nome:'Anna Verdi'}));
await loginAs(P, base, u); await sleep(1200);
const openP = async id => { await P.evaluate(id => shOpen(id, 0), id).catch(() => {}); await sleep(2800); await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2200); };
const box = () => ev(() => { const b = document.getElementById('vid-pg'); const h = document.querySelector('#main-app > .panel.active'); return b ? {first: h.firstChild === b, open: b.open, sum: b.querySelector('summary').textContent.trim(), rows: [...b.querySelectorAll('.vid-row')].map(r => r.querySelector('.vid-rt').textContent.trim().slice(0, 70)), soon: b.querySelectorAll('.vid-row.soon').length} : null; });
const go = async g => { await ev(g => (new Function(g))(), g); await sleep(1700); };
// tabella
const T = await ev(() => ({n: VIDEOS.length, uniq: new Set(VIDEOS.map(v => v.n)).size, ch: VID_CH.length, orph: VIDEOS.filter(v => !VID_CH.some(c => c[0] === v.g)).length, seq: VIDEOS.every((v, i) => v.n === i + 1), noOk: Object.keys(VID_OK).length}));
ok(T.n === 51 && T.uniq === 51 && T.seq && T.orph === 0 && T.ch === 10, 'tabella: 51 video numerati 1–51 in 10 capitoli: ' + JSON.stringify(T));
ok(T.noOk === 0, 'nessun video attivo: sono tutti segnaposto');
await openP('c1');
await go("shSec('chk')"); let b = await box();
ok(b && b.first && !b.open && /^▶ Video tutorial \(2\)/.test(b.sum), 'Controllo e invio: riquadro in cima, chiuso, con il numero: ' + (b && b.sum));
ok(b && b.rows.length === 2 && b.soon === 2, 'le righe sono segnaposto «in arrivo»: ' + (b && b.rows.join(' | ')));
await go('shCal()'); b = await box(); ok(b && /\(1\)/.test(b.sum) && /Calendario e attività/.test(b.rows[0]), 'Calendario: 1 video «Calendario e attività»: ' + (b && b.rows.join()));
await go('shEle()'); b = await box(); ok(b && /Elenco dell’anno/.test(b.rows[0]), 'Elenco dell’anno');
await go("shSub('1a','','occ')"); b = await box(); ok(b && b.rows.length === 2 && /Crea le tue attività osservative/.test(b.rows[1]), 'Come osservo: KOS 2.0 e «Crea le tue attività osservative»: ' + (b && b.rows.join(' | ')));
await go("shSec('2')"); b = await box(); ok(b && /Obiettivi e indicatori/.test(b.rows[0]), 'Obiettivi e indicatori (pagina dei vecchi pannelli)');
// apertura riquadro e segnaposto
await ev(() => { document.querySelector('#vid-pg summary').click(); }); await sleep(300);
ok((await box()).open, 'il riquadro si apre al clic');
await go('shCal()'); await go("shSec('chk')"); b = await box(); ok(b && !b.open, 'cambiando pagina il riquadro torna chiuso');
await ev(() => document.querySelector('#vid-pg .vid-row').click()); await sleep(400);
const m1 = await ev(() => document.getElementById('g-modal').innerText);
ok(/arriva presto/i.test(m1) , 'un segnaposto dice che il video arriva presto: ' + m1.replace(/\n/g, ' ').slice(0, 90));
await ev(() => { try{ modalClose(); }catch(e){} }); await sleep(200);
// video attivo + già visto
await ev(() => { VID_OK[3] = '1'; vidOpen(3); }); await sleep(400);
ok(await ev(() => !!document.querySelector('#g-modal video.vid-v') && /pee-03\.mp4/.test(document.querySelector('video.vid-v').src)), 'con il file attivo si apre il lettore (/video/v2/pee-03.mp4)');
await ev(() => { vidSeenMark(3); try{ modalClose(); }catch(e){} }); await sleep(300);
ok(await ev(() => JSON.parse(localStorage.getItem('pee_vid_seen')).includes(3)), '«già visto» salvato sul dispositivo');
await ev(() => { faqOpen(); [...document.querySelectorAll('#g-modal details.gd-pan')].forEach(d => { if(/Video tutorial/.test(d.querySelector('summary').textContent)) d.open = true; }); }); await sleep(500);
const g = await ev(() => { const t = document.getElementById('g-modal').innerText; return {t: /per questa pagina/i.test(t), ch: [...document.querySelectorAll('#g-modal .vid-grp > summary')].map(s => s.firstElementChild.textContent), seen: !!document.querySelector('#g-modal .vid-ic') && /✓/.test(document.getElementById('g-modal').innerText)}; });
ok(g.t && g.ch.length === 8 && g.ch[0] === 'Per iniziare', 'Guida: «Per questa pagina» e 8 capitoli per un progetto di Unità: ' + g.ch.join(' / '));
await ev(() => { try{ modalClose(); }catch(e){} });
// pagina di apertura di capitolo
await go("shGrp('Capire')"); b = await box();
ok(b && b.rows.length === 2 && /La mia unità/.test(b.rows[0]) && /Il mio staff/.test(b.rows[1]), 'apertura del capitolo «Capire»: tutti i video del capitolo: ' + (b && b.rows.join(' | ')));
await go("shGrp('Realizzare')"); b = await box(); ok(b && b.rows.length === 11, 'capitolo «Realizzare»: 11 video: ' + (b && b.rows.length));
// Progetto Personale
await ev(() => shGoHome()); await sleep(1500); await openP('p1');
await go("shPP('0')"); b = await box(); ok(b && /dalla Sezione 1 alla 3/i.test(b.rows[0]), 'Progetto Personale, «A che punto sei»: ' + (b && b.rows.join()));
await go("shPP('i')"); b = await box(); ok(b && b.rows.length === 2 && /gli invii/.test(b.rows[0]) && /La revisione/.test(b.rows[1]), 'PP, Invio: «gli invii» e la revisione: ' + (b && b.rows.join(' | ')));
const gp = await ev(() => vidGroups('P').map(x => x.k).join());
ok(!/\br\b/.test(gp) && /pp/.test(gp) && /rv/.test(gp), 'chi fa il PP non vede i capitoli del Calendario: ' + gp);
const gs = await ev(() => [vidGroups('S')[0].k, vidGroups('C')[0].k, vidGroups('A').map(x => x.k).join()]);
ok(gs[0] === 'st' && gs[1] === 'st' && !/st/.test(gs[2]), 'staff e Capo Gruppo vedono per primi i loro capitoli; chi fa la programmazione di Unità no: ' + gs.join(' ; '));
summary(); await br.close(); process.exit(0);
