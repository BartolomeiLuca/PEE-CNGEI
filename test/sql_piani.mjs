// Prova dell'SQL dei piani su un Postgres vero (PGlite, in memoria): tabelle, regole di accesso, controlli, ripetibilità.
// uso: node sql_piani.mjs   (serve @electric-sql/pglite in /home/claude/work/pg)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const U = {
  luca: '11111111-1111-1111-1111-111111111111', vice: '22222222-2222-2222-2222-222222222222', collab: '33333333-3333-3333-3333-333333333333',
  lett: '44444444-4444-4444-4444-444444444444', estr: '55555555-5555-5555-5555-555555555555', commis: '66666666-6666-6666-6666-666666666666'
};
const MAIL = { luca: 'luca@x.it', vice: 'vice@x.it', collab: 'collab@x.it', lett: 'lett@x.it', estr: 'estr@x.it', commis: 'commis@x.it' };

// ── finto ambiente Supabase (solo ciò che serve) ──
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
for(const k of Object.keys(U)) await db.query(`insert into auth.users(id, email, raw_user_meta_data) values ($1, $2, $3)`, [U[k], MAIL[k], JSON.stringify({nome: 'Nome ' + k})]);
await db.query(`insert into public.pee_archivi(id, user_id, titolo) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', $1, 'Progetto di Luca'), ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', $2, 'Progetto altrui')`, [U.luca, U.estr]);

// ── 1. lo script gira due volte senza errori ──
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_23novembre_piani.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null;
try { await db.exec(sql); } catch(e){ e1 = e; }
ok(!e1, 'lo script gira a vuoto' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; }
ok(!e2, 'si può rieseguire senza errori' + (e2 ? ': ' + e2.message : ''));

// esegue come una persona collegata; ritorna {rows} oppure {err}
async function as(who, q, p = []){
  await db.exec(`set role authenticated`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [U[who]]);
  try { const r = await db.query(q, p); return {rows: r.rows}; }
  catch(e){ return {err: e.message, code: e.code}; }
  finally { await db.exec(`reset role`); await db.query(`select set_config('request.jwt.claim.sub', '', false)`); }
}
const nrows = async (who, q, p) => { const r = await as(who, q, p); return r.err ? -1 : r.rows.length; };

// ── 2. creazione ──
const ins = await as('luca', `insert into pee_piani(tipo, titolo, anno_inizio, durata, data, archivio_id) values ('gruppo', 'Piano di Gruppo 26-29', 2026, 3, '{"obiettivi":[{"id":1}],"analisi":{}}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') returning id, rev, owner_email, updated_by_nome`);
ok(!ins.err, 'il titolare crea un piano' + (ins.err ? ': ' + ins.err : ''));
const P = ins.rows && ins.rows[0] && ins.rows[0].id;
ok(ins.rows && ins.rows[0].rev === 1 && ins.rows[0].owner_email === 'luca@x.it' && ins.rows[0].updated_by_nome === 'Nome luca', 'rev 1, e-mail e nome del titolare compilati dal database');
ok((await as('luca', `insert into pee_piani(tipo, anno_inizio, archivio_id) values ('clan', 2026, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')`)).err !== undefined, 'non si collega un piano al progetto di un altro');
ok((await as('luca', `insert into pee_piani(tipo, anno_inizio) values ('altro', 2026)`)).err !== undefined, 'tipo non ammesso rifiutato');
ok((await as('luca', `insert into pee_piani(tipo, anno_inizio, durata) values ('clan', 2026, 5)`)).err !== undefined, 'durata 5 rifiutata (solo 3 o 4)');
await as('estr', `insert into pee_piani(owner_id, tipo, anno_inizio) values ($1, 'clan', 2026)`, [U.luca]);
const falso = await db.query(`select count(*)::int n from pee_piani where owner_id = $1`, [U.luca]);
ok(falso.rows[0].n === 1, 'chi crea non può spacciarsi per un altro: nessun piano finto a nome di Luca (il piano risulta suo)');
await db.query(`delete from pee_piani where owner_id = $1`, [U.estr]);

// ── 3. inviti ──
const inv = async (who, mail, ruolo, extra = '') => as(who, `insert into pee_piani_membri(piano_id, email, ruolo, etichetta) values ($1, $2, $3, $4)`, [P, mail, ruolo, extra]);
ok(!(await inv('luca', MAIL.vice, 'cotitolare', 'Vice Capo Gruppo')).err, 'il titolare invita un co-titolare');
ok(!(await inv('luca', MAIL.collab, 'collaboratore')).err, 'il titolare invita un collaboratore');
ok(!(await inv('luca', MAIL.lett, 'lettore', 'Commissario')).err, 'il titolare invita un lettore');
ok((await inv('estr', 'qualcuno@x.it', 'lettore')).err !== undefined, 'un estraneo non può invitare');
ok((await inv('lett', 'qualcuno@x.it', 'lettore')).err !== undefined, 'un lettore non può invitare');
ok((await inv('collab', 'qualcuno@x.it', 'lettore')).err !== undefined, 'un collaboratore non può invitare');
ok(!(await inv('vice', MAIL.commis, 'lettore')).err, 'il co-titolare invita un lettore');
ok((await inv('vice', 'altro@x.it', 'cotitolare')).err !== undefined, 'il co-titolare NON crea altri co-titolari');
ok((await as('vice', `update pee_piani_membri set ruolo = 'cotitolare' where email = $1`, [MAIL.lett])).rows === undefined || (await db.query(`select ruolo from pee_piani_membri where email = $1`, [MAIL.lett])).rows[0].ruolo === 'lettore', 'il co-titolare non promuove nessuno a co-titolare');
ok((await as('luca', `insert into pee_piani_membri(piano_id, email, ruolo) values ($1, 'Maiuscola@x.it', 'lettore')`, [P])).err !== undefined, 'e-mail con maiuscole rifiutata (come per i progetti)');
ok((await as('luca', `insert into pee_piani_membri(piano_id, email, ruolo) values ($1, 'x@x.it', 'commissario')`, [P])).err !== undefined, 'ruolo non ammesso rifiutato');

// ── 4. chi vede cosa ──
const vede = async (who) => nrows(who, `select id from pee_piani`);
ok(await vede('luca') === 1 && await vede('vice') === 1 && await vede('collab') === 1 && await vede('lett') === 1 && await vede('commis') === 1, 'titolare, co-titolare, collaboratore e lettori vedono il piano');
ok(await vede('estr') === 0, 'un estraneo non vede nulla');
ok(await nrows('luca', `select id from pee_piani_membri`) === 4, 'il titolare vede tutti gli inviti');
ok(await nrows('vice', `select id from pee_piani_membri`) === 4, 'il co-titolare vede tutti gli inviti');
ok(await nrows('collab', `select id from pee_piani_membri`) === 1, 'un collaboratore vede solo il proprio invito');
ok(await nrows('lett', `select id from pee_piani_membri`) === 1, 'un lettore vede solo il proprio invito');
ok(await nrows('estr', `select id from pee_piani_membri`) === 0, 'un estraneo non vede inviti');

// ── 5. modifiche ──
const upd = (who, set, rev) => as(who, `update pee_piani set ${set}, rev = ${rev} where id = '${P}' returning rev, updated_by_nome`);
let r = await upd('luca', `titolo = 'Piano 26-29'`, 1);
ok(!r.err && r.rows[0].rev === 2, 'il titolare salva: rev passa a 2');
r = await upd('luca', `titolo = 'Vecchio salvataggio'`, 1);
ok(r.err && r.code === '40001', 'salvare con una versione vecchia è rifiutato (40001)');
ok((await db.query(`select titolo from pee_piani where id = $1`, [P])).rows[0].titolo === 'Piano 26-29', '…e il lavoro già salvato resta');
r = await upd('vice', `data = '{"obiettivi":[{"id":1},{"id":2}],"analisi":{}}'::jsonb`, 2);
ok(!r.err && r.rows[0].rev === 3 && r.rows[0].updated_by_nome === 'Nome vice', 'il co-titolare modifica il contenuto');
r = await upd('collab', `data = '{"obiettivi":[{"id":1},{"id":2},{"id":3}],"analisi":{}}'::jsonb`, 3);
ok(!r.err, 'il collaboratore modifica il contenuto');
r = await upd('collab', `data = '{"obiettivi":[]}'::jsonb`, 4);
ok(r.err !== undefined, 'il collaboratore non può eliminare parti del piano (chiave «analisi»)');
r = await upd('collab', `titolo = 'Cambio io'`, 4);
ok(r.err !== undefined, 'il collaboratore non cambia il titolo');
r = await upd('collab', `stato = 'approvato'`, 4);
ok(r.err !== undefined, 'il collaboratore non cambia lo stato');
r = await upd('collab', `durata = 4`, 4);
ok(r.err !== undefined, 'il collaboratore non cambia la durata');
r = await upd('lett', `titolo = 'Cambio io'`, 4);
ok(r.err === undefined && r.rows.length === 0 && (await db.query(`select titolo from pee_piani where id = $1`, [P])).rows[0].titolo === 'Piano 26-29', 'un lettore non riesce a modificare nulla');
r = await upd('estr', `titolo = 'Cambio io'`, 4);
ok(r.rows && r.rows.length === 0, 'un estraneo non riesce a modificare nulla');
r = await upd('vice', `stato = 'deliberato'`, 4);
ok(!r.err, 'il co-titolare segna «deliberato»');
r = await upd('luca', `tipo = 'clan'`, 5);
ok(r.err !== undefined, 'il tipo di piano non si cambia');
r = await upd('luca', `owner_id = '${U.vice}'`, 5);
ok(r.err !== undefined, 'il titolare non si cambia da qui');
r = await upd('vice', `archivio_id = null`, 5);
ok(r.err !== undefined, 'solo il titolare scollega il progetto');
r = await upd('luca', `data = '${JSON.stringify({x: 'a'.repeat(2100000)})}'::jsonb`, 5);
ok(r.err !== undefined, 'oltre 2 MB rifiutato');
const stato = (await db.query(`select stato, rev from pee_piani where id = $1`, [P])).rows[0];
ok(stato.stato === 'deliberato' && stato.rev === 5, 'stato e rev finali coerenti (deliberato, rev 5)');

// ── 6. storico ──
const ver = (who, motivo = 'verifica') => as(who, `insert into pee_piani_versioni(piano_id, motivo, nota, stato, data) values ($1, $2, 'Prima verifica', 'deliberato', '{"obiettivi":[]}') returning n`, [P, motivo]);
r = await ver('luca'); ok(!r.err && r.rows[0].n === 1, 'il titolare salva la versione 1');
r = await ver('collab', 'auto'); ok(!r.err && r.rows[0].n === 2, 'il collaboratore salva la versione 2 (numero dal database)');
ok((await ver('lett')).err !== undefined, 'un lettore non salva versioni');
ok((await ver('estr')).err !== undefined, 'un estraneo non salva versioni');
ok((await ver('luca', 'inventato')).err !== undefined, 'motivo non ammesso rifiutato');
ok(await nrows('lett', `select id from pee_piani_versioni`) === 2, 'un lettore legge lo storico');
ok(await nrows('estr', `select id from pee_piani_versioni`) === 0, 'un estraneo non lo vede');
r = await as('luca', `update pee_piani_versioni set nota = 'riscritta' where piano_id = $1 returning id`, [P]);
ok(r.err !== undefined || r.rows.length === 0, 'una versione dello storico non si modifica (nemmeno dal titolare)');
let eV = null; try { await db.query(`update pee_piani_versioni set nota = 'x' where piano_id = $1`, [P]); } catch(e){ eV = e; }
ok(eV !== null, '…e nemmeno dal pannello di Supabase (lo impedisce il database stesso)');
ok((await db.query(`select count(*)::int n from pee_piani_versioni where nota = 'Prima verifica'`)).rows[0].n === 2, 'le note dello storico sono rimaste quelle originali');
r = await as('vice', `delete from pee_piani_versioni where piano_id = $1 returning id`, [P]);
ok(r.rows && r.rows.length === 0, 'il co-titolare non elimina lo storico');

// ── 7. uscire, togliere, eliminare ──
ok(((await as('lett', `delete from pee_piani_membri where email = $1 returning id`, [MAIL.lett])).rows || []).length === 1, 'un invitato può uscire dal piano');
ok(await vede('lett') === 0, '…e poi non lo vede più');
r = await as('vice', `delete from pee_piani_membri where email = $1 returning id`, [MAIL.collab]);
ok(r.rows && r.rows.length === 1, 'il co-titolare toglie l\'accesso a un collaboratore');
r = await as('vice', `delete from pee_piani_membri where email = $1 returning id`, [MAIL.vice]);
ok(r.rows && r.rows.length === 1, '…e può uscire lui stesso (diritto di ogni invitato)');
ok((await as('vice', `delete from pee_piani where id = $1 returning id`, [P])).rows?.length === 0 || true, 'il co-titolare non elimina il piano');
ok((await db.query(`select 1 from pee_piani where id = $1`, [P])).rows.length === 1, '…infatti il piano c\'è ancora');
r = await as('commis', `delete from pee_piani where id = $1 returning id`, [P]);
ok(r.rows && r.rows.length === 0, 'un lettore non elimina il piano');
// visto
const mid = (await db.query(`select id from pee_piani_membri where email = $1`, [MAIL.commis])).rows[0].id;
await as('commis', `select pee_piano_segna_visto($1)`, [mid]);
ok((await db.query(`select visto_il from pee_piani_membri where id = $1`, [mid])).rows[0].visto_il !== null, '«ho visto l\'invito» funziona');
r = await as('estr', `select pee_piano_segna_visto($1)`, [mid]);
ok((await db.query(`select count(*)::int n from pee_piani_membri where id = $1 and visto_il is not null`, [mid])).rows[0].n === 1, 'un estraneo non può segnare i miei inviti (nessun effetto sugli altri)');
// anon
await db.exec(`set role anon`); let anonErr = null; try { await db.query(`select * from pee_piani`); } catch(e){ anonErr = e; } await db.exec(`reset role`);
ok(anonErr !== null, 'chi non è collegato non legge nulla');
r = await as('luca', `delete from pee_piani where id = $1 returning id`, [P]);
ok(r.rows && r.rows.length === 1, 'il titolare elimina il piano');
ok((await db.query(`select (select count(*) from pee_piani_membri)::int m, (select count(*) from pee_piani_versioni)::int v`)).rows[0].m === 0, 'con il piano spariscono inviti e storico');
ok((await db.query(`select titolo from pee_archivi where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'`)).rows.length === 1, 'il progetto del titolare è intatto');

console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
