(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPolliSpiedo = type === 'polli_spiedo' || rawType === 'polli_spiedo';
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isPolliSpiedo && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-polli-spiedo-no-logo-review-v1">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow{
          position:absolute!important;
          top:13.5vh!important;
          left:7%!important;
          right:7%!important;
          width:auto!important;
          max-width:none!important;
          margin:0!important;
          padding:0!important;
          transform:none!important;
          box-sizing:border-box!important;
          text-align:center!important;
          font-size:clamp(1.72rem,7.1vw,2.18rem)!important;
          line-height:1.08!important;
          letter-spacing:.025em!important;
          font-weight:950!important;
          color:#fff!important;
          text-shadow:0 3px 12px rgba(0,0,0,.92)!important;
        }
        .bottone-google{
          position:absolute!important;
          top:56vh!important;
          left:7%!important;
          right:7%!important;
          width:auto!important;
          margin:0!important;
          transform:none!important;
        }
        .stelle{
          position:absolute!important;
          top:67.5vh!important;
          left:0!important;
          right:0!important;
          width:100%!important;
          margin:0!important;
          transform:none!important;
          text-align:center!important;
        }
        @media(max-width:640px){
          .eyebrow{top:13vh!important;left:7%!important;right:7%!important;font-size:clamp(1.58rem,7vw,1.98rem)!important}
          .bottone-google{top:56.5vh!important;left:7%!important;right:7%!important}
          .stelle{top:68vh!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
