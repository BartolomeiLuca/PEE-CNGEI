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
// cosw = spunta «Faccio parte del Comitato di Sezione» visibile (Commissario, Presidente e Tesoriere ne fanno parte già); unita = casella «Ho anche un'Unità»
{
  const db = new FakeDB();
  const casi = [
    ['vcg', 'Vice Capo Gruppo', {branca:false, gruppo:true, cosw:true, unita:true}],
    ['vcds', 'Vice Commissario di Sezione', {branca:false, gruppo:false, cosw:true, unita:true}],
    ['pres', 'Presidente di Sezione', {branca:false, gruppo:false, cosw:false, unita:true}],
    ['tes', 'Tesoriere di Sezione', {branca:false, gruppo:false, cosw:false, unita:true}],
    ['coords', 'Coordinatore Senior', {branca:false, gruppo:false, cosw:true, unita:true}],
    ['snr', 'Senior', {branca:false, gruppo:false, cosw:true, unita:false}],
    ['senior', 'Senior in Servizio', {branca:true, gruppo:true, cosw:true, unita:false}],
    ['cu', 'Capo Unità', {branca:true, gruppo:true, cosw:true, unita:false}],
    ['cg', 'Capo Gruppo', {branca:false, gruppo:true, cosw:true, unita:true}],
    ['cds', 'Commissario di Sezione', {branca:false, gruppo:false, cosw:false, unita:true}]
  ];
  for(const [ruolo, nome, att] of casi){
    const {pa, P, u} = await nuova(db, ruolo + '@x.it', 'Prova ' + ruolo);
    ok(await until(async () => await P.$('#sh-pf')), nome + ': compare la scheda del profilo');
    ok(await P.$('input[name="sh-ruolo"][value="' + ruolo + '"]') !== null, nome + ': è tra i ruoli del profilo');
    await scegli(P, ruolo);
    ok((await vis(P, 'sh-brw')) === att.branca, nome + ': Branca ' + (att.branca ? 'visibile' : 'nascosta'));
    ok((await vis(P, 'sh-grw')) === att.gruppo, nome + ': Gruppo ' + (att.gruppo ? 'visibile' : 'nascosto'));
    ok((await vis(P, 'sh-cosw')) === att.cosw, nome + ': spunta del Comitato ' + (att.cosw ? 'visibile' : 'nascosta (è automatico)'));
    ok((await vis(P, 'sh-unw')) === att.unita, nome + ': «Ho anche un’Unità» ' + (att.unita ? 'visibile' : 'nascosta'));
    await P.fill('#sh-nome', 'Prova ' + ruolo); await P.fill('#sh-sez', 'Pesaro');
    if(att.gruppo) await P.selectOption('#sh-grp', '1');
    if(att.branca){ await P.evaluate(() => document.querySelector('input[name="sh-branca"][value="E"]').click()); }
    if(att.cosw) await P.evaluate(() => document.getElementById('sh-cosm').click());
    await P.click('#sh-psave'); await sleep(1800);
    const riga = db.t.pee_profili.find(r => r.user_id === u.id);
    ok(riga && riga.ruolo === ruolo, nome + ': salvato con ruolo «' + ruolo + '»');
    ok(riga && (att.branca ? riga.branca === 'E' : !riga.branca), nome + ': Branca ' + (att.branca ? 'salvata' : 'vuota'));
    ok(riga && (att.gruppo ? riga.gruppo === '1' : !riga.gruppo), nome + ': Gruppo ' + (att.gruppo ? 'salvato' : 'vuoto'));
    if(att.cosw) ok(riga && JSON.stringify(riga.dashboard.cos) === JSON.stringify({membro:true}), nome + ': spunta del Comitato salvata nel profilo');
    else ok(riga && !(riga.dashboard && riga.dashboard.cos), nome + ': nessun dato del Comitato nel profilo (automatico)');
    // home: riga del ruolo (con il Comitato) e, per le figure nuove, l'avviso
    ok(await until(async () => await P.$('.sh-prof-line')), nome + ': compare la home');
    const t = await P.evaluate(() => document.querySelector('.sh-prof-line').textContent);
    ok(t.includes(nome) && (!att.cosw || /Comitato di Sezione/.test(t)), nome + ': la riga del profilo dice «' + t.replace(/\s+/g, ' ').slice(0, 90) + '»');
    const nuovaFig = ['vcg', 'vcds', 'pres', 'tes', 'coords', 'snr', 'senior'].includes(ruolo);
    const home = await P.evaluate(() => document.body.innerText);
    ok(nuovaFig ? /in preparazione/.test(home) : !/in preparazione/.test(home), nome + ': avviso «in preparazione» ' + (nuovaFig ? 'presente' : 'assente'));
    // rientro: il profilo si riapre con le stesse scelte
    await P.evaluate(() => shProfileOpen()); await sleep(800);
    ok(await P.evaluate(r => document.querySelector('input[name="sh-ruolo"]:checked').value === r, ruolo), nome + ': riaprendo il profilo il ruolo è lo stesso');
    if(att.cosw) ok(await P.evaluate(() => document.getElementById('sh-cosm').checked), nome + ': la spunta resta');
    // colore: nessuna Branca → blu
    if(!att.branca) ok(await P.evaluate(() => document.body.getAttribute('data-theme') === 'S'), nome + ': colore blu');
    await pa.ctx.close();
  }
  // «Comitato di Sezione» non è più un ruolo
  const {pa: pb, P: Pb} = await nuova(db, 'nocos@x.it', 'No Cos'); await until(async () => await Pb.$('#sh-pf'));
  ok(await Pb.$('input[name="sh-ruolo"][value="cos"]') === null, 'tra i ruoli del profilo «Comitato di Sezione» non c’è più');
  const ordine = await Pb.evaluate(() => [...document.querySelectorAll('input[name="sh-ruolo"]')].map(i => i.value).join());
  ok(ordine === 'cu,vcu,senior,cg,vcg,cds,vcds,pres,tes,coords,snr,volontario', 'ordine dei ruoli: Capo Unità, Vice Capo Unità, Senior in Servizio, Capo Gruppo, Vice Capo Gruppo, Commissario, Vice Commissario, Presidente, Tesoriere, Coordinatore Senior, Senior, Adulto in formazione (' + ordine + ')');
  const etic = await Pb.evaluate(() => [...document.querySelectorAll('input[name="sh-ruolo"]')].map(i => i.closest('label').textContent.trim()).join('|'));
  ok(/Senior in Servizio/.test(etic) && /\|Senior\|/.test(etic), 'Senior in Servizio e Senior sono due voci diverse');
  await pb.ctx.close();
}

// ── 1b. «Ho anche un'Unità» per Vice, Presidente, Tesoriere e Coordinatore Senior: si salva e si ritrova ──
{
  const db = new FakeDB();
  for(const ruolo of ['vcg', 'vcds', 'pres', 'tes', 'coords']){
    const {pa, P, u} = await nuova(db, 'un' + ruolo + '@x.it', 'Unità ' + ruolo); await until(async () => await P.$('#sh-pf'));
    await scegli(P, ruolo); await P.fill('#sh-nome', 'Unità ' + ruolo); await P.fill('#sh-sez', 'Pesaro'); if(ruolo === 'vcg') await P.selectOption('#sh-grp', '1');
    await P.evaluate(() => document.getElementById('sh-hasun').click()); await sleep(200);
    ok(await vis(P, 'sh-unf'), ruolo + ': spuntando compaiono Branca e nome dell’Unità');
    await P.click('#sh-psave'); await sleep(1000);
    ok(/Branca della tua Unità/.test(await P.evaluate(() => document.getElementById('sh-pmsg').textContent)) && !db.t.pee_profili.some(r => r.user_id === u.id), ruolo + ': senza Branca non si salva');
    await P.evaluate(() => document.querySelector('input[name="sh-unbr"][value="R"]').click()); await P.fill('#sh-unn', 'Compagnia Aquila'); await P.click('#sh-psave'); await sleep(1800);
    const r = db.t.pee_profili.find(x => x.user_id === u.id);
    ok(r && r.ruolo === ruolo && JSON.stringify(r.dashboard.unita) === JSON.stringify({branca:'R', nome:'Compagnia Aquila'}) && !r.branca, ruolo + ': Unità nel profilo (Rover, Compagnia Aquila), nessuna Branca di profilo');
    await until(async () => await P.$('.sh-prof-line'));
    await P.evaluate(() => shProfileOpen()); await sleep(800);
    ok(await P.evaluate(() => document.getElementById('sh-hasun').checked && document.getElementById('sh-unn').value === 'Compagnia Aquila'), ruolo + ': riaprendo il profilo l’Unità c’è');
    const cu = await P.evaluate(() => typeof giSonoCU === 'function' ? null : null); 
    await pa.ctx.close();
  }
}

// ── 2. cambiare ruolo non cancella i dati del profilo (Comitato e Unità restano) ──
{
  const db = new FakeDB(); const {pa, P, u} = await nuova(db, 'cambio@x.it', 'Cambio Ruolo');
  await until(async () => await P.$('#sh-pf'));
  await scegli(P, 'vcg'); await P.fill('#sh-nome', 'Cambio Ruolo'); await P.fill('#sh-sez', 'Pesaro'); await P.selectOption('#sh-grp', '1');
  await P.evaluate(() => document.getElementById('sh-cosm').click()); await P.click('#sh-psave'); await sleep(1800);
  await until(async () => await P.$('.sh-prof-line'));
  await P.evaluate(() => shProfileOpen()); await sleep(600); await scegli(P, 'cg'); await P.selectOption('#sh-grp', '2'); await P.click('#sh-psave'); await sleep(1800);
  let r = db.t.pee_profili.find(x => x.user_id === u.id);
  ok(r && r.ruolo === 'cg' && r.gruppo === '2', 'passando a Capo Gruppo il ruolo cambia');
  ok(r && r.dashboard && r.dashboard.cos && r.dashboard.cos.membro === true, 'la spunta del Comitato resta nel profilo (nessun dato perso)');
  // passando a Presidente (Comitato automatico) la spunta resta com'era
  await P.evaluate(() => shProfileOpen()); await sleep(600); await scegli(P, 'pres'); await P.click('#sh-psave'); await sleep(1800);
  r = db.t.pee_profili.find(x => x.user_id === u.id);
  ok(r && r.ruolo === 'pres' && r.dashboard && r.dashboard.cos && r.dashboard.cos.membro === true && !r.gruppo, 'passando a Presidente il dato del Comitato resta; il Gruppo non serve più');
  await pa.ctx.close();
}

// ── 2b. profilo salvato PRIMA del 27/11 con ruolo «Comitato di Sezione»: l'app chiede il ruolo vero, senza perdere nulla ──
{
  const db = new FakeDB(); const u = db.addUser('vecchiocos@x.it', 'password123', 'Vecchio Cos');
  db.t.pee_profili.push({user_id:u.id, nome:'Vecchio Cos', ruolo:'cos', branca:'', sezione:'Pesaro', gruppo:'', area_rcdf:'altoadriatico', dashboard:{cos:{incarichi:['tesoriere']}}});
  const pa = await person(br, db); const P = pa.page; await loginAs(P, base, u); await sleep(2500);
  ok(await until(async () => await P.$('#sh-pf')), 'ruolo «Comitato di Sezione» salvato prima: compare il profilo da completare');
  ok(await P.evaluate(() => (document.querySelector('input[name="sh-ruolo"]:checked') || {}).value) === 'tes', 'con l’incarico di Tesoriere il ruolo proposto è Tesoriere');
  await P.click('#sh-psave'); await sleep(1800);
  const r = db.t.pee_profili.find(x => x.user_id === u.id);
  ok(r && r.ruolo === 'tes' && r.sezione === 'Pesaro' && r.nome === 'Vecchio Cos', 'salvato come Tesoriere, Sezione e nome intatti');
  await pa.ctx.close();
  const u2 = db.addUser('vecchiocos2@x.it', 'password123', 'Vecchio Membro');
  db.t.pee_profili.push({user_id:u2.id, nome:'Vecchio Membro', ruolo:'cos', branca:'', sezione:'Pesaro', gruppo:'', area_rcdf:'altoadriatico', dashboard:{cos:{incarichi:['membro']}}});
  const pb = await person(br, db); await loginAs(pb.page, base, u2); await sleep(2500);
  ok(await until(async () => await pb.page.$('#sh-pf')) && await pb.page.evaluate(() => !document.querySelector('input[name="sh-ruolo"]:checked')), 'Membro del Comitato di prima: nessun ruolo preselezionato, va scelto');
  const msg0 = await pb.page.evaluate(async () => { document.getElementById('sh-psave').click(); await new Promise(r => setTimeout(r, 600)); return document.getElementById('sh-pmsg').textContent; });
  ok(/ruolo/i.test(msg0), 'senza ruolo non si salva («' + msg0 + '»)');
  await pb.ctx.close();
}

// ── 3. database NON ancora aggiornato: messaggio chiaro, profilo invariato ──
{
  const db = new FakeDB(); db.sqlFigure = false;
  const {pa, P, u} = await nuova(db, 'vecchio@x.it', 'Db Vecchio');
  await until(async () => await P.$('#sh-pf'));
  await scegli(P, 'coords'); await P.fill('#sh-nome', 'Db Vecchio'); await P.fill('#sh-sez', 'Pesaro'); await P.click('#sh-psave'); await sleep(1500);
  const m = await P.evaluate(() => document.getElementById('sh-pmsg').textContent);
  ok(/database va aggiornato/.test(m) && /28 novembre/.test(m), 'senza script SQL: messaggio chiaro («' + m.slice(0, 70) + '…»)');
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
