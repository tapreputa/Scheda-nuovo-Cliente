(() => {
  'use strict';

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const params = new URLSearchParams(location.search);
  const slug = params.get('c') || '';
  const preview = params.get('preview') === '1';
  const requestedSource = params.get('src') || 'link';
  const source = ['nfc', 'link', 'legacy', 'qr'].includes(requestedSource) ? requestedSource : 'link';
  if (!slug || preview) return;

  function register(eventType, keepalive = false) {
    return fetch(SUPABASE_URL + '/rest/v1/rpc/register_public_client_event', {
      method: 'POST',
      keepalive,
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_slug:slug, p_event_type:eventType, p_source:source })
    });
  }

  register('page_view').catch(() => {});

  const review = document.getElementById('review');
  if (!review) return;
  let leaving = false;
  review.addEventListener('click', event => {
    if (leaving) return;
    const href = review.href;
    if (!href) return;
    event.preventDefault();
    leaving = true;
    Promise.race([
      register('google_click', true).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 350))
    ]).finally(() => { location.href = href; });
  });
})();
