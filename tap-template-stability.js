(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const BUILD_ID = '20260906-stable1';
  const SNAPSHOT_KEY = 'tapreputa_preview_snapshot_v1';
  const BINDING_KEY = 'tapreputa_generated_binding_v1';
  const activity = document.getElementById('activityType');
  const logoFile = document.getElementById('logoFile');
  const reviewInput = document.getElementById('destinationUrl');
  const generateBtn = document.getElementById('generateBtn');
  const addClientBtn = document.getElementById('addClientBtn');
  const finalLinkValue = document.getElementById('finalLinkValue');
  const finalLinkBox = document.getElementById('finalLinkBox');
  const msg = document.getElementById('msg');

  function currentCategory() {
    const raw = String(activity?.value || '');
    return window.TapCategories ? String(window.TapCategories.normalizeId(raw) || '') : raw;
  }

  function readLogoData() {
    try { return typeof logoDataUrl !== 'undefined' ? String(logoDataUrl || '') : String(window.logoDataUrl || ''); }
    catch (_) { return String(window.logoDataUrl || ''); }
  }

  function hashText(value) {
    const text = String(value || '');
    let hash = 2166136261;
    const step = Math.max(1, Math.floor(text.length / 4096));
    for (let i = 0; i < text.length; i += step) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= text.length;
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function currentSignature() {
    const skipped = Boolean(window.tapLogoSkipped);
    const logo = skipped ? '' : readLogoData();
    return JSON.stringify({
      category: currentCategory(),
      mode: skipped ? 'no-logo' : 'logo',
      reviewUrl: String(reviewInput?.value || '').trim(),
      logoHash: skipped ? 'none' : hashText(logo)
    });
  }

  function showWarning(text) {
    if (!msg) return;
    msg.className = 'message show warn';
    msg.textContent = text;
  }

  function resetGeneratedUi() {
    try { sessionStorage.removeItem(BINDING_KEY); } catch (_) {}
    if (finalLinkValue) finalLinkValue.textContent = '';
    if (finalLinkBox) {
      finalLinkBox.classList.remove('show');
      finalLinkBox.dataset.tapDecorated = '';
    }
    addClientBtn?.classList.remove('show');
  }

  function invalidate(reason = '') {
    try { sessionStorage.removeItem(SNAPSHOT_KEY); } catch (_) {}
    window.__tapStablePreviewSnapshot = null;
    resetGeneratedUi();
    if (reason) console.info('Tapreputa stability:', reason);
  }

  function dedupeDuplicateIds(html) {
    if (typeof html !== 'string' || !html) return html;
    const matches = [...html.matchAll(/<(?:style|script)\b[^>]*\bid=["']([^"']+)["']/gi)];
    if (!matches.length) return html;
    const counts = new Map();
    for (const match of matches) counts.set(match[1], (counts.get(match[1]) || 0) + 1);
    if (![...counts.values()].some(n => n > 1)) return html;

    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      ['style[id]', 'script[id]'].forEach(selector => {
        const grouped = new Map();
        doc.querySelectorAll(selector).forEach(node => {
          const id = node.id;
          if (!grouped.has(id)) grouped.set(id, []);
          grouped.get(id).push(node);
        });
        grouped.forEach(nodes => {
          if (nodes.length < 2) return;
          nodes.slice(0, -1).forEach(node => node.remove());
        });
      });
      doc.documentElement.dataset.tapBuild = BUILD_ID;
      doc.documentElement.dataset.tapCategory = currentCategory();
      doc.documentElement.dataset.tapMode = window.tapLogoSkipped ? 'no-logo' : 'logo';
      return '<!doctype html>\n' + doc.documentElement.outerHTML;
    } catch (error) {
      console.warn('Tapreputa: deduplica override non riuscita.', error);
      return html;
    }
  }

  function saveSnapshot(html) {
    const snapshot = Object.freeze({
      build: BUILD_ID,
      category: currentCategory(),
      closed: Boolean(window.TapCategories?.isClosed?.(currentCategory())),
      mode: window.tapLogoSkipped ? 'no-logo' : 'logo',
      signature: currentSignature(),
      html: String(html || ''),
      htmlHash: hashText(html),
      createdAt: Date.now()
    });
    window.__tapStablePreviewSnapshot = snapshot;
    try {
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch (_) {}
    return snapshot;
  }

  function getSnapshot() {
    if (window.__tapStablePreviewSnapshot) return window.__tapStablePreviewSnapshot;
    try {
      const parsed = JSON.parse(sessionStorage.getItem(SNAPSHOT_KEY) || 'null');
      if (parsed && parsed.build === BUILD_ID) return parsed;
    } catch (_) {}
    return null;
  }

  function validateForGenerate() {
    if (currentCategory() === 'standard') return { ok:true };
    const snapshot = getSnapshot();
    if (!snapshot) {
      return { ok:false, message:'Apri e controlla prima l’anteprima della categoria. Il link finale verrà associato esattamente a quella versione.' };
    }
    if (snapshot.signature !== currentSignature()) {
      return { ok:false, message:'Categoria o logo sono cambiati dopo l’ultima anteprima. Apri nuovamente l’anteprima prima di generare il link finale.' };
    }
    return { ok:true, snapshot };
  }

  function bindGeneratedLink(url) {
    const snapshot = getSnapshot();
    const binding = {
      build: BUILD_ID,
      category: currentCategory(),
      signature: currentSignature(),
      previewHash: snapshot?.htmlHash || '',
      finalUrl: String(url || ''),
      createdAt: Date.now()
    };
    try { sessionStorage.setItem(BINDING_KEY, JSON.stringify(binding)); } catch (_) {}
    return binding;
  }

  function validateForSave() {
    if (currentCategory() === 'standard') return { ok:true };
    const preview = validateForGenerate();
    if (!preview.ok) return preview;
    let binding = null;
    try { binding = JSON.parse(sessionStorage.getItem(BINDING_KEY) || 'null'); } catch (_) {}
    if (!binding || binding.build !== BUILD_ID) {
      return { ok:false, message:'Genera nuovamente il link finale dopo aver controllato l’anteprima.' };
    }
    if (binding.signature !== currentSignature()) {
      return { ok:false, message:'La configurazione è cambiata dopo la generazione del link. Controlla l’anteprima e genera nuovamente il link.' };
    }
    if (binding.previewHash !== preview.snapshot.htmlHash) {
      return { ok:false, message:'L’anteprima attuale non coincide con quella associata al link finale. Rigenera il link prima di salvare.' };
    }
    return { ok:true };
  }

  if (typeof openInlinePreview === 'function') {
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

  activity?.addEventListener('change', () => invalidate('categoria modificata'));
  logoFile?.addEventListener('change', () => invalidate('logo modificato'));
  window.addEventListener('tap-logo-skip-change', () => invalidate('modalità logo modificata'));

  generateBtn?.addEventListener('click', event => {
    const check = validateForGenerate();
    if (!check.ok) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showWarning(check.message);
      return;
    }
    setTimeout(() => {
      const url = String(finalLinkValue?.textContent || '').trim();
      if (url) bindGeneratedLink(url);
    }, 0);
  }, true);

  window.TapTemplateStability = Object.freeze({
    build: BUILD_ID,
    getSnapshot,
    currentSignature,
    validateForGenerate,
    validateForSave,
    bindGeneratedLink,
    isClosed: id => Boolean(window.TapCategories?.isClosed?.(id)),
    getFinalPreviewHtml: () => getSnapshot()?.html || '',
    invalidate
  });
})();
