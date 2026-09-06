(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const type = window.TapCategories ? window.TapCategories.normalizeId(activity.value) : activity.value;
    const noLogo = Boolean(window.tapLogoSkipped);

    if (type === 'pub' && noLogo && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-pub-no-logo-review-v1">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow{
          font-size:clamp(1.45rem,6.2vw,2rem)!important;
          line-height:1.12!important;
          font-weight:950!important;
          letter-spacing:.09em!important;
          text-shadow:0 3px 12px rgba(0,0,0,.95)!important;
        }
        .messaggio-box{
          background:rgba(8,18,38,.48)!important;
          border-color:rgba(255,255,255,.30)!important;
          backdrop-filter:blur(1px)!important;
          -webkit-backdrop-filter:blur(1px)!important;
          box-shadow:0 8px 22px rgba(0,0,0,.22)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.35rem,6vw,1.78rem)!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
