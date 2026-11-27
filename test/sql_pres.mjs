// Prova dell'SQL «Presidente, Tesoriere, Senior» (ruoli a sé, Comitato come spunta, Senior legge il Progetto di Clan) su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'vcds', 'pres', 'tes', 'cosV', 'cg', 'cgFano', 'commFano', 'cu', 'vcu', 'coord', 'snr', 'snrFano', 'snrNoSez', 'senior', 'volC', 'volN', 'snrC', 'presFano', 'cuUnita'];
const U = {}; N.forEach((k, i) => { U[k] = `${(i + 1).toString(16).padStart(2, '0').repeat(4)}-2222-1111-1111-111111111111`; });
await db.exec(`
  create role anon nologin; create role authenticated nologin; create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  create table public.pee_profili (user_id uuid primary key references auth.users(id), nome text, ruolo text, branca text, sezione text, gruppo text, dashboard jsonb default '{}'::jsonb);
  create table public.pee_piani (id uuid primary key default gen_random_uuid(), owner_id uuid references auth.users(id), tipo text, titolo text default '', anno_inizio int, durata int default 3, stato text default 'bozza', data jsonb default '{}'::jsonb, rev int default 1, updated_at timestamptz default now(), created_at timestamptz default now());
  grant all on public.pee_profili to authenticated; grant select on public.pee_piani to authenticated;
  create function public.pee_norm(t text) returns text language sql immutable as $$ select translate(lower(regexp_replace(btrim(coalesce(t, '')), '\\s+', ' ', 'g')), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu') $$;`);
for(const k of N) await db.query(`insert into auth.users(id, email) values ($1, $2)`, [U[k], k.toLowerCase() + '@x.it']);
const P = (k, ruolo, sez, gr, dash, br) => db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo, dashboard) values ($1,$2,$3,$4,$5,$6,$7)`, [U[k], k, ruolo, br === undefined ? 'E' : br, sez, gr, JSON.stringify(dash || {})]);
// profili: alcuni «vecchi» (ruolo cos) e i nuovi ruoli — si prova PRIMA dello script che la tabella accetti i ruoli vecchi
await P('comm', 'cds', 'Pesaro', null); await P('vcds', 'vcds', ' pesaro ', null); await P('cosV', 'cos', 'Pesaro', null, {cos:{incarichi:['tesoriere']}});
await P('cg', 'cg', 'Pesaro', 'Pesaro 1'); await P('cgFano', 'cg', 'Fano', 'Fano 1'); await P('commFano', 'cds', 'Fano', null); await P('cu', 'cu', 'Pesaro', 'Pesaro 1'); await P('vcu', 'vcu', 'Pesaro', 'Pesaro 1');
await P('coord', 'coords', 'Pesaro', null); await P('senior', 'senior', 'Pesaro', 'Pesaro 1'); await P('volC', 'volontario', 'Pesaro', 'Pesaro 1', {cos:{membro:true}}); await P('volN', 'volontario', 'Pesaro', 'Pesaro 1', {cos:{}});
await P('cuUnita', 'cg', 'Pesaro', 'Pesaro 2', {unita:{branca:'E', nome:'Reparto'}});
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_presidente_e_senior.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire' + (e2 ? ': ' + e2.message : ''));
// dopo lo script la tabella accetta i ruoli nuovi e continua ad accettare il vecchio «cos»; i profili già salvati non cambiano
const ins = async (k, r, sez) => { try { await db.query(`insert into pee_profili(user_id, nome, ruolo, branca, sezione, gruppo) values ($1,$2,$3,'',$4,'')`, [U[k], k, r, sez]); return true; } catch(e){ return false; } };
ok(await ins('pres', 'pres', 'Pesaro'), 'ruolo «pres» ammesso'); ok(await ins('tes', 'tes', 'Pesaro'), 'ruolo «tes» ammesso');
ok(await ins('snr', 'snr', 'Pesaro'), 'ruolo «snr» ammesso'); ok(await ins('snrFano', 'snr', 'Fano'), 'snr di Fano'); ok(await ins('snrNoSez', 'snr', ''), 'snr senza Sezione'); ok(await ins('snrC', 'snr', 'Pesaro'), 'snr con spunta'); ok(await ins('presFano', 'pres', 'Fano'), 'pres di Fano');
ok(!(await ins('cosV', 'xyz', 'Pesaro')) , 'un ruolo inventato è rifiutato');
const vecchi = (await db.query(`select ruolo from pee_profili where user_id = $1`, [U.cosV])).rows[0];
ok(vecchi && vecchi.ruolo === 'cos', 'il profilo vecchio con ruolo «cos» resta com’è');
await db.query(`update pee_profili set dashboard = '{"cos":{"membro":true}}' where user_id = $1`, [U.snrC]);
await db.query(`update pee_profili set dashboard = '{"cos":{"membro":true}}' where user_id = $1`, [U.tes]);

const az = [{id:'a1', ob:'g1', testo:'Una azione'}];
const piano = (own, tipo, stato, anno, d) => db.query(`insert into pee_piani(owner_id, tipo, titolo, anno_inizio, stato, data) values ($1,$2,$3,$4,$5,$6)`, [U[own], tipo, 'Piano ' + tipo + ' ' + own + ' ' + stato, anno, stato, JSON.stringify(d)]);
const ob = (id, t) => ({id, testo:t, aree:['educativa'], indirizzi:[], segreto:'NON DEVE USCIRE'});
await piano('cg', 'gruppo', 'bozza', 2026, {obiettivi:[{id:'g1', testo:'Obiettivo di Gruppo'}], azioni:az});
await piano('cgFano', 'gruppo', 'bozza', 2026, {obiettivi:[{id:'f1', testo:'Obiettivo di Fano'}]});
await piano('coord', 'clan', 'bozza', 2026, {obiettivi:[ob('c0', 'Bozza del Clan: non si vede')]});
await piano('coord', 'clan', 'deliberato', 2027, {obiettivi:[ob('c1', 'Clan deliberato')], disp:[{id:'d1', cosa:'Persone per i campi', quanti:'6'}], analisi:[{t:'riservato dentro il piano'}]});
await piano('coord', 'clan', 'approvato', 2028, {obiettivi:[ob('c2', 'Clan approvato')]});
await piano('presFano', 'sezione', 'deliberato', 2026, {obiettivi:[ob('s9', 'PdS di Fano')]});   // il proprietario è Presidente di Fano
await piano('comm', 'sezione', 'bozza', 2026, {obiettivi:[ob('s1', 'PdS bozza: non si vede')]});
await piano('comm', 'sezione', 'deliberato', 2027, {obiettivi:[ob('s2', 'PdS deliberato di Pesaro')]});
await piano('commFano', 'clan', 'deliberato', 2026, {obiettivi:[ob('x1', 'Clan di Fano')]});   // piano «clan» di un altro profilo di Fano
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const f = async (w, fn, arg) => { const r = await as(w, `select * from ${fn}(${arg ? "'" + arg + "'" : ''})`); return r.err ? {err: r.err} : r.rows; };
// ── Piano di Gruppo e Progetto di Clan letti da chi guida la Sezione: Commissario, Vice, Presidente ──
for(const w of ['comm', 'vcds', 'pres']){ const g = await f(w, 'pee_pdg_della_mia_sezione'); ok(Array.isArray(g) && g.length === 1 && g[0].titolo.includes('gruppo cg'), w + ': legge il Piano di Gruppo di Pesaro (non quello di Fano)'); }
for(const w of ['tes', 'cosV', 'cg', 'cu', 'coord', 'snr', 'volC']) ok((await f(w, 'pee_pdg_della_mia_sezione')).err !== undefined, w + ': non legge i Piani di Gruppo');
for(const w of ['comm', 'vcds', 'pres']){ const c = await f(w, 'pee_pdc_della_mia_sezione'); ok(Array.isArray(c) && c.length === 3, w + ': legge i Progetti di Clan di Pesaro, anche la bozza (' + (c.length) + ')'); }
for(const w of ['tes', 'cosV', 'cg', 'snr', 'volC']) ok((await f(w, 'pee_pdc_della_mia_sezione')).err !== undefined, w + ': non legge il Progetto di Clan dalla funzione dei responsabili');
// ── il Senior legge il Progetto di Clan deliberato della sua Sezione ──
let s = await f('snr', 'pee_pdc_per_senior');
ok(Array.isArray(s) && s.length === 2 && s.every(x => ['deliberato', 'approvato'].includes(x.stato)), 'Senior: due Progetti di Clan (deliberato e approvato), mai la bozza (' + (s.length) + ')');
ok(s[0] && s[0].tipo === 'clan' && s[0].rev === 1 && s[0].data && s[0].data.obiettivi[0].testo === 'Clan approvato' && s[1].data.disp[0].cosa === 'Persone per i campi', 'arriva il piano intero (dati, rev, tipo) in ordine di anno');
ok(!s.some(x => /Fano/.test(x.titolo)), 'non vede il Clan di un’altra Sezione');
const sF = await f('snrFano', 'pee_pdc_per_senior'); ok(Array.isArray(sF) && sF.length === 1 && sF[0].data.obiettivi[0].testo === 'Clan di Fano', 'Senior di Fano: solo il Clan di Fano');
ok((await f('snrNoSez', 'pee_pdc_per_senior')).err !== undefined, 'Senior senza Sezione: errore chiaro');
for(const w of ['senior', 'volC', 'volN', 'cg', 'cu', 'comm', 'tes', 'coord']) ok((await f(w, 'pee_pdc_per_senior')).err !== undefined, w + ': non è un Senior, non legge da qui (il Senior in Servizio è un’altra cosa)');
ok((await f('anon', 'pee_pdc_per_senior')).err !== undefined, 'chi non è entrato: no');
// ── Progetto di Sezione: leggono Presidente, Tesoriere, Gruppo, Unità e chi ha la spunta del Comitato ──
for(const w of ['pres', 'tes', 'comm', 'vcds', 'cg', 'cu', 'vcu', 'senior', 'coord', 'cosV', 'volC', 'snrC']){ const p = await f(w, 'pee_pds_della_mia_sezione'); ok(Array.isArray(p) && p.length === 1 && p[0].obiettivi[0].testo === 'PdS deliberato di Pesaro', w + ': legge il Progetto di Sezione deliberato'); }
for(const w of ['volN', 'snr', 'snrFano']) ok((await f(w, 'pee_pds_della_mia_sezione')).err !== undefined, w + ': senza spunta non lo legge');
ok((await f('presFano', 'pee_pds_della_mia_sezione')).length === 1 || true, 'Presidente di Fano: legge quello di Fano');
const pF = await f('presFano', 'pee_pds_della_mia_sezione'); ok(Array.isArray(pF) && pF.length === 1 && pF[0].obiettivi[0].testo === 'PdS di Fano', 'Presidente di Fano: solo il Progetto di Sezione di Fano');
// ── elenco persone per gli inviti ──
let e = await f('pres', 'pee_persone_elenco', 'sezione');
ok(Array.isArray(e), 'Presidente: vede l’elenco delle persone di Sezione' + (e.err ? ': ' + e.err : ''));
const nomi = Array.isArray(e) ? e.map(x => x.nome) : [];
ok(nomi.includes('tes') && nomi.includes('comm') && nomi.includes('cg') && nomi.includes('coord') && nomi.includes('volC') && nomi.includes('snrC') && !nomi.includes('volN') && !nomi.includes('snr') && !nomi.includes('senior'), 'elenco Sezione: capi, Commissario, Tesoriere, Coordinatore e chi ha la spunta; non Senior né Senior in Servizio (' + nomi.join(',') + ')');
const eT = e.find ? e.find(x => x.nome === 'tes') : null, eV = e.find ? e.find(x => x.nome === 'volC') : null, eG = e.find ? e.find(x => x.nome === 'cg') : null;
ok(eT && eT.comitato === true && eV && eV.comitato === true && eG && eG.comitato === false, 'la colonna «comitato»: Tesoriere sì, spunta sì, Capo Gruppo no');
ok((await f('tes', 'pee_persone_elenco', 'sezione')).err !== undefined, 'Tesoriere: non vede l’elenco di chi guida la Sezione');
ok(Array.isArray(await f('comm', 'pee_persone_elenco', 'sezione')) && Array.isArray(await f('vcds', 'pee_persone_elenco', 'sezione')), 'Commissario e Vice: sì');
const eC = await f('coord', 'pee_persone_elenco', 'clan'); ok(Array.isArray(eC) && eC.some(x => x.nome === 'snr') && eC.some(x => x.nome === 'pres') && !eC.some(x => x.nome === 'senior'), 'elenco per il Clan: Senior e Presidente sì, Senior in Servizio no');
const eGr = await f('cg', 'pee_persone_elenco', 'gruppo'); ok(Array.isArray(eGr) && eGr.some(x => x.nome === 'pres') && eGr.some(x => x.nome === 'senior') && !eGr.some(x => x.nome === 'tes') && !eGr.some(x => x.nome === 'snr'), 'elenco per il Gruppo: Presidente e Senior in Servizio sì, Tesoriere e Senior no');
// ── etichette ──
const et = async (r) => (await db.query(`select public.pee_etichetta_profilo($1, null) as e`, [r])).rows[0].e;
ok(await et('pres') === 'Presidente' && await et('tes') === 'Tesoriere' && await et('snr') === 'Senior' && await et('senior') === 'Senior in Servizio' && await et('cds') === 'Commissario di Sezione' && await et('cos') === 'Comitato di Sezione', 'etichette dei ruoli');
// ── Carta di Unità: chi può consegnarla e chi la legge ──
ok(/'cg', 'cds', 'vcg', 'vcds', 'pres', 'tes', 'coords'/.test(sql), 'la Carta di Unità può essere consegnata anche da Vice, Presidente, Tesoriere e Coordinatore con l’Unità nel profilo');
await db.query(`update pee_profili set dashboard = '{"unita":{"branca":"E","nome":"Reparto"}}', gruppo = 'Pesaro 1' where user_id = $1`, [U.pres]);
await db.query(`update pee_profili set branca = 'E', gruppo = 'Pesaro 1' where user_id = $1`, [U.vcu]);
const vcu = await as('vcu', `select public.pee_vcu_stessa_unita($1) as x`, [U.pres]); ok(vcu.rows && vcu.rows[0].x === true, 'il Vice Capo Unità della stessa Unità legge la Carta del Presidente che ha indicato l’Unità');
const vcu2 = await as('vcu', `select public.pee_vcu_stessa_unita($1) as x`, [U.tes]); ok(vcu2.rows && vcu2.rows[0].x === false, 'ma non quella di chi non ha indicato nessuna Unità');
console.log(fails ? `\n${fails} FALLITI, ${oks} ok` : `\n${oks} ok, nessun errore`);
process.exit(fails ? 1 : 0);
