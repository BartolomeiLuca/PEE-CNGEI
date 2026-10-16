// Banco di prova: sito locale + finto Supabase condiviso tra più "persone" (contesti del browser)
import { chromium, webkit, firefox, devices } from 'playwright';
import fs from 'fs';
import http from 'http';
import path from 'path';

export const ROOT = process.env.SITE || '/home/claude/pee-cngei';
const CLIENT = fs.readFileSync(new URL('./fakesb_client.js', import.meta.url), 'utf8');
let server = null;
export async function serve(port = 8080){
  if(server) return `http://127.0.0.1:${port}/`;
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if(p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    fs.readFile(f, (e, b) => { if(e){ res.writeHead(404); res.end(); return; }
      const t = f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.png') ? 'image/png' : f.endsWith('.pdf') ? 'application/pdf' : f.endsWith('.docx') ? 'application/octet-stream' : 'application/octet-stream';
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
  constructor(){ this.users = []; this.t = {pee_archivi:[], pee_membri:[], pee_versioni:[], pee_suggerimenti:[], pee_gruppi:[], pee_cambi_email:[]}; this.pages = new Set(); this.mails = []; this.presence = {}; this.log = []; }
  user(id){ return this.users.find(u => u.id === id); }
  pubUser(u){ return u ? {id:u.id, email:u.email, user_metadata:Object.assign({}, u.meta), new_email:u.pending||undefined} : null; }
  addUser(email, password = 'password123', nome = ''){ const u = {id:uuid(), email:email.toLowerCase(), password, meta: nome ? {nome} : {}}; this.users.push(u); return u; }
  myEmail(uid){ const u = this.user(uid); return u ? u.email : null; }
  isOwner(uid, a){ return this.t.pee_archivi.some(r => r.id === a && r.user_id === uid); }
  mem(uid, a){ const em = this.myEmail(uid); return this.t.pee_membri.find(m => m.archivio_id === a && m.email === em); }
  canEdit(uid, a){ const m = this.mem(uid, a); return !!(m && (m.ruolo === 'cotitolare' || m.ruolo === 'collaboratore')); }
  isCot(uid, a){ const m = this.mem(uid, a); return !!(m && m.ruolo === 'cotitolare'); }
  canSee(uid, table, r){
    const em = this.myEmail(uid);
    switch(table){
      case 'pee_archivi': return r.user_id === uid || !!this.mem(uid, r.id);
      case 'pee_membri': return this.isOwner(uid, r.archivio_id) || r.email === em || this.isCot(uid, r.archivio_id);
      case 'pee_versioni': return r.user_id === uid || this.canEdit(uid, r.archivio_id);
      case 'pee_suggerimenti': return this.isOwner(uid, r.archivio_id) || (r.user_id === uid && !!this.mem(uid, r.archivio_id)) || (this.sql13 && (this.isCot(uid, r.archivio_id) || (r.dest && r.dest === em)));
      case 'pee_gruppi': return true;
      default: return false;
    }
  }
  match(r, f){ return f.every(([op, c, v]) => op === 'eq' ? String(r[c]) === String(v) : op === 'neq' ? String(r[c]) !== String(v) : op === 'in' ? v.map(String).includes(String(r[c])) : op === 'is' ? (r[c] ?? null) === v : op === 'not' ? !(v[0] === 'is' ? (r[c] ?? null) === v[1] : String(r[c]) === String(v[1])) : true); }
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
      if(req.name === 'pee_segna_visto'){ const m = this.t.pee_membri.find(x => x.id === req.args.m && x.email === u.email); if(m){ m.visto_il = now(); this.emit('pee_membri', 'UPDATE', m); } return {data:null, error:null}; }
      if(req.name === 'pee_prepara_cambio_email'){ if(!this.sql13) return this.err('PGRST202', 'Could not find the function'); const nuova = String(req.args.nuova||'').toLowerCase(); this.t.pee_cambi_email = this.t.pee_cambi_email.filter(x => x.user_id !== uid); this.t.pee_cambi_email.push({user_id:uid, vecchia:u.email, nuova}); return {data:null, error:null}; }
      if(req.name === 'pee_completa_cambio_email'){ if(!this.sql13) return this.err('PGRST202', 'Could not find the function'); const c = this.t.pee_cambi_email.find(x => x.user_id === uid && x.nuova === u.email); if(!c) return {data:0, error:null};
        let n = 0; this.t.pee_membri.filter(m => m.email === c.vecchia).forEach(m => { m.email = u.email; m.email_prima = c.vecchia; n++; this.emit('pee_membri', 'UPDATE', m); });
        this.t.pee_cambi_email = this.t.pee_cambi_email.filter(x => x !== c); return {data:n, error:null}; }
      return this.err('PGRST202', 'Could not find the function ' + req.name);
    }
    if(req.kind !== 'query') return {error:{message:'?'}};
    const q = req.q, T = this.t[q.table]; if(!T) return this.err('42P01', 'relation "' + q.table + '" does not exist');
    if(!u && q.table !== 'pee_gruppi') return this.err('42501', 'permission denied');
    const vis = r => this.canSee(uid, q.table, r);
    const cols = c => { if(q.table === 'pee_membri' && /ruolo|visto_il/.test(c||'') && this.noRoles) return 'x'; if(q.table === 'pee_membri' && /email_prima/.test(c||'') && !this.sql13) return 'x'; return null; };
    if(q.op === 'select'){
      if(cols(q.cols)) return this.err('42703', 'column does not exist');
      let rows = T.filter(r => vis(r) && this.match(r, q.filters));
      if(q.order){ const [c, asc] = q.order; rows.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * (asc ? 1 : -1)); }
      if(q.limit) rows = rows.slice(0, q.limit);
      rows = rows.map(r => this.pick(r, q.cols));
      if(q.single) return {data: rows[0] || null, error:null};
      return {data:rows, error:null};
    }
    if(q.op === 'insert'){
      const list = Array.isArray(q.vals) ? q.vals : [q.vals]; const out = [];
      for(const v0 of list){
        const r = Object.assign({id:uuid(), created_at:now()}, v0);
        if(q.table === 'pee_archivi'){ r.user_id = uid; r.updated_at = r.created_at; r.meta = r.meta||{}; r.data = r.data||{};
          if(T.some(x => x.user_id === uid && x.anno === r.anno && x.titolo === r.titolo)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        if(q.table === 'pee_membri'){ r.owner_id = uid; r.ruolo = r.ruolo || 'lettore'; r.visto_il = null; r.email_prima = null;
          const ok = this.isOwner(uid, r.archivio_id) || (this.isCot(uid, r.archivio_id) && ['lettore','collaboratore'].includes(r.ruolo));
          if(!ok) return this.err('42501', 'new row violates row-level security policy');
          if(T.some(x => x.archivio_id === r.archivio_id && x.email === r.email)) return this.err('23505', 'duplicate key value violates unique constraint'); }
        if(q.table === 'pee_versioni'){ r.user_id = uid; if(!(this.isOwner(uid, r.archivio_id) || this.canEdit(uid, r.archivio_id))) return this.err('42501', 'new row violates row-level security policy'); }
        if(q.table === 'pee_suggerimenti'){ r.user_id = uid; r.stato = r.stato || 'nuovo';
          const ok = (this.mem(uid, r.archivio_id) || (this.sql13 && this.isOwner(uid, r.archivio_id))) && r.stato === 'nuovo';
          if(!ok) return this.err('42501', 'new row violates row-level security policy');
          if(r.dest && !this.sql13) return this.err('42703', 'column "dest" does not exist'); }
        T.push(r); out.push(r); this.emit(q.table, 'INSERT', r);
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
        if(q.table === 'pee_membri') ok = this.isOwner(uid, r.archivio_id) || (this.isCot(uid, r.archivio_id) && r.ruolo !== 'cotitolare' && (!q.vals.ruolo || ['lettore','collaboratore'].includes(q.vals.ruolo)));
        if(q.table === 'pee_suggerimenti') ok = this.isOwner(uid, r.archivio_id) || (this.sql13 && r.dest && r.dest === u.email && Object.keys(q.vals).every(k => k === 'stato'));
        if(!ok) continue;
        const old = Object.assign({}, r);
        const changed = q.table === 'pee_archivi' && 'data' in q.vals && JSON.stringify(q.vals.data) !== JSON.stringify(r.data);
        Object.assign(r, JSON.parse(JSON.stringify(q.vals)));
        if(changed) r.updated_at = now();
        out.push(r); this.emit(q.table, 'UPDATE', r, old);
      }
      return {data: out.map(r => this.pick(r, q.ret || '*')), error:null};
    }
    if(q.op === 'delete'){
      const rows = T.filter(r => vis(r) && this.match(r, q.filters));
      for(const r of rows){
        let ok = false;
        if(q.table === 'pee_archivi') ok = r.user_id === uid;
        if(q.table === 'pee_membri') ok = this.isOwner(uid, r.archivio_id) || r.email === u.email || (this.isCot(uid, r.archivio_id) && r.ruolo !== 'cotitolare');
        if(q.table === 'pee_versioni') ok = r.user_id === uid;
        if(q.table === 'pee_suggerimenti') ok = r.user_id === uid || this.isOwner(uid, r.archivio_id);
        if(!ok) continue;
        T.splice(T.indexOf(r), 1); this.emit(q.table, 'DELETE', r, r);
      }
      return {data:null, error:null};
    }
  }
  // conferma del cambio email (come se si cliccasse il link arrivato per posta)
  confirmEmail(oldEmail){ const u = this.users.find(x => x.email === oldEmail); if(u && u.pending){ u.email = u.pending; u.pending = null; } return u; }
}

export const ENGINES = {chromium, webkit, firefox};
export async function launch(engine = 'chromium'){
  const opt = engine === 'chromium' ? {executablePath: undefined} : {};
  return ENGINES[engine].launch(opt);
}
// una "persona": contesto del browser con la sua memoria locale, collegato al finto database
export async function person(browser, db, opts = {}){
  const ctx = await browser.newContext(Object.assign({viewport:{width:1280, height:900}, locale:'it-IT', timezoneId:'Europe/Rome', acceptDownloads:true}, opts.ctx || {}));
  await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase/, r => r.fulfill({status:200, contentType:'text/javascript', body:CLIENT}));
  const LIB = '/home/claude/work/libs/node_modules/';
  await ctx.route(/docx@8\.5\.0\/build\/index\.umd\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'docx/build/index.umd.js')}));
  await ctx.route(/exceljs\/4\.4\.0\/exceljs\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'exceljs/dist/exceljs.min.js')}));
  await ctx.route(/jszip\/3\.10\.1\/jszip\.min\.js/, r => r.fulfill({status:200, contentType:'text/javascript', body:fs.readFileSync(LIB + 'jszip/dist/jszip.min.js')}));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com|api\.web3forms\.com|nominatim|osrm|maps\.google|www\.google\.com/, r => r.abort());
  // di norma i percorsi e le attività si presentano chiusi: i test li aprono da soli (KEEPCLOSED=1 per vederli chiusi)
  if(!process.env.KEEPCLOSED) await ctx.addInitScript(() => { const all = new Proxy({}, {get: () => true, set: () => true}); window._attOpen = all; window._pcOpen = all; window._verOpen = all; });
  // le domande di feedback non devono comparire nei test (SV=1 per provarle)
  if(!process.env.SV) await ctx.addInitScript(() => { try{ localStorage.setItem('bussola_sv_off', '1'); }catch(e){} });
  await ctx.exposeBinding('__sb', (src, req) => db.handle(req, src.page));
  const errors = [];
  ctx.on('page', p => wire(p));
  const wire = p => {
    db.pages.add(p); p.on('close', () => db.pages.delete(p));
    p.__uid = () => p.__uidv; p.on('pageerror', e => errors.push(String(e && e.stack || e)));
    p.on('dialog', d => { (p.__dialogs = p.__dialogs || []).push(d.message()); const a = p.__answer; d[a === false ? 'dismiss' : 'accept']().catch(() => {}); });
  };
  const page = await ctx.newPage(); wire(page);
  // tengo aggiornato chi è collegato in quella pagina (serve per il "tempo reale" filtrato come le policy)
  setInterval(async () => { try{ page.__uidv = await page.evaluate(() => { try{ const s = JSON.parse(localStorage.getItem('fake_sb_session')||'null'); return s && s.user && s.user.id; }catch(e){ return null; } }); }catch(e){} }, 300).unref();
  return {ctx, page, errors};
}
// accesso diretto: imposta la sessione prima di aprire l'app
export async function loginAs(page, base, u){
  await page.goto(base + 'favicon-none.html').catch(() => {});
  await page.goto(base, {waitUntil:'domcontentloaded'});
  await page.evaluate(u => { localStorage.setItem('bussola_tour_v3', '1'); localStorage.setItem('fake_sb_session', JSON.stringify({user:{id:u.id, email:u.email, user_metadata:u.meta||{}}, access_token:'t'})); }, u);
  page.__uidv = u.id;
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForTimeout(800);
}
export const sleep = ms => new Promise(r => setTimeout(r, ms));
let _fails = 0, _oks = 0;
export function ok(cond, msg){ if(cond){ _oks++; console.log('  ✓ ' + msg); } else { _fails++; console.log('  ✗ ' + msg); } return !!cond; }
export function summary(){ console.log(`\n${_oks} ok, ${_fails} falliti`); return _fails; }
