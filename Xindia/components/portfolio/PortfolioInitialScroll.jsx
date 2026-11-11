'use client';

import { useEffect } from 'react';

export default function PortfolioInitialScroll() {
  useEffect(() => {
    // Respect an explicitly selected non-products section. Bare portfolio
    // links and QR links both land at Products after the page has mounted.
    const requestedSection = window.location.hash.slice(1);
    if (requestedSection && requestedSection !== 'products') return undefined;

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const products = document.getElementById('products');
        if (!products) return;
        const navHeight = document.querySelector('.portfolio-sticky-dock')?.getBoundingClientRect().height || 0;
        const top = products.getBoundingClientRect().top + window.scrollY - navHeight - 8;
        const root = document.documentElement;
        const previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
        root.style.scrollBehavior = previousScrollBehavior;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, []);

  return null;
}
