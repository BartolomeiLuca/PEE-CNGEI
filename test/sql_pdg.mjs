// Prova dell'SQL «Porta dai Gruppi» (il Progetto di Sezione legge gli obiettivi dei Piani di Gruppo) su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'vcds', 'cosC', 'cosP', 'cg', 'cg2', 'cgFano', 'commFano', 'cu', 'nosez', 'noprof', 'cds_nosez'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-2222-1111-1111-111111111111`; });
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
const P = (k, ruolo, sez, gr, dash) => db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo, dashboard) values ($1,$2,$3,'E',$4,$5,$6)`, [U[k], k, ruolo, sez, gr, JSON.stringify(dash || {})]);
await P('comm', 'cds', 'Pesaro', null); await P('vcds', 'vcds', ' pesaro ', null); await P('cosC', 'cos', 'Pesaro', null, {cos:{incarichi:['Commissario']}}); await P('cosP', 'cos', 'Pesaro', null, {cos:{incarichi:['presidente']}});
await P('cg', 'cg', 'Pesaro', 'Pesaro 1'); await P('cg2', 'cg', 'Pesaro', 'Pesaro 2'); await P('cgFano', 'cg', 'Fano', 'Fano 1'); await P('commFano', 'cds', 'Fano', null); await P('cu', 'cu', 'Pesaro', 'Pesaro 1'); await P('nosez', 'cds', '', null);
const ob = (id, t, ind) => ({id, testo:t, aree:['educativa'], indirizzi:ind, ricadute:true, segreto:'NON DEVE USCIRE'});
const piano = (own, tipo, stato, anno, d) => db.query(`insert into pee_piani(owner_id, tipo, titolo, anno_inizio, stato, data) values ($1,$2,$3,$4,$5,$6)`, [U[own], tipo, 'Piano ' + tipo + ' ' + own, anno, stato, JSON.stringify(d)]);
await piano('cg', 'gruppo', 'bozza', 2026, {analisi:[{t:'riservato'}], azioni:[{testo:'azione riservata'}], giri:'ascolto riservato', obiettivi:[ob('g1', 'Più famiglie nel Gruppo', ['ps26:4.2']), ob('g2', 'Rinnovare la sede', []), ob('g3', '   ', [])]});
await piano('cg2', 'gruppo', 'deliberato', 2026, {obiettivi:[ob('h1', 'Formare i Capi Unità', [])]});
await piano('cgFano', 'gruppo', 'bozza', 2026, {obiettivi:[ob('f1', 'Obiettivo di un Gruppo di Fano', [])]});
await piano('comm', 'sezione', 'deliberato', 2026, {obiettivi:[ob('s1', 'Obiettivo di Sezione, non è un Piano di Gruppo', [])]});
await piano('cg', 'gruppo', 'bozza', 2027, {obiettivi:'rotto'});
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_pdg_alla_sezione.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire');
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : who === 'noprof' ? U.noprof : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const pdg = async w => { const r = await as(w, `select * from pee_pdg_della_mia_sezione()`); return r.err ? {err: r.err} : r.rows; };
let r = await pdg('comm');
ok(Array.isArray(r) && r.length === 3, 'Commissario: vede i 3 Piani di Gruppo di Pesaro (bozza e deliberati), non quelli di Fano né il Progetto di Sezione (' + (r.length) + ')');
ok(Array.isArray(r) && r.map(x => x.gruppo).sort().join('|') === 'Pesaro 1|Pesaro 1|Pesaro 2', 'con il Gruppo di chi possiede il piano');
const p1 = Array.isArray(r) && r.find(x => x.anno_inizio === 2026 && x.gruppo === 'Pesaro 1');
ok(p1 && p1.obiettivi.length === 2 && p1.obiettivi[0].id === 'g1' && JSON.stringify(p1.obiettivi[0].indirizzi) === '["ps26:4.2"]' && p1.stato === 'bozza', 'obiettivi con testo, aree e indirizzi, nell’ordine; quello senza testo non c’è');
ok(!/riservat|NON DEVE USCIRE|Fano|Sezione, non|ascolto|azione|ricadute/i.test(JSON.stringify(r)), 'non esce nient’altro: né azioni, né analisi, né Ascolto, né campi non richiesti, né altre Sezioni');
ok(Array.isArray(r) && r.some(x => x.obiettivi.length === 0), 'un piano con dati rotti dà elenco vuoto, non un errore');
for(const w of ['vcds', 'cosC']) ok(Array.isArray(await pdg(w)) && (await pdg(w)).length === 3, w + ': può leggere (Sezione scritta con maiuscole e spazi / incarico scritto «Commissario»)');
for(const w of ['cg', 'cu', 'cosP']) ok((await pdg(w)).err !== undefined, w + ': no');
ok((await pdg('nosez')).err !== undefined, 'Commissario senza Sezione nel profilo: messaggio chiaro');
ok((await pdg('noprof')).err !== undefined && (await pdg('anon')).err !== undefined, 'senza profilo e anonimo: no');
r = await pdg('commFano'); ok(Array.isArray(r) && r.length === 1 && r[0].obiettivi[0].id === 'f1', 'Commissario di Fano: solo il Gruppo di Fano');
const dir = await as('comm', `select count(*) n from pee_piani`); ok(dir.rows && Number(dir.rows[0].n) === 0, 'la lettura diretta della tabella continua a essere negata');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
