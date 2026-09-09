(() => {
  'use strict';
  const page = location.pathname.split('/').pop() || 'index.html';
  const managed = new Set(['index.html','personalizza.html','personalizza-potenziale.html','potenziali.html','clienti.html','risultati.html','chat.html']);
  if (!managed.has(page)) return;

  function prospectItem(){
    const a=document.createElement('a');
    a.className='tap-global-nav-item tap-prospects';
    a.href='potenziali.html';
    if(page==='potenziali.html') a.setAttribute('aria-current','page');
    a.innerHTML='<span class="tap-global-nav-ico" aria-hidden="true">◇</span><span>Potenziali</span>';
    return a;
  }

  function buildNavIfNeeded(){
    let nav=document.querySelector('.tap-global-bottom-nav');
    if(nav) return nav;
    if(page!=='potenziali.html' || !document.body) return null;
    nav=document.createElement('nav');
    nav.className='tap-global-bottom-nav';
    nav.setAttribute('aria-label','Navigazione principale');
    const items=[
      ['index.html','⌂','Home',''],
      ['index.html#nuovo','＋','Nuovo','tap-new'],
      ['potenziali.html','◇','Potenziali','tap-prospects'],
      ['clienti.html','◎','Clienti',''],
      ['risultati.html','▥','Risultati','']
    ];
    nav.innerHTML=items.map(([href,ico,label,extra])=>`<a class="tap-global-nav-item ${extra}" href="${href}" ${href==='potenziali.html'?'aria-current="page"':''}><span class="tap-global-nav-ico" aria-hidden="true">${ico}</span><span>${label}</span></a>`).join('');
    document.body.appendChild(nav);
    return nav;
  }

  function install(){
    const nav=buildNavIfNeeded();
    if(!nav) return false;
    if(!nav.querySelector('.tap-prospects')){
      const clientLink=[...nav.querySelectorAll('.tap-global-nav-item')].find(a=>a.getAttribute('href')==='clienti.html');
      nav.insertBefore(prospectItem(),clientLink || null);
    }
    if(page==='potenziali.html'){
      nav.querySelectorAll('[aria-current="page"]').forEach(el=>el.removeAttribute('aria-current'));
      nav.querySelector('.tap-prospects')?.setAttribute('aria-current','page');
    }
    if(!document.getElementById('tapProspectsNavStyle')){
      const style=document.createElement('style');
      style.id='tapProspectsNavStyle';
      style.textContent='@media(max-width:820px){.tap-global-bottom-nav{grid-template-columns:repeat(5,1fr)!important}.tap-global-nav-item{font-size:8px!important}.tap-global-nav-ico{font-size:18px!important}} .tap-prospect-edit-row{display:flex;gap:8px;margin-top:12px}.tap-prospect-edit{height:38px;padding:0 14px;border:0;border-radius:11px;background:#0b4fc2;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;box-shadow:0 8px 18px rgba(11,79,194,.16)}';
      document.head.appendChild(style);
    }
    return true;
  }

  function buildEditUrl(p, autoPreview=false){
    const q=new URLSearchParams();
    q.set('edit',p.id);
    q.set('business',p.nome||'');
    if(p.place_id) q.set('placeid',p.place_id);
    if(p.link_standard) q.set('reviewurl',p.link_standard);
    if(p.categoria_codice) q.set('category',p.categoria_codice);
    if(p.link_personalizzato) q.set('customlink',p.link_personalizzato);
    if(p.stato) q.set('state',p.stato);
    if(autoPreview) q.set('preview','1');
    return 'personalizza-potenziale.html?'+q.toString();
  }

  async function enhanceProspectCards(){
    if(page!=='potenziali.html' || !window.TapNfc?.rest) return;
    try{
      const r=await window.TapNfc.rest('potenziali_clienti?select=id,nome,categoria_codice,place_id,link_standard,link_personalizzato,stato&order=created_at.desc');
      if(!r.ok) return;
      const rows=await r.json();
      const byName=new Map((rows||[]).map(p=>[String(p.nome||'').trim().toLowerCase(),p]));
      let tries=0;
      const timer=setInterval(()=>{
        tries++;
        let changed=false;
        document.querySelectorAll('#list .card').forEach(card=>{
          if(card.dataset.tapProspectEnhanced==='1') return;
          const name=String(card.querySelector('.name')?.textContent||'').trim().toLowerCase();
          const p=byName.get(name);
          if(!p) return;
          const linkboxes=card.querySelectorAll('.linkbox');
          if(linkboxes[1]){
            const preview=linkboxes[1].querySelector('a.mini');
            if(preview){preview.href=buildEditUrl(p,true);preview.removeAttribute('target');preview.removeAttribute('rel');}
          }
          const row=document.createElement('div');
          row.className='tap-prospect-edit-row';
          row.innerHTML=`<a class="tap-prospect-edit" href="${buildEditUrl(p,false)}">✎ Modifica potenziale</a>`;
          card.appendChild(row);
          card.dataset.tapProspectEnhanced='1';
          changed=true;
        });
        const cards=document.querySelectorAll('#list .card').length;
        const enhanced=document.querySelectorAll('#list .card[data-tap-prospect-enhanced="1"]').length;
        if((cards && cards===enhanced)||tries>60) clearInterval(timer);
      },100);
    }catch(e){console.warn('[Potenziali edit]',e);}
  }

  function boot(){
    if(!install()){
      let tries=0;
      const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer);},50);
    }
    enhanceProspectCards();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
