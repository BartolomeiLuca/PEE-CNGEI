import { FakeDB, serve, launch, person, loginAs, sleep, ok, summary } from './harness.mjs';
// Parte 2 — testo ostile scritto da un'altra persona: archivio nazionale (schede, dettaglio), suggerimenti, ricerca
process.env.SITE = process.env.SITE || '/tmp/site_pre';
const base = (await serve()) + 'anteprima/'; const br = await launch('chromium');
const db = new FakeDB(); const u = db.addUser('anna@x.it', 'password123', 'Anna'); const o = db.addUser('olga@x.it', 'password123', 'Olga');
db.t.pee_profili.push({user_id:u.id, nome:'Anna', ruolo:'cu', branca:'E', sezione:'Pesaro', gruppo:'1', area_rcdf:'altoadriatico', dashboard:{}});
const E = n => `'"><img src=x onerror="(window.__x=window.__x||[]).push('${n}')">`;
const C = {}; ['lancio', 'sviluppo', 'conclusione', 'bene', 'migl', 'materiali', 'note'].forEach(k => C[k] = 'testo' + E('c-' + k));
const row = (id, st) => ({id, autore_id:o.id, stato:st, titolo:'Titolo' + E('titolo-' + id), branca:'E' + E('branca'), ambito:'P', perc_id:'P1', perc_nome:'Perc' + E('perc'), ptit:'Ptit' + E('ptit'), obiettivi:['Ob' + E('ob')], idr:['Idr' + E('idr')], tipi:['Tipo' + E('tipo')], sede:'Sede' + E('sede'), durata_min:30, funzionato:'si', autore_nome:'Olga' + E('autore'), contenuto:C, created_at:'2026-10-28T10:00:00Z'});
db.t.pee_archivio_nazionale.push(row('n1', 'approvata'), row('n2', 'in_attesa'));
db.t.pee_archivi.push({id:'k1', user_id:u.id, anno:2026, titolo:'Prova', meta:{mode:'giovani', fascia:'E'}, data:{v:1, MODE:'giovani', FASCIA:'E', UNIT_NAME:'X', obs:{}, pris:{}, scheda:{pp:{}}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
db.t.pee_membri.push({id:'m1', archivio_id:'k1', owner_id:u.id, owner_email:'Anna (anna@x.it)', email:'olga@x.it', ruolo:'collaboratore', created_at:'2026-10-27T10:00:00Z'});
db.t.pee_suggerimenti.push({id:'s1', archivio_id:'k1', user_id:o.id, autore_nome:'Olga' + E('sugg-autore'), percorso:'P1' + E('sugg-perc'), testo:'Consiglio' + E('sugg-testo'), stato:'nuovo', created_at:'2026-10-28T10:00:00Z'});
const pa = await person(br, db); const P = pa.page; await loginAs(P, base, u); await sleep(1500);
await P.evaluate(() => shOpen('k1', 0)); await sleep(4000);
const seen = new Set(); const grab = async w => { const x = await P.evaluate(() => { const a = window.__x || []; window.__x = []; return a; }).catch(() => []); x.forEach(n => { if(!seen.has(n)){ seen.add(n); console.log('  ✗ eseguito: ' + n + '  ← ' + w); } }); };
await P.evaluate(() => anOpen('arch')).catch(() => {}); await sleep(3000); await grab('anOpen'); console.log('schede mostrate: ' + await P.evaluate(() => document.querySelectorAll('.an-card').length) + ', tab: ' + await P.evaluate(() => AN.tab));
for(const t of ['pen', 'an', 'mine']){ console.log('  tab ' + t + ': schede ' + await P.evaluate(t => { try{ AN.tab = t; anRender(); anList(); }catch(e){} return document.querySelectorAll('.an-card').length; }, t).catch(() => '?')); await P.evaluate(t => { try{ AN.tab = t; anRender(); }catch(e){} try{ anList(); }catch(e){} }, t).catch(() => {}); await sleep(600); await grab('tab ' + t); }
for(const i of [0, 1]){ await P.evaluate(i => { try{ AN.tab = 'an'; anRender(); anList(); const r = AN_CUR[i]; if(r){ AN.det = r; anRender(); } }catch(e){} return document.getElementById('an-ov').innerHTML.includes('src="x"') ? 'img' : 'ok'; }, i).then(v => console.log('  dettaglio ' + i + ': ' + v)).catch(() => {}); await sleep(600); await grab('dettaglio ' + i); }
await P.evaluate(() => { try{ anClose(); }catch(e){} try{ sgLoad(); }catch(e){} try{ shSearch(); }catch(e){} }).catch(() => {}); await sleep(2000); await grab('suggerimenti/cerca');
await P.evaluate(() => { try{ shSearchRun('Titolo'); }catch(e){} }).catch(() => {}); await sleep(1500); await grab('cerca');
for(const f of ["sgToggle()", "clShow('share')", "clShow('archive')"]){ await P.evaluate(f => { try{ (0, eval)(f); }catch(e){} }, f).catch(() => {}); await sleep(900); await grab(f); }
console.log('tab visti, esecuzioni: ' + seen.size + '; errori JS: ' + pa.errors.length + ' ' + pa.errors.slice(0, 2).map(e => e.split('\n')[0].slice(0, 120)).join(' | '));
console.log('righe archivio nazionale lette: ' + await P.evaluate(() => (typeof AN !== 'undefined' && AN.st) + ' / ' + (typeof AN_CUR !== 'undefined' ? AN_CUR.length : '?')));
ok(seen.size === 0, 'nessun testo dell’archivio nazionale o dei suggerimenti viene eseguito come HTML (eseguiti: ' + seen.size + ')');
ok(await P.evaluate(() => AN_CUR.length) >= 0 && pa.errors.length === 0, 'nessun errore JS');
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
