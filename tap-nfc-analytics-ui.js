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
      .tap-eye-count{display:inline-flex;align-items:center;gap:4px;margin-left:5px;padding:4px 7px;border:1px solid #cce2dc;border-radius:999px;background:#f2faf8;color:#08735f;font-size:11px;font-weight:900;line-height:1;vertical-align:middle;white-space:nowrap;cursor:pointer;appearance:none;font-family:inherit}
      .tap-eye-count:hover{background:#e7f6f2;border-color:#a8d5c9}.tap-eye-count:focus-visible{outline:3px solid rgba(12,155,128,.18);outline-offset:2px}
      .tap-eye-count[data-zero="1"]{color:#82908c;background:#f7f9f8;border-color:#e0e6e4}
      td.nome{white-space:normal!important}.name-btn{vertical-align:middle}
      .status-select{width:70px!important;min-width:70px!important;height:44px!important;padding:0 23px 0 8px!important;text-align:center!important;text-align-last:center!important;font-size:25px!important;font-weight:950!important;line-height:1!important}
      .tap-status-col,.tap-status-cell{width:90px!important;min-width:90px!important;text-align:center!important}
      .tap-status-red{background:#fff0ed!important;border-color:#efb8af!important;color:#c63327!important}
      .tap-status-green{background:#e9f8f1!important;border-color:#acdcca!important;color:#078267!important}
      .tap-stats-overlay{display:none;position:fixed;inset:0;background:rgba(0,25,20,.48);z-index:120;padding:18px;overflow:auto}.tap-stats-overlay.show{display:flex;align-items:flex-start;justify-content:center}.tap-stats-panel{width:min(520px,100%);margin:42px auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.25)}
      .tap-stats-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.tap-stats-eyebrow{color:#007f69;font-size:11px;letter-spacing:.16em;font-weight:900;text-transform:uppercase;margin-bottom:7px}.tap-stats-title{margin:0;font-size:28px;line-height:1.1;color:#17332d}.tap-stats-close{width:42px;height:42px;border-radius:50%;border:1px solid #d5dfdc;background:#fff;font-size:21px;cursor:pointer}
      .tap-stats-total{margin:22px 0 14px;padding:18px;border-radius:18px;background:#f2faf8;border:1px solid #cce2dc}.tap-stats-total-label{font-size:12px;color:#6f7d78;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.tap-stats-total-value{margin-top:5px;font-size:36px;font-weight:950;color:#08735f}
      .tap-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tap-stats-card{padding:14px 12px;border:1px solid #dde6e3;border-radius:15px;background:#fbfcfc}.tap-stats-card b{display:block;font-size:24px;color:#17332d}.tap-stats-card span{display:block;margin-top:5px;font-size:11px;color:#78847f;font-weight:800}
      .tap-stats-note{margin-top:16px;padding-top:14px;border-top:1px solid #e7eeeb;color:#73807c;font-size:12px;line-height:1.45}
      @media(max-width:560px){.tap-stats-panel{margin:16px auto;padding:20px}.tap-stats-title{font-size:24px}.tap-stats-grid{grid-template-columns:1fr}.tap-stats-card{display:flex;align-items:center;justify-content:space-between;gap:12px}.tap-stats-card span{margin:0}}
    `;
    document.head.appendChild(style);

    function compactStatusSelect(select) {
      if (!select) return;
      const current = String(select.value || '');
      Array.from(select.options).forEach(option => {
        const raw = String(option.value || option.textContent || '').trim();
        if (raw === 'Da consegnare' || raw === '❌' || raw === '✕' || raw === '×') {
          option.value = 'Da consegnare';
          option.textContent = '✕';
        } else if (raw === 'Consegnato' || raw === '✅' || raw === '✅️' || raw === '✓') {
          option.value = 'Consegnato';
          option.textContent = '✓';
        }
      });
      if (current === 'Da consegnare' || current === 'Consegnato') select.value = current;
      select.setAttribute('aria-label', select.value === 'Consegnato' ? 'Consegnato' : 'Da consegnare');
      select.title = select.value === 'Consegnato' ? 'Consegnato' : 'Da consegnare';
    }

    function compactAllStatuses() {
      document.querySelectorAll('#rows .status-select').forEach(compactStatusSelect);
    }

    const statsOverlay = document.createElement('div');
    statsOverlay.className = 'tap-stats-overlay';
    statsOverlay.innerHTML = `
      <div class="tap-stats-panel" role="dialog" aria-modal="true" aria-labelledby="tapStatsTitle">
        <div class="tap-stats-top">
          <div><div class="tap-stats-eyebrow">Statistiche NFC</div><h2 id="tapStatsTitle" class="tap-stats-title">Cliente</h2></div>
          <button class="tap-stats-close" type="button" aria-label="Chiudi">×</button>
        </div>
        <div class="tap-stats-total"><div class="tap-stats-total-label">Tap totali</div><div id="tapStatsTotal" class="tap-stats-total-value">0</div></div>
        <div class="tap-stats-grid">
          <div class="tap-stats-card"><b id="tapStatsToday">0</b><span>Oggi</span></div>
          <div class="tap-stats-card"><b id="tapStats7">0</b><span>Ultimi 7 giorni</span></div>
          <div class="tap-stats-card"><b id="tapStats30">0</b><span>Ultimi 30 giorni</span></div>
        </div>
        <div class="tap-stats-note">Il conteggio registra le aperture generate dal link NFC tracciato. I valori si aggiornano quando torni su questa pagina.</div>
      </div>`;
    document.body.appendChild(statsOverlay);
    const statsClose = statsOverlay.querySelector('.tap-stats-close');
    const closeStats = () => statsOverlay.classList.remove('show');
    statsClose.addEventListener('click', closeStats);
    statsOverlay.addEventListener('click', e => { if (e.target === statsOverlay) closeStats(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && statsOverlay.classList.contains('show')) closeStats(); });

    let counts = new Map();
    let applying = false;

    function openStats(id, name) {
      const data = counts.get(String(id)) || { total:0, today:0, last_7_days:0, last_30_days:0 };
      statsOverlay.querySelector('#tapStatsTitle').textContent = name || 'Cliente';
      statsOverlay.querySelector('#tapStatsTotal').textContent = Number(data.total || 0).toLocaleString('it-IT');
      statsOverlay.querySelector('#tapStatsToday').textContent = Number(data.today || 0).toLocaleString('it-IT');
      statsOverlay.querySelector('#tapStats7').textContent = Number(data.last_7_days || 0).toLocaleString('it-IT');
      statsOverlay.querySelector('#tapStats30').textContent = Number(data.last_30_days || 0).toLocaleString('it-IT');
      statsOverlay.classList.add('show');
    }

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
          badge = document.createElement('button');
          badge.type = 'button';
          badge.className = 'tap-eye-count';
          cell.appendChild(badge);
        }
        const total = Number(data.total || 0);
        badge.dataset.zero = total ? '0' : '1';
        badge.textContent = '👁 ' + total.toLocaleString('it-IT');
        badge.title = `Apri statistiche NFC — oggi ${Number(data.today||0)}, 7 giorni ${Number(data.last_7_days||0)}, 30 giorni ${Number(data.last_30_days||0)}, totale ${total}`;
        badge.onclick = () => {
          const name = cell.querySelector('.name-btn')?.textContent?.trim() || '';
          openStats(id, name);
        };
      });
      compactAllStatuses();
      applying = false;
    }

    const observer = new MutationObserver(() => setTimeout(apply, 0));
    observer.observe(rowsRoot, { childList:true, subtree:true });

    rowsRoot.addEventListener('change', event => {
      const select = event.target.closest?.('.status-select');
      if (!select) return;
      setTimeout(() => compactStatusSelect(select), 0);
    });

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
