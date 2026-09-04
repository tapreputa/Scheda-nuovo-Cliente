from pathlib import Path
import re

# --- Pagina 1: genera il link ma mostra solo il pulsante Continua ---
p = Path('index.html')
text = p.read_text(encoding='utf-8')

old_html = '''    <button class="primary" id="generateBtn" type="button">Genera link</button>
    <div id="msg" class="message"></div>
    <div id="result" class="result"><div class="result-title">Link recensioni generato</div><div id="generatedLink" class="result-link"></div><button id="copyBtn" class="copy-btn" type="button">Copia link</button><button id="continueBtn" class="continue-btn" type="button">Continua a Personalizza →</button></div>'''
new_html = '''    <button class="primary" id="generateBtn" type="button">Genera link</button>
    <div id="msg" class="message"></div>
    <button id="continueBtn" class="continue-btn continue-only" type="button">Continua a Personalizza →</button>'''
assert old_html in text, 'Blocco risultato pagina 1 non trovato'
text = text.replace(old_html, new_html, 1)

css_anchor = '.continue-btn{border:0;background:#003c33;color:#fff}'
css_new = css_anchor + '.continue-only{display:none;margin-top:16px!important}.continue-only.show{display:block}'
assert css_anchor in text, 'CSS continue-btn non trovato'
text = text.replace(css_anchor, css_new, 1)

old_const = "const business=document.getElementById('business'),placeid=document.getElementById('placeid'),msg=document.getElementById('msg'),result=document.getElementById('result'),generatedLink=document.getElementById('generatedLink'),copyBtn=document.getElementById('copyBtn'),continueBtn=document.getElementById('continueBtn');"
new_const = "const business=document.getElementById('business'),placeid=document.getElementById('placeid'),msg=document.getElementById('msg'),continueBtn=document.getElementById('continueBtn');"
assert old_const in text, 'Dichiarazione JS pagina 1 non trovata'
text = text.replace(old_const, new_const, 1)

old_generate = "document.getElementById('generateBtn').addEventListener('click',()=>{const businessValue=business.value.trim();let placeIdValue=normalizePlaceIdInput(placeid.value);if(!businessValue){msg.className='message show warn';msg.textContent='Inserisci il nome dell’attività.';result.classList.remove('show');return}if(!placeIdValue){msg.className='message show warn';msg.textContent='Inserisci il Google Place ID.';result.classList.remove('show');return}if(/^https?:\\/\\//i.test(placeIdValue)){msg.className='message show warn';msg.textContent='Il valore inserito non contiene un Place ID valido.';result.classList.remove('show');return}placeid.value=placeIdValue;reviewUrl=BASE_REVIEW_URL+placeIdValue;generatedLink.textContent=reviewUrl;result.classList.add('show');msg.className='message show ok';msg.textContent='Link recensioni generato correttamente.';});"
new_generate = "document.getElementById('generateBtn').addEventListener('click',()=>{const businessValue=business.value.trim();let placeIdValue=normalizePlaceIdInput(placeid.value);continueBtn.classList.remove('show');if(!businessValue){msg.className='message show warn';msg.textContent='Inserisci il nome dell’attività.';return}if(!placeIdValue){msg.className='message show warn';msg.textContent='Inserisci il Google Place ID.';return}if(/^https?:\\/\\//i.test(placeIdValue)){msg.className='message show warn';msg.textContent='Il valore inserito non contiene un Place ID valido.';return}placeid.value=placeIdValue;reviewUrl=BASE_REVIEW_URL+placeIdValue;msg.className='message';msg.textContent='';continueBtn.classList.add('show');});"
assert old_generate in text, 'Handler Genera link non trovato'
text = text.replace(old_generate, new_generate, 1)

copy_pattern = re.compile(r"copyBtn\.addEventListener\('click',async\(\)=>\{.*?\}\);\n", re.S)
text, n = copy_pattern.subn('', text, count=1)
assert n == 1, 'Handler Copia link non trovato'

text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=10', text, count=1)
p.write_text(text, encoding='utf-8')

# --- Pagina 2: ripristina il campo Link recensioni Google visibile ---
p = Path('personalizza.html')
text = p.read_text(encoding='utf-8')
old = '<input id="destinationUrl" type="hidden">'
new = '''<div class="field">
<label for="destinationUrl">Link recensioni Google</label>
<input id="destinationUrl" type="url" placeholder="https://search.google.com/local/writereview?placeid=...">
<div class="hint">Questo sarà il collegamento del pulsante “Recensione Google”.</div>
</div>'''
assert old in text, 'Campo hidden destinationUrl non trovato'
text = text.replace(old, new, 1)
text = re.sub(r'tap-premium-polish\.css\?v=\d+', 'tap-premium-polish.css?v=10', text, count=1)
p.write_text(text, encoding='utf-8')

# Sanity checks
idx = Path('index.html').read_text(encoding='utf-8')
per = Path('personalizza.html').read_text(encoding='utf-8')
assert 'id="generatedLink"' not in idx
assert 'id="copyBtn"' not in idx
assert 'id="result"' not in idx
assert 'continue-only' in idx
assert '<label for="destinationUrl">Link recensioni Google</label>' in per
assert '<input id="destinationUrl" type="hidden">' not in per
print('Flusso link recensioni aggiornato correttamente')
