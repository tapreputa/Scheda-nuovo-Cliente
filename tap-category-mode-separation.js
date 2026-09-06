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

    if (!noLogo && type === 'detersivi' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-detersivi-with-logo-review-v1">
        .logo,.eyebrow,.messaggio-box,.bottone-google,.stelle{position:relative!important}
        .logo{top:28px!important}
        .eyebrow{
          top:34px!important;
          font-size:clamp(1.22rem,5.7vw,1.62rem)!important;
          line-height:1.16!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 9px rgba(0,0,0,.38)!important;
        }
        .messaggio-box{
          top:44px!important;
          background:rgba(255,255,255,.48)!important;
          border-color:rgba(255,255,255,.36)!important;
          backdrop-filter:blur(.45px)!important;
          -webkit-backdrop-filter:blur(.45px)!important;
        }
        .bottone-google{top:54px!important}
        .stelle{top:58px!important}
        @media(max-width:640px){
          .logo{top:24px!important}
          .eyebrow{top:30px!important;font-size:clamp(1.18rem,5.5vw,1.50rem)!important}
          .messaggio-box{top:40px!important}
          .bottone-google{top:50px!important}
          .stelle{top:54px!important}
        }
      </style></head>`);
    }

    if (noLogo && type === 'farmacia' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-farmacia-no-logo-review-v1">
        .eyebrow{
          font-size:clamp(1.28rem,6vw,1.72rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.50)!important;
        }
        .messaggio-box{
          background:rgba(255,255,255,.50)!important;
          border-color:rgba(255,255,255,.34)!important;
          backdrop-filter:blur(.45px)!important;
          -webkit-backdrop-filter:blur(.45px)!important;
        }
        .bottone-google{top:150px!important}
        .stelle{top:166px!important}
        @media(min-width:641px){
          .bottone-google{top:156px!important}
          .stelle{top:172px!important}
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.22rem,5.8vw,1.58rem)!important}
        }
      </style></head>`);
    }

    if (!noLogo && type === 'farmacia' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-farmacia-with-logo-review-v1">
        .eyebrow{
          font-size:clamp(1.18rem,5.5vw,1.50rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.50)!important;
        }
        .messaggio-box{
          background:rgba(255,255,255,.44)!important;
          border-color:rgba(255,255,255,.30)!important;
          backdrop-filter:blur(.35px)!important;
          -webkit-backdrop-filter:blur(.35px)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.14rem,5.3vw,1.42rem)!important}
        }
      </style></head>`);
    }

    if (noLogo && type === 'gelateria' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-gelateria-no-logo-review-v1">
        .eyebrow{
          font-size:clamp(1.30rem,6vw,1.72rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.72)!important;
        }
        .messaggio-box{
          background:rgba(255,255,255,.46)!important;
          border-color:rgba(255,255,255,.30)!important;
          backdrop-filter:blur(.35px)!important;
          -webkit-backdrop-filter:blur(.35px)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.22rem,5.8vw,1.58rem)!important}
        }
      </style></head>`);
    }

    if (!noLogo && type === 'gelateria' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-gelateria-with-logo-review-v1">
        .eyebrow{
          font-size:clamp(1.20rem,5.6vw,1.54rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.10em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.72)!important;
        }
        .messaggio-box{
          background:rgba(255,255,255,.40)!important;
          border-color:rgba(255,255,255,.28)!important;
          backdrop-filter:blur(.30px)!important;
          -webkit-backdrop-filter:blur(.30px)!important;
        }
        .stelle{
          color:#ffd62a!important;
          text-shadow:0 0 7px rgba(255,229,92,.98),0 0 15px rgba(255,196,32,.90),0 3px 8px rgba(0,0,0,.34)!important;
          filter:brightness(1.18) saturate(1.22)!important;
        }
        @media(max-width:640px){
          .eyebrow{font-size:clamp(1.16rem,5.4vw,1.46rem)!important}
        }
      </style></head>`);
    }

    if (noLogo && type === 'gioielleria' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-gioielleria-no-logo-review-v2">
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
          text-shadow:0 3px 10px rgba(0,0,0,.64)!important;
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

    if (noLogo && type === 'macelleria' && typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-macelleria-no-logo-review-v3">
        .eyebrow{
          display:block!important;
          position:relative!important;
          left:50%!important;
          transform:translateX(-50%)!important;
          width:86%!important;
          max-width:620px!important;
          margin-left:0!important;
          margin-right:0!important;
          box-sizing:border-box!important;
          white-space:normal!important;
          overflow-wrap:normal!important;
          text-align:center!important;
          font-size:clamp(1.34rem,6.25vw,1.78rem)!important;
          line-height:1.14!important;
          font-weight:950!important;
          letter-spacing:.04em!important;
          text-shadow:0 3px 10px rgba(0,0,0,.78)!important;
        }
        .bottone-google{
          display:block!important;
          position:relative!important;
          left:50%!important;
          transform:translateX(-50%)!important;
          top:350px!important;
          width:82%!important;
          max-width:620px!important;
          margin-left:0!important;
          margin-right:0!important;
          box-sizing:border-box!important;
          right:auto!important;
        }
        .stelle{
          position:relative!important;
          top:386px!important;
          left:0!important;
          margin-left:auto!important;
          margin-right:auto!important;
          text-align:center!important;
        }
        @media(min-width:641px){
          .bottone-google{top:360px!important}
          .stelle{top:396px!important}
        }
        @media(max-width:640px){
          .eyebrow{
            width:84%!important;
            font-size:clamp(1.28rem,5.95vw,1.64rem)!important;
            letter-spacing:.035em!important;
          }
          .bottone-google{width:82%!important;top:344px!important}
          .stelle{top:380px!important}
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();