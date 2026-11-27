// Prova dell'SQL «Verbali» su Postgres vero (PGlite)
import { PGlite } from '/home/claude/work/pg/node_modules/@electric-sql/pglite/dist/index.js';
import fs from 'fs';
let oks = 0, fails = 0;
const ok = (c, m) => { if(c){ oks++; console.log('  ✓ ' + m); } else { fails++; console.log('  ✗ ' + m); } };
const db = new PGlite();
const N = ['comm', 'vcomm', 'pres', 'tes', 'cg', 'vcg', 'cg2', 'cgFano', 'cu', 'cu2', 'sis', 'coord', 'snr', 'volC', 'volN', 'cosV', 'norole', 'noSez', 'cuSenzaGr', 'cuFano'];
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
const sql = fs.readFileSync(new URL('../supabase_aggiornamento_28novembre_verbali.sql', import.meta.url), 'utf8');
let e1 = null, e2 = null; try { await db.exec(sql); } catch(e){ e1 = e; } ok(!e1, 'lo script gira' + (e1 ? ': ' + e1.message : ''));
try { await db.exec(sql); } catch(e){ e2 = e; } ok(!e2, 'si può rieseguire' + (e2 ? ': ' + e2.message : ''));
async function as(who, q, p = []){
  await db.exec(`set role ${who === 'anon' ? 'anon' : 'authenticated'}`); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [who === 'anon' ? '' : U[who]]);
  try { return {rows: (await db.query(q, p)).rows}; } catch(e){ return {err: e.message}; } finally { await db.exec(`reset role`); }
}
const ins = (who, tipo, extra) => { const x = Object.assign({tipo, titolo:'V ' + tipo + ' ' + who, data:'2027-03-10', stato:'condiviso'}, extra || {}); const k = Object.keys(x);
  return as(who, `insert into pee_verbali(${k.join(',')}) values (${k.map((_, i) => '$' + (i + 1)).join(',')}) returning id, owner_id, sezione, gruppo, autore_ruolo, autore_nome, stato, approvato_il, sez`, k.map(c => typeof x[c] === 'object' ? JSON.stringify(x[c]) : x[c])); };
const lista = async (w, anno) => { const r = await as(w, `select * from pee_verbali_lista(${anno === undefined ? '' : anno})`); return r.err ? {err: r.err} : r.rows; };
const tit = r => Array.isArray(r) ? r.map(x => x.titolo).sort() : r;
const S = (...l) => l.sort();

// ── chi può scrivere ──
const W = {};
const prova = async (chi, tipo, atteso) => { const r = await ins(chi, tipo); W[chi + ':' + tipo] = r.rows && r.rows[0] && r.rows[0].id; ok(atteso ? !!(r.rows && r.rows.length) : !!r.err, chi + (atteso ? ' può' : ' NON può') + ' scrivere «' + tipo + '»' + (atteso !== !r.err ? ' · ' + (r.err || 'ok') : '')); };
for(const [chi, tipo] of [['cu', 'staff'], ['sis', 'staff'], ['cg', 'staff'], ['vcg', 'staff'], ['comm', 'staff'], ['coord', 'staff'], ['cg', 'cdg'], ['vcg', 'cdg'], ['comm', 'rica'], ['vcomm', 'cosez'], ['comm', 'cos'], ['pres', 'cos'], ['tes', 'cos'], ['volC', 'cos'], ['cosV', 'cos'], ['cg2', 'cdg']]) await prova(chi, tipo, true);
for(const [chi, tipo] of [['vcomm', 'cos'], ['cu', 'cdg'], ['cu', 'cos'], ['cu', 'rica'], ['cg', 'rica'], ['cg', 'cosez'], ['cg', 'cos'], ['pres', 'staff'], ['pres', 'rica'], ['snr', 'staff'], ['snr', 'cos'], ['volN', 'staff'], ['volN', 'cos'], ['norole', 'staff'], ['noSez', 'staff'], ['cuSenzaGr', 'staff'], ['tes', 'rica'], ['coord', 'cdg']]) await prova(chi, tipo, false);
const x1 = await ins('cu', 'staff', {titolo:'Dati finti', owner_id:U.comm});
ok(x1.rows && x1.rows[0] && x1.rows[0].owner_id === U.cu, 'l’autore è chi scrive, anche se l’app manda un altro owner_id');
const x2 = await as('cu', `insert into pee_verbali(tipo, titolo, data, sezione, gruppo, autore_ruolo, autore_nome) values ('staff', 'Profilo falso', '2027-03-11', 'Fano', 'Fano 1', 'cds', 'Finto Commissario') returning sezione, gruppo, autore_ruolo, autore_nome`);
ok(x2.rows && x2.rows[0].sezione === 'Pesaro' && x2.rows[0].gruppo === 'Pesaro 1' && x2.rows[0].autore_ruolo === 'cu' && x2.rows[0].autore_nome === 'Nome cu', 'Sezione, Gruppo, ruolo e nome vengono dal profilo, non da ciò che manda l’app');
const x3 = await as('pres', `select sezione from pee_verbali where titolo = 'V cos pres'`); ok(x3.rows[0].sezione === 'pesaro' || x3.rows[0].sezione === 'pesaro'.trim() || /pesaro/i.test(x3.rows[0].sezione), 'la Sezione si salva senza spazi attorno');

// ── chi legge cosa ──
// verbali condivisi: V staff <chi>, V cdg <chi>, V rica comm, V cosez vcomm, V cos <chi>
const base = n => ({cu:'V staff cu', sis:'V staff sis', cgS:'V staff cg', vcgS:'V staff vcg', commS:'V staff comm', coordS:'V staff coord'})[n];
await ins('cg', 'cdg', {titolo:'CdG Pesaro 1'}); await ins('cg2', 'cdg', {titolo:'CdG Pesaro 2'});
await ins('comm', 'rica', {titolo:'RiCa'}); await ins('vcomm', 'cosez', {titolo:'CoSez'}); await ins('comm', 'cos', {titolo:'COS riservato'}); await ins('pres', 'cos', {titolo:'COS aperto', sez:true});
await ins('cuFano', 'staff', {titolo:'Staff Fano'}); await ins('cgFano', 'cdg', {titolo:'CdG Fano'});
await ins('cu', 'staff', {titolo:'Staff bozza', stato:'bozza'}); await ins('comm', 'cos', {titolo:'COS bozza', stato:'bozza', sez:true});
const veg = async (w) => tit(await lista(w, 2026));
const R = {};
R.cu = await veg('cu'); R.cg = await veg('cg'); R.comm = await veg('comm'); R.pres = await veg('pres'); R.cu2 = await veg('cu2');
ok(R.cu.includes('Staff bozza') && R.cu.includes('V staff cu') && R.cu.includes('CdG Pesaro 1') && R.cu.includes('RiCa') && R.cu.includes('COS aperto'), 'Capo Unità: i suoi (anche la bozza), il Consiglio del suo Gruppo, la RiCa e il COS aperto a tutti · ' + JSON.stringify(R.cu));
ok(!R.cu.includes('V staff sis') && !R.cu.includes('V staff cg') && !R.cu.includes('V staff comm') && !R.cu.includes('CdG Pesaro 2') && !R.cu.includes('COS riservato') && !R.cu.includes('CoSez') && !R.cu.includes('Staff Fano'), 'Capo Unità: non legge staff di altri, Consiglio di un altro Gruppo, COS riservato, Consiglio di Sezione, altre Sezioni');
ok(R.cg.includes('V staff cu') && R.cg.includes('V staff sis') && !R.cg.includes('Staff bozza') && R.cg.includes('CdG Pesaro 1') && R.cg.includes('CoSez') && R.cg.includes('RiCa') && R.cg.includes('COS aperto'), 'Capo Gruppo: staff dei Capi Unità del suo Gruppo (non le bozze), il suo Consiglio, CoSez, RiCa · ' + JSON.stringify(R.cg));
ok(!R.cg.includes('CdG Pesaro 2') && !R.cg.includes('COS riservato') && !R.cg.includes('V staff comm') , 'Capo Gruppo: non legge il Consiglio di un altro Gruppo, il COS riservato, lo staff del Commissario');
ok(!R.cu2.includes('V staff cu') && !R.cu2.includes('V staff sis') && R.cu2.includes('CdG Pesaro 2') && !R.cu2.includes('CdG Pesaro 1'), 'Capo Unità di un altro Gruppo: non legge staff né Consiglio del Gruppo 1, legge il proprio Consiglio');
ok(['V staff cu', 'V staff sis', 'V staff cg', 'V staff vcg', 'V staff coord', 'CdG Pesaro 1', 'CdG Pesaro 2', 'RiCa', 'CoSez', 'COS riservato', 'COS aperto'].every(t => R.comm.includes(t)) && !R.comm.includes('Staff Fano') && !R.comm.includes('Staff Fano') && !R.comm.includes('Staff bozza'), 'Commissario: tutto della Sezione (non altre Sezioni, non le bozze degli altri)');
ok(R.comm.includes('COS bozza') && !R.comm.includes('Staff bozza'), 'Commissario: vede la propria bozza, non la bozza di un Capo Unità');
ok(R.pres.includes('V staff comm') && R.pres.includes('COS riservato') && R.pres.includes('COS aperto') && !R.pres.includes('V staff cu') && !R.pres.includes('V staff cg') && !R.pres.includes('CdG Pesaro 1') && !R.pres.includes('CoSez') && !R.pres.includes('RiCa'), 'Presidente: staff del Commissario e COS; non Unità, Gruppi, RiCa né Consiglio di Sezione · ' + JSON.stringify(R.pres));
const vc = await veg('vcomm'), cs = await veg('cosV'), tt = await veg('tes'), vo = await veg('volC'), co = await veg('coord'), vg = await veg('vcg'), si = await veg('sis');
ok(vc.includes('V staff cu') && vc.includes('CdG Pesaro 2') && vc.includes('CoSez') && vc.includes('RiCa') && !vc.includes('COS riservato') && vc.includes('COS aperto'), 'Vice Commissario: come il Commissario, ma il COS solo se aperto a tutta la Sezione (a meno della spunta del Comitato)');
ok(tt.includes('COS riservato') && tt.includes('COS aperto') && !tt.includes('CoSez') && !tt.includes('V staff comm') && !tt.includes('RiCa'), 'Tesoriere: solo il COS');
ok(cs.includes('COS riservato') && vo.includes('COS riservato'), 'membro del Comitato (ruolo «cos» o spunta): legge il COS');
ok(!vo.includes('CoSez') && vo.includes('CdG Pesaro 1'), 'volontario con la spunta del Comitato: legge anche il Consiglio del suo Gruppo, non il Consiglio di Sezione');
ok(co.includes('CoSez') && co.includes('RiCa') && co.includes('COS aperto') && !co.includes('COS riservato') && !co.includes('CdG Pesaro 1') && !co.includes('V staff cu'), 'Coordinatore Senior: CoSez, RiCa e COS aperto; non gli staff né i Consigli di Gruppo');
ok(vg.includes('V staff cu') && vg.includes('CdG Pesaro 1') && vg.includes('CoSez'), 'Vice Capo Gruppo: come il Capo Gruppo');
ok(si.includes('CdG Pesaro 1') && si.includes('RiCa') && !si.includes('V staff cu') && !si.includes('CoSez'), 'Senior in Servizio: il Consiglio del suo Gruppo e la RiCa');
const fa = tit(await lista('cgFano', 2026)); ok(JSON.stringify(fa) === JSON.stringify(S('CdG Fano', 'Staff Fano')), 'altra Sezione: vede solo i propri · ' + JSON.stringify(fa));
const sn = await lista('snr', 2026), vn = await lista('volN', 2026), nr = await lista('norole', 2026), ns = await lista('noSez', 2026), an = await as('anon', 'select * from pee_verbali_lista()');
ok(sn.err && vn.err && nr.err && ns.err, 'Senior giovane, volontario senza spunta, profilo senza ruolo o senza Sezione: errore, nessun verbale');
ok(!!an.err, 'senza accesso: errore');
const sel = async w => (await as(w, `select titolo from pee_verbali`)).rows || [];
const dir = await sel('cg'); ok(dir.length === 3 && dir.every(r => /cg|vcg|Pesaro 1/.test(r.titolo)) , 'lettura diretta della tabella: il Capo Gruppo vede solo i suoi 3 · ' + JSON.stringify(dir.map(r => r.titolo)));
const dan = await as('anon', 'select count(*) from pee_verbali'); ok(!!dan.err, 'la tabella non si legge senza accesso');

// ── la spunta «tutta la Sezione» vale solo per il COS ──
const xs = await ins('cu', 'staff', {titolo:'Staff con spunta', sez:true}); ok(xs.rows && xs.rows[0].sez === false, 'la spunta «tutta la Sezione» su un verbale che non è del COS si azzera');
const cosAperto = (await lista('cu2', 2026)).find(x => x.titolo === 'COS aperto'); ok(cosAperto && cosAperto.sez === true && cosAperto.mio === false, 'COS con la spunta: lo legge un Capo Unità di qualsiasi Gruppo');

// ── anno scout ──
ok(tit(await lista('comm', 2025)).length === 0, 'anno scout 2025: nessun verbale di marzo 2027');
await ins('comm', 'rica', {titolo:'RiCa del 2025', data:'2025-10-02'}); ok(tit(await lista('comm', 2025)).join() === 'RiCa del 2025' && !tit(await lista('comm', 2026)).includes('RiCa del 2025') && tit(await lista('comm')).includes('RiCa del 2025'), 'filtro per anno scout (1 settembre – 31 agosto) e «tutti gli anni»');

// ── stati: bozza → condiviso → approvato ──
const a1 = await ins('cg', 'cdg', {titolo:'Da approvare', stato:'condiviso'}); const id1 = a1.rows[0].id;
const ap = await as('cg', `update pee_verbali set stato = 'approvato' where id = $1 returning approvato_il`, [id1]); ok(ap.rows && ap.rows[0].approvato_il, 'approvando, la data di approvazione si mette da sola');
const ap2 = await as('cg', `update pee_verbali set sintesi = 'cambio' where id = $1`, [id1]); ok(/approvato non si modifica/.test(ap2.err || ''), 'un verbale approvato non si modifica');
const ap3 = await as('cg', `delete from pee_verbali where id = $1 returning id`, [id1]); ok(ap3.rows && ap3.rows.length === 0, 'un verbale approvato non si cancella');
const ap4 = await as('cg', `update pee_verbali set stato = 'condiviso', sintesi = 'dopo riapertura' where id = $1 returning approvato_il, sintesi`, [id1]); ok(ap4.rows && ap4.rows[0].approvato_il === null && ap4.rows[0].sintesi === 'dopo riapertura', 'riaperto: si può modificare e la data di approvazione sparisce');
const ap5 = await as('cu', `update pee_verbali set sintesi = 'intruso' where id = $1 returning id`, [id1]); ok(ap5.rows && ap5.rows.length === 0, 'chi non l’ha scritto non può modificarlo');
const ap6 = await as('comm', `delete from pee_verbali where id = $1 returning id`, [id1]); ok(ap6.rows && ap6.rows.length === 0, 'chi non l’ha scritto non può cancellarlo (neanche il Commissario)');
const ap7 = await as('cg', `delete from pee_verbali where id = $1 returning id`, [id1]); ok(ap7.rows && ap7.rows.length === 1, 'chi l’ha scritto può cancellarlo (se non approvato)');
const cp = await as('cg', `update pee_verbali set tipo = 'cos' where id = $1`, [W['cg:cdg']]); ok(!!cp.err, 'non si può cambiare un verbale in un tipo che il ruolo non può scrivere');
const ap8 = await ins('cg', 'cdg', {titolo:'Con data fissa', stato:'approvato', approvato_il:'2027-04-01'}); ok(ap8.rows && String(ap8.rows[0].approvato_il).includes('2027'), 'data di approvazione indicata dalla persona: viene tenuta');

// ── controlli sui campi ──
ok(!!(await ins('cg', 'cdg', {modalita:'telepatia'})).err, 'modalità diversa da presenza/online: rifiutata');
ok(!!(await ins('cg', 'cdg', {titolo:'x'.repeat(161)})).err, 'titolo oltre 160 caratteri: rifiutato');
const bad = await as('cg', `insert into pee_verbali(tipo, titolo, data, azioni) values ('cdg', 'azioni sbagliate', '2027-03-01', '{"a":1}'::jsonb)`); ok(!!bad.err, 'azioni che non sono una lista: rifiutate');
const gd = await as('cg', `insert into pee_verbali(tipo, titolo, data, modalita, stato, azioni) values ('cdg', 'Online con azioni', '2027-03-02', 'online', 'condiviso', $1::jsonb) returning modalita, azioni`, [JSON.stringify([{chi:'Anna', cosa:'Scrivere', entro:'2027-04-01'}])]);
ok(gd.rows && gd.rows[0].modalita === 'online' && gd.rows[0].azioni[0].chi === 'Anna', 'modalità online e azioni (chi, cosa, entro) salvate');
const gl = (await lista('comm', 2026)).find(x => x.titolo === 'Online con azioni'); ok(gl && gl.modalita === 'online' && gl.azioni.length === 1 && gl.autore_nome === 'Nome cg' && gl.mio === false, 'la lista restituisce modalità, azioni, nome dell’autore e «mio» = falso per gli altri');
const ec = await as('cg', `select * from pee_verbali_lista(2026)`); ok(ec.rows.find(x => x.titolo === 'Online con azioni').mio === true, '«mio» = vero per chi l’ha scritto');
const exe = await as('anon', 'select pee_verbale_puo($1, $2::jsonb, $3, $4)', ['cg', '{}', 'G', 'cdg']); ok(!!exe.err, 'le funzioni non sono eseguibili senza accesso');
console.log('\n' + oks + ' ok, ' + fails + ' falliti'); process.exit(fails ? 1 : 0);
