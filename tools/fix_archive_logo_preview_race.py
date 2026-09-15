from pathlib import Path

p = Path('tap-personalizza-logo-archive.js')
s = p.read_text(encoding='utf-8')

needle = "  function safeTerm(value) {"
insert = """  function blobToDataUrl(blob) {\n    return new Promise((resolve, reject) => {\n      const reader = new FileReader();\n      reader.onload = () => resolve(String(reader.result || ''));\n      reader.onerror = () => reject(reader.error || new Error('Impossibile preparare il logo.'));\n      reader.readAsDataURL(blob);\n    });\n  }\n\n"""
if 'function blobToDataUrl(blob)' not in s:
    if needle not in s:
        raise SystemExit('safeTerm marker not found')
    s = s.replace(needle, insert + needle, 1)

old = """      const blob = await response.blob();\n      const fileName = (String(item.business_name || 'logo').trim().replace(/[^a-z0-9àèéìòù_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'logo') + '.webp';\n      const file = new File([blob], fileName, { type:blob.type || 'image/webp', lastModified:Date.now() });\n      const transfer = new DataTransfer();\n      transfer.items.add(file);\n      logoInput.files = transfer.files;\n      logoInput.dispatchEvent(new Event('change', { bubbles:true }));\n      close();"""
new = """      const blob = await response.blob();\n      const dataUrl = await blobToDataUrl(blob);\n      if (!dataUrl) throw new Error('Impossibile preparare il logo selezionato.');\n      const fileName = (String(item.business_name || 'logo').trim().replace(/[^a-z0-9àèéìòù_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'logo') + '.webp';\n      const file = new File([blob], fileName, { type:blob.type || 'image/webp', lastModified:Date.now() });\n      const transfer = new DataTransfer();\n      transfer.items.add(file);\n      logoInput.files = transfer.files;\n      try { logoDataUrl = dataUrl; } catch (_) { window.logoDataUrl = dataUrl; }\n      const previewImg = document.getElementById('logoPreviewImg');\n      const previewBox = document.getElementById('logoPreview');\n      const previewName = document.getElementById('logoName');\n      if (previewImg) previewImg.src = dataUrl;\n      if (previewName) previewName.textContent = fileName;\n      if (previewBox) previewBox.classList.add('show');\n      logoInput.dispatchEvent(new Event('change', { bubbles:true }));\n      await new Promise(resolve => setTimeout(resolve, 0));\n      close();"""
if old in s:
    s = s.replace(old, new, 1)
elif 'const dataUrl = await blobToDataUrl(blob);' not in s:
    raise SystemExit('choose block not found')

p.write_text(s, encoding='utf-8')

b = Path('tap-veterinario.js')
t = b.read_text(encoding='utf-8')
t = t.replace("20260916-stable5.4", "20260916-stable5.5")
t = t.replace("20260915-stable5.3", "20260916-stable5.5")
b.write_text(t, encoding='utf-8')
