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
    const noLogo = !!window.tapLogoSkipped || (typeof html === 'string' && html.includes(placeholderPixel));

    if (noLogo && type === 'svapostore' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-svapostore-no-logo-review-v2">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow,.messaggio-box,.bottone-google,.stelle{position:relative!important}
        .eyebrow{top:72px!important}
        .messaggio-box{top:112px!important}
        .bottone-google{top:158px!important}
        .stelle{top:198px!important}
        @media(max-width:640px){
          .eyebrow{top:68px!important}
          .messaggio-box{top:106px!important}
          .bottone-google{top:150px!important}
          .stelle{top:188px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
