from pathlib import Path
import re

p = Path('personalizza.html')
s = p.read_text(encoding='utf-8')

# Mantiene il cache-bust sul file Bar extra.
s = s.replace(
    'const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp");',
    'const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp?v=20260910-2057");',
    1
)
s = s.replace(
    'const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp?v=20260910-2046");',
    'const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp?v=20260910-2057");',
    1
)

needle = 'previewHtml = buildPremiumTemplate(logoDataUrl, reviewUrl, backgroundDataUrl, {title:"Le nostre specialità ti hanno conquistato?"'
pos = s.find(needle)
if pos == -1:
    raise SystemExit('Bar extra template call not found')

line_end = s.find('\n', pos)
if line_end == -1:
    raise SystemExit('Bar extra template line end not found')

inject = '''\n      previewHtml = previewHtml.replace("<body>", `<body><img class="barextra-scene" src="${backgroundDataUrl}" alt="">`);'''
if 'class="barextra-scene"' not in s[pos:pos+5000]:
    s = s[:line_end] + inject + s[line_end:]

style_marker = '<style id="barextra-layout-standard">'
style_pos = s.find(style_marker, pos)
if style_pos == -1:
    raise SystemExit('Bar extra style block not found')
style_end = s.find('</style>', style_pos)
if style_end == -1:
    raise SystemExit('Bar extra style end not found')

extra_css = '.barextra-scene{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;object-fit:cover!important;object-position:center top!important;z-index:0!important;pointer-events:none!important}.pagina{position:relative!important;z-index:1!important;background:transparent!important}body{background:#18221f!important;overflow-x:hidden!important}'
if '.barextra-scene{' not in s[style_pos:style_end]:
    s = s[:style_end] + extra_css + s[style_end:]

p.write_text(s, encoding='utf-8')
print('Bar extra photographic layer forced')
