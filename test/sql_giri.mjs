// Prova dell'SQL dei giri su Postgres vero (PGlite): accesso, carte cieche, anonimato, soglia, registro, ripetibilità.
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['luca','vice','a','b','c','d','lett','estr'];
const U = {}, MAIL = {};
N.forEach((k, i) => { U[k] = `${i+1}${i+1}${i+1}${i+1}${i+1}${i+1}${i+1}${i+1}-1111-1111-1111-111111111111`; MAIL[k] = k + '@x.it'; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now(), raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated, service_role;
  create table public.pee_archivi (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), titolo text default '', data jsonb default '{}'::jsonb);
  create table public.pee_membri (id uuid primary key default gen_random_uuid(), archivio_id uuid references public.pee_archivi(id) on delete cascade, email text, ruolo text default 'lettore');
  grant all on public.pee_archivi, public.pee_membri to authenticated, service_role;
  create or replace function public.pee_my_email() returns text language sql stable security definer set search_path = public, auth as $$
    select lower(email) from auth.users where id = auth.uid() and email_confirmed_at is not null $$;
  grant execute on function public.pee_my_email() to authenticated;
`);
for(const k of N) await db.query(`insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3)`, [U[k], MAIL[k], JSON.stringify({nome: 'Nome ' + k})]);
const sql1 = fs.readFileSync(new URL('../supabase_aggiornamento_23novembre_piani.sql', import.meta.url), 'utf8');
const sql2 = fs.readFileSync(new URL('../supabase_aggiornamento_24novembre_giri_piani.sql', import.meta.url), 'utf8');
await db.exec(sql1);
let e1 = null, e2 = null;
try { await db.exec(sql2); } catch(e){ e1 = e; }
ok(!e1, 'lo script dei giri gira a vuoto' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql2); } catch(e){ e2 = e; }
ok(!e2, 'si può rieseguire senza errori' + (e2 ? ': ' + e2.message : ''));

async function as(who, q, p = []){
  await db.exec(`set role authenticated`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [U[who]]);
  try { const r = await db.query(q, p); return {rows: r.rows}; }
  catch(e){ return {err: e.message}; }
  finally { await db.exec(`reset role`); await db.query(`select set_config('request.jwt.claim.sub', '', false)`); }
}
const nrows = async (who, q, p) => { const r = await as(who, q, p); return r.err ? -1 : r.rows.length; };

const pr = await as('luca', `insert into pee_piani(tipo, titolo, anno_inizio) values ('gruppo','PdG',2026) returning id`);
const P = pr.rows[0].id;
const inv = (m, r) => db.query(`insert into pee_piani_membri(piano_id, email, ruolo, nome, invitato_da) values ($1,$2,$3,$4,$5)`, [P, MAIL[m], r, 'Nome ' + m, U.luca]);
await inv('vice', 'cotitolare'); await inv('a', 'collaboratore'); await inv('b', 'collaboratore'); await inv('c', 'lettore'); await inv('d', 'lettore'); await inv('lett', 'lettore');

// ── apertura ──
ok((await as('lett', `select pee_piano_giro_apri($1,'standard','giro1',null)`, [P])).err !== undefined, 'un lettore non apre un giro');
ok((await as('estr', `select pee_piano_giro_apri($1,'standard','giro1',null)`, [P])).err !== undefined, 'un estraneo non apre un giro');
ok((await as('luca', `insert into pee_piani_giri(piano_id) values ($1)`, [P])).err !== undefined, 'nessuna scrittura diretta sui giri');
const g = await as('luca', `select pee_piano_giro_apri($1,'standard','giro1','2026-12-01') as id`, [P]);
ok(!g.err, 'il titolare apre il giro' + (g.err ? ': ' + g.err : ''));
const G = g.rows[0].id;
ok((await as('vice', `select pee_piano_giro_apri($1)`, [P])).err !== undefined, 'un solo giro aperto per piano');
ok(await nrows('c', `select id from pee_piani_giri`) === 1 && await nrows('estr', `select id from pee_piani_giri`) === 0, 'le persone del piano vedono il giro, gli estranei no');
ok(!(await as('vice', `select pee_piano_giro_scadenza($1,'2026-12-10')`, [G])).err, 'il co-titolare sposta la scadenza');
ok((await as('a', `select pee_piano_giro_scadenza($1,'2026-12-20')`, [G])).err !== undefined, 'un collaboratore non sposta la scadenza');

// ── carte con nome, «cieche» ──
const ins = (who, tipo, cons) => as(who, `insert into pee_piani_contributi(giro_id, tipo, data, consegnato) values ($1,$2,'{"x":1}',$3) returning id`, [G, tipo, cons]);
ok(!(await ins('a', 'carte', true)).err, 'un collaboratore consegna le sue carte');
ok((await ins('estr', 'carte', true)).err !== undefined, 'un estraneo non scrive');
ok(!(await ins('c', 'carte', false)).err, 'un lettore scrive e tiene una bozza');
ok((await ins('a', 'carte', true)).err !== undefined, 'una sola scheda per persona e tipo');
const nomeA = await db.query(`select autore_nome, consegnato_il is not null as dt from pee_piani_contributi where autore_id = $1`, [U.a]);
ok(nomeA.rows[0].autore_nome === 'Nome a' && nomeA.rows[0].dt, 'nome e ora di consegna messi dal database');
// 25/11: il nome sulle carte segue il profilo finché il giro è aperto
const sql3 = fs.readFileSync(new URL('../supabase_aggiornamento_25novembre_nome_autore.sql', import.meta.url), 'utf8');
{ let e3 = null, e4 = null; try { await db.exec(sql3); } catch(e){ e3 = e; } ok(!e3, 'lo script del nome autore gira' + (e3 ? ': ' + e3.message : '')); try { await db.exec(sql3); } catch(e){ e4 = e; } ok(!e4, 'e si può rieseguire');
  await db.query(`update auth.users set raw_user_meta_data = $2 where id = $1`, [U.a, JSON.stringify({nome: 'Nome nuovo'})]);
  await db.exec(sql3);
  const n1 = await db.query(`select autore_nome from pee_piani_contributi where autore_id = $1`, [U.a]); ok(n1.rows[0].autore_nome === 'Nome nuovo', 'lo script allinea i nomi dei giri aperti');
  await db.query(`update auth.users set raw_user_meta_data = $2 where id = $1`, [U.a, JSON.stringify({nome: 'Terzo nome'})]);
  await as('a', `update pee_piani_contributi set data = '{"x":2}' where autore_id = $1`, [U.a]);
  const n2 = await db.query(`select autore_nome from pee_piani_contributi where autore_id = $1`, [U.a]); ok(n2.rows[0].autore_nome === 'Terzo nome', 'se la persona risalva la carta il nome si aggiorna');
  await as('luca', `update pee_piani_contributi set data = '{"x":3}' where autore_id = $1`, [U.a]);
  const n3 = await db.query(`select autore_nome from pee_piani_contributi where autore_id = $1`, [U.a]); ok(n3.rows[0].autore_nome === 'Terzo nome', 'un\'altra persona non cambia il nome di chi ha scritto');
}
// 26/11: ruolo e Branca sulle carte, e i Senior in Servizio nell'elenco del Gruppo
{
  await db.exec(`create table if not exists public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, area_rcdf text, dashboard jsonb default '{}'::jsonb); grant all on public.pee_profili to authenticated;`);
  const PR = (k, ruolo, br, gr, dash) => db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo, dashboard) values ($1,$2,$3,$4,'Pesaro',$5,$6) on conflict (user_id) do update set ruolo = excluded.ruolo, branca = excluded.branca`, [U[k], 'Nome ' + k, ruolo, br, gr, JSON.stringify(dash || {})]);
  await PR('a', 'cu', 'E', 'Pesaro 1'); await PR('b', 'senior', 'R', 'Pesaro 1'); await PR('luca', 'cg', '', 'Pesaro 1');
  const sqlE = fs.readFileSync(new URL('../supabase_aggiornamento_25novembre_elenco_persone.sql', import.meta.url), 'utf8');
  const sql4 = fs.readFileSync(new URL('../supabase_aggiornamento_26novembre_senior_e_ruolo_carte.sql', import.meta.url), 'utf8');
  await db.exec(sqlE);
  let e5 = null, e6 = null; try { await db.exec(sql4); } catch(e){ e5 = e; } ok(!e5, 'lo script del 26 novembre gira' + (e5 ? ': ' + e5.message : '')); try { await db.exec(sql4); } catch(e){ e6 = e; } ok(!e6, 'e si può rieseguire');
  const r0 = await db.query(`select autore_etichetta e, autore_branca b from pee_piani_contributi where autore_id = $1 and tipo = 'carte'`, [U.a]);
  ok(r0.rows[0].e === 'Capo Unità' && r0.rows[0].b === 'E', 'lo script mette ruolo e Branca sulle carte già scritte');
  await db.query(`update pee_profili set ruolo = 'vcu', branca = 'R' where user_id = $1`, [U.a]);
  await as('luca', `update pee_piani_contributi set data = '{"x":9}' where autore_id = $1`, [U.a]);
  const r1 = await db.query(`select autore_etichetta e, autore_branca b from pee_piani_contributi where autore_id = $1 and tipo = 'carte'`, [U.a]);
  ok(r1.rows[0].e === 'Capo Unità' && r1.rows[0].b === 'E', 'un’altra persona non cambia ruolo e Branca di chi ha scritto');
  await as('a', `update pee_piani_contributi set data = '{"x":8}' where autore_id = $1`, [U.a]);
  const r2 = await db.query(`select autore_etichetta e, autore_branca b from pee_piani_contributi where autore_id = $1 and tipo = 'carte'`, [U.a]);
  ok(r2.rows[0].e === 'Vice Capo Unità' && r2.rows[0].b === 'R', 'se chi ha scritto risalva, ruolo e Branca seguono il profilo');
  await db.query(`update pee_profili set ruolo = 'cu', branca = 'E' where user_id = $1`, [U.a]);
  const f = await db.query(`select public.pee_etichetta_profilo('cos', '["Presidente"]'::jsonb) p, public.pee_etichetta_profilo('cos', '["commissario"]'::jsonb) c, public.pee_etichetta_profilo('cds', null) d, public.pee_etichetta_profilo('senior', null) s, public.pee_etichetta_profilo(null, null) n`);
  ok(f.rows[0].p === 'Presidente' && f.rows[0].c === 'Commissario di Sezione' && f.rows[0].d === 'Commissario di Sezione' && f.rows[0].s === 'Senior in Servizio' && f.rows[0].n === '', 'le etichette dei ruoli');
  const el = await as('luca', `select nome from pee_persone_elenco('gruppo')`);
  ok(!el.err && el.rows.some(x => x.nome === 'Nome b'), 'un Senior in Servizio compare nell’elenco del Gruppo' + (el.err ? ': ' + el.err : ''));
}
// 27/11: la Carta di Unità la consegna solo il Capo Unità, dalla programmazione; la legge chi coordina e il VCU della stessa Unità
{
  const sql5 = fs.readFileSync(new URL('../supabase_aggiornamento_27novembre_carta_di_unita.sql', import.meta.url), 'utf8');
  let e7 = null, e8 = null; try { await db.exec(sql5); } catch(e){ e7 = e; } ok(!e7, 'lo script del 27 novembre gira' + (e7 ? ': ' + e7.message : '')); try { await db.exec(sql5); } catch(e){ e8 = e; } ok(!e8, 'e si può rieseguire (27/11)');
  await db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo, dashboard) values ($1,'Nome c','vcu','R','Pesaro','Pesaro 1','{}') on conflict (user_id) do update set ruolo='vcu', branca='R'`, [U.c]);
}
const insU = (who, d) => as(who, `insert into pee_piani_contributi(giro_id, tipo, data, consegnato) values ($1,'unita',$2::jsonb,true) returning id`, [G, JSON.stringify(d)]);
const DU = {v:1, unita:'Reparto Aquile', fonte:'pee', s:{b1:'v', b3:'r'}, b:{b2a:'testo riservato'}, n:{tot:22}};
ok(await nrows('b', `select id from pee_piani_contributi`) === 0, 'chi non ha ancora consegnato non vede le carte degli altri');
ok(await nrows('luca', `select id from pee_piani_contributi`) === 0, 'neanche il titolare, finché non consegna');
ok(await nrows('c', `select id from pee_piani_contributi`) === 1, 'una bozza propria resta visibile a chi la scrive');
ok(!(await ins('b', 'carte', true)).err, 'b consegna');
ok(await nrows('b', `select id from pee_piani_contributi where consegnato`) === 2, 'dopo aver consegnato b vede le carte consegnate degli altri');
ok(await nrows('b', `select id from pee_piani_contributi where autore_id = $1`, [U.c]) === 0, 'ma non le bozze non consegnate');
ok(!(await as('c', `update pee_piani_contributi set data = '{"x":2}', consegnato = true where autore_id = $1`, [U.c])).err, 'c completa e consegna');
ok(await nrows('a', `select id from pee_piani_contributi where autore_id <> $1`, [U.a]) === 2, 'a vede quelle consegnate da b e c');
const x1 = await ins('vice', 'unita', true); ok(x1.err && /Capo Unità/.test(x1.err), 'chi non è Capo Unità non consegna la Carta di Unità: ' + (x1.err || '').slice(0, 60));
const x2 = await insU('b', DU); ok(x2.err && /Capo Unità/.test(x2.err), 'un Senior in Servizio non la consegna');
const x3 = await insU('c', DU); ok(x3.err && /Capo Unità/.test(x3.err), 'nemmeno il Vice Capo Unità');
const x4 = await insU('a', {v:1, unita:'Reparto Aquile', fonte:'libera', b:{b2a:'scritta a mano'}}); ok(x4.err && /programmazione/.test(x4.err), 'la Carta scritta nel vecchio modulo (non dalla programmazione) è rifiutata');
ok(!(await insU('a', DU)).err, 'il Capo Unità la consegna dalla programmazione');
ok((await as('a', `update pee_piani_contributi set data = '{"v":1,"fonte":"libera"}'::jsonb where autore_id = $1 and tipo = 'unita'`, [U.a])).err !== undefined, 'e non può trasformarla in una Carta scritta a mano');
ok(await nrows('b', `select id from pee_piani_contributi where tipo = 'unita'`) === 0, 'un’altra persona del piano non legge il testo della Carta di Unità');
const sb = await as('b', `select * from pee_giro_unita_semaforo($1)`, [G]); ok(!sb.err && sb.rows.length === 1 && sb.rows[0].unita === 'Reparto Aquile' && sb.rows[0].s.b3 === 'r' && !('b' in sb.rows[0]) && !JSON.stringify(sb.rows[0]).includes('riservato'), 'ma vede i segnali dell’Unità, senza testo' + (sb.err ? ': ' + sb.err : ''));
ok((await as('d', `select * from pee_giro_unita_semaforo($1)`, [G])).err !== undefined, 'chi non ha consegnato le sue carte non vede nemmeno i segnali');
ok((await as('estr', `select * from pee_giro_unita_semaforo($1)`, [G])).err !== undefined, 'un estraneo al piano nemmeno');
ok(await nrows('c', `select id from pee_piani_contributi where tipo = 'unita'`) === 0, 'il Vice Capo Unità di un’altra Branca non la legge');
await db.query(`update pee_profili set branca = 'E' where user_id = $1`, [U.c]);
ok(await nrows('c', `select id from pee_piani_contributi where tipo = 'unita'`) === 1, 'il Vice Capo Unità della stessa Unità la legge');
await db.query(`update pee_profili set gruppo = 'Pesaro 2' where user_id = $1`, [U.c]);
ok(await nrows('c', `select id from pee_piani_contributi where tipo = 'unita'`) === 0, 'non se è di un altro Gruppo');
await db.query(`update pee_profili set gruppo = 'Pesaro 1' where user_id = $1`, [U.c]);
ok(await nrows('d', `select id from pee_piani_contributi where tipo = 'unita'`) === 0, 'chi non ha consegnato non vede la Carta di Unità');
ok((await as('b', `update pee_piani_contributi set data = '{"hack":1}' where autore_id = $1`, [U.a])).rows?.length === 0 || (await db.query(`select data from pee_piani_contributi where autore_id=$1 and tipo='carte'`, [U.a])).rows[0].data.x === 1, 'nessuno modifica le carte altrui');
ok((await as('a', `delete from pee_piani_contributi where autore_id = $1 and tipo='carte' returning 1`, [U.a])).rows.length === 0, 'una carta consegnata non si cancella');

// ── Mazzo persona anonimo ──
const voci = JSON.stringify([{q:'p1', scelta:['piu'], testo:'mi aspettavo altro'}, {q:'p4', scelta:['tutor','cu']}, {q:'p8', testo:'una cosa che nessuno dice'}]);
ok(!(await as('a', `select pee_piano_giro_persona($1,$2::jsonb)`, [G, voci])).err, 'a risponde al Mazzo persona');
ok((await as('a', `select pee_piano_giro_persona($1,$2::jsonb)`, [G, voci])).err !== undefined, 'una persona risponde una volta sola');
ok((await as('estr', `select pee_piano_giro_persona($1,$2::jsonb)`, [G, voci])).err !== undefined, 'un estraneo non risponde');
ok((await as('b', `select pee_piano_giro_persona($1,'[{"q":"zz","testo":"x"}]'::jsonb)`, [G])).err !== undefined, 'domanda non prevista rifiutata');
ok(await nrows('b', `select id from pee_piani_giri_persona`) === 0, 'b non ha risposto e non vede chi ha risposto');
const cols = await db.query(`select column_name from information_schema.columns where table_name = 'pee_piani_voci_anonime'`);
ok(!cols.rows.some(r => /user|autore|email|nome|created|ora/i.test(r.column_name)), 'le risposte anonime non hanno nessun campo che identifichi o che dia l\'ora: ' + cols.rows.map(r => r.column_name).join(','));
ok((await as('luca', `insert into pee_piani_voci_anonime(giro_id, piano_id, q, testo) values ($1,$2,'p1','x')`, [G, P])).err !== undefined, 'nessuna scrittura diretta delle risposte anonime');
ok(await nrows('luca', `select id from pee_piani_voci_anonime`) === 0, 'giro aperto: nemmeno il titolare legge le risposte anonime');
for(const k of ['b','c']) await as(k, `select pee_piano_giro_persona($1,$2::jsonb)`, [G, voci]);

// ── stato, registro, chiusura ──
ok((await as('lett', `select * from pee_piano_giro_stato($1)`, [G])).err !== undefined, 'un lettore non vede chi ha consegnato');
const st = await as('luca', `select * from pee_piano_giro_stato($1)`, [G]);
ok(!st.err && st.rows.length === 7, 'il titolare vede le 7 persone del piano' + (st.err ? ': ' + st.err : ''));
ok(st.rows.find(r => r.email === MAIL.d).carte === false && st.rows.find(r => r.email === MAIL.a).carte === true, 'chi ha consegnato e chi no');
ok((await as('lett', `select pee_piano_giro_chiudi($1)`, [G])).err !== undefined, 'un lettore non chiude');
ok((await as('luca', `select pee_piano_giro_chiudi($1,'boh')`, [G])).err !== undefined, 'tipo di chiusura non valido rifiutato');
ok(await nrows('luca', `select giro_id from pee_piani_giri_registro`) === 0, 'il registro non esiste prima della chiusura');
ok(await nrows('luca', `select id from pee_piani_voci_anonime`) === 0, 'sotto soglia (3 risposte) nessuna lettura anche se chiuso — prima della chiusura');
ok(!(await as('vice', `select pee_piano_giro_chiudi($1,'anticipata')`, [G])).err, 'il co-titolare chiude il giro');
ok(await nrows('luca', `select id from pee_piani_voci_anonime`) === 0, 'giro chiuso ma solo 3 risposte: soglia di 4 non raggiunta, nessuna lettura');
const reg = await as('luca', `select data from pee_piani_giri_registro`);
const senza = reg.rows[0].data.senza_carte.map(x => x.email).sort();
ok(JSON.stringify(senza) === JSON.stringify([MAIL.d, MAIL.lett, MAIL.luca, MAIL.vice].sort()) , 'il registro elenca per nome chi non ha consegnato le carte: ' + senza.join(','));
ok(await nrows('lett', `select giro_id from pee_piani_giri_registro`) === 0 && await nrows('c', `select giro_id from pee_piani_giri_registro`) === 0, 'il registro non lo vede chi non coordina');
ok((await as('a', `update pee_piani_contributi set data='{"x":9}' where autore_id=$1 returning 1`, [U.a])).rows.length === 0, 'a giro chiuso le carte non si modificano');
ok((await as('d', `select pee_piano_giro_persona($1,$2::jsonb)`, [G, voci])).err !== undefined, 'a giro chiuso non si risponde più');
ok(await nrows('d', `select id from pee_piani_contributi where tipo='carte'`) === 3, 'a giro chiuso tutti vedono le carte consegnate');
ok(await nrows('luca', `select id from pee_piani_contributi where tipo='unita'`) === 1, 'chi coordina legge la Carta di Unità');
ok(await nrows('d', `select id from pee_piani_contributi where tipo='unita'`) === 0, 'chi non coordina non la legge nemmeno a Ascolto chiuso');
const sd = await as('d', `select * from pee_giro_unita_semaforo($1)`, [G]); ok(!sd.err && sd.rows.length === 1, 'ma a Ascolto chiuso vede i segnali delle Unità');

// ── soglia: secondo giro con 4 risposte ──
const g2 = await as('luca', `select pee_piano_giro_apri($1,'rapido','giro1',null) as id`, [P]);
const G2 = g2.rows[0].id;
for(const k of ['a','b','c','d']) await as(k, `select pee_piano_giro_persona($1,$2::jsonb)`, [G2, voci]);
await as('luca', `select pee_piano_giro_chiudi($1,'completa')`, [G2]);
const n = await nrows('luca', `select id from pee_piani_voci_anonime where giro_id = $1`, [G2]);
ok(n === 12, 'con 4 risposte e giro chiuso il titolare legge le voci (' + n + ')');
ok(await nrows('lett', `select id from pee_piani_voci_anonime where giro_id = $1`, [G2]) === 0, 'un lettore non le legge');
ok(await nrows('a', `select id from pee_piani_voci_anonime where giro_id = $1`, [G2]) === 0, 'un collaboratore non le legge');
ok(await nrows('luca', `select 1 from pee_piani_giri_persona`) === 7, 'chi coordina vede chi ha risposto (nomi), non cosa');
ok(await nrows('b', `select 1 from pee_piani_giri_persona`) === 2, 'ciascuno vede solo la propria partecipazione (uno per giro)');
// cancellare il piano porta via tutto
await as('luca', `delete from pee_piani where id = $1`, [P]);
const left = await db.query(`select (select count(*) from pee_piani_giri)::int g, (select count(*) from pee_piani_voci_anonime)::int v, (select count(*) from pee_piani_contributi)::int c`);
ok(left.rows[0].g === 0 && left.rows[0].v === 0 && left.rows[0].c === 0, 'eliminando il piano spariscono giri, carte e risposte');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
