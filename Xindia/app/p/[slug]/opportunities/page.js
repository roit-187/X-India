import { notFound } from 'next/navigation';
import { getSeller, getSellerOpportunities } from '@/lib/api';
import { Briefcase, IndianRupee, TrendingUp, Package, Clock } from 'lucide-react';

export const metadata = { title: 'Business & Contract Opportunities — XINDIA' };

export default async function OpportunitiesPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const opportunities = await getSellerOpportunities(params.slug);

  return (
    <div className="portfolio-container">
      <div className="portfolio-section-header">
        <div>
          <h2 className="portfolio-section-title">Business & Contract Opportunities</h2>
          <p className="portfolio-section-desc">
            Direct production lines open for new brand launches, high-margin partnerships, and distribution.
          </p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="portfolio-empty-state">
          <Briefcase size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
          <div>This seller hasn&apos;t posted any active contract manufacturing opportunities yet.</div>
        </div>
      ) : (
        opportunities.map((op) => (
          <div key={op._id} className="portfolio-opportunity-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={op.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop'}
              alt={op.title}
              className="portfolio-opportunity-image"
            />
            <div className="portfolio-opportunity-body">
              <h3 className="portfolio-opportunity-title">{op.title}</h3>
              <p className="portfolio-opportunity-desc">{op.description}</p>
              
              <div className="portfolio-opportunity-figures">
                <div>
                  <div className="portfolio-opportunity-figure-label">Estimated Investment</div>
                  <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: 'var(--p-primary)' }}>
                    ₹{op.investment?.toLocaleString('en-IN') || '0'}
                  </div>
                </div>
                <div>
                  <div className="portfolio-opportunity-figure-label">Profit Potential</div>
                  <div className="portfolio-opportunity-figure-value" style={{ color: '#059669' }}>
                    {op.profitRange || '30% – 50%'}
                  </div>
                </div>
                <div>
                  <div className="portfolio-opportunity-figure-label">Minimum Batch (MOQ)</div>
                  <div className="portfolio-opportunity-figure-value portfolio-mono">
                    {op.moq || '100 Units'}
                  </div>
                </div>
                <div>
                  <div className="portfolio-opportunity-figure-label">Launch Turnaround</div>
                  <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: '#2563EB' }}>
                    {op.launchDays ? `${op.launchDays} days` : '7-10 days'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
