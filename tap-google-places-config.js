(() => {
  'use strict';
  // La chiave Google non viene più conservata nel repository pubblico.
  // La ricerca passa tramite Supabase Edge Function e usa il secret server-side GOOGLE_PLACES_API_KEY.
  window.TapGooglePlacesConfig = Object.freeze({
    mode: 'supabase-edge-function',
    functionName: 'google-places-autocomplete'
  });
})();
