(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPasticceria = type.includes('pasticceria') || rawType.includes('pasticceria');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isPasticceria && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-pasticceria-no-logo-review-v1">
        .eyebrow{
          font-size:clamp(1.36rem,6.25vw,1.82rem)!important;
          line-height:1.13!important;
          font-weight:950!important;
          letter-spacing:.075em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(78,42,24,.72)!important;
        }
        .messaggio-box{
          background:rgba(255,246,241,.38)!important;
          border-color:rgba(255,255,255,.30)!important;
          color:#442b22!important;
          font-weight:850!important;
          text-shadow:0 1px 1px rgba(255,255,255,.64),0 1px 2px rgba(0,0,0,.08)!important;
          backdrop-filter:blur(.25px)!important;
          -webkit-backdrop-filter:blur(.25px)!important;
        }
        .bottone-google{
          width:84%!important;
          max-width:540px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          background:linear-gradient(135deg,#d9a878,#c18b69 58%,#d7a58a)!important;
          border-color:rgba(255,255,255,.34)!important;
          box-shadow:0 7px 17px rgba(92,55,35,.16)!important;
        }
        footer{
          position:relative!important;
          top:-22px!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.28rem,5.95vw,1.66rem)!important}
          .bottone-google{width:82%!important}
          footer{top:-20px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
