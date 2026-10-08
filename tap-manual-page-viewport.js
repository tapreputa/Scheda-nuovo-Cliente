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
    frame.style.cssText = 'position:absolute;inset:auto;border:0;max-width:none;max-height:none;transform-origin:0 0;';
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
