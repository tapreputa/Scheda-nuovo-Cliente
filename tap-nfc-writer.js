(() => {
  'use strict';

  const nativeBridge = window.TapAndroid;
  if (!nativeBridge || typeof nativeBridge.writeNfcUrl !== 'function') return;

  const reviewValue = document.getElementById('mReview');
  const personalizedValue = document.getElementById('mNfc');
  const clientName = document.getElementById('mName');
  if (!reviewValue || !personalizedValue) return;

  const style = document.createElement('style');
  style.textContent = `
    .tap-nfc-write-detail{position:relative;padding-right:104px!important}
    .tap-nfc-write-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);min-width:76px;min-height:42px;padding:0 14px;border:0;border-radius:13px;background:#0876e8;color:#fff;font:900 14px/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;box-shadow:0 8px 20px rgba(8,118,232,.22);cursor:pointer}
    .tap-nfc-write-btn:active{transform:translateY(-50%) scale(.97)}
    .tap-nfc-overlay{display:none;position:fixed;inset:0;z-index:300;background:rgba(4,20,38,.62);padding:20px;align-items:center;justify-content:center}
    .tap-nfc-overlay.show{display:flex}
    .tap-nfc-dialog{width:min(420px,100%);background:#fff;border-radius:25px;padding:28px 24px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.30)}
    .tap-nfc-icon{width:68px;height:68px;margin:0 auto 17px;border-radius:22px;display:grid;place-items:center;background:#eaf4ff;color:#0876e8;font-size:34px;font-weight:900}
    .tap-nfc-title{margin:0;color:#0a2340;font-size:25px;line-height:1.1;font-weight:950}
    .tap-nfc-client{margin-top:8px;color:#0876e8;font-size:14px;font-weight:900}
    .tap-nfc-message{margin:17px auto 0;color:#536579;font-size:16px;line-height:1.45;max-width:330px}
    .tap-nfc-actions{display:flex;gap:10px;margin-top:23px}
    .tap-nfc-action{flex:1;min-height:48px;border-radius:14px;border:1px solid #cfdae5;background:#fff;color:#27435f;font:850 14px/1 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;cursor:pointer}
    .tap-nfc-action.primary{background:#0876e8;border-color:#0876e8;color:#fff}
    .tap-nfc-overlay.success .tap-nfc-icon{background:#e7f8ef;color:#07845b}
    .tap-nfc-overlay.success .tap-nfc-title{color:#087251}
    .tap-nfc-overlay.error .tap-nfc-icon{background:#fff0ed;color:#c3392d}
    .tap-nfc-overlay.error .tap-nfc-title{color:#9a3027}
    @media(max-width:560px){.tap-nfc-write-detail{padding-right:14px!important;padding-bottom:68px!important}.tap-nfc-write-btn{left:14px;right:14px;top:auto;bottom:13px;transform:none;min-height:43px}.tap-nfc-write-btn:active{transform:scale(.98)}.tap-nfc-dialog{padding:25px 20px}}
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'tap-nfc-overlay';
  overlay.innerHTML = `
    <div class="tap-nfc-dialog" role="dialog" aria-modal="true" aria-labelledby="tapNfcTitle">
      <div class="tap-nfc-icon" aria-hidden="true">⌁</div>
      <h2 id="tapNfcTitle" class="tap-nfc-title">Scrittura NFC</h2>
      <div id="tapNfcClient" class="tap-nfc-client"></div>
      <div id="tapNfcMessage" class="tap-nfc-message">Avvicina la card NFC al retro del telefono e mantienila ferma.</div>
      <div class="tap-nfc-actions">
        <button id="tapNfcCancel" class="tap-nfc-action" type="button">Annulla</button>
        <button id="tapNfcRetry" class="tap-nfc-action primary" type="button" hidden>Riprova</button>
        <button id="tapNfcClose" class="tap-nfc-action primary" type="button" hidden>Chiudi</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const title = overlay.querySelector('#tapNfcTitle');
  const client = overlay.querySelector('#tapNfcClient');
  const message = overlay.querySelector('#tapNfcMessage');
  const cancel = overlay.querySelector('#tapNfcCancel');
  const retry = overlay.querySelector('#tapNfcRetry');
  const close = overlay.querySelector('#tapNfcClose');
  let pending = null;

  function closeWriter() {
    try { nativeBridge.cancelNfcWrite(); } catch {}
    overlay.classList.remove('show', 'success', 'error');
    pending = null;
  }

  function beginWrite(url, label) {
    const clean = String(url || '').trim();
    if (!clean || clean === '-') return;
    pending = { url:clean, label };
    overlay.classList.remove('success', 'error');
    title.textContent = 'Scrivi ' + label;
    client.textContent = String(clientName?.textContent || '').trim();
    message.textContent = 'Avvicina la card NFC al retro del telefono e mantienila ferma.';
    cancel.hidden = false;
    retry.hidden = true;
    close.hidden = true;
    overlay.classList.add('show');
    try {
      nativeBridge.writeNfcUrl(clean, label);
    } catch {
      window.TapNfcWriterNativeResult({ success:false, message:'Scrittura NFC non disponibile su questo dispositivo.' });
    }
  }

  function addWriteButton(value, label) {
    const detail = value.closest('.detail');
    if (!detail || detail.querySelector('.tap-nfc-write-btn')) return;
    detail.classList.add('tap-nfc-write-detail');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tap-nfc-write-btn';
    button.textContent = 'Scrivi';
    button.setAttribute('aria-label', 'Scrivi ' + label + ' sulla card NFC');
    button.addEventListener('click', () => beginWrite(value.textContent, label));
    detail.appendChild(button);
  }

  window.TapNfcWriterNativeResult = result => {
    if (!overlay.classList.contains('show')) return;
    const data = typeof result === 'string' ? (() => { try { return JSON.parse(result); } catch { return {}; } })() : (result || {});
    cancel.hidden = true;
    if (data.success) {
      overlay.classList.add('success');
      overlay.classList.remove('error');
      title.textContent = 'Scrittura completata ✓';
      message.textContent = 'Il link è stato scritto sulla card NFC.';
      retry.hidden = true;
      close.hidden = false;
      pending = null;
      return;
    }
    overlay.classList.add('error');
    overlay.classList.remove('success');
    title.textContent = 'Scrittura non riuscita';
    message.textContent = data.message || 'Riprova mantenendo la card ferma sul retro del telefono.';
    retry.hidden = !pending;
    close.hidden = false;
  };

  cancel.addEventListener('click', closeWriter);
  close.addEventListener('click', closeWriter);
  retry.addEventListener('click', () => pending && beginWrite(pending.url, pending.label));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && overlay.classList.contains('show')) closeWriter(); });

  addWriteButton(reviewValue, 'link recensioni');
  addWriteButton(personalizedValue, 'link personalizzato');
})();
