// Motore di suggerimento dei percorsi (gira nella pagina; richiede stem() e l'oggetto INDICE).
function motoreTok(s){ const ST=new Set(INDICE.STOP); return String(s||'').toLowerCase().replace(/[’`]/g,"'").split(/[^a-zàèéìòóù]+/).filter(w=>w.length>2&&!ST.has(w)); }
function motoreTokAll(s){ return String(s||'').toLowerCase().replace(/[’`]/g,"'").split(/[^a-zàèéìòóù]+/).filter(Boolean); }
// Restituisce [{id, score, hits:[parole], fonte:{doc,racc}}] ordinati; opz.k = quanti
function suggerisci(testo, opz={}){
  const words=motoreTok(testo); const stems=words.map(stem);
  const all=motoreTokAll(testo).map(stem);
  const sc={}, hits={}, docS={}, racS={};
  const addH=(p,w)=>{ (hits[p]=hits[p]||[]); if(!hits[p].includes(w)) hits[p].push(w); };
  const seen=new Set();
  stems.forEach((s,i)=>{ if(seen.has(s)) return; seen.add(s);
    const r=INDICE.RW[s]; if(r) for(const p in r){ sc[p]=(sc[p]||0)+r[p]; racS[p]=(racS[p]||0)+r[p]; addH(p,words[i]); }
    const d=INDICE.IDX[s]; if(d) for(const p in d){ const w=d[p]*(r&&r[p]?0.5:1); sc[p]=(sc[p]||0)+w; docS[p]=(docS[p]||0)+w; if(w>=0.6) addH(p,words[i]); }
  });
  const J=' '+all.join(' ')+' ';
  for(const f of INDICE.PHR){ if(J.includes(' '+f.s.join(' ')+' ')){ sc[f.p]=(sc[f.p]||0)+f.w+1; racS[f.p]=(racS[f.p]||0)+f.w+1; addH(f.p,f.t); } }
  for(const [need,p,w] of INDICE.COMBO){ if(need.every(n=>all.some(s=>s===n||(n.length>=4&&s.startsWith(n))))){ sc[p]=(sc[p]||0)+w; } }
  const sem={};
  if(typeof SEM!=='undefined' && SEM && SEM.rows && opz.sem!==false){ const sp=semPunteggi(stems,words,opz.soglia||0.5);
    for(const p in sp){ const k=Math.min(sp[p].score, 4); sc[p]=(sc[p]||0)+k; sem[p]=sp[p].why; } }
  return Object.keys(sc).map(id=>({id,score:+sc[id].toFixed(2),hits:hits[id]||[],sem:sem[id]||[],doc:+(docS[id]||0).toFixed(2),racc:+(racS[id]||0).toFixed(2)})).filter(x=>x.score>=1).sort((a,b)=>b.score-a.score).slice(0,opz.k||24);
}
// Due percorsi troppo vicini? restituisce la domanda che li distingue
function ambiguita(res){ if(res.length<2) return null; const [a,b]=res; if(b.score>=a.score*0.8 && a.score-b.score<1.5) return {a:a.id,b:b.id,qa:INDICE.LENTE[a.id],qb:INDICE.LENTE[b.id]}; return null; }
if(typeof module!=='undefined') module.exports={suggerisci,ambiguita,motoreTok};
