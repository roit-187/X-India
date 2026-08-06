import { notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';

export const metadata = { title: 'Factory & Machinery' };

export default async function FactoryPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const photos = seller.manufacturingPlants || [];

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Factory & Machinery</h2>

      <div className="portfolio-stats-grid">
        {seller.factorySize && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.factorySize}</div>
            <div className="portfolio-stat-label">Factory Size</div>
          </div>
        )}
        {seller.machinesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.machinesCount}</div>
            <div className="portfolio-stat-label">Machines</div>
          </div>
        )}
        {seller.employeesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.employeesCount}</div>
            <div className="portfolio-stat-label">Employees</div>
          </div>
        )}
        {seller.monthlyCapacity && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.monthlyCapacity}</div>
            <div className="portfolio-stat-label">Monthly Capacity</div>
          </div>
        )}
      </div>

      {seller.factoryVideo && (
        <>
          <h2 className="portfolio-section-title">Factory Tour</h2>
          <div className="portfolio-video-wrap">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={seller.factoryVideo} controls preload="metadata" />
          </div>
        </>
      )}

      {photos.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Factory Photos</h2>
          <div className="portfolio-gallery-grid">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Factory" className="portfolio-gallery-img" />
            ))}
          </div>
        </>
      )}

      {seller.certifications?.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Certifications</h2>
          <div className="portfolio-stats-grid">
            {seller.certifications.map((c) => (
              <div key={c} className="portfolio-stat-card">
                <div className="portfolio-stat-label" style={{ fontWeight: 700, color: 'var(--p-text)' }}>{c}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {photos.length === 0 && !seller.factoryVideo && (
        <div className="portfolio-empty-state">No factory media added yet.</div>
      )}
    </div>
  );
}
