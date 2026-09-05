(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  const logoFile = document.getElementById('logoFile');
  const logoPreview = document.getElementById('logoPreview');
  const logoName = document.getElementById('logoName');
  const generateBtn = document.getElementById('generateBtn');
  const previewBtn = document.getElementById('previewBtn');
  const finalLinkBox = document.getElementById('finalLinkBox');
  const finalLinkValue = document.getElementById('finalLinkValue');
  const copyBtn = document.getElementById('copyFinalBtn');
  const addClientBtn = document.getElementById('addClientBtn');
  const msg = document.getElementById('msg');
  const card = document.querySelector('.card');
  if (!activity || !card) return;

  const style = document.createElement('style');
  style.id = 'tap-personalizza-ux-v1';
  style.textContent = `
    .tap-category-search{margin:0 0 12px;position:relative}
    .tap-category-search input{width:100%;height:50px;border:1.5px solid #d5e0dc;border-radius:14px;background:#fbfdfc;padding:0 44px 0 15px;font:inherit;font-size:14px;color:#17342e;outline:none;transition:.18s ease}
    .tap-category-search input:focus{border-color:#0c9b80;box-shadow:0 0 0 4px rgba(12,155,128,.09);background:#fff}
    .tap-category-search .tap-search-icon{position:absolute;right:15px;top:50%;transform:translateY(-50%);font-size:17px;opacity:.48;pointer-events:none}
    .tap-field-status{display:flex;align-items:center;gap:7px;margin:9px 2px 0;font-size:12px;font-weight:750;color:#6d7a76}
    .tap-field-status.ok{color:#08735f}.tap-field-status.warn{color:#95600b}
    .tap-logo-tools{display:flex;align-items:center;gap:9px;margin-top:12px;flex-wrap:wrap}
    .tap-logo-tool{min-height:38px;padding:0 13px;border:1px solid #cbd8d4;border-radius:11px;background:#fff;color:#31544d;font:inherit;font-size:12px;font-weight:850;cursor:pointer}
    .tap-logo-tool.danger{color:#94403b;border-color:#e2c4c1;background:#fffafa}
    .tap-logo-state{font-size:12px;font-weight:800;color:#72817d;margin-left:auto}
    .tap-logo-state.ready{color:#08735f}
    .tap-progress{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 24px}
    .tap-progress-item{position:relative;padding:10px 8px;border-radius:12px;background:#f3f6f5;color:#8a9692;text-align:center;font-size:12px;font-weight:850;transition:.2s ease}
    .tap-progress-item.active{background:#e8f7f2;color:#08735f;box-shadow:inset 0 0 0 1px #c3e8dd}
    .tap-progress-item.done{background:#edf4f2;color:#42665e}
    .tap-progress-item strong{display:inline-grid;place-items:center;width:21px;height:21px;border-radius:50%;background:rgba(255,255,255,.8);margin-right:5px;font-size:11px}
    .tap-ready-badge{display:inline-flex;align-items:center;gap:6px;margin-bottom:12px;padding:7px 10px;border-radius:999px;background:#eaf8f4;color:#08735f;font-size:12px;font-weight:900}
    .tap-button-busy{pointer-events:none!important;opacity:.78!important;position:relative!important}
    .tap-button-busy::after{content:'';display:inline-block;width:14px;height:14px;margin-left:9px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;vertical-align:-2px;animation:tapSpin .7s linear infinite}
    @keyframes tapSpin{to{transform:rotate(360deg)}}
    .primary,.secondary,.preview-final,.copy-final,.add-client{transition:transform .14s ease,box-shadow .14s ease,opacity .14s ease,background .14s ease}
    .primary:hover,.secondary:hover,.preview-final:hover,.copy-final:hover,.add-client:hover{transform:translateY(-1px)}
    .primary:active,.secondary:active,.preview-final:active,.copy-final:active,.add-client:active{transform:translateY(0) scale(.995)}
    .final-link-box.show{animation:tapReveal .22s ease-out}
    @keyframes tapReveal{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
    @media(max-width:760px){
      .topbar{height:72px!important;padding:0 14px!important}.brand-icon{width:44px!important;height:44px!important}.brand-sub{display:none!important}.brand-title{font-size:16px!important}.clients-top{min-height:38px!important;padding:0 11px!important;font-size:12px!important}.wrap{padding-top:24px!important}.tap-progress{margin-bottom:18px}.tap-progress-item{font-size:11px;padding:9px 4px}.tap-progress-item strong{display:none}.tap-logo-state{width:100%;margin-left:0}
    }
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}.final-link-box.show{animation:none!important}.tap-button-busy::after{animation:none!important}}
  `;
  document.head.appendChild(style);

  // Percorso più chiaro: Attività > Personalizza > Anteprima.
  const oldSteps = document.querySelector('.steps');
  const progress = document.createElement('div');
  progress.className = 'tap-progress';
  progress.setAttribute('aria-label', 'Avanzamento creazione cliente');
  progress.innerHTML = '<div class="tap-progress-item done" data-stage="1"><strong>1</strong>Attività</div><div class="tap-progress-item active" data-stage="2"><strong>2</strong>Personalizza</div><div class="tap-progress-item" data-stage="3"><strong>3</strong>Anteprima</div>';
  if (oldSteps) oldSteps.replaceWith(progress);
  else card.insertAdjacentElement('beforebegin', progress);

  function setStage(stage) {
    progress.querySelectorAll('.tap-progress-item').forEach((el, index) => {
      const n = index + 1;
      el.classList.toggle('done', n < stage);
      el.classList.toggle('active', n === stage);
    });
  }

  // Ricerca categoria senza alterare il registro centrale.
  const activityField = activity.closest('.field');
  if (activityField && !document.getElementById('tapCategorySearch')) {
    const searchWrap = document.createElement('div');
    searchWrap.className = 'tap-category-search';
    searchWrap.innerHTML = '<input id="tapCategorySearch" type="search" autocomplete="off" placeholder="Cerca categoria…" aria-label="Cerca categoria"><span class="tap-search-icon">⌕</span>';
    activity.insertAdjacentElement('beforebegin', searchWrap);
    const search = searchWrap.querySelector('input');
    const status = document.createElement('div');
    status.className = 'tap-field-status';
    activity.insertAdjacentElement('afterend', status);

    function updateCategoryStatus() {
      const selected = activity.options[activity.selectedIndex];
      if (activity.value && selected) {
        status.className = 'tap-field-status ok';
        status.textContent = '✓ Categoria selezionata: ' + selected.textContent.trim();
      } else {
        status.className = 'tap-field-status warn';
        status.textContent = 'Seleziona una categoria per continuare.';
      }
    }

    search.addEventListener('input', () => {
      const q = search.value.trim().toLocaleLowerCase('it');
      let firstMatch = null;
      Array.from(activity.options).forEach(option => {
        if (!option.value) return;
        const match = !q || option.textContent.toLocaleLowerCase('it').includes(q);
        option.hidden = !match;
        if (match && !firstMatch) firstMatch = option;
      });
      if (q && firstMatch && !Array.from(activity.options).some(o => o.value === activity.value && !o.hidden)) {
        activity.value = firstMatch.value;
        activity.dispatchEvent(new Event('change', { bubbles:true }));
      }
    });
    activity.addEventListener('change', updateCategoryStatus);
    updateCategoryStatus();
  }

  // Gestione logo più evidente: stato, cambia, rimuovi.
  if (logoFile) {
    const uploadBox = logoFile.closest('.upload-box');
    if (uploadBox && !uploadBox.querySelector('.tap-logo-tools')) {
      const tools = document.createElement('div');
      tools.className = 'tap-logo-tools';
      tools.innerHTML = '<button class="tap-logo-tool" type="button" data-logo-change>Cambia logo</button><button class="tap-logo-tool danger" type="button" data-logo-remove>Rimuovi logo</button><span class="tap-logo-state">Logo non caricato</span>';
      uploadBox.appendChild(tools);
      const change = tools.querySelector('[data-logo-change]');
      const remove = tools.querySelector('[data-logo-remove]');
      const state = tools.querySelector('.tap-logo-state');

      function syncLogoState() {
        const hasFile = Boolean(logoFile.files && logoFile.files[0]);
        const skipped = Boolean(window.tapLogoSkipped);
        if (hasFile) {
          state.className = 'tap-logo-state ready';
          state.textContent = '✓ Logo pronto';
        } else if (skipped) {
          state.className = 'tap-logo-state';
          state.textContent = 'Proseguimento senza logo';
        } else {
          state.className = 'tap-logo-state';
          state.textContent = 'Logo non caricato';
        }
      }

      change.addEventListener('click', () => logoFile.click());
      remove.addEventListener('click', () => {
        logoFile.value = '';
        try { logoDataUrl = ''; } catch (_) { window.logoDataUrl = ''; }
        window.tapLogoSkipped = false;
        if (logoPreview) logoPreview.classList.remove('show');
        const img = document.getElementById('logoPreviewImg');
        if (img) img.removeAttribute('src');
        if (logoName) logoName.textContent = '';
        syncLogoState();
      });
      logoFile.addEventListener('change', syncLogoState);
      generateBtn?.addEventListener('click', () => setTimeout(syncLogoState, 0));
      syncLogoState();
    }
  }

  function setBusy(button, text) {
    if (!button || button.classList.contains('tap-button-busy')) return () => {};
    const original = button.textContent;
    button.classList.add('tap-button-busy');
    if (text) button.textContent = text;
    const clear = () => {
      button.classList.remove('tap-button-busy');
      button.textContent = original;
    };
    setTimeout(clear, 4500);
    return clear;
  }

  // Feedback durante le operazioni, senza cambiare la logica esistente.
  if (generateBtn) {
    generateBtn.addEventListener('click', () => {
      if (!activity.value) return;
      const clear = setBusy(generateBtn, 'Generazione');
      setTimeout(clear, 650);
    });
  }
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const clear = setBusy(previewBtn, 'Preparazione');
      setTimeout(clear, 900);
      setStage(3);
    });
  }

  // Area risultato più leggibile e orientata all'azione.
  function decorateFinalLink() {
    if (!finalLinkBox || !finalLinkBox.classList.contains('show') || finalLinkBox.dataset.tapDecorated === '1') return;
    finalLinkBox.dataset.tapDecorated = '1';
    const badge = document.createElement('div');
    badge.className = 'tap-ready-badge';
    badge.innerHTML = '✓ Link NFC pronto';
    finalLinkBox.insertAdjacentElement('afterbegin', badge);
    setStage(3);
  }
  if (finalLinkBox) {
    new MutationObserver(decorateFinalLink).observe(finalLinkBox, { attributes:true, attributeFilter:['class'] });
    decorateFinalLink();
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const original = copyBtn.textContent;
      setTimeout(() => {
        copyBtn.textContent = 'Copiato ✓';
        setTimeout(() => { copyBtn.textContent = original; }, 1300);
      }, 60);
    });
  }

  // Segnale immediato se cambiano dati dopo la generazione del link.
  activity.addEventListener('change', () => {
    if (finalLinkBox?.classList.contains('show')) {
      finalLinkBox.classList.remove('show');
      previewBtn?.classList.remove('show');
      addClientBtn?.classList.remove('show');
      if (finalLinkValue) finalLinkValue.textContent = '';
      finalLinkBox.dataset.tapDecorated = '';
      setStage(2);
      if (msg) {
        msg.className = 'message show warn';
        msg.textContent = 'Categoria modificata: genera nuovamente il link finale.';
      }
    }
  });
})();
