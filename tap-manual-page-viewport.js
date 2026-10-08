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
    document.body.style.cssText = 'margin:0;width:100%;height:auto;min-height:100%;overflow-x:hidden;background:#10232a';
    const page = document.createElement('div');
    page.style.cssText = 'position:relative;width:100%;overflow:hidden;';
    frame.replaceWith(page);
    page.appendChild(frame);
    frame.style.cssText = 'position:absolute;inset:auto;border:0;max-width:none;max-height:none;transform-origin:0 0;';
    frame.style.width = size.width + 'px';
    frame.style.height = size.height + 'px';
    let request = 0;
    function fit() {
      const width = document.documentElement.clientWidth;
      // Fill the screen's width. A shorter browser scrolls the complete saved
      // composition instead of shrinking it into side gutters or cropping it.
      const scale = width / size.width;
      page.style.height = (size.height * scale) + 'px';
      frame.style.left = '0';
      frame.style.top = '0';
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
