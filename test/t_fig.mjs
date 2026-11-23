// Figure nuove nel profilo (23/11): Comitato di Sezione (con incarichi), Coordinatore Senior, Vice Capo Gruppo, Vice Commissario.
// uso: node t_fig.mjs [motore]   (SITE = copia di prova, come gli altri test)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const until = async (fn, ms = 15000) => { const t = Date.now(); while(Date.now() - t < ms){ try{ if(await fn()) return true; }catch(e){} await sleep(250); } return false; };

// nuova persona senza profilo: va alla schermata del profilo
async function nuova(db, mail, nome){
  const pa = await person(br, db); const P = pa.page; const u = db.addUser(mail, 'password123', nome);
  await loginAs(P, base, u); await sleep(2500); return {pa, P, u};
}
const vis = (P, id) => P.evaluate(i => { const e = document.getElementById(i); if(!e) return null; const r = e.getBoundingClientRect(); return !e.hidden && getComputedStyle(e).display !== 'none' && r.width > 0; }, id);
async function scegli(P, ruolo){ await P.evaluate(r => { const i = document.querySelector('input[name="sh-ruolo"][value="' + r + '"]'); i.click(); }, ruolo); await sleep(200); }

// ── 1. database aggiornato: ogni figura salva e rientra ──
{
  const db = new FakeDB();
  const casi = [
    ['cos', 'Comitato di Sezione', {branca:false, gruppo:false, cos:true}],
    ['coords', 'Coordinatore Senior', {branca:false, gruppo:false, cos:false}],
    ['vcg', 'Vice Capo Gruppo', {branca:false, gruppo:true, cos:false}],
    ['vcds', 'Vice Commissario di Sezione', {branca:false, gruppo:false, cos:false}],
    ['cu', 'Capo Unità', {branca:true, gruppo:true, cos:false}],
    ['cg', 'Capo Gruppo', {branca:false, gruppo:true, cos:false}],
    ['cds', 'Commissario di Sezione', {branca:false, gruppo:false, cos:false}]
  ];
  for(const [ruolo, nome, att] of casi){
    const {pa, P, u} = await nuova(db, ruolo + '@x.it', 'Prova ' + ruolo);
    ok(await until(async () => await P.$('#sh-pf')), nome + ': compare la scheda del profilo');
    ok(await P.$('input[name="sh-ruolo"][value="' + ruolo + '"]') !== null, nome + ': è tra i ruoli del profilo');
    await scegli(P, ruolo);
    ok((await vis(P, 'sh-brw')) === att.branca, nome + ': Branca ' + (att.branca ? 'visibile' : 'nascosta'));
    ok((await vis(P, 'sh-grw')) === att.gruppo, nome + ': Gruppo ' + (att.gruppo ? 'visibile' : 'nascosto'));
    ok((await vis(P, 'sh-cosw')) === att.cos, nome + ': incarichi del Comitato ' + (att.cos ? 'visibili' : 'nascosti'));
    await P.fill('#sh-nome', 'Prova ' + ruolo); await P.fill('#sh-sez', 'Pesaro');
    if(att.gruppo) await P.selectOption('#sh-grp', '1');
    if(att.branca){ await P.evaluate(() => document.querySelector('input[name="sh-branca"][value="E"]').click()); }
    if(att.cos){
      // senza incarico non si salva
      await P.click('#sh-psave'); await sleep(500);
      ok(/almeno un incarico/i.test(await P.evaluate(() => document.getElementById('sh-pmsg').textContent)), nome + ': senza incarico non si salva');
      ok(!db.t.pee_profili.some(r => r.user_id === u.id), nome + ': nulla nel database prima della scelta');
      await P.evaluate(() => { document.getElementById('sh-cosinc0').click(); document.getElementById('sh-cosinc2').click(); });
    }
    await P.click('#sh-psave'); await sleep(1800);
    const riga = db.t.pee_profili.find(r => r.user_id === u.id);
    ok(riga && riga.ruolo === ruolo, nome + ': salvato con ruolo «' + ruolo + '»');
    ok(riga && (att.branca ? riga.branca === 'E' : !riga.branca), nome + ': Branca ' + (att.branca ? 'salvata' : 'vuota'));
    ok(riga && (att.gruppo ? riga.gruppo === '1' : !riga.gruppo), nome + ': Gruppo ' + (att.gruppo ? 'salvato' : 'vuoto'));
    if(att.cos) ok(riga && JSON.stringify(riga.dashboard.cos) === JSON.stringify({incarichi:['presidente','tesoriere']}), nome + ': incarichi salvati nel profilo (Presidente, Tesoriere)');
    else ok(riga && !(riga.dashboard && riga.dashboard.cos), nome + ': nessun incarico del Comitato nel profilo');
    // home: riga del ruolo (con incarichi) e, per le figure nuove, l'avviso
    ok(await until(async () => await P.$('.sh-prof-line')), nome + ': compare la home');
    const t = await P.evaluate(() => document.querySelector('.sh-prof-line').textContent);
    ok(t.includes(nome) && (!att.cos || /Presidente, Tesoriere/.test(t)), nome + ': la riga del profilo dice «' + t.replace(/\s+/g, ' ').slice(0, 80) + '»');
    const nuovaFig = ['cos', 'coords', 'vcg', 'vcds'].includes(ruolo);
    const home = await P.evaluate(() => document.body.innerText);
    ok(nuovaFig ? /in preparazione/.test(home) : !/in preparazione/.test(home), nome + ': avviso «in preparazione» ' + (nuovaFig ? 'presente' : 'assente'));
    // rientro: il profilo si riapre con le stesse scelte
    await P.evaluate(() => shProfileOpen()); await sleep(800);
    ok(await P.evaluate(r => document.querySelector('input[name="sh-ruolo"]:checked').value === r, ruolo), nome + ': riaprendo il profilo il ruolo è lo stesso');
    if(att.cos) ok(await P.evaluate(() => [...document.querySelectorAll('input[name="sh-cosinc"]:checked')].map(i => i.value).join() === 'presidente,tesoriere'), nome + ': gli incarichi restano spuntati');
    // colore: nessuna Branca → blu
    if(!att.branca) ok(await P.evaluate(() => document.body.getAttribute('data-theme') === 'S'), nome + ': colore blu');
    await pa.ctx.close();
  }
}

// ── 2. cambiare ruolo non cancella i dati del profilo (incarichi e Unità restano) ──
{
  const db = new FakeDB(); const {pa, P, u} = await nuova(db, 'cambio@x.it', 'Cambio Ruolo');
  await until(async () => await P.$('#sh-pf'));
  await scegli(P, 'cos'); await P.fill('#sh-nome', 'Cambio Ruolo'); await P.fill('#sh-sez', 'Pesaro');
  await P.evaluate(() => document.getElementById('sh-cosinc1').click()); await P.click('#sh-psave'); await sleep(1800);
  await until(async () => await P.$('.sh-prof-line'));
  await P.evaluate(() => shProfileOpen()); await sleep(600); await scegli(P, 'cg'); await P.selectOption('#sh-grp', '2'); await P.click('#sh-psave'); await sleep(1800);
  const r = db.t.pee_profili.find(x => x.user_id === u.id);
  ok(r && r.ruolo === 'cg' && r.gruppo === '2', 'passando a Capo Gruppo il ruolo cambia');
  ok(r && r.dashboard && r.dashboard.cos && r.dashboard.cos.incarichi[0] === 'commissario', 'gli incarichi del Comitato restano nel profilo (nessun dato perso)');
  await pa.ctx.close();
}

// ── 3. database NON ancora aggiornato: messaggio chiaro, profilo invariato ──
{
  const db = new FakeDB(); db.sqlFigure = false;
  const {pa, P, u} = await nuova(db, 'vecchio@x.it', 'Db Vecchio');
  await until(async () => await P.$('#sh-pf'));
  await scegli(P, 'coords'); await P.fill('#sh-nome', 'Db Vecchio'); await P.fill('#sh-sez', 'Pesaro'); await P.click('#sh-psave'); await sleep(1500);
  const m = await P.evaluate(() => document.getElementById('sh-pmsg').textContent);
  ok(/database va aggiornato/.test(m) && /23 novembre/.test(m), 'senza script SQL: messaggio chiaro («' + m.slice(0, 70) + '…»)');
  ok(!db.t.pee_profili.some(r => r.user_id === u.id), 'senza script SQL: nessun profilo scritto');
  ok(await P.$('#sh-pf') !== null, 'senza script SQL: si resta sul profilo');
  // i ruoli di prima funzionano comunque
  await scegli(P, 'cu'); await P.evaluate(() => document.querySelector('input[name="sh-branca"][value="L"]').click()); await P.selectOption('#sh-grp', '1'); await P.click('#sh-psave'); await sleep(1800);
  ok(db.t.pee_profili.some(r => r.user_id === u.id && r.ruolo === 'cu'), 'senza script SQL: Capo Unità si salva come prima');
  await pa.ctx.close();
}

// ── 4. profilo già salvato con una figura nuova: nuovo progetto (Progetto Personale) funziona ──
{
  const db = new FakeDB(); const {pa, P, u} = await nuova(db, 'pp@x.it', 'Vice Prova');
  db.t.pee_profili.push({user_id:u.id, nome:'Vice Prova', ruolo:'vcg', branca:null, sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
  await P.reload(); await sleep(2500);
  ok(await until(async () => await P.$('.sh-big')), 'Vice Capo Gruppo: la home offre i progetti');
  await P.evaluate(() => shNew('PP')); await sleep(500);
  ok(await P.$('#sh-ncre') !== null, 'Vice Capo Gruppo: si apre «Nuovo progetto»');
  await P.evaluate(() => { const b = document.querySelector('#sh-nbr'); if(b) b.value = 'E'; shVeste(); });
  await P.click('#sh-ncre'); await sleep(3500);
  ok(await until(async () => await P.evaluate(() => typeof MODE !== 'undefined' && MODE === 'giovani')), 'Vice Capo Gruppo: il Progetto Personale si crea e si apre');
  const errs = await P.evaluate(() => window.__errs || []);
  ok(!errs.length, 'nessun errore di pagina' + (errs.length ? ': ' + JSON.stringify(errs).slice(0, 200) : ''));
  await pa.ctx.close();
}
await br.close(); process.exit(summary() ? 1 : 0);
