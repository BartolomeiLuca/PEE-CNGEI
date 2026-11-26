// Prova dell'SQL «Progetto di Sezione letto dal Gruppo» su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'comm2', 'cg', 'vcg', 'cu', 'vol', 'altra', 'altraCg', 'nosez', 'noprof', 'spoof'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-1111-1111-1111-111111111111`; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  create table public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, dashboard jsonb default '{}'::jsonb);
  create table public.pee_piani (id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users(id), tipo text, titolo text default '', anno_inizio int, durata int default 3, stato text default 'bozza', data jsonb default '{}'::jsonb, updated_at timestamptz default now());
  alter table public.pee_piani enable row level security;
  grant all on public.pee_profili to authenticated; grant select on public.pee_piani to authenticated;
  create function public.pee_norm(t text) returns text language sql immutable as $$ select translate(lower(regexp_replace(btrim(coalesce(t, '')), '\\s+', ' ', 'g')), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu') $$;`);
for(const k of N) await db.query(`insert into auth.users(id, email) values ($1, $2)`, [U[k], k + '@x.it']);
const P = (k, ruolo, sez, gr) => db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo) values ($1,$2,$3,'E',$4,$5)`, [U[k], k, ruolo, sez, gr]);
await P('comm', 'cds', 'Pesaro', null); await P('comm2', 'cds', 'Fano', null); await P('cg', 'cg', ' pesaro ', 'Pesaro 1'); await P('vcg', 'vcg', 'Pesaro', 'Pesaro 1'); await P('cu', 'cu', 'Pesaro', 'Pesaro 1');
await P('vol', 'volontario', 'Pesaro', null); await P('altra', 'cds', 'Pesaro', null); await P('altraCg', 'cg', 'Fano', 'Fano 1'); await P('nosez', 'cg', '', 'X'); await P('spoof', 'cds', 'Fano', null);
const ob = (id, t, ind) => ({id, testo:t, aree:['educativa'], indirizzi:ind, ricadute:true, segreto:'NON DEVE USCIRE'});
const piano = (own, tipo, stato, anno, d) => db.query(`insert into pee_piani(owner_id, tipo, titolo, anno_inizio, stato, data) values ($1,$2,$3,$4,$5,$6)`, [U[own], tipo, 'Piano ' + tipo + ' ' + anno, anno, stato, JSON.stringify(d)]);
await piano('comm', 'sezione', 'deliberato', 2026, {sezione:'Fano', analisi:[{t:'riservato'}], azioni:[{testo:'azione riservata'}], obiettivi:[ob('o1', 'Più Capi formati', ['ps26:1.1']), ob('o2', 'Più famiglie', [])]});
await piano('comm', 'sezione', 'bozza', 2027, {obiettivi:[ob('o9', 'BOZZA non visibile', [])]});
await piano('comm', 'sezione', 'approvato', 2023, {obiettivi:[ob('v1', 'Vecchio triennio', [])]});
await piano('comm2', 'sezione', 'deliberato', 2026, {obiettivi:[ob('f1', 'Obiettivo di Fano', [])]});
await piano('comm', 'gruppo', 'deliberato', 2026, {obiettivi:[ob('g1', 'Piano di Gruppo non è un PdS', [])]});
await piano('spoof', 'sezione', 'deliberato', 2026, {sezione:'Pesaro', obiettivi:[ob('s1', 'Finto, dichiara Pesaro dentro il piano', [])]});
await piano('comm', 'sezione', 'deliberato', 2026, {obiettivi:'rotto'});
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_pds_alla_sezione.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire');
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : who === 'noprof' ? U.noprof : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const pds = async w => { const r = await as(w, `select * from pee_pds_della_mia_sezione()`); return r.err ? {err: r.err} : r.rows; };
let r = await pds('cg');
ok(Array.isArray(r) && r.length === 3, 'CG (Sezione scritta con maiuscole e spazi): vede i 3 Progetti deliberati/approvati di Pesaro, non la bozza');
ok(Array.isArray(r) && r[0].anno_inizio === 2026 && r.map(x => x.anno_inizio).join() === '2026,2026,2023', 'in ordine dal più recente');
const buono = r.find(x => x.obiettivi.length === 2);
ok(buono && buono.obiettivi[0].id === 'o1' && buono.obiettivi[0].testo === 'Più Capi formati' && JSON.stringify(buono.obiettivi[0].indirizzi) === '["ps26:1.1"]', 'obiettivi con id, testo, aree e indirizzi');
const js = JSON.stringify(r);
ok(!/riservat|NON DEVE USCIRE|BOZZA|Fano|spoof|azione|ricadute/i.test(js.replace('"sezione":"Pesaro"', '')), 'non esce nient’altro: né azioni, né analisi, né campi non richiesti, né bozze, né altre Sezioni');
ok(r.every(x => x.sezione === 'Pesaro') && !js.includes('Finto'), 'la Sezione è quella del profilo di chi possiede il piano: un piano che dichiara Pesaro ma è di un profilo di Fano non compare');
ok(Array.isArray(r) && r.some(x => Array.isArray(x.obiettivi) && x.obiettivi.length === 0), 'un piano con dati rotti dà elenco vuoto, non un errore');
for(const w of ['vcg', 'cu', 'comm']) ok(Array.isArray(await pds(w)), w + ': può leggere');
ok((await pds('vol')).err !== undefined, 'adulto in formazione: no');
ok((await pds('nosez')).err !== undefined, 'senza Sezione nel profilo: messaggio chiaro');
ok((await pds('noprof')).err !== undefined, 'senza profilo: no');
ok((await pds('anon')).err !== undefined, 'anonimo: no');
r = await pds('altraCg'); ok(Array.isArray(r) && r.length === 2 && r.every(x => x.sezione === 'Fano') && !JSON.stringify(r).includes('Più Capi'), 'CG di Fano: vede solo i Progetti dei profili di Fano (il suo e quello del profilo «spoof», che è di Fano), nulla di Pesaro');
const dir = await as('cg', `select count(*) n from pee_piani`); ok(dir.rows && Number(dir.rows[0].n) === 0, 'la lettura diretta della tabella continua a essere negata');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
