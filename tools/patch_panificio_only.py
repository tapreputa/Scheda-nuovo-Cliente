from pathlib import Path
import base64

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "personalizza.html"
STAGED = ROOT / "bg64" / "Sfondopanificio.webp.b64"
OUT = ROOT / "Sfondopanificio.webp"


def require(ok, message):
    if not ok:
        raise RuntimeError(message)


def main():
    # 1) Materializza lo sfondo definitivo ottimizzato già preparato.
    require(STAGED.exists(), "Staging Panificio mancante")
    raw = base64.b64decode(STAGED.read_text(encoding="ascii").strip())
    require(raw[:4] == b"RIFF" and raw[8:12] == b"WEBP", "Sfondo Panificio WebP non valido")
    require(len(raw) > 10000, "Sfondo Panificio troppo piccolo")
    OUT.write_bytes(raw)

    text = HTML.read_text(encoding="utf-8")

    # 2) Categoria nella tendina.
    option = '<option value="panificio">Panificio / Biscottificio</option>'
    if option not in text:
        marker = '<option value="centroestetico">Centri estetici</option>'
        require(marker in text, "Marker select categorie non trovato")
        text = text.replace(marker, marker + '\n' + option, 1)

    # 3) Descrizione categoria.
    desc = '    panificio: ["Panificio / Biscottificio", "Sfondo artigianale caldo + layout dedicato senza crop + pulsante recensioni + 5 stelle + Powered by Tapreputa."]'
    if desc not in text:
        marker = '    centroestetico: ["Centri estetici", "Sfondo wellness luminoso + stile raffinato + pulsante premium + 5 stelle + Powered by Tapreputa."]'
        require(marker in text, "Marker descrizione categoria non trovato")
        text = text.replace(marker, marker + ',\n' + desc, 1)

    # 4) Abilita il template sia in Genera sia in Anteprima.
    old = '["standard","bar","ristorante","ristorantemare","pizzeria","gelateria","stabilimento","parrucchiere","barbershop","centroestetico"]'
    new = '["standard","bar","ristorante","ristorantemare","pizzeria","gelateria","stabilimento","parrucchiere","barbershop","centroestetico","panificio"]'
    text = text.replace(old, new)
    require(text.count(new) >= 2, "Whitelist Panificio non aggiornata in entrambi i flussi")

    # 5) Anteprima dedicata Panificio: sfondo 9:16 mostrato per intero, senza cover/crop.
    branch_marker = '''    } else if (type === "gelateria") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondogelateria.jpg");
      previewHtml = buildGelateriaTemplate(logoDataUrl, reviewUrl, backgroundDataUrl);
    } else {'''
    pan_branch = '''    } else if (type === "panificio") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondopanificio.webp");
      previewHtml = buildPanificioTemplate(logoDataUrl, reviewUrl, backgroundDataUrl);
    } else if (type === "gelateria") {
      const backgroundDataUrl = await loadBackgroundDataUrl("Sfondogelateria.jpg");
      previewHtml = buildGelateriaTemplate(logoDataUrl, reviewUrl, backgroundDataUrl);
    } else {'''
    if 'buildPanificioTemplate(logoDataUrl, reviewUrl, backgroundDataUrl)' not in text:
        require(branch_marker in text, "Marker ramo anteprima non trovato")
        text = text.replace(branch_marker, pan_branch, 1)

    # 6) Template master dedicato.
    if 'function buildPanificioTemplate(' not in text:
        marker = 'function buildGelateriaTemplate(logo, reviewUrl, backgroundDataUrl) {'
        require(marker in text, "Marker funzione Gelateria non trovato")
        template = r'''function buildPanificioTemplate(logo, reviewUrl, backgroundDataUrl) {
  const safeUrl = escapeHtml(reviewUrl);
  return `<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"><meta name="theme-color" content="#6f3d20"><title>Recensioni</title><style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}body{min-height:100vh;min-height:100dvh;overflow-x:hidden;background:#6f3d20;color:#fff}.scene-original{position:fixed;inset:0;width:100%;height:100%;object-fit:fill;object-position:center center;z-index:0;pointer-events:none;background:#6f3d20}.pagina{position:relative;z-index:2;min-height:100vh;min-height:100dvh;display:flex;align-items:flex-start;justify-content:center;padding:clamp(112px,13.5vh,185px) 16px max(92px,calc(env(safe-area-inset-bottom) + 76px))}.card{width:min(100%,520px);text-align:center;padding:0 8px 14px}.logo{display:block;width:min(220px,62%);max-height:118px;object-fit:contain;margin:0 auto 18px;padding:5px 9px;border-radius:18px;background:rgba(255,250,242,.10);filter:drop-shadow(0 8px 20px rgba(48,22,8,.46))}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:13px;font-weight:900;color:#fff9ef;margin:0 0 16px;text-shadow:0 3px 12px rgba(56,28,10,.82)}.messaggio-box{background:rgba(255,249,239,.74);color:#3d281a;border:1px solid rgba(255,255,255,.56);border-radius:18px;padding:14px 16px;margin:0 auto 19px;box-shadow:0 10px 24px rgba(74,35,12,.20);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}.messaggio{margin:0;font-size:16px;line-height:1.42;font-weight:680}.bottone-google{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:56px;width:100%;border-radius:17px;text-decoration:none;color:#fff;font-weight:900;font-size:16px;padding:13px 18px;background:linear-gradient(135deg,#c98543,#7a431f 56%,#a45d2d);box-shadow:0 15px 32px rgba(61,29,10,.34),inset 0 1px 0 rgba(255,255,255,.25);border:1px solid rgba(255,220,166,.34);animation:panPulse 2.8s ease-in-out infinite}.bottone-google:before{content:"";position:absolute;top:-20%;left:-45%;width:34%;height:140%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);transform:skewX(-20deg);animation:panShine 3.6s ease-in-out infinite}.bottone-google:after{content:"✦";position:absolute;right:18px;font-size:18px;color:#ffe1a0;text-shadow:0 0 10px rgba(255,218,145,.8);animation:panSpark 1.8s ease-in-out infinite}.stelle{margin-top:19px;font-size:29px;letter-spacing:.15em;color:#ffd56a;text-shadow:0 3px 9px rgba(66,31,10,.52)}@keyframes panShine{0%,55%{left:-45%;opacity:0}60%{opacity:1}85%{left:120%;opacity:1}100%{left:120%;opacity:0}}@keyframes panPulse{50%{transform:scale(1.018)}}@keyframes panSpark{50%{opacity:1;transform:scale(1.15) rotate(12deg)}}footer{position:fixed;z-index:6;right:max(12px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));margin:0;font-size:9px;font-weight:650;color:#fff;text-align:right;text-shadow:0 3px 10px rgba(45,20,8,.95)}footer strong{display:block;color:#ffe1a8;font-size:18px;line-height:1.05;font-weight:950;letter-spacing:.02em}@media(max-width:640px){.scene-original{object-fit:fill;object-position:center center}.pagina{padding-top:clamp(105px,13vh,150px);padding-bottom:max(88px,calc(env(safe-area-inset-bottom) + 72px))}.logo{width:min(205px,60%);max-height:108px;margin-bottom:16px}.eyebrow{font-size:12px;margin-bottom:14px}.messaggio-box{padding:13px 15px;margin-bottom:18px}.messaggio{font-size:15px;line-height:1.40}.bottone-google{min-height:54px;font-size:16px}.stelle{font-size:28px;margin-top:18px}}@media (orientation:landscape) and (max-height:680px){.scene-original{object-fit:fill;object-position:center center}.pagina{min-height:100dvh;align-items:center;padding:10px 16px 50px}.card{width:min(100%,900px);display:grid;grid-template-columns:minmax(125px,.58fr) minmax(0,1.42fr);grid-template-areas:"logo eyebrow" "logo message" "logo button" "logo stars";align-items:center;column-gap:20px;row-gap:8px;padding:0}.logo{grid-area:logo;width:min(220px,100%);max-height:min(29vh,116px);margin:0 auto}.eyebrow{grid-area:eyebrow;margin:0;font-size:12px;line-height:1.2;letter-spacing:.12em}.messaggio-box{grid-area:message;margin:0;padding:9px 12px;border-radius:14px}.messaggio{font-size:14px;line-height:1.32}.bottone-google{grid-area:button;min-height:48px;font-size:15px;padding:8px 14px;border-radius:14px}.stelle{grid-area:stars;margin-top:1px;font-size:24px;line-height:1}footer{right:14px;bottom:9px;font-size:9px}footer strong{font-size:18px}}@media(prefers-reduced-motion:reduce){.bottone-google,.bottone-google:before,.bottone-google:after{animation:none!important}}</style></head><body><img class="scene-original" src="${backgroundDataUrl}" alt=""><main class="pagina"><section class="card"><img class="logo" src="${logo}" alt="Logo attività"><div class="eyebrow">Ti sono piaciuti i nostri prodotti da forno?</div><div class="messaggio-box"><p class="messaggio">La tua opinione ci aiuta a portare in tavola ogni giorno pane, biscotti e bontà ancora migliori. Raccontaci la tua esperienza! Bastano 2 secondi!</p></div><a class="bottone-google" href="${safeUrl}" target="_blank" rel="noopener noreferrer" aria-label="Lascia una recensione Google">Recensione Google</a><div class="stelle" aria-label="5 stelle">★★★★★</div><footer>Powered by <strong>Tapreputa</strong></footer></section></main></body></html>`;
}

'''
        text = text.replace(marker, template + marker, 1)

    # Cache bust del polish, senza toccare gli stili condivisi.
    text = text.replace('tap-premium-polish.css?v=19', 'tap-premium-polish.css?v=20')
    HTML.write_text(text, encoding="utf-8")

    # 7) QA statico mirato alla sola categoria Panificio.
    final = HTML.read_text(encoding="utf-8")
    checks = [
        '<option value="panificio">Panificio / Biscottificio</option>',
        'panificio: ["Panificio / Biscottificio"',
        'buildPanificioTemplate(logoDataUrl, reviewUrl, backgroundDataUrl)',
        'loadBackgroundDataUrl("Sfondopanificio.webp")',
        'function buildPanificioTemplate(',
        'finalNfcUrl = "https://tapreputa.github.io/" + slug + "/";',
        'previewBtn.classList.toggle("show", type !== "standard")',
    ]
    for item in checks:
        require(item in final, f"QA fallito: {item}")
    require(OUT.exists() and OUT.stat().st_size > 10000, "QA sfondo Panificio fallito")
    print("QA PANIFICIO OK")

    # Rimuove solo gli staging Panificio e il vecchio script multi-categoria.
    for p in [
        STAGED,
        ROOT / "tools" / "newcat-assets" / "Sfondopanificio.webp.b64.part00",
        ROOT / "tools" / "expand_new_categories.py",
        ROOT / "tools" / "direct-upload-note.txt",
    ]:
        if p.exists():
            p.unlink()


if __name__ == "__main__":
    main()
