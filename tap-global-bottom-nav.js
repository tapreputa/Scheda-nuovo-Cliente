(() => {
  'use strict';
  const page = location.pathname.split('/').pop() || 'index.html';
  const allowed = new Set(['index.html','personalizza.html','clienti.html','risultati.html','chat.html','potenziali.html','nuovo-potenziale.html']);
  if (!allowed.has(page)) return;

  function ensureCss(){
    if (document.querySelector('link[data-tap-global-bottom-nav]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='tap-global-bottom-nav.css?v=2';
    link.dataset.tapGlobalBottomNav='1';
    document.head.appendChild(link);
  }

  function ensureResultsCss(){
    if (page!=='risultati.html' || document.querySelector('link[data-tap-results-modern]')) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href='tap-risultati-modern.css?v=1';
    link.dataset.tapResultsModern='1';
    document.head.appendChild(link);
  }

  function ensureProspectSave(){
    if(page!=='personalizza.html') return;
    const p=new URLSearchParams(location.search);
    if(p.get('prospect')!=='1' || document.querySelector('script[data-tap-prospect-save]')) return;
    const s=document.createElement('script');
    s.src='tap-prospect-save.js?v=1';
    s.dataset.tapProspectSave='1';
    document.head.appendChild(s);
  }

  function currentFor(target){
    if (target==='home') return page==='index.html' && location.hash!=='#nuovo';
    if (target==='new') return page==='personalizza.html' || page==='nuovo-potenziale.html' || (page==='index.html' && location.hash==='#nuovo');
    if (target==='clients') return page==='clienti.html';
    if (target==='results') return page==='risultati.html';
    return false;
  }

  function installNav(){
    if (!document.body || document.querySelector('.tap-global-bottom-nav')) return;
    ensureCss();
    const nav=document.createElement('nav');
    nav.className='tap-global-bottom-nav';
    nav.setAttribute('aria-label','Navigazione principale');
    const items=[
      ['home','index.html','⌂','Home',''],
      ['new',page==='index.html'?'#nuovo':'index.html#nuovo','＋','Nuovo','tap-new'],
      ['clients','clienti.html','◎','Clienti',''],
      ['results','risultati.html','▥','Risultati','']
    ];
    nav.innerHTML=items.map(([key,href,ico,label,extra])=>`<a class="tap-global-nav-item ${extra}" href="${href}" ${currentFor(key)?'aria-current="page"':''}><span class="tap-global-nav-ico" aria-hidden="true">${ico}</span><span>${label}</span></a>`).join('');
    document.body.appendChild(nav);

    if (page==='index.html') {
      const newLink=nav.querySelector('.tap-new');
      newLink?.addEventListener('click',()=>{
        nav.querySelectorAll('[aria-current="page"]').forEach(el=>el.removeAttribute('aria-current'));
        newLink.setAttribute('aria-current','page');
      });
      window.addEventListener('hashchange',()=>{
        nav.querySelectorAll('[aria-current="page"]').forEach(el=>el.removeAttribute('aria-current'));
        const selector=location.hash==='#nuovo'?'.tap-new':'.tap-global-nav-item:first-child';
        nav.querySelector(selector)?.setAttribute('aria-current','page');
      });
    }
  }

  function installHomeMotion(){
    if (page!=='index.html' || document.getElementById('tapHomeCinematicMotion')) return;
    const grid=document.querySelector('.quick-grid');
    if (!grid) return;
    grid.classList.add('tap-cinematic-actions');
    const style=document.createElement('style');
    style.id='tapHomeCinematicMotion';
    style.textContent=`
      .tap-cinematic-actions{position:relative;isolation:isolate}
      .tap-cinematic-actions .quick-card{position:relative;overflow:hidden;isolation:isolate;transform:translateZ(0);will-change:transform,box-shadow;animation:tapActionOrbit 6.6s cubic-bezier(.22,.75,.24,1) infinite}
      .tap-cinematic-actions .quick-card:nth-child(1){animation-delay:0s}
      .tap-cinematic-actions .quick-card:nth-child(2){animation-delay:2.2s}
      .tap-cinematic-actions .quick-card:nth-child(3){animation-delay:4.4s}
      .tap-cinematic-actions .quick-card::before{content:"";position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;z-index:-1;opacity:0;background:conic-gradient(from 0deg,transparent 0 68%,rgba(23,105,255,.05) 72%,rgba(23,105,255,.78) 79%,rgba(244,201,93,.92) 84%,transparent 91%);filter:blur(.2px);animation:tapActionRing 6.6s linear infinite}
      .tap-cinematic-actions .quick-card:nth-child(1)::before{animation-delay:0s}.tap-cinematic-actions .quick-card:nth-child(2)::before{animation-delay:2.2s}.tap-cinematic-actions .quick-card:nth-child(3)::before{animation-delay:4.4s}
      .tap-cinematic-actions .quick-card::after{content:"";position:absolute;top:-45%;bottom:-45%;width:46%;left:-75%;pointer-events:none;z-index:5;opacity:0;background:linear-gradient(105deg,transparent,rgba(255,255,255,.58),rgba(137,190,255,.34),transparent);transform:skewX(-18deg);animation:tapActionSweep 6.6s ease-in-out infinite}
      .tap-cinematic-actions .quick-card:nth-child(1)::after{animation-delay:0s}.tap-cinematic-actions .quick-card:nth-child(2)::after{animation-delay:2.2s}.tap-cinematic-actions .quick-card:nth-child(3)::after{animation-delay:4.4s}
      .tap-cinematic-actions .quick-icon{position:relative;z-index:2;transform-origin:50% 50%;animation:tapIconPulse 6.6s cubic-bezier(.22,.75,.24,1) infinite}
      .tap-cinematic-actions .quick-card:nth-child(1) .quick-icon{animation-delay:0s}.tap-cinematic-actions .quick-card:nth-child(2) .quick-icon{animation-delay:2.2s}.tap-cinematic-actions .quick-card:nth-child(3) .quick-icon{animation-delay:4.4s}
      @keyframes tapActionOrbit{0%,7%,100%{transform:translateY(0) scale(1);box-shadow:0 12px 30px rgba(20,42,74,.07)}12%{transform:translateY(-7px) scale(1.018);box-shadow:0 24px 50px rgba(23,105,255,.20),0 0 0 1px rgba(212,163,40,.25)}20%{transform:translateY(-2px) scale(1.006);box-shadow:0 17px 38px rgba(20,42,74,.12)}27%,95%{transform:translateY(0) scale(1);box-shadow:0 12px 30px rgba(20,42,74,.07)}}
      @keyframes tapActionRing{0%,4%,26%,100%{opacity:0;transform:rotate(0deg)}9%{opacity:.30}15%{opacity:.95;transform:rotate(105deg)}22%{opacity:.18;transform:rotate(190deg)}}
      @keyframes tapActionSweep{0%,7%,24%,100%{left:-75%;opacity:0}10%{opacity:.1}14%{left:130%;opacity:.9}18%{opacity:0}}
      @keyframes tapIconPulse{0%,7%,25%,100%{transform:rotate(0deg) scale(1)}12%{transform:rotate(-10deg) scale(1.14)}16%{transform:rotate(7deg) scale(1.08)}20%{transform:rotate(0deg) scale(1)}}
      .tap-cinematic-actions .quick-card:active{animation-play-state:paused;transform:scale(.97)!important}
      @media(max-width:820px){.tap-cinematic-actions{perspective:900px}.tap-cinematic-actions .quick-card{backface-visibility:hidden}.tap-cinematic-actions .quick-card:nth-child(3){grid-column:auto!important}}
      @media(prefers-reduced-motion:reduce){.tap-cinematic-actions .quick-card,.tap-cinematic-actions .quick-card::before,.tap-cinematic-actions .quick-card::after,.tap-cinematic-actions .quick-icon{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  function boot(){ensureResultsCss();ensureProspectSave();installNav();installHomeMotion();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
