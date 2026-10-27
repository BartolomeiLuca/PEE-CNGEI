import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
import { execSync } from 'child_process';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1280, height:800}, acceptDownloads:true}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('giulia@x.it', 'password123', 'Giulia Cocon');
db.t.pee_profili.push({user_id:u.id, nome:'Giulia Cocon', ruolo:'cu', branca:'L', sezione:'Pesaro', gruppo:'1', dashboard:{}});
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Krakatiki', meta:{mode:'giovani', fascia:'L', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'L', UNIT_NAME:'X', obs:{P1:6}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{occMan:[{id:'m1', att:'Gioco', data:'2026-10-20', perc:['P1']}], staffTab:[{ruolo:'CU', nome:'Giulia Cocon', giungla:'Akela', eta:'44', form:'MoRA', car:'Persona empatica, accogliente e costantemente presente; necessita di sviluppare maggiori competenze nella restituzione di feedback costruttivi', prof:'Cameriera', ruoli:'VCB, CB'}]}, griglia:{P1:{'m:m1':{pos:'bene'}}}}}, created_at:'2026-10-01T10:00:00Z', updated_at:'2026-10-01T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
let h = await ev(() => ({bg:getComputedStyle(document.getElementById('hdr')).backgroundColor, ctx:document.getElementById('sh-pjn').innerText, nome:document.getElementById('sh-name').innerText, vis:s=>0,
  sug:(()=>{const b=document.querySelector('.hdr-actions .fb-btn:not(.faq-btn)'); return !!b && b.offsetParent!==null;})(), faq:(()=>{const b=document.querySelector('.hdr-actions .faq-btn'); return !!b && b.offsetParent!==null;})(), arc:(()=>{const b=document.querySelector('.cl-hdrbtn'); return !!b && b.offsetParent!==null;})(), logo:!!document.querySelector('#hdr .logo-mark svg')}));
ok(h.bg === 'rgb(240, 230, 3)', 'header col colore della Branca L (giallo vivo)');
ok(/^Branca L: Programmazione di Unità 2026$/.test(h.ctx), 'etichetta «Branca L: … 2026» dopo il logo (' + h.ctx + ')');
ok(h.nome === 'Giulia' && h.logo, 'nome della persona al posto di Profilo, logo CNGEI');
ok(h.sug && !h.faq && !h.arc, 'Suggerimenti? visibile, FAQ dentro Guida, niente «Archivio»');
// Word
const [dl] = await Promise.all([P.waitForEvent('download', {timeout: 30000}), ev(() => exportSchedaDocx('completo'))]);
const path = '/tmp/g12.docx'; await dl.saveAs(path);
const x = execSync('unzip -p ' + path + ' word/document.xml').toString();
ok(!/Griglia nel formato CNGEI/.test(x), 'Word: frase sulla griglia tolta');
ok(/Caratteristiche personali: Persona empatica/.test(x) && /Professioni, competenze esterne: Cameriera/.test(x), 'Word: staff su due livelli (testi lunghi a tutta larghezza)');
ok(/w:fill="F0E603"/.test(x) && !/9A6700/.test(x), 'Word: intestazioni giallo vivo (niente marrone)');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
