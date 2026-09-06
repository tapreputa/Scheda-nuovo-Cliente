(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isParrucchiere = type.includes('parrucchiere') || rawType.includes('parrucchiere');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isParrucchiere && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-parrucchiere-no-logo-review-v2">
        .eyebrow{
          font-size:clamp(1.34rem,6.2vw,1.78rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.085em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(0,0,0,.72)!important;
        }
        .messaggio-box{
          background:rgba(245,239,232,.46)!important;
          border-color:rgba(255,255,255,.34)!important;
          color:#352a24!important;
          font-weight:850!important;
          text-shadow:0 1px 1px rgba(255,255,255,.68),0 1px 2px rgba(0,0,0,.10)!important;
          backdrop-filter:blur(.3px)!important;
          -webkit-backdrop-filter:blur(.3px)!important;
        }
        .bottone-google{
          background:linear-gradient(135deg,#c49a78,#a97856 62%,#bd8f6d)!important;
          border-color:rgba(255,255,255,.28)!important;
          box-shadow:0 8px 18px rgba(56,37,24,.18)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.26rem,5.9vw,1.62rem)!important}
        }
      </style></head>`);
    }

    if (!noLogo && isParrucchiere && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-parrucchiere-with-logo-review-v1">
        .logo{
          position:relative!important;
          top:14px!important;
        }
        .eyebrow{
          font-size:clamp(1.38rem,6.35vw,1.86rem)!important;
          line-height:1.12!important;
          font-weight:950!important;
          letter-spacing:.08em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(0,0,0,.76)!important;
        }
        .bottone-google{
          position:relative!important;
          top:18px!important;
        }
        .stelle{
          position:relative!important;
          top:24px!important;
        }
        @media(max-width:640px){
          .logo{top:12px!important}
          .eyebrow{font-size:clamp(1.30rem,6.05vw,1.68rem)!important}
          .bottone-google{top:16px!important}
          .stelle{top:22px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
