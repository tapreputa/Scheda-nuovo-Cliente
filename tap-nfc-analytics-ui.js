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

      tbody td.id{color:#1f5fa3!important;font-weight:900!important;white-space:nowrap!important}

      .tap-status-col,.tap-status-cell{width:90px!important;min-width:90px!important;text-align:center!important}
      .tap-status-wrap{position:relative;width:62px;height:46px;margin:0 auto;border:1px solid #d8e0dd;border-radius:999px;display:flex;align-items:center;justify-content:center;background:#f6f8f7;overflow:hidden}
      .tap-status-wrap.is-red{background:#fff0ed;border-color:#efb8af}
      .tap-status-wrap.is-green{background:#e9f8f1;border-color:#acdcca}
      .tap-status-icon{display:flex;align-items:center;justify-content:center;width:28px;height:28px;font-family:Arial,"Segoe UI Symbol",sans-serif;font-size:27px;font-weight:900;line-height:1;transform:none!important}
      .tap-status-wrap.is-red .tap-status-icon{color:#c63327}
      .tap-status-wrap.is-green .tap-status-icon{color:#078267}
      .tap-status-chevron{position:absolute;right:8px;top:50%;width:8px;height:8px;border-right:1.6px solid currentColor;border-bottom:1.6px solid currentColor;transform:translateY(-65%) rotate(45deg);color:#5d7771;pointer-events:none}
      .tap-status-wrap .status-select{position:absolute!important;inset:0!important;width:100%!important;min-width:0!important;height:100%!important;margin:0!important;padding:0!important;border:0!important;opacity:0!important;cursor:pointer!important;z-index:2!important;appearance:auto!important;-webkit-appearance:menulist!important;background:transparent!important}
      .tap-status-wrap .status-select:disabled{cursor:not-allowed!important}
      .tap-status-wrap:has(.status-select:disabled){opacity:.58}

      .tap-stats-overlay{display:none;position:fixed;inset:0;background:rgba(0,25,20,.48);z-index:120;padding:18px;overflow:auto}.tap-stats-overlay.show{display:flex;align-items:flex-start;justify-content:center}.tap-stats-panel{width:min(520px,100%);margin:42px auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 30px 80px rgba(0,0,0,.25)}
      .tap-stats-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.tap-stats-eyebrow{color:#007f69;font-size:11px;letter-spacing:.16em;font-weight:900;text-transform:uppercase;margin-bottom:7px}.tap-stats-title{margin:0;font-size:28px;line-height:1.1;color:#17332d}.tap-stats-close{width:42px;height:42px;border-radius:50%;border:1px solid #d5dfdc;background:#fff;font-size:21px;cursor:pointer}
      .tap-stats-total{margin:22px 0 14px;padding:18px;border-radius:18px;background:#f2faf8;border:1px solid #cce2dc}.tap-stats-total-label{font-size:12px;color:#6f7d78;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.tap-stats-total-value{margin-top:5px;font-size:36px;font-weight:950;color:#08735f}
      .tap-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tap-stats-card{padding:14px 12px;border:1px solid #dde6e3;border-radius:15px;background:#fbfcfc}.tap-stats-card b{display:block;font-size:24px;color:#17332d}.tap-stats-card span{display:block;margin-top:5px;font-size:11px;color:#78847f;font-weight:800}
      .tap-stats-note{margin-top:16px;padding-top:14px;border-top:1px solid #e7eeeb;color:#73807c;font-size:12px;line-height:1.45}

      @media(max-width:760px){
        thead th:nth-child(1),tbody td.id{position:static!important;left:auto!important;z-index:auto!important;transform:none!important;-webkit-transform:none!important;backface-visibility:visible!important;-webkit-backface-visibility:visible!important;isolation:auto!important;overflow:hidden!important;background:#fff!important;color:#1f5fa3!important}
        thead th:nth-child(2),tbody td.nome{position:sticky!important;left:0!important;background:#fff!important;z-index:12!important;box-shadow:9px 0 12px -12px rgba(0,45,37,.55)!important}
      }

      @media(max-width:560px){.tap-stats-panel{margin:16px auto;padding:20px}.tap-stats-title{font-size:24px}.tap-stats-grid{grid-template-columns:1fr}.tap-stats-card{display:flex;align-items:center;justify-content:space-between;gap:12px}.tap-stats-card span{margin:0}.tap-status-col,.tap-status-cell{width:84px!important;min-width:84px!important}.tap-status-wrap{width:58px;height:44px}.tap-status-icon{font-size:25px}}
    `;
    document.head.appendChild(style);

    function refreshStatusVisual(select) {
      if (!select) return;
      const wrap = select.closest('.tap-status-wrap');
      if (!wrap) return;
      const delivered = select.value === 'Consegnato';
      wrap.classList.toggle('is-green', delivered);
      wrap.classList.toggle('is-red', !delivered);
      const icon = wrap.querySelector('.tap-status-icon');
      if (icon) icon.textContent = delivered ? '✓' : '×';
      wrap.title = delivered ? 'Consegnato' : 'Da consegnare';
      select.setAttribute('aria-label', delivered ? 'Consegnato' : 'Da consegnare');
    }

    function decorateStatusSelect(select) {
      if (!select) return;
      if (!select.closest('.tap-status-wrap')) {
        const wrap = document.createElement('div');
        wrap.className = 'tap-status-wrap';
        const icon = document.createElement('span');
        icon.className = 'tap-status-icon';
        const chevron = document.createElement('span');
        chevron.className = 'tap-status-chevron';
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(icon);
        wrap.appendChild(chevron);
        wrap.appendChild(select);
        select.addEventListener('change', () => refreshStatusVisual(select));
      }
      refreshStatusVisual(select);
    }

    function decorateAllStatuses() {
      document.querySelectorAll('#rows .status-select').forEach(decorateStatusSelect);
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
      decorateAllStatuses();
      applying = false;
    }

    const observer = new MutationObserver(() => setTimeout(apply, 0));
    observer.observe(rowsRoot, { childList:true, subtree:true });

    rowsRoot.addEventListener('change', event => {
      const select = event.target.closest?.('.status-select');
      if (!select) return;
      setTimeout(() => refreshStatusVisual(select), 0);
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