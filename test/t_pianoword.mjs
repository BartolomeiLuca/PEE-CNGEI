// Il piano in Word (25/11): «Scarica il piano» produce un .docx con testata, analisi, obiettivi e azioni, quadro sinottico e verifiche; senza le carte del giro.
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
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('button[onclick="pnScarica()"]')]);
const nome = dl.suggestedFilename(); if(process.env.DUMP) fs.copyFileSync(await dl.path(), process.env.DUMP);
ok(/^Piano_di_Gruppo_.+\.docx$/.test(nome), 'il file si chiama «Piano_di_Gruppo_…docx» (' + nome + ')');
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const x = await z.file('word/document.xml').async('string');
const t = x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
ok(/Piano di Gruppo/.test(t) && /Deliberato/.test(t) && /Luca Titolare/.test(t) && /15\/10\/2026/.test(t) && /Sede/.test(t), 'testata: titolo, stato, titolare, delibera');
// 27/11: carta intestata della circolare: titolo grande, sotto Gruppo · Sezione · anni scout; colonna dei loghi a sinistra; tutto a sinistra
{ const i0 = t.indexOf('Piano di Gruppo'); const sotto = t.slice(i0, i0 + 200);
  ok(/Piano di Gruppo\s+Gruppo 1\s+Sezione Pesaro\s+Anni scout 2026-27/.test(sotto), 'titolo grande «Piano di Gruppo» e sotto Gruppo, Sezione, anni scout');
  const tit = x.match(/<w:p>(?:(?!<\/w:p>).)*Piano di Gruppo<\/w:t>/s); ok(tit && /w:sz w:val="44"/.test(tit[0]), 'il titolo è in grande');
  ok(/w:val="dashed"/.test(x), 'colonna a sinistra con il filetto tratteggiato della circolare');
  const cx = [...x.matchAll(/<wp:extent cx="(\d+)"/g)].map(m => Number(m[1])); ok(cx.some(v => v >= 1000000 && v <= 1200000), 'il logo della Sezione è grande come nella circolare (circa 3 cm)');
  const hs = await Promise.all(Object.keys(z.files).filter(n => /^word\/header\d*\.xml$/.test(n)).map(n => z.file(n).async('string'))); const h1 = hs.find(h => /Corpo Nazionale/.test(h));
  ok(h1 && !/w:jc w:val="(right|both|center)"/.test(h1) && /Associazione SCOUT/.test(h1), 'intestazione della prima pagina a sinistra, come la circolare');
  ok(!/w:jc w:val="both"/.test(x.slice(0, x.indexOf('Dove siamo'))), 'niente giustificato nella prima pagina'); }
ok(/Le famiglie/.test(t) && /Poche famiglie partecipano/.test(t) && /Vorremmo più serate insieme/.test(t), 'dove siamo');
ok(/Obiettivo 1/.test(t) && /Più famiglie nel Gruppo & più serate <insieme>/.test(t) && /Aree: Educativa, Territorio/.test(t) && /Con ricadute educative/.test(t) && /Ascolto del Piano \(Ascolto 1 · Anna Verdi\)/.test(t), 'obiettivi con aree, ricadute e provenienza (caratteri speciali compresi)');
ok(/Due serate con le famiglie/.test(t) && /Anche a metà anno/.test(t) && /Fine anno 2/.test(t) && /Referente: Vera Vice/.test(t) && /Con i genitori/.test(t) && /Consiglio di Gruppo, Unità/.test(t) && /In corso/.test(t), 'azioni con inizio, verifica, chi, referente, stato');
ok(/da ottobre 2026 a maggio 2027/.test(t) && /giugno 2027/.test(t) && /Urgente/.test(t) && /Anno 1 · mese da scegliere/.test(t), 'Word: «quando» a parole, urgente, e «mese da scegliere» per le azioni vecchie');
ok(/Quadro sinottico/.test(t) && /Verifiche/.test(t) && /20\/02\/2027/.test(t) && /Le serate non partono/.test(t), 'quadro sinottico e verifiche');
ok(/Una giornata insieme/.test(t) && /Vecchio obiettivo/.test(t), 'spunti dalle Unità e obiettivi uniti');
ok(!/SEGRETO-DELLE-CARTE/.test(t) && !/Anna Verdi\b.*SEGRETO/.test(t), 'le carte del giro non finiscono nel Word');
ok(await z.file('word/header1.xml') ? /Piano di Gruppo/.test(await z.file('word/header1.xml').async('string')) : true, 'intestazione del documento');
ok(!(await ev(() => UNIT_NAME)) && !(await ev(() => window._dFootOverride)), 'dopo l’esportazione i valori globali tornano com’erano');
// 26/11: il Word del piano è blu (blu dell'app), non verde di Branca; dopo l'esportazione il tema torna com'era
ok(/2C3E7A/i.test(x) && !/1B5E42/i.test(x), 'il Word del piano è blu');
ok(await ev(() => GREEN) !== '2C3E7A', 'dopo l’esportazione i colori tornano quelli di prima');
// Progetto di Sezione: titolo senza Gruppo; Sezione senza logo (nome non in elenco) non rompe il Word
{ db.t.pee_piani.push({id:'p2', owner_id:luca.id, owner_email:'luca@x.it', tipo:'sezione', titolo:'Progetto di Sezione · Pesaro', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(), created_at:new Date().toISOString(),
    data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null, obiettivi:[], azioni:[], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}, sezione:'Sezione Inventata'}});
  await P.reload(); await sleep(2200); await ev(() => pnOpen('p2')); await sleep(1800);
  const [d2] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('button[onclick="pnScarica()"]')]);
  const z2 = await JSZip.loadAsync(fs.readFileSync(await d2.path())); const x2 = await z2.file('word/document.xml').async('string');
  const t2 = x2.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '');
  ok(/Progetto di Sezione\s+Sezione Sezione Inventata\s+Anni scout/.test(t2) && !/Gruppo 1/.test(t2), 'Progetto di Sezione: titolo, Sezione e anni scout, senza Gruppo');
  ok(/w:val="dashed"/.test(x2) && Object.keys(z2.files).some(n => /^word\/media\//.test(n)), 'Sezione senza logo: la carta intestata c’è comunque'); }
// un lettore scarica il suo Word
const nerr = pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
