'use client';

import { useEffect } from 'react';
import { trackPortfolioEvent } from '@/lib/portfolioAnalytics';

export default function PortfolioViewTracker({ slug }) {
  useEffect(() => {
    trackPortfolioEvent(slug, 'portfolio_view');
  }, [slug]);
  return null;
}
