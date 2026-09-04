from pathlib import Path
import re

p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')

# 1) Usa un template dedicato alla Gelateria, invece del template premium generico.
old_dispatch = '''    } else {
      const configs = {
        pizzeria: {file:"Sfondopizzeria.jpg", title:"Ti è piaciuta la nostra pizza?", accent:"#c24b22", accent2:"#7d2415", theme:"#5b2418", box:"rgba(255,247,235,.62)", text:"#402015", message:"Il tuo feedback è l’ingrediente che ci aiuta a migliorare ogni giorno. Dicci la tua! Bastano 2 secondi!"},
        gelateria: {file:"Sfondogelateria.jpg", title:"Ti è piaciuto il nostro gelato?", accent:"#df5f91", accent2:"#58aeb1", theme:"#d85b8b", box:"rgba(255,255,255,.68)", text:"#493340", message:"La tua opinione rende tutto ancora più dolce. Raccontaci la tua esperienza! Bastano 2 secondi!"},'''
new_dispatch = '''    } else if (type === "gelateria") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondogelateria.jpg");
      previewHtml = buildGelateriaTemplate(logoDataUrl, reviewUrl, backgroundDataUrl);
    } else {
      const configs = {
        pizzeria: {file:"Sfondopizzeria.jpg", title:"Ti è piaciuta la nostra pizza?", accent:"#c24b22", accent2:"#7d2415", theme:"#5b2418", box:"rgba(255,247,235,.62)", text:"#402015", message:"Il tuo feedback è l’ingrediente che ci aiuta a migliorare ogni giorno. Dicci la tua! Bastano 2 secondi!"},'''
assert old_dispatch in text, 'Dispatch Gelateria non trovato'
text = text.replace(old_dispatch, new_dispatch, 1)

# 2) Inserisce il template speciale prima del template premium generico.
anchor = 'function buildPremiumTemplate(logo, reviewUrl, backgroundDataUrl, cfg) {'
assert anchor in text, 'Anchor buildPremiumTemplate non trovato'

gelateria_fn = r'''function buildGelateriaTemplate(logo, reviewUrl, backgroundDataUrl) {
  const safeUrl = escapeHtml(reviewUrl);
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><meta name="theme-color" content="#d85b8b"><title>Recensioni</title><style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}body{min-height:100vh;min-height:100dvh;overflow-x:hidden;background:#eadfe6;color:#fff}.scene-fill,.scene-original{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}.scene-fill{object-fit:cover;object-position:center center;filter:blur(18px) saturate(1.08);transform:scale(1.08);opacity:.52;z-index:0}.scene-original{object-fit:contain;object-position:center bottom;z-index:1}.veil{position:fixed;inset:0;z-index:2;pointer-events:none;background:linear-gradient(180deg,rgba(18,10,16,.18) 0%,rgba(25,14,22,.08) 42%,rgba(19,10,16,.05) 70%,rgba(12,6,10,.18) 100%)}.pagina{position:relative;z-index:4;min-height:100vh;min-height:100dvh;display:flex;align-items:flex-start;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 16px 118px}.card{width:min(100%,530px);text-align:center;padding:0 8px 14px}.logo{display:block;width:min(285px,82%);max-height:150px;object-fit:contain;margin:0 auto 18px;padding:7px 10px;border-radius:20px;background:rgba(255,255,255,.12);filter:drop-shadow(0 0 10px rgba(255,255,255,.24)) drop-shadow(0 10px 24px rgba(0,0,0,.45))}.eyebrow{text-transform:uppercase;letter-spacing:.14em;font-size:14px;font-weight:900;color:#fff;margin:0 0 15px;text-shadow:0 4px 14px rgba(0,0,0,.82)}.messaggio-box{background:rgba(255,255,255,.70);color:#493340;border:1px solid rgba(255,255,255,.62);border-radius:19px;padding:15px 16px;margin:0 auto 21px;box-shadow:0 8px 22px rgba(90,45,72,.18);backdrop-filter:blur(2px)}.messaggio{margin:0;font-size:17px;line-height:1.46;font-weight:680}.bottone-google{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:62px;width:100%;border-radius:18px;text-decoration:none;color:#fff;font-weight:900;font-size:17px;padding:14px 18px;background:linear-gradient(135deg,#d55791,#58aeb1 54%,#d55791);box-shadow:0 16px 35px rgba(70,35,59,.30),inset 0 1px 0 rgba(255,255,255,.28);border:1px solid rgba(255,255,255,.32);animation:gelPulse 2.8s ease-in-out infinite}.bottone-google:before{content:"";position:absolute;top:-20%;left:-45%;width:34%;height:140%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.42),transparent);transform:skewX(-20deg);animation:gelShine 3.6s ease-in-out infinite}.bottone-google:after{content:"✦";position:absolute;right:18px;font-size:18px;color:#fff4bc;text-shadow:0 0 10px rgba(255,255,255,.88);animation:gelSpark 1.8s ease-in-out infinite}.stelle{margin-top:18px;font-size:30px;letter-spacing:.16em;color:#ffd85d;text-shadow:0 3px 9px rgba(0,0,0,.42)}@keyframes gelShine{0%,55%{left:-45%;opacity:0}60%{opacity:1}85%{left:120%;opacity:1}100%{left:120%;opacity:0}}@keyframes gelPulse{50%{transform:scale(1.018)}}@keyframes gelSpark{50%{opacity:1;transform:scale(1.15) rotate(12deg)}}.cup-brand{position:fixed;z-index:3;display:block;width:clamp(44px,10.5vw,72px);height:clamp(34px,8vw,54px);object-fit:contain;padding:5px 7px;background:rgba(255,255,255,.88);border:1px solid rgba(255,255,255,.92);border-radius:11px;box-shadow:0 5px 14px rgba(58,27,44,.28);backdrop-filter:blur(2px);pointer-events:none}.cup-left{left:22%;bottom:max(8.5%,calc(env(safe-area-inset-bottom) + 54px));transform:translateX(-50%) rotate(-6deg)}.cup-center{left:53.5%;bottom:max(7.0%,calc(env(safe-area-inset-bottom) + 45px));transform:translateX(-50%) rotate(2deg)}.cup-right{left:79%;bottom:max(8.5%,calc(env(safe-area-inset-bottom) + 54px));transform:translateX(-50%) rotate(6deg)}footer{position:fixed;z-index:6;right:max(18px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));margin:0;font-size:11px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(0,0,0,.95)}footer strong{display:block;color:#fff;font-size:23px;line-height:1.05;font-weight:950;letter-spacing:.02em}@media(max-width:640px){.pagina{padding-top:max(8px,env(safe-area-inset-top));padding-bottom:124px}.logo{width:min(270px,82%);max-height:142px;margin-bottom:16px}.messaggio{font-size:16px}.eyebrow{font-size:13px}.bottone-google{min-height:58px;font-size:16px}.stelle{font-size:28px}.cup-brand{width:clamp(42px,10vw,62px);height:clamp(32px,7.5vw,47px)}}@media (orientation:landscape) and (max-height:680px){.scene-original{object-fit:contain;object-position:left center}.pagina{min-height:100dvh;align-items:center;padding:10px 16px 50px}.card{width:min(100%,900px);display:grid;grid-template-columns:minmax(125px,.58fr) minmax(0,1.42fr);grid-template-areas:"logo eyebrow" "logo message" "logo button" "logo stars";align-items:center;column-gap:20px;row-gap:8px;padding:0}.logo{grid-area:logo;width:min(220px,100%);max-height:min(29vh,116px);margin:0 auto;padding:6px 9px;border-radius:17px}.eyebrow{grid-area:eyebrow;margin:0;font-size:12px;line-height:1.2;letter-spacing:.12em}.messaggio-box{grid-area:message;margin:0;padding:9px 12px;border-radius:14px}.messaggio{font-size:14px;line-height:1.32}.bottone-google{grid-area:button;min-height:48px;font-size:15px;padding:8px 14px;border-radius:14px}.stelle{grid-area:stars;margin-top:1px;font-size:24px;line-height:1}.cup-brand{display:none}footer{right:14px;bottom:9px;font-size:9px}footer strong{font-size:18px}}@media(prefers-reduced-motion:reduce){.bottone-google,.bottone-google:before,.bottone-google:after{animation:none!important}}</style></head><body><img class="scene-fill" src="${backgroundDataUrl}" alt=""><img class="scene-original" src="${backgroundDataUrl}" alt=""><div class="veil"></div><img class="cup-brand cup-left" src="${logo}" alt=""><img class="cup-brand cup-center" src="${logo}" alt=""><img class="cup-brand cup-right" src="${logo}" alt=""><main class="pagina"><section class="card"><img class="logo" src="${logo}" alt="Logo attività"><div class="eyebrow">Ti è piaciuto il nostro gelato?</div><div class="messaggio-box"><p class="messaggio">La tua opinione rende tutto ancora più dolce. Raccontaci la tua esperienza! Bastano 2 secondi!</p></div><a class="bottone-google" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Recensione Google</a><div class="stelle">★★★★★</div><footer>Powered by <strong>Tapreputa</strong></footer></section></main></body></html>`;
}

'''

text = text.replace(anchor, gelateria_fn + anchor, 1)

# 3) Cache bust della pagina Personalizza.
text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=14', text, count=1)

p.write_text(text, encoding='utf-8')

out = p.read_text(encoding='utf-8')
assert 'buildGelateriaTemplate' in out
assert 'scene-original' in out
assert 'object-fit:contain' in out
assert 'cup-brand cup-left' in out
assert 'cup-brand cup-center' in out
assert 'cup-brand cup-right' in out
assert 'previewHtml = buildGelateriaTemplate' in out
print('Template Gelateria rifinito: sfondo intero + loghi dinamici sulle coppette')
