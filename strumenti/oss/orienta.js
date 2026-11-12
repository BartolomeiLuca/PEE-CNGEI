// ═══ Orientamento della domanda: aree, esempi di dubbi, frase restituita ═══
// Domanda 1 (Ambito, in parole semplici)
const Q_AMB={P:'come stanno con sé stessi: corpo, emozioni, idee, saper fare',C:'come stanno con gli altri e nel mondo: gruppo, regole, ambiente, comunità',S:'ciò che li muove dentro: identità, valori, scelte, senso'};
// Domanda 2 (area dentro l'Ambito)
const AREE={
 P:[['Il corpo e la salute',['P1','P7']],['Le emozioni e l’immagine di sé',['P2','P8']],['Le idee e il pensiero',['P3','P6']],['Il fare e l’organizzarsi',['P4','P5']]],
 C:[['Come si parlano e si legano',['C1','C2']],['Chi guida e chi viene incluso',['C3','C4']],['Regole, luoghi e comunità',['C5','C6','C7']],['Prendere posizione per una causa',['C8','C7']]],
 S:[['Chi sono e da dove vengono',['S1','S2']],['Lo stupore e l’attenzione agli altri',['S3','S4']],['Valori e scelte',['S5','S6']],['Il futuro e il senso',['S7','S8']]]};
// Dubbi d'esempio (come li scriverebbe chi fa il Capo): bozza da validare
const ESEMPI={
P1:['Durante l’hike alcune persone si fermano di continuo e si lamentano della fatica','Si vergognano a muoversi davanti agli altri nei giochi','Come vivono i cambiamenti del proprio corpo?'],
P2:['Quando perdono a un gioco qualcuno scoppia a piangere o si arrabbia','Come reagiscono quando qualcosa va storto?','Hanno paura del buio durante il gioco notturno'],
P3:['Propongono sempre gli stessi giochi, non inventano niente','Trovano soluzioni originali quando il materiale è poco?','Usano la fantasia nei travestimenti e nelle scenette?'],
P4:['Iniziano le imprese con entusiasmo ma le lasciano a metà','Riescono a darsi un obiettivo e a pianificare i passi?','Si preparano sempre all’ultimo momento'],
P5:['Al campo nessuno sa montare la tenda o accendere il fuoco','Sanno gestire il materiale e la cassa?','Lasciano sempre fare agli altri le cose pratiche'],
P6:['Credono a tutto quello che vedono sui social','Sanno farsi un’opinione e spiegare perché?','La pensano tutti come la persona più popolare'],
P7:['Sono sempre attaccati al telefono, anche al campo','Mangiano solo merendine e la sera non dormono','Si prendono cura della propria igiene in uscita?'],
P8:['Non provano le cose nuove per paura di sbagliare','Si scoraggiano subito quando qualcosa non riesce','Conoscono i propri punti di forza?'],
C1:['Nei consigli parlano sempre gli stessi e gli altri tacciono','Si interrompono di continuo e non si ascoltano','Sanno spiegare le proprie idee davanti al gruppo?'],
C2:['Ci sono gruppetti chiusi che non si mescolano','Litigano per sciocchezze e poi non si parlano per giorni','Si fidano l’uno dell’altro?'],
C3:['Quando manca un capo designato qualcuno prende l’iniziativa o aspettano tutti?','Il capo della squadra fa tutto da solo','Come si dividono i compiti quando c’è da fare?'],
C4:['Chi arriva da poco resta ai margini nei giochi','Le persone più piccole vengono escluse da quelle più grandi','Come trattano chi ha bisogni o abitudini diverse?'],
C5:['Barano nei giochi e non rispettano le regole','Sanno darsi delle regole da soli?','Come reagiscono davanti a qualcosa che sentono ingiusto?'],
C6:['Lasciano sporco e sprecano cibo al campo','Fanno la raccolta differenziata in uscita?','Hanno cura dei luoghi e del materiale comune?'],
C7:['Si interessano a quello che succede nel loro quartiere?','Il servizio lo fanno solo perché è obbligatorio','Partecipano alla vita del paese o restano chiusi nel gruppo?'],
C8:['Quando vedono un’ingiustizia prendono posizione?','Difendono un compagno preso di mira?','C’è una causa per cui si impegnerebbero davvero?'],
S1:['Si comportano in modo diverso a seconda di chi hanno davanti','Imitano gli influencer, si vestono tutti uguali','Sanno raccontare chi sono?'],
S2:['Conoscono la storia della loro famiglia e le tradizioni?','Chi viene da un’altra cultura la racconta volentieri?','Sentono di appartenere al Gruppo e alle sue tradizioni?'],
S3:['Si accorgono della bellezza del bosco o sono distratti?','Si fermano a guardare le stelle?','Si annoiano subito durante le attività all’aperto'],
S4:['Si accorgono quando un compagno sta male?','Raccontano mai qualcosa di sé?','Chi si prende cura dei più piccoli senza che glielo chiediamo?'],
S5:['Che ideali hanno, e ci credono davvero?','Promettono e poi non mantengono la parola','Rispettano la Legge solo quando il capo guarda'],
S6:['Seguono sempre la persona più grande e non sanno dire di no','Scelgono le attività solo in base agli amici','Si assumono le conseguenze delle proprie scelte?'],
S7:['Hanno un sogno per il loro futuro?','Non sanno cosa fare dopo la scuola','Riescono a immaginarsi tra qualche anno?'],
S8:['Durante la veglia nessuno parla di cose profonde','Hanno domande sul senso della vita?','Che spazio danno alla dimensione spirituale?']};
// Esempi più vicini alla domanda
function esempiVicini(testo,res,k=4){ const st=new Set(motoreTok(testo).map(stem)); const sc=Object.fromEntries((res||[]).map(x=>[x.id,x.score])); const out=[];
  for(const [p,arr] of Object.entries(ESEMPI)) arr.forEach(e=>{ const es=motoreTok(e).map(stem); const sh=es.filter(s=>st.has(s)).length; const v=(sc[p]||0)+sh*2; if(v>0) out.push({p,e,v}); });
  return out.sort((a,b)=>b.v-a.v).filter((x,i,a)=>a.findIndex(y=>y.p===x.p)===i).slice(0,k); }
// Frase restituita: chi · situazione · cosa fanno (regole semplici, sempre modificabili)
const CHI_RX=[[/chi arriva(no)? da poco|arrivat[ieao] da poco|nuov[ieao] arrivat|ultim[io] arrivat|\bnuov[ie]\b/i,'le persone arrivate da poco'],[/più piccol/i,'le persone più piccole'],[/più grand/i,'le persone più grandi'],
 [/capo (pattuglia|muta|ronda|squadra)|chi guida|capi? designat/i,'le persone che di solito guidano'],[/timid|parlan[oi]? poco|tacciono|silenzios/i,'le persone che di solito parlano poco'],
 [/\bragazze\b/i,'le ragazze'],[/\bmaschi\b/i,'i ragazzi'],[/pattugli|\bmute?\b|\bronde?\b|squadr/i,null]];
function frase(t,b){ t=String(t||'').trim(); if(t.length<20) return null;
  let chi='', chiTxt=''; for(const [rx,v] of CHI_RX){ const mm=t.match(rx); if(mm){ chi=v||BR[b].sq; chiTxt=mm[0]; break; } }
  let sit='', cut='';
  const q=t.match(/\b(quando|mentre|ogni volta che)\s+([^,.;?]+)/i);
  const d=t.match(/\b(durante)\s+((?:il|la|lo|l’|l'|i|gli|le|un|una)?\s*\S+(?:\s+(?:di|del|della|dei|delle)\s+\S+)?)/i);
  const n=t.match(/\b(nei|negli|nelle|nel|al|alla|allo|in)\s+((?:gioc|camp|consigl|cerchi|usci|hike|vegl|riunion|attivit|tend|cucin|pattugli|impres|serviz)\S*)/i);
  if(q){ sit=(q[1].toLowerCase()+' '+q[2]).trim().split(/\s+/).slice(0,9).join(' '); cut=q[0]; }
  else if(d){ sit=('durante '+d[2]).trim(); cut=d[0]; }
  else if(n){ const art={nei:'i',negli:'gli',nelle:'le',nel:'il',al:'il',alla:'la',allo:'lo',in:''}[n[1].toLowerCase()]; sit=('durante '+art+' '+n[2]).replace(/\s+/g,' '); cut=n[0]; }
  let cosa=t.replace(/^(mi chiedo|vorrei capire|vorrei sapere|vorrei vedere|ho notato|ho l'impressione|ho l’impressione|sembra|credo|penso)( che| se)?\s*/i,'').replace(/[?.!]+$/,'');
  if(cut) cosa=cosa.replace(cut,' '); if(chiTxt) cosa=cosa.replace(new RegExp('^(le |gli |i |la |il )?'+chiTxt.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\S*','i'),' ');
  cosa=cosa.replace(/^\s*(che|se)\s+/i,'').replace(/\s*,\s*,/g,',').replace(/\s{2,}/g,' ').replace(/^[\s,]+|[\s,]+$/g,'').replace(/\s+(anche|e|o|ma|poi)$/i,'');
  if(cosa.split(' ').length>16) cosa=cosa.split(' ').slice(0,16).join(' ')+'…';
  return {chi:chi||BR[b].r, sit, cosa}; }
if(typeof module!=='undefined') module.exports={AREE,ESEMPI,esempiVicini,frase,Q_AMB};
