// Banco di prova: sito locale + finto Supabase condiviso tra più "persone" (contesti del browser)
import { chromium, webkit, firefox, devices } from 'playwright';
import fs from 'fs';
import http from 'http';
import path from 'path';

export const ROOT = process.env.SITE || '/home/claude/pee-cngei';
const CLIENT = fs.readFileSync(new URL('./fakesb_client.js', import.meta.url), 'utf8');
let server = null;
export async function serve(port = +(process.env.PORT||8080)){
  if(server) return `http://127.0.0.1:${port}/`;
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; }
      const t = f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : f.endsWith('.pdf') ? 'application/pdf' : f.endsWith('.docx') ? 'application/octet-stream' : 'application/octet-stream';
      if(process.env.GUSCIO0 === '1' && /^\/index\.html$/.test(p)){ b = Buffer.from(b.toString('utf8').replace('<head>', "<head><script>if(!/guscio=/.test(location.search)) history.replaceState(null,'',location.pathname+(location.search?location.search+'&':'?')+'guscio=0'+location.hash);</script>")); }
      res.writeHead(200, {'content-type': t, 'cache-control': 'no-store'}); res.end(b); });
  });
  await new Promise(r => server.listen(port, '127.0.0.1', r));
  return `http://127.0.0.1:${port}/`;
}
export function stop(){ if(server){ server.close(); server = null; } }

let seq = 1; const uuid = () => 'u' + (seq++).toString(16).padStart(6, '0') + '-' + Math.random().toString(16).slice(2, 8);
let clock = Date.parse('2026-10-12T10:00:00Z');
const now = () => new Date(clock += 1000).toISOString();

export class FakeDB {
  constructor(){ this.users = []; this.t = {pee_archivi:[], pee_membri:[], pee_versioni:[], pee_suggerimenti:[], pee_gruppi:[], pee_cambi_email:[], pee_archivio_nazionale:[], pee_profili:[], pee_giri:[], pee_giri_dest:[], pee_giri_rev:[], pee_giri_msg:[], pee_revisioni:[], pee_revisioni_punto:[], pee_piani:[], pee_piani_membri:[], pee_piani_versioni:[], pee_piani_giri:[], pee_piani_contributi:[], pee_piani_giri_persona:[], pee_piani_voci_anonime:[], pee_piani_giri_registro:[]}; this.sql14 = false; this.ammessi = ['luca.bartolomei@cngei.it']; this.revAperto = false; this.pages = new Set(); this.mails = []; this.presence = {}; this.log = []; }
  revRuolo(uid, rid){ const v = this.t.pee_revisioni.find(x => x.id === rid); if(!v) return null; if(v.owner_id === uid) return 'titolare'; return this.t.pee_giri.some(g => g.archivio_id === v.archivio_id && this.giroRuolo(uid, g.id) === 'revisore') ? 'revisore' : null; }
  revAfterGiro(g){ if(!this.sql14) return; const a = this.t.pee_revisioni.find(x => x.archivio_id === g.archivio_id && x.stato === 'aperta'); if(a){ a.ultimo_giro_id = g.id; } else this.t.pee_revisioni.push({id:'rev' + Math.random().toString(36).slice(2), archivio_id:g.archivio_id, owner_id:g.owner_id, revisore_email:null, stato:'aperta', fase:'revisore', esito:null, primo_giro_id:g.id, ultimo_giro_id:g.id, nota_chiusura:'', aperta_il:now(), chiusa_il:null}); }
  revAfterNota(r, old){ if(!this.sql14 || r.tipo !== 'nota' || r.autore_ruolo === 'titolare' || !r.testo) return; const g = this.t.pee_giri.find(x => x.id === r.giro_id); const v = g && this.t.pee_revisioni.find(x => x.archivio_id === g.archivio_id && x.stato === 'aperta'); if(!v) return;
    let pu = this.t.pee_revisioni_punto.find(x => x.revisione_id === v.id && x.chiave === r.chiave);
    if(!old || old.testo !== r.testo){ if(!pu) this.t.pee_revisioni_punto.push({revisione_id:v.id, chiave:r.chiave, stato:'da_fare', nota:'', updated_at:now()}); else if(pu.stato !== 'da_fare'){ pu.stato = 'da_fare'; pu.nota = ''; } }
    else if(r.recepita && !old.recepita && pu && pu.stato === 'da_fare') pu.stato = 'fatto'; else if(!r.recepita && old.recepita && pu && pu.stato === 'fatto') pu.stato = 'da_fare'; }
  revRpc(name, a, uid){ if(!this.sql14) return this.err('PGRST202', 'Could not find the function'); const v = this.t.pee_revisioni.find(x => x.id === a.r); const ru = v ? this.revRuolo(uid, v.id) : null; const E = m => this.err('P0001', m);
    if(name === 'pee_rev_ritira'){ if(ru !== 'revisore') return E('Solo il revisore'); if(!v || v.stato !== 'aperta' || v.fase !== 'revisore') return E('Non è il tuo turno'); const PU = this.t.pee_revisioni_punto, i = PU.findIndex(x => x.revisione_id === v.id && x.chiave === a.k && x.stato === 'da_fare'); if(i < 0) return E('Questa richiesta non si può ritirare'); PU.splice(i, 1); return {data:null}; }
    if(name === 'pee_rev_riapri'){ if(ru !== 'revisore') return E('Solo il revisore'); if(!String(a.n || '').trim()) return E('Scrivi perché riapri la revisione'); if(!v || v.stato !== 'chiusa' || v.esito !== 'approvata') return E('La revisione non è approvata'); v.stato = 'aperta'; v.fase = 'revisore'; v.esito = null; v.chiusa_il = null; v.nota_chiusura = 'Riaperta: ' + String(a.n).trim().slice(0, 590); return {data:null, error:null}; }
    if(!ru || v.stato !== 'aperta') return E('Revisione non disponibile'); const P = this.t.pee_revisioni_punto.filter(x => x.revisione_id === v.id);
    if(name === 'pee_rev_punto'){ const cur = P.find(x => x.chiave === a.k);
      if(ru === 'titolare'){ if(!['fatto','attesa'].includes(a.s) || !cur) return E('Azione non consentita'); if(cur.stato === 'confermato') return E('Punto già confermato dal revisore'); }
      else { if(!['da_fare','confermato'].includes(a.s)) return E('Azione non consentita'); }
      if(cur){ cur.stato = a.s; if(a.n) cur.nota = String(a.n).slice(0, 300); cur.updated_at = now(); } else this.t.pee_revisioni_punto.push({revisione_id:v.id, chiave:a.k, stato:a.s, nota:a.n || '', updated_at:now()}); return {data:null, error:null}; }
    if(name === 'pee_rev_ho_finito'){ if(ru !== 'titolare') return E('Solo chi ha scritto il progetto'); if(v.fase !== 'compilatore') return E('Non è il tuo turno'); if(P.some(x => x.stato === 'da_fare')) return E('Ci sono ancora punti da fare'); v.fase = 'revisore'; return {data:null, error:null}; }
    if(name === 'pee_rev_rimanda'){ if(ru !== 'revisore') return E('Solo il revisore'); if(v.fase !== 'revisore') return E('Non è il tuo turno'); if(!P.some(x => ['da_fare','attesa'].includes(x.stato))) return E('Nessun punto da riaprire: puoi approvare'); v.fase = 'compilatore'; return {data:null, error:null}; }
    if(name === 'pee_rev_approva'){ if(ru !== 'revisore') return E('Solo il revisore'); if(v.fase !== 'revisore') return E('Non è il tuo turno'); if(P.some(x => x.stato !== 'confermato')) return E('Ci sono punti non ancora confermati'); v.stato = 'chiusa'; v.esito = 'approvata'; v.nota_chiusura = String(a.n || '').slice(0, 600); v.chiusa_il = now(); return {data:null, error:null}; }
    return this.err('PGRST202', 'Could not find the function'); }
  user(id){ return this.users.find(u => u.id === id); }
  pubUser(u){ return u ? {id:u.id, email:u.email, user_metadata:Object.assign({}, u.meta), new_email:u.pending||undefined} : null; }
  addUser(email, password = 'password123', nome = ''){ const u = {id:uuid(), email:email.toLowerCase(), password, meta: nome ? {nome} : {}}; this.users.push(u); return u; }
  myEmail(uid){ const u = this.user(uid); return u ? u.email : null; }
  revAbil(em){ return this.revAperto || this.ammessi.includes(String(em||'').toLowerCase()); }
  giroRuolo(uid, g){ const em = this.myEmail(uid); const d = this.t.pee_giri_dest.find(x => x.giro_id === g && x.email === em && (x.ruolo === 'copia' || this.revAbil(x.email))); return d ? d.ruolo : null; }
  isOwner(uid, a){ return this.t.pee_archivi.some(r => r.id === a && r.user_id === uid); }
  mem(uid, a){ const em = this.myEmail(uid); return this.t.pee_membri.find(m => m.archivio_id === a && m.email === em); }
  // vincolo pee_membri_ruolo_check: dopo lo script del 20 novembre ammette anche «commissario» (db.sqlComm = false per provare il database non aggiornato)
  // vincolo reale di pee_profili.ruolo (verificato in Supabase il 23/11); con sqlFigure = true vale quello allargato dallo script del 23 novembre
  ruoloProfiloAmmesso(r){ return !r || ['cu','vcu','cg','cds','senior','volontario'].includes(r) || (this.sqlFigure !== false && ['cos','coords','vcg','vcds'].includes(r)); }
  ruoloAmmesso(r){ return ['lettore','cotitolare','collaboratore'].includes(r) || (r === 'commissario' && this.sqlComm !== false); }
  // piani (SQL del 23 novembre): db.sqlPiani = false per provare il database non aggiornato
  pRuolo(uid, p){ const pi = this.t.pee_piani.find(x => x.id === p); if(!pi) return null; if(pi.owner_id === uid) return 'titolare'; const m = this.t.pee_piani_membri.find(x => x.piano_id === p && x.email === this.myEmail(uid)); return m ? m.ruolo : null; }
  pCoord(uid, p){ return ['titolare','cotitolare'].includes(this.pRuolo(uid, p)); }
  giroRec(g){ return this.t.pee_piani_giri.find(x => x.id === g) || null; }
  giroAperto(g){ const x = this.giroRec(g); return !!x && x.stato === 'aperto'; }
  giroVedoAltri(uid, g){ const x = this.giroRec(g); return !!(x && x.stato === 'chiuso') || this.t.pee_piani_contributi.some(c => c.giro_id === g && c.autore_id === uid && c.tipo === 'carte' && c.consegnato); }
  giroPersonaLeggibile(g){ const x = this.giroRec(g); return !!(x && x.stato === 'chiuso') && this.t.pee_piani_giri_persona.filter(y => y.giro_id === g).length >= 4; }
  pEdit(uid, p){ return ['titolare','cotitolare','collaboratore'].includes(this.pRuolo(uid, p)); }
  canEdit(uid, a){ const m = this.mem(uid, a); return !!(m && (m.ruolo === 'cotitolare' || m.ruolo === 'collaboratore')); }
  isCot(uid, a){ const m = this.mem(uid, a); return !!(m && m.ruolo === 'cotitolare'); }
  canSee(uid, table, r){
    const em = this.myEmail(uid);
    switch(table){
      case 'pee_archivi': return r.user_id === uid || !!this.mem(uid, r.id);
      case 'pee_membri': return this.isOwner(uid, r.archivio_id) || r.email === em || this.isCot(uid, r.archivio_id);
      case 'pee_versioni': return r.user_id === uid || this.canEdit(uid, r.archivio_id);
      case 'pee_suggerimenti': return this.isOwner(uid, r.archivio_id) || (r.user_id === uid && !!this.mem(uid, r.archivio_id)) || (this.sql13 && (this.isCot(uid, r.archivio_id) || (r.dest && r.dest === em)));
      case 'pee_giri': return r.owner_id === uid || !!this.giroRuolo(uid, r.id);
      case 'pee_giri_dest': return r.email === em || this.t.pee_giri.some(g => g.id === r.giro_id && g.owner_id === uid);
      case 'pee_giri_rev': return this.t.pee_giri.some(g => g.id === r.giro_id && g.owner_id === uid) || (r.user_id === uid && !!this.giroRuolo(uid, r.giro_id));
      case 'pee_giri_msg': return this.isOwner(uid, r.archivio_id) || r.rev_id === uid;
      case 'pee_revisioni': return this.revRuolo(uid, r.id) !== null;
      case 'pee_revisioni_punto': return this.revRuolo(uid, r.revisione_id) !== null;
      case 'pee_piani': return r.owner_id === uid || this.pRuolo(uid, r.id) !== null;
      case 'pee_piani_membri': return r.email === em || ['titolare','cotitolare'].includes(this.pRuolo(uid, r.piano_id));
      case 'pee_piani_versioni': return this.pRuolo(uid, r.piano_id) !== null;
      case 'pee_piani_giri': return this.pRuolo(uid, r.piano_id) !== null;
      case 'pee_piani_contributi': return r.autore_id === uid || (r.consegnato && this.pRuolo(uid, r.piano_id) !== null && this.giroVedoAltri(uid, r.giro_id));
      case 'pee_piani_giri_persona': return r.user_id === uid || this.pCoord(uid, r.piano_id);
      case 'pee_piani_voci_anonime': return this.pCoord(uid, r.piano_id) && this.giroPersonaLeggibile(r.giro_id);
      case 'pee_piani_giri_registro': return this.pCoord(uid, r.piano_id);
      case 'pee_gruppi': return true;
      case 'pee_profili': return r.user_id === uid;
      case 'pee_archivio_nazionale': return r.stato === 'approvata' || r.autore_id === uid || em === 'luca.bartolomei@cngei.it';
      default: return false;
    }
  }
  match(r, f){ return f.every(([op, c, v]) => op === 'eq' ? String(r[c]) === String(v) : op === 'neq' ? String(r[c]) !== String(v) : op === 'gt' ? String(r[c]) > String(v) : op === 'lt' ? (typeof r[c] === 'number' ? r[c] < Number(v) : String(r[c]) < String(v)) : op === 'in' ? v.map(String).includes(String(r[c])) : op === 'is' ? (r[c] ?? null) === v : op === 'not' ? !(v[0] === 'is' ? (r[c] ?? null) === v[1] : String(r[c]) === String(v[1])) : true); }
  pick(r, cols){ if(!cols || cols === '*') return Object.assign({}, r); const o = {}; cols.split(',').map(s => s.trim()).forEach(c => { if(c in r) o[c] = r[c]; else o[c] = null; }); return o; }
  err(code, message){ return {data:null, error:{code, message}}; }
  emit(table, event, row, old){ for(const p of this.pages){ try{ const uid = p.__uid && p.__uid(); if(!uid || !this.canSee(uid, table, row)) continue; p.evaluate(m => window.__sbEmit && window.__sbEmit(m), {kind:'pg', table, event, row, old}).catch(() => {}); }catch(e){} } }
  async handle(req, page){
    const uid = req.uid;
    if(this.offline) return {error:{message:'TypeError: Failed to fetch'}}; // rete assente (test t_offline)
    this.log.push(req.kind + (req.q ? ':' + req.q.op + ':' + req.q.table : '') + (req.name ? ':' + req.name : ''));
    if(req.kind === 'login'){ const u = this.users.find(x => x.email === String(req.email).toLowerCase() && x.password === req.password); return u ? {user:this.pubUser(u)} : {error:{message:'Invalid login credentials'}}; }
    if(req.kind === 'signup'){ if(this.users.some(x => x.email === String(req.email).toLowerCase())) return {error:{message:'User already registered'}}; const u = this.addUser(req.email, req.password, (req.data||{}).nome); return {user:this.pubUser(u)}; }
    if(req.kind === 'reset'){ this.mails.push({to:String(req.email).toLowerCase(), tipo:'reset', redirectTo:req.redirectTo}); return {}; }
    if(req.kind === 'me'){ return {user:this.pubUser(this.user(uid))}; }
    const u = this.user(uid);
    if(req.kind === 'updateUser'){ if(!u) return {error:{message:'not logged'}}; const v = req.v || {};
      if(v.data) Object.assign(u.meta, v.data); if(v.password) u.password = v.password;
      if(v.email){ if(this.users.some(x => x.email === v.email.toLowerCase() && x !== u)) return {error:{message:'A user with this email address has already been registered'}}; u.pending = v.email.toLowerCase(); this.mails.push({to:u.pending, tipo:'cambio-email', old:u.email}); }
      return {user:this.pubUser(u)}; }
    if(req.kind === 'track'){ const ch = this.presence[req.channel] || (this.presence[req.channel] = {}); ch[req.key] = [req.payload];
      for(const p of this.pages) p.evaluate(m => window.__sbEmit && window.__sbEmit(m), {kind:'presence', channel:req.channel, state:ch}).catch(() => {}); return 'ok'; }
    if(req.kind === 'rpc'){
      if(!u) return this.err('42501', 'not logged');
      if(/^pee_rev_(punto|ho_finito|rimanda|approva|riapri|ritira)$/.test(req.name)) return this.revRpc(req.name, req.args, uid);
      if(req.name === 'revisore_abilitato') return {data:this.revAbil(req.args.em), error:null};
      if(req.name === 'pee_piano_segna_visto'){ if(this.sqlPiani === false) return this.err('PGRST202', 'Could not find the function'); const m = this.t.pee_piani_membri.find(x => x.id === req.args.m && x.email === u.email); if(m){ m.visto_il = now(); this.emit('pee_piani_membri', 'UPDATE', m); } return {data:null, error:null}; }
      if(/^pee_piano_giro_(apri|scadenza|stato|chiudi|persona)$/.test(req.name)) return this.giroRpc(req.name, req.args, uid, u);
      if(req.name === 'pee_segna_visto'){ const m = this.t.pee_membri.find(x => x.id === req.args.m && x.email === u.email); if(m){ m.visto_il = now(); this.emit('pee_membri', 'UPDATE', m); } return {data:null, error:null}; }
      if(req.name === 'pee_prepara_cambio_email'){ if(!this.sql13) return this.err('PGRST202', 'Could not find the function'); const nuova = String(req.args.nuova||'').toLowerCase(); this.t.pee_cambi_email = this.t.pee_cambi_email.filter(x => x.user_id !== uid); this.t.pee_cambi_email.push({user_id:uid, vecchia:u.email, nuova}); return {data:null, error:null}; }
      if(req.name === 'pee_completa_cambio_email'){ if(!this.sql13) return this.err('PGRST202', 'Could not find the function'); const c = this.t.pee_cambi_email.find(x => x.user_id === uid && x.nuova === u.email); if(!c) return {data:0, error:null};
        let n = 0; this.t.pee_membri.filter(m => m.email === c.vecchia).forEach(m => { m.email = u.email; m.email_prima = c.vecchia; n++; this.emit('pee_membri', 'UPDATE', m); });
        this.t.pee_cambi_email = this.t.pee_cambi_email.filter(x => x !== c); return {data:n, error:null}; }
      return this.err('PGRST202', 'Could not find the function ' + req.name);
    }
    if(req.kind !== 'query') return {error:{message:'?'}};
    const q = req.q, T = this.t[q.table]; if(!T || (/^pee_piani/.test(q.table) && this.sqlPiani === false) || (/^pee_piani_(giri|contributi|voci_anonime)/.test(q.table) && this.sqlGiri === false)) return this.err('42P01', 'relation "public.' + q.table + '" does not exist');
    if(!u && q.table !== 'pee_gruppi') return this.err('42501', 'permission denied');
    const vis = r => this.canSee(uid, q.table, r);
    const cols = c => { if(q.table === 'pee_membri' && /ruolo|visto_il/.test(c||'') && this.noRoles) return 'x'; if(q.table === 'pee_membri' && /email_prima/.test(c||'') && !this.sql13) return 'x'; if(q.table === 'pee_suggerimenti' && /risposta/.test(c||'') && this.sqlRisp === false) return 'x'; return null; };
    if(q.op === 'select'){
      if(cols(q.cols)) return this.err('42703', 'column does not exist');
      let rows = T.filter(r => vis(r) && this.match(r, q.filters));
      if(q.order){ const [c, asc] = q.order; rows.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); }
      if(q.limit) rows = rows.slice(0, q.limit);
      rows = rows.map(r => this.pick(r, q.cols));
      if(q.single) return {data: rows[0] || null, error:null};
      return {data:rows, error:null};
    }
    if(q.op === 'upsert'){
      const list = Array.isArray(q.vals) ? q.vals : [q.vals];
      for(const v0 of list){
        if(q.table === 'pee_profili'){
          const v = Object.assign({}, v0, {user_id: uid}); let r = T.find(x => x.user_id === uid);
          if(!this.ruoloProfiloAmmesso(v.ruolo)) return this.err('23514', 'new row for relation "pee_profili" violates check constraint "pee_profili_ruolo_check"');
          if(!r){ r = Object.assign({created_at:now(), dashboard:{}}, v); T.push(r); } else Object.assign(r, v); r.updated_at = now();
        } else if(q.table === 'pee_gruppi'){
          if(!T.some(x => x.sezione === v0.sezione && x.gruppo === v0.gruppo)) T.push(Object.assign({}, v0));
        } else return this.err('42501', 'permission denied');
      }
      return {data:null, error:null};
    }
    if(q.op === 'insert'){
      const list = Array.isArray(q.vals) ? q.vals : [q.vals]; const out = [];
      for(const v0 of list){
        const r = Object.assign({id:uuid(), created_at:now()}, v0);
        if(q.table === 'pee_archivi'){ r.user_id = uid; r.updated_at = r.created_at; r.meta = r.meta||{}; r.data = r.data||{};
          if(T.some(x => x.user_id === uid && x.anno === r.anno && x.titolo === r.titolo)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        if(q.table === 'pee_membri'){ r.owner_id = uid; r.ruolo = r.ruolo || 'lettore'; r.visto_il = null; r.email_prima = null;
          if(!this.ruoloAmmesso(r.ruolo)) return this.err('23514', 'new row for relation "pee_membri" violates check constraint "pee_membri_ruolo_check"');
          const ok = this.isOwner(uid, r.archivio_id) || (this.isCot(uid, r.archivio_id) && ['lettore','collaboratore'].includes(r.ruolo));
          if(!ok) return this.err('42501', 'new row violates row-level security policy');
          if(T.some(x => x.archivio_id === r.archivio_id && x.email === r.email)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        if(q.table === 'pee_giri'){ r.owner_id = uid; if(!this.isOwner(uid, r.archivio_id)) return this.err('42501', 'new row violates row-level security policy');
          r.n = Math.max(T.filter(x => x.archivio_id === r.archivio_id).reduce((m, x) => Math.max(m, x.n), 0) + 1, r.n || 0); }
        if(q.table === 'pee_giri_dest'){ if(!this.t.pee_giri.some(g => g.id === r.giro_id && g.owner_id === uid)) return this.err('42501', 'new row violates row-level security policy');
          if(r.ruolo === 'revisore' && !this.revAbil(r.email)) return this.err('42501', 'new row violates row-level security policy');
          if(r.ruolo === 'revisore' && this.sql14){ const gg = this.t.pee_giri.find(x => x.id === r.giro_id), vv = gg && this.t.pee_revisioni.find(x => x.archivio_id === gg.archivio_id && x.stato === 'aperta'); if(vv){ if(!vv.revisore_email) vv.revisore_email = r.email; else if(vv.revisore_email !== r.email) return this.err('P0001', 'Il revisore di questa revisione è già stato scelto'); } }
          if(T.some(x => x.giro_id === r.giro_id && x.email === r.email)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        if(q.table === 'pee_giri_msg'){ r.user_id = uid; r.id = r.id || ('m' + Math.random().toString(36).slice(2)); r.created_at = now(); const ow = this.isOwner(uid, r.archivio_id), rv = r.rev_id === uid && this.t.pee_giri.some(g => g.archivio_id === r.archivio_id && this.giroRuolo(uid, g.id) === 'revisore');
          if(!((r.autore_ruolo === 'titolare' && ow) || (r.autore_ruolo === 'revisore' && rv))) return this.err('42501', 'new row violates row-level security policy'); }
        if(q.table === 'pee_giri_rev'){ r.user_id = uid; r.id = r.id || ('r' + Math.random().toString(36).slice(2)); r.recepita = false; r.updated_at = now(); const ro = this.giroRuolo(uid, r.giro_id), ow = this.t.pee_giri.some(g => g.id === r.giro_id && g.owner_id === uid);
          if(!ro && !ow) return this.err('42501', 'new row violates row-level security policy'); if(ro === 'copia' && r.tipo !== 'nota') return this.err('42501', 'new row violates row-level security policy');
          if(r.tipo === 'check' && !['si','parz','no',''].includes(r.valore)) return this.err('23514', 'check constraint'); }
        if(q.table === 'pee_versioni'){ r.user_id = uid; if(!(this.isOwner(uid, r.archivio_id) || this.canEdit(uid, r.archivio_id))) return this.err('42501', 'new row violates row-level security policy'); }
        if(q.table === 'pee_suggerimenti'){ r.user_id = uid; r.stato = r.stato || 'nuovo';
          const ok = (this.mem(uid, r.archivio_id) || (this.sql13 && this.isOwner(uid, r.archivio_id))) && r.stato === 'nuovo';
          if(!ok) return this.err('42501', 'new row violates row-level security policy');
          if(r.dest && !this.sql13) return this.err('42703', 'column "dest" does not exist'); }
        if(q.table === 'pee_archivio_nazionale'){ r.autore_id = uid; r.stato = v0.stato || 'in_attesa'; if(r.stato !== 'in_attesa') return this.err('42501', 'new row violates row-level security policy'); r.approvata_il = null; r.approvata_da = null; if(!r.titolo || r.titolo.length < 3 || r.titolo.length > 140) return this.err('23514', 'check constraint'); }
        if(q.table === 'pee_piani'){ r.owner_id = uid; r.owner_email = u.email; r.rev = 1; r.updated_at = r.created_at; r.updated_by = uid; r.updated_by_nome = (u.meta && u.meta.nome) || '';
          r.titolo = r.titolo || ''; r.durata = r.durata || 3; r.stato = r.stato || 'bozza'; r.data = r.data || {}; r.archivio_id = r.archivio_id || null;
          if(!['gruppo','clan','sezione'].includes(r.tipo) || ![3,4].includes(r.durata) || !(r.anno_inizio >= 2020 && r.anno_inizio <= 2100) || !['bozza','deliberato','approvato'].includes(r.stato) || r.titolo.length > 160) return this.err('23514', 'new row for relation "pee_piani" violates check constraint');
          if(JSON.stringify(r.data).length > 2000000) return this.err('23514', 'new row for relation "pee_piani" violates check constraint "pee_piani_data_check"');
          if(r.archivio_id && !this.isOwner(uid, r.archivio_id)) return this.err('P0001', 'Il piano si può collegare solo a un tuo progetto'); }
        if(q.table === 'pee_piani_membri'){ r.invitato_da = uid; r.ruolo = r.ruolo || 'lettore'; r.visto_il = null; r.etichetta = r.etichetta || ''; r.nome = r.nome || '';
          if(!['lettore','collaboratore','cotitolare'].includes(r.ruolo) || r.email !== String(r.email).toLowerCase()) return this.err('23514', 'new row for relation "pee_piani_membri" violates check constraint');
          const pr = this.pRuolo(uid, r.piano_id); const okm = pr === 'titolare' || (pr === 'cotitolare' && r.ruolo !== 'cotitolare');
          if(!okm) return this.err('42501', 'new row violates row-level security policy');
          if(T.some(x => x.piano_id === r.piano_id && x.email === r.email)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        if(q.table === 'pee_piani_versioni'){ r.autore_id = uid; r.autore_nome = (u.meta && u.meta.nome) || ''; r.nota = r.nota || ''; r.stato = r.stato || 'bozza'; r.motivo = r.motivo || 'manuale';
          if(!this.pEdit(uid, r.piano_id)) return this.err('42501', 'new row violates row-level security policy');
          if(!['manuale','stato','verifica','aggiornamento','staffetta','auto'].includes(r.motivo)) return this.err('23514', 'new row for relation "pee_piani_versioni" violates check constraint');
          r.n = T.filter(x => x.piano_id === r.piano_id).reduce((m, x) => Math.max(m, x.n), 0) + 1; }
        if(q.table === 'pee_piani_giri' || q.table === 'pee_piani_giri_persona' || q.table === 'pee_piani_voci_anonime' || q.table === 'pee_piani_giri_registro') return this.err('42501', 'new row violates row-level security policy');
        if(q.table === 'pee_piani_contributi'){ const gp = this.giroRec(r.giro_id); if(!gp) return this.err('P0001', 'Giro non trovato');
          r.piano_id = gp.piano_id; r.autore_id = uid; r.autore_nome = (u.meta && u.meta.nome) || ''; r.updated_at = r.created_at; r.data = r.data || {}; r.consegnato = !!r.consegnato; r.consegnato_il = r.consegnato ? now() : null;
          if(this.pRuolo(uid, gp.piano_id) === null || gp.stato !== 'aperto') return this.err('42501', 'new row violates row-level security policy');
          if(!['carte','unita'].includes(r.tipo) || JSON.stringify(r.data).length > 100000) return this.err('23514', 'new row for relation "pee_piani_contributi" violates check constraint');
          if(T.some(x => x.giro_id === r.giro_id && x.autore_id === uid && x.tipo === r.tipo)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        T.push(r); out.push(r); if(q.table === 'pee_giri') this.revAfterGiro(r); if(q.table === 'pee_giri_rev') this.revAfterNota(r, null); this.emit(q.table, 'INSERT', r);
      }
      const rows = out.map(r => this.pick(r, q.ret || '*'));
      return {data: q.single ? rows[0] : rows, error:null};
    }
    if(q.op === 'update'){
      const rows = T.filter(r => vis(r) && this.match(r, q.filters)); const out = [];
      for(const r of rows){
        let ok = false;
        if(q.table === 'pee_archivi'){ ok = r.user_id === uid || this.canEdit(uid, r.id);
          if(ok && r.user_id !== uid && (('anno' in q.vals && q.vals.anno !== r.anno) || ('titolo' in q.vals && q.vals.titolo !== r.titolo))) return this.err('P0001', 'Solo chi ha creato il progetto può cambiarne anno, titolo o proprietario'); }
        if(q.table === 'pee_membri' && q.vals.ruolo && !this.ruoloAmmesso(q.vals.ruolo)) return this.err('23514', 'new row for relation "pee_membri" violates check constraint "pee_membri_ruolo_check"');
        if(q.table === 'pee_membri') ok = this.isOwner(uid, r.archivio_id) || (this.isCot(uid, r.archivio_id) && r.ruolo !== 'cotitolare' && (!q.vals.ruolo || ['lettore','collaboratore'].includes(q.vals.ruolo)));
        if(q.table === 'pee_giri_rev'){ const ow = this.t.pee_giri.some(g => g.id === r.giro_id && g.owner_id === uid); ok = (r.user_id === uid && !('recepita' in q.vals)) || (ow && Object.keys(q.vals).every(k => k === 'recepita' || k === 'recepita_il')); }
        if(q.table === 'pee_suggerimenti'){ ok = this.isOwner(uid, r.archivio_id) || (this.sql13 && r.dest && r.dest === u.email && Object.keys(q.vals).every(k => k === 'stato'));
          const kk = Object.keys(q.vals), rk = kk.some(k => /^risposta/.test(k));
          if(rk && this.sqlRisp === false) return this.err('42703', 'column "risposta" of relation "pee_suggerimenti" does not exist');
          if(!ok && rk && this.isCot(uid, r.archivio_id) && kk.every(k => ['stato','risposta','risposta_da'].includes(k))) ok = true;
          if(ok && rk){
            if(kk.some(k => ['risposta_il'].includes(k))) return this.err('P0001', 'La risposta si cambia scrivendo il testo della risposta');
            if(q.vals.risposta != null && (String(q.vals.risposta).length < 1 || String(q.vals.risposta).length > 2000)) return this.err('23514', 'new row violates check constraint "pee_sugg_risposta_check"');
            if('risposta' in q.vals){ q.vals = Object.assign({}, q.vals, {risposta_il: q.vals.risposta == null ? null : now()}); if(q.vals.risposta == null) q.vals.risposta_da = null; }
            else return this.err('P0001', 'La risposta si cambia scrivendo il testo della risposta'); } }
        if(q.table === 'pee_archivio_nazionale') ok = u.email === 'luca.bartolomei@cngei.it';
        if(q.table === 'pee_piani'){ ok = this.pEdit(uid, r.id); if(ok){
          if('rev' in q.vals && q.vals.rev !== r.rev) return this.err('40001', 'Il piano è stato modificato da un\'altra persona: ricarica prima di salvare');
          if('tipo' in q.vals && q.vals.tipo !== r.tipo) return this.err('P0001', 'Il tipo di piano non si cambia');
          if('owner_id' in q.vals && q.vals.owner_id !== r.owner_id) return this.err('P0001', 'Il piano ha un solo titolare: non si cambia da qui');
          if('archivio_id' in q.vals && q.vals.archivio_id !== r.archivio_id && r.owner_id !== uid) return this.err('P0001', 'Solo il titolare collega il piano a un progetto');
          if(this.pRuolo(uid, r.id) === 'collaboratore'){
            if(['titolo','anno_inizio','durata','stato'].some(k => k in q.vals && q.vals[k] !== r[k])) return this.err('P0001', 'Un collaboratore non può cambiare titolo, periodo o stato del piano');
            if('data' in q.vals && Object.keys(r.data).some(k => !(k in (q.vals.data || {})))) return this.err('P0001', 'Un collaboratore non può eliminare parti del piano'); }
          if('data' in q.vals && JSON.stringify(q.vals.data).length > 2000000) return this.err('23514', 'new row for relation "pee_piani" violates check constraint "pee_piani_data_check"');
          q.vals = Object.assign({}, q.vals, {rev: r.rev + 1, updated_at: now(), updated_by: uid, updated_by_nome: (u.meta && u.meta.nome) || ''}); } }
        if(q.table === 'pee_piani_membri'){ const pr = this.pRuolo(uid, r.piano_id); ok = pr === 'titolare' || (pr === 'cotitolare' && r.ruolo !== 'cotitolare' && (!q.vals.ruolo || ['lettore','collaboratore'].includes(q.vals.ruolo)));
          if(q.vals.ruolo && !['lettore','collaboratore','cotitolare'].includes(q.vals.ruolo)) return this.err('23514', 'new row for relation "pee_piani_membri" violates check constraint'); }
        if(q.table === 'pee_piani_versioni') return this.err('P0001', 'Una versione dello storico non si modifica');
        if(q.table === 'pee_piani_giri' || q.table === 'pee_piani_giri_persona' || q.table === 'pee_piani_voci_anonime' || q.table === 'pee_piani_giri_registro') continue;
        if(q.table === 'pee_piani_contributi'){ ok = r.autore_id === uid && this.giroAperto(r.giro_id);
          if(ok){ if('data' in q.vals && JSON.stringify(q.vals.data).length > 100000) return this.err('23514', 'new row for relation "pee_piani_contributi" violates check constraint');
            const nv = Object.assign({}, q.vals); ['giro_id','autore_id','autore_nome','tipo','piano_id'].forEach(k => delete nv[k]);
            const cons = 'consegnato' in nv ? !!nv.consegnato : r.consegnato; nv.consegnato = cons; nv.consegnato_il = cons ? (r.consegnato ? r.consegnato_il : now()) : null; nv.updated_at = now(); q.vals = nv; } }
        if(!ok) continue;
        const old = Object.assign({}, r);
        const changed = q.table === 'pee_archivi' && 'data' in q.vals && JSON.stringify(q.vals.data) !== JSON.stringify(r.data);
        Object.assign(r, JSON.parse(JSON.stringify(q.vals)));
        if(q.table === 'pee_giri_rev') this.revAfterNota(r, old);
        if(changed) r.updated_at = now();
        out.push(r); this.emit(q.table, 'UPDATE', r, old);
      }
      const outRows = out.map(r => this.pick(r, q.ret || '*'));
      return {data: q.single ? (outRows[0] || null) : outRows, error:null};
    }
    if(q.op === 'delete'){
      const rows = T.filter(r => vis(r) && this.match(r, q.filters));
      for(const r of rows){
        let ok = false;
        if(q.table === 'pee_archivi') ok = r.user_id === uid;
        if(q.table === 'pee_membri') ok = this.isOwner(uid, r.archivio_id) || r.email === u.email || (this.isCot(uid, r.archivio_id) && r.ruolo !== 'cotitolare');
        if(q.table === 'pee_versioni') ok = r.user_id === uid;
        if(q.table === 'pee_giri') ok = r.owner_id === uid;
        if(q.table === 'pee_giri_rev') ok = r.user_id === uid;
        if(q.table === 'pee_suggerimenti') ok = r.user_id === uid || this.isOwner(uid, r.archivio_id);
        if(q.table === 'pee_archivio_nazionale') ok = (r.autore_id === uid && r.stato !== 'approvata') || u.email === 'luca.bartolomei@cngei.it';
        if(q.table === 'pee_piani') ok = r.owner_id === uid;
        if(q.table === 'pee_piani_membri'){ const pr = this.pRuolo(uid, r.piano_id); ok = pr === 'titolare' || r.email === u.email || (pr === 'cotitolare' && r.ruolo !== 'cotitolare'); }
        if(q.table === 'pee_piani_versioni') ok = this.pRuolo(uid, r.piano_id) === 'titolare';
        if(q.table === 'pee_piani_contributi') ok = r.autore_id === uid && !r.consegnato && this.giroAperto(r.giro_id);
        if(!ok) continue;
        if(q.table === 'pee_piani'){ this.t.pee_piani_membri = this.t.pee_piani_membri.filter(x => x.piano_id !== r.id); this.t.pee_piani_versioni = this.t.pee_piani_versioni.filter(x => x.piano_id !== r.id); ['pee_piani_giri','pee_piani_contributi','pee_piani_giri_persona','pee_piani_voci_anonime','pee_piani_giri_registro'].forEach(k => { this.t[k] = this.t[k].filter(x => x.piano_id !== r.id); }); }
        T.splice(T.indexOf(r), 1); this.emit(q.table, 'DELETE', r, r);
      }
      return {data:null, error:null};
    }
  }
  // funzioni del giro (SQL del 24 novembre): db.sqlGiri = false per provare il database non aggiornato
  giroStato(g){ const gi = this.giroRec(g), p = gi.piano_id, pi = this.t.pee_piani.find(x => x.id === p), P = [];
    const un = em => this.users.find(x => x.email === em);
    const add = (em, nm, et, ru) => { const us = un(em); const id = us ? us.id : null;
      P.push({email:em, nome:nm, etichetta:et, ruolo:ru,
        carte: !!id && this.t.pee_piani_contributi.some(c => c.giro_id === g && c.autore_id === id && c.tipo === 'carte' && c.consegnato),
        unita: !!id && this.t.pee_piani_contributi.some(c => c.giro_id === g && c.autore_id === id && c.tipo === 'unita' && c.consegnato),
        persona: !!id && this.t.pee_piani_giri_persona.some(c => c.giro_id === g && c.user_id === id)}); };
    const ow = this.users.find(x => x.id === pi.owner_id); add(ow.email, (ow.meta && ow.meta.nome) || '', '', 'titolare');
    this.t.pee_piani_membri.filter(m => m.piano_id === p).forEach(m => add(m.email, m.nome || '', m.etichetta || '', m.ruolo));
    return P.sort((a, b) => (a.nome + a.email > b.nome + b.email ? 1 : -1)); }
  giroRpc(name, a, uid, u){
    if(this.sqlGiri === false) return this.err('PGRST202', 'Could not find the function ' + name);
    const E = m => this.err('P0001', m); const G = this.t.pee_piani_giri;
    if(name === 'pee_piano_giro_apri'){ const p = a.p; if(!this.pCoord(uid, p)) return E('Solo il titolare o un co-titolare apre un giro');
      if(G.some(x => x.piano_id === p && x.stato === 'aperto')) return E('C\'è già un giro aperto: chiudilo prima di aprirne un altro');
      const ritmo = a.ritmo_ || 'standard', fase = a.fase_ || 'giro1';
      if(!['rapido','standard','bivacco'].includes(ritmo) || !['giro1','giro2'].includes(fase)) return this.err('23514', 'new row for relation "pee_piani_giri" violates check constraint');
      const r = {id:uuid(), piano_id:p, n:G.filter(x => x.piano_id === p).reduce((m, x) => Math.max(m, x.n), 0) + 1, ritmo, fase, stato:'aperto', scadenza:a.scadenza_ || null, aperto_da:uid, aperto_il:now(), chiuso_il:null, chiusura_tipo:null};
      G.push(r); this.emit('pee_piani_giri', 'INSERT', r); return {data:r.id, error:null}; }
    const gi = this.giroRec(a.g);
    if(name === 'pee_piano_giro_scadenza'){ if(!gi || !this.pCoord(uid, gi.piano_id)) return E('Solo il titolare o un co-titolare cambia la scadenza');
      if(gi.stato === 'aperto'){ const old = Object.assign({}, gi); gi.scadenza = a.scadenza_ || null; this.emit('pee_piani_giri', 'UPDATE', gi, old); } return {data:null, error:null}; }
    if(name === 'pee_piano_giro_stato'){ if(!gi || !this.pCoord(uid, gi.piano_id)) return E('Solo il titolare o un co-titolare vede chi ha consegnato'); return {data:this.giroStato(a.g), error:null}; }
    if(name === 'pee_piano_giro_chiudi'){ if(!gi || !this.pCoord(uid, gi.piano_id)) return E('Solo il titolare o un co-titolare chiude il giro');
      if(gi.stato !== 'aperto') return E('Il giro è già chiuso'); const tipo = a.tipo_ || 'anticipata'; if(!['scadenza','anticipata','completa'].includes(tipo)) return E('Tipo di chiusura non valido');
      const S = this.giroStato(a.g), pk = x => ({email:x.email, nome:x.nome, etichetta:x.etichetta});
      this.t.pee_piani_giri_registro.push({giro_id:a.g, piano_id:gi.piano_id, data:{chiuso_da:(u.meta && u.meta.nome) || '', chiusura_tipo:tipo, chiuso_il:now(), senza_carte:S.filter(x => !x.carte).map(pk), senza_persona:S.filter(x => !x.persona).map(pk), risposte_persona:this.t.pee_piani_giri_persona.filter(x => x.giro_id === a.g).length}});
      const old = Object.assign({}, gi); gi.stato = 'chiuso'; gi.chiuso_il = now(); gi.chiusura_tipo = tipo; this.emit('pee_piani_giri', 'UPDATE', gi, old); return {data:null, error:null}; }
    if(name === 'pee_piano_giro_persona'){ if(!gi || this.pRuolo(uid, gi.piano_id) === null) return E('Non hai accesso a questo piano'); if(gi.stato !== 'aperto') return E('Il giro è chiuso');
      const V = a.voci; if(!Array.isArray(V) || V.length > 8) return E('Risposte non valide');
      if(this.t.pee_piani_giri_persona.some(x => x.giro_id === a.g && x.user_id === uid)) return E('Hai già risposto: le risposte anonime non si modificano');
      if(V.some(v => !['p1','p2','p3','p4','p5','p6','p7','p8'].includes(v.q) || (v.scelta || []).length > 8 || String(v.testo || '').length > 5000)) return this.err('23514', 'new row for relation "pee_piani_voci_anonime" violates check constraint');
      this.t.pee_piani_giri_persona.push({id:uuid(), giro_id:a.g, piano_id:gi.piano_id, user_id:uid, giorno:'2026-11-24'});
      V.forEach(v => { const sc = v.scelta || [], tx = String(v.testo || '').trim() ? String(v.testo).slice(0, 1500) : ''; if(sc.length || tx) this.t.pee_piani_voci_anonime.push({id:uuid(), giro_id:a.g, piano_id:gi.piano_id, q:v.q, scelta:sc, testo:tx, giorno:'2026-11-24'}); });
      return {data:null, error:null}; }
    return this.err('PGRST202', 'Could not find the function ' + name); }
  // conferma del cambio email (come se si cliccasse il link arrivato per posta)
  confirmEmail(oldEmail){ const u = this.users.find(x => x.email === oldEmail); if(u && u.pending){ u.email = u.pending; u.pending = null; } return u; }
}

export const ENGINES = {chromium, webkit, firefox};
export async function launch(engine = 'chromium'){
  const opt = engine === 'chromium' ? {executablePath: process.env.CHROME_BIN || undefined} : {};
  return ENGINES[engine].launch(opt);
}
// una "persona": contesto del browser con la sua memoria locale, collegato al finto database
export async function person(browser, db, opts = {}){
  const ctx = await browser.newContext(Object.assign({viewport:{width:1280, height:900}, locale:'it-IT', timezoneId:'Europe/Rome', acceptDownloads:true}, opts.ctx || {}));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase/, r => r.fulfill({status:200, contentType:'text/javascript', body:CLIENT}));
  const LIB = '/home/claude/work/libs/node_modules/';
  await ctx.route(/docx@8\.5\.0\/build\/index\.umd\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'docx/build/index.umd.js')}));
  await ctx.route(/docx-preview@0\.3\.3\/dist\/docx-preview\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'docx-preview/dist/docx-preview.min.js')}));
  await ctx.route(/exceljs\/4\.4\.0\/exceljs\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'exceljs/dist/exceljs.min.js')}));
  await ctx.route(/jszip\/3\.10\.1\/jszip\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'jszip/dist/jszip.min.js')}));
  await ctx.route(/jspdf\/2\.5\.1\/jspdf\.umd\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'jspdf/dist/jspdf.umd.min.js')}));
  await ctx.route(/mammoth@1\.6\.0\/mammoth\.browser\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'mammoth/mammoth.browser.min.js')}));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|api\.web3forms\.com|nominatim|osrm|maps\.google|www\.google\.com/, r => r.abort());
  // di norma i percorsi e le attività si presentano chiusi: i test li aprono da soli (KEEPCLOSED=1 per vederli chiusi)
  if(!process.env.KEEPCLOSED) await ctx.addInitScript(() => { const all = new Proxy({}, {get: () => true, set: () => true}); window._attOpen = all; window._pcOpen = all; window._verOpen = all; });
  // le domande di feedback non devono comparire nei test (SV=1 per provarle)
  if(!process.env.RT) await ctx.addInitScript(() => { window.__RT_OFF = true; });
  if(!process.env.NAC) await ctx.addInitScript(() => { try{ localStorage.setItem('bussola_nac_off', '1'); }catch(e){} });
  // niente animazioni nei test (su Firefox gli elementi «in movimento» fanno scadere i clic); ANIM=1 per lasciarle
  if(!process.env.ANIM) await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = '*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;scroll-behavior:auto!important}'; document.head.appendChild(s); }); });
  if(!process.env.SV) await ctx.addInitScript(() => { try{ localStorage.setItem('bussola_sv_off', '1'); }catch(e){} });
  await ctx.exposeBinding('__sb', async (src, req) => { if(db.delay) await new Promise(r => setTimeout(r, db.delay)); return db.handle(req, src.page); });
  const errors = [];
  ctx.on('page', p => wire(p));
  const wire = p => {
    db.pages.add(p); p.on('close', () => db.pages.delete(p));
    p.__uid = () => p.__uidv; p.on('pageerror', e => errors.push(String(e && e.stack || e)));
    p.on('dialog', d => { (p.__dialogs = p.__dialogs || []).push(d.message()); const a = p.__answer; d[a === false ? 'dismiss' : 'accept']().catch(() => {}); });
  };
  // data fissa per i test scritti per un certo giorno (opts.today o TODAY=2026-10-30)
  const today = opts.today || process.env.TODAY; if(today) await ctx.clock.setFixedTime(new Date(today.length <= 10 ? today + 'T12:00:00' : today));
  const page = await ctx.newPage(); wire(page);
  // tengo aggiornato chi è collegato in quella pagina (serve per il "tempo reale" filtrato come le policy)
  setInterval(async () => { try{ page.__uidv = await page.evaluate(() => { try{ const s = JSON.parse(localStorage.getItem('fake_sb_session')||'null'); return s && s.user && s.user.id; }catch(e){ return null; } }); }catch(e){} }, 300).unref();
  return {ctx, page, errors};
}
// accesso diretto: imposta la sessione prima di aprire l'app
export async function loginAs(page, base, u){
  await page.goto(base + 'favicon-none.html').catch(() => {}); await page.waitForTimeout(400);
  await page.goto(base, {waitUntil:'domcontentloaded'});
  await page.evaluate(u => { localStorage.setItem('bussola_tour_v3', '1'); localStorage.setItem('fake_sb_session', JSON.stringify({user:{id:u.id, email:u.email, user_metadata:u.meta||{}}, access_token:'t'})); }, u);
  page.__uidv = u.id;
  // su Firefox, se l'app sta ricaricando la pagina per conto suo (dopo l'uscita dall'account) la ricarica del test viene annullata: si riprova
  for(let i = 0; i < 4; i++){ try{ await page.reload({waitUntil:'domcontentloaded'}); break; }catch(e){ if(i === 3 || !/NS_BINDING_ABORTED|NS_ERROR_FAILURE|interrupted|detached/i.test(String(e))) throw e; await page.waitForTimeout(700); } }
  await page.waitForTimeout(800);
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
let _fails = 0, _oks = 0;
export function ok(cond, msg){ if(cond){ _oks++; console.log('  ✓ ' + msg); } else { _fails++; console.log('  ✗ ' + msg); } return !!cond; }
export function summary(){ console.log(`\n${_oks} ok, ${_fails} falliti`); return _fails; }
