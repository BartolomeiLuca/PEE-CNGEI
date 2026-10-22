// Correzioni 9 e 13: niente frecce accanto ai percorsi; controllo ortografico del browser in italiano sui testi liberi
import { FakeDB, serve, launch, person, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
const base = await serve(); const db = new FakeDB(); const br = await launch(engine);
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await P.goto(base); await ev(() => localStorage.setItem('bussola_tour_v3', '1')); await P.reload(); await sleep(800);
await P.locator(':is(a,button):visible', {hasText:'Apri un progetto di esempio'}).first().click(); await sleep(1800);
await ev(() => gGo('3')); await sleep(900);
// 9
const arrows = await ev(() => [...document.querySelectorAll('.pcx-hd button')].filter(b => /Sposta (su|giù)/.test(b.title)).length);
ok(arrows === 0, '9. Sezione 3: niente «Sposta su/giù» accanto ai percorsi (' + arrows + ')');
ok(await ev(() => [...document.querySelectorAll('.pcx-hd button')].some(b => /Togli dalla Scheda|Rimuovi/.test(b.title)) || document.querySelectorAll('.pcx-hd').length > 0), '9. restano le intestazioni dei percorsi (con «Togli dalla Scheda» / «Rimuovi» dove servono)');
// 13
const r = await ev(() => { const v = e => e ? (e.spellcheck + ':' + (e.lang || '')) : 'manca';
  return { lancio: v(document.querySelector('textarea[oninput*="\'lancio\'"]')), titolo: v(document.querySelector(':is(input,textarea)[oninput*="\'testo\'"]')),
    nota: v(document.querySelector('textarea.cl3-note')), link: v(document.querySelector(':is(input,textarea)[inputmode="url"]')) }; });
ok(r.lancio === 'true:it' && r.titolo === 'true:it' && r.nota === 'true:it', '13. testi liberi con controllo ortografico in italiano ' + JSON.stringify(r));
ok(/^false/.test(r.link) || r.link === 'manca', '13. niente controllo sugli indirizzi web (' + r.link + ')');
await ev(() => gGo('1a')); await sleep(900);
const s1 = await ev(() => { const t = document.getElementById('staff-tab'); const ins = t ? [...t.querySelectorAll('input,textarea')] : [];
  const by = re => ins.filter(i => re.test((i.getAttribute('oninput') || '') + (i.getAttribute('onchange') || '') + (i.placeholder || '') + i.type));
  return { mail: by(/mail/).map(i => i.spellcheck), tel: by(/tel/).map(i => i.spellcheck), ctx: document.querySelector('textarea[oninput*="ctxTerr"]').spellcheck, num: [...document.querySelectorAll('#num-box input')].every(i => i.type === 'number') }; });
ok(s1.mail.length && s1.mail.every(x => x === false) && s1.tel.every(x => x === false), '13. mail e telefoni dello staff senza controllo ' + JSON.stringify(s1));
ok(s1.ctx === true && s1.num, '13. il contesto territoriale sì, i numeri no');
// campi creati dopo il disegno: messaggio alle famiglie modificabile
await ev(() => gGo('3')); await sleep(800);
const [p, j] = await ev(() => [getAllPercorsi().findIndex(x => x.percorsoId === 'S3'), 1]);
await ev(([p, j]) => { ['circ'].forEach(k => axOpen[p+'-'+j+'-'+k] = true); axRe(p, j); axMsg(p, j); }, [p, j]); await sleep(500);
ok(await ev(([p, j]) => { const e = document.getElementById('ax-msgt-' + p + '-' + j); return !!e && e.spellcheck === true && e.lang === 'it'; }, [p, j]), '13. anche il messaggio modificabile creato dopo (contenteditable)');
await ev(() => attAdd(getAllPercorsi().findIndex(x => x.percorsoId === 'P5'))); await sleep(2500);
console.log('DBG', JSON.stringify(await ev(() => [...document.querySelectorAll('textarea[oninput*="\'lancio\'"]')].filter(t => !(t.spellcheck === true && t.lang === 'it')).map(t => [t.id, t.spellcheck, t.lang, t.dataset.spk, t.offsetParent === null]))));
ok(await ev(() => [...document.querySelectorAll('textarea[oninput*="\'lancio\'"]')].every(t => t.spellcheck === true && t.lang === 'it')), '13. e nelle attività aggiunte dopo');
ok(await ev(() => FAQ.some(f => /controllo ortografico/i.test(f[1]) && /Safari/.test(f[2]) && /Firefox/.test(f[2]))), '13. nelle FAQ: come attivarlo su Safari e Firefox');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
