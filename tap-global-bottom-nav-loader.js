(() => {
  'use strict';
  if (document.querySelector('script[data-tap-global-bottom-nav-loader]')) return;
  const script=document.createElement('script');
  script.src='tap-global-bottom-nav.js?v=2';
  script.dataset.tapGlobalBottomNavLoader='1';
  script.addEventListener('load',()=>{
    if(document.querySelector('script[data-tap-potenziali-nav]')) return;
    const patch=document.createElement('script');
    patch.src='tap-potenziali-nav.js?v=1';
    patch.dataset.tapPotenzialiNav='1';
    document.head.appendChild(patch);
  },{once:true});
  document.head.appendChild(script);
})();
