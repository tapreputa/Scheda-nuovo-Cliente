(() => {
  'use strict';
  const page = location.pathname.split('/').pop() || 'index.html';
  const managed = new Set(['index.html','personalizza.html','potenziali.html','clienti.html','risultati.html','chat.html']);
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
      style.textContent='@media(max-width:820px){.tap-global-bottom-nav{grid-template-columns:repeat(5,1fr)!important}.tap-global-nav-item{font-size:8px!important}.tap-global-nav-ico{font-size:18px!important}}';
      document.head.appendChild(style);
    }
    return true;
  }

  function boot(){
    if(install()) return;
    let tries=0;
    const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer);},50);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
