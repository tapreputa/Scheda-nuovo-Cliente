from pathlib import Path
import re

p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')

old = '''  const previewButton = document.getElementById("previewBtn");
  if (previewButton) previewButton.textContent = "Anteprima pagina";'''
new = '''  const previewButton = document.getElementById("previewBtn");
  if (previewButton) previewButton.textContent = isStandard ? "Anteprima link" : "Anteprima pagina";'''
assert old in text, 'Blocco testo anteprima non trovato'
text = text.replace(old, new, 1)

old = '''    finalNfcUrl = reviewUrl;
    finalLinkValue.textContent = finalNfcUrl;
    finalLinkBox.classList.add("show");
    addClientBtn.classList.add("show");
    return;'''
new = '''    finalNfcUrl = reviewUrl;
    finalLinkValue.textContent = finalNfcUrl;
    finalLinkBox.classList.add("show");
    previewBtn.textContent = "Anteprima link";
    previewBtn.classList.add("show");
    addClientBtn.classList.add("show");
    return;'''
assert old in text, 'Blocco Standard non trovato'
text = text.replace(old, new, 1)

# Per le categorie personalizzate mantieni il nome classico.
old = '''  finalLinkLabel.textContent = "Link pagina personalizzata da scrivere sulla NFC";
}'''
new = '''  finalLinkLabel.textContent = "Link pagina personalizzata da scrivere sulla NFC";
  previewBtn.textContent = "Anteprima pagina";
}'''
assert old in text, 'Blocco custom non trovato'
text = text.replace(old, new, 1)

text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=13', text, count=1)
p.write_text(text, encoding='utf-8')

out = p.read_text(encoding='utf-8')
assert 'previewBtn.classList.add("show")' in out
assert 'previewButton.textContent = isStandard ? "Anteprima link" : "Anteprima pagina"' in out
assert 'window.open(reviewUrl, "_blank", "noopener,noreferrer")' in out
print('Anteprima Standard abilitata')
