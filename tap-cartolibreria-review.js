(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;
  openInlinePreview = function(html) {
    const type = window.TapCategories ? window.TapCategories.normalizeId(activity.value) : activity.value;

    if (type === 'cartolibreria' && window.tapLogoSkipped && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-cartolibreria-no-logo-title-v2">
        .eyebrow{
          font-size:clamp(1.28rem,5.8vw,1.72rem)!important;
          line-height:1.15!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.95)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.22rem,5.6vw,1.58rem)!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
