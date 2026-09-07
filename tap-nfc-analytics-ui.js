(() => {
  'use strict';

  const PAGE = location.pathname.split('/').pop() || '';
  const TRACKER_BASE = 'https://tapreputa.github.io/Scheda-nuovo-Cliente/tap.html?c=';

  function slugify(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  function trackerForTarget(target) {
    const raw = String(target || '').trim();
    if (!raw || raw.startsWith(TRACKER_BASE)) return raw;
    try {
      const url = new URL(raw);
      if (url.hostname === 'tapreputa.github.io') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts[0] && parts[0] !== 'Scheda-nuovo-Cliente') {
          return TRACKER_BASE + encodeURIComponent(parts[0]);
        }
      }
    } catch {}
    const params = new URLSearchParams(location.search);
    const businessSlug = slugify(params.get('business') || 'cliente');
    return TRACKER_BASE + encodeURIComponent(businessSlug || 'cliente');
  }

  function initPersonalizza() {
    const value = document.getElementById('finalLinkValue');
    const copy = document.getElementById('copyFinalBtn');
    if (!value) return;

    let rewriting = false;
    function rewrite() {
      if (rewriting) return;
      const current = String(value.textContent || '').trim();
      if (!current || current.startsWith(TRACKER_BASE)) return;
      rewriting = true;
      value.dataset.tapTargetUrl = current;
      value.textContent = trackerForTarget(current);
      rewriting = false;
    }

    const observer = new MutationObserver(() => setTimeout(rewrite, 0));
    observer.observe(value, { childList:true, subtree:true, characterData:true });
    setTimeout(rewrite, 0);

    copy?.addEventListener('click', async event => {
      const shown = String(value.textContent || '').trim();
      if (!shown.startsWith(TRACKER_BASE)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        await navigator.clipboard.writeText(shown);
      } catch {
        const area = document.createElement('textarea');
        area.value = shown;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      const old = copy.textContent;
      copy.textContent = 'Copiato ✓';
      setTimeout(() => { copy.textContent = old; }, 1300);
    }, true);
  }

  async function loadCounts() {
    if (!window.TapNfc?.rest) return new Map();
    const response = await TapNfc.rest('rpc/get_nfc_tap_counts', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:'{}'
    });
    if (!response.ok) return new Map();
    const data = await response.json().catch(() => []);
    const map = new Map();
    (Array.isArray(data) ? data : []).forEach(row => map.set(String(row.client_id), row));
    return map;
  }

  function initClienti() {
    const rowsRoot = document.getElementById('rows');
    if (!rowsRoot) return;

    const style = document.createElement('style');
    style.textContent = `
      .tap-eye-count{display:inline-flex;align-items:center;gap:4px;margin-left:5px;padding:4px 7px;border:1px solid #cce2dc;border-radius:999px;background:#f2faf8;color:#08735f;font-size:11px;font-weight:900;line-height:1;vertical-align:middle;white-space:nowrap}
      .tap-eye-count[data-zero="1"]{color:#82908c;background:#f7f9f8;border-color:#e0e6e4}
      td.nome{white-space:normal!important}.name-btn{vertical-align:middle}
    `;
    document.head.appendChild(style);

    let counts = new Map();
    let applying = false;

    function apply() {
      if (applying) return;
      applying = true;
      document.querySelectorAll('#rows > tr').forEach(row => {
        const id = row.querySelector('[data-rename]')?.dataset.rename || row.querySelector('[data-id]')?.dataset.id || '';
        const cell = row.querySelector('td.nome');
        if (!id || !cell) return;
        const data = counts.get(String(id)) || { total:0, today:0, last_7_days:0, last_30_days:0 };
        let badge = cell.querySelector('.tap-eye-count');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'tap-eye-count';
          cell.appendChild(badge);
        }
        const total = Number(data.total || 0);
        badge.dataset.zero = total ? '0' : '1';
        badge.textContent = '👁 ' + total.toLocaleString('it-IT');
        badge.title = `Tap NFC — oggi ${Number(data.today||0)}, 7 giorni ${Number(data.last_7_days||0)}, 30 giorni ${Number(data.last_30_days||0)}, totale ${total}`;
      });
      applying = false;
    }

    const observer = new MutationObserver(() => setTimeout(apply, 0));
    observer.observe(rowsRoot, { childList:true, subtree:true });

    loadCounts().then(map => {
      counts = map;
      apply();
    }).catch(() => apply());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      loadCounts().then(map => { counts = map; apply(); }).catch(() => {});
    });
  }

  if (PAGE === 'personalizza.html') initPersonalizza();
  if (PAGE === 'clienti.html') initClienti();
})();
