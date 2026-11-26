// Lotto A (26/11): obiettivi richiudibili, Senior in Servizio nell'elenco, nome + ruolo + Branca sulle carte degli altri (blu per CG e Commissario)
import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = process.env.SITE || '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine); const db = new FakeDB();
const U = {}; const prof = (k, nome, ruolo, br_, sez, gr, dash) => { U[k] = db.addUser(k + '@x.it', 'password123', nome); db.t.pee_profili.push({user_id:U[k].id, nome, ruolo, branca:br_, sezione:sez, gruppo:gr, area_rcdf:'altoadriatico', dashboard:dash || {}}); };
prof('luca', 'Luca Titolare', 'cg', '', 'Pesaro', 'Pesaro 1'); prof('vera', 'Vera Vice', 'vcg', '', 'Pesaro', 'Pesaro 1'); prof('ugo', 'Ugo Capo', 'cu', 'E', 'Pesaro', 'Pesaro 1');
prof('sara', 'Sara Senior', 'senior', 'R', 'Pesaro', 'Pesaro 1'); prof('dino', 'Dino Commissario', 'cds', '', 'Pesaro', ''); prof('lia', 'Lia Lupetta', 'cu', 'L', 'Pesaro', 'Pesaro 1');
const mk = async (k, w) => { const pa = await person(br, db, w ? {ctx:{viewport:w}} : undefined); await loginAs(pa.page, base, U[k]); await sleep(1800); return {pa, P:pa.page, ev:(f, a) => pa.page.evaluate(f, a)}; };
const ob = (id, t, aree) => ({id, testo:t, aree, origine:'', rif:'', ricadute:false});
const az = (id, o, t, ref) => ({id, ob:o, testo:t, inizio:1, verifica:'ogni', indicatore:'', chi:[], ref:ref || '', stato:'da_iniziare', genitori:false});
db.t.pee_piani.push({id:'p1', owner_id:U.luca.id, owner_email:'luca@x.it', tipo:'gruppo', titolo:'Piano di prova', anno_inizio:2026, durata:3, stato:'bozza', archivio_id:null, rev:1, updated_at:new Date().toISOString(),
  data:{v:1, titolareNome:'Luca Titolare', analisi:[], swot:null, obiettivi:[ob('o1', 'Più famiglie', ['educativa']), ob('o2', 'Una sede più grande', ['gestionale']), ob('o3', 'Formare gli adulti', ['formativa'])],
    azioni:[az('a1', 'o1', 'Due serate'), az('a2', 'o2', 'Cercare un locale', 'Vera Vice'), az('a3', 'o3', 'Un corso')], uniti:[], spunti:[], spg:[], tappe:[], delibera:{data:'', luogo:''}}});
db.t.pee_piani_membri.push({id:'m1', piano_id:'p1', email:'vera@x.it', ruolo:'collaboratore', etichetta:'Vice Capo Gruppo', nome:'Vera Vice', invitato_da:U.luca.id, visto_il:null, created_at:new Date().toISOString()});

// ── 1. obiettivi richiudibili ──
const L = await mk('luca', {width:1280, height:900});
await L.ev(() => pnOpen('p1')); await sleep(1600); await L.ev(() => { PN.sez = 'obi'; pnRender(); }); await sleep(300);
const stato = () => L.ev(() => [...document.querySelectorAll('.pn-ob')].map(a => a.querySelector('.pn-ob-tg').getAttribute('aria-expanded') + ':' + (a.querySelector('.pn-ob-b').hidden ? 'h' : 'v')));
ok(JSON.stringify(await stato()) === '["false:h","false:h","false:h"]', 'con il testo scritto gli obiettivi si aprono chiusi');
ok(await L.ev(() => /Più famiglie/.test(document.querySelector('.pn-ob-sm').textContent) && /Educativa/.test(document.querySelector('.pn-ob-mt').textContent) && /1 azione/.test(document.querySelector('.pn-ob-mt').textContent)), 'da chiuso si vedono titolo, area e numero di azioni');
await L.P.click('#pn-obg-o2'); await sleep(150);
ok(JSON.stringify(await stato()) === '["false:h","true:v","false:h"]', 'un clic apre solo quell’obiettivo');
ok(await L.ev(() => document.getElementById('pn-obt-o2').offsetParent !== null), 'aperto si vede il testo da modificare');
await L.P.fill('#pn-obt-o2', 'Una sede più grande e accessibile'); await sleep(300);
await L.ev(() => pnRender()); await sleep(200);
ok(JSON.stringify(await stato()) === '["false:h","true:v","false:h"]', 'dopo una nuova disegnata dello schermo restano come li hai lasciati');
await L.P.click('text=Apri tutti'); await sleep(100); ok(JSON.stringify(await stato()) === '["true:v","true:v","true:v"]', '«Apri tutti»');
await L.P.click('text=Chiudi tutti'); await sleep(100); ok(JSON.stringify(await stato()) === '["false:h","false:h","false:h"]', '«Chiudi tutti»');
await L.P.click('text=+ Obiettivo'); await sleep(300);
ok(await L.ev(() => { const a = [...document.querySelectorAll('.pn-ob')].pop(); return !a.querySelector('.pn-ob-b').hidden && document.activeElement === a.querySelector('textarea'); }), 'un obiettivo nuovo è aperto e pronto da scrivere');
ok(await L.ev(() => { const g = document.querySelector('.pn-ob-tg'); return g.getAttribute('aria-controls') === g.closest('.pn-ob').querySelector('.pn-ob-b').id && g.getBoundingClientRect().height >= 40; }), 'il pulsante è collegato al riquadro ed è abbastanza grande da toccare');
await L.ev(() => pnObTutti(false)); await L.ev(() => pnVai('o3')); await sleep(600);
ok(await L.ev(() => !document.getElementById('pn-obb-o3').hidden), 'un link che porta a un obiettivo lo apre');
ok(await L.ev(() => document.querySelector('.pn-ob-h .pn-sel input') && document.querySelector('.pn-ob-h .pn-tools')), 'selezione e frecce restano accanto al titolo');

// ── 2. chi ha un'azione propria la trova aperta ──
const V = await mk('vera', {width:1280, height:900});
await V.ev(() => shGoHome()); await sleep(1000);
await V.P.click('#sh-piani .pn-row button'); await sleep(1500); await V.ev(() => { PN.sez = 'obi'; pnRender(); }); await sleep(300);
const vs = await V.ev(() => [PN.ruolo, clMyName(), [...document.querySelectorAll('.pn-ob')].map(a => a.querySelector('.pn-ob-b').hidden ? 'h' : 'v')]);
ok(JSON.stringify(vs[2]) === '["h","v","h","v"]', 'il collaboratore trova aperti solo l’obiettivo con la sua azione e quello vuoto ' + JSON.stringify(vs));

// ── 3. Senior in Servizio nell'elenco ──
await L.ev(() => pnShare()); await sleep(1200);
const el = await L.ev(() => [...document.querySelectorAll('#pn-el .pn-chk')].map(l => l.textContent.replace(/\s+/g, ' ').trim()));
ok(el.some(x => /Sara Senior/.test(x) && /Senior in Servizio/.test(x)), 'il Senior in Servizio compare nell’elenco del Gruppo (' + el.join(' | ') + ')');
ok(await L.ev(() => { const i = [...document.querySelectorAll('#pn-el input[type=checkbox]')].find(c => /Sara/.test(c.dataset.n)); return i && i.dataset.e === 'Senior in Servizio'; }), 'e porta l’etichetta «Senior in Servizio»');
ok(await L.ev(() => [...document.querySelectorAll('#pn-i-e option')].some(o => o.textContent === 'Senior in Servizio')), 'tra le etichette dell’invito per e-mail c’è «Senior in Servizio»');

// ── 4. nome, ruolo e Branca sulle carte degli altri ──
db.t.pee_piani_giri.push({id:'g1', piano_id:'p1', n:1, stato:'chiuso', ritmo:'standard', fase:'giro1', scadenza:null, creato_da:U.luca.id, created_at:'2026-11-24T10:00:00Z', chiuso_il:'2026-11-25T10:00:00Z', chiusura_tipo:'anticipata'});
const car = (id, k, nome, et, brn, t) => db.t.pee_piani_contributi.push({id, giro_id:'g1', piano_id:'p1', autore_id:U[k].id, autore_nome:nome, autore_etichetta:et, autore_branca:brn, tipo:'carte', consegnato:true, consegnato_il:'2026-11-25T09:00:00Z', created_at:'2026-11-25T09:00:00Z', updated_at:'2026-11-25T09:00:00Z', data:{v:1, a:{educativa:{v:t, c:'', p:t + ' proposta'}}}});
car('c1', 'ugo', 'Ugo Capo', 'Capo Unità', 'E', 'Dal Reparto'); car('c2', 'dino', 'Dino Commissario', 'Commissario di Sezione', '', 'Dalla Sezione'); car('c3', 'lia', 'Lia Lupetta', 'Capo Unità', 'L', 'Dal Branco'); car('c4', 'sara', 'Sara Senior', 'Senior in Servizio', 'R', 'Dal Clan');
car('c5', 'vera', 'Vera Vice', 'Vice Capo Gruppo', '', 'Dalla vice');
await L.ev(async () => { await giCarica(true); GI.vista = 'giro'; PN.sez = 'g-altre'; pnRender(); }); await sleep(900);
const chips = await L.ev(() => [...document.querySelectorAll('.gi-voce')].map(v => [v.querySelector('b').textContent, (v.querySelector('.gi-ch') || {}).textContent || '', (v.querySelector('.gi-ch') || {}).className || '']));
const g = n => chips.find(c => c[0] === n) || ['', '', ''];
ok(g('Ugo Capo')[1] === 'Capo Unità · Reparto' && /gi-br-E/.test(g('Ugo Capo')[2]), 'Capo Unità del Reparto: ruolo e Branca, con il colore della Branca');
ok(g('Lia Lupetta')[1] === 'Capo Unità · Branco' && /gi-br-L/.test(g('Lia Lupetta')[2]), 'Branco: colore del Branco');
ok(g('Sara Senior')[1] === 'Senior in Servizio · Compagnia' && /gi-br-R/.test(g('Sara Senior')[2]), 'Senior in Servizio: Compagnia, colore della Compagnia');
ok(g('Dino Commissario')[1] === 'Commissario di Sezione' && /gi-blu/.test(g('Dino Commissario')[2]), 'il Commissario ha l’etichetta blu');
ok(g('Vera Vice')[1] === 'Vice Capo Gruppo' && /gi-blu/.test(g('Vera Vice')[2]), 'il Capo Gruppo (anche vice) ha l’etichetta blu');
ok(chips.every(c => c[1].length > 3), 'ogni etichetta ha la parola, non solo il colore');
// il database non aggiornato: le carte restano leggibili, senza etichette
db.sqlRuoloCarte = false; db.t.pee_piani_contributi.forEach(c => { delete c.autore_etichetta; delete c.autore_branca; });
await L.ev(async () => { await giCarica(true); pnRender(); }); await sleep(500);
ok(await L.ev(() => document.querySelectorAll('.gi-voce').length >= 4 && !document.querySelector('.gi-ch')), 'senza l’aggiornamento del database le carte si leggono lo stesso (senza etichetta)');
const nerr = L.pa.errors.length + V.pa.errors.length; ok(nerr === 0, 'nessun errore di pagina (' + nerr + ')'); if(nerr) console.log([...L.pa.errors, ...V.pa.errors].slice(0, 3).join(' | ').slice(0, 400));
await br.close(); process.exit(summary() ? 1 : 0);
