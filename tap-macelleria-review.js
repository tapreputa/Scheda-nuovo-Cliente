(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const type = window.TapCategories ? window.TapCategories.normalizeId(activity.value) : activity.value;
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && type === 'macelleria' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-macelleria-no-logo-review-v2">
        .eyebrow{
          display:block!important;
          position:relative!important;
          left:50%!important;
          transform:translateX(-50%)!important;
          width:84%!important;
          max-width:600px!important;
          margin-left:0!important;
          margin-right:0!important;
          box-sizing:border-box!important;
          white-space:normal!important;
          overflow-wrap:normal!important;
          text-align:center!important;
          font-size:clamp(1.24rem,5.7vw,1.66rem)!important;
          line-height:1.16!important;
          font-weight:950!important;
          letter-spacing:.05em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.72)!important;
        }
        .bottone-google{
          display:block!important;
          position:relative!important;
          left:50%!important;
          transform:translateX(-50%)!important;
          top:286px!important;
          width:84%!important;
          max-width:620px!important;
          margin-left:0!important;
          margin-right:0!important;
          box-sizing:border-box!important;
          right:auto!important;
        }
        .stelle{
          position:relative!important;
          top:316px!important;
          left:0!important;
          margin-left:auto!important;
          margin-right:auto!important;
          text-align:center!important;
        }
        @media(min-width:641px){
          .bottone-google{top:292px!important}
          .stelle{top:322px!important}
        }
        @media(max-width:640px){
          .eyebrow{
            width:82%!important;
            font-size:clamp(1.18rem,5.45vw,1.50rem)!important;
            letter-spacing:.045em!important;
          }
          .bottone-google{width:82%!important;top:282px!important}
          .stelle{top:312px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
