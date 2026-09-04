from pathlib import Path
import re

p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')
start = text.find('function buildGelateriaTemplate(logo, reviewUrl, backgroundDataUrl) {')
end = text.find('function buildPremiumTemplate(logo, reviewUrl, backgroundDataUrl, cfg) {', start)
assert start != -1 and end != -1, 'Template Gelateria non trovato'
block = text[start:end]

old_footer = 'footer{position:fixed;z-index:6;right:max(18px,env(safe-area-inset-right));bottom:clamp(285px,33vh,500px);margin:0;font-size:10px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}'
new_footer = 'footer{position:fixed;z-index:6;right:max(8px,env(safe-area-inset-right));bottom:clamp(320px,36vh,540px);margin:0;font-size:9px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}'
assert old_footer in block, 'Footer desktop Gelateria non trovato'
block = block.replace(old_footer, new_footer, 1)

old_strong = 'footer strong{display:block;color:#fff;font-size:20px;line-height:1.05;font-weight:950;letter-spacing:.02em}'
new_strong = 'footer strong{display:block;color:#fff;font-size:17px;line-height:1.05;font-weight:950;letter-spacing:.02em}'
assert old_strong in block, 'Footer strong Gelateria non trovato'
block = block.replace(old_strong, new_strong, 1)

old_mobile = 'footer{bottom:clamp(285px,33vh,470px)}'
new_mobile = 'footer{right:max(8px,env(safe-area-inset-right));bottom:clamp(320px,36vh,500px)}'
assert old_mobile in block, 'Footer mobile Gelateria non trovato'
block = block.replace(old_mobile, new_mobile, 1)

text = text[:start] + block + text[end:]
text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=19', text, count=1)
p.write_text(text, encoding='utf-8')

out = p.read_text(encoding='utf-8')
sec = out[out.find('function buildGelateriaTemplate'):out.find('function buildPremiumTemplate')]
assert 'font-size:17px' in sec
assert 'bottom:clamp(320px,36vh,500px)' in sec
print('Micro-rifinitura finale Powered by Tapreputa Gelateria applicata')
