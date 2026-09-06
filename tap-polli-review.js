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
      html = html.replace('</head>', `<style id="tap-polli-no-logo-review-v4">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow{
          position:absolute!important;
          top:21vh!important;
          left:50%!important;
          right:auto!important;
          width:86vw!important;
          max-width:620px!important;
          margin:0!important;
          padding:0!important;
          transform:translateX(-50%)!important;
          text-align:center!important;
          box-sizing:border-box!important;
          font-size:clamp(23px,6.1vw,31px)!important;
          line-height:1.07!important;
          font-weight:950!important;
          letter-spacing:.025em!important;
          color:#fff!important;
          text-shadow:0 3px 12px rgba(0,0,0,.92)!important;
        }
        .bottone-google{
          position:absolute!important;
          top:72vh!important;
          left:50%!important;
          right:auto!important;
          width:86vw!important;
          max-width:590px!important;
          margin:0!important;
          transform:translateX(-50%)!important;
          box-sizing:border-box!important;
        }
        .stelle{
          position:absolute!important;
          top:83vh!important;
          left:50%!important;
          right:auto!important;
          width:86vw!important;
          margin:0!important;
          transform:translateX(-50%)!important;
          text-align:center!important;
          box-sizing:border-box!important;
        }
        @media(max-width:640px){
          .eyebrow{top:20.5vh!important;width:84vw!important;font-size:clamp(22px,6.2vw,29px)!important}
          .bottone-google{top:71.5vh!important;width:86vw!important}
          .stelle{top:82.5vh!important;width:86vw!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
