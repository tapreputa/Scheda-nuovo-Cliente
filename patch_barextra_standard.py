from pathlib import Path
import re

p = Path('personalizza.html')
s = p.read_text(encoding='utf-8')

bar_opt = '<option value="bar">Bar / Caffetterie</option>'
extra_opt = '<option value="barextra">Bar extra</option>'
if extra_opt not in s:
    if bar_opt not in s:
        raise SystemExit('Bar option not found')
    s = s.replace(bar_opt, bar_opt + '\n' + extra_opt, 1)

# Rimuove il vecchio runtime separato: Bar extra deve usare la stessa pipeline delle altre categorie.
s = re.sub(r'\s*<script src="tap-barextra-bg\.js[^\"]*"></script>', '', s)
s = re.sub(r'\s*<script src="tap-barextra\.js[^\"]*"></script>', '', s)

# Aggiunge Bar extra alla whitelist della preview standard.
s = s.replace('"autolavaggio","bar","ristorante"', '"autolavaggio","bar","barextra","ristorante"')

marker = '''    if (type === "bar") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobar.png");
      previewHtml = buildBarTemplate(logoDataUrl, reviewUrl, backgroundDataUrl);
    } else if (type === "ristorante") {'''

replacement = '''    if (type === "bar") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobar.png");
      previewHtml = buildBarTemplate(logoDataUrl, reviewUrl, backgroundDataUrl);
    } else if (type === "barextra") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondobarextra.webp");
      previewHtml = buildPremiumTemplate(logoDataUrl, reviewUrl, backgroundDataUrl, {title:"Le nostre specialità ti hanno conquistato?", accent:"#ead9bd", accent2:"#c9ae84", theme:"#18221f", box:"rgba(18,20,18,.40)", text:"#ffffff", message:"Dalla colazione all’aperitivo, prepariamo ogni giorno delizie e prodotti genuini per rendere speciale ogni momento. Raccontaci la tua esperienza! Bastano 2 secondi!", shift:"none", footerSize:"9px", footerStrong:"18px"});
      previewHtml = previewHtml.replace("</head>", `<style id="barextra-layout-standard">html,body{background:#18221f!important}body{background-image:url("${backgroundDataUrl}")!important;background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important}.pagina{background:transparent!important}.pagina:before,.pagina:after{display:none!important;content:none!important;background:none!important}.logo{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;border-radius:0!important;max-height:108px!important;width:min(220px,58vw)!important;object-fit:contain!important;margin-bottom:clamp(62px,9vh,96px)!important;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))!important}.eyebrow{max-width:455px!important;margin:0 auto 11px!important;font-size:clamp(18px,4.2vw,25px)!important;line-height:1.12!important;letter-spacing:.055em!important;color:#fff!important;text-shadow:0 3px 15px rgba(0,0,0,.92)!important}.messaggio-box{max-width:455px!important;margin:0 auto 14px!important;padding:11px 14px!important;border-radius:16px!important;background:rgba(16,18,16,.40)!important;border:1px solid rgba(255,255,255,.28)!important}.messaggio{font-size:clamp(14px,3.3vw,16px)!important;line-height:1.36!important;font-weight:650!important}.bottone-google{width:auto!important;min-width:190px!important;min-height:44px!important;padding:9px 24px!important;border-radius:999px!important;background:rgba(245,236,220,.80)!important;color:#4c3927!important;border:1px solid rgba(255,255,255,.72)!important;box-shadow:0 8px 20px rgba(0,0,0,.18)!important;font-size:15px!important;font-weight:850!important;animation:none!important}.bottone-google:before,.bottone-google:after{display:none!important;content:none!important}.stelle{margin-top:13px!important;font-size:30px!important;letter-spacing:.17em!important;color:#ffd552!important;text-shadow:0 0 8px rgba(255,213,82,.95),0 0 22px rgba(255,170,55,.72),0 4px 12px rgba(0,0,0,.62)!important}footer{color:rgba(255,255,255,.92)!important}footer strong{color:#f5dca8!important}</style>` + "</head>");
    } else if (type === "ristorante") {'''

if 'loadBackgroundDataUrl("Sfondobarextra.webp")' not in s:
    if marker not in s:
        raise SystemExit('Standard preview chain not found')
    s = s.replace(marker, replacement, 1)

p.write_text(s, encoding='utf-8')
print('Bar extra integrated with standard preview pipeline')
