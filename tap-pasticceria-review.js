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
      html = html.replace('</head>', `<style id="tap-pasticceria-no-logo-review-v3">
        .eyebrow{
          font-size:clamp(1.36rem,6.25vw,1.82rem)!important;
          line-height:1.13!important;
          font-weight:950!important;
          letter-spacing:.075em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(78,42,24,.72)!important;
        }
        .messaggio-box{
          background:rgba(255,246,241,.50)!important;
          border-color:rgba(255,255,255,.38)!important;
          color:#3b241d!important;
          font-weight:900!important;
          text-shadow:0 1px 1px rgba(255,255,255,.82),0 1px 2px rgba(0,0,0,.12)!important;
          backdrop-filter:blur(.35px)!important;
          -webkit-backdrop-filter:blur(.35px)!important;
        }
        .bottone-google{
          width:84%!important;
          max-width:540px!important;
          margin-left:auto!important;
          margin-right:auto!important;
          background:linear-gradient(135deg,#e4ba98,#d7a984 58%,#e2b7a3)!important;
          border-color:rgba(255,255,255,.40)!important;
          box-shadow:0 6px 14px rgba(92,55,35,.12)!important;
        }
        footer{
          position:absolute!important;
          right:4.5%!important;
          bottom:7.2vh!important;
          top:auto!important;
          left:auto!important;
          margin:0!important;
          text-align:right!important;
          text-shadow:0 2px 5px rgba(0,0,0,.48)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.28rem,5.95vw,1.66rem)!important}
          .bottone-google{width:82%!important}
          footer{right:4.5%!important;bottom:6.8vh!important;top:auto!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
