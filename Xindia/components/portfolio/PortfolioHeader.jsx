export default function PortfolioHeader({ seller }) {
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
        <div>
          <div className="portfolio-name-row">
            <h1 className="portfolio-name">{seller.name}</h1>
            {seller.verified && (
              <span className="portfolio-verified-badge">✓ Verified</span>
            )}
          </div>
          {seller.location?.latitude !== undefined && seller.address && (
            <div className="portfolio-location">{seller.address}</div>
          )}
        </div>
      </div>
    </div>
  );
}
