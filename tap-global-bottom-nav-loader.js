(() => {
  'use strict';
  if (document.querySelector('script[data-tap-global-bottom-nav-loader]')) return;
  const script=document.createElement('script');
  script.src='tap-global-bottom-nav.js?v=2';
  script.dataset.tapGlobalBottomNavLoader='1';
  script.addEventListener('load',()=>{
    if(!document.querySelector('script[data-tap-potenziali-nav]')) {
      const patch=document.createElement('script');
      patch.src='tap-potenziali-nav.js?v=1';
      patch.dataset.tapPotenzialiNav='1';
      document.head.appendChild(patch);
    }
    const page=location.pathname.split('/').pop()||'';
    if(page==='personalizza-potenziale.html' && !document.querySelector('script[data-tap-potenziale-save-v3]')) {
      const savePatch=document.createElement('script');
      savePatch.src='tap-potenziale-save-v3.js?v=1';
      savePatch.dataset.tapPotenzialeSaveV3='1';
      document.head.appendChild(savePatch);
    }
  },{once:true});
  document.head.appendChild(script);
})();
