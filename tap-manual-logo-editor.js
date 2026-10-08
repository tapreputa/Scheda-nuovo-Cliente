(() => {
  'use strict';
  if (!location.pathname.endsWith('/personalizza.html')) return;
  const params = new URLSearchParams(location.search);
  // Existing potential edit sessions retain their original pipeline.
  if (params.has('potential')) return;
  const activity = document.getElementById('activityType');
  const previewButton = document.getElementById('previewBtn');
  const generateButton = document.getElementById('generateBtn');
  const msg = document.getElementById('msg');
  const key = 'tap_manual_logo_v1:' + (params.get('placeid') || params.get('business') || '');
  const defaults = { width:55, x:50, y:3, surface:'none' };
  let settings = {...defaults};
  try { settings = {...defaults, ...JSON.parse(sessionStorage.getItem(key) || '{}')}; } catch {}
  let sourceHtml = '';
  let editing = false;
  let publishing = false;
  let publishedHash = '';
  let frame = null;
  let toolbar = null;
  let stage = null;
  let nativeFrameStyle = '';
  let nativeTopbarDisplay = '';
  let fitRequest = 0;
  let referenceViewport = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(key + ':viewport') || 'null');
    if (saved && Number.isInteger(saved.width) && Number.isInteger(saved.height) && saved.width >= 200 && saved.width <= 4096 && saved.height >= 200 && saved.height <= 8192) referenceViewport = saved;
  } catch {}
  function enabled() { return activity.value !== 'standard' && !window.tapLogoSkipped; }
  function persist() { try { sessionStorage.setItem(key, JSON.stringify(settings)); } catch {} }
  function notice(text) {
    msg.className = 'message show warn'; msg.textContent = text;
    const status = toolbar?.querySelector('[data-status]');
    if (status) { status.hidden = false; status.textContent = text; }
  }
  function invalidate() {
    publishedHash = '';
    window.TapTemplateStability?.invalidate('regolazione manuale logo');
  }
  function transform(html) {
    if (!enabled()) return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const logo = doc.querySelector('#tapManualLogo') || doc.querySelector('img.logo,img#logo');
    if (!logo) return html;
    // Published snapshots contain static markup only; no automatic logo scripts.
    doc.querySelectorAll('script').forEach(n => n.remove());
    doc.querySelectorAll('[id^="tap-logo-solid"],#tap-manual-logo-style').forEach(n => n.remove());
    const style = doc.createElement('style');
    style.id = 'tap-manual-logo-style';
    style.textContent = 'html,body{-webkit-text-size-adjust:100%;text-size-adjust:100%}';
    doc.head.appendChild(style);
    if (!doc.querySelector('[data-tap-manual-slot]')) {
      const slot = logo.cloneNode(true);
      slot.removeAttribute('id');
      slot.setAttribute('data-tap-manual-slot', '');
      slot.setAttribute('aria-hidden', 'true');
      slot.setAttribute('alt', '');
      slot.style.setProperty('visibility','hidden','important');
      slot.style.setProperty('pointer-events','none','important');
      logo.replaceWith(slot);
    }
    logo.id = 'tapManualLogo';
    logo.className = 'tap-manual-logo';
    logo.removeAttribute('style');
    const css = {
      position:'fixed', left:settings.x + 'vw', top:settings.y + 'vh',
      width:'min(' + settings.width + 'vw,600px)', height:'auto',
      'max-width':'95vw', 'max-height':'90vh', 'min-width':'0', 'min-height':'0',
      transform:'translateX(-50%)', margin:'0', padding:settings.surface === 'none' ? '0' : '10px 14px',
      background:({none:'transparent',light:'#ffffff',dark:'#17212b'})[settings.surface] || 'transparent',
      border:'0', 'border-radius':settings.surface === 'none' ? '0' : '14px',
      'box-sizing':'border-box','object-fit':'contain','box-shadow':'none',
      filter:'none', opacity:'1','mix-blend-mode':'normal','z-index':'20',
      'touch-action':'none','user-select':'none', display:'block'
    };
    for (const [property,value] of Object.entries(css)) logo.style.setProperty(property,value,'important');
    doc.body.appendChild(logo);
    doc.documentElement.dataset.tapManualLogo = 'v2';
    doc.documentElement.dataset.tapManualSettings = JSON.stringify(settings);
    doc.documentElement.dataset.tapManualViewport = JSON.stringify(referenceViewport);
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }
  function output() { return transform(sourceHtml); }
  function render() {
    if (!frame || !sourceHtml) return;
    frame.srcdoc = output();
    persist();
  }
  function change() { invalidate(); syncControls(); render(); }
  function commit() {
    editing = false;
    render();
    window.TapTemplateStability?.commitManualPreview(output());
    toolbar.dataset.preview = 'true';
    toolbar.querySelector('[data-status]').hidden = true;
    scheduleFit();
  }
  function scheduleFit() {
    cancelAnimationFrame(fitRequest);
    fitRequest = requestAnimationFrame(fitFrame);
  }
  function fitFrame() {
    const overlay = document.getElementById('tapPreviewOverlay');
    if (!stage || !frame || !referenceViewport || !overlay?.classList.contains('tap-manual-active') || !stage.clientHeight) return;
    // Freeze the composition's viewport; resizes only scale its outside display.
    const { width, height } = referenceViewport;
    const scale = Math.min((stage.clientWidth - 8) / width, (stage.clientHeight - 8) / height, 1);
    frame.style.cssText = 'border:0;position:absolute;flex:none;max-width:none;max-height:none;min-width:0;min-height:0;background:#fff;transform-origin:0 0;';
    frame.style.width = width + 'px';
    frame.style.height = height + 'px';
    frame.style.left = ((stage.clientWidth - width * scale) / 2) + 'px';
    frame.style.top = ((stage.clientHeight - height * scale) / 2) + 'px';
    frame.style.transform = 'scale(' + scale + ')';
  }
  function restoreNativePreview() {
    const overlay = document.getElementById('tapPreviewOverlay');
    if (!stage || !overlay) return;
    overlay.classList.remove('tap-manual-active');
    toolbar.hidden = true;
    stage.hidden = true;
    overlay.insertBefore(frame, stage);
    frame.style.cssText = nativeFrameStyle;
    overlay.firstElementChild.style.display = nativeTopbarDisplay;
  }
  function nudge(dx, dy) {
    const logo = frame.contentDocument?.getElementById('tapManualLogo');
    if (!logo) return;
    const rect = logo.getBoundingClientRect();
    const w = frame.contentWindow.innerWidth, h = frame.contentWindow.innerHeight;
    const halfWidth = rect.width / w * 50;
    settings.x = Number(Math.max(halfWidth, Math.min(100 - halfWidth, settings.x + dx)).toFixed(3));
    settings.y = Number(Math.max(0, Math.min(Math.max(0, 100 - rect.height / h * 100), settings.y + dy)).toFixed(3));
    editing = true; change();
  }
  function installToolbar() {
    const overlay = document.getElementById('tapPreviewOverlay');
    frame = document.getElementById('tapPreviewFrame');
    if (!overlay || !frame) return;
    if (!toolbar) {
      nativeFrameStyle = frame.style.cssText;
      nativeTopbarDisplay = overlay.firstElementChild.style.display;
      const style = document.createElement('style');
      style.id = 'tap-manual-editor-ui';
      style.textContent = `
        #tapPreviewOverlay.tap-manual-active{overflow:hidden;background:#10232a!important}
        #tapManualStage{position:relative;flex:1 1 0;min-height:0;min-width:0;overflow:hidden}
        #tapManualControls{flex:0 0 auto;box-sizing:border-box;width:100%;max-height:40%;overflow:auto;padding:7px 10px calc(7px + env(safe-area-inset-bottom));background:#eef7f4;color:#123d34;font:600 12px/1.2 Arial,Helvetica,sans-serif;display:grid;gap:5px;box-shadow:0 -2px 12px #0003}
        #tapManualControls *{box-sizing:border-box}
        #tapManualControls [hidden],#tapManualStage[hidden]{display:none!important}
        #tapManualControls label{margin:0;font:inherit;display:block}
        #tapManualControls button{margin:0;width:auto;min-width:0;min-height:32px;height:auto;padding:5px 8px;border:1px solid #a8c9bf;border-radius:7px;background:#fff;color:#123d34;font:700 12px/1.2 Arial,Helvetica,sans-serif;cursor:pointer;touch-action:manipulation;white-space:nowrap}
        #tapManualControls button:focus-visible{outline:3px solid #157861;outline-offset:1px}
        #tapManualControls [data-size-row]{display:grid;grid-template-columns:65px 1fr 35px;gap:7px;align-items:center;min-height:24px}
        #tapManualControls input[type=range]{width:100%;height:24px;margin:0;min-width:0;accent-color:#00866d}
        #tapManualControls [data-surface-row]{display:grid;grid-template-columns:65px repeat(3,1fr);gap:5px;align-items:center}
        #tapManualControls [data-surface][aria-pressed=true]{background:#096b59;color:#fff;border-color:#096b59}
        #tapManualControls [data-position-row]{display:grid;grid-template-columns:repeat(4,1fr) 1.5fr 1.7fr;gap:5px}
        #tapManualControls [data-move]{font-size:18px;padding:2px}
        #tapManualControls [data-actions]{display:grid;grid-template-columns:1fr 1.65fr;gap:6px}
        #tapManualControls [data-save]{background:#096b59;color:#fff;border-color:#096b59;min-height:36px}
        #tapManualControls [data-hint]{text-align:center;font-weight:400;font-size:11px}
        #tapManualControls [data-preview-heading],#tapManualControls [data-edit]{display:none}
        #tapManualControls [data-status]{color:#7b5410;white-space:normal}
        #tapManualControls[data-preview=true]{grid-template-columns:1fr auto auto;align-items:center;gap:6px;padding-top:6px;padding-bottom:calc(6px + env(safe-area-inset-bottom))}
        #tapManualControls[data-preview=true] [data-edit-only],#tapManualControls[data-preview=true] [data-save]{display:none}
        #tapManualControls[data-preview=true] [data-preview-heading],#tapManualControls[data-preview=true] [data-edit]{display:block}
        #tapManualControls[data-preview=true] [data-actions]{display:contents}
        #tapManualControls[data-preview=true] [data-status]{grid-column:1/-1}
        @media(max-height:480px){#tapManualControls{max-height:48%;gap:3px;padding-top:4px;padding-bottom:4px}#tapManualControls [data-hint]{display:none}}
      `;
      document.head.appendChild(style);
      stage = document.createElement('div');
      stage.id = 'tapManualStage';
      overlay.insertBefore(stage, frame);
      stage.appendChild(frame);
      toolbar = document.createElement('div');
      toolbar.id = 'tapManualControls';
      toolbar.innerHTML = '<strong data-preview-heading>Anteprima salvata ✓</strong><div data-edit-only data-size-row><label for="tapManualWidth">Dimensione</label><input id="tapManualWidth" data-width aria-label="Dimensione logo" type="range" min="10" max="95" step="1"><output data-width-value for="tapManualWidth"></output></div><div data-edit-only data-surface-row><span>Sfondo</span><button type="button" data-surface="none">Nessuno</button><button type="button" data-surface="light">Chiaro</button><button type="button" data-surface="dark">Scuro</button></div><div data-edit-only data-position-row><button type="button" data-move="left" aria-label="Sposta logo a sinistra">←</button><button type="button" data-move="right" aria-label="Sposta logo a destra">→</button><button type="button" data-move="up" aria-label="Sposta logo in alto">↑</button><button type="button" data-move="down" aria-label="Sposta logo in basso">↓</button><button type="button" data-center>Centra</button><button type="button" data-reset>Ripristina</button></div><button type="button" data-edit>Modifica logo</button><div data-actions><button type="button" data-edit-close>Torna</button><button type="button" data-save>Salva e visualizza anteprima</button></div><span data-edit-only data-hint>Pagina intera in scala · trascina il logo o usa le frecce</span><span data-status role="status" hidden></span>';
      overlay.appendChild(toolbar);
      toolbar.querySelector('[data-width]').addEventListener('input',e=>{
        settings.width=Number(e.target.value);
        const half = Math.min(settings.width, 600 / frame.contentWindow.innerWidth * 100) / 2;
        settings.x=Math.max(half,Math.min(100-half,settings.x));
        editing=true;change();
      });
      toolbar.querySelectorAll('[data-surface]').forEach(button=>button.onclick=()=>{settings.surface=button.dataset.surface;editing=true;change();});
      toolbar.querySelectorAll('[data-move]').forEach(button=>button.onclick=()=>{
        const directions={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
        nudge(...directions[button.dataset.move]);
      });
      toolbar.querySelector('[data-center]').onclick=()=>{settings.x=50;editing=true;change();};
      toolbar.querySelector('[data-reset]').onclick=()=>{settings={...defaults};syncControls();editing=true;change();};
      toolbar.querySelector('[data-save]').onclick=commit;
      toolbar.querySelector('[data-edit]').onclick=()=>{
        toolbar.dataset.preview='false';editing=true;syncControls();scheduleFit();
      };
      toolbar.querySelector('[data-edit-close]').onclick=()=>{
        if(editing) { notice('Salva prima le regolazioni del logo.'); return; }
        closeInlinePreview();
      };
      frame.addEventListener('load',installDrag);
      new ResizeObserver(scheduleFit).observe(stage);
      window.addEventListener('resize',scheduleFit);
      window.visualViewport?.addEventListener('resize',scheduleFit);
    }
    overlay.classList.add('tap-manual-active');
    overlay.firstElementChild.style.display='none';
    stage.hidden=false;
    stage.appendChild(frame);
    toolbar.hidden=false;
    toolbar.dataset.preview='false';
    syncControls();
    fitFrame();
  }
  function syncControls() {
    if (!toolbar) return;
    toolbar.querySelector('[data-width]').value=settings.width;
    toolbar.querySelector('[data-width-value]').textContent=settings.width+'%';
    toolbar.querySelectorAll('[data-surface]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.surface===settings.surface)));
    toolbar.querySelector('[data-status]').hidden=true;
  }
  function installDrag() {
    const doc=frame.contentDocument;
    const logo=doc?.getElementById('tapManualLogo');
    if (!logo) return;
    logo.draggable=false;
    let drag=null;
    logo.addEventListener('pointerdown',e=>{
      if(toolbar.dataset.preview==='true') return;
      editing=true;invalidate();
      const r=logo.getBoundingClientRect();
      drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top,w:r.width,h:r.height};
      logo.setPointerCapture(e.pointerId);e.preventDefault();
    });
    logo.addEventListener('pointermove',e=>{
      if(!drag) return;
      const w=frame.contentWindow.innerWidth,h=frame.contentWindow.innerHeight;
      const left=Math.max(0,Math.min(w-drag.w,drag.left+e.clientX-drag.x));
      const top=Math.max(0,Math.min(h-drag.h,drag.top+e.clientY-drag.y));
      settings.x=Number(((left+drag.w/2)/w*100).toFixed(3));
      settings.y=Number((top/h*100).toFixed(3));
      logo.style.setProperty('left',settings.x+'vw','important');
      logo.style.setProperty('top',settings.y+'vh','important');
    });
    const finish=()=>{if(drag){drag=null;persist();render();}};
    logo.addEventListener('pointerup',finish);
    logo.addEventListener('pointercancel',finish);
  }
  const baseOpen=openInlinePreview;
  openInlinePreview=function(html) {
    if(!enabled()) {
      restoreNativePreview();
      return baseOpen(html);
    }
    sourceHtml=html;
    editing=true;
    baseOpen(html);
    sourceHtml=document.getElementById('tapPreviewFrame')?.srcdoc || html;
    if (!referenceViewport) {
      const overlay = document.getElementById('tapPreviewOverlay');
      referenceViewport = { width:overlay.clientWidth, height:overlay.clientHeight };
      try { sessionStorage.setItem(key + ':viewport', JSON.stringify(referenceViewport)); } catch {}
    }
    installToolbar();
  };
  async function publish() {
    if (publishing) return;
    const check=window.TapTemplateStability?.validateForGenerate();
    if (!check?.ok || editing) return notice(check?.message || 'Salva prima le regolazioni del logo.');
    const html=check.snapshot.html;
    const slug=slugifyBusinessName(params.get('business') || '').slice(0,80);
    if(!slug) return notice('Nome attività non disponibile.');
    publishing=true;generateButton.disabled=true;
    try {
      const user=await TapNfc.getUser();
      const response=await TapNfc.rest('manual_logo_pages?on_conflict=slug&select=slug',{
        method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},
        body:JSON.stringify({slug,html,created_by:user.id})
      });
      const data=await response.json();
      if(!response.ok) throw new Error(data.message || 'Pubblicazione non riuscita.');
      publishedHash=check.snapshot.htmlHash;
      finalNfcUrl='https://tapreputa.github.io/Scheda-nuovo-Cliente/tap.html?c='+slug;
      document.getElementById('finalLinkValue').textContent=finalNfcUrl;
      document.getElementById('finalLinkBox').classList.add('show');
      document.getElementById('addClientBtn').classList.add('show');
      TapTemplateStability.bindGeneratedLink(finalNfcUrl);
      msg.className='message show ok';msg.textContent='Pagina pubblicata con le regolazioni salvate.';
    } catch(e) {notice(e.message);}
    finally {publishing=false;generateButton.disabled=false;}
  }
  // Document capture precedes the original category-specific generation handlers.
  document.addEventListener('click',e=>{
    if(!enabled()) return;
    if(e.target.closest('#generateBtn')) {e.preventDefault();e.stopImmediatePropagation();publish();}
    if(e.target.closest('#addClientBtn,#savePotentialBtn')) {
      const snapshot=window.TapTemplateStability?.getSnapshot();
      if(editing || !publishedHash || publishedHash!==snapshot?.htmlHash) {
        e.preventDefault();e.stopImmediatePropagation();notice('Salva le regolazioni e genera il link prima di salvare il cliente.');
      }
    }
  },true);
  activity.addEventListener('change',()=>{publishedHash='';sourceHtml='';});
  document.getElementById('logoFile').addEventListener('change',()=>{
    settings={...defaults};persist();publishedHash='';
    referenceViewport=null;
    try { sessionStorage.removeItem(key + ':viewport'); } catch {}
    try { logoDataUrl=''; } catch {}
  });
  window.addEventListener('tap-logo-archive-selected',()=>{publishedHash='';});
  previewButton.textContent='Regola logo e anteprima';
  window.TapManualLogoEditor=Object.freeze({
    enabled,transform,getSettings:()=>({...settings,viewport:referenceViewport && {...referenceViewport}}),
    isEditing:()=>editing
  });
})();
