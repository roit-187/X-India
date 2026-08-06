'use client';

import { useEffect } from 'react';

export default function AuthGuard() {
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
