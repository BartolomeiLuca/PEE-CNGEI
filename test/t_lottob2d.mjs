// B2d (26/11): il Word del piano tiene la parte discorsiva e aggiunge il Quadro orizzontale a colori con carta intestata della Sezione; Excel del Quadro.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
import fs from 'fs';
import JSZip from '/home/claude/work/libs/node_modules/jszip/lib/index.js';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const luca = db.addUser('luca@x.it', 'password123', 'Luca Titolare');
db.t.pee_profili.push({user_id:luca.id, nome:'Luca Titolare', ruolo:'cg', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const ob = (id, t, aree, o) => Object.assign({id, testo:t, aree, origine:'', rif:'', ricadute:false}, o || {});
const az = (id, o, t, ex) => Object.assign({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'Fatto?', chi:['cdg', 'unita'], ref:'Vera Vice', stato:'in_corso', genitori:true}, ex || {});
db.t.pee_piani.push({id:'p1', owner_id:luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di Gruppo «Pesaro 1» 2026-29', anno_inizio:2026, durata:3, stato:'deliberato', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[{id:'n1', titolo:'Le famiglie', testo:'Poche famiglie partecipano.\n\nVorremmo più serate insieme.'}], swot:null,
    obiettivi:[ob('o1', 'Più famiglie nel Gruppo & più serate <insieme>', ['educativa', 'territorio'], {ricadute:true, origine:'giro', rif:'Giro 1 · Anna Verdi'}), ob('o2', 'Una sede più grande', ['gestionale'])],
    azioni:[az('a1', 'o1', 'Due serate con le famiglie', {step:'meta', mese:'2026-10', tipo:'cont', fine:'2027-05', urgente:true}), az('a2', 'o1', 'Un bivacco di Gruppo', {verifica:2, mese:'2027-06', tipo:'una'}), az('a3', 'o2', 'Cercare un locale', {chi:[], ref:'', genitori:false, stato:'da_iniziare'})],
    uniti:[{id:'u1', testo:'Vecchio obiettivo', aree:['sviluppo']}], spunti:[{id:'s1', da:'Reparto Aquile', testo:'Una giornata insieme'}],
    tappe:[{id:'t1', anno:1, tipo:'meta', data:'2027-02-20', fatta:true, note:'Le serate non partono'}, {id:'t2', anno:1, tipo:'fine', data:'', fatta:false, note:''}],
    delibera:{data:'2026-10-15', luogo:'Sede'}}});
// carte del giro con nomi: non devono finire nel Word
db.t.pee_piani_giri.push({id:'g1', piano_id:'p1', n:1, stato:'chiuso', ritmo:'standard', fase:'giro1', scadenza:null, creato_da:luca.id, created_at:'2026-11-24T10:00:00Z', chiuso_il:'2026-11-25T10:00:00Z', chiusura_tipo:'anticipata'});
db.t.pee_piani_contributi.push({id:'c1', giro_id:'g1', piano_id:'p1', autore_id:luca.id, autore_nome:'Luca Titolare', tipo:'carte', consegnato:true, consegnato_il:'2026-11-25T09:00:00Z', data:{v:1, a:{educativa:{v:'SEGRETO-DELLE-CARTE', c:'', p:'', b:false}}}});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, luca); await sleep(1800); await ev(() => pnOpen('p1')); await sleep(1800);
const txt = x => x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('button[onclick="pnScarica()"]')]);
const zp = fs.readFileSync(await dl.path()); fs.writeFileSync('/tmp/b2d_piano.docx', zp);
const z = await JSZip.loadAsync(zp); const x = await z.file('word/document.xml').async('string'), t = txt(x);
// 1. la parte discorsiva c'è ancora
ok(/Dove siamo/.test(t) && /Poche famiglie partecipano/.test(t) && /Obiettivo 1/.test(t) && /Quadro sinottico/.test(t) && /Le serate non partono/.test(t) && /Una giornata insieme/.test(t), 'Word: la parte discorsiva di prima c’è ancora');
// 2. sezione orizzontale
const sect = x.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g) || [];
ok(sect.length === 2, 'Word: due sezioni (verticale e orizzontale) — ' + sect.length);
ok(/w:orient="landscape"/.test(sect[sect.length - 1]) && !/w:orient="landscape"/.test(sect[0]), 'Word: l’ultima sezione è orizzontale, la prima no');
const wh = (sect[sect.length - 1].match(/<w:pgSz[^>]*>/) || [''])[0]; ok(/w:w="16838"/.test(wh) && /w:h="11906"/.test(wh), 'Word: pagina orizzontale A4 (' + wh + ')');
// 3. contenuto e colori del Quadro
const i0 = t.indexOf('Chi, cosa, quando'); ok(i0 > t.indexOf('Quadro sinottico'), 'Word: «Chi, cosa, quando» viene dopo la parte discorsiva');
const q = t.slice(i0);
ok(/Due serate con le famiglie/.test(q) && /Un bivacco di Gruppo/.test(q) && /Vera Vice/.test(q) && /Consiglio di Gruppo, Unità/.test(q) && /con i genitori/.test(q) && /da ottobre 2026 a maggio 2027/.test(q), 'Quadro Word: azioni, referente, organo, quando');
ok(/★ Urgente/.test(q) && /In corso/.test(q) && /Una sede più grande/.test(q) && /Nessuna azione ancora|Anno 1 · mese da scegliere/.test(q) || /mese da scegliere/.test(q), 'Quadro Word: urgente, stati, mese da scegliere');
ok(/Timeline/.test(q) && /Anno 1 · 2026-27/.test(q) && /Anno 3 · 2028-29/.test(q) && /Verifiche/.test(q) && /Ritmi fissi/.test(q) && /Consiglio di Gruppo/.test(q), 'Quadro Word: timeline con anni, verifiche e ritmi fissi');
const fills = [...x.matchAll(/w:fill="([0-9A-Fa-f]{6})"/g)].map(m => m[1].toUpperCase());
ok(fills.includes('2E7D5A') || fills.includes('E3F1EA'), 'Quadro Word: colori dell’area educativa');
ok(fills.includes('E8ECFA') && fills.includes('2C3E7A'), 'Quadro Word: colori dell’area gestionale (secondo obiettivo)');
ok(new Set(fills).size >= 8, 'Quadro Word: più sfumature (barre per stato) — ' + new Set(fills).size);
// 4. carta intestata: logo + nome Sezione sulla prima pagina
ok(/w:titlePg/.test(sect[0]), 'Word: prima pagina con intestazione propria');
const hs = Object.keys(z.files).filter(n => /^word\/header\d+\.xml$/.test(n)); let hh = ''; for(const n of hs) hh += txt(await z.file(n).async('string')) + '\n' + (await z.file(n).async('string'));
hh += '\n' + txt(await z.file('word/document.xml').async('string'));   // 27/11: la Sezione sta nella colonna della carta intestata, nel corpo
ok(/CNGEI Pesaro/.test(hh) && /Corpo Nazionale Giovani Esploratori ed Esploratrici Italiani/.test(hh), 'carta intestata: «CNGEI Pesaro» e nome dell’ente');
ok(Object.keys(z.files).some(n => /^word\/media\//.test(n)), 'carta intestata: il logo della Sezione è nel file');
// 5. i dati dell'altro utente non servono, ma le carte del giro restano fuori
ok(!/SEGRETO-DELLE-CARTE/.test(t), 'le carte del giro non finiscono nel Word');
// 6. Excel
await P.click('#pn-sb-qua'); await sleep(400);
const [dx] = await Promise.all([P.waitForEvent('download', {timeout:60000}), P.click('#pn-q-xl')]);
ok(/^Chi_cosa_quando_.+\.xlsx$/.test(dx.suggestedFilename()), 'Excel: nome «Chi_cosa_quando_….xlsx» (' + dx.suggestedFilename() + ')');
const xb = fs.readFileSync(await dx.path()); fs.writeFileSync('/tmp/b2d_quadro.xlsx', xb);
const xz = await JSZip.loadAsync(xb); const wbx = await xz.file('xl/workbook.xml').async('string');
ok(/name="Chi, cosa, quando"/.test(wbx) && /name="Timeline"/.test(wbx) && /name="Verifiche"/.test(wbx), 'Excel: tre fogli (Chi cosa quando, Timeline, Verifiche)');
const ss = txt(await xz.file('xl/sharedStrings.xml').async('string'));
ok(/Due serate con le famiglie/.test(ss) && /Un bivacco di Gruppo/.test(ss) && /Vera Vice/.test(ss) && /Più famiglie nel Gruppo & più serate <insieme>/.test(ss) && /Cercare un locale/.test(ss) && /mese da scegliere/.test(ss), 'Excel: obiettivi e azioni, anche con il mese da scegliere');
ok(/Le serate non partono/.test(ss) && /Pesaro/.test(ss) && /Anno 1 · 2026-27/.test(ss), 'Excel: verifiche, Sezione e anni');
const s2 = await xz.file('xl/styles.xml').async('string'); ok(/2E7D5A|E3F1EA/i.test(s2) || /E3F1EA/i.test(await xz.file('xl/worksheets/sheet1.xml').async('string')), 'Excel: celle colorate');
// 7. dopo l'export tutto torna com'era
ok(!(await ev(() => UNIT_NAME)) && !(await ev(() => window._dFootOverride)) && await ev(() => GREEN) !== '2C3E7A', 'dopo l’esportazione i valori globali tornano com’erano');
// 8. un piano senza obiettivi: niente sezione orizzontale e niente pulsante Excel
await ev(() => { PN.d.obiettivi = []; PN.d.azioni = []; pnRender && pnRender(); });
await sleep(300);
const [d2] = await Promise.all([P.waitForEvent('download', {timeout:40000}), ev(() => pnScarica())]);
const z2 = await JSZip.loadAsync(fs.readFileSync(await d2.path())); const x2 = await z2.file('word/document.xml').async('string');
ok(((x2.match(/<w:sectPr/g) || []).length) === 1 && !/Chi, cosa, quando/.test(txt(x2)), 'piano vuoto: Word senza sezione orizzontale');
const nerr = pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(pa.errors.slice(0, 3).join(' | ').slice(0, 400));
await br.close(); process.exit(summary() ? 1 : 0);
