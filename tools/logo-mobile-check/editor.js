(() => {
  'use strict';
  if (!location.pathname.endsWith('/personalizza.html')) return;
  const params = new URLSearchParams(location.search);
  // Existing potential/client edit sessions keep their original pipeline.
  if (params.has('potential')) return;
  const activity = document.getElementById('activityType');
  const previewButton = document.getElementById('previewBtn');
  const generateButton = document.getElementById('generateBtn');
  const msg = document.getElementById('msg');
  const key = 'tap_manual_logo_v1:' + (params.get('placeid') || params.get('business') || '');
  const defaults = {width:55,x:50,y:3,surface:'none'};
  const definitions = {
    logo:{label:'Logo',selector:'#tapManualLogo,img.logo,img#logo'},
    caption:{label:'Didascalia',selector:'.eyebrow'},
    message:{label:'Testo aggiuntivo',selector:'.messaggio-box,.messaggio'},
    stars:{label:'Stelle',selector:'.stelle'},
    button:{label:'Pulsante recensione',selector:'a.bottone-google,#bottoneGoogle'}
  };
  let settings = {...defaults}, elements = {}, baselines = {}, selected = 'logo';
  let sourceHtml='',editing=false,publishing=false,publishedHash='';
  let frame=null,toolbar=null,stage=null,nativeFrameStyle='',nativeTopbarDisplay='';
  let fitRequest=0,referenceViewport=null,opening=false,needsBaseline=false,ready=false,loadEpoch=0;
  try { settings={...defaults,...JSON.parse(sessionStorage.getItem(key)||'{}')}; } catch {}
  try {
    const saved=JSON.parse(sessionStorage.getItem(key+':viewport')||'null');
    if(saved && Number.isInteger(saved.width) && Number.isInteger(saved.height) && saved.width>=200 && saved.width<=4096 && saved.height>=200 && saved.height<=8192) referenceViewport=saved;
  } catch {}
  function enabled(){return activity.value!=='standard';}
  function compositionKey(){return key+':composition:'+activity.value;}
  function loadComposition(){
    elements={};
    try {
      const saved=JSON.parse(sessionStorage.getItem(compositionKey())||'{}');
      for(const id of Object.keys(definitions)) if(id!=='logo' && saved[id] && typeof saved[id]==='object') elements[id]=saved[id];
    } catch {}
  }
  loadComposition();
  function persist(){
    try {
      sessionStorage.setItem(key,JSON.stringify(settings));
      sessionStorage.setItem(compositionKey(),JSON.stringify(elements));
    } catch {}
  }
  function notice(text){
    msg.className='message show warn';msg.textContent=text;
    const status=toolbar?.querySelector('[data-status]');
    if(status){status.hidden=false;status.textContent=text;}
  }
  function invalidate(){
    publishedHash='';
    window.TapTemplateStability?.invalidate('personalizzazione pagina');
  }
  function css(node,values){
    for(const [property,value] of Object.entries(values)) if(value!==undefined && value!==null) node.style.setProperty(property,String(value),'important');
  }
  function textTarget(node,id){
    if(id==='message') return node.querySelector('.messaggio')||node;
    if(id==='button') return node.querySelector('.testo-bottone,.button-text,.btn-text')||node;
    return node;
  }
  function readText(node,id){
    const target=textTarget(node,id);
    if(id==='button' && target===node) {
      const own=Array.from(node.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
      if(own) return own;
    }
    return target.textContent.trim();
  }
  function replaceText(node,id,value){
    const target=textTarget(node,id);
    if(id==='button' && target===node) {
      const nodes=Array.from(node.childNodes).filter(n=>n.nodeType===3 && n.textContent.trim());
      if(nodes.length){nodes[0].textContent=value;nodes.slice(1).forEach(n=>n.remove());}
      else {
        const label=node.ownerDocument.createElement('span');label.textContent=value;label.className='testo-bottone';node.appendChild(label);
      }
      node.setAttribute('aria-label',value);
    } else target.textContent=value;
  }
  function transform(html){
    if(!enabled()) return html;
    const doc=new DOMParser().parseFromString(html,'text/html');
    doc.querySelectorAll('script,[id^="tap-logo-solid"],#tap-manual-logo-style,#tap-page-editor-style').forEach(n=>n.remove());
    const style=doc.createElement('style');
    style.id='tap-page-editor-style';
    style.textContent='html,body{-webkit-text-size-adjust:100%;text-size-adjust:100%}[data-tap-page-element]{overflow-wrap:anywhere}';
    doc.head.appendChild(style);
    const logo=doc.getElementById('tapManualLogo')||doc.querySelector('img.logo,img#logo');
    if(logo && !window.tapLogoSkipped){
      if(!doc.querySelector('[data-tap-manual-slot]')){
        const slot=logo.cloneNode(true);
        slot.removeAttribute('id');slot.setAttribute('data-tap-manual-slot','');slot.setAttribute('aria-hidden','true');slot.alt='';
        css(slot,{visibility:'hidden','pointer-events':'none'});logo.replaceWith(slot);
      }
      logo.id='tapManualLogo';logo.className='tap-manual-logo';logo.removeAttribute('style');
      css(logo,{
        position:'fixed',left:settings.x+'vw',top:settings.y+'vh',right:'auto',bottom:'auto',
        width:'min('+settings.width+'vw,600px)',height:'auto','max-width':'95vw','max-height':'90vh','min-width':'0','min-height':'0',
        transform:'translateX(-50%)',margin:'0',padding:settings.surface==='none'?'0':'10px 14px',
        background:({none:'transparent',light:'#ffffff',dark:'#17212b'})[settings.surface]||'transparent',
        border:'0','border-radius':settings.surface==='none'?'0':'14px','box-sizing':'border-box','object-fit':'contain',
        'box-shadow':'none',filter:'none',opacity:'1','mix-blend-mode':'normal','z-index':'20',display:'block'
      });
      logo.dataset.tapPageElement='logo';doc.body.appendChild(logo);
    }
    if(window.tapLogoSkipped) doc.querySelectorAll('#tapManualLogo,img.logo,img#logo,[data-tap-manual-slot]').forEach(n=>n.remove());
    for(const [id,definition] of Object.entries(definitions)){
      if(id==='logo') continue;
      const node=doc.querySelector('[data-tap-page-element="'+id+'"]')||doc.querySelector(definition.selector);
      if(!node) continue;
      node.dataset.tapPageElement=id;
      const patch=elements[id],base=baselines[id];
      if(opening || !base || !patch || !Object.keys(patch).length) continue;
      if(!doc.querySelector('[data-tap-page-slot="'+id+'"]')){
        const slot=node.cloneNode(true);
        slot.removeAttribute('id');slot.removeAttribute('data-tap-page-element');
        slot.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
        slot.dataset.tapPageSlot=id;slot.setAttribute('aria-hidden','true');
        css(slot,{visibility:'hidden','pointer-events':'none'});node.replaceWith(slot);
      }
      const value={...base,...patch};
      if(patch.text!==undefined && (id==='caption'||id==='message')) css(node,{'white-space':'pre-line'});
      css(node,{
        position:'fixed',left:value.x+'vw',top:value.y+'vh',right:'auto',bottom:'auto',
        width:(id==='stars'?value.width*value.fontSize/base.fontSize:value.width)+'vw',height:id==='button'?value.height+'px':'auto',
        'max-width':'100vw','min-width':'0','max-height':'none','min-height':id==='button'?'0':base.minHeight,
        transform:'translateX(-50%)',margin:'0','box-sizing':'border-box','z-index':'21',
        'font-family':base.fontFamily,'font-size':value.fontSize+'px','font-weight':base.fontWeight,
        'line-height':base.lineHeight,'letter-spacing':base.letterSpacing,'text-transform':base.textTransform,
        'text-align':value.align,color:value.color
      });
      if(id==='message'){
        css(textTarget(node,id),{'font-size':value.fontSize+'px','font-family':base.fontFamily,'font-weight':base.fontWeight,'line-height':base.lineHeight,color:value.color,'text-align':value.align,'white-space':'pre-line'});
      }
      if(id==='button'){
        css(node,{'border-radius':value.radius+'px'});
        if(patch.background!==undefined) css(node,{background:patch.background});
        if(patch.color!==undefined) node.querySelectorAll('.testo-bottone,.button-text,.btn-text').forEach(n=>css(n,{color:patch.color}));
        if(patch.fontSize!==undefined) css(textTarget(node,id),{'font-size':value.fontSize+'px'});
      }
      if(id==='stars'){
        css(node,{'white-space':'nowrap'});
        if(patch.brightness!==undefined) css(node,{filter:'brightness('+value.brightness/100+')'});
        if(patch.color!==undefined) css(node,{'text-shadow':'0 0 8px '+value.color+',0 0 18px '+value.color+',0 3px 8px rgba(0,0,0,.35)'});
        node.querySelectorAll('span').forEach(n=>css(n,{'font-size':'inherit',color:value.color}));
      }
      if(patch.text!==undefined) replaceText(node,id,patch.text);
      doc.body.appendChild(node);
    }
    doc.documentElement.dataset.tapManualLogo='v2';
    doc.documentElement.dataset.tapPageEditor='v1';
    doc.documentElement.dataset.tapManualSettings=JSON.stringify({logo:settings,elements});
    doc.documentElement.dataset.tapManualViewport=JSON.stringify(referenceViewport);
    return '<!doctype html>\n'+doc.documentElement.outerHTML;
  }
  function output(){return transform(sourceHtml);}
  function render(){
    if(!frame || !sourceHtml) return;
    ready=false;frame.srcdoc=output();persist();
  }
  function change(){editing=true;invalidate();syncControls();render();}
  function commit(){
    if(!ready) return notice('Attendi il caricamento dell’anteprima.');
    editing=false;render();
    window.TapTemplateStability?.commitManualPreview(output());
    toolbar.dataset.preview='true';toolbar.querySelector('[data-status]').hidden=true;
    scheduleFit();
  }
  function scheduleFit(){cancelAnimationFrame(fitRequest);fitRequest=requestAnimationFrame(fitFrame);}
  function fitFrame(){
    const overlay=document.getElementById('tapPreviewOverlay');
    if(!stage || !frame || !referenceViewport || !overlay?.classList.contains('tap-manual-active') || !stage.clientHeight) return;
    const {width,height}=referenceViewport;
    const scale=Math.max(.01,Math.min((stage.clientWidth-8)/width,(stage.clientHeight-8)/height,1));
    frame.style.cssText='border:0;position:absolute;flex:none;max-width:none;max-height:none;min-width:0;min-height:0;background:#fff;transform-origin:0 0;';
    frame.style.width=width+'px';frame.style.height=height+'px';
    frame.style.left=((stage.clientWidth-width*scale)/2)+'px';frame.style.top=((stage.clientHeight-height*scale)/2)+'px';
    frame.style.transform='scale('+scale+')';
  }
  function restoreNativePreview(){
    const overlay=document.getElementById('tapPreviewOverlay');
    if(!stage || !overlay) return;
    overlay.classList.remove('tap-manual-active');toolbar.hidden=true;stage.hidden=true;
    overlay.insertBefore(frame,stage);frame.style.cssText=nativeFrameStyle;
    overlay.firstElementChild.style.display=nativeTopbarDisplay;
  }
  function nodeFor(id){return frame?.contentDocument?.querySelector('[data-tap-page-element="'+id+'"]');}
  function rectFor(node,id){
    if(id==='stars'){
      const range=node.ownerDocument.createRange();range.selectNodeContents(node);
      const r=range.getBoundingClientRect(),box=node.getBoundingClientRect();if(r.width && r.height) return {left:r.left,top:box.top,width:r.width,height:box.height,right:r.right,bottom:box.bottom};
    }
    return node.getBoundingClientRect();
  }
  function valueFor(id){return id==='logo'?settings:{...baselines[id],...elements[id]};}
  function setValues(values){
    if(values.width!==undefined){
      const half=(selected==='logo'?Math.min(values.width,600/referenceViewport.width*100):values.width)/2;
      values.x=Math.max(half,Math.min(100-half,valueFor(selected).x));
    }
    if(selected==='logo') Object.assign(settings,values);
    else elements[selected]={...elements[selected],...values};
    change();
  }
  function moveTo(id,left,top,width,height){
    const w=referenceViewport.width,h=referenceViewport.height;
    const values={
      x:Number(((Math.max(0,Math.min(Math.max(0,w-width),left))+width/2)/w*100).toFixed(3)),
      y:Number((Math.max(0,Math.min(Math.max(0,h-height),top))/h*100).toFixed(3))
    };
    if(id==='logo') Object.assign(settings,values);
    else elements[id]={...elements[id],...values};
  }
  function nudge(dx,dy){
    if(!ready) return;
    const node=nodeFor(selected);if(!node) return;
    const r=rectFor(node,selected);
    moveTo(selected,r.left+dx*referenceViewport.width/100,r.top+dy*referenceViewport.height/100,r.width,r.height);
    change();
  }
  function select(id){
    if(!nodeFor(id)) return;
    selected=id;
    if(toolbar.dataset.preview==='true'){editing=true;invalidate();toolbar.dataset.preview='false';}
    syncControls();markSelection();scheduleFit();
  }
  function markSelection(){
    const doc=frame?.contentDocument;if(!doc) return;
    doc.querySelectorAll('[data-tap-selected]').forEach(n=>n.removeAttribute('data-tap-selected'));
    if(editing) nodeFor(selected)?.setAttribute('data-tap-selected','');
  }
  function toHex(color,fallback='#ffffff'){
    const parts=String(color).match(/[\d.]+/g);
    if(parts?.length>=3) return '#'+parts.slice(0,3).map(v=>Math.max(0,Math.min(255,Math.round(Number(v)))).toString(16).padStart(2,'0')).join('');
    return /^#[0-9a-f]{6}$/i.test(color)?color:fallback;
  }
  function captureBaselines(doc){
    baselines={};
    for(const id of Object.keys(definitions)){
      const node=doc.querySelector('[data-tap-page-element="'+id+'"]');
      if(!node) continue;
      const r=rectFor(node,id);
      if(!r.width || !r.height) continue;
      const text=textTarget(node,id),style=frame.contentWindow.getComputedStyle(node),ts=frame.contentWindow.getComputedStyle(text);
      baselines[id]={
        x:(r.left+r.width/2)/referenceViewport.width*100,y:r.top/referenceViewport.height*100,
        width:r.width/referenceViewport.width*100,height:r.height,fontSize:parseFloat(ts.fontSize),
        fontFamily:ts.fontFamily,fontWeight:ts.fontWeight,lineHeight:ts.lineHeight==='normal'?'normal':String(parseFloat(ts.lineHeight)/parseFloat(ts.fontSize)),
        letterSpacing:ts.letterSpacing,textTransform:ts.textTransform,minHeight:style.minHeight,
        color:toHex(ts.color),align:ts.textAlign,text:readText(node,id),
        background:toHex(style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0]||style.backgroundColor,'#b66c27'),radius:parseFloat(style.borderTopLeftRadius)||0,
        brightness:122
      };
    }
  }
  function warnings(){
    const output=toolbar?.querySelector('[data-warning]');if(!output) return;
    const boxes=Object.keys(definitions).map(id=>({id,node:nodeFor(id)})).filter(v=>v.node && !v.node.hidden).map(v=>({...v,r:rectFor(v.node,v.id)})).filter(v=>v.r.width && v.r.height);
    const problems=[];
    for(const {id,r} of boxes){
      if(r.left<-.5 || r.top<-.5 || r.right>referenceViewport.width+.5 || r.bottom>referenceViewport.height+.5) problems.push(definitions[id].label+' fuori dalla pagina');
    }
    for(let i=0;i<boxes.length;i++) for(let j=i+1;j<boxes.length;j++){
      const a=boxes[i],b=boxes[j];
      if(Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left)>3 && Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top)>3) problems.push(definitions[a.id].label+' e '+definitions[b.id].label+' si sovrappongono');
    }
    output.hidden=!editing || !problems.length;output.textContent=problems.join(' · ');
  }


  function installToolbar(){
    const overlay=document.getElementById('tapPreviewOverlay');
    frame=document.getElementById('tapPreviewFrame');if(!overlay || !frame) return;
    if(!toolbar){
      nativeFrameStyle=frame.style.cssText;nativeTopbarDisplay=overlay.firstElementChild.style.display;
      const style=document.createElement('style');style.id='tap-manual-editor-ui';
      style.textContent=[
        '#tapPreviewOverlay.tap-manual-active{overflow:hidden;background:#10232a!important}',
        '#tapManualStage{position:relative;flex:1 1 0;min-height:0;min-width:0;overflow:hidden}',
        '#tapManualControls{flex:0 0 auto;box-sizing:border-box;width:100%;max-height:42%;overflow:auto;padding:7px 10px calc(7px + env(safe-area-inset-bottom));background:#eef7f4;color:#123d34;font:600 12px/1.2 Arial,Helvetica,sans-serif;display:grid;gap:5px;box-shadow:0 -2px 12px #0003}',
        '#tapManualControls *{box-sizing:border-box}#tapManualControls [hidden],#tapManualStage[hidden]{display:none!important}',
        '#tapManualControls label{margin:0;font:inherit;display:block}',
        '#tapManualControls button{margin:0;width:auto;min-width:0;min-height:32px;height:auto;padding:5px 7px;border:1px solid #a8c9bf;border-radius:7px;background:#fff;color:#123d34;font:700 12px/1.2 Arial,Helvetica,sans-serif;cursor:pointer;touch-action:manipulation;white-space:nowrap}',
        '#tapManualControls button:focus-visible{outline:3px solid #157861;outline-offset:1px}#tapManualControls button[aria-pressed=true]{background:#096b59;color:#fff;border-color:#096b59}',
        '#tapManualControls [data-select-row]{display:flex;gap:4px;overflow-x:auto;padding:1px}#tapManualControls [data-select-row] button{flex:1;font-size:11px}',
        '#tapManualControls [data-range-row]{display:grid;grid-template-columns:68px 1fr 38px;gap:6px;align-items:center;min-height:24px}',
        '#tapManualControls input[type=range]{width:100%;height:24px;margin:0;min-width:0;accent-color:#00866d}',
        '#tapManualControls [data-surface-row]{display:grid;grid-template-columns:68px repeat(3,1fr);gap:5px;align-items:center}',
        '#tapManualControls [data-position-row]{display:grid;grid-template-columns:repeat(4,1fr) 1.5fr 1.7fr;gap:5px}#tapManualControls [data-move]{font-size:18px;padding:2px}',
        '#tapManualControls [data-actions]{display:grid;grid-template-columns:1fr 1.65fr;gap:6px}#tapManualControls [data-save]{background:#096b59;color:#fff;border-color:#096b59;min-height:36px;white-space:normal}',
        '#tapManualControls [data-hint]{text-align:center;font-weight:400;font-size:11px}#tapManualControls [data-preview-heading],#tapManualControls [data-edit]{display:none}',
        '#tapManualControls [data-status],#tapManualControls [data-warning]{color:#7b5410;white-space:normal;font-size:11px}',
        '#tapManualControls [data-color-row]{display:flex;align-items:center;gap:8px;flex-wrap:wrap}#tapManualControls input[type=color]{width:32px;height:26px;padding:0;border:1px solid #a8c9bf;border-radius:4px}',
        '#tapManualControls [data-hex]{width:69px;height:26px;padding:3px;border:1px solid #a8c9bf;border-radius:4px;font:11px Arial;background:white;color:#123d34}#tapManualControls select{padding:4px;border:1px solid #a8c9bf;border-radius:5px;width:auto;max-width:110px;font:inherit;color:#123d34;background:white}',
        '#tapManualControls [data-text]{resize:vertical;display:block;width:100%;min-height:36px;max-height:62px;margin:3px 0 0;padding:5px 7px;border:1px solid #a8c9bf;border-radius:5px;font:13px/1.2 Arial;color:#123d34;background:white}',
        '#tapManualControls[data-preview=true]{grid-template-columns:1fr auto auto;align-items:center;gap:6px;padding-top:6px;padding-bottom:calc(6px + env(safe-area-inset-bottom))}',
        '#tapManualControls[data-preview=true] [data-edit-only],#tapManualControls[data-preview=true] [data-save]{display:none}#tapManualControls[data-preview=true] [data-preview-heading],#tapManualControls[data-preview=true] [data-edit]{display:block}',
        '#tapManualControls[data-preview=true] [data-actions]{display:contents}#tapManualControls[data-preview=true] [data-status]{grid-column:1/-1}',
        '@media(max-height:480px){#tapManualControls{max-height:48%;gap:3px;padding-top:4px;padding-bottom:4px}#tapManualControls [data-hint]{display:none}}'
      ].join('\n');
      document.head.appendChild(style);
      stage=document.createElement('div');stage.id='tapManualStage';overlay.insertBefore(stage,frame);stage.appendChild(frame);
      toolbar=document.createElement('div');toolbar.id='tapManualControls';
      const range=(name,label,min,max)=>'<div data-edit-only data-range-row data-row="'+name+'"><label for="tapPage-'+name+'">'+label+'</label><input id="tapPage-'+name+'" data-control="'+name+'" type="range" min="'+min+'" max="'+max+'" step="1"><output data-output="'+name+'"></output></div>';
      toolbar.innerHTML='<strong data-preview-heading>Anteprima salvata ✓</strong>'+
        '<div data-edit-only data-select-row>'+Object.entries(definitions).map(([id,d])=>'<button type="button" data-select="'+id+'">'+(id==='button'?'Pulsante':id==='message'?'Testo':d.label)+'</button>').join('')+'</div>'+
        '<label data-edit-only data-text-row><span data-text-label>Testo</span><textarea data-text aria-label="Testo elemento selezionato" rows="2" maxlength="4000"></textarea></label>'+
        range('width','Larghezza',10,95)+range('fontSize','Dimensione',10,72)+range('height','Altezza',32,120)+range('radius','Angoli',0,60)+range('brightness','Luminosità',50,200)+
        '<div data-edit-only data-color-row><label data-color-label for="tapPage-color">Colore</label><input id="tapPage-color" data-control="color" type="color" aria-label="Colore elemento"><input data-hex="color" aria-label="Codice colore elemento" maxlength="7"><label data-background-label for="tapPage-background">Sfondo</label><input id="tapPage-background" data-control="background" type="color" aria-label="Colore sfondo pulsante"><input data-hex="background" aria-label="Codice colore sfondo pulsante" maxlength="7"><label data-align-label for="tapPage-align">Allinea</label><select id="tapPage-align" data-control="align" aria-label="Allineamento testo"><option value="left">Sinistra</option><option value="center">Centro</option><option value="right">Destra</option></select></div>'+
        '<div data-edit-only data-surface-row><span>Sfondo</span><button type="button" data-surface="none">Nessuno</button><button type="button" data-surface="light">Chiaro</button><button type="button" data-surface="dark">Scuro</button></div>'+
        '<div data-edit-only data-position-row><button type="button" data-move="left">←</button><button type="button" data-move="right">→</button><button type="button" data-move="up">↑</button><button type="button" data-move="down">↓</button><button type="button" data-center>Centra</button><button type="button" data-reset>Ripristina</button></div>'+
        '<button type="button" data-edit>Modifica pagina</button><div data-actions><button type="button" data-edit-close>Torna</button><button type="button" data-save>Salva e visualizza anteprima</button></div>'+
        '<span data-edit-only data-hint>Tocca un elemento · trascinalo o usa le frecce</span><span data-edit-only data-warning role="status" hidden></span><span data-status role="status" hidden></span>';
      overlay.appendChild(toolbar);
      toolbar.querySelectorAll('[data-select]').forEach(b=>b.onclick=()=>select(b.dataset.select));
      toolbar.querySelectorAll('[data-control]').forEach(control=>control.addEventListener('input',e=>{
        if(!baselines[selected]) return;
        const name=e.target.dataset.control,value=e.target.type==='range'?Number(e.target.value):e.target.value;
        setValues({[name]:value});
      }));
      toolbar.querySelectorAll('[data-hex]').forEach(input=>input.addEventListener('input',()=>{const value=input.value.startsWith('#')?input.value:'#'+input.value;if(/^#[0-9a-f]{6}$/i.test(value) && baselines[selected]) setValues({[input.dataset.hex]:value});}));
      toolbar.querySelector('[data-text]').addEventListener('input',e=>{if(baselines[selected] && selected!=='logo') setValues({text:e.target.value});});
      toolbar.querySelectorAll('[data-surface]').forEach(b=>b.onclick=()=>setValues({surface:b.dataset.surface}));
      toolbar.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>nudge(...({left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]})[b.dataset.move]));
      toolbar.querySelector('[data-center]').onclick=()=>{if(ready) setValues({x:50});};
      toolbar.querySelector('[data-reset]').onclick=()=>{
        if(!ready) return;
        if(selected==='logo') settings={...defaults};else delete elements[selected];
        change();
      };
      toolbar.querySelector('[data-save]').onclick=commit;
      toolbar.querySelector('[data-edit]').onclick=()=>{editing=true;invalidate();toolbar.dataset.preview='false';syncControls();markSelection();warnings();scheduleFit();};
      toolbar.querySelector('[data-edit-close]').onclick=()=>{
        if(editing){notice('Salva prima le modifiche alla pagina.');return;}
        closeInlinePreview();
      };
      frame.addEventListener('load',installCanvas);
      new ResizeObserver(scheduleFit).observe(stage);
      window.addEventListener('resize',scheduleFit);window.visualViewport?.addEventListener('resize',scheduleFit);
    }
    overlay.classList.add('tap-manual-active');overlay.firstElementChild.style.display='none';
    stage.hidden=false;stage.appendChild(frame);toolbar.hidden=false;toolbar.dataset.preview='false';
    syncControls();fitFrame();render();
  }
  function syncControls(){
    if(!toolbar) return;
    const value=valueFor(selected)||{},isText=selected==='caption'||selected==='message';
    toolbar.querySelectorAll('[data-select]').forEach(b=>{b.hidden=!baselines[b.dataset.select];b.setAttribute('aria-pressed',String(b.dataset.select===selected));});
    const shown={width:selected!=='stars',fontSize:selected!=='logo',height:selected==='button',radius:selected==='button',brightness:selected==='stars'};
    for(const [name,show] of Object.entries(shown)){
      toolbar.querySelector('[data-row="'+name+'"]').hidden=!show;
      const control=toolbar.querySelector('[data-control="'+name+'"]');control.value=Math.round(value[name]??control.min);
      const unit=name==='width'||name==='brightness'?'%':'px';
      toolbar.querySelector('[data-output="'+name+'"]').textContent=Math.round(value[name]??0)+unit;
      control.setAttribute('aria-label',({width:selected==='logo'?'Dimensione':'Larghezza',fontSize:'Dimensione',height:'Altezza',radius:'Angoli',brightness:'Luminosità'})[name]+' '+definitions[selected].label.toLowerCase());
    }
    toolbar.querySelector('[data-row="width"] label').textContent=selected==='logo'?'Dimensione':'Larghezza';
    toolbar.querySelector('[data-text-row]').hidden=!(isText||selected==='button');
    const text=toolbar.querySelector('[data-text]');if(text!==document.activeElement) text.value=value.text??'';
    toolbar.querySelector('[data-color-row]').hidden=selected==='logo';
    toolbar.querySelector('[data-control="color"]').value=value.color||'#ffffff';
    toolbar.querySelector('[data-control="background"]').value=value.background||'#b66c27';
    toolbar.querySelectorAll('[data-hex]').forEach(input=>{if(input!==document.activeElement) input.value=value[input.dataset.hex]||'#ffffff';});
    toolbar.querySelector('[data-control="align"]').value=['left','center','right'].includes(value.align)?value.align:'center';
    for(const selector of ['[data-background-label]','[data-control="background"]','[data-hex="background"]']) toolbar.querySelector(selector).hidden=selected!=='button';
    for(const selector of ['[data-align-label]','[data-control="align"]']) toolbar.querySelector(selector).hidden=!isText;
    toolbar.querySelector('[data-surface-row]').hidden=selected!=='logo';
    toolbar.querySelectorAll('[data-surface]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.surface===settings.surface)));
    toolbar.querySelectorAll('[data-move]').forEach(b=>b.setAttribute('aria-label','Sposta '+definitions[selected].label.toLowerCase()+' '+({left:'a sinistra',right:'a destra',up:'in alto',down:'in basso'})[b.dataset.move]));
    toolbar.querySelector('[data-reset]').setAttribute('aria-label','Ripristina '+definitions[selected].label.toLowerCase());
    toolbar.querySelector('[data-status]').hidden=true;
  }
  async function installCanvas(){
    const epoch=++loadEpoch,doc=frame.contentDocument;if(!doc) return;
    await Promise.all(Array.from(doc.images).map(image=>image.decode().catch(()=>{})));
    await doc.fonts.ready;
    if(epoch!==loadEpoch || frame.contentDocument!==doc || !sourceHtml) return;
    if(needsBaseline){
      captureBaselines(doc);needsBaseline=false;
      if(!baselines[selected]) selected=baselines.logo?'logo':Object.keys(baselines)[0]||'caption';
      syncControls();render();return;
    }
    ready=true;
    const style=doc.createElement('style');style.dataset.tapEditorRuntime='';
    style.textContent='[data-tap-page-element]{touch-action:none!important;user-select:none!important;cursor:grab!important}[data-tap-selected]{outline:2px dashed #46efc6!important;outline-offset:3px!important}';
    doc.head.appendChild(style);
    doc.addEventListener('click',e=>{if(e.target.closest('a')) e.preventDefault();},true);
    for(const id of Object.keys(definitions)){
      const node=nodeFor(id);if(!node || !baselines[id]) continue;
      node.draggable=false;node.tabIndex=0;
      node.addEventListener('keydown',e=>{
        if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id);}
        const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
        if(directions[e.key]){e.preventDefault();select(id);nudge(...directions[e.key]);}
      });
      let drag=null;
      node.addEventListener('pointerdown',e=>{
        if(e.button!==0) return;
        select(id);
        const r=rectFor(node,id);drag={x:e.clientX,y:e.clientY,left:r.left,top:r.top,w:r.width,h:r.height,moved:false};
        node.setPointerCapture(e.pointerId);e.preventDefault();
      });
      node.addEventListener('pointermove',e=>{
        if(!drag || Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<3) return;
        drag.moved=true;editing=true;
        moveTo(id,drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y,drag.w,drag.h);
        if(id!=='logo' && node.style.position!=='fixed'){
          const slot=node.cloneNode(true);slot.removeAttribute('id');slot.removeAttribute('data-tap-page-element');slot.removeAttribute('data-tap-selected');slot.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));slot.setAttribute('aria-hidden','true');css(slot,{visibility:'hidden','pointer-events':'none'});node.replaceWith(slot);
          css(node,{position:'fixed',width:drag.w+'px',height:drag.h+'px',margin:'0',right:'auto',bottom:'auto',transform:'translateX(-50%)','z-index':'21'});
          doc.body.appendChild(node);node.setPointerCapture(e.pointerId);
        }
        const value=valueFor(id);css(node,{left:value.x+'vw',top:value.y+'vh'});
      });
      const finish=()=>{if(!drag) return;const moved=drag.moved;drag=null;if(moved){invalidate();syncControls();render();}};
      node.addEventListener('pointerup',finish);node.addEventListener('pointercancel',finish);
    }
    syncControls();markSelection();warnings();scheduleFit();
  }
  const baseOpen=openInlinePreview;
  openInlinePreview=function(html){
    if(!enabled()){restoreNativePreview();return baseOpen(html);}
    baselines={};ready=false;needsBaseline=true;sourceHtml=html;editing=true;opening=true;
    try{baseOpen(html);}finally{opening=false;}
    sourceHtml=document.getElementById('tapPreviewFrame')?.srcdoc||html;
    if(!referenceViewport){
      const overlay=document.getElementById('tapPreviewOverlay');referenceViewport={width:overlay.clientWidth,height:overlay.clientHeight};
      try{sessionStorage.setItem(key+':viewport',JSON.stringify(referenceViewport));}catch{}
    }
    installToolbar();
  };

  async function publish() {
    if (publishing) return;
    const check=window.TapTemplateStability?.validateForGenerate();
    if (!check?.ok || editing) return notice(check?.message || 'Salva prima le modifiche alla pagina.');
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
  activity.addEventListener('change',()=>{publishedHash='';sourceHtml='';baselines={};loadComposition();});
  document.getElementById('logoFile').addEventListener('change',()=>{
    settings={...defaults};persist();publishedHash='';
    referenceViewport=null;
    try { sessionStorage.removeItem(key + ':viewport'); } catch {}
    try { logoDataUrl=''; } catch {}
  });
  window.addEventListener('tap-logo-archive-selected',()=>{publishedHash='';});
  previewButton.textContent='Personalizza pagina e anteprima';
  window.TapManualLogoEditor=Object.freeze({
    enabled,transform,getSettings:()=>({...settings,elements:JSON.parse(JSON.stringify(elements)),viewport:referenceViewport && {...referenceViewport}}),
    isEditing:()=>editing
  });
})();

