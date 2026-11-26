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
    azioni:[az('a1', 'o1', 'Due serate con le famiglie', {step:'meta'}), az('a2', 'o1', 'Un bivacco di Gruppo', {verifica:2}), az('a3', 'o2', 'Cercare un locale', {chi:[], ref:'', genitori:false, stato:'da_iniziare'})],
    uniti:[{id:'u1', testo:'Vecchio obiettivo', aree:['sviluppo']}], spunti:[{id:'s1', da:'Reparto Aquile', testo:'Una giornata insieme'}],
    tappe:[{id:'t1', anno:1, tipo:'meta', data:'2027-02-20', fatta:true, note:'Le serate non partono'}, {id:'t2', anno:1, tipo:'fine', data:'', fatta:false, note:''}],
    delibera:{data:'2026-10-15', luogo:'Sede'}}});
// carte del giro con nomi: non devono finire nel Word
db.t.pee_piani_giri.push({id:'g1', piano_id:'p1', n:1, stato:'chiuso', ritmo:'standard', fase:'giro1', scadenza:null, creato_da:luca.id, created_at:'2026-11-24T10:00:00Z', chiuso_il:'2026-11-25T10:00:00Z', chiusura_tipo:'anticipata'});
db.t.pee_piani_contributi.push({id:'c1', giro_id:'g1', piano_id:'p1', autore_id:luca.id, autore_nome:'Luca Titolare', tipo:'carte', consegnato:true, consegnato_il:'2026-11-25T09:00:00Z', data:{v:1, a:{educativa:{v:'SEGRETO-DELLE-CARTE', c:'', p:'', b:false}}}});
const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
await loginAs(P, base, luca); await sleep(1800); await ev(() => pnOpen('p1')); await sleep(1800);
const [dl] = await Promise.all([P.waitForEvent('download', {timeout:40000}), P.click('button[onclick="pnScarica()"]')]);
const nome = dl.suggestedFilename();
ok(/^Piano_di_Gruppo_.+\.docx$/.test(nome), 'il file si chiama «Piano_di_Gruppo_…docx» (' + nome + ')');
const z = await JSZip.loadAsync(fs.readFileSync(await dl.path())); const x = await z.file('word/document.xml').async('string');
const t = x.replace(/<w:tab\/>/g, ' ').replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
ok(/Piano di Gruppo «Pesaro 1» 2026-29/.test(t) && /Deliberato/.test(t) && /Luca Titolare/.test(t) && /15\/10\/2026/.test(t) && /Sede/.test(t), 'testata: titolo, stato, titolare, delibera');
ok(/Le famiglie/.test(t) && /Poche famiglie partecipano/.test(t) && /Vorremmo più serate insieme/.test(t), 'dove siamo');
ok(/Obiettivo 1/.test(t) && /Più famiglie nel Gruppo & più serate <insieme>/.test(t) && /Aree: Educativa, Territorio/.test(t) && /Con ricadute educative/.test(t) && /Ascolto del Piano \(Ascolto 1 · Anna Verdi\)/.test(t), 'obiettivi con aree, ricadute e provenienza (caratteri speciali compresi)');
ok(/Due serate con le famiglie/.test(t) && /Anche a metà anno/.test(t) && /Fine anno 2/.test(t) && /Referente: Vera Vice/.test(t) && /Con i genitori/.test(t) && /Consiglio di Gruppo, Unità/.test(t) && /In corso/.test(t), 'azioni con inizio, verifica, chi, referente, stato');
ok(/Quadro sinottico/.test(t) && /Verifiche/.test(t) && /20\/02\/2027/.test(t) && /Le serate non partono/.test(t), 'quadro sinottico e verifiche');
ok(/Una giornata insieme/.test(t) && /Vecchio obiettivo/.test(t), 'spunti dalle Unità e obiettivi uniti');
ok(!/SEGRETO-DELLE-CARTE/.test(t) && !/Anna Verdi\b.*SEGRETO/.test(t), 'le carte del giro non finiscono nel Word');
ok(await z.file('word/header1.xml') ? /Piano di Gruppo/.test(await z.file('word/header1.xml').async('string')) : true, 'intestazione del documento');
ok(!(await ev(() => UNIT_NAME)) && !(await ev(() => window._dFootOverride)), 'dopo l’esportazione i valori globali tornano com’erano');
// 26/11: il Word del piano è blu (blu dell'app), non verde di Branca; dopo l'esportazione il tema torna com'era
ok(/2C3E7A/i.test(x) && !/1B5E42/i.test(x), 'il Word del piano è blu');
ok(await ev(() => GREEN) !== '2C3E7A', 'dopo l’esportazione i colori tornano quelli di prima');
// un lettore scarica il suo Word
const nerr = pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log(pa.errors.slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
