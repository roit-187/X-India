import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeller, getSellerProducts, getSellerOpportunity } from '@/lib/api';
import YouTubePlayer from '@/components/common/YouTubePlayer';

export default async function OverviewPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const [{ products }, opportunity] = await Promise.all([
    getSellerProducts(params.slug, { page: 1 }),
    getSellerOpportunity(params.slug),
  ]);
  const topProducts = (products || []).slice(0, 3);

  return (
    <div className="portfolio-container">
      <div className="portfolio-stats-grid">
        {seller.yearOfEstablishment && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.yearOfEstablishment}</div>
            <div className="portfolio-stat-label">Established</div>
          </div>
        )}
        {seller.employeesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.employeesCount}+</div>
            <div className="portfolio-stat-label">Employees</div>
          </div>
        )}
        {seller.factorySize && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.factorySize}</div>
            <div className="portfolio-stat-label">Factory Size</div>
          </div>
        )}
        {seller.exportPercentage && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.exportPercentage}</div>
            <div className="portfolio-stat-label">Export Share</div>
          </div>
        )}
        {seller.reviewCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.rating}★</div>
            <div className="portfolio-stat-label">{seller.reviewCount} Reviews</div>
          </div>
        )}
      </div>

      <h2 className="portfolio-section-title">About</h2>
      <p className="portfolio-prose" style={{ marginBottom: seller.introVideo ? 20 : 32 }}>
        {seller.portfolioAbout || seller.description || 'This seller has not added a description yet.'}
      </p>

      {seller.introVideo && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--p-text)' }}>
            Meet the Founder & Leadership
          </h3>
          <div style={{ maxWidth: 640, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--p-border)' }}>
            <YouTubePlayer videoUrl={seller.introVideo} />
          </div>
        </div>
      )}

      {topProducts.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Featured Products</h2>
          <div className="portfolio-product-grid" style={{ marginBottom: 32 }}>
            {topProducts.map((p) => (
              <div key={p._id} className="portfolio-product-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.name} className="portfolio-product-image" />
                <div className="portfolio-product-body">
                  <p className="portfolio-product-name">{p.name}</p>
                  <p className="portfolio-product-price">{p.price}</p>
                  <p className="portfolio-product-moq">MOQ: {p.moq}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/p/${params.slug}/products`} className="portfolio-nav-link" style={{ color: 'var(--p-blue)', padding: 0 }}>
            View all products →
          </Link>
        </>
      )}

      {opportunity && (
        <>
          <h2 className="portfolio-section-title" style={{ marginTop: 32 }}>Latest Business Opportunity</h2>
          <div className="portfolio-opportunity-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={opportunity.imageUrl} alt={opportunity.title} className="portfolio-opportunity-image" />
            <div className="portfolio-opportunity-body">
              <p className="portfolio-opportunity-title">{opportunity.title}</p>
              <p className="portfolio-opportunity-desc">{opportunity.description}</p>
              <Link href={`/p/${params.slug}/opportunities`} className="portfolio-nav-link" style={{ color: 'var(--p-blue)', padding: 0 }}>
                View details →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
