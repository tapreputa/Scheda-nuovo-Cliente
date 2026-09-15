from pathlib import Path

p = Path('tap-template-stability.js')
s = p.read_text(encoding='utf-8')
s = s.replace("const BUILD_ID = '20260906-stable5.1';", "const BUILD_ID = '20260916-stable5.2';")
old = '''  if (typeof openInlinePreview === 'function') {
    const previousOpenInlinePreview = openInlinePreview;
    openInlinePreview = function(html) {
      const result = previousOpenInlinePreview(html);
      const frame = document.getElementById('tapPreviewFrame');
      if (frame) {
        const rendered = String(frame.srcdoc || html || '');
        const stableHtml = dedupeDuplicateIds(rendered);
        if (stableHtml !== rendered) frame.srcdoc = stableHtml;
        saveSnapshot(stableHtml);
      }
      return result;
    };
  }
'''
new = '''  if (typeof openInlinePreview === 'function') {
    const previousOpenInlinePreview = openInlinePreview;

    function captureRenderedPreview(previousSrcdoc, expectedSignature) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        const frame = document.getElementById('tapPreviewFrame');
        const rendered = String(frame?.srcdoc || '');
        const ready = Boolean(rendered) && rendered !== previousSrcdoc;

        if (ready && currentSignature() === expectedSignature) {
          clearInterval(timer);
          const stableHtml = dedupeDuplicateIds(rendered);
          if (stableHtml !== rendered) frame.srcdoc = stableHtml;
          saveSnapshot(stableHtml);
          return;
        }

        if (attempts >= 100) clearInterval(timer);
      }, 30);
    }

    openInlinePreview = function(html) {
      const frameBefore = document.getElementById('tapPreviewFrame');
      const previousSrcdoc = String(frameBefore?.srcdoc || '');
      const expectedSignature = currentSignature();
      const result = previousOpenInlinePreview(html);
      captureRenderedPreview(previousSrcdoc, expectedSignature);
      return result;
    };
  }
'''
if old not in s:
    raise SystemExit('preview stability wrapper not found')
s = s.replace(old, new)
p.write_text(s, encoding='utf-8')

v = Path('tap-veterinario.js')
t = v.read_text(encoding='utf-8')
if "20260916-stable5.5" not in t:
    raise SystemExit('bootstrap build not found')
t = t.replace("20260916-stable5.5", "20260916-stable5.6")
v.write_text(t, encoding='utf-8')
