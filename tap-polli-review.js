(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPolli = type === 'polli_spiedo' || type.includes('polli') || rawType.includes('polli');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isPolli && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-polli-no-logo-review-v1">
        .eyebrow{
          position:absolute!important;
          top:15.5vh!important;
          left:7%!important;
          right:7%!important;
          width:auto!important;
          max-width:none!important;
          margin:0!important;
          text-align:center!important;
          font-size:clamp(1.42rem,6.5vw,1.95rem)!important;
          line-height:1.08!important;
          font-weight:950!important;
          letter-spacing:.035em!important;
          color:#fff!important;
          text-shadow:0 3px 12px rgba(0,0,0,.92)!important;
        }
        .bottone-google{
          position:absolute!important;
          top:56vh!important;
          left:6%!important;
          right:6%!important;
          width:auto!important;
          margin:0!important;
        }
        .stelle{
          position:absolute!important;
          top:68vh!important;
          left:0!important;
          right:0!important;
          margin:0!important;
        }
        @media(max-width:640px){
          .eyebrow{top:15vh!important;font-size:clamp(1.34rem,6.2vw,1.78rem)!important}
          .bottone-google{top:55.5vh!important}
          .stelle{top:67.5vh!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
