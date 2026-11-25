// Profilo: la Sezione si sceglie dall'elenco ufficiale; «La mia Sezione non è in elenco»; valori vecchi conservati
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const nuovo = db.addUser('nuovo@x.it', 'password123', 'Nuova Persona');
const pa = await person(br, db); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, nuovo); await sleep(2200);
const row = () => db.t.pee_profili.find(r => r.user_id === nuovo.id);
const hint = () => ev(() => document.getElementById('sh-sezh').textContent.trim());
const msg = () => ev(() => document.getElementById('sh-pmsg').textContent.trim());
ok(await ev(() => !!document.getElementById('sh-sez') && !!document.getElementById('sh-sezlib')), 'il profilo ha il campo Sezione e la casella «non è in elenco»');
ok(await ev(() => /Scrivi le prime lettere/.test(document.getElementById('sh-sez').placeholder)), 'il campo invita a scrivere le prime lettere');
await P.check('input[name="sh-ruolo"][value="cg"]'); await P.fill('#sh-nome', 'Nuova Persona');
// 1. correzione automatica
await P.fill('#sh-sez', ' pesaro '); await P.dispatchEvent('#sh-sez', 'change'); await sleep(300);
ok(await ev(() => document.getElementById('sh-sez').value) === 'Pesaro' && await hint() === '', 'scritto «pesaro » diventa «Pesaro» (grafia dell’elenco), senza avvisi');
await P.fill('#sh-sez', 'ANCÒNA'); await P.dispatchEvent('#sh-sez', 'change'); ok(await ev(() => document.getElementById('sh-sez').value) === 'Ancona', 'maiuscole e accenti non contano');
// 2. valore non in elenco: bloccato
await P.fill('#sh-sez', 'Pesaro CNGEI'); await P.dispatchEvent('#sh-sez', 'input'); await sleep(200);
ok(/Scegli la Sezione dall’elenco/.test(await hint()), 'mentre si scrive un valore non in elenco compare il suggerimento');
await P.selectOption('#sh-grp', '1').catch(() => {}); await P.click('#sh-psave'); await sleep(900);
ok(!row() && /Scegli la Sezione dall’elenco/.test(await msg()), 'salvando, il valore non in elenco è rifiutato con un messaggio chiaro (nulla salvato)');
// 3. «non è in elenco»
await P.check('#sh-sezlib'); await sleep(200);
ok(/non compari negli elenchi/.test(await hint()), 'con la casella spuntata il messaggio spiega la conseguenza');
await P.click('#sh-psave'); await sleep(1500);
ok(row() && row().sezione === 'Pesaro CNGEI' && row().dashboard.sezioneLibera === true, 'salvato con il testo scritto e il segno «sezioneLibera» (si può cercare nel database)');
// 4. riapro: la casella è spuntata; scelgo dall'elenco e il segno sparisce
row().dashboard.altro = {conserva:1}; await ev(() => { SH.prof.dashboard = Object.assign({}, SH.prof.dashboard, {altro:{conserva:1}}); });
await ev(() => shProfileOpen()); await sleep(900);
ok(await ev(() => document.getElementById('sh-sezlib').checked) && await ev(() => document.getElementById('sh-sez').value) === 'Pesaro CNGEI', 'riaprendo il profilo la casella è già spuntata');
await P.fill('#sh-sez', 'pesaro'); await P.dispatchEvent('#sh-sez', 'change'); await P.click('#sh-psave'); await sleep(1500);
ok(row().sezione === 'Pesaro' && !('sezioneLibera' in row().dashboard) && row().dashboard.altro && row().dashboard.altro.conserva === 1, 'scelta una Sezione dell’elenco il segno viene tolto e gli altri dati del profilo restano');
// 5. profilo vecchio con valore non in elenco: si conserva, con avviso
row().sezione = 'Fano'; row().dashboard = {};
await ev(() => { SH.prof.sezione = 'Fano'; SH.prof.dashboard = {}; }); await ev(() => shGoHome()); await sleep(600); await ev(() => shProfileOpen()); await sleep(900);
ok(/non è nell’elenco/.test(await hint()), 'un valore vecchio non in elenco: avviso gentile al riaprire il profilo');
await P.fill('#sh-nome', 'Nuova Persona Rinominata'); await P.click('#sh-psave'); await sleep(1500);
ok(row().nome === 'Nuova Persona Rinominata' && row().sezione === 'Fano', 'si può salvare altro senza toccare la Sezione: il valore vecchio resta');
await ev(() => shProfileOpen()); await sleep(900); await P.fill('#sh-sez', 'Fanoo'); await P.click('#sh-psave'); await sleep(900);
ok(row().sezione === 'Fano' && /Scegli la Sezione dall’elenco/.test(await msg()), 'ma se la si cambia vale la regola dell’elenco');
// 6. si può svuotare? no: obbligatoria
await P.fill('#sh-sez', ''); await P.click('#sh-psave'); await sleep(700);
ok(/Sezione/.test(await msg()) && row().sezione === 'Fano', 'senza Sezione non si salva');
// 7. i controlli esistenti: dal telefono la casella si tocca bene
const r = await ev(() => { const e = document.getElementById('sh-sezlw').getBoundingClientRect(); return e.height; });
ok(r >= 36, 'la casella è abbastanza grande da toccare (' + Math.round(r) + ' px)');
ok(pa.errors.length === 0, 'nessun errore di pagina (' + pa.errors.length + ')');
await br.close(); process.exit(summary() ? 1 : 0);
