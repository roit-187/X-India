'use client';

import { trackPortfolioEvent } from '@/lib/portfolioAnalytics';

export default function PortfolioProductAppActions({ appUrl, playStoreUrl, sellerSlug, productId }) {
  return (
    <div className="public-product-actions">
      <a className="public-product-primary" href={appUrl}>Open in XINDIA app</a>
      <a
        className="public-product-secondary"
        href={playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPortfolioEvent(sellerSlug, 'play_store_click', { productId })}
      >
        Get the app
      </a>
    </div>
  );
}
