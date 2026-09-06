(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    const rawType = String(activity.value || '').toLowerCase();
    const type = window.TapCategories ? String(window.TapCategories.normalizeId(activity.value) || '').toLowerCase() : rawType;
    const isOttica = type.includes('ottica') || type.includes('occhiali') || rawType.includes('ottica') || rawType.includes('occhiali');
    const noLogo = !!window.tapLogoSkipped;

    if (noLogo && isOttica && typeof html === 'string') {
      html = html.replace(/Ti\s+è\s+piaciuta\s+la\s+tua\s+esperienza\s+da\s+noi\?/i, 'Trova gli occhiali perfetti per te!');

      html = html.replace('</head>', `<style id="tap-ottica-no-logo-review-v2">
        .eyebrow{
          font-size:clamp(1.34rem,6.2vw,1.78rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.075em!important;
          text-align:center!important;
          text-shadow:0 3px 10px rgba(0,0,0,.62)!important;
        }
        .messaggio-box{
          background:rgba(238,232,224,.34)!important;
          border-color:rgba(255,255,255,.28)!important;
          color:#342c27!important;
          font-weight:850!important;
          text-shadow:0 1px 1px rgba(255,255,255,.72),0 1px 2px rgba(0,0,0,.12)!important;
          backdrop-filter:blur(.25px)!important;
          -webkit-backdrop-filter:blur(.25px)!important;
        }
        .bottone-google{
          top:158px!important;
          background:linear-gradient(135deg,#9b8d80,#75695f)!important;
          border-color:rgba(255,255,255,.30)!important;
          box-shadow:0 8px 20px rgba(60,48,40,.24)!important;
        }
        .stelle{top:176px!important}
        @media(min-width:641px){
          .bottone-google{top:164px!important}
          .stelle{top:182px!important}
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.26rem,5.9vw,1.60rem)!important}
          .bottone-google{top:154px!important}
          .stelle{top:172px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
