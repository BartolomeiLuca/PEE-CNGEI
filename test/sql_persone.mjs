// Prova dell'SQL dell'elenco persone su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['cg', 'vcg', 'cu1', 'cu2', 'cuAltro', 'cds', 'cosComm', 'cosPres', 'coords', 'altraSez', 'noprof', 'nomail', 'vcds'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-1111-1111-1111-111111111111`; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  create table public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, area_rcdf text, dashboard jsonb default '{}'::jsonb);
  grant all on public.pee_profili to authenticated;`);
for(const k of N) await db.query(`insert into auth.users(id, email, email_confirmed_at) values ($1, $2, $3)`, [U[k], k + '@X.it', k === 'nomail' ? null : new Date().toISOString()]);
const P = (k, nome, ruolo, sez, gr, dash) => db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo, dashboard) values ($1,$2,$3,'E',$4,$5,$6)`, [U[k], nome, ruolo, sez, gr, JSON.stringify(dash || {})]);
await P('cg', 'Carla CG', 'cg', 'Pesaro', 'Pesaro 1'); await P('vcg', 'Vera VCG', 'vcg', ' pesaro ', 'PESARO  1');
await P('cu1', 'Ugo CU', 'cu', 'Pesaro', 'Pesaro 1'); await P('cu2', 'Uma VCU', 'vcu', 'Pesaro', 'Pesaro 1'); await P('cuAltro', 'Otto CU altro Gruppo', 'cu', 'Pesaro', 'Pesaro 2');
await P('cds', 'Dino Commissario', 'cds', 'Pesaro', null); await P('cosComm', 'Cosimo Comm', 'cos', 'Pesaro', null, {cos:{incarichi:['Commissario']}}); await P('cosPres', 'Cora Presidente', 'cos', 'Pesaro', null, {cos:{incarichi:['Presidente']}});
await P('coords', 'Cora Senior', 'coords', 'Pesaro', null); await P('altraSez', 'Alba Altrove', 'cg', 'Fano', 'Fano 1'); await P('nomail', 'Nina NoMail', 'cu', 'Pesaro', 'Pesaro 1'); await P('vcds', 'Vito Vice', 'vcds', 'Pesaro', null);
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_25novembre_elenco_persone.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire');
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' || who === 'noprof' ? (who === 'noprof' ? U.noprof : '') : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const el = async (w, t) => { const r = await as(w, `select * from pee_persone_elenco($1)`, [t]); return r.err ? {err: r.err} : r.rows; };
const nomi = r => r.map(x => x.nome).sort().join('|');
let r = await el('cg', 'gruppo');
ok(Array.isArray(r) && nomi(r) === ['Cosimo Comm', 'Cora Presidente', 'Cora Senior', 'Dino Commissario', 'Ugo CU', 'Uma VCU', 'Vera VCG', 'Vito Vice'].sort().join('|'), 'CG: il proprio Gruppo (anche con maiuscole e spazi diversi) + figure di Sezione, non l’altro Gruppo, non l’altra Sezione, non chi non ha l’email confermata, non sé stesso → ' + (r.err || nomi(r)));
ok(Array.isArray(r) && r.find(x => x.nome === 'Ugo CU').email === 'cu1@x.it', 'email in minuscolo');
ok(Array.isArray(r) && JSON.stringify(r.find(x => x.nome === 'Cosimo Comm').incarichi) === '["Commissario"]', 'gli incarichi del Comitato arrivano');
ok((await el('vcg', 'gruppo')).length === 8 || nomi(await el('vcg', 'gruppo')).includes('Carla CG'), 'anche il Vice CG vede l’elenco');
r = await el('cds', 'sezione'); ok(Array.isArray(r) && nomi(r) === ['Carla CG', 'Cora Presidente', 'Cora Senior', 'Cosimo Comm', 'Vera VCG', 'Vito Vice'].sort().join('|'), 'Commissario: figure di Gruppo e di Sezione, senza Capi Unità → ' + (r.err || nomi(r)));
ok(Array.isArray(await el('cosComm', 'sezione')), 'un membro del Comitato con incarico Commissario vede l’elenco di Sezione');
ok((await el('cosPres', 'sezione')).err !== undefined, 'il Presidente no');
ok(Array.isArray(await el('vcds', 'sezione')), 'il Vice Commissario sì');
r = await el('coords', 'clan'); ok(Array.isArray(r) && nomi(r) === ['Carla CG', 'Cora Presidente', 'Cosimo Comm', 'Dino Commissario', 'Vera VCG', 'Vito Vice'].sort().join('|'), 'Coordinatore Senior: figure di Sezione e Capi Gruppo → ' + (r.err || nomi(r)));
ok((await el('cu1', 'gruppo')).err !== undefined && (await el('cu1', 'sezione')).err !== undefined && (await el('cu1', 'clan')).err !== undefined, 'un Capo Unità non vede nessun elenco');
ok((await el('cg', 'sezione')).err !== undefined && (await el('cg', 'clan')).err !== undefined, 'il CG non vede l’elenco di Sezione né del Clan');
ok((await el('coords', 'gruppo')).err !== undefined, 'il Coordinatore Senior non vede l’elenco di Gruppo');
ok((await el('cg', 'altro')).err !== undefined, 'tipo sconosciuto rifiutato');
ok((await el('noprof', 'gruppo')).err !== undefined, 'senza profilo nessun elenco');
ok((await el('anon', 'gruppo')).err !== undefined, 'senza accesso nessun elenco');
r = await el('altraSez', 'gruppo'); ok(Array.isArray(r) && r.length === 0, 'un’altra Sezione non vede nessuno di Pesaro');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
