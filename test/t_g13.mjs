import { FakeDB, serve, launch, person, sleep, ok, summary, loginAs } from './harness.mjs';
const engine = process.argv[2] || 'chromium';
process.env.SITE = '/tmp/site_sh';
const base = (await serve()) + 'anteprima/';
const br = await launch(engine);
const db = new FakeDB(); const pa = await person(br, db, {ctx:{viewport:{width:1440, height:900}}}); const P = pa.page, ev = (f, a) => P.evaluate(f, a);
const u = db.addUser('anna@x.it', 'password123', 'Anna Verdi');
db.t.pee_profili.push({user_id:u.id, nome:'Anna Verdi', ruolo:'cu', branca:'L', sezione:'Pesaro', gruppo:'1', dashboard:{}});
const obs = {}; ['P','C','S'].forEach(a => { for(let i = 1; i <= 8; i++) obs[a + i] = [1,3,5,7,9,6,4,8][i - 1]; }); obs.S8 = 'n';
db.t.pee_archivi.push({id:'p1', user_id:u.id, anno:2026, titolo:'Branco', meta:{mode:'giovani', fascia:'L', tipo:'AN'}, data:{v:1, MODE:'giovani', FASCIA:'L', UNIT_NAME:'Branco X', obs, pris:{P1:true, C2:true, S3:true}, scheda:{tipoProgetto:'AN', annoScout:'2026-27', pp:{}, _p2Seen:true}}, created_at:'2026-10-20T10:00:00Z', updated_at:'2026-10-26T10:00:00Z'});
await loginAs(P, base, u); await sleep(1200); await ev(() => shOpen('p1', 0)); await sleep(3500);
const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// 1.2: numero scelto leggibile in Branca L
await ev(() => gGo('1b')); await sleep(900); await ev(() => document.getElementById('card-P1').classList.add('expanded')); await sleep(300);
let s = await ev(() => { const e = document.querySelector('#card-P1 .sc-n.on'); const c = getComputedStyle(e); return {bg:c.backgroundColor, fg:c.color}; });
ok(ratio(s.bg, s.fg) >= 7, 'Branca L: numero scelto leggibile (contrasto ' + ratio(s.bg, s.fg).toFixed(1) + ')');
// 1.3: chiavi di lettura
await ev(() => gGo('1c')); await sleep(1800);
s = await ev(() => { const f = document.getElementById('chiavi-fold'); const a = document.getElementById('rie-alert'); return {fold:!!f, open:f && f.open, n:f ? f.querySelectorAll('.diag-card, [class*=ss-], [class*=prot], [class*=brave]').length : 0, kids:f ? f.querySelector('.u-fold-in').children.length : 0, first:(a.firstElementChild||{textContent:'(vuoto)'}).textContent.slice(0, 40), link:(a.querySelector('a') || {}).tagName}; });
ok(s.fold && s.open === false && s.kids >= 3, 'Lettura: «Chiavi di lettura» chiuso, con ' + s.kids + ' spunti dentro');
ok(/Profilo/.test(s.first), 'Lettura: il Profilo resta in vista');
s = await ev(() => { const a = document.querySelector('#rie-alert a'); return a ? getComputedStyle(a).color : null; });
ok(!s || s !== 'rgb(0, 0, 238)', 'Lettura: il link non ha il blu del browser (' + s + ')');
await P.click('#chiavi-fold > summary'); await sleep(300);
ok(await ev(() => document.getElementById('chiavi-fold').open && document.getElementById('chiavi-fold').getBoundingClientRect().height > 200), 'Chiavi di lettura: si apre');
// triangoli uguali
s = await ev(() => ['.tutorial-box .tutorial-hdr', '#chiavi-fold>summary', '.disclaimer-box summary', '#cucg-section>summary'].map(q => { const e = document.querySelector(q); const c = getComputedStyle(e, '::before'); return q + ':' + c.borderLeftWidth + '/' + c.borderTopWidth + '/' + c.content; }));
ok(new Set(s.map(x => x.split(':')[1])).size === 1, 'Triangolini uguali in tutti i riquadri: ' + s.join(' | '));
// larghezza piena
s = await ev(() => document.querySelector('.main').getBoundingClientRect());
ok(s.width > 1100 && s.left >= 240, 'Area di lavoro larga: ' + Math.round(s.width) + ' px accanto al menu');
// testi minimi
s = await ev(() => { let min = 99, who = ''; document.querySelectorAll('.main *').forEach(e => { if(!e.childNodes.length) return; const t = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).length; if(!t) return; const r = e.getBoundingClientRect(); if(!r.width || !r.height) return; const f = parseFloat(getComputedStyle(e).fontSize); if(f < min){ min = f; who = e.className + ':' + e.textContent.trim().slice(0, 20); } }); return {min, who}; });
ok(s.min >= 12 || /tutorial-close/.test(s.who), 'Nessun testo sotto i 12 px nella pagina (min ' + s.min + ' ' + s.who + ')');
// Adatta
await ev(() => gGo('2')); await sleep(900);
s = await ev(() => ({n:document.querySelectorAll('.idr-pill').length, tag:document.querySelector('.idr-pill').tagName, r:getComputedStyle(document.querySelector('.idr-pill')).borderRadius}));
ok(s.n >= 3 && s.tag === 'BUTTON' && parseFloat(s.r) >= 16, '«Adatta»: pasticca (' + s.n + ' pulsanti)');
ok(!pa.errors.length, 'nessun errore JS' + (pa.errors.length ? ': ' + pa.errors.slice(0, 3).join(' | ') : ''));
const f = summary(); await br.close(); process.exit(f ? 1 : 0);
