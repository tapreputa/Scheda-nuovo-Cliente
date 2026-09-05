from pathlib import Path

p = Path("personalizza.html")
s = p.read_text(encoding="utf-8")

if '<option value="hamburgeria">Hamburgeria</option>' not in s:
    s = s.replace('<option value="gelateria">Gelaterie</option>', '<option value="gelateria">Gelaterie</option>\n<option value="hamburgeria">Hamburgeria</option>', 1)

if 'hamburgeria: ["Hamburgeria"' not in s:
    s = s.replace('    ottica: [', '    hamburgeria: ["Hamburgeria", "Sfondo hamburgeria premium + pulsante recensioni + 5 stelle + Powered by Tapreputa."],\n    ottica: [', 1)

s = s.replace('"gelateria","ottica"', '"gelateria","hamburgeria","ottica"')

if 'type === "hamburgeria"' not in s:
    start = s.find('    } else if (type === "gelateria") {')
    end = s.find('    } else {', start)
    if start < 0 or end < 0:
        raise RuntimeError("Punto anteprima Gelateria non trovato")
    block = '''    } else if (type === "hamburgeria") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondohamburgeria.png");
      previewHtml = buildPremiumTemplate(logoDataUrl, reviewUrl, backgroundDataUrl, {title:"Ti è piaciuto il nostro burger?", accent:"#d88b28", accent2:"#9b4f12", theme:"#3b1d0d", box:"rgba(24,12,7,.58)", text:"#ffffff", message:"La tua opinione ci aiuta a migliorare ogni giorno gusto, qualità e servizio. Raccontaci la tua esperienza! Bastano 2 secondi!", shift:"translateY(-4px)", footerSize:"8px", footerStrong:"16px"});
      previewHtml = previewHtml.replace("</head>", `<style id="hamburgeria-logo-clean">.logo,.logo-wrap,.logo-box,.logo-container{background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border:none!important;filter:none!important}.logo{padding:0!important;border-radius:0!important}.logo-wrap:before,.logo-wrap:after,.logo-box:before,.logo-box:after,.logo-container:before,.logo-container:after{display:none!important}</style>` + "</head>");
'''
    s = s[:end] + block + s[end:]

assert '<option value="hamburgeria">Hamburgeria</option>' in s
assert 'hamburgeria: ["Hamburgeria"' in s
assert 'type === "hamburgeria"' in s
assert 'Sfondohamburgeria.png' in s

p.write_text(s, encoding="utf-8")
