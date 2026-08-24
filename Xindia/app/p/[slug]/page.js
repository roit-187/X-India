import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeller, getSellerProducts, getSellerOpportunity } from '@/lib/api';
import YouTubePlayer from '@/components/common/YouTubePlayer';

const MASTER_CAPABILITY_ICONS = {
  'Custom Logo Printing': { icon: '🎨', desc: 'Screen, Pad & Laser engraving' },
  'Custom Mould Tooling': { icon: '📦', desc: 'CAD 3D design & precision moulds' },
  'Private Label Packaging': { icon: '🏷️', desc: 'Custom boxes, barcoding & inserts' },
  'Rapid Sample Dispatch': { icon: '⏱️', desc: 'Prototyping ready in 3-5 days' },
  'Quality Assurance': { icon: '🛡️', desc: '100% pre-dispatch batch audit' },
  'Global Export Delivery': { icon: '✈️', desc: 'FOB, CIF & door-to-door logistics' },
  'OEM / ODM Production': { icon: '⚙️', desc: 'Full custom design & manufacturing' },
  'Small Batch Sourcing': { icon: '📑', desc: 'Low MOQ trial orders supported' },
};

export default async function OverviewPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const [{ products }, opportunity] = await Promise.all([
    getSellerProducts(params.slug, { page: 1 }),
    getSellerOpportunity(params.slug),
  ]);
  const topProducts = (products || []).slice(0, 3);
  const capabilities = Array.isArray(seller.capabilities) && seller.capabilities.length > 0
    ? seller.capabilities
    : [
        'Custom Logo Printing',
        'Custom Mould Tooling',
        'Private Label Packaging',
        'Rapid Sample Dispatch',
        'Quality Assurance',
        'Global Export Delivery',
      ];

  return (
    <div className="portfolio-container">
      {/* ─── Stats Grid ────────────────────────────────────────────────────────── */}
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
        {seller.annualTurnover && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.annualTurnover}</div>
            <div className="portfolio-stat-label">Annual Turnover</div>
          </div>
        )}
        {seller.exportPercentage && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.exportPercentage}</div>
            <div className="portfolio-stat-label">Export Share</div>
          </div>
        )}
        {seller.marketCovered && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value" style={{ fontSize: 13, fontWeight: 700 }}>{seller.marketCovered}</div>
            <div className="portfolio-stat-label">Markets Covered</div>
          </div>
        )}
        {seller.reviewCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.rating}★</div>
            <div className="portfolio-stat-label">{seller.reviewCount} Reviews</div>
          </div>
        )}
      </div>

      {/* ─── About Section ────────────────────────────────────────────────────── */}
      <h2 className="portfolio-section-title">About the Manufacturer</h2>
      <p className="portfolio-prose" style={{ marginBottom: seller.introVideo ? 20 : 32 }}>
        {seller.portfolioAbout || seller.description || 'This seller has not added a description yet.'}
      </p>

      {/* ─── Primary Product Lines Tag Cloud ─────────────────────────────────── */}
      {Array.isArray(seller.primaryProducts) && seller.primaryProducts.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--p-text)' }}>
            Core Manufacturing Lines
          </h3>
          <div className="portfolio-tag-cloud">
            {seller.primaryProducts.map((p) => (
              <span key={p} className="portfolio-tag-chip">
                ✓ {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Video Tour & Founder Pitch ───────────────────────────────────────── */}
      {seller.introVideo && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--p-text)' }}>
            Meet the Founder & Leadership {seller.companyOwner ? `(${seller.companyOwner})` : ''}
          </h3>
          <p style={{ fontSize: 12.5, color: 'var(--p-text-med)', marginBottom: 12 }}>
            Official video introduction and executive manufacturing pitch
          </p>
          <div style={{ maxWidth: 640, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--p-border)' }}>
            <YouTubePlayer videoUrl={seller.introVideo} />
          </div>
        </div>
      )}

      {/* ─── Custom Sourcing & OEM Capabilities Grid ────────────────────────── */}
      {capabilities.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Custom Sourcing & OEM Capabilities</h2>
          <p style={{ fontSize: 13, color: 'var(--p-text-med)', marginTop: -6, marginBottom: 16 }}>
            Services offered for private label brands, bulk buyers, and contract manufacturing:
          </p>
          <div className="portfolio-capabilities-grid">
            {capabilities.map((cap) => {
              const meta = MASTER_CAPABILITY_ICONS[cap] || { icon: '⚙️', desc: 'Custom B2B manufacturing service' };
              return (
                <div key={cap} className="portfolio-cap-card">
                  <div className="portfolio-cap-header">
                    <div className="portfolio-cap-icon-box">{meta.icon}</div>
                    <span className="portfolio-cap-title">{cap}</span>
                  </div>
                  <span className="portfolio-cap-desc">{meta.desc}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── Featured Products ───────────────────────────────────────────────── */}
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
                  <p className="portfolio-product-price">
                    {p.price} {p.unit ? <span style={{ fontSize: 12, color: 'var(--p-text-med)' }}>/ {p.unit}</span> : ''}
                  </p>
                  <div className="portfolio-product-meta-row">
                    <p className="portfolio-product-moq">MOQ: {p.moq}</p>
                    {p.deliveryTime && (
                      <span className="portfolio-product-dispatch">⚡ {p.deliveryTime}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href={`/p/${params.slug}/products`} className="portfolio-nav-link" style={{ color: 'var(--p-blue)', padding: 0 }}>
            View all products →
          </Link>
        </>
      )}

      {/* ─── Business Opportunities ──────────────────────────────────────────── */}
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
