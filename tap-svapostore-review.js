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
      html = html.replace('</head>', `<style id="tap-svapostore-no-logo-review-v3">
        .logo{display:none!important}
        .title,.text,.btn,.stars{position:relative!important}
        .title{top:62px!important}
        .text{top:92px!important}
        .btn{top:126px!important}
        .stars{top:160px!important}
        @media(max-width:640px){
          .title{top:58px!important}
          .text{top:88px!important}
          .btn{top:122px!important}
          .stars{top:156px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
