(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'clienti.html') return;

  const STORAGE_KEY = 'tapreputa_clienti_filters_v1';
  const search = document.getElementById('clientSearch');
  const filterOperator = document.getElementById('filterOperator');
  const filterCategory = document.getElementById('filterCategory');
  const filterStatus = document.getElementById('filterStatus');
  const filterOrder = document.getElementById('filterOrder');
  const resetFilters = document.getElementById('resetFilters');
  const overlay = document.getElementById('overlay');
  const actionGrid = overlay?.querySelector('.action-grid');

  function safeParse(value) {
    try { return JSON.parse(value); } catch { return null; }
  }

  function saveFilters() {
    const state = {
      search: search?.value || '',
      operator: filterOperator?.value || '',
      category: filterCategory?.value || '',
      status: filterStatus?.value || '',
      order: filterOrder?.value || 'id'
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setIfAvailable(select, value) {
    if (!select || !value) return;
    if (Array.from(select.options).some(option => option.value === value || option.textContent === value)) {
      select.value = value;
    }
  }

  function restoreFilters() {
    const state = safeParse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!state) return;
    if (search) search.value = state.search || '';
    setIfAvailable(filterOperator, state.operator);
    setIfAvailable(filterCategory, state.category);
    setIfAvailable(filterStatus, state.status);
    setIfAvailable(filterOrder, state.order || 'id');
    [search, filterOperator, filterCategory, filterStatus, filterOrder].forEach(el => {
      if (!el) return;
      el.dispatchEvent(new Event(el === search ? 'input' : 'change', { bubbles:true }));
    });
  }

  [search, filterOperator, filterCategory, filterStatus, filterOrder].forEach(el => {
    if (!el) return;
    el.addEventListener(el === search ? 'input' : 'change', saveFilters);
  });
  resetFilters?.addEventListener('click', () => setTimeout(() => sessionStorage.removeItem(STORAGE_KEY), 0));

  let restored = false;
  const tryRestore = () => {
    if (restored) return;
    const operatorsReady = !filterOperator || filterOperator.options.length > 1;
    const categoriesReady = !filterCategory || filterCategory.options.length > 1;
    if (!operatorsReady || !categoriesReady) return;
    restored = true;
    restoreFilters();
  };
  tryRestore();
  if (!restored && filterOperator) {
    const observer = new MutationObserver(() => {
      tryRestore();
      if (restored) observer.disconnect();
    });
    observer.observe(filterOperator, { childList:true });
    if (filterCategory) observer.observe(filterCategory, { childList:true });
    setTimeout(() => { tryRestore(); observer.disconnect(); }, 2500);
  }

  function currentClient() {
    try {
      if (typeof currentId === 'undefined' || typeof clienti === 'undefined') return null;
      return clienti.find(client => client.id === currentId) || null;
    } catch {
      return null;
    }
  }

  if (actionGrid && !document.getElementById('duplicateClient')) {
    const duplicate = document.createElement('button');
    duplicate.id = 'duplicateClient';
    duplicate.className = 'action';
    duplicate.type = 'button';
    duplicate.textContent = 'Duplica cliente';
    duplicate.title = 'Avvia un nuovo cliente riutilizzando la stessa categoria';
    const danger = actionGrid.querySelector('.danger');
    if (danger) actionGrid.insertBefore(duplicate, danger);
    else actionGrid.appendChild(duplicate);

    duplicate.addEventListener('click', () => {
      const client = currentClient();
      if (!client) return;
      const params = new URLSearchParams();
      if (client.categoria_codice) params.set('duplicateCategory', client.categoria_codice);
      if (client.nome) params.set('duplicateFrom', client.nome);
      location.href = 'index.html?' + params.toString();
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .tap-shortcut-hint{margin:14px 0 0;color:#748196;font-size:11px;text-align:right}
    @media(max-width:760px){.tap-shortcut-hint{display:none}}
  `;
  document.head.appendChild(style);

  const tools = document.querySelector('.tools');
  if (tools && !document.querySelector('.tap-shortcut-hint')) {
    const hint = document.createElement('div');
    hint.className = 'tap-shortcut-hint';
    hint.textContent = 'Scorciatoie: / cerca · N nuovo cliente · Esc chiudi scheda';
    tools.insertAdjacentElement('afterend', hint);
  }

  document.addEventListener('keydown', event => {
    const target = event.target;
    const typing = target && (target.matches?.('input,select,textarea') || target.isContentEditable);
    if (event.key === 'Escape' && overlay?.classList.contains('show')) {
      overlay.classList.remove('show');
      return;
    }
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '/') {
      event.preventDefault();
      search?.focus();
      search?.select();
    } else if (event.key.toLowerCase() === 'n') {
      location.href = 'index.html';
    }
  });
})();
