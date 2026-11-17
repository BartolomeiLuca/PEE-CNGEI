import {chromium, webkit, firefox} from 'playwright';
const eng = process.argv[2] || 'chromium';
const br = await ({chromium, webkit, firefox})[eng].launch(eng === 'chromium' ? {executablePath: process.env.CHROME_BIN || undefined} : {});
const ctx = await br.newContext({locale:'it-IT', viewport:{width:1280,height:800}}); const p = await ctx.newPage();
await p.goto((process.env.SITE_URL || 'http://localhost:8731/anteprima/'), {waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000);
for(const n of ['01','24','51']){
  const r = await p.evaluate(async n => {
    const B = 'https://bartolomeiluca.github.io/PEE-CNGEI-video/v2/';
    const v = document.createElement('video'); v.crossOrigin = 'anonymous'; v.muted = true; v.preload = 'metadata'; v.playsInline = true;
    v.innerHTML = `<track kind="subtitles" srclang="it" label="Italiano" src="${B}${n}.vtt?v=1" default><track kind="chapters" srclang="it" src="${B}${n}.chapters.vtt?v=1">`;
    v.src = B + n + '.mp4?v=1'; document.body.appendChild(v);
    const w = (ev, ms = 25000) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout ' + ev)), ms); v.addEventListener(ev, () => { clearTimeout(t); res(); }, {once:true}); v.addEventListener('error', () => { clearTimeout(t); rej(new Error('errore video ' + (v.error && v.error.code) + ' ' + (v.error && v.error.message))); }, {once:true}); });
    const out = {};
    try{
      await w('loadedmetadata'); out.dur = Math.round(v.duration); out.size = v.videoWidth + 'x' + v.videoHeight;
      await new Promise(r => setTimeout(r, 2500));
      out.tracks = [...v.textTracks].map(t => t.kind + ':' + t.mode + ':' + (t.cues ? t.cues.length : 'null'));
      v.currentTime = Math.min(60, v.duration / 2); await w('seeked'); out.seek = Math.round(v.currentTime);
      await v.play(); const t0 = v.currentTime; await new Promise(r => setTimeout(r, 2500)); out.advanced = +(v.currentTime - t0).toFixed(1);
    }catch(e){ out.err = String(e.message); }
    v.remove(); return out; }, n);
  console.log(eng, n, JSON.stringify(r));
}
await br.close();
