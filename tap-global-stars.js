(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  if (typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;

  openInlinePreview = function(html) {
    if (typeof html === 'string') {
      html = html.replace('</head>', `<style id="tap-global-stars-final">
        .stelle{
          color:#ffd52f!important;
          text-shadow:0 0 8px rgba(255,232,110,.98),0 0 18px rgba(255,190,35,.92),0 3px 8px rgba(0,0,0,.35)!important;
          filter:brightness(1.22) saturate(1.24)!important;
        }
      </style></head>`);
    }

    return previousOpenInlinePreview(html);
  };
})();
