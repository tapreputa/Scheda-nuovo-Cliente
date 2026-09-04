from pathlib import Path
import re

p=Path('personalizza.html')
text=p.read_text(encoding='utf-8')
start=text.find('function buildGelateriaTemplate(logo, reviewUrl, backgroundDataUrl) {')
end=text.find('function buildPremiumTemplate(logo, reviewUrl, backgroundDataUrl, cfg) {', start)
assert start!=-1 and end!=-1, 'Template Gelateria non trovato'
block=text[start:end]

replacements=[
(
'.scene-original{position:fixed;top:0;left:0;width:100%;height:calc(100% - 72px);object-fit:contain;object-position:center bottom;z-index:0;pointer-events:none;background:#000}',
'.scene-original{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;z-index:0;pointer-events:none;background:#000}'
),
(
'.pagina{position:relative;z-index:2;min-height:100vh;min-height:100dvh;display:flex;align-items:flex-start;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 16px 112px}',
'.pagina{position:relative;z-index:2;min-height:100vh;min-height:100dvh;display:flex;align-items:flex-start;justify-content:center;padding:clamp(34px,4.8vh,68px) 16px max(92px,calc(env(safe-area-inset-bottom) + 76px))}'
),
(
'.logo{display:block;width:min(205px,58%);max-height:108px;object-fit:contain;margin:0 auto 10px;padding:4px 7px;border-radius:14px;background:rgba(255,255,255,.08);filter:drop-shadow(0 0 8px rgba(255,255,255,.18)) drop-shadow(0 8px 18px rgba(0,0,0,.42))}',
'.logo{display:block;width:min(230px,64%);max-height:124px;object-fit:contain;margin:0 auto 22px;padding:0;background:transparent;border-radius:0;filter:drop-shadow(0 7px 18px rgba(0,0,0,.40));-webkit-mask-image:radial-gradient(ellipse 78% 72% at 50% 50%,#000 50%,rgba(0,0,0,.96) 64%,rgba(0,0,0,.58) 80%,transparent 100%);mask-image:radial-gradient(ellipse 78% 72% at 50% 50%,#000 50%,rgba(0,0,0,.96) 64%,rgba(0,0,0,.58) 80%,transparent 100%);-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}'
),
(
'.eyebrow{text-transform:uppercase;letter-spacing:.13em;font-size:13px;font-weight:900;color:#fff;margin:0 0 10px;text-shadow:0 4px 14px rgba(0,0,0,.82)}',
'.eyebrow{text-transform:uppercase;letter-spacing:.13em;font-size:13px;font-weight:900;color:#fff;margin:0 0 18px;text-shadow:0 4px 14px rgba(0,0,0,.82)}'
),
(
'.messaggio-box{background:rgba(255,255,255,.70);color:#493340;border:1px solid rgba(255,255,255,.62);border-radius:18px;padding:12px 14px;margin:0 auto 14px;box-shadow:0 8px 22px rgba(90,45,72,.18);backdrop-filter:blur(2px)}',
'.messaggio-box{background:rgba(255,255,255,.70);color:#493340;border:1px solid rgba(255,255,255,.62);border-radius:18px;padding:14px 16px;margin:0 auto 22px;box-shadow:0 8px 22px rgba(90,45,72,.18);backdrop-filter:blur(2px)}'
),
(
'.messaggio{margin:0;font-size:15px;line-height:1.4;font-weight:680}',
'.messaggio{margin:0;font-size:16px;line-height:1.42;font-weight:680}'
),
(
'.stelle{margin-top:12px;font-size:29px;letter-spacing:.15em;color:#ffd85d;text-shadow:0 3px 9px rgba(0,0,0,.42)}',
'.stelle{margin-top:24px;font-size:30px;letter-spacing:.15em;color:#ffd85d;text-shadow:0 3px 9px rgba(0,0,0,.42)}'
),
(
'footer{position:fixed;z-index:6;right:max(18px,env(safe-area-inset-right));bottom:clamp(190px,18vh,250px);margin:0;font-size:10px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}',
'footer{position:fixed;z-index:6;right:max(18px,env(safe-area-inset-right));bottom:clamp(285px,33vh,500px);margin:0;font-size:10px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}'
),
(
'@media(max-width:640px){.scene-original{height:calc(100% - 74px)}.pagina{padding-top:max(7px,env(safe-area-inset-top));padding-bottom:116px}.logo{width:min(195px,56%);max-height:102px;margin-bottom:9px}.messaggio{font-size:15px}.eyebrow{font-size:12px}.bottone-google{min-height:54px;font-size:16px}.stelle{font-size:28px}footer{bottom:clamp(190px,18vh,235px)}}',
'@media(max-width:640px){.scene-original{inset:0;width:100%;height:100%;object-fit:cover;object-position:center center}.pagina{padding-top:clamp(30px,4.4vh,54px);padding-bottom:max(88px,calc(env(safe-area-inset-bottom) + 72px))}.logo{width:min(215px,62%);max-height:118px;margin-bottom:20px}.messaggio{font-size:16px}.eyebrow{font-size:12px;margin-bottom:17px}.messaggio-box{margin-bottom:21px}.bottone-google{min-height:56px;font-size:16px}.stelle{font-size:29px;margin-top:22px}footer{bottom:clamp(285px,33vh,470px)}}'
)
]

for old,new in replacements:
    assert old in block, f'Pattern non trovato: {old[:90]}'
    block=block.replace(old,new,1)

# In landscape non vogliamo che l'override rimetta il contain.
block=block.replace('.scene-original{object-fit:contain;object-position:left center}', '.scene-original{object-fit:cover;object-position:center center}', 1)

text=text[:start]+block+text[end:]
text=re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=17', text, count=1)
p.write_text(text,encoding='utf-8')

out=p.read_text(encoding='utf-8')
sec=out[out.find('function buildGelateriaTemplate'):out.find('function buildPremiumTemplate')]
assert 'object-fit:cover;object-position:center center' in sec
assert 'mask-image:radial-gradient' in sec
assert 'padding:clamp(34px,4.8vh,68px)' in sec
assert 'margin-top:24px' in sec
print('Gelateria fullscreen + composizione distanziata + logo in dissolvenza applicati')
