(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  if (!activity || typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  const closedNoLogoCategories = new Set([
    'abbigliamento',
    'autolavaggio',
    'bar',
    'barbershop',
    'cartolibreria'
  ]);

  openInlinePreview = function(html) {
    const type = window.TapCategories ? window.TapCategories.normalizeId(activity.value) : activity.value;
    const noLogo = !!window.tapLogoSkipped;

    if (type === 'barbershop' && typeof html === 'string') {
      if (noLogo) {
        html = html.replace('</head>', `<style id="tap-barbershop-no-logo-final">
          .eyebrow,.messaggio-box,.bottone-google,.stelle{position:relative!important}
          .eyebrow{
            top:56px!important;
            font-size:clamp(1.18rem,5.6vw,1.55rem)!important;
            line-height:1.16!important;
            font-weight:950!important;
            letter-spacing:.11em!important;
            color:#fff!important;
            text-shadow:0 3px 10px rgba(0,0,0,.98),0 0 5px rgba(0,0,0,.72)!important;
          }
          .messaggio-box{
            top:82px!important;
            background:rgba(245,241,234,.40)!important;
            border-color:rgba(255,255,255,.34)!important;
            backdrop-filter:blur(.8px)!important;
            -webkit-backdrop-filter:blur(.8px)!important;
            box-shadow:0 7px 18px rgba(0,0,0,.12)!important;
          }
          .bottone-google,.stelle{top:132px!important}
          .bottone-google{
            background:linear-gradient(135deg,rgba(126,90,52,.52),rgba(66,47,31,.46))!important;
            color:#fff!important;
            border:1px solid rgba(255,225,185,.30)!important;
            box-shadow:0 8px 20px rgba(0,0,0,.20)!important;
            backdrop-filter:blur(1px)!important;
            -webkit-backdrop-filter:blur(1px)!important;
          }
          @media(min-width:641px){
            .eyebrow{top:62px!important}
            .messaggio-box{top:88px!important}
            .bottone-google,.stelle{top:138px!important}
          }
          @media(max-width:340px) and (max-height:600px){
            .eyebrow{top:32px!important;font-size:1.08rem!important}
            .messaggio-box{top:46px!important}
            .bottone-google,.stelle{top:78px!important}
          }
        </style></head>`);
      } else {
        html = html.replace('</head>', `<style id="tap-barbershop-with-logo-final">
          .logo-wrap,.logo-box,.logo-container{
            background:transparent!important;
            border:0!important;
            box-shadow:none!important;
            backdrop-filter:none!important;
            -webkit-backdrop-filter:none!important;
          }
          .logo{
            background:transparent!important;
            border:0!important;
            box-shadow:none!important;
            padding:0!important;
          }
          .eyebrow,.messaggio-box,.bottone-google,.stelle{position:relative!important}
          .eyebrow{top:-18px!important}
          .messaggio-box{top:-8px!important}
          .bottone-google{top:12px!important}
          .stelle{top:16px!important}
          @media(min-width:641px){
            .eyebrow{top:-12px!important}
            .messaggio-box{top:-2px!important}
            .bottone-google{top:18px!important}
            .stelle{top:24px!important}
          }
        </style></head>`);
      }
    }

    if (noLogo && type && type !== 'standard' && !closedNoLogoCategories.has(type) && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-global-no-logo-review-layout">
        .logo,.logo-wrap,.logo-box,.logo-container{display:none!important}
        .eyebrow,.messaggio-box,.bottone-google,.stelle{position:relative!important}
        .eyebrow{top:78px!important}
        .messaggio-box{top:104px!important}
        .bottone-google{top:138px!important}
        .stelle{top:152px!important}
        @media(min-width:641px){
          .eyebrow{top:84px!important}
          .messaggio-box{top:110px!important}
          .bottone-google{top:144px!important}
          .stelle{top:158px!important}
        }
        @media(max-width:340px) and (max-height:600px){
          .eyebrow{top:42px!important}
          .messaggio-box{top:60px!important}
          .bottone-google{top:84px!important}
          .stelle{top:94px!important}
        }
      </style></head>`);
    }

    if (noLogo && type === 'detersivi' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-detersivi-no-logo-review-v2">
        .eyebrow{
          font-size:clamp(1.22rem,5.7vw,1.62rem)!important;
          line-height:1.16!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 9px rgba(0,0,0,.38)!important;
        }
        .messaggio-box{
          background:rgba(255,255,255,.58)!important;
          border-color:rgba(255,255,255,.42)!important;
          backdrop-filter:blur(.6px)!important;
          -webkit-backdrop-filter:blur(.6px)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.18rem,5.5vw,1.50rem)!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
