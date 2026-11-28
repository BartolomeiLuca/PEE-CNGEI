// Prova dell'SQL «Verbali» su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'vcomm', 'pres', 'tes', 'cg', 'vcg', 'cg2', 'cgFano', 'cu', 'cu2', 'sis', 'coord', 'snr', 'volC', 'volN', 'cosV', 'norole', 'noSez', 'cuSenzaGr', 'cuFano', 'coordGr'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-2222-1111-1111-111111111111`; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  create table public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, dashboard jsonb default '{}'::jsonb);
  grant all on public.pee_profili to authenticated;
  create function public.pee_norm(t text) returns text language sql immutable as $$ select translate(lower(regexp_replace(btrim(coalesce(t, '')), '\\s+', ' ', 'g')), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu') $$;`);
for(const k of N) await db.query(`insert into auth.users(id, email) values ($1, $2)`, [U[k], k.toLowerCase() + '@x.it']);
const P = (k, ruolo, sez, gr, dash) => db.query(`insert into pee_profili(user_id, nome, ruolo, sezione, gruppo, dashboard) values ($1,$2,$3,$4,$5,$6)`, [U[k], 'Nome ' + k, ruolo, sez, gr, JSON.stringify(dash || {})]);
await P('comm', 'cds', 'Pesaro', ''); await P('vcomm', 'vcds', 'Pesaro', ''); await P('pres', 'pres', ' pesaro ', ''); await P('tes', 'tes', 'Pesaro', '');
await P('cg', 'cg', 'Pesaro', 'Pesaro 1'); await P('vcg', 'vcg', 'Pesaro', 'Pesaro 1'); await P('cg2', 'cg', 'Pesaro', 'Pesaro 2'); await P('cgFano', 'cg', 'Fano', 'Fano 1');
await P('cu', 'cu', 'Pesaro', 'Pesaro 1'); await P('cu2', 'cu', 'Pesaro', 'Pesaro 2'); await P('sis', 'senior', 'Pesaro', 'Pesaro 1'); await P('coord', 'coords', 'Pesaro', '');
await P('snr', 'snr', 'Pesaro', ''); await P('volC', 'volontario', 'Pesaro', 'Pesaro 1', {cos:{membro:true}}); await P('volN', 'volontario', 'Pesaro', 'Pesaro 1');
await P('cosV', 'cos', 'Pesaro', ''); await P('norole', null, 'Pesaro', ''); await P('noSez', 'cg', '', 'X'); await P('cuSenzaGr', 'cu', 'Pesaro', ''); await P('cuFano', 'cu', 'Fano', 'Fano 1');
await db.exec(`
  create table public.pee_piani (id uuid primary key default gen_random_uuid(), owner_id uuid, tipo text, data jsonb default '{}'::jsonb);
  create table public.pee_piani_membri (id uuid primary key default gen_random_uuid(), piano_id uuid, email text, ruolo text);`);
const run = async f => { try { await db.exec(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8')); return null; } catch(e){ return e; } };
let e = await run('supabase_aggiornamento_28novembre_verbali.sql'); ok(!e, 'script verbali' + (e ? ': ' + e.message : ''));
e = await run('supabase_aggiornamento_28novembre_verbali_2.sql'); ok(!e, 'script verbali_2' + (e ? ': ' + e.message : ''));
e = await run('supabase_aggiornamento_28novembre_cos_da_tabella.sql'); ok(!e, 'script COS da tabella' + (e ? ': ' + e.message : ''));
e = await run('supabase_aggiornamento_28novembre_cos_da_tabella.sql'); ok(!e, 'si può rieseguire' + (e ? ': ' + e.message : ''));
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const ins = (who, tipo, extra) => { const x = Object.assign({tipo, titolo:'V ' + tipo + ' ' + who, data:'2027-03-10', stato:'condiviso'}, extra || {}); const k = Object.keys(x);
  return as(who, `insert into pee_verbali(${k.join(',')}) values (${k.map((_, i) => '$' + (i + 1)).join(',')}) returning id`, k.map(c => x[c])); };
const lista = async w => { const r = await as(w, `select * from pee_verbali_lista()`); return r.err ? {err: r.err} : r.rows.map(x => x.titolo).sort(); };
const piano = async (owner, cos, tipo) => (await db.query(`insert into pee_piani(owner_id, tipo, data) values ($1, $2, $3) returning id`, [U[owner], tipo || 'sezione', JSON.stringify({persone:{cos}})])).rows[0].id;

// ── scrivere il COS: solo Commissario e Presidente ──
for(const [chi, atteso] of [['comm', true], ['pres', true], ['tes', false], ['cosV', false], ['volC', false], ['vcomm', false], ['cg', false]]){
  const r = await ins(chi, 'cos', {titolo:'COS ' + chi}); ok(atteso ? !!(r.rows && r.rows.length) : !!r.err, chi + (atteso ? ': scrive' : ': NON scrive') + ' il verbale del COS' + (r.err ? ' · ' + r.err : ''));
}
await ins('comm', 'cos', {titolo:'COS riservato'}); await ins('pres', 'cos', {titolo:'COS aperto', sez:true}); await ins('comm', 'cos', {titolo:'COS bozza', stato:'bozza'});
// ── transizione: nessuna tabella COS → vale ancora la spunta del profilo ──
let r = await lista('volC'); ok(r.includes('COS riservato') && r.includes('COS aperto'), 'senza tabella COS: la spunta del profilo vale ancora · ' + JSON.stringify(r));
r = await lista('volN'); ok(!r.includes('COS riservato') && r.includes('COS aperto'), 'senza tabella: chi non ha spunta legge solo i verbali «aperti alla Sezione»');
// ── il Commissario compila la tabella COS ──
const pid = await piano('comm', [{id:'a', nome:'Gia Rossi', ruolo:'Consigliere', mail:' CU2@x.it '}, {id:'b', nome:'Tina', mail:'tes@x.it'}, {id:'c', nome:'Senza mail', mail:''}]);
r = await lista('cu2'); ok(r.includes('COS riservato') && r.includes('COS aperto') && !r.includes('COS bozza'), 'chi è nella tabella (email con maiuscole e spazi) legge il COS, non le bozze · ' + JSON.stringify(r));
r = await lista('cu'); ok(!r.includes('COS riservato') && r.includes('COS aperto'), 'chi non è nella tabella non legge il COS riservato');
r = await lista('volC'); ok(!r.includes('COS riservato'), 'con la tabella compilata la spunta del profilo NON vale più');
r = await lista('tes'); ok(r.includes('COS riservato'), 'Tesoriere: legge (per ruolo)');
r = await lista('cosV'); ok(r.includes('COS riservato'), 'ruolo «membro COS»: legge (per ruolo)');
const w = await ins('cu2', 'cos', {titolo:'Tentativo'}); ok(!!w.err, 'chi è nella tabella legge soltanto: non scrive');
// ── Sezione diversa: stessa email in un piano di un\'altra Sezione non dà accesso ──
await db.query(`delete from pee_piani`);
await piano('cgFano', [{id:'x', mail:'cu2@x.it'}]); r = await lista('cu2'); ok(!r.includes('COS riservato'), 'piano di un Capo Gruppo (non Commissario/Presidente): non dà accesso');
await piano('comm', [{id:'x', mail:'cu2@x.it'}], 'gruppo'); r = await lista('cu2'); ok(!r.includes('COS riservato'), 'un Piano di Gruppo non vale: serve il Progetto di Sezione');
await db.query(`delete from pee_piani`);
// l'utente cu (Pesaro) si scrive in un piano proprio: nessun accesso
await piano('cu', [{id:'x', mail:'cu@x.it'}]); r = await lista('cu'); ok(!r.includes('COS riservato'), 'chi si scrive da solo in un piano proprio non ottiene nulla');
await db.query(`delete from pee_piani`);
// Commissario di Fano: piano valido per Fano, non per Pesaro
// ── Presidente (co-titolare di un piano del Commissario) ──
const pid2 = await piano('comm', [{id:'x', mail:'cu2@x.it'}]);
r = await lista('cu2'); ok(r.includes('COS riservato'), 'Progetto di Sezione del Commissario: vale');
await db.query(`delete from pee_piani`);
const pid3 = await piano('cu', [{id:'x', mail:'cu2@x.it'}]); await db.query(`insert into pee_piani_membri(piano_id, email, ruolo) values ($1, 'pres@x.it', 'cotitolare')`, [pid3]);
r = await lista('cu2'); ok(!r.includes('COS riservato'), 'piano di un Capo Unità con il Presidente invitato co-titolare: NON vale (conta il titolare)');
await db.query(`delete from pee_piani`); await piano('pres', [{id:'x', mail:'cu2@x.it'}]);
r = await lista('cu2'); ok(r.includes('COS riservato'), 'Progetto di Sezione del Presidente: vale');
// ── dati strani nella tabella ──
await db.query(`delete from pee_piani`); await db.query(`insert into pee_piani(owner_id, tipo, data) values ($1, 'sezione', '{"persone":{"cos":"boh"}}'), ($1, 'sezione', '{"persone":{"cos":[1,null,"x",{"mail":5}]}}'), ($1, 'sezione', '{}')`, [U.comm]);
r = await lista('cu2'); ok(!r.err && !r.includes('COS riservato'), 'tabella con dati strani: nessun errore, nessun accesso · ' + JSON.stringify(r));
const an = await as('anon', `select pee_cos_da_tabella('pesaro')`); ok(!!an.err, 'anonimo: niente');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
