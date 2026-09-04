from pathlib import Path
import re

p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')

# 1. Il link recensioni resta interno: in pagina si mostra solo il link effettivamente da scrivere sulla NFC.
visible_review = '''<div class="field">
<label for="destinationUrl">Link recensioni Google</label>
<input id="destinationUrl" type="url" placeholder="https://search.google.com/local/writereview?placeid=...">
<div class="hint">Questo sarà il collegamento del pulsante “Recensione Google”.</div>
</div>'''
assert visible_review in text, 'Campo recensioni visibile non trovato'
text = text.replace(visible_review, '<input id="destinationUrl" type="hidden">', 1)

# 2. Nel box risultato restano solo link NFC e Copia link. Anteprima separata.
old_box = '''<div id="finalLinkBox" class="final-link-box">
  <span class="final-link-label">Link finale da scrivere sulla NFC</span>
  <div class="final-link-row">
    <div id="finalLinkValue" class="final-link-value"></div>
  </div>

  <button id="previewBtn" class="preview-final" type="button">
    Anteprima pagina
  </button>

  <button id="copyFinalBtn" class="copy-final copy-wide" type="button">
    Copia link
  </button>
</div>

<button id="addClientBtn" class="add-client" type="button">'''
new_box = '''<div id="finalLinkBox" class="final-link-box">
  <span class="final-link-label">Link da scrivere sulla NFC</span>
  <div class="final-link-row">
    <div id="finalLinkValue" class="final-link-value"></div>
  </div>
  <button id="copyFinalBtn" class="copy-final copy-wide" type="button">
    Copia link
  </button>
</div>

<button id="previewBtn" class="preview-final" type="button">Anteprima pagina</button>

<button id="addClientBtn" class="add-client" type="button">'''
assert old_box in text, 'Box link finale non trovato'
text = text.replace(old_box, new_box, 1)

# 3. Anteprima nascosta finché non viene generato un template personalizzato.
old_preview_css = '''.preview-final{
  width:100%;
  min-height:58px;'''
new_preview_css = '''.preview-final{
  display:none;
  width:100%;
  min-height:58px;'''
assert old_preview_css in text, 'CSS preview non trovato'
text = text.replace(old_preview_css, new_preview_css, 1)
css_anchor = '''  cursor:pointer;
}
.copy-wide{'''
css_replace = '''  cursor:pointer;
}
.preview-final.show{display:block}
.copy-wide{'''
assert css_anchor in text, 'Fine CSS preview non trovata'
text = text.replace(css_anchor, css_replace, 1)

# 4. Il primo listener categoria gestisce solo categoria/logo; output viene sincronizzato dopo l'inizializzazione.
old_dynamic = '''  const previewButton = document.getElementById("previewBtn");
  if (previewButton) previewButton.textContent = isStandard ? "Apri pagina recensioni" : "Anteprima pagina";

  const finalLabel = document.querySelector(".final-link-label");
  if (finalLabel) finalLabel.textContent = isStandard ? "Link diretto da scrivere sulla NFC" : "Link finale da scrivere sulla NFC";'''
new_dynamic = '''  const previewButton = document.getElementById("previewBtn");
  if (previewButton) previewButton.textContent = "Anteprima pagina";'''
assert old_dynamic in text, 'Logica dinamica label/preview non trovata'
text = text.replace(old_dynamic, new_dynamic, 1)

# 5. Aggiunge controllo del bottone genera e sincronizzazione Standard/custom.
old_consts = '''const finalLinkBox = document.getElementById("finalLinkBox");
const finalLinkValue = document.getElementById("finalLinkValue");
const copyFinalBtn = document.getElementById("copyFinalBtn");
const previewBtn = document.getElementById("previewBtn");
const addClientBtn = document.getElementById("addClientBtn");
let finalNfcUrl = "";'''
new_consts = '''const finalLinkBox = document.getElementById("finalLinkBox");
const finalLinkValue = document.getElementById("finalLinkValue");
const copyFinalBtn = document.getElementById("copyFinalBtn");
const previewBtn = document.getElementById("previewBtn");
const addClientBtn = document.getElementById("addClientBtn");
const generateBtn = document.getElementById("generateBtn");
const finalLinkLabel = document.querySelector(".final-link-label");
let finalNfcUrl = "";

function syncNfcMode() {
  const type = activityType.value;
  const reviewUrl = normalizeReviewUrl(destinationUrl.value);
  destinationUrl.value = reviewUrl;

  finalNfcUrl = "";
  finalLinkValue.textContent = "";
  finalLinkBox.classList.remove("show");
  addClientBtn.classList.remove("show");
  addClientBtn.disabled = false;
  addClientBtn.textContent = "+ Aggiungi cliente";
  previewBtn.classList.remove("show");
  generateBtn.style.display = "";
  msg.className = "message";
  msg.textContent = "";

  if (!type) return;

  if (type === "standard") {
    generateBtn.style.display = "none";
    finalLinkLabel.textContent = "Link diretto Google da scrivere sulla NFC";
    if (!reviewUrl) return warn("Link recensioni non disponibile. Torna alla pagina precedente.");
    finalNfcUrl = reviewUrl;
    finalLinkValue.textContent = finalNfcUrl;
    finalLinkBox.classList.add("show");
    addClientBtn.classList.add("show");
    return;
  }

  finalLinkLabel.textContent = "Link pagina personalizzata da scrivere sulla NFC";
}

activityType.addEventListener("change", syncNfcMode);
syncNfcMode();'''
assert old_consts in text, 'Costanti link finale non trovate'
text = text.replace(old_consts, new_consts, 1)

# 6. Generazione: per custom mostra link NFC, copia, anteprima e salvataggio; Standard è già pronto automaticamente.
text = text.replace('document.getElementById("generateBtn").onclick = () => {', 'generateBtn.onclick = () => {', 1)

old_success = '''  finalLinkValue.textContent = finalNfcUrl;
  finalLinkBox.classList.add("show");

  msg.className = "message show ok";
  msg.textContent = type === "standard"
    ? "Link diretto alle recensioni pronto. Copialo e scrivilo sulla NFC."
    : "Link finale generato. Copialo e incollalo in NFC Tools.";
  addClientBtn.classList.add("show");'''
new_success = '''  finalLinkValue.textContent = finalNfcUrl;
  finalLinkBox.classList.add("show");
  previewBtn.classList.toggle("show", type !== "standard");
  msg.className = "message";
  msg.textContent = "";
  addClientBtn.classList.add("show");'''
assert old_success in text, 'Blocco successo generazione non trovato'
text = text.replace(old_success, new_success, 1)

# 7. Se cambia categoria, il secondo listener azzera link vecchi e prepara automaticamente Standard.
# Forza refresh CSS condiviso.
text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=12', text, count=1)

p.write_text(text, encoding='utf-8')

# Sanity checks
out = p.read_text(encoding='utf-8')
assert '<label for="destinationUrl">Link recensioni Google</label>' not in out
assert '<input id="destinationUrl" type="hidden">' in out
assert 'Link diretto Google da scrivere sulla NFC' in out
assert 'Link pagina personalizzata da scrivere sulla NFC' in out
assert 'generateBtn.style.display = "none"' in out
assert 'preview-final show' not in out  # viene mostrata via classList, non hardcoded
assert 'previewBtn.classList.toggle("show", type !== "standard")' in out
assert 'addClientBtn.classList.add("show")' in out
print('Flusso NFC standard/custom aggiornato')
