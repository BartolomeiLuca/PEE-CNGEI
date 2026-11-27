// Prova dell'SQL «Clan e Gruppi» (richieste dei Gruppi al Clan; Progetto di Clan letto dal Commissario) su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'vcds', 'cosC', 'cosP', 'cg', 'cg2', 'cgFano', 'commFano', 'cu', 'nosez', 'noprof', 'coord', 'coordFano', 'coordNoSez', 'senior'];
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
await P('cg', 'cg', 'Pesaro', 'Pesaro 1'); await P('cg2', 'cg', 'Pesaro', 'Pesaro 2'); await P('cgFano', 'cg', 'Fano', 'Fano 1'); await P('commFano', 'cds', 'Fano', null); await P('cu', 'cu', 'Pesaro', 'Pesaro 1'); await P('nosez', 'cds', '', null); await P('coord', 'coords', 'Pesaro', null); await P('coordFano', 'coords', 'Fano', null); await P('coordNoSez', 'coords', '', null); await P('senior', 'senior', 'Pesaro', null);

const az = (id, ob, t, chi, x) => Object.assign({id, ob, testo:t, inizio:2, mese:'2027-06', stato:'in_corso', chi, genitori:false, ref:'NOME RISERVATO', indicatore:'INDICATORE RISERVATO'}, x || {});
const piano = (own, tipo, stato, anno, d) => db.query(`insert into pee_piani(owner_id, tipo, titolo, anno_inizio, stato, data) values ($1,$2,$3,$4,$5,$6)`, [U[own], tipo, 'Piano ' + tipo + ' ' + own, anno, stato, JSON.stringify(d)]);
await piano('cg', 'gruppo', 'bozza', 2026, {analisi:[{t:'riservato'}], giri:'ascolto riservato', obiettivi:[{id:'g1', testo:'Campi estivi per tutte le Unità'}, {id:'g2', testo:'Rinnovare la sede'}],
  azioni:[az('a1', 'g1', 'Quattro persone per il campo di Lupetti', ['cdg', 'clan'], {genitori:true}), az('a2', 'g1', 'Verificare il materiale', ['cg']), az('a3', 'g2', '   ', ['clan']), az('a4', 'g2', 'Aiuto per il trasloco', ['clan'], {inizio:'x'})]});
await piano('cg2', 'gruppo', 'deliberato', 2026, {obiettivi:[{id:'h1', testo:'Formare i Capi Unità'}], azioni:[az('b1', 'h1', 'Un Senior al Consiglio di Unità', ['clan'])]});
await piano('cg2', 'gruppo', 'bozza', 2027, {obiettivi:'rotto', azioni:'rotto'});
await piano('cgFano', 'gruppo', 'bozza', 2026, {obiettivi:[{id:'f1', testo:'Obiettivo di Fano'}], azioni:[az('c1', 'f1', 'Richiesta di Fano', ['clan'])]});
await piano('cg', 'gruppo', 'bozza', 2025, {azioni:[az('d1', 'zz', 'Nessuna richiesta qui', ['unita'])]});
const ob = (id, t, ind) => ({id, testo:t, aree:['educativa'], indirizzi:ind, segreto:'NON DEVE USCIRE'});
await piano('coord', 'clan', 'bozza', 2026, {analisi:[{titolo:'Valutazioni sul Clan RISERVATE'}], azioni:[{testo:'azione del Clan'}], obiettivi:[ob('c1', 'Accogliere nuovi Senior', ['ps26:4.2']), ob('c2', '  ', []), ob('c3', 'Il Clan al servizio dei Gruppi', [])],
  disp:[{id:'d1', cosa:'Persone per i campi estivi', quanti:'6', quando:'luglio', note:'Solo in forma aggregata', nome:'NOME SECRETO'}, {id:'d2', cosa:'  ', quanti:'3'}, {id:'d3', cosa:'Aiuto in sede', quanti:'', quando:'', note:''}]});
await piano('coordFano', 'clan', 'deliberato', 2026, {obiettivi:[ob('x1', 'Clan di Fano', [])]});
await piano('comm', 'sezione', 'deliberato', 2026, {obiettivi:[ob('s1', 'Progetto di Sezione, non è un Clan', [])]});
await piano('coord', 'clan', 'deliberato', 2027, {obiettivi:'rotto', disp:'rotto'});
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_clan_e_gruppi.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire');
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : who === 'noprof' ? U.noprof : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const ric = async w => { const r = await as(w, `select * from pee_richieste_al_clan()`); return r.err ? {err: r.err} : r.rows; };
const pdc = async w => { const r = await as(w, `select * from pee_pdc_della_mia_sezione()`); return r.err ? {err: r.err} : r.rows; };
// ── richieste al Clan ──
let r = await ric('coord');
ok(Array.isArray(r) && r.length === 2, 'Coordinatore Senior: i Piani di Gruppo di Pesaro con richieste al Clan sono 2 (non Fano, non il piano senza richieste né quello rotto) (' + (r.length) + ')');
const p1 = Array.isArray(r) && r.find(x => x.gruppo === 'Pesaro 1');
ok(p1 && p1.richieste.length === 2 && p1.richieste[0].id === 'a1' && p1.richieste[0].genitori === true && p1.richieste[0].obiettivo === 'Campi estivi per tutte le Unità' && p1.richieste[0].inizio === 2 && p1.richieste[0].mese === '2027-06' && p1.richieste[0].stato === 'in_corso', 'azione con testo, obiettivo, inizio, mese, stato, genitori');
ok(p1 && p1.richieste[1].id === 'a4' && p1.richieste[1].inizio === 1 && p1.richieste[1].genitori === false, 'un inizio non valido diventa anno 1; l’azione senza testo e quella senza «Clan» non ci sono');
ok(!/RISERVAT|riservat|SECRETO|Fano|ascolto|Verificare il materiale|nessuna richiesta/i.test(JSON.stringify(r)), 'non esce nient’altro: né referente, né indicatore, né analisi, né Ascolto, né altre Sezioni');
for(const w of ['comm', 'cg', 'cu', 'senior', 'cosC']) ok((await ric(w)).err !== undefined, w + ': no, solo il Coordinatore Senior');
ok((await ric('coordNoSez')).err !== undefined && (await ric('noprof')).err !== undefined && (await ric('anon')).err !== undefined, 'senza Sezione, senza profilo, anonimo: no');
r = await ric('coordFano'); ok(Array.isArray(r) && r.length === 1 && r[0].richieste[0].id === 'c1', 'Coordinatore Senior di Fano: solo Fano');
// ── Progetto di Clan alla Sezione ──
r = await pdc('comm');
ok(Array.isArray(r) && r.length === 2, 'Commissario: i 2 Progetti di Clan di Pesaro (bozza e deliberato), non quello di Fano né il PdS (' + (r.length) + ')');
const c1 = Array.isArray(r) && r.find(x => x.anno_inizio === 2026);
ok(c1 && c1.obiettivi.length === 2 && c1.obiettivi[0].id === 'c1' && JSON.stringify(c1.obiettivi[0].indirizzi) === '["ps26:4.2"]' && c1.stato === 'bozza', 'obiettivi con testo, aree e indirizzi, nell’ordine; quello senza testo non c’è');
ok(c1 && c1.disponibilita.length === 2 && c1.disponibilita[0].cosa === 'Persone per i campi estivi' && c1.disponibilita[0].quanti === '6' && c1.disponibilita[1].cosa === 'Aiuto in sede', 'disponibilità e prospettive: cosa, quanti, quando, note; senza «cosa» non conta');
ok(!/RISERVAT|SECRETO|NON DEVE USCIRE|azione del Clan|Fano|Progetto di Sezione, non/i.test(JSON.stringify(r)), 'non esce nient’altro: né analisi, né azioni, né campi non richiesti, né altre Sezioni');
ok(Array.isArray(r) && r.some(x => x.obiettivi.length === 0 && x.disponibilita.length === 0), 'un piano con dati rotti dà elenchi vuoti, non un errore');
for(const w of ['vcds', 'cosC']) ok(Array.isArray(await pdc(w)) && (await pdc(w)).length === 2, w + ': può leggere');
for(const w of ['cg', 'cu', 'cosP', 'coord', 'senior']) ok((await pdc(w)).err !== undefined, w + ': no (per ora lo legge chi guida la Sezione)');
ok((await pdc('nosez')).err !== undefined && (await pdc('noprof')).err !== undefined && (await pdc('anon')).err !== undefined, 'senza Sezione, senza profilo, anonimo: no');
r = await pdc('commFano'); ok(Array.isArray(r) && r.length === 1 && r[0].obiettivi[0].id === 'x1', 'Commissario di Fano: solo il Clan di Fano');
const dir = await as('comm', `select count(*) n from pee_piani`); ok(dir.rows && Number(dir.rows[0].n) === 0, 'la lettura diretta della tabella continua a essere negata');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
