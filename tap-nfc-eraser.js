(function(){
  'use strict';

  const bridge=window.TapAndroid;
  const trigger=document.getElementById('eraseNfcBtn');
  if(!trigger||!bridge||typeof bridge.eraseNfcTag!=='function')return;

  trigger.hidden=false;

  const style=document.createElement('style');
  style.textContent=`
    .tap-erase-backdrop{position:fixed;inset:0;z-index:120;background:rgba(5,18,38,.68);display:none;align-items:flex-end;justify-content:center;padding:18px 14px calc(18px + env(safe-area-inset-bottom));backdrop-filter:blur(5px)}
    .tap-erase-backdrop.show{display:flex}
    .tap-erase-sheet{width:min(100%,480px);background:#fff;border:1px solid #dce4ee;border-radius:25px;padding:24px;box-shadow:0 28px 70px rgba(5,18,38,.32);text-align:center}
    .tap-erase-icon{width:66px;height:66px;margin:0 auto 15px;border-radius:20px;background:#fff0ee;color:#bf3026;display:grid;place-items:center;font-size:31px;font-weight:900}
    .tap-erase-sheet.is-success .tap-erase-icon{background:#e9f8f3;color:#00866d}
    .tap-erase-sheet h2{margin:0;color:#0a1930;font-size:25px;letter-spacing:-.03em}
    .tap-erase-copy{margin:11px 0 0;color:#66758a;font-size:15px;line-height:1.45}
    .tap-erase-warning{margin:15px 0 0;padding:12px 13px;border:1px solid #f1d2ce;border-radius:13px;background:#fff7f6;color:#9e312a;font-size:12px;font-weight:800;line-height:1.4}
    .tap-erase-actions{display:grid;grid-template-columns:1fr 1.45fr;gap:10px;margin-top:20px}
    .tap-erase-actions button{height:54px;border-radius:15px;font:inherit;font-size:14px;font-weight:900;cursor:pointer}
    .tap-erase-cancel{border:1px solid #d5dfeb;background:#fff;color:#536176}
    .tap-erase-confirm{border:0;background:linear-gradient(135deg,#b9342a,#df4c40);color:#fff;box-shadow:0 10px 22px rgba(185,52,42,.2)}
    .tap-erase-confirm.success{background:linear-gradient(135deg,#00836b,#08aa88);box-shadow:0 10px 22px rgba(0,131,107,.2)}
    .tap-erase-confirm:disabled{opacity:.65;cursor:default}
    @media(min-width:700px){.tap-erase-backdrop{align-items:center}}
  `;
  document.head.appendChild(style);

  const backdrop=document.createElement('div');
  backdrop.className='tap-erase-backdrop';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-labelledby','tapEraseTitle');
  backdrop.innerHTML=`
    <div class="tap-erase-sheet">
      <div class="tap-erase-icon" aria-hidden="true">⌫</div>
      <h2 id="tapEraseTitle">Azzera card NFC</h2>
      <p class="tap-erase-copy">Il collegamento presente sulla card verrà cancellato.</p>
      <div class="tap-erase-warning">Dopo la conferma, avvicina la card al retro del telefono e mantienila ferma.</div>
      <div class="tap-erase-actions">
        <button class="tap-erase-cancel" type="button">Annulla</button>
        <button class="tap-erase-confirm" type="button">Conferma</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const sheet=backdrop.querySelector('.tap-erase-sheet');
  const title=backdrop.querySelector('h2');
  const copy=backdrop.querySelector('.tap-erase-copy');
  const warning=backdrop.querySelector('.tap-erase-warning');
  const cancel=backdrop.querySelector('.tap-erase-cancel');
  const confirm=backdrop.querySelector('.tap-erase-confirm');
  const icon=backdrop.querySelector('.tap-erase-icon');
  let waiting=false;

  function reset(){
    waiting=false;
    sheet.classList.remove('is-success');
    icon.textContent='⌫';
    title.textContent='Azzera card NFC';
    copy.textContent='Il collegamento presente sulla card verrà cancellato.';
    warning.hidden=false;
    warning.textContent='Dopo la conferma, avvicina la card al retro del telefono e mantienila ferma.';
    warning.style.removeProperty('color');
    warning.style.removeProperty('background');
    warning.style.removeProperty('border-color');
    cancel.hidden=false;
    confirm.disabled=false;
    confirm.textContent='Conferma';
    confirm.classList.remove('success');
  }

  function close(){
    if(waiting&&typeof bridge.cancelNfcWrite==='function')bridge.cancelNfcWrite();
    backdrop.classList.remove('show');
    document.body.style.overflow='';
    reset();
  }

  trigger.addEventListener('click',()=>{
    reset();
    backdrop.classList.add('show');
    document.body.style.overflow='hidden';
    confirm.focus();
  });

  cancel.addEventListener('click',close);
  backdrop.addEventListener('click',event=>{if(event.target===backdrop)close();});

  confirm.addEventListener('click',()=>{
    if(sheet.classList.contains('is-success')){close();return;}
    waiting=true;
    confirm.disabled=true;
    confirm.textContent='In attesa della card…';
    title.textContent='Avvicina la card';
    copy.textContent='Appoggia la card NFC al retro del telefono e mantienila ferma fino alla conferma.';
    warning.hidden=true;
    bridge.eraseNfcTag();
  });

  window.TapNfcEraserNativeResult=function(result){
    waiting=false;
    const success=!!(result&&result.success);
    const message=(result&&result.message)||'Operazione NFC non riuscita.';
    if(success){
      sheet.classList.add('is-success');
      icon.textContent='✓';
      title.textContent='Card azzerata';
      copy.textContent=message;
      warning.hidden=true;
      cancel.hidden=true;
      confirm.disabled=false;
      confirm.textContent='Chiudi';
      confirm.classList.add('success');
      return;
    }
    title.textContent='Azzeramento non riuscito';
    copy.textContent=message;
    warning.hidden=false;
    warning.textContent='Controlla che l’NFC sia attivo e mantieni la card ferma durante tutta l’operazione.';
    confirm.disabled=false;
    confirm.textContent='Riprova';
  };
})();
