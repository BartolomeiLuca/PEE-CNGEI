import re,subprocess,sys,tempfile
s=open(sys.argv[1] if len(sys.argv)>1 else '/home/claude/repo/anteprima/index.html',encoding='utf-8').read()
bad=0
for i,m in enumerate(re.finditer(r'<script(?![^>]*src)([^>]*)>(.*?)</script>',s,re.S)):
    if 'json' in m.group(1) or 'module' in m.group(1): continue
    f=tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8'); f.write(m.group(2)); f.close()
    r=subprocess.run(['node','--check',f.name],capture_output=True,text=True)
    if r.returncode: bad+=1; print('script',i,r.stderr[:800])
print('OK' if not bad else f'{bad} errori')
