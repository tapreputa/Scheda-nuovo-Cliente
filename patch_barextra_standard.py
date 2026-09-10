from pathlib import Path
import re

# --- personalizza.html: usa l'immagine pubblica direttamente, come URL assoluto.
p = Path('personalizza.html')
s = p.read_text(encoding='utf-8')
start = s.find('    } else if (type === "barextra") {')
end = s.find('    } else if (type === "ristorante") {', start)
if start == -1 or end == -1:
    raise SystemExit('Blocco Bar extra non trovato in personalizza.html')

branch = '''    } else if (type === "barextra") {
      const backgroundDataUrl = new URL("Sfondobarextra.webp?v=20260910-2118", window.location.href).href;
      previewHtml = buildPremiumTemplate(logoDataUrl, reviewUrl, backgroundDataUrl, {title:"Le nostre specialità ti hanno conquistato?", accent:"#ead9bd", accent2:"#c9ae84", theme:"#18221f", box:"rgba(18,20,18,.40)", text:"#ffffff", message:"Dalla colazione all’aperitivo, prepariamo ogni giorno delizie e prodotti genuini per rendere speciale ogni momento. Raccontaci la tua esperienza! Bastano 2 secondi!", shift:"none", footerSize:"9px", footerStrong:"18px"});
      previewHtml = previewHtml.replace("</head>", `<style id="barextra-layout-standard">.logo{background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important;border-radius:0!important;max-height:108px!important;width:min(220px,58vw)!important;object-fit:contain!important;margin-bottom:clamp(62px,9vh,96px)!important;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))!important}.eyebrow{max-width:455px!important;margin:0 auto 11px!important;font-size:clamp(18px,4.2vw,25px)!important;line-height:1.12!important;letter-spacing:.055em!important;color:#fff!important;text-shadow:0 3px 15px rgba(0,0,0,.92)!important}.messaggio-box{max-width:455px!important;margin:0 auto 14px!important;padding:11px 14px!important;border-radius:16px!important;background:rgba(16,18,16,.40)!important;border:1px solid rgba(255,255,255,.28)!important}.messaggio{font-size:clamp(14px,3.3vw,16px)!important;line-height:1.36!important;font-weight:650!important}.bottone-google{width:auto!important;min-width:190px!important;min-height:44px!important;padding:9px 24px!important;border-radius:999px!important;background:rgba(245,236,220,.80)!important;color:#4c3927!important;border:1px solid rgba(255,255,255,.72)!important;box-shadow:0 8px 20px rgba(0,0,0,.18)!important;font-size:15px!important;font-weight:850!important;animation:none!important}.bottone-google:before,.bottone-google:after{display:none!important;content:none!important}.stelle{margin-top:13px!important;font-size:30px!important;letter-spacing:.17em!important;color:#ffd552!important;text-shadow:0 0 8px rgba(255,213,82,.95),0 0 22px rgba(255,170,55,.72),0 4px 12px rgba(0,0,0,.62)!important}footer{color:rgba(255,255,255,.92)!important}footer strong{color:#f5dca8!important}</style>` + "</head>");
'''
s = s[:start] + branch + s[end:]
p.write_text(s, encoding='utf-8')

# --- cliente.html: elimina il vecchio runtime speciale e usa il normale file di sfondo.
p = Path('cliente.html')
c = p.read_text(encoding='utf-8')
c = re.sub(r'\s*<script src="tap-barextra-bg\.js[^\"]*"></script>\s*', '\n', c, count=1)
c = c.replace("barextra:'',", "barextra:'Sfondobarextra.webp',", 1)
old = "const background=(cat==='barextra'&&window.TAP_BAREXTRA_BG)?window.TAP_BAREXTRA_BG:(bg[cat]||'Sfondobar.png');"
new = "const background=bg[cat]||'Sfondobar.png';"
if old in c:
    c = c.replace(old, new, 1)
elif new not in c:
    raise SystemExit('Resolver sfondo non trovato in cliente.html')
if "barextra:'Sfondobarextra.webp'" not in c:
    raise SystemExit('Mappatura Bar extra non applicata in cliente.html')
p.write_text(c, encoding='utf-8')

# --- tap-auth.js: il vecchio supporto Bar extra caricava tap-barextra-bg.js e
# tap-barextra.js dopo il caricamento pagina, sovrascrivendo la preview standard.
p = Path('tap-auth.js')
a = p.read_text(encoding='utf-8')
a_start = a.find('  function loadBarExtraSupport() {')
a_end = a.find('\n  const SUPABASE_URL =', a_start)
if a_start == -1 or a_end == -1:
    raise SystemExit('loadBarExtraSupport non trovato in tap-auth.js')
clean_loader = '''  function loadBarExtraSupport() {
    if (PAGE_NAME !== 'personalizza.html') return;
    const activityType = document.getElementById('activityType');
    if (activityType && !activityType.querySelector('option[value="barextra"]')) {
      const option = document.createElement('option');
      option.value = 'barextra';
      option.textContent = 'Bar extra';
      const bar = activityType.querySelector('option[value="bar"]');
      if (bar) bar.insertAdjacentElement('afterend', option);
      else activityType.appendChild(option);
    }
  }
'''
a = a[:a_start] + clean_loader + a[a_end:]
if "tap-barextra-bg.js?v=2" in a or "tap-barextra.js?v=2" in a:
    raise SystemExit('Runtime Bar extra obsoleto ancora presente in tap-auth.js')
p.write_text(a, encoding='utf-8')

print('Bar extra riparato: preview standard, renderer pubblico standard, runtime obsoleto disattivato')
