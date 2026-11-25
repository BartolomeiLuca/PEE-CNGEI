// Bacheca «Dal giro al Piano» (25/11): chi la vede, gli spunti che arrivano dalle carte, i quattro posti (tavolo, Piano, panchina, via),
// i tre modi di portare uno spunto nel Piano, il salvataggio e l’unione tra due persone che coordinano.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB(); const W = {};
async function entra(chi, nome, ruolo = 'cg'){
  const pa = await person(br, db); const P = pa.page;
  const u = db.addUser(chi + '@x.it', 'password123', nome);
  db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
  await loginAs(P, base, u); await sleep(2200);
  W[chi] = {pa, P, u, ev: (f, a) => P.evaluate(f, a)}; return W[chi];
}
const luca = await entra('luca', 'Luca Titolare'), vice = await entra('vice', 'Vice Cotitolare', 'vcg'), coll = await entra('coll', 'Collab Orata', 'cu'), lett = await entra('lett', 'Lettore Cu', 'cu');
const txt = (w, sel) => w.ev((s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; }, sel);
const cnt = (w, sel) => w.ev((s) => document.querySelectorAll(s).length, sel);
const sez = async (w, id) => { await w.ev(i => pnSez(i), id); await sleep(500); };
const salvato = async (w, ms = 7000) => { const t0 = Date.now(); while(Date.now() - t0 < ms){ if(await w.ev(() => !PN.dirty && !PN.saving)) return true; await sleep(150); } return false; };
const apri = async (w, id) => { await w.ev(i => { pnOpen(i); }, id); await sleep(1200); };
const pid = await luca.ev(async () => (await PIANI.crea({tipo:'gruppo', titolo:'Piano di prova', anno_inizio:annoScoutStart(), durata:3, data:pnVuoto()})).id);
for(const [w, ru, et] of [[vice, 'cotitolare', 'Vice Capo Gruppo'], [coll, 'collaboratore', 'Capo Unità'], [lett, 'lettore', 'Capo Unità']])
  db.t.pee_piani_membri.push({id:'m-' + w.u.email, piano_id:pid, email:w.u.email, ruolo:ru, etichetta:et, nome:w.u.meta.nome, visto_il:null, invitato_da:luca.id, created_at:'2026-11-24T10:00:00Z'});
for(const w of [luca, vice, coll, lett]) await apri(w, pid);

// ── giro con carte consegnate ──
await luca.ev(async id => { await PIANI.giroApri(id, {ritmo:'standard', fase:'giro1', scadenza:null}); await giCarica(); }, pid); await sleep(800);
const gid = db.t.pee_piani_giri[0].id;
const carta = (a) => ({v:1, a:Object.assign({}, ...['educativa', 'formativa', 'gestionale', 'sviluppo', 'territorio'].map(k => ({[k]:Object.assign({v:'', c:'', p:'', b:false}, a[k] || {})})))});
await coll.ev(async ([g, c]) => { await PIANI.contributoSalva(g, 'carte', c, true); }, [gid, carta({educativa:{v:'I passaggi sono improvvisati', p:'Una riunione dei Capi Unità prima dei passaggi'}, gestionale:{c:'La sede è troppo piccola'}})]);
await lett.ev(async ([g, c]) => { await PIANI.contributoSalva(g, 'carte', c, true); }, [gid, carta({educativa:{p:'Una serata con le famiglie'}, territorio:{p:'Un gemellaggio con un altro Gruppo'}})]);
await lett.ev(async g => { await PIANI.contributoSalva(g, 'unita', {v:1, unita:'Reparto Aquile', b:{b7r:'Un aiuto con i trasporti', b7o:'Un’uscita aperta a tutto il Gruppo'}, s:{}, n:{}}, true); }, gid);
await luca.ev(async ([g, c]) => { await PIANI.contributoSalva(g, 'carte', c, true); }, [gid, carta({formativa:{p:'Un corso interno per chi arriva'}})]);

// ── 1. chi la vede ──
await coll.ev(() => giCarica(false)); await sleep(500);
ok(await cnt(coll, '#pn-sb-g-spu') === 0 && await cnt(lett, '#pn-sb-g-spu') === 0, 'chi non coordina non vede la bacheca nel menu');
await luca.ev(() => giCarica(false)); await sleep(700); await luca.ev(() => pnRender()); await sleep(300);
ok(await cnt(luca, '#pn-sb-g-spu') === 1, 'il Capo Gruppo (ha consegnato le sue carte) la vede');
await sez(luca, 'g-spu');
ok(/Dal giro al Piano/.test(await txt(luca, '#spg-t')), 'la pagina si chiama «Dal giro al Piano»');
const tav = () => cnt(luca, '.spg-c');
ok(await tav() === 7, 'da decidere: 4 proposte, 1 preoccupazione e 2 dalle Unità, senza le osservazioni (' + await tav() + ')');
const nomi = await luca.ev(() => [...document.querySelectorAll('.spg-c')].map(e => e.textContent.replace(/\s+/g, ' ')).join(' | '));
ok(/Collab Orata/.test(nomi) && /Reparto Aquile/.test(nomi) && /L’Unità chiede/.test(nomi) && /L’Unità porta/.test(nomi), 'ogni spunto dice chi l’ha scritto (le Unità col nome dell’Unità)');
ok(!/improvvisati/.test(nomi), 'le osservazioni («ho visto») non sono tra quelle da decidere');
await luca.ev(() => spgFiltro('vi', 'oss')); await sleep(300);
ok(await tav() === 1 && /improvvisati/.test(await txt(luca, '.spg-c')), 'la vista «Osservazioni» le mostra');
await luca.ev(() => spgFiltro('vi', 'tut')); await sleep(300);
ok(await tav() === 8, 'la vista «Tutto» le mostra tutte (8)');
await luca.ev(() => spgFiltro('vi', 'dec')); await luca.ev(() => spgFiltro('ar', 'educativa')); await sleep(300);
ok(await tav() === 2, 'il filtro per ambito (Educativa: 2 proposte)');
await luca.ev(() => spgFiltro('ar', '')); await sleep(300);

// ── 2. nuovo obiettivo ──
const primo = () => luca.ev(() => document.querySelector('.spg-c .gi-tx').textContent);
await luca.P.click('.spg-c >> nth=0 >> button >> text=Nel Piano'); await sleep(500);
ok(/Dove lo porti\?/.test(await txt(luca, '#sh-dlg')) && await cnt(luca, 'input[name="spg-d"]') === 3, 'si apre «Dove lo porti?» con tre strade');
const t0 = await luca.ev(() => document.querySelector('#sh-dlg p').textContent);
await luca.P.click('#spg-ok'); await sleep(700);
ok(await luca.ev(() => PN.d.obiettivi.length) === 1, 'di default diventa un nuovo obiettivo');
const ob = await luca.ev(() => PN.d.obiettivi[0]);
ok(ob.origine === 'giro' && /Giro 1/.test(ob.rif) && ob.testo.length > 5 && ob.aree.length <= 1, 'con origine «Giro del Piano», il riferimento a chi l’ha scritto e l’ambito (' + ob.rif + ')');
ok(await luca.ev(() => PN.d.spg.length) === 1 && await luca.ev(() => PN.d.spg[0].s) === 'piano', 'lo spunto è segnato «Nel Piano»');
ok(await tav() === 6, 'e non è più sul tavolo');
ok(await salvato(luca) && db.t.pee_piani.find(p => p.id === pid).data.spg.length === 1, 'salvato nel piano');
// nella vista «Nel Piano» si vede dove è finito
await luca.ev(() => spgFiltro('st', 'piano')); await sleep(300);
ok(await tav() === 1 && /Messo qui: Obiettivo/.test(await txt(luca, '.spg-c')), 'in «Nel Piano» dice dove è finito');
await luca.ev(() => spgFiltro('st', 'tavolo')); await sleep(200);

// ── 3. azione di un obiettivo che c’è già ──
await luca.P.click('.spg-c >> nth=0 >> button >> text=Nel Piano'); await sleep(500);
await luca.P.click('input[name="spg-d"][value="az"]');
await luca.P.click('#spg-ok'); await sleep(700);
ok(await luca.ev(() => PN.d.azioni.length) === 1 && await luca.ev(() => PN.d.azioni[0].ob === PN.d.obiettivi[0].id), 'come azione dell’obiettivo scelto');
// ── 4. nota in «Dove siamo» (due spunti nella stessa nota) ──
await luca.P.click('.spg-c >> nth=0 >> button >> text=Nel Piano'); await sleep(500);
await luca.P.click('input[name="spg-d"][value="an"]'); await luca.P.click('#spg-ok'); await sleep(600);
await luca.P.click('.spg-c >> nth=0 >> button >> text=Nel Piano'); await sleep(500);
await luca.P.click('input[name="spg-d"][value="an"]'); await luca.P.click('#spg-ok'); await sleep(600);
const an = await luca.ev(() => PN.d.analisi.filter(a => a.titolo === 'Dal giro 1'));
ok(an.length === 1 && an[0].testo.split('\n\n').length === 2, 'due note nella stessa voce «Dal giro 1»');
// ── 5. panchina, via, di nuovo sul tavolo ──
ok(await tav() === 3, 'restano 3 sul tavolo');
await luca.P.click('.spg-c >> nth=0 >> button >> text=In panchina'); await sleep(400);
await luca.P.click('.spg-c >> nth=0 >> button >> text=Lascia andare'); await sleep(400);
await luca.P.click('.spg-c >> nth=0 >> button >> text=Lascia andare'); await sleep(400);
ok(await tav() === 0 && /Il tavolo è libero/.test(await txt(luca, 'main.pn')), 'tavolo libero: messaggio');
const cn = await luca.ev(() => [...document.querySelectorAll('.spg-f')].map(b => b.textContent.trim()).filter(t => /·/.test(t)));
ok(cn.join('|') === 'Sul tavolo · 0|Nel Piano · 4|In panchina · 1|Lasciati andare · 2', 'i conteggi per posto (' + cn.join('|') + ')');
await luca.ev(() => spgFiltro('st', 'panchina')); await sleep(300);
await luca.P.click('.spg-c >> nth=0 >> button >> text=Rimetti sul tavolo'); await sleep(400);
await luca.ev(() => spgFiltro('st', 'tavolo')); await sleep(300);
ok(await tav() === 1, 'dalla panchina si rimette sul tavolo');
ok(await luca.ev(() => PN.d.spg.length) === 6, 'nel piano restano segnati solo quelli che non sono sul tavolo (6)');
ok(await salvato(luca), 'tutto salvato');

// ── 6. le carte non si toccano e il riavvio ritrova tutto ──
const row = db.t.pee_piani_contributi.filter(c => c.tipo === 'carte').map(c => JSON.stringify(c.data)).join('');
ok(/riunione dei Capi Unità/.test(row), 'le carte originali sono intatte');
await apri(luca, pid); await sez(luca, 'g-spu');
await luca.ev(() => giCarica(false)); await sleep(600);
ok(await tav() === 1 && await luca.ev(() => PN.d.spg.length) === 6, 'riaprendo il piano è tutto com’era');

// ── 7. due persone che coordinano insieme ──
await apri(vice, pid);
ok(await cnt(vice, '#pn-sb-g-spu') === 0, 'il co-titolare, finché non consegna le sue carte e a giro aperto, non la vede');
await luca.ev(g => PIANI.giroChiudi(g, 'anticipata'), gid); await sleep(400);
await vice.ev(() => giCarica(false)); await sleep(700); await sez(vice, 'g-spu');
ok(await cnt(vice, '#pn-sb-g-spu') === 1 && await cnt(vice, '.spg-c') === 1, 'anche il co-titolare vede la bacheca (stato condiviso)');
await luca.P.click('.spg-c >> nth=0 >> button >> text=Lascia andare'); await sleep(300);
await vice.P.click('.spg-c >> nth=0 >> button >> text=In panchina'); await sleep(300);
await salvato(luca); await salvato(vice); await sleep(1500);
const d = db.t.pee_piani.find(p => p.id === pid).data;
ok(d.spg.length === 7 && d.spg.some(x => x.s === 'panchina' || x.s === 'via'), 'se due persone toccano lo stesso spunto, nessun dato si perde (' + d.spg.map(x => x.s).join(',') + ')');

// ── 8. chi non coordina non può cambiare nulla ──
const errC = await coll.ev(async () => { spgSposta('x|x|x|x', 'via'); return PN.d.spg.length; });
ok(errC === 0 || errC === d.spg.length, 'un collaboratore non cambia la bacheca');
// ── 9. piano vecchio senza la parte nuova ──
db.t.pee_piani.find(p => p.id === pid).data = {v:1, analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], delibera:{data:'', luogo:''}};
db.t.pee_piani.find(p => p.id === pid).rev++;
await apri(luca, pid); await sez(luca, 'g-spu');
ok(await tav() === 7, 'un piano di prima, senza questa parte, funziona: tutti gli spunti tornano sul tavolo');
const nerr = Object.values(W).reduce((n, w) => n + w.pa.errors.length, 0);
ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) for(const k of Object.keys(W)) if(W[k].pa.errors.length) console.log('  errori', k, W[k].pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); const f = summary(); process.exit(f ? 1 : 0);
