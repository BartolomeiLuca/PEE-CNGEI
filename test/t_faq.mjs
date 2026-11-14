// FAQ nell'anteprima: ordine dei gruppi, voci tolte, «Portami lì», link agli esempi
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = (await serve()) + 'anteprima/'; const db = new FakeDB(); db.sql13 = true;
const A = db.addUser('anna@x.it', 'password123', 'Anna Rossi');
const br = await launch(engine); const pa = await person(br, db, {}), P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, A); await sleep(1500);
await ev(() => exStart('AN')); await sleep(3500); await ev(() => { try{ clClose(); }catch(e){} });
await ev(() => { shGoHome(); }); await sleep(1200);
ok(await ev(() => /Esempio di Progetto Personale/.test(document.body.innerText)), 'pagina Progetti: link agli esempi');
await ev(() => { try{ shDash(); }catch(e){} }); await sleep(500);
await ev(() => faqOpen()); await sleep(300);
const g = await ev(() => [...document.querySelectorAll('#g-modal .faq-sec, #g-modal .faq-gh')].map(e => (e.classList.contains('faq-sec') ? '## ' : '') + e.textContent.replace(/▶.*$/, '').trim()));
ok(g[0] === '## In generale' && g.indexOf('## Pagina per pagina, come nel menu dell’app') > 5, 'gruppi: prima i generali, poi per pagina: ' + g.join(' / '));
const t = await ev(() => document.getElementById('g-modal').innerText);
ok(!/piccole ⓘ/.test(t) && !/Dove vedo le novità/.test(t) && !/Indicatori di Raggiungimento/.test(t) && !/Archivio › Versioni/.test(t), 'voci tolte e termini corretti');
ok(/Prossime scadenze/.test(t) && await ev(() => FAQ.some(f => /Riprendi da un progetto/.test(f[2]))), 'voci nuove presenti');
await ev(() => modalClose());
const n = await ev(() => FAQ.length); let bad = [];
for(let i = 0; i < n; i++){
  const c = await ev(i => FAQ[i][3] || '', i); if(!c || /^(clOpen|clOpenHist|shGoHome|fbOpen|facGuideOpen|anOpen)\(/.test(c)) continue;
  await ev(() => { try{ clClose(); shDash(); }catch(e){} }); await sleep(200);
  const before = await ev(() => document.body.innerHTML.length);
  const same = await ev(async i => { const b = document.querySelector('.sh-nav .on, [aria-current=page]'); const t0 = b ? b.textContent : ''; faqGo(i); await new Promise(r => setTimeout(r, 700)); const b2 = document.querySelector('.sh-nav .on, [aria-current=page]'); return t0 === (b2 ? b2.textContent : '') && t0 === 'Dashboard'; }, i);
  if(same) bad.push(i + ':' + c);
}
ok(!bad.length, '«Portami lì» cambia pagina in tutte le voci nel menu (' + bad.join(', ') + ')');
ok(!pa.errors.length, 'nessun errore ' + pa.errors.slice(0, 2).join('|'));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
