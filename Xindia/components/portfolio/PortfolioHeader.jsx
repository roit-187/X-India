export default function PortfolioHeader({ seller }) {
  const verifiedDocs = seller.verifiedDocuments ? Object.keys(seller.verifiedDocuments) : [];
  const hasGst = seller.gstVerified || verifiedDocs.includes('gst');
  const hasIso = verifiedDocs.includes('iso') || (seller.certifications && seller.certifications.some(c => c.toLowerCase().includes('iso')));
  const hasMsme = verifiedDocs.includes('msme');

  return (
    <div className="portfolio-header">
      {seller.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={seller.coverImage} alt="" className="portfolio-cover" />
      ) : (
        <div className="portfolio-cover" />
      )}
      <div className="portfolio-header-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={seller.logo || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop'}
          alt={seller.name}
          className="portfolio-logo"
        />
        <div style={{ flex: 1 }}>
          <div className="portfolio-name-row">
            <h1 className="portfolio-name">{seller.name}</h1>
            {seller.verified && (
              <span className="portfolio-verified-badge">✓ Verified Supplier</span>
            )}
            {hasGst && (
              <span className="portfolio-trust-badge">✓ GST Verified</span>
            )}
            {hasIso && (
              <span className="portfolio-trust-badge">✓ ISO Certified</span>
            )}
            {hasMsme && (
              <span className="portfolio-trust-badge">✓ MSME Registered</span>
            )}
          </div>

          <div className="portfolio-header-tags">
            {seller.businessType && (
              <span className="portfolio-badge-pill">{seller.businessType}</span>
            )}
            {seller.legalStatus && (
              <span className="portfolio-badge-pill">{seller.legalStatus}</span>
            )}
            {Array.isArray(seller.categories) && seller.categories.map((cat) => (
              <span key={cat._id || cat.slug || cat} className="portfolio-cat-pill">
                {cat.name || cat}
              </span>
            ))}
          </div>

          {seller.location?.latitude !== undefined && seller.address && (
            <div className="portfolio-location">📍 {seller.address}</div>
          )}
        </div>
      </div>
    </div>
  );
}

