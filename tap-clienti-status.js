(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'clienti.html') return;

  const apply = root => {
    (root || document).querySelectorAll?.('.status-select')?.forEach(el => {
      const sync = () => {
        const value = String(el.value || '').trim();
        el.dataset.status = value;
        el.classList.toggle('status-pending', value === 'Da consegnare');
        el.classList.toggle('status-delivered', value === 'Consegnato');
      };
      sync();
      if (!el.dataset.tapStatusBound) {
        el.dataset.tapStatusBound = '1';
        el.addEventListener('change', sync);
      }
    });
  };

  apply(document);
  new MutationObserver(records => {
    for (const r of records) for (const node of r.addedNodes) if (node.nodeType === 1) apply(node);
  }).observe(document.documentElement,{childList:true,subtree:true});
})();
