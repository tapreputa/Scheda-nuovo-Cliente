from pathlib import Path
import re

p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')
start = text.find('function buildGelateriaTemplate(logo, reviewUrl, backgroundDataUrl) {')
end = text.find('function buildPremiumTemplate(logo, reviewUrl, backgroundDataUrl, cfg) {', start)
assert start != -1 and end != -1, 'Template Gelateria non trovato'
block = text[start:end]

# Zero crop: riempi tutto il viewport adattando leggermente le proporzioni.
block = block.replace('object-fit:cover;object-position:center center', 'object-fit:fill;object-position:center center')

text = text[:start] + block + text[end:]
text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=18', text, count=1)
p.write_text(text, encoding='utf-8')

out = p.read_text(encoding='utf-8')
sec = out[out.find('function buildGelateriaTemplate'):out.find('function buildPremiumTemplate')]
assert 'object-fit:fill;object-position:center center' in sec
assert 'object-fit:cover;object-position:center center' not in sec
print('Gelateria: zero crop applicato con sfondo fullscreen senza zoom')
