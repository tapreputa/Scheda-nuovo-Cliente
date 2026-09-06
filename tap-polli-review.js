(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;
  const placeholderPixel = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPolli = type === 'polli_spiedo' || type.includes('polli') || rawType.includes('polli');
    const noLogo = !!window.tapLogoSkipped || (typeof html === 'string' && html.includes(placeholderPixel));

    if (noLogo && isPolli && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-polli-no-logo-review-v2">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow{
          position:absolute!important;
          top:15.5vh!important;
          left:8%!important;
          right:8%!important;
          width:auto!important;
          max-width:none!important;
          margin:0!important;
          padding:0!important;
          transform:none!important;
          text-align:center!important;
          font-size:clamp(1.42rem,6.5vw,1.95rem)!important;
          line-height:1.08!important;
          font-weight:950!important;
          letter-spacing:.025em!important;
          color:#fff!important;
          text-shadow:0 3px 12px rgba(0,0,0,.92)!important;
        }
        .bottone-google{
          position:absolute!important;
          top:58vh!important;
          left:7%!important;
          right:7%!important;
          width:auto!important;
          margin:0!important;
          transform:none!important;
        }
        .stelle{
          position:absolute!important;
          top:70.5vh!important;
          left:0!important;
          right:0!important;
          width:100%!important;
          margin:0!important;
          transform:none!important;
          text-align:center!important;
        }
        @media(max-width:640px){
          .eyebrow{top:15vh!important;left:7%!important;right:7%!important;font-size:clamp(1.34rem,6.2vw,1.78rem)!important}
          .bottone-google{top:57.5vh!important}
          .stelle{top:70vh!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
