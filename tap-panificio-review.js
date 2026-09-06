(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isPanificio = type.includes('panificio') || type.includes('biscottificio') || rawType.includes('panificio') || rawType.includes('biscottificio');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isPanificio && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-panificio-no-logo-review-v1">
        .eyebrow{
          font-size:clamp(1.34rem,6.2vw,1.80rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.075em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(0,0,0,.78)!important;
        }
        .messaggio-box{
          color:#35261d!important;
          font-size:clamp(1.08rem,4.9vw,1.38rem)!important;
          line-height:1.28!important;
          font-weight:850!important;
          text-shadow:0 1px 1px rgba(255,255,255,.68),0 1px 2px rgba(0,0,0,.10)!important;
        }
        .stelle{
          color:#ffd52f!important;
          text-shadow:0 0 8px rgba(255,232,110,.98),0 0 18px rgba(255,190,35,.92),0 3px 8px rgba(0,0,0,.35)!important;
          filter:brightness(1.22) saturate(1.24)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.26rem,5.9vw,1.62rem)!important}
          .messaggio-box{font-size:clamp(1.04rem,4.7vw,1.26rem)!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
