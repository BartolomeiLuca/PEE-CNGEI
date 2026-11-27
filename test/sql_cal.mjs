// Prova dell'SQL «Calendario della Sezione» su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'pres', 'tes', 'cg', 'cgFano', 'cu', 'cuFano', 'coord', 'snr', 'sis', 'volC', 'volN', 'norole', 'noSez', 'cosV'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-2222-1111-1111-111111111111`; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  create table public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, dashboard jsonb default '{}'::jsonb);
  create table public.pee_piani (id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users(id), tipo text, titolo text default '', anno_inizio int, durata int default 3, stato text default 'bozza', data jsonb default '{}'::jsonb);
  create table public.pee_archivi (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), anno int, titolo text, data jsonb default '{}'::jsonb, meta jsonb default '{}'::jsonb);
  grant all on public.pee_profili, public.pee_piani, public.pee_archivi to authenticated;
  create function public.pee_norm(t text) returns text language sql immutable as $$ select translate(lower(regexp_replace(btrim(coalesce(t, '')), '\\s+', ' ', 'g')), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu') $$;`);
for(const k of N) await db.query(`insert into auth.users(id, email) values ($1, $2)`, [U[k], k.toLowerCase() + '@x.it']);
const P = (k, ruolo, sez, gr, dash, br) => db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo, dashboard) values ($1,$2,$3,$4,$5,$6,$7)`, [U[k], k, ruolo, br === undefined ? '' : br, sez, gr, JSON.stringify(dash || {})]);
await P('comm', 'cds', 'Pesaro', ''); await P('pres', 'pres', ' pesaro ', ''); await P('tes', 'tes', 'Pesaro', ''); await P('cg', 'cg', 'Pesaro', 'Pesaro 1');
await P('cgFano', 'cg', 'Fano', 'Fano 1'); await P('cu', 'cu', 'Pesaro', 'Pesaro 1', {}, 'E'); await P('cuFano', 'cu', 'Fano', 'Fano 1', {}, 'L'); await P('coord', 'coords', 'Pesaro', '');
await P('snr', 'snr', 'Pesaro', ''); await P('sis', 'senior', 'Pesaro', 'Pesaro 1', {}, 'E'); await P('volC', 'volontario', 'Pesaro', 'Pesaro 1', {cos:{membro:true}}); await P('volN', 'volontario', 'Pesaro', 'Pesaro 1');
await P('norole', null, 'Pesaro', ''); await P('noSez', 'cg', '', 'X'); await P('cosV', 'cos', 'Pesaro', '');
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_calendario_sezione.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire' + (e2 ? ': ' + e2.message : ''));
const piano = (own, tipo, d) => db.query(`insert into pee_piani(owner_id, tipo, titolo, anno_inizio, data) values ($1,$2,$3,2026,$4)`, [U[own], tipo, 'Piano ' + tipo + ' ' + own, JSON.stringify(d)]);
const arc = (own, mode, d, meta) => db.query(`insert into pee_archivi(user_id, anno, titolo, data, meta) values ($1,2026,$2,$3,$4)`, [U[own], 'Prog ' + own + ' ' + mode, JSON.stringify(d), JSON.stringify(Object.assign({mode}, meta || {}))]);
const e = (id, tipo, titolo, d1, d2, extra) => Object.assign({id, tipo, titolo, d1, d2: d2 || '', ris:false, nota:'NOTA SEGRETA'}, extra || {});
await piano('cg', 'gruppo', {cal:[e('1', 'campo', 'Campo estivo', '2027-07-20', '2027-07-28'), e('2', 'riunione', 'Riunione di staff', '2027-02-01'), e('3', 'uscita', 'Uscita riservata', '2027-03-01', '', {ris:true}), e('4', 'altro', 'Senza data', ''), e('5', 'bivacco', 'Data sbagliata', '2027-02-30'), e('6', 'uscita', 'Fuori anno', '2029-05-05'), e('7', 'uscita', 'Fine prima', '2027-04-10', '2027-04-02')],
  tappe:[{id:'t1', anno:1, tipo:'cdg', data:'2026-12-15', fatta:false}, {id:'t2', anno:1, tipo:'meta', data:'2027-03-10'}, {id:'t3', anno:1, tipo:'cdg', data:''}]});
await piano('cgFano', 'gruppo', {cal:[e('1', 'campo', 'Campo di Fano', '2027-07-20')]});
await piano('comm', 'sezione', {cal:[e('1', 'assemblea', 'Assemblea di Sezione', '2027-03-20'), e('2', 'consiglio', 'Consiglio di Sezione', '2026-11-05')]});
await piano('coord', 'clan', {cal:[e('1', 'consiglio', 'Consiglio di Clan', '2027-01-12'), e('2', 'uscita', 'Uscita del Clan', '2027-05-01', '2027-05-02', {ris:true})]});
await piano('comm', 'sezione', {cal:'non è una lista'}); await piano('comm', 'sezione', {});
await piano('cg', 'gruppo', {cal:[e('1', 'campo', 'Campo estivo', '2027-07-20', '2027-07-28')]});   // duplicato (stesso evento)
const us = (id, modello, testo, data, extra) => ({[id]:Object.assign({id, modello, testo, ax:{data, durata:'1'}, dest:'unita'}, extra || {})});
await arc('cu', 'unita', {UNIT_NAME:'Reparto Aquile', scheda:{uscite:Object.assign({}, us('u1', 'giorno', 'Uscita al mare', '2027-05-14'), us('u2', 'sede', 'Riunione di Reparto', '2027-05-15'),
  us('u3', 'campo', 'Campo mobile', '2027-08-01', {ax:{data:'2027-08-01', durata:'piu', dataFine:'2027-08-08'}}), us('u4', 'giorno', 'Uscita riservata', '2027-06-01', {risSez:true}), us('u5', 'giorno', 'Cancellata', '2027-06-02', {del:true}), us('u6', 'giorno', 'Dello staff', '2027-06-03', {dest:'staff'}), us('u7', 'bivacco', 'Bivacco senza data', ''))}});
await arc('cu', 'staff', {scheda:{uscite:us('s1', 'giorno', 'Uscita dello staff', '2027-05-20')}});
await arc('cu', 'anno', {scheda:{uscite:us('a1', 'giorno', 'Ciclo anno', '2027-05-21')}});
await arc('cu', 'unita', {UNIT_NAME:'Cestinato', scheda:{uscite:us('c1', 'giorno', 'Uscita nel cestino', '2027-05-22')}}, {cest:{at:1}});
await arc('cuFano', 'unita', {UNIT_NAME:'Branco di Fano', scheda:{uscite:us('f1', 'giorno', 'Uscita di Fano', '2027-05-14')}});
await arc('cg', 'unita', {scheda:{uscite:'rotto'}}); await arc('sis', 'unita', {});
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const cal = async (w, anno) => { const r = await as(w, `select * from pee_cal_sezione(${anno === undefined ? '' : anno})`); return r.err ? {err: r.err} : r.rows; };
const tit = r => r.map(x => x.titolo);
const iso = v => v instanceof Date ? v.toISOString().slice(0, 10) : (v === null ? null : String(v));
const dd = x => iso(x.data_da);
const base = ['Consiglio di Sezione', 'Consiglio di Gruppo', 'Consiglio di Clan', 'Assemblea di Sezione', 'Fine prima', 'Uscita al mare', 'Campo estivo', 'Campo mobile'];
// l'anno scout 2026-27 (indicato esplicitamente: la data del server cambia ogni giorno)
const r0 = await cal('comm', 2026);
ok(Array.isArray(r0) && JSON.stringify(tit(r0)) === JSON.stringify(base) , 'Commissario: vede gli eventi della Sezione, in ordine di data · ' + JSON.stringify(tit(r0)));
ok(!tit(r0).some(t => /Riunione|riservat|Riservat|Senza data|sbagliata|Fuori anno|Cancellata|staff|Ciclo anno|cestino|Fano|Bivacco senza/.test(t)), 'esclusi: riunioni, riservati, senza data, data non valida, fuori anno, cancellati, staff, anno, cestino, altra Sezione');
const fp = r0.find(x => x.titolo === 'Fine prima'); ok(fp && iso(fp.data_a) === null && dd(fp) === '2027-04-10', '«Fine prima» (data di fine prima dell’inizio): conta come evento di un giorno');
const cam = r0.find(x => x.titolo === 'Campo estivo'); ok(cam && dd(cam) === '2027-07-20' && iso(cam.data_a) === '2027-07-28' && cam.origine === 'gruppo' && cam.gruppo === 'Pesaro 1', 'campo: date, origine e Gruppo');
ok(r0.filter(x => x.titolo === 'Campo estivo').length === 1, 'un evento ripetuto in due piani uguali compare una volta sola');
const cm = r0.find(x => x.titolo === 'Campo mobile'); ok(cm && cm.origine === 'unita' && cm.branca === 'E' && cm.unita === 'Reparto Aquile' && iso(cm.data_a) === '2027-08-08' && cm.tipo === 'campo', 'Unità: campo di più giorni, Branca e nome dell’Unità');
const um = r0.find(x => x.titolo === 'Uscita al mare'); ok(um && um.tipo === 'uscita' && um.data_a === null, 'Unità: uscita di un giorno');
const cdg = r0.find(x => x.titolo === 'Consiglio di Gruppo'); ok(cdg && cdg.tipo === 'consiglio' && cdg.origine === 'gruppo', 'i Consigli di Gruppo con data (tappe) salgono, senza data no');
ok(!JSON.stringify(r0).includes('NOTA SEGRETA') && Object.keys(r0[0]).join() === 'origine,tipo,titolo,data_da,data_a,gruppo,branca,unita', 'le note e ogni altro campo non escono');
// chi vede cosa
for(const w of ['pres', 'tes', 'cg', 'cu', 'coord', 'sis', 'volC', 'cosV']){ const r = await cal(w, 2026); ok(Array.isArray(r) && r.length === base.length, w + ': vede il calendario della Sezione (' + (r.err || r.length) + ')'); }
for(const w of ['volN', 'norole', 'noSez']) ok((await cal(w, 2026)).err !== undefined, w + ': non lo vede');
ok((await as('anon', `select * from pee_cal_sezione(2026)`)).err !== undefined, 'senza accesso: rifiutato');
const rs = await cal('snr', 2026); ok(Array.isArray(rs) && JSON.stringify(tit(rs)) === JSON.stringify(['Consiglio di Clan']), 'Senior: solo gli eventi del Clan (non quello riservato) · ' + JSON.stringify(tit(rs)));
const rf = await cal('cgFano', 2026); ok(Array.isArray(rf) && JSON.stringify(tit(rf)) === JSON.stringify(['Uscita di Fano', 'Campo di Fano']) , 'Capo Gruppo di Fano: solo la sua Sezione · ' + JSON.stringify(tit(rf)));
const rcu = await cal('cuFano', 2026); ok(Array.isArray(rcu) && rcu.length === 2, 'Capo Unità di Fano: solo la sua Sezione');
const r27 = await cal('comm', 2027); ok(Array.isArray(r27) && r27.length === 0, 'anno scout seguente: nessun evento');
const rd = await cal('comm'); ok(Array.isArray(rd), 'senza anno: usa l’anno scout corrente (' + (rd.err || rd.length + ' eventi') + ')');
// i dati non vengono toccati
ok((await db.query(`select count(*)::int as n from pee_piani`)).rows[0].n === 7 && (await db.query(`select count(*)::int as n from pee_archivi`)).rows[0].n === 7, 'nessun dato cambiato');
// una data scritta male non fa fallire la funzione
const dbad = await as('comm', `select pee_data_iso('2027-02-30') as a, pee_data_iso('abc') as b, pee_data_iso(null) as c, pee_data_iso('2027-02-10T10:00') as d`); ok(dbad.rows && dbad.rows[0].a === null && dbad.rows[0].b === null && dbad.rows[0].c === null && iso(dbad.rows[0].d) === '2027-02-10', 'date non valide: null, nessun errore');
console.log(`\n${oks} ok, ${fails} falliti`); process.exit(fails ? 1 : 0);
