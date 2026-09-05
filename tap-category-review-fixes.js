(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const originalOpenInlinePreview = openInlinePreview;
  openInlinePreview = function(html) {
    const type = window.TapCategories ? window.TapCategories.normalizeId(activity.value) : activity.value;

    if (type === 'autolavaggio' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-review-autolavaggio-title-v2">
        .eyebrow{
          display:inline-block!important;
          max-width:92%!important;
          margin:0 auto 18px!important;
          padding:8px 14px!important;
          border-radius:12px!important;
          background:rgba(3,24,38,.66)!important;
          border:1px solid rgba(255,255,255,.24)!important;
          box-shadow:0 7px 18px rgba(0,0,0,.28)!important;
          color:#fff!important;
          font-size:clamp(15px,4vw,19px)!important;
          line-height:1.25!important;
          font-weight:950!important;
          letter-spacing:.11em!important;
          text-shadow:0 3px 9px rgba(0,0,0,.95)!important;
          backdrop-filter:blur(2px)!important;
          -webkit-backdrop-filter:blur(2px)!important;
        }
        .bottone-google{margin-top:12px!important}
      </style></head>`);
    }

    return originalOpenInlinePreview(html);
  };
})();
