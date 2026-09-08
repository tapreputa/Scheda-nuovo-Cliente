(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'nuovo-potenziale.html') return;

  const SUPABASE_URL='https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY='sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY='tapnfc_supabase_session_v1';
  const FUNCTION_NAME='google-places-autocomplete';
  const input=document.getElementById('prospectSearch');
  const results=document.getElementById('prospectResults');
  const state=document.getElementById('prospectState');
  const nameBox=document.getElementById('selectedName');
  const placeBox=document.getElementById('selectedPlace');
  const continueBtn=document.getElementById('continueProspect');
  const msg=document.getElementById('prospectMsg');
  let timer=0, requestSeq=0, selected=null, lastQuery='';
  const cache=new Map();

  function getSession(){
    for(const storage of [sessionStorage,localStorage]){
      try{const s=JSON.parse(storage.getItem(SESSION_KEY)||'null');if(s?.access_token)return s;}catch{}
    }
    return null;
  }
  function setState(text,type='') { state.className='state'+(type?' '+type:''); state.textContent=text; }
  function clearResults(){results.innerHTML='';results.classList.remove('open');}
  function showMessage(text){msg.className='message show warn';msg.textContent=text;}
  function selectItem(item){
    selected=item;
    input.value=item.text||item.mainText||'';
    nameBox.textContent=item.mainText||item.text||'Attività';
    placeBox.textContent=item.placeId||'—';
    continueBtn.disabled=!item.placeId;
    clearResults();
    setState('✓ Attività selezionata','ok');
    msg.className='message';msg.textContent='';
  }
  function render(items){
    clearResults();
    if(!Array.isArray(items)||!items.length)return;
    for(const item of items){
      const b=document.createElement('button');
      b.type='button';b.className='option';
      b.innerHTML='<span class="main"></span><span class="secondary"></span>';
      b.querySelector('.main').textContent=item.mainText||item.text||'Attività';
      b.querySelector('.secondary').textContent=item.secondaryText||item.text||'';
      b.addEventListener('click',()=>selectItem(item));
      results.appendChild(b);
    }
    results.classList.add('open');
  }
  async function searchPlaces(query){
    const key=query.toLowerCase();
    const cached=cache.get(key);
    if(cached && Date.now()-cached.time<600000) return cached.items;
    const session=getSession();
    if(!session?.access_token) throw new Error('Sessione scaduta');
    const r=await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`,{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':PUBLISHABLE_KEY,'Authorization':'Bearer '+session.access_token},
      body:JSON.stringify({input:query})
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data?.error||'Ricerca Google non disponibile');
    const items=Array.isArray(data?.suggestions)?data.suggestions:[];
    cache.set(key,{time:Date.now(),items});
    return items;
  }

  input.addEventListener('input',()=>{
    clearTimeout(timer);selected=null;continueBtn.disabled=true;nameBox.textContent='Nessuna attività selezionata';placeBox.textContent='—';clearResults();
    const q=input.value.trim();
    if(q.length<6){setState('Scrivi almeno 6 caratteri per cercare.','');return;}
    const seq=++requestSeq;
    setState('Ricerca in corso…','');
    timer=setTimeout(async()=>{
      try{
        if(q===lastQuery && cache.has(q.toLowerCase())){
          const items=cache.get(q.toLowerCase()).items; if(seq!==requestSeq)return; render(items); setState(items.length?'Seleziona l’attività corretta.':'Nessun risultato trovato.',items.length?'ok':'warn'); return;
        }
        lastQuery=q;
        const items=await searchPlaces(q);
        if(seq!==requestSeq)return;
        render(items);
        setState(items.length?'Seleziona l’attività corretta.':'Nessun risultato trovato. Prova ad aggiungere città o indirizzo.',items.length?'ok':'warn');
      }catch(err){
        console.warn('[Nuovo potenziale Places]',err);
        if(seq!==requestSeq)return;
        clearResults();setState('Ricerca Google non disponibile. Riprova o torna indietro.','warn');
      }
    },850);
  });

  continueBtn.addEventListener('click',()=>{
    if(!selected?.placeId) return showMessage('Seleziona prima un’attività dai risultati Google.');
    const p=new URLSearchParams();
    p.set('reviewurl','https://search.google.com/local/writereview?placeid='+selected.placeId);
    p.set('business',selected.mainText||selected.text||'');
    p.set('placeid',selected.placeId);
    location.href='personalizza-potenziale.html?'+p.toString();
  });

  document.addEventListener('click',e=>{if(e.target!==input&&!results.contains(e.target))results.classList.remove('open');});
})();
