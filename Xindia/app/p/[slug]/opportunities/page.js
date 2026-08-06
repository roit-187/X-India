import { notFound } from 'next/navigation';
import { getSeller, getSellerOpportunities } from '@/lib/api';

export const metadata = { title: 'Business Opportunities' };

export default async function OpportunitiesPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const opportunities = await getSellerOpportunities(params.slug);

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Business Opportunities from {seller.name}</h2>

      {opportunities.length === 0 ? (
        <div className="portfolio-empty-state">This seller hasn&apos;t posted any business opportunities yet.</div>
      ) : (
        opportunities.map((op) => (
          <div key={op._id} className="portfolio-opportunity-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={op.imageUrl} alt={op.title} className="portfolio-opportunity-image" />
            <div className="portfolio-opportunity-body">
              <p className="portfolio-opportunity-title">{op.title}</p>
              <p className="portfolio-opportunity-desc">{op.description}</p>
              <div className="portfolio-opportunity-figures">
                <div>
                  <div className="portfolio-opportunity-figure-label">Investment</div>
                  <div className="portfolio-opportunity-figure-value portfolio-mono">₹{op.investment?.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="portfolio-opportunity-figure-label">Profit Range</div>
                  <div className="portfolio-opportunity-figure-value">{op.profitRange}</div>
                </div>
                <div>
                  <div className="portfolio-opportunity-figure-label">MOQ</div>
                  <div className="portfolio-opportunity-figure-value portfolio-mono">{op.moq}</div>
                </div>
                <div>
                  <div className="portfolio-opportunity-figure-label">Launch In</div>
                  <div className="portfolio-opportunity-figure-value portfolio-mono">{op.launchDays} days</div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
