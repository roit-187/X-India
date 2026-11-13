'use client';

import { useEffect, useState } from 'react';

const FALLBACK_URL = 'https://play.google.com/store/apps/details?id=com.xindia.marketplace';
let pendingConfig = null;

function loadPlayStoreUrl() {
  if (!pendingConfig) {
    pendingConfig = fetch('/api/system/config', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('App configuration unavailable');
        const data = await response.json();
        const url = new URL(data?.config?.appVersionPolicy?.playStoreUrl || FALLBACK_URL);
        if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid app URL');
        return url.toString();
      })
      .catch(() => FALLBACK_URL)
      .finally(() => { pendingConfig = null; });
  }
  return pendingConfig;
}

export function usePlayStoreUrl() {
  const [url, setUrl] = useState(FALLBACK_URL);
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      loadPlayStoreUrl().then((next) => { if (mounted) setUrl(next); });
    };
    const onVisibility = () => { if (!document.hidden) refresh(); };
    refresh();
    document.addEventListener('visibilitychange', onVisibility);
    return () => { mounted = false; document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  return url;
}
