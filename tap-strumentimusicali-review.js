(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && type === 'strumentimusicali' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-strumentimusicali-no-logo-review-v1">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow{
          font-size:clamp(1.42rem,6.3vw,1.95rem)!important;
          line-height:1.08!important;
          font-weight:950!important;
          letter-spacing:.035em!important;
          color:#fff!important;
          text-shadow:0 3px 12px rgba(0,0,0,.92)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.34rem,6.1vw,1.78rem)!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
