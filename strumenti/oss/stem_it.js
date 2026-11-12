// Stemmer italiano (algoritmo Snowball «Italian», riscritto in JS puro).
const V='aeiouàèìòùéó';
const isV=c=>V.includes(c);
function regions(w){
  let rv=w.length;
  if(w.length>3){
    if(!isV(w[1])){ for(let i=2;i<w.length;i++) if(isV(w[i])){ rv=i+1; break; } }
    else if(isV(w[0])&&isV(w[1])){ for(let i=2;i<w.length;i++) if(!isV(w[i])){ rv=i+1; break; } }
    else rv=3;
  }
  const r=s=>{ for(let i=s+1;i<w.length;i++) if(!isV(w[i])&&isV(w[i-1])) return i+1; return w.length; };
  const r1=r(0), r2=r(r1);
  return {rv,r1,r2};
}
const S0=['gliela','gliele','glieli','glielo','gliene','sene','mela','mele','meli','melo','mene','tela','tele','teli','telo','tene','cela','cele','celi','celo','cene','vela','vele','veli','velo','vene','gli','ci','la','le','li','lo','mi','ne','si','ti','vi'];
const S1a=['atrice','atrici','abile','abili','ibile','ibili','mente','ismo','ismi','ista','iste','isti','istà','istè','istì','anza','anze','iche','ichi','ante','anti','ico','ici','ica','ice','oso','osi','osa','ose'];
const S2=['erebbero','irebbero','assero','assimo','eranno','erebbe','eremmo','ereste','eresti','essero','iranno','irebbe','iremmo','ireste','iresti','iscano','iscono','issero','arono','avamo','avano','avate','eremo','erete','erono','evamo','evano','evate','iremo','irete','irono','ivamo','ivano','ivate','ammo','ando','asse','assi','emmo','enda','ende','endi','endo','erai','iamo','immo','irai','isca','isce','isci','isco','ano','are','ata','ate','ati','ato','ava','avi','avo','erà','ere','erò','ete','eva','evi','evo','irà','ire','irò','ita','ite','iti','ito','iva','ivi','ivo','ono','uta','ute','uti','uto','ar','ir'];
const ends=(w,s)=>w.endsWith(s);
function stem(word){
  let w=word.toLowerCase().replace(/á/g,'à').replace(/é/g,'è').replace(/í/g,'ì').replace(/ó/g,'ò').replace(/ú/g,'ù').replace(/qu/g,'qU');
  w=w.replace(/([aeiouàèìòù])([iu])(?=[aeiouàèìòù])/g,(m,a,b)=>a+b.toUpperCase());
  if(w.length<3) return w.toLowerCase();
  let {rv,r1,r2}=regions(w);
  // step 0
  for(const s of S0){ if(ends(w,s)&&w.length-s.length>=rv){ const b=w.slice(0,-s.length);
    if(/(ando|endo)$/.test(b)&&b.length-4>=rv){ w=b; break; }
    if(/(ar|er|ir)$/.test(b)&&b.length-2>=rv){ w=b+'e'; break; } } }
  ({rv,r1,r2}=regions(w));
  let done=false;
  const inR=(s,R)=>ends(w,s)&&w.length-s.length>=R;
  // step 1
  const st1=()=>{
    for(const s of ['amento','amenti','imento','imenti']) if(inR(s,rv)){ w=w.slice(0,-s.length); return true; }
    for(const s of ['azione','azioni','atore','atori']) if(inR(s,r2)){ w=w.slice(0,-s.length); if(inR('ic',r2)) w=w.slice(0,-2); return true; }
    for(const s of ['logia','logie']) if(inR(s,r2)){ w=w.slice(0,-s.length)+'log'; return true; }
    for(const s of ['uzione','uzioni','usione','usioni']) if(inR(s,r2)){ w=w.slice(0,-s.length)+'u'; return true; }
    for(const s of ['enza','enze']) if(inR(s,r2)){ w=w.slice(0,-s.length)+'ente'; return true; }
    if(inR('amente',r1)){ w=w.slice(0,-6); if(inR('iv',r2)){ w=w.slice(0,-2); if(inR('at',r2)) w=w.slice(0,-2); } else for(const s of ['os','ic','abil']) if(inR(s,r2)){ w=w.slice(0,-s.length); break; } return true; }
    if(inR('ità',r2)){ w=w.slice(0,-3); for(const s of ['abil','ic','iv']) if(inR(s,r2)){ w=w.slice(0,-s.length); break; } return true; }
    for(const s of ['ivo','ivi','iva','ive']) if(inR(s,r2)){ w=w.slice(0,-s.length); if(inR('at',r2)){ w=w.slice(0,-2); if(inR('ic',r2)) w=w.slice(0,-2); } return true; }
    for(const s of S1a) if(inR(s,r2)){ w=w.slice(0,-s.length); return true; }
    return false; };
  done=st1();
  if(!done){ for(const s of S2) if(inR(s,rv)){ w=w.slice(0,-s.length); break; } }
  ({rv}=regions(w));
  // step 3a
  if(/[aeioàèìò]$/.test(w)&&w.length-1>=rv){ w=w.slice(0,-1); if(ends(w,'i')&&w.length-1>=rv) w=w.slice(0,-1); }
  // step 3b
  if((ends(w,'ch')||ends(w,'gh'))&&w.length-2>=rv) w=w.slice(0,-1);
  return w.toLowerCase();
}
if(typeof module!=='undefined') module.exports={stem};
