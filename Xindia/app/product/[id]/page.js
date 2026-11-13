import { notFound } from 'next/navigation';
import { getPublicProduct, getSeller, getSystemConfig, getSellerDestination } from '@/lib/api';
import { resolveImageUrl } from '@/lib/image';
import PortfolioProductAppActions from '@/components/portfolio/PortfolioProductAppActions';
import PortfolioImage from '@/components/portfolio/PortfolioImage';
import PublicProductGallery from '@/components/portfolio/PublicProductGallery';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import './product.css';

export const dynamic = 'force-dynamic';

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
  const product = await getPublicProduct(params.id);
  if (!product) notFound();
  const sellerSlug = product.sellerProfile?.slug;
  if (!sellerSlug || !await getSellerDestination(sellerSlug)) notFound();
  const seller = sellerSlug ? await getSeller(sellerSlug) : null;
  if (!seller) notFound();
  const sellerName = seller?.name || product.sellerProfile?.name || product.sellerName || '';
  const galleryProduct = { name: product.name, imageUrl: product.imageUrl, images: product.images };
  const inquiryProduct = { _id: product._id, name: product.name, sku: product.sku };
  const config = await getSystemConfig();

  const image = resolveImageUrl(product.imageUrl || product.images?.[0]);
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
  const datasheetUrl = (() => {
    try { const url = new URL(resolveImageUrl(product.datasheetPdfUrl)); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch (_) { return null; }
  })();
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
      ...(product.availability === false ? { availability: 'https://schema.org/OutOfStock' } : {}),
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
          <PublicProductGallery product={galleryProduct} />
          <article className="public-product-info">
            {(product.categoryName || product.category || product.brandName || product.condition) && (
              <div className="public-product-tags">
                {(product.categoryName || product.category) && <span>{product.categoryName || product.category}</span>}
                {product.brandName && product.brandName !== 'Unbranded / OEM' && <span>Brand: {product.brandName}</span>}
                {product.condition && <span>{product.condition}</span>}
              </div>
            )}
            <h1>{product.name}</h1>
            {sellerName && <p className="public-product-seller">Sold by <strong>{sellerName}</strong></p>}
            <div className="public-product-price">
              {product.priceDisplayMode === 'on_request'
                ? 'Price on request'
                : product.priceDisplayMode === 'range' && product.priceRange
                  ? product.priceRange
                  : product.price != null ? `₹${product.price}` : 'Price on request'}
              {product.unit ? <span> / {product.unit}</span> : null}
            </div>
            <div className="public-product-meta-grid">
              {product.moq != null && <p className="public-product-meta"><strong>Minimum order:</strong> {product.moq} {product.unit || ''}</p>}
              {product.deliveryTimeConfirmed && product.deliveryTime && <p className="public-product-meta"><strong>Dispatch estimate:</strong> {product.deliveryTime}</p>}
              {product.countryOfOrigin && <p className="public-product-meta"><strong>Origin:</strong> {product.countryOfOrigin}</p>}
              {product.sku && <p className="public-product-meta"><strong>SKU:</strong> {product.sku}</p>}
              {product.modelNumber && <p className="public-product-meta"><strong>Model:</strong> {product.modelNumber}</p>}
              {product.pricingTerms && <p className="public-product-meta"><strong>Trade terms:</strong> {product.pricingTerms}</p>}
              {product.isGstInclusive != null && <p className="public-product-meta"><strong>Tax:</strong> {product.isGstInclusive ? 'GST inclusive' : 'GST not included'}</p>}
            </div>
            <PortfolioProductAppActions
              appUrl={appUrl}
              playStoreUrl={contextualPlayStoreUrl.toString()}
              sellerSlug={sellerSlug}
              productId={String(product._id || params.id)}
              product={inquiryProduct}
            />
            {Array.isArray(product.variants) && product.variants.length > 0 && (
              <section className="public-product-section">
                <h2>Available variants</h2>
                <div className="public-product-variants">
                  {product.variants.filter((variant) => variant && typeof variant === 'object').map((variant, index) => {
                    const dimensions = Object.values(variant.dimensionValues || {}).filter(Boolean).join(' · ');
                    return <div className="public-product-variant" key={variant._id || index}>
                      <span>{variant.combinationLabel || dimensions || variant.name || `Variant ${index + 1}`}</span>
                      {variant.price != null && <strong>₹{variant.price}{product.unit ? ` / ${product.unit}` : ''}</strong>}
                      {variant.moq && <small>MOQ: {variant.moq} {variant.unit || product.unit || ''}</small>}
                      {variant.available === false && <small>Unavailable</small>}
                    </div>;
                  })}
                </div>
              </section>
            )}
            {Array.isArray(product.tieredPrices) && product.tieredPrices.length > 0 && (
              <section className="public-product-section">
                <h2>Volume batch pricing</h2>
                <div className="public-product-variants">
                  {product.tieredPrices.map((tier, index) => <div className="public-product-variant" key={`tier-${index}`}><span>≥ {tier.minQty} {product.unit || 'units'}</span><strong>₹{tier.price}{product.unit ? ` / ${product.unit}` : ''}</strong></div>)}
                </div>
              </section>
            )}
            {product.samplePolicy?.available && (
              <section className="public-product-section public-product-sample">
                <h2>Samples available</h2>
                <p>{product.samplePolicy.price != null ? `Sample price: ₹${product.samplePolicy.price}` : ''}{product.samplePolicy.price != null && product.samplePolicy.leadTimeDays ? ' · ' : ''}{product.samplePolicy.leadTimeDays ? `Dispatch estimate: ${product.samplePolicy.leadTimeDays}${/^\d+$/.test(String(product.samplePolicy.leadTimeDays)) ? ' days' : ''}` : ''}</p>
              </section>
            )}
            {(product.customizationCapabilities?.hasLogoPrinting || product.customizationCapabilities?.hasCustomPackaging || product.customizationCapabilities?.hasCustomDesign) && (
              <section className="public-product-section">
                <h2>Customization options</h2>
                <div className="public-product-tags">
                  {product.customizationCapabilities.hasLogoPrinting && <span>Logo printing{product.customizationCapabilities.logoMinOrderQty ? ` · MOQ ${product.customizationCapabilities.logoMinOrderQty}` : ''}</span>}
                  {product.customizationCapabilities.hasCustomPackaging && <span>Custom packaging{product.customizationCapabilities.packagingMinOrderQty ? ` · MOQ ${product.customizationCapabilities.packagingMinOrderQty}` : ''}</span>}
                  {product.customizationCapabilities.hasCustomDesign && <span>Custom design / OEM</span>}
                </div>
              </section>
            )}
            {(Array.isArray(product.specifications) && product.specifications.length > 0 || Object.keys(product.dynamicAttributes || {}).length > 0) && (
              <section className="public-product-section">
                <h2>Technical specifications</h2>
                <div className="public-product-specs">
                  {(product.specifications || []).map((spec, index) => <div key={`spec-${index}`}><span>{spec.name || spec.key}</span><strong>{spec.value}</strong></div>)}
                  {Object.entries(product.dynamicAttributes || {}).map(([key, value]) => <div key={key}><span>{key}</span><strong>{String(value)}</strong></div>)}
                </div>
              </section>
            )}
            {product.packagingDetails && Object.values(product.packagingDetails).some(Boolean) && (
              <section className="public-product-section">
                <h2>Packaging and logistics</h2>
                <div className="public-product-specs">
                  {product.packagingDetails.packagingType && <div><span>Packaging type</span><strong>{product.packagingDetails.packagingType}</strong></div>}
                  {product.packagingDetails.unitsPerMasterCarton > 0 && <div><span>Units per carton</span><strong>{product.packagingDetails.unitsPerMasterCarton}</strong></div>}
                  {product.packagingDetails.cartonDimensions && <div><span>Carton dimensions</span><strong>{product.packagingDetails.cartonDimensions}</strong></div>}
                  {product.packagingDetails.grossWeightKg > 0 && <div><span>Gross weight</span><strong>{product.packagingDetails.grossWeightKg} kg</strong></div>}
                  {product.packagingDetails.dispatchHub && <div><span>Dispatch hub</span><strong>{product.packagingDetails.dispatchHub}</strong></div>}
                </div>
              </section>
            )}
            {(product.productionCapacity?.quantity > 0 || product.warranty?.durationMonths > 0 || product.storageSpecs?.shelfLifeMonths > 0 || product.certifications?.length > 0 || product.hsnCode) && (
              <section className="public-product-section">
                <h2>Supply, quality and care</h2>
                <div className="public-product-specs">
                  {product.productionCapacity?.quantity > 0 && <div><span>Production capacity</span><strong>{product.productionCapacity.quantity} {product.unit || ''} / {product.productionCapacity.frequency}</strong></div>}
                  {product.warranty?.durationMonths > 0 && <div><span>Warranty</span><strong>{product.warranty.durationMonths} months{product.warranty.warrantyType && product.warranty.warrantyType !== 'None' ? ` · ${product.warranty.warrantyType}` : ''}</strong></div>}
                  {product.storageSpecs?.shelfLifeMonths > 0 && <div><span>Shelf life</span><strong>{product.storageSpecs.shelfLifeMonths} months{product.storageSpecs.storageTemperature ? ` · ${product.storageSpecs.storageTemperature}` : ''}</strong></div>}
                  {product.hsnCode && <div><span>HSN</span><strong>{product.hsnCode}</strong></div>}
                  {Array.isArray(product.certifications) && product.certifications.length > 0 && <div><span>Seller-listed product certifications</span><strong>{product.certifications.join(', ')}</strong></div>}
                </div>
              </section>
            )}
            {product.description && <section className="public-product-section"><h2>Product overview</h2><p className="public-product-description">{product.description}</p></section>}
            {Array.isArray(product.descriptionSections) && product.descriptionSections.filter((section) => section?.title || section?.text || section?.content || section?.imageUrl).sort((a, b) => (a.order || 0) - (b.order || 0)).map((section, index) => (
              <section className="public-product-section" key={`description-section-${index}`}>
                {section.title && <h2>{section.title}</h2>}
                {(section.text || section.content) && <p className="public-product-description">{section.text || section.content}</p>}
                {section.imageUrl && <PortfolioImage src={resolveImageUrl(section.imageUrl)} alt={section.title || product.name} className="public-product-description-image" placeholderLabel="Product detail image not provided" />}
              </section>
            ))}
            {product.videoUrl && <section className="public-product-section"><h2>Product video</h2><YouTubePlayer videoUrl={product.videoUrl} title={product.name} showThumbnailFirst /></section>}
            {datasheetUrl && <section className="public-product-section"><h2>Technical documents</h2><a href={datasheetUrl} target="_blank" rel="noopener noreferrer">Open product datasheet ↗</a></section>}
            {sellerSlug && <a className="public-product-seller-link" href={`/p/${encodeURIComponent(sellerSlug)}${portfolioSource !== 'unknown' ? `?src=${encodeURIComponent(portfolioSource)}` : ''}#contact`}>View seller profile</a>}
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
