from pathlib import Path

# --- index.html ---
p = Path('index.html')
s = p.read_text(encoding='utf-8')

marker = "  document.getElementById('generateBtn').addEventListener('click', () => {"
helper = """  function normalizePlaceIdInput(value) {
    let current = String(value || '').trim();

    for (let i = 0; i < 5; i++) {
      const match = current.match(/[?&]placeid=([^&#]+)/i);
      if (!match) break;

      let next = match[1];
      try { next = decodeURIComponent(next); } catch {}
      next = next.trim();

      if (!next || next === current) break;
      current = next;
    }

    return current;
  }

"""

if 'function normalizePlaceIdInput(value)' not in s:
    if marker not in s:
        raise SystemExit('Listener Genera link non trovato in index.html')
    s = s.replace(marker, helper + marker, 1)

s = s.replace(
    "    const placeIdValue = placeid.value.trim();\n\n    if (!placeIdValue) {",
    "    let placeIdValue = normalizePlaceIdInput(placeid.value);\n\n    if (!placeIdValue) {",
    1,
)

old = """    reviewUrl = BASE_REVIEW_URL + placeIdValue;

    generatedLink.textContent = reviewUrl;"""
new = """    if (/^https?:\\/\\//i.test(placeIdValue)) {
      msg.className = 'message show warn';
      msg.textContent = 'Il valore inserito non contiene un Place ID valido.';
      result.classList.remove('show');
      return;
    }

    placeid.value = placeIdValue;
    reviewUrl = BASE_REVIEW_URL + placeIdValue;

    generatedLink.textContent = reviewUrl;"""
if old in s:
    s = s.replace(old, new, 1)

s = s.replace('placeholder="Es. ChIJ..."', 'placeholder="Es. ChIJ... oppure incolla il link completo"', 1)
p.write_text(s, encoding='utf-8')

# --- personalizza.html ---
p = Path('personalizza.html')
s = p.read_text(encoding='utf-8')

params_marker = 'const incomingParams = new URLSearchParams(window.location.search);'
helper = """function normalizeReviewUrl(value) {
  const prefix = \"https://search.google.com/local/writereview?placeid=\";
  let current = String(value || \"\").trim();

  if (!current) return \"\";

  if (current.startsWith(prefix)) {
    let placePart = current.slice(prefix.length);
    for (let i = 0; i < 5 && placePart.startsWith(prefix); i++) {
      placePart = placePart.slice(prefix.length);
    }
    return prefix + placePart;
  }

  return current;
}

"""
if 'function normalizeReviewUrl(value)' not in s:
    if params_marker not in s:
        raise SystemExit('Parametri iniziali non trovati in personalizza.html')
    s = s.replace(params_marker, helper + params_marker, 1)

s = s.replace('  destinationUrl.value = incomingReviewUrl;', '  destinationUrl.value = normalizeReviewUrl(incomingReviewUrl);', 1)
s = s.replace('const reviewUrl = destinationUrl.value.trim();', 'const reviewUrl = normalizeReviewUrl(destinationUrl.value);\n  destinationUrl.value = reviewUrl;')

old_standard = """  if (type === \"standard\") {
    const win = window.open(reviewUrl, \"_blank\", \"noopener,noreferrer\");
    if (!win) return warn(\"Il browser ha bloccato l’apertura della pagina recensioni.\");
    msg.className = \"message show ok\";
    msg.textContent = \"Pagina recensioni aperta correttamente.\";
    return;
  }"""
new_standard = """  if (type === \"standard\") {
    window.open(reviewUrl, \"_blank\", \"noopener,noreferrer\");
    msg.className = \"message show ok\";
    msg.textContent = \"Pagina recensioni aperta correttamente.\";
    return;
  }"""
if old_standard in s:
    s = s.replace(old_standard, new_standard, 1)

p.write_text(s, encoding='utf-8')

print('Patch completata')
