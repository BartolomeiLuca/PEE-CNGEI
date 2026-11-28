// Prova dell'SQL «Chi vede lo staff della mia Unità» su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['cu', 'cu2', 'cg', 'cg2', 'altro', 'cuNoProj'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-2222-1111-1111-111111111111`; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  create table public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, dashboard jsonb default '{}'::jsonb);
  create function public.pee_norm(t text) returns text language sql immutable as $$ select translate(lower(regexp_replace(btrim(coalesce(t, '')), '\\s+', ' ', 'g')), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu') $$;
  create table public.pee_archivi (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, anno int not null, titolo text not null, meta jsonb not null default '{}'::jsonb, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id, anno, titolo));`);
for(const k of N) await db.query(`insert into auth.users(id, email) values ($1, $2)`, [U[k], k.toLowerCase() + '@x.it']);
for(const [k, r, sz, gr] of [['cu', 'cu', 'Pesaro', 'Pesaro 1'], ['cu2', 'cu', ' pesaro', 'pesaro 1'], ['cg', 'cg', 'Pesaro', 'Pesaro 1'], ['cg2', 'cg', 'Pesaro', 'Pesaro 2'], ['altro', 'cu', 'Fano', 'Fano 1'], ['cuNoProj', 'cu', 'Pesaro', 'Pesaro 1']]) await db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo) values ($1,$2,$3,'E',$4,$5)`, [U[k], 'Nome ' + k, r, sz, gr]);
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_staff_unita.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire' + (e2 ? ': ' + e2.message : ''));
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const proj = (k, anno, titolo, meta, tab) => db.query(`insert into pee_archivi(user_id, anno, titolo, meta, data) values ($1,$2,$3,$4,$5)`, [U[k], anno, titolo, JSON.stringify(meta), JSON.stringify({UNIT_NAME: meta.nome, scheda: {pp: {staffTab: tab}}})]);
const tab = [{ruolo: 'CU', nome: 'Ugo Uno', mail: 'ugo@x.it', tel: '333', prof: 'idraulico', car: 'segreto', form: 'FOR.A', disp: 'sempre'}, {ruolo: 'VCU', nome: 'Vera Vice', mail: 'vera@x.it; altra@x.it'}, {ruolo: 'SiS', nome: '', mail: ''}, {ruolo: 'CG', nome: 'Carla CG', mail: 'cg@x.it'}];
const AY = (() => { const d = new Date(); return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; })();
await proj('cu', AY, 'Reparto Aquile', {mode: 'giovani', nome: 'Reparto Aquile', fascia: 'E'}, tab);
await proj('cu', AY, 'Esempio di prova', {mode: 'giovani', nome: 'Esempio', fascia: 'E'}, [{ruolo: 'CU', nome: 'Finto'}]);
await proj('cu', AY, 'Nel cestino', {mode: 'giovani', nome: 'Cestinato', fascia: 'E', cest: {at: 1}}, [{ruolo: 'CU', nome: 'Cestinato'}]);
await proj('cu', AY, 'Anno intero', {mode: 'anno', nome: 'Anno', fascia: 'E'}, [{ruolo: 'CU', nome: 'Non Unità'}]);
await proj('cu', AY + 1, 'Reparto Aquile 2', {mode: 'giovani', nome: 'Reparto Aquile', fascia: 'E'}, [{ruolo: 'CU', nome: 'Ugo Prossimo', mail: 'ugo@x.it'}]);
await proj('cu2', AY, 'Branco', {mode: 'giovani', nome: 'Branco Lupi', fascia: 'L'}, []);
await proj('altro', AY, 'Compagnia', {mode: 'giovani', nome: 'Compagnia', fascia: 'R'}, [{ruolo: 'CC', nome: 'Altro Capo', mail: 'altro@x.it'}]);
const vis = async w => { const r = await as(w, 'select * from pee_staff_unita_visibili()'); return r.err ? {err: r.err} : r.rows; };

// ── senza consenso non si legge nulla ──
ok((await vis('cg')).length === 0, 'senza consenso il Capo Gruppo non legge nulla');
ok((await as('anon', 'select * from pee_staff_unita_visibili()')).err, 'anonimi: negato');
ok((await as('cg', 'select * from pee_staff_consensi')).err, 'la tabella dei consensi non si legge direttamente');
ok((await as('cg', `insert into pee_staff_consensi(owner_id, email) values ('${U.cg}', 'x@x.it')`)).err, 'la tabella dei consensi non si scrive direttamente');

// ── il Capo Unità autorizza ──
ok(!(await as('cu', `select pee_staff_consenso_imposta('  CG@x.it ', true)`)).err, 'il Capo Unità autorizza il Capo Gruppo (email con maiuscole e spazi)');
ok(!(await as('cu', `select pee_staff_consenso_imposta('cg@x.it', true)`)).err, 'ripetere non dà errore');
const lc = (await as('cu', 'select * from pee_staff_consenso_lista()')).rows;
ok(lc.length === 1 && lc[0].email === 'cg@x.it', 'la lista delle autorizzazioni date: una sola, normalizzata');
ok((await as('cg', 'select * from pee_staff_consenso_lista()')).rows.length === 0, 'chi riceve non vede quelle date da altri');
let v = await vis('cg');
ok(v.length === 1 && v[0].unita === 'Reparto Aquile' && v[0].fascia === 'E' && v[0].owner_nome === 'Nome cu' && v[0].owner_mail === 'cu@x.it', 'il Capo Gruppo legge l’Unità dell’anno in corso (non l’esempio, non il cestino, non «anno intero»)');
const st = v[0] ? v[0].staff : [];
ok(st.length === 3 && st.map(x => x.nome).join('|') === 'Ugo Uno|Vera Vice|Carla CG', 'staff: tre persone, la riga vuota è esclusa');
ok(st.every(x => Object.keys(x).sort().join() === 'mail,nome,ruolo'), 'staff: solo ruolo, nome ed email (niente telefono, professione, caratteristiche, formazione)');
ok(st[1].mail === 'vera@x.it', 'più email nella cella: solo la prima');
ok(!JSON.stringify(v).match(/333|idraulico|segreto|FOR\.A|sempre/), 'nessun dato personale oltre a nome, ruolo ed email');
ok((await vis('cg2')).length === 0 && (await vis('cu2')).length === 0, 'altre persone non leggono nulla');

// ── dura oltre l'anno ──
const v2 = (await as('cg', `select * from pee_staff_unita_visibili(${AY + 1})`)).rows;
ok(v2.length === 1 && v2[0].staff.length === 1 && v2[0].staff[0].nome === 'Ugo Prossimo', 'l’autorizzazione vale anche per l’anno dopo (nuovo progetto, stessa autorizzazione)');

// ── Unità senza progetto o con tabella vuota: lo dice ──
await as('cuNoProj', `select pee_staff_consenso_imposta('cg@x.it', true)`);
await as('cu2', `select pee_staff_consenso_imposta('cg@x.it', true)`);
v = await vis('cg');
const np = v.find(x => x.owner_nome === 'Nome cuNoProj'), vu = v.find(x => x.owner_nome === 'Nome cu2');
ok(np && np.unita === null && np.staff.length === 0, 'autorizzato ma senza progetto dell’anno: riga con unità nulla (per l’allerta)');
ok(vu && vu.unita === 'Branco Lupi' && vu.fascia === 'L' && vu.staff.length === 0, 'tabella vuota: Unità presente, staff vuoto (per l’allerta)');

// ── si toglie ──
ok(!(await as('cu', `select pee_staff_consenso_imposta('cg@x.it', false)`)).err, 'il Capo Unità toglie l’autorizzazione');
ok(!(await vis('cg')).some(x => x.owner_nome === 'Nome cu'), 'tolta: il Capo Gruppo non legge più');
ok((await vis('cg')).some(x => x.owner_nome === 'Nome cu2'), 'le autorizzazioni degli altri restano');
ok(!(await as('cu', `select pee_staff_consenso_imposta('cg@x.it', false)`)).err, 'togliere due volte non dà errore');

// ── chi ci si aspetta (allerta) ──
const atR = await as('cg', 'select * from pee_staff_unita_attese()'); if(atR.err) console.log('ERR', atR.err); let at = atR.rows || [];
ok(at.map(x => x.nome).join('|') === 'Nome cu|Nome cu2|Nome cuNoProj', 'il Capo Gruppo vede i Capi Unità del suo Gruppo (non quelli di altri Gruppi o Sezioni)');
ok(at.find(x => x.nome === 'Nome cu2').autorizzato === true && at.find(x => x.nome === 'Nome cu').autorizzato === false, 'e se lo hanno autorizzato');
ok(at.every(x => Object.keys(x).sort().join() === 'autorizzato,branca,nome,owner_id,ruolo'), 'solo nome, ruolo, Branca: niente email');
ok((await as('cu', 'select * from pee_staff_unita_attese()')).rows.length === 0, 'un Capo Unità non vede l’elenco');
ok((await as('cg2', 'select * from pee_staff_unita_attese()')).rows.length === 0, 'un altro Gruppo non vede nulla');
ok((await as('anon', 'select * from pee_staff_unita_attese()')).err, 'anonimi: negato');

// ── controlli ──
ok((await as('cu', `select pee_staff_consenso_imposta('nonemail', true)`)).err, 'email non valida: rifiutata');
ok((await as('cu', `select pee_staff_consenso_imposta('cu@x.it', true)`)).err, 'non si autorizza se stessi');
ok((await as('anon', `select pee_staff_consenso_imposta('cg@x.it', true)`)).err, 'anonimi: negato');
let lim = null; for(let i = 0; i < 11; i++){ const r = await as('altro', `select pee_staff_consenso_imposta('p${i}@x.it', true)`); if(r.err) lim = i; }
ok(lim === 10, 'massimo 10 autorizzazioni');
ok(!(await as('altro', `select pee_staff_consenso_imposta('p3@x.it', true)`)).err, 'ripetere una già data oltre il limite non dà errore');

console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
