'use client';

import { useEffect } from 'react';

// NOT an authorization check — real auth/authz happens in middleware.js (route
// guard) and on every backend request. This only forces a reload when a page
// is restored from the browser's back/forward cache after logout, so a stale
// authenticated view is never shown from bfcache.
export default function BfcacheReload() {
  useEffect(() => {
    const handler = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handler);
    return () => window.removeEventListener('pageshow', handler);
  }, []);

  return null;
}
