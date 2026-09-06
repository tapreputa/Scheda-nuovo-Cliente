(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPizzeria = type.includes('pizzeria') || rawType.includes('pizzeria');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isPizzeria && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-pizzeria-no-logo-review-v2">
        .eyebrow{
          font-size:clamp(1.46rem,6.65vw,1.96rem)!important;
          line-height:1.12!important;
          font-weight:950!important;
          letter-spacing:.072em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(0,0,0,.76)!important;
        }
        .messaggio-box{
          background:rgba(242,232,224,.44)!important;
          border-color:rgba(255,255,255,.34)!important;
          color:#4a2b22!important;
          font-weight:850!important;
          text-shadow:0 1px 1px rgba(255,255,255,.70),0 1px 2px rgba(0,0,0,.10)!important;
          backdrop-filter:blur(.25px)!important;
          -webkit-backdrop-filter:blur(.25px)!important;
        }
        .bottone-google{
          width:84%!important;
          max-width:540px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          background:linear-gradient(135deg,#cf6f4f,#bb6248 58%,#c97a63)!important;
          border-color:rgba(255,255,255,.30)!important;
          box-shadow:0 7px 16px rgba(86,35,24,.16)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.34rem,6.15vw,1.74rem)!important}
          .bottone-google{width:82%!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
