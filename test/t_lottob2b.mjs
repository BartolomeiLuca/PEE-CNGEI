// Lotto B2b (27/11): voce «Quadro»: tabella obiettivi e azioni (referente, organo, quando, verifica, stato), filtri, clic che porta a modificare; sola lettura per chi non scrive.
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:'', sezione:'Pesaro', gruppo:'Pesaro 1', area_rcdf:'altoadriatico', dashboard:{}}); };
prof('luca', 'Luca Titolare', 'cg'); prof('vera', 'Vera Vice', 'vcg');
const ob = (id, t, aree, x) => Object.assign({id, testo:t, aree, origine:'', rif:'', ricadute:false}, x || {});
const az = (id, o, t, x) => Object.assign({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'', chi:[], ref:'', stato:'da_iniziare', genitori:false}, x || {});
db.t.pee_piani.push({id:'p1', owner_id:U.luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null,
    obiettivi:[ob('o1', 'Più famiglie nel Gruppo', ['educativa', 'territorio'], {ricadute:true}), ob('o2', 'Una sede più grande', ['gestionale']), ob('o3', 'Formare gli adulti', ['formativa'])],
    azioni:[az('a1', 'o1', 'Serate con le famiglie', {mese:'2027-03', tipo:'cont', fine:'2027-06', chi:['cdg', 'unita'], genitori:true, ref:'Anna Rossi', stato:'in_corso', verifica:'ogni', step:'meta'}),
            az('a2', 'o1', 'Festa di Gruppo', {mese:'2026-12', tipo:'una', ref:'Vera Vice', urgente:true, chi:['cg']}),
            az('a3', 'o1', 'Azione vecchia senza mese', {inizio:2}),
            az('a4', 'o2', 'Cercare un locale', {mese:'2027-01', tipo:'cont', fine:'piano', ref:'Vera Vice', stato:'fatta', chi:['sezione']})],
    uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'lettore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});
const mk = async k => { const pa = await person(br, db, {ctx:{viewport:{width:1280, height:900}}}); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const L = await mk('luca');
await L.ev(() => pnOpen('p1')); await sleep(1600);
ok(await L.ev(() => [...document.querySelectorAll('[id^="pn-sb-"]')].map(b => b.id.slice(6)).slice(0, 3).join()) === 'pan,qua,cal', 'nel menu «Quadro» sta dopo la Panoramica (' + await L.ev(() => [...document.querySelectorAll('[id^="pn-sb-"]')].map(b => b.id.slice(6)).join()) + ')');
await L.P.click('#pn-sb-qua'); await sleep(400);
const righe = () => L.ev(() => [...document.querySelectorAll('.pn-qt tbody tr')].map(r => r.className.indexOf('pn-qoh') >= 0 ? 'OB:' + r.textContent.replace(/\s+/g, ' ').trim().slice(0, 25) : 'AZ:' + r.querySelector('td').textContent.replace(/\s+/g, ' ').trim().slice(0, 30)));
let R = await righe();
ok(R.length === 3 + 4 + 1, 'tre obiettivi, quattro azioni e la riga «nessuna azione» (' + R.length + ')');
ok(R[1].startsWith('AZ:Festa') && R[2].startsWith('AZ:Serate') && R[3].startsWith('AZ:Azione vecchia'), 'nell’obiettivo 1 le azioni sono in ordine di tempo, quella senza mese in coda (' + R.slice(0, 4).join(' | ') + ')');
ok(R[7] === 'AZ:Nessuna azione ancora.', 'un obiettivo senza azioni lo dice');
const cell = (n, k) => L.ev(([n, k]) => document.querySelectorAll('.pn-qa')[n].querySelector('td[data-l="' + k + '"]').textContent.replace(/\s+/g, ' ').trim(), [n, k]);
ok(await cell(1, 'Referente') === 'Anna Rossi' && /Consiglio di Gruppo, Unità · con i genitori/.test(await cell(1, 'Organo')), 'referente e organo');
ok(await cell(1, 'Quando') === 'da marzo 2027 a giugno 2027' && await cell(0, 'Quando') === 'dicembre 2026', '«quando» a parole');
ok(/Ogni anno · anche a metà anno/.test(await cell(1, 'Si verifica')), 'come si verifica');
ok(/◐ In corso/.test(await cell(1, 'Stato')) && /Urgente/.test(await cell(0, 'Azione')), 'stato con segno e parola, urgente con la parola');
ok(/Anno 2 · mese da scegliere/.test(await cell(2, 'Quando')), 'l’azione vecchia dice «mese da scegliere»');
ok(await cell(3, 'Quando').then(t => t === 'da gennaio 2027 a fine piano'), 'fino a fine piano');
ok(await L.ev(() => getComputedStyle(document.querySelector('.pn-qo')).borderLeftColor) === 'rgb(46, 125, 90)', 'il colore dell’obiettivo 1 è quello della prima area (educativa)');
ok(/Educativa/.test(await L.ev(() => document.querySelector('.pn-qoh').textContent)) && /Territorio/.test(await L.ev(() => document.querySelector('.pn-qoh').textContent)), 'le altre aree sono etichette scritte');
ok(/senza mese/.test(await L.ev(() => document.getElementById('pn-q-conta').textContent)) && /1 urgente/.test(await L.ev(() => document.getElementById('pn-q-conta').textContent)), 'conteggi: urgenti e senza mese');
// filtri
await L.P.selectOption('#pn-qf-ref', 'Vera Vice'); await sleep(200); R = await righe();
ok(R.length === 4 && R.every(r => !r.startsWith('AZ:Serate')), 'filtro per referente: restano le azioni di Vera Vice (' + R.join(' | ') + ')');
await L.P.selectOption('#pn-qf-ref', ''); await L.P.selectOption('#pn-qf-chi', 'cdg'); await sleep(200); R = await righe();
ok(R.length === 2 && R[1].startsWith('AZ:Serate'), 'filtro per organo');
await L.P.selectOption('#pn-qf-chi', ''); await L.P.selectOption('#pn-qf-area', 'gestionale'); await sleep(200); R = await righe();
ok(R.length === 2 && R[0].startsWith('OB:2'), 'filtro per area (' + R.join(' | ') + ')');
await L.P.selectOption('#pn-qf-area', ''); await L.P.check('#pn-qf-urg', {force:true}); await sleep(200); R = await righe();
ok(R.length === 2 && R[1].startsWith('AZ:Festa'), 'solo urgenti');
await L.P.uncheck('#pn-qf-urg', {force:true}); await L.P.selectOption('#pn-qf-stato', 'fatta'); await sleep(200); R = await righe();
ok(R.length === 2 && R[1].startsWith('AZ:Cercare'), 'filtro per stato');
await L.P.selectOption('#pn-qf-ref', '__no'); await L.P.selectOption('#pn-qf-stato', ''); await sleep(200); R = await righe();
ok(R.length === 2 && R[1].startsWith('AZ:Azione vecchia'), 'senza referente');
await L.P.selectOption('#pn-qf-ref', ''); await sleep(100);
// clic su un’azione → porta a modificarla
await L.ev(() => document.querySelector('.pn-qa a').click()); await sleep(900);
ok(await L.ev(() => PN.sez) === 'obi' && await L.ev(() => !!document.getElementById('pn-azt-a2') && document.getElementById('pn-azt-a2').offsetParent !== null), 'un clic sulla riga apre l’obiettivo e l’azione da modificare');
// modifica e ritorno: la tabella segue
await L.P.fill('#pn-azt-a2', 'Festa di Gruppo di primavera'); await sleep(300);
await L.P.click('#pn-sb-qua'); await sleep(300);
ok(/primavera/.test(await cell(0, 'Azione')), 'tornando al Quadro la modifica c’è');
// sola lettura per chi non scrive
const V = await mk('vera'); await V.ev(() => pnOpen('p1')); await sleep(1600); await V.P.click('#pn-sb-qua'); await sleep(400);
ok(await V.ev(() => document.querySelectorAll('.pn-qa').length) === 5 && await V.ev(() => document.querySelectorAll('.pn-qt input, .pn-qt textarea').length) === 0, 'il lettore vede il Quadro, senza campi da scrivere');
const nerr = [L, V].reduce((n, w) => n + w.pa.errors.length, 0); ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log([L, V].flatMap(w => w.pa.errors).slice(0, 2).join(' | ').slice(0, 300));
await br.close(); process.exit(summary() ? 1 : 0);
