'use client';

export function trackPortfolioEvent(slug, eventType, extra = {}) {
  if (!slug || typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;
  const params = new URLSearchParams(window.location.search);
  const allowedSources = new Set(['qr', 'direct_share', 'app', 'search']);
  const requestedSource = params.get('src');
  const source = allowedSources.has(requestedSource) ? requestedSource : 'unknown';
  fetch('/api/public/portfolio-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, eventType, source, ...extra }),
    keepalive: true,
  }).catch(() => {});
}

export function openProductInApp(productId, slug) {
  if (!productId || typeof window === 'undefined') return;

  trackPortfolioEvent(slug, 'product_click', { productId });
  const params = new URLSearchParams(window.location.search);
  const source = params.get('src') || 'unknown';
  const sourceQuery = source !== 'unknown' ? `?src=${encodeURIComponent(source)}` : '';
  const webFallback = `/product/${encodeURIComponent(productId)}${sourceQuery}`;
  const isAndroid = /Android/i.test(window.navigator.userAgent);

  if (!isAndroid) {
    window.location.assign(webFallback);
    return;
  }

  trackPortfolioEvent(slug, 'app_open', { productId });
  const deepLink = new URLSearchParams({
    productId: String(productId),
    portfolioSlug: String(slug || ''),
    portfolioSource: source,
  });
  const appUrl = `xindia://product/detail?${deepLink.toString()}`;
  let fallbackTimer;
  const cleanup = () => {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
  const handleVisibilityChange = () => {
    if (document.hidden) cleanup();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  fallbackTimer = window.setTimeout(async () => {
    cleanup();
    if (!document.hidden) window.location.assign(webFallback);
  }, 1400);
  window.location.assign(appUrl);
}

export function openSellerInApp(sellerId, slug, intent = 'contact') {
  if (!sellerId || typeof window === 'undefined') return false;
  if (!/Android/i.test(window.navigator.userAgent)) return false;

  trackPortfolioEvent(slug, 'app_open');
  const source = new URLSearchParams(window.location.search).get('src') || 'unknown';
  const params = new URLSearchParams({
    portfolioSlug: String(slug || ''),
    portfolioSource: source,
    contactIntent: intent === 'contact' ? '1' : '0',
  });
  const appUrl = `xindia://seller/${encodeURIComponent(sellerId)}?${params.toString()}`;
  let fallbackTimer;
  const cleanup = () => {
    window.clearTimeout(fallbackTimer);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
  const handleVisibilityChange = () => {
    if (document.hidden) cleanup();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  fallbackTimer = window.setTimeout(async () => {
    cleanup();
    if (!document.hidden) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 1400);
  window.location.assign(appUrl);
  return true;
}

export async function getPlayStoreUrl({ slug, productId, source }) {
  const fallbackUrl = 'https://play.google.com/store/apps/details?id=com.xindia.marketplace';
  const requestedSource = source ?? (typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('src')
    : null);
  const allowedSources = new Set(['qr', 'direct_share', 'app', 'search']);
  const portfolioSource = allowedSources.has(requestedSource) ? requestedSource : 'unknown';
  try {
    const response = await fetch('/api/system/config', { cache: 'no-store' });
    const data = await response.json();
    const configuredUrl = data?.config?.appVersionPolicy?.playStoreUrl;
    const storeUrl = new URL(configuredUrl || fallbackUrl);
    if (storeUrl.protocol !== 'https:') throw new Error('Invalid Play Store URL');
    const referrer = new URLSearchParams({
      source: 'seller_portfolio',
      portfolio: slug || '',
      product: productId || '',
      src: portfolioSource,
    });
    storeUrl.searchParams.set('referrer', referrer.toString());
    return storeUrl.toString();
  } catch {
    return fallbackUrl;
  }
}
