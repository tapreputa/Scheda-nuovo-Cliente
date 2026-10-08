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
  function enabled() { return activity.value !== 'standard' && !window.tapLogoSkipped; }
  function persist() { try { sessionStorage.setItem(key, JSON.stringify(settings)); } catch {} }
  function notice(text) { msg.className = 'message show warn'; msg.textContent = text; }
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
    doc.documentElement.dataset.tapManualLogo = 'v1';
    doc.documentElement.dataset.tapManualSettings = JSON.stringify(settings);
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }
  function output() { return transform(sourceHtml); }
  function render() {
    if (!frame || !sourceHtml) return;
    frame.srcdoc = output();
    persist();
  }
  function change() { invalidate(); render(); }
  function commit() {
    editing = false;
    render();
    window.TapTemplateStability?.commitManualPreview(output());
    toolbar.querySelector('[data-save]').textContent = 'Modifiche salvate ✓';
    const close = toolbar.querySelector('[data-edit-close]');
    close.textContent = 'Torna a Personalizza';
  }
  function installToolbar() {
    const overlay = document.getElementById('tapPreviewOverlay');
    frame = document.getElementById('tapPreviewFrame');
    if (!overlay || !frame) return;
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.style.cssText = 'background:#eef7f4;color:#123d34;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font:700 13px Arial;flex:0 0 auto';
      toolbar.innerHTML = '<label>Dimensione <input data-width aria-label="Dimensione logo" type="range" min="10" max="95" step="1"></label><label>Sfondo <select data-surface aria-label="Sfondo sotto il logo"><option value="none">Nessuno</option><option value="light">Chiaro</option><option value="dark">Scuro</option></select></label><button type="button" data-center>Centra</button><button type="button" data-reset>Ripristina</button><button type="button" data-save>Salva e visualizza anteprima</button><button type="button" data-edit-close>Torna a Personalizza</button><span style="width:100%;font-weight:400">Trascina il logo per spostarlo. Salva le regolazioni prima di generare il link.</span>';
      toolbar.querySelectorAll('button,select').forEach(n => n.style.cssText='padding:8px;border:1px solid #b2ccc3;border-radius:8px;background:white;color:#123d34;font:inherit');
      overlay.insertBefore(toolbar,frame);
      toolbar.querySelector('[data-width]').addEventListener('input',e=>{settings.width=Number(e.target.value);editing=true;change();});
      toolbar.querySelector('[data-surface]').addEventListener('change',e=>{settings.surface=e.target.value;editing=true;change();});
      toolbar.querySelector('[data-center]').onclick=()=>{settings.x=50;editing=true;change();};
      toolbar.querySelector('[data-reset]').onclick=()=>{settings={...defaults};syncControls();editing=true;change();};
      toolbar.querySelector('[data-save]').onclick=commit;
      toolbar.querySelector('[data-edit-close]').onclick=()=>{
        if(editing) { notice('Salva prima le regolazioni del logo.'); return; }
        closeInlinePreview();
      };
      frame.addEventListener('load',installDrag);
    }
    // Keep the frame viewport identical in edit mode and saved preview.
    overlay.firstElementChild.style.display='none';
    toolbar.hidden = !enabled();
    syncControls();
  }
  function syncControls() {
    if (!toolbar) return;
    toolbar.querySelector('[data-width]').value=settings.width;
    toolbar.querySelector('[data-surface]').value=settings.surface;
    toolbar.querySelector('[data-save]').textContent='Salva e visualizza anteprima';
  }
  function installDrag() {
    const doc=frame.contentDocument;
    const logo=doc?.getElementById('tapManualLogo');
    if (!logo) return;
    logo.draggable=false;
    let drag=null;
    logo.addEventListener('pointerdown',e=>{
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
      if(toolbar) {toolbar.hidden=true;document.getElementById('tapPreviewOverlay').firstElementChild.style.display='';}
      return baseOpen(html);
    }
    sourceHtml=html;
    editing=true;
    baseOpen(html);
    sourceHtml=document.getElementById('tapPreviewFrame')?.srcdoc || html;
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
      const response=await TapNfc.rest('manual_logo_pages?on_conflict=slug',{
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
  document.getElementById('logoFile').addEventListener('change',()=>{settings={...defaults};persist();publishedHash='';});
  window.addEventListener('tap-logo-archive-selected',()=>{publishedHash='';});
  previewButton.textContent='Regola logo e anteprima';
  window.TapManualLogoEditor=Object.freeze({
    enabled,transform,getSettings:()=>({...settings}),
    isEditing:()=>editing
  });
})();
