from pathlib import Path

p = Path('personalizza.html')
s = p.read_text(encoding='utf-8')

old_call = 'const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp");'
new_call = 'const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp?v=20260910-2046");'

if old_call in s:
    s = s.replace(old_call, new_call, 1)
elif new_call not in s:
    raise SystemExit('Bar extra background loader not found')

old_css = 'html,body{background:#18221f!important}body{background-image:url("${backgroundDataUrl}")!important;background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important}.pagina{background:transparent!important}'
new_css = 'html,body{background:#18221f!important}body,.pagina{background-image:url("${backgroundDataUrl}")!important;background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important}.pagina{background-color:transparent!important}'

if old_css in s:
    s = s.replace(old_css, new_css, 1)
elif new_css not in s:
    raise SystemExit('Bar extra layout CSS not found')

p.write_text(s, encoding='utf-8')
print('Bar extra background loading fixed')
