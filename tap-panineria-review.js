(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPanineria = type === 'panineria_hamburgeria' || type === 'hamburgeria' || rawType.includes('panineria') || rawType.includes('hamburgeria');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isPanineria && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-panineria-no-logo-review-v1">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow{
          position:absolute!important;
          top:12.5vh!important;
          left:50%!important;
          right:auto!important;
          transform:translateX(-50%)!important;
          width:84%!important;
          max-width:620px!important;
          margin:0!important;
          box-sizing:border-box!important;
          text-align:center!important;
          white-space:normal!important;
          overflow-wrap:normal!important;
          font-size:clamp(1.34rem,6.15vw,1.78rem)!important;
          line-height:1.12!important;
          letter-spacing:.035em!important;
          font-weight:950!important;
          text-shadow:0 3px 12px rgba(0,0,0,.94)!important;
        }
        .bottone-google{
          position:absolute!important;
          top:58.5vh!important;
          left:50%!important;
          right:auto!important;
          transform:translateX(-50%)!important;
          width:84%!important;
          max-width:620px!important;
          margin:0!important;
          box-sizing:border-box!important;
        }
        .stelle{
          position:absolute!important;
          top:69.5vh!important;
          left:0!important;
          right:0!important;
          margin:0!important;
          text-align:center!important;
        }
        @media(max-width:640px){
          .eyebrow{top:12vh!important;width:82%!important;font-size:clamp(1.28rem,5.95vw,1.62rem)!important}
          .bottone-google{top:58vh!important;width:82%!important}
          .stelle{top:69vh!important}
        }
        @media(max-height:690px){
          .eyebrow{top:11vh!important}
          .bottone-google{top:56.5vh!important}
          .stelle{top:67.5vh!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
