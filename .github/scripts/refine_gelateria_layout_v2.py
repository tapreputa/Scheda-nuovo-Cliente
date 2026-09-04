from pathlib import Path
import re

p=Path('personalizza.html')
text=p.read_text(encoding='utf-8')
start=text.find('function buildGelateriaTemplate(logo, reviewUrl, backgroundDataUrl) {')
end=text.find('function buildPremiumTemplate(logo, reviewUrl, backgroundDataUrl, cfg) {', start)
assert start!=-1 and end!=-1, 'Template Gelateria non trovato'
block=text[start:end]

repls={
'.scene-original{position:fixed;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;z-index:0;pointer-events:none;background:#000}':'.scene-original{position:fixed;top:0;left:0;width:100%;height:calc(100% - 72px);object-fit:contain;object-position:center bottom;z-index:0;pointer-events:none;background:#000}',
'.pagina{position:relative;z-index:2;min-height:100vh;min-height:100dvh;display:flex;align-items:flex-start;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 16px 118px}':'.pagina{position:relative;z-index:2;min-height:100vh;min-height:100dvh;display:flex;align-items:flex-start;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 16px 112px}',
'.logo{display:block;width:min(285px,82%);max-height:150px;object-fit:contain;margin:0 auto 18px;padding:7px 10px;border-radius:20px;background:rgba(255,255,255,.12);filter:drop-shadow(0 0 10px rgba(255,255,255,.24)) drop-shadow(0 10px 24px rgba(0,0,0,.45))}':'.logo{display:block;width:min(205px,58%);max-height:108px;object-fit:contain;margin:0 auto 10px;padding:4px 7px;border-radius:14px;background:rgba(255,255,255,.08);filter:drop-shadow(0 0 8px rgba(255,255,255,.18)) drop-shadow(0 8px 18px rgba(0,0,0,.42))}',
'.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:14px;font-weight:900;color:#fff;margin:0 0 15px;text-shadow:0 4px 14px rgba(0,0,0,.82)}':'.eyebrow{text-transform:uppercase;letter-spacing:.13em;font-size:13px;font-weight:900;color:#fff;margin:0 0 10px;text-shadow:0 4px 14px rgba(0,0,0,.82)}',
'.messaggio-box{background:rgba(255,255,255,.70);color:#493340;border:1px solid rgba(255,255,255,.62);border-radius:19px;padding:15px 16px;margin:0 auto 21px;box-shadow:0 8px 22px rgba(90,45,72,.18);backdrop-filter:blur(2px)}':'.messaggio-box{background:rgba(255,255,255,.70);color:#493340;border:1px solid rgba(255,255,255,.62);border-radius:18px;padding:12px 14px;margin:0 auto 14px;box-shadow:0 8px 22px rgba(90,45,72,.18);backdrop-filter:blur(2px)}',
'.messaggio{margin:0;font-size:17px;line-height:1.46;font-weight:680}':'.messaggio{margin:0;font-size:15px;line-height:1.4;font-weight:680}',
'min-height:62px;width:100%;border-radius:18px': 'min-height:54px;width:100%;border-radius:17px',
'.stelle{margin-top:18px;font-size:30px;letter-spacing:.16em;color:#ffd85d;text-shadow:0 3px 9px rgba(0,0,0,.42)}':'.stelle{margin-top:12px;font-size:29px;letter-spacing:.15em;color:#ffd85d;text-shadow:0 3px 9px rgba(0,0,0,.42)}',
'footer{position:fixed;z-index:6;right:max(18px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));margin:0;font-size:11px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}': 'footer{position:fixed;z-index:6;right:max(18px,env(safe-area-inset-right));bottom:clamp(190px,18vh,250px);margin:0;font-size:10px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}',
'footer strong{display:block;color:#fff;font-size:23px;line-height:1.05;font-weight:950;letter-spacing:.02em}':'footer strong{display:block;color:#fff;font-size:20px;line-height:1.05;font-weight:950;letter-spacing:.02em}',
'@media(max-width:640px){.pagina{padding-top:max(8px,env(safe-area-inset-top));padding-bottom:124px}.logo{width:min(270px,82%);max-height:142px;margin-bottom:16px}.messaggio{font-size:16px}.eyebrow{font-size:13px}.bottone-google{min-height:58px;font-size:16px}.stelle{font-size:28px}}':'@media(max-width:640px){.scene-original{height:calc(100% - 74px)}.pagina{padding-top:max(7px,env(safe-area-inset-top));padding-bottom:116px}.logo{width:min(195px,56%);max-height:102px;margin-bottom:9px}.messaggio{font-size:15px}.eyebrow{font-size:12px}.bottone-google{min-height:54px;font-size:16px}.stelle{font-size:28px}footer{bottom:clamp(190px,18vh,235px)}}'
}
for old,new in repls.items():
    assert old in block, f'Pattern non trovato: {old[:80]}'
    block=block.replace(old,new,1)

text=text[:start]+block+text[end:]
text=re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=16', text, count=1)
p.write_text(text,encoding='utf-8')

out=p.read_text(encoding='utf-8')
sec=out[out.find('function buildGelateriaTemplate'):out.find('function buildPremiumTemplate')]
assert 'height:calc(100% - 74px)' in sec
assert 'width:min(195px,56%)' in sec
assert 'bottom:clamp(190px,18vh,235px)' in sec
print('Gelateria layout rifinito senza alterare lo sfondo originale')
