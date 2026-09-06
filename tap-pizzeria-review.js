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
      html = html.replace('</head>', `<style id="tap-pizzeria-no-logo-review-v1">
        body{
          background-color:rgba(255,214,178,.28)!important;
          background-blend-mode:screen!important;
        }
        .eyebrow{
          font-size:clamp(1.42rem,6.5vw,1.92rem)!important;
          line-height:1.12!important;
          font-weight:950!important;
          letter-spacing:.075em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(0,0,0,.72)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.32rem,6.1vw,1.72rem)!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
