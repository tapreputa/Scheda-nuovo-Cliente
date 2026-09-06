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
      html = html.replace('</head>', `<style id="tap-macelleria-no-logo-review-v1">
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
          font-size:clamp(1.16rem,5.3vw,1.50rem)!important;
          line-height:1.18!important;
          font-weight:950!important;
          letter-spacing:.055em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.72)!important;
        }
        .bottone-google{
          display:block!important;
          position:relative!important;
          left:50%!important;
          transform:translateX(-50%)!important;
          top:220px!important;
          width:84%!important;
          max-width:620px!important;
          margin-left:0!important;
          margin-right:0!important;
          box-sizing:border-box!important;
          right:auto!important;
        }
        .stelle{
          position:relative!important;
          top:244px!important;
          left:0!important;
          margin-left:auto!important;
          margin-right:auto!important;
          text-align:center!important;
        }
        @media(min-width:641px){
          .bottone-google{top:226px!important}
          .stelle{top:250px!important}
        }
        @media(max-width:640px){
          .eyebrow{
            width:82%!important;
            font-size:clamp(1.10rem,5.05vw,1.38rem)!important;
            letter-spacing:.05em!important;
          }
          .bottone-google{width:82%!important;top:218px!important}
          .stelle{top:242px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
