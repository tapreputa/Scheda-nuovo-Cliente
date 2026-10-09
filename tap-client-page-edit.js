(() => {
  'use strict';
  if(!location.pathname.endsWith('/personalizza.html')) return;
  const params=new URLSearchParams(location.search),potential=!params.has('client')&&params.has('potential'),id=params.get(potential?'potential':'client');
  if(!id) return;
  if(potential && document.getElementById('activityType').value==='standard') return;
  const activity=document.getElementById('activityType'),preview=document.getElementById('previewBtn'),saveButton=document.getElementById('generateBtn'),add=document.getElementById('addClientBtn'),msg=document.getElementById('msg');
  let client=null,slug='',savedHtml='',busy=false,loaded=false,existingManual=false,logoRemoved=false;
  function pageLogo(doc){return doc.getElementById('tapManualLogo')||doc.querySelector('img.logo:not([data-tap-manual-slot]),img#logo');}
  function notice(text,error=false){msg.className='message show '+(error?'warn':'ok');msg.textContent=text;}
  function hideAdd(){add.hidden=true;add.style.setProperty('display','none','important');}
  hideAdd();activity.disabled=true;saveButton.disabled=true;preview.disabled=true;
  document.getElementById('tapCategorySearch')?.setAttribute('disabled','');
  document.getElementById('logoFile').addEventListener('change',()=>{logoRemoved=false;});
  document.querySelector('[data-logo-remove]')?.addEventListener('click',()=>{logoRemoved=true;window.tapLogoSkipped=true;TapTemplateStability.invalidate('logo rimosso');});
  const label=potential?'potenziale':'cliente';
  saveButton.textContent='Salva modifiche '+label;preview.textContent='Modifica pagina e anteprima';
  document.querySelector('h1').textContent='Modifica '+label;
  document.querySelector('main .eyebrow').textContent=potential?'POTENZIALE ESISTENTE':'CLIENTE ESISTENTE';
  document.getElementById('backBtn').onclick=()=>location.href=(potential?'potenziali':'clienti')+'.html?open='+encodeURIComponent(id);
  document.querySelectorAll('.steps,.tap-progress').forEach(n=>n.style.setProperty('display','none','important'));
  const logoState=document.querySelector('.tap-logo-state');
  TapTemplateStability.invalidate('apertura pagina esistente');
  notice('Caricamento della pagina del '+label+'…');
  async function rows(response){const data=await response.json();if(!response.ok)throw Error(data.message||'Operazione non riuscita.');return data;}
  function setLogo(value){try{logoDataUrl=value;}catch{window.logoDataUrl=value;}const img=document.getElementById('logoPreviewImg');img.src=value;document.getElementById('logoPreview').classList.toggle('show',!!value);document.getElementById('logoName').textContent=value?'Logo attuale del '+label:'';window.tapLogoSkipped=!value;if(logoState)logoState.textContent=value?'Logo salvato':'Proseguimento senza logo';}
  async function legacyHtml(){
    const f=document.createElement('iframe');f.title='Caricamento pagina esistente';f.style.cssText='position:fixed;left:-10000px;top:0;border:0;width:'+Math.max(200,Math.min(480,document.documentElement.clientWidth))+'px;height:'+Math.max(568,Math.min(900,innerHeight))+'px;';
    f.src=(potential?'demo.html?t='+encodeURIComponent(client.preview_token):'cliente.html?c='+encodeURIComponent(slug))+'&preview=1&v=20261009-potential-editor1';document.body.appendChild(f);
    try{
      await new Promise((resolve,reject)=>{const start=Date.now();const timer=setInterval(()=>{const doc=f.contentDocument,page=doc?.getElementById('page'),error=doc?.getElementById('error')?.textContent;if(error||Date.now()-start>20000){clearInterval(timer);reject(Error(error||'Caricamento non riuscito. Riapri Modifica.'));}else if(page&&!page.classList.contains('hidden')){clearInterval(timer);resolve();}},80);});
      const doc=f.contentDocument;await Promise.all([...doc.images].map(img=>img.decode().catch(()=>{})));await doc.fonts.ready;
      const clone=doc.documentElement.cloneNode(true);clone.querySelectorAll('script,#loading').forEach(n=>n.remove());
      const base=doc.createElement('base');base.href=new URL('.',document.baseURI).href;clone.querySelector('head').prepend(base);
      // Move the legacy photograph to the body so the public viewer can fill
      // the screen while preserving the foreground's reference dimensions.
      const page=clone.querySelector('#page'),body=clone.querySelector('body');
      body.style.backgroundImage=page.style.backgroundImage;body.style.backgroundSize='cover';body.style.backgroundPosition='center top';
      page.style.setProperty('background-image','none','important');page.style.setProperty('background-color','transparent','important');
      clone.dataset.tapManualViewport=JSON.stringify({width:f.clientWidth,height:f.clientHeight});
      const logo=clone.querySelector('img#logo');setLogo(logo?.classList.contains('show')?logo.src:'');
      return '<!doctype html>\n'+clone.outerHTML;
    }finally{f.remove();}
  }
  async function open(){
    if(!loaded||busy)return;
    try{
      if(window.TapLogoAutocrop)await TapLogoAutocrop.whenReady();
      let html=TapManualLogoEditor.getDraft()||savedHtml;
      const doc=new DOMParser().parseFromString(html,'text/html');
      const file=document.getElementById('logoFile').files?.[0];
      if(file){
        const processed=window.TapLogoAutocrop?.getProcessedLogo();
        const value=processed||await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Impossibile leggere il logo.'));reader.readAsDataURL(file);});setLogo(value);
        let logo=pageLogo(doc);
        if(!logo){logo=doc.createElement('img');logo.id='tapManualLogo';logo.alt='Logo attività';logo.style.cssText='position:fixed;left:50vw;top:3vh;width:55vw;height:auto;transform:translateX(-50%);z-index:20';doc.body.appendChild(logo);}
        logo.src=value;logo.classList.add('show');logo.classList.remove('hidden');logo.style.setProperty('display','block','important');
      }
      if(logoRemoved||window.tapLogoSkipped)doc.querySelectorAll('#tapManualLogo,img.logo,img#logo,[data-tap-manual-slot]').forEach(n=>n.remove());
      TapManualLogoEditor.openSaved('<!doctype html>\n'+doc.documentElement.outerHTML);
    }catch(error){notice(error.message,true);}
  }
  async function save(){
    if(!loaded||busy)return;
    const check=TapTemplateStability.validateForGenerate();
    if(!check.ok||!check.snapshot||TapManualLogoEditor.isEditing())return notice(check.message||'Salva prima le regolazioni nell’anteprima.',true);
    busy=true;saveButton.disabled=true;
    try{
      const html=check.snapshot.html,doc=new DOMParser().parseFromString(html,'text/html');
      const logo=pageLogo(doc)?.getAttribute('src')||null;
      const data=await rows(await TapNfc.rest('rpc/save_'+(potential?'potential':'client')+'_page_composition',{method:'POST',body:JSON.stringify({[potential?'p_potential_id':'p_client_id']:client.id,p_html:html,p_logo_data:logo,p_expected_html:existingManual?savedHtml:null})}));
      const result=Array.isArray(data)?data[0]:data;if(!result?.link_nfc||result.link_nfc!==client.link_nfc)throw Error('Il salvataggio non ha confermato il link del '+label+'.');
      savedHtml=html;existingManual=true;finalNfcUrl=client.link_nfc;document.getElementById('finalLinkValue').textContent=client.link_nfc;document.getElementById('finalLinkBox').classList.add('show');TapTemplateStability.bindGeneratedLink(client.link_nfc);hideAdd();notice('Modifiche salvate. La pagina del '+label+' è aggiornata sullo stesso link.');
    }catch(error){notice('Modifiche non salvate: '+error.message,true);}finally{busy=false;saveButton.disabled=false;}
  }
  window.TapClientPageEdit=Object.freeze({active:()=>true,save});
  document.addEventListener('click',event=>{
    if(event.target.closest('#previewBtn')){event.preventDefault();event.stopImmediatePropagation();open();}
    if(event.target.closest('#addClientBtn')){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  (async()=>{
    try{
      if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('Scheda non valida.');
      const user=await TapNfc.getUser();
      client=potential?await TapNfc.getPotential(id):(await rows(await TapNfc.rest('clienti?select=*&id=eq.'+encodeURIComponent(id)+'&limit=1')))[0];
      if(!client||client.created_by!==user?.id)throw Error('Solo l’operatore proprietario può modificare questo '+label+'.');
      if(client.categoria_codice==='standard')throw Error('Questo cliente usa il collegamento diretto a Google e non ha una pagina da personalizzare.');
      slug=new URL(client.link_nfc).searchParams.get('c')||'';if(!/^[a-z0-9-]{1,80}$/.test(slug))throw Error('Link personalizzato non valido.');
      activity.value=window.TapCategories?.normalizeId(client.categoria_codice)||client.categoria_codice;document.getElementById('destinationUrl').value=client.link_recensioni;
      if(!activity.value)throw Error('Categoria del '+label+' non disponibile.');
      if(potential)window.TapPotentialEdit=client;
      const saved=await rows(await TapNfc.rest('manual_logo_pages?select=html&slug=eq.'+encodeURIComponent(slug)+'&limit=1'));
      if(saved[0]?.html){existingManual=true;savedHtml=saved[0].html;const doc=new DOMParser().parseFromString(savedHtml,'text/html');setLogo(pageLogo(doc)?.getAttribute('src')||'');}
      else savedHtml=await legacyHtml();
      activity.disabled=true;preview.disabled=false;saveButton.disabled=false;preview.classList.add('show');loaded=true;
      notice('Pagina di '+client.nome+' caricata. Apri l’editor per modificare logo, didascalia, testi, stelle e pulsante.');
    }catch(error){notice(error.message,true);}
  })();
})();

