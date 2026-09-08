(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;
  const params = new URLSearchParams(location.search);
  if (params.get('prospect') !== '1') return;

  const SUPABASE_URL='https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY='tapnfc_supabase_session_v1';

  function getSession(){
    for(const storage of [sessionStorage,localStorage]){
      try{const s=JSON.parse(storage.getItem(SESSION_KEY)||'null');if(s?.access_token)return s;}catch{}
    }
    return null;
  }

  function getOperator(){
    return document.body.dataset.tapOperator || document.querySelector('[data-operator-name], .user-pill')?.textContent?.trim() || 'Francesco';
  }

  function categoryLabel(select){
    if(!select || select.selectedIndex < 0) return '';
    return select.options[select.selectedIndex]?.text || '';
  }

  function install(){
    const addBtn=document.getElementById('addClientBtn');
    const type=document.getElementById('activityType');
    const msg=document.getElementById('msg');
    const finalValue=document.getElementById('finalLinkValue');
    if(!addBtn || !type || !finalValue) return;

    document.querySelector('.eyebrow')?.replaceChildren(document.createTextNode('Potenziale cliente'));
    addBtn.textContent='Salva potenziale';
    addBtn.setAttribute('aria-label','Salva potenziale cliente');

    addBtn.addEventListener('click', async (event)=>{
      event.preventDefault();
      event.stopImmediatePropagation();

      const business=(params.get('business')||'').trim();
      const placeId=(params.get('placeid')||'').trim();
      const standard=(params.get('reviewurl')||('https://search.google.com/local/writereview?placeid='+placeId)).trim();
      const personalized=(finalValue.textContent||'').trim();
      const categoryCode=(type.value||'').trim();
      const category=categoryLabel(type);

      if(!business || !placeId){
        if(msg){msg.className='message show warn';msg.textContent='Nome attività o Place ID mancanti.';}
        return;
      }
      if(!categoryCode){
        if(msg){msg.className='message show warn';msg.textContent='Seleziona prima una categoria.';}
        return;
      }
      if(categoryCode !== 'standard' && !personalized){
        if(msg){msg.className='message show warn';msg.textContent='Genera prima il link finale personalizzato.';}
        return;
      }

      const session=getSession();
      if(!session?.access_token){
        if(msg){msg.className='message show warn';msg.textContent='Sessione scaduta. Accedi di nuovo.';}
        return;
      }

      addBtn.disabled=true;
      addBtn.textContent='Salvataggio…';

      try{
        const payload={
          nome:business,
          operatore:getOperator(),
          categoria:category,
          categoria_codice:categoryCode,
          place_id:placeId,
          link_standard:standard,
          link_personalizzato:categoryCode==='standard' ? standard : personalized,
          stato:'Da visitare',
          personalizzazione:{categoria_codice:categoryCode}
        };
        const r=await fetch(SUPABASE_URL+'/rest/v1/potenziali_clienti',{
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            'apikey':PUBLISHABLE_KEY,
            'Authorization':'Bearer '+session.access_token,
            'Prefer':'return=representation'
          },
          body:JSON.stringify(payload)
        });
        const data=await r.json().catch(()=>null);
        if(!r.ok) throw new Error(data?.message||data?.details||'Salvataggio non riuscito');
        addBtn.textContent='Potenziale salvato ✓';
        if(msg){msg.className='message show ok';msg.textContent='Potenziale salvato con versione standard e personalizzata.';}
        setTimeout(()=>{location.href='potenziali.html';},900);
      }catch(err){
        console.error('[Prospect save]',err);
        addBtn.disabled=false;
        addBtn.textContent='Salva potenziale';
        if(msg){msg.className='message show warn';msg.textContent='Non riesco a salvare il potenziale: '+err.message;}
      }
    }, true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true}); else install();
})();
