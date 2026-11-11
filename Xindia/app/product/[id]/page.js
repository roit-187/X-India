import { notFound } from 'next/navigation';
import { getPublicProduct, getSeller, getSystemConfig } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import PublicProductInquiryForm from '@/components/portfolio/PublicProductInquiryForm';
import PortfolioProductAppActions from '@/components/portfolio/PortfolioProductAppActions';
import PortfolioImage from '@/components/portfolio/PortfolioImage';
import './product.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live';

export async function generateMetadata({ params }) {
  const product = await getPublicProduct(params.id);
  if (!product) return { title: 'Product Not Found | XINDIA' };
  const description = String(product.description || `${product.name} from ${product.sellerProfile?.name || 'an XINDIA seller'}`).slice(0, 160);
  const image = resolveImageUrl(product.imageUrl || product.images?.[0]);
  return {
    title: `${product.name} | XINDIA`,
    description,
    alternates: { canonical: `${SITE_URL}/product/${params.id}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/product/${params.id}`,
      title: `${product.name} | XINDIA`,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function PublicProductPage({ params, searchParams }) {
  const [product, config] = await Promise.all([
    getPublicProduct(params.id),
    getSystemConfig(),
  ]);
  if (!product) notFound();

  const image = resolveImageUrl(product.imageUrl || product.images?.[0]);
  const sellerSlug = product.sellerProfile?.slug;
  const portfolioSeller = sellerSlug ? await getSeller(sellerSlug) : null;
  const sellerName = portfolioSeller?.name || product.sellerProfile?.name || product.sellerName || 'XINDIA Seller';
  const requestedSource = typeof searchParams?.src === 'string' ? searchParams.src : '';
  const portfolioSource = ['qr', 'direct_share', 'app', 'search'].includes(requestedSource) ? requestedSource : 'unknown';
  const returnToProducts = sellerSlug
    ? `/p/${encodeURIComponent(sellerSlug)}${portfolioSource !== 'unknown' ? `?src=${encodeURIComponent(portfolioSource)}` : ''}#products`
    : '/';
  const appParams = new URLSearchParams({
    productId: String(product._id || params.id),
    portfolioSlug: String(sellerSlug || ''),
    portfolioSource,
  });
  const appUrl = `xindia://product/detail?${appParams.toString()}`;
  const configuredPlayStoreUrl = config?.appVersionPolicy?.playStoreUrl;
  const playStoreUrl = (() => {
    try {
      const parsedUrl = new URL(configuredPlayStoreUrl || 'https://play.google.com/store/apps/details?id=com.xindia.marketplace');
      return parsedUrl.protocol === 'https:' ? parsedUrl.toString() : 'https://play.google.com/store/apps/details?id=com.xindia.marketplace';
    } catch {
      return 'https://play.google.com/store/apps/details?id=com.xindia.marketplace';
    }
  })();
  const playStoreReferrer = new URLSearchParams({
    source: 'seller_portfolio',
    portfolio: sellerSlug || '',
    product: String(product._id || params.id),
    src: portfolioSource,
  });
  const contextualPlayStoreUrl = new URL(playStoreUrl);
  contextualPlayStoreUrl.searchParams.set('referrer', playStoreReferrer.toString());
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: image || undefined,
    sku: product.sku || undefined,
    brand: product.brandName ? { '@type': 'Brand', name: product.brandName } : undefined,
    offers: product.price && product.priceDisplayMode !== 'on_request' ? {
      '@type': 'Offer',
      price: String(product.price).replace(/[^\d.]/g, '') || undefined,
      priceCurrency: 'INR',
      availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/product/${params.id}`,
    } : undefined,
  };

  return (
    <main className="public-product-page">
      <div className="public-product-shell">
        <a className="public-product-back" href={returnToProducts}>
          ← {sellerSlug ? `Back to ${sellerName} products` : 'Back to XINDIA marketplace'}
        </a>
        <div className="public-product-grid">
          <div className="public-product-image-wrap">
            <PortfolioImage src={image} alt={product.name || 'Product'} className="public-product-image" placeholderLabel="Product image not provided" />
          </div>
          <article className="public-product-info">
            <p className="public-product-eyebrow">{product.categoryName || product.category || 'Category not specified'}</p>
            <h1>{product.name}</h1>
            <p className="public-product-seller">Sold by <strong>{sellerName}</strong></p>
            <div className="public-product-price">
              {product.priceDisplayMode === 'on_request'
                ? 'Price on request'
                : product.priceDisplayMode === 'range' && product.priceRange
                  ? product.priceRange
                  : `₹${product.price || 'Contact seller'}`}
              {product.unit ? <span> / {product.unit}</span> : null}
            </div>
            {product.moq ? <p className="public-product-meta">Minimum order: {product.moq} {product.unit || 'units'}</p> : null}
            <PortfolioProductAppActions
              appUrl={appUrl}
              playStoreUrl={contextualPlayStoreUrl.toString()}
              sellerSlug={sellerSlug}
              productId={String(product._id || params.id)}
            />
            <p className="public-product-app-note">You can continue browsing here if the app is not installed.</p>
            <h2>Product details</h2>
            <p className="public-product-description">{product.description || 'Contact the seller for product specifications and availability.'}</p>
            <a className="public-product-seller-link" href={sellerSlug ? `/p/${encodeURIComponent(sellerSlug)}${portfolioSource !== 'unknown' ? `?src=${encodeURIComponent(portfolioSource)}` : ''}#contact` : '/'}>View seller details</a>
            {sellerSlug && <PublicProductInquiryForm product={product} sellerSlug={sellerSlug} />}
          </article>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026'),
        }}
      />
    </main>
  );
}
