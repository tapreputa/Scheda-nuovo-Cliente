(() => {
  'use strict';
  function reference(html) {
    const root = new DOMParser().parseFromString(html, 'text/html').documentElement;
    if (root.dataset.tapManualLogo !== 'v2') return null;
    try {
      const size = JSON.parse(root.dataset.tapManualViewport);
      if (size && Number.isInteger(size.width) && Number.isInteger(size.height) && size.width >= 200 && size.width <= 4096 && size.height >= 200 && size.height <= 8192) return size;
    } catch {}
    return null;
  }
  function mount(frame, html) {
    const size = reference(html);
    // Previously published pages retain their original responsive rendering.
    if (!size) return false;
    document.body.style.cssText = 'margin:0;width:100%;height:100%;overflow:hidden;background:#10232a';
    const page = document.createElement('div');
    page.style.cssText = 'position:fixed;inset:0;overflow:hidden;isolation:isolate;';
    frame.replaceWith(page);

    // The photograph fills the actual screen; the saved foreground keeps its
    // original proportions and fits entirely inside the available viewport.
    const backgroundDoc = new DOMParser().parseFromString(html, 'text/html');
    backgroundDoc.querySelectorAll('script').forEach(node => node.remove());
    backgroundDoc.body.replaceChildren();
    const backgroundStyle = backgroundDoc.createElement('style');
    backgroundStyle.textContent = 'html,body{margin:0!important;width:100%!important;height:100%!important;min-height:100%!important;overflow:hidden!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}';
    backgroundDoc.head.appendChild(backgroundStyle);
    const background = document.createElement('iframe');
    background.id = 'tapManualBackgroundFrame';
    background.setAttribute('aria-hidden', 'true');
    background.setAttribute('tabindex', '-1');
    background.setAttribute('sandbox', '');
    background.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;z-index:0;';
    background.srcdoc = '<!doctype html>\n' + backgroundDoc.documentElement.outerHTML;
    page.appendChild(background);

    const foregroundDoc = new DOMParser().parseFromString(html, 'text/html');
    foregroundDoc.querySelectorAll('script').forEach(node => node.remove());
    foregroundDoc.documentElement.style.setProperty('background', 'transparent', 'important');
    foregroundDoc.body.style.setProperty('background', 'transparent', 'important');
    const foregroundStyle = foregroundDoc.createElement('style');
    foregroundStyle.textContent = 'html,body{background:transparent!important;overflow:hidden!important}html::before,html::after,body::before,body::after{background:none!important}';
    foregroundDoc.head.appendChild(foregroundStyle);
    frame.id = 'tapManualContentFrame';
    frame.srcdoc = '<!doctype html>\n' + foregroundDoc.documentElement.outerHTML;
    page.appendChild(frame);
    frame.style.cssText = 'position:absolute;inset:auto;border:0;max-width:none;max-height:none;transform-origin:0 0;background:transparent;z-index:1;';
    frame.style.width = size.width + 'px';
    frame.style.height = size.height + 'px';
    let request = 0;
    function fit() {
      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;
      const scale = Math.min(width / size.width, height / size.height);
      frame.style.left = ((width - size.width * scale) / 2) + 'px';
      frame.style.top = ((height - size.height * scale) / 2) + 'px';
      frame.style.transform = 'scale(' + scale + ')';
    }
    function schedule() {
      cancelAnimationFrame(request);
      request = requestAnimationFrame(fit);
    }
    new ResizeObserver(schedule).observe(document.documentElement);
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    fit();
    return true;
  }
  window.TapManualPageViewport = Object.freeze({reference, mount});
})();
