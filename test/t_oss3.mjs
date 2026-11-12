// Attività osservative proprie su un profilo di dispositivo: pannello e percorso guidato senza scorrimento orizzontale, pulsanti toccabili, giro completo fino alla riga nelle occasioni
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import { devices } from 'playwright';
const PROFILES = {
  'safari-mac': ['webkit', devices['Desktop Safari']], 'iphone': ['webkit', devices['iPhone 13']], 'iphone-se': ['webkit', devices['iPhone SE']],
  'ipad': ['webkit', devices['iPad (gen 7)']], 'ipad-land': ['webkit', devices['iPad Pro 11 landscape']],
  'firefox-win': ['firefox', devices['Desktop Firefox']], 'firefox-small': ['firefox', {viewport:{width:400, height:800}}],
  'chrome-win': ['chromium', devices['Desktop Chrome']], 'edge-win': ['chromium', devices['Desktop Edge']],
  'android': ['chromium', devices['Pixel 7']], 'android-small': ['chromium', devices['Galaxy S8']], 'tablet-android': ['chromium', devices['Galaxy Tab S4']]
};
const name = process.argv[2] || 'chrome-win'; const [engine, dev] = PROFILES[name];
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:dev}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ts = '2026-10-20T10:00:00Z';
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Reparto', meta:{mode:'giovani', fascia:'E', tipo:'AN', nome:'Reparto'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Reparto', obs:{}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1', staffTab:[{ruolo:'CU', nome:'Anna Verdi'}, {ruolo:'AC', nome:'Marco Neri'}],
  attOss:{a1:{id:'a1', nome:'Il mercato senza capo con un nome davvero molto lungo per provare come va a capo', aut:'Marco Neri', autMail:'m@x.it', ruolo:'col', stato:'proposta', main:'C3', also:['C1', 'P5'], dom:'Quando nessuno è incaricato di guidare, qualcuno prende l’iniziativa o aspetta che lo faccia qualcun altro?', foc:['Osservo.'], at:3, sugg:{s1:{da:'Anna', t:'Aggiungi un momento finale.', at:5}}}}}}}, created_at:ts, updated_at:ts});
await loginAs(P, base, u); await sleep(1800);
await P.evaluate(() => shOpen('c1', 0)).catch(() => {}); await sleep(3000);
await ev(() => { document.querySelectorAll('#g-modal .ppb-c').forEach(c => { c.checked = true; }); if(document.querySelector('#g-modal.show .ppb-ask')) _ppbGo(); }); await sleep(2500);
await ev(() => { try{ modalClose(); }catch(e){} gGo('1a'); window._ctxF = 'occ'; if(window.shSync) shSync(); }); await sleep(1000);
const W = await ev(() => innerWidth);
const over = () => ev(() => { const e = document.getElementById('oss-panel'); return e ? [...e.querySelectorAll('*')].filter(x => { const r = x.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).length : -1; });
ok(await over() === 0, name + ' (' + W + 'px): il pannello non esce dallo schermo');
const small = await ev(() => [...document.querySelectorAll('#oss-panel button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.height < 30); }).map(b => b.textContent.trim().slice(0, 20) + ':' + Math.round(b.getBoundingClientRect().height)));
ok(small.length === 0, 'pulsanti del pannello alti almeno 30px ' + JSON.stringify(small));
await ev(() => document.getElementById('oss-panel').scrollIntoView({block:'start'})); await sleep(300);
await P.screenshot({path:'/tmp/oss_' + name + '_panel.png'});
// percorso guidato
await ev(() => ossWizOpen('S6')); await sleep(2500);
const F = P.frames().filter(f => f !== P.mainFrame()).pop();
const wi = async () => F.evaluate(() => ({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, w: innerWidth, step: document.getElementById('wstep').textContent}));
let w = await wi(); ok(w.sw <= w.cw + 1, 'percorso guidato: nessuno scorrimento orizzontale al passo 1 (' + w.sw + '/' + w.cw + ')');
await P.screenshot({path:'/tmp/oss_' + name + '_wiz1.png'});
const tot = await F.evaluate(() => visSteps().length); let bad = [];
await F.evaluate(() => { S.dom = 'Quando nessuno guida il gioco, chi prende l’iniziativa e chi aspetta che lo faccia un altro?'; S.porta = 'dom'; S.amb = 'S'; S.main = 'S6'; S.dur = 60; S.foc.push({txt:'Osservo se e come qualcuno prende una scelta.', pid:'S6', cls:'A', extra:[], tocca:[]}); S.nR = '12'; S.nome = 'La scelta difficile'; S.lan = 'lancio'; S.svi = 'sviluppo'; S.con = 'conclusione'; });
await F.evaluate(() => go(0)); for(let i = 0; i < tot; i++){ await sleep(120); const x = await wi(); if(x.sw > x.cw + 1) bad.push(i + ':' + x.sw + '/' + x.cw); if(i < tot - 1) await F.evaluate(() => nav(1)); }
ok(bad.length === 0, 'percorso guidato: nessuno scorrimento orizzontale in nessuno dei ' + tot + ' passi ' + JSON.stringify(bad));
await P.screenshot({path:'/tmp/oss_' + name + '_wiz_fine.png'});
await F.evaluate(() => go(0)); await sleep(150);
const nxt = await F.evaluate(() => { const b = document.getElementById('wnext'), p = document.getElementById('wprev'); const r = x => { const q = x.getBoundingClientRect(); return [Math.round(q.width), Math.round(q.height)]; }; return {n: r(b), p: r(p), c: r(document.querySelector('.wclose'))}; });
ok(nxt.n[1] >= 36 && nxt.c[1] >= 34, 'pulsanti «Avanti» e «Chiudi» toccabili ' + JSON.stringify(nxt));
await F.evaluate(() => { go(visSteps().findIndex(s => s.k === 'fog')); }); await sleep(150);
await F.evaluate(() => salva()); await sleep(900);
ok(await ev(() => ossList().length === 2 && !document.getElementById('oss-ov')), 'salvata, il riquadro si chiude');
await ev(() => { const a = ossList().find(x => x.nome === 'La scelta difficile'); ossSvolta(a.id); }); await sleep(300);
await P.screenshot({path:'/tmp/oss_' + name + '_svolta.png'});
const mo = await ev(() => { const m = document.querySelector('#g-modal.show > div'); if(!m) return null; const r = m.getBoundingClientRect(); return {l: Math.round(r.left), r: Math.round(r.right), w: innerWidth, h: Math.round(r.height), vh: innerHeight}; });
ok(mo && mo.l >= 0 && mo.r <= mo.w + 1, 'finestra «Segna come svolta» dentro lo schermo ' + JSON.stringify(mo));
await ev(() => ossSvoltaOk(ossList().find(x => x.nome === 'La scelta difficile').id)); await sleep(600);
ok(await ev(() => (scheda.pp.occMan || []).some(r => /La scelta difficile/.test(r.att))), 'la riga è nelle occasioni osservative');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
process.exit(summary() ? 1 : 0);
