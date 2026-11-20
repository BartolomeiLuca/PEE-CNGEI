// Commissario di Sezione: nel progetto formativo i destinatari sono i Capi Gruppo; il Capo Gruppo continua a vedere i Capi Unità
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const db = new FakeDB();
const br = await launch(engine);
async function prova(ruolo, atteso, nome){
  const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
  const u = db.addUser(ruolo + '@x.it', 'password123', nome);
  db.t.pee_profili.push({user_id:u.id, nome, ruolo, branca:null, sezione:'Pesaro', gruppo:ruolo === 'cds' ? null : '1', area_rcdf:'altoadriatico', dashboard:{}});
  await loginAs(P, base, u); await sleep(2500);
  await P.click('.sh-big >> nth=0'); await sleep(300); await P.click('#sh-ncre'); await sleep(3500);
  const s = await ev(() => ({mode: MODE, ru: STAFF_RUOLO, v: scheda.veste, nav: shNavItems().map(o => o.t || '').join('|'), cds: cgCds(), cu: cgCU(), io: cgIO()}));
  ok(s.mode === 'staff' && s.ru === 'CG' && s.v && s.v.ruolo === ruolo, nome + ': progetto formativo creato con veste ' + ruolo);
  ok(s.cu === atteso.cu && s.io === atteso.io, nome + ': destinatari «' + s.cu + '», ruolo «' + s.io + '»');
  ok(atteso.nav.test(s.nav) && !atteso.no.test(s.nav), nome + ': menu «' + s.nav.split('|').slice(1, 4).join(' · ') + '»');
  const t = await ev(() => { try{ goPhase(1); }catch(e){} return document.body.innerText; }); await sleep(600);
  const t2 = await ev(() => document.body.innerText);
  ok(atteso.pag.test(t2), nome + ': la pagina di osservazione parla di ' + atteso.cu);
  const err = await ev(() => window.__errs || []);
  await pa.ctx.close();
}
await prova('cds', {cu:'Capi Gruppo', io:'Commissario di Sezione', nav:/I miei Capi Gruppo\|Lettura dei Capi Gruppo/, no:/Capi Unità/, pag:/Osservazione dei Capi Gruppo/}, 'Commissario');
await prova('cg', {cu:'Capi Unità', io:'Capo Gruppo', nav:/I miei Capi Unità\|Lettura dei Capi Unità/, no:/Capi Gruppo/, pag:/Osservazione dei Capi Unità/}, 'Capo Gruppo');
await br.close(); process.exit(summary() ? 1 : 0);
