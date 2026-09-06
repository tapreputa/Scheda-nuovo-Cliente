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

    if (noLogo && type === 'svapostore' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-svapostore-no-logo-review-v1">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow,.messaggio-box,.bottone-google,.stelle{position:relative!important}
        .eyebrow{top:58px!important}
        .messaggio-box{top:86px!important}
        .bottone-google{top:118px!important}
        .stelle{top:142px!important}
        @media(max-width:640px){
          .eyebrow{top:54px!important}
          .messaggio-box{top:82px!important}
          .bottone-google{top:114px!important}
          .stelle{top:138px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
