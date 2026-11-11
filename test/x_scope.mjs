// Parte 2 — ogni funzione chiamata da un gestore in linea (onclick=…, onchange=…) deve esistere a livello globale, con e senza guscio
import { FakeDB, serve, launch, person, loginAs, sleep } from './harness.mjs';
import fs from 'fs';
const src = fs.readFileSync(process.env.SRC, 'utf8');
const names = new Map();
const re = /\bon(?:click|change|input|keydown|keyup|keypress|blur|focus|submit|toggle|mousedown|mouseup|pointerdown|pointerup|touchstart|touchend|dragstart|dragover|dragend|drop|dragleave|dragenter|paste|load|error|scroll|contextmenu|dblclick|mouseenter|mouseleave|mouseover|mouseout|focusin|focusout|wheel)\s*=\s*(\\?["'])/g;
let m; const KW = new Set('if for while switch return function catch typeof new var let const else do try void delete in of this event true false null undefined'.split(' '));
while((m = re.exec(src))){ const q = m[1].replace('\\', ''); let i = re.lastIndex, out = '', depth = 0;
  for(; i < src.length && i < re.lastIndex + 600; i++){ const c = src[i];
    if(depth === 0 && c === '$' && src[i+1] === '{'){ depth = 1; i++; out += ' 0 '; continue; }
    if(depth > 0){ if(c === '{') depth++; else if(c === '}') depth--; continue; }
    if(c === q || (c === '\\' && src[i+1] === q)) break; if(c === '\n') break; out += c; }
  const line = src.slice(0, m.index).split('\n').length;
  const idr = /(^|[^.\w$'"])([A-Za-z_$][\w$]*)\s*\(/g; let k;
  const clean = out.replace(/&quot;[^&]*&quot;|&#39;[^&]*&#39;|\\'[^']*\\'|'[^']*'/g, "''");
  while((k = idr.exec(clean))){ const n = k[2]; if(!KW.has(n)){ if(!names.has(n)) names.set(n, line); } } }
const L = [...names.keys()];
const base = await serve(); const br = await launch(process.argv[2] || 'chromium'); const res = {};
for(const [tag, path] of [['senza guscio', ''], ['con guscio', 'anteprima/']]){
  const db = new FakeDB(); const u = db.addUser('anna@x.it', 'password123', 'Anna');
  const pa = await person(br, db); await loginAs(pa.page, base + path, u); await sleep(2500);
  res[tag] = await pa.page.evaluate(L => L.filter(n => { try{ return (0, eval)('typeof ' + n) === 'undefined'; }catch(e){ return true; } }), L);
  await pa.ctx.close(); }
console.log('gestori in linea: ' + L.length + ' funzioni diverse');
for(const t in res) console.log('NON definite (' + t + '): ' + res[t].map(n => n + '@' + names.get(n)).join(', '));
await br.close(); process.exit(0);
