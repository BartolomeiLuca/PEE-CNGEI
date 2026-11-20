import fs from 'fs';
const h = fs.readFileSync('/home/claude/pee-cngei/anteprima/index.html','utf8');
const S = new Set();
for (const m of h.matchAll(/\bon(?:click|change|input|oninput|submit|keydown|keyup|toggle|blur|focus|load|error|mouseover|mouseout)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
  let code = m[1] || m[2] || ''; code = code.replace(/\$\{[^}]*\}/g,'');
  for (const f of code.matchAll(/(?<![.\w$'"`])([A-Za-z_$][\w$]*)\s*\(/g)) S.add(f[1]);
}
const skip = new Set('if for while switch return function typeof new void catch event this alert confirm prompt setTimeout parseInt parseFloat String Number Boolean Array Object JSON Math Date encodeURIComponent decodeURIComponent isNaN stopPropagation preventDefault'.split(' '));
const W = new Set([...h.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)].map(m=>m[1]));
const names = [...S].filter(n=>!W.has(n)).filter(n => !skip.has(n)).sort();
fs.writeFileSync('lint/names.json', JSON.stringify(names)); console.log(names.length);
