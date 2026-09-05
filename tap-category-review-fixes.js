(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const originalOpenInlinePreview = openInlinePreview;
  openInlinePreview = function(html) {
    const type = window.TapCategories ? window.TapCategories.normalizeId(activity.value) : activity.value;

    if (type === 'autolavaggio' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-review-autolavaggio-final-v3">
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
        .stelle{
          color:#ffd84a!important;
          font-size:clamp(31px,8.6vw,42px)!important;
          text-shadow:
            0 0 8px rgba(255,225,90,.98),
            0 0 18px rgba(255,190,35,.86),
            0 4px 10px rgba(0,0,0,.72)!important;
          filter:brightness(1.18) saturate(1.14)!important;
        }
        body:not(.tap-no-logo) .logo{
          width:min(66vw,340px)!important;
          height:clamp(86px,13vh,126px)!important;
          max-height:none!important;
          padding:0!important;
          border:0!important;
          border-radius:0!important;
          background:transparent!important;
          box-shadow:none!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
          filter:drop-shadow(0 5px 12px rgba(0,0,0,.45))!important;
          object-fit:contain!important;
        }
        @media(max-width:640px){
          body:not(.tap-no-logo) .logo{
            width:min(64vw,300px)!important;
            height:clamp(82px,12vh,116px)!important;
          }
        }
      </style></head>`);
    }

    return originalOpenInlinePreview(html);
  };
})();
