import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
P.on('pageerror', e => console.log('PAGEERR', String(e).slice(0, 300)));
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const att = (t, aid) => ({testo:t, link:'', lancio:'x ' + t, sviluppo:'', conclusione:'', vBene:'', vMigl:'', vAgg:'', aid});
db.t.pee_archivi.push({id:'c1', user_id:u.id, anno:2026, titolo:'Programmazione Annuale 2026-27 · Kontiki', meta:{mode:'giovani', fascia:'E', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'Kontiki', obs:{}, pris:{P1:true, C1:true, S1:true},
  scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{sezione:'Pesaro', gruppo:'1'}, veste:{ruolo:'cu', branca:'E'},
    priorita:[{ambito:'P', necessita:'n', percorso:'P1', obiettivi:[0], idr:[0], tDal:'2026-10', tAl:'2027-01'}, {ambito:'C', necessita:'n', percorso:'C1', obiettivi:[0, 1], idr:[0], tDal:'2026-11', tAl:'2027-02'}, {ambito:'S', necessita:'n', percorso:'S1', obiettivi:[0], idr:[0]}],
    percorsiExtra:[{prioritaIdx:0, percorsoId:'P1', ambito:'P', attivita:[att('Gioco A', 'm0')]}, {prioritaIdx:1, percorsoId:'C1', ambito:'C', attivita:[att('Gioco B', 'm1')]}, {prioritaIdx:2, percorsoId:'S1', ambito:'S', attivita:[att('Gioco C', 'm2')]}]}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('c1', 0)); await sleep(3500);
await ev(() => shGrp('Progettare')); await sleep(200);
ok(await ev(() => { const t = [...document.querySelectorAll('#sh-side .sh-si')].map(b => b.textContent.trim()); return ['Percorso Personale', 'Percorso Comunitario', 'Percorso Spirituale'].every(x => t.includes(x)); }), 'menu Progettare: tre voci Percorso Personale / Comunitario / Spirituale');
const vis = async (a) => { await ev(x => shPerc(x), a); await sleep(900); return ev(() => ({ids: [...document.querySelectorAll('.pcx')].filter(c => c.offsetParent !== null).map(c => c.dataset.a), on: [...document.querySelectorAll('#sh-side .sh-si.on')].map(x => x.textContent.trim()), guide: (document.getElementById('tut4-hdr') || {}).textContent})); };
for (const [a, n] of [['P', 'Percorso Personale'], ['C', 'Percorso Comunitario'], ['S', 'Percorso Spirituale']]) { const s = await vis(a); ok(s.ids.length === 1 && s.ids[0] === a && s.on.includes(n), n + ': mostra solo il suo percorso e la voce è evidenziata (' + JSON.stringify(s) + ')'); }
const g3 = await ev(() => document.getElementById('tut4-list').textContent);
ok(/Cosa fare/.test(g3) && /Lancio, Sviluppo e Conclusione/.test(g3), 'Percorsi: testo guida specifico (cosa fare, Linee Guida, suggerimenti)');
await ev(() => shSec('2')); await sleep(900);
const g2 = await ev(() => ({h: document.getElementById('tut4-hdr').textContent, t: document.getElementById('tut4-list').textContent}));
ok(g2.h !== 'Come funziona — la Scheda di Programmazione Educativa Esperienziale' && /Obiettivi/.test(g2.h) && g2.t !== g3, 'Obiettivi e indicatori: testo guida diverso dalla pagina Percorsi (' + g2.h + ')');
ok(await ev(() => /di norma 1 per priorità/.test(document.getElementById('panel4').textContent) && !/Le Linee Guida chiedono 1 obiettivo/.test(document.getElementById('panel4').textContent)), 'Programmazione di Unità: niente «scegline 1» perentorio');
await ev(() => shSub('1a', '', 'ctx')); await sleep(800);
const g1 = await ev(() => document.getElementById('tut4-hdr').textContent);
ok(/Il mio contesto/.test(g1), 'Il mio contesto: testo guida proprio (' + g1 + ')');
process.exit(summary() ? 1 : 0);
