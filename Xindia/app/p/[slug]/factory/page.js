import { notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';
import YouTubePlayer from '@/components/common/YouTubePlayer';

export const metadata = { title: 'Factory & Machinery — XINDIA' };

export default async function FactoryPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const photos = seller.manufacturingPlants || [];
  const factories = Array.isArray(seller.factories) ? seller.factories : [];

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Factory Infrastructure & Capacity</h2>

      {/* ─── Core Specs ────────────────────────────────────────────────────────── */}
      <div className="portfolio-stats-grid">
        {seller.factorySize && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.factorySize}</div>
            <div className="portfolio-stat-label">Plant Space</div>
          </div>
        )}
        {seller.machinesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.machinesCount}</div>
            <div className="portfolio-stat-label">Heavy Machines</div>
          </div>
        )}
        {seller.employeesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.employeesCount}</div>
            <div className="portfolio-stat-label">Skilled Staff</div>
          </div>
        )}
        {seller.monthlyCapacity && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-value portfolio-mono">{seller.monthlyCapacity}</div>
            <div className="portfolio-stat-label">Monthly Production</div>
          </div>
        )}
      </div>

      {/* ─── Factory Machinery Story / Narrative ──────────────────────────────── */}
      {seller.aboutFactory && (
        <>
          <h2 className="portfolio-section-title">Machinery & Process Capabilities</h2>
          <div className="portfolio-factory-story">
            <p>{seller.aboutFactory}</p>
          </div>
        </>
      )}

      {/* ─── Factory Tour Video ────────────────────────────────────────────────── */}
      {seller.factoryVideo && (
        <div style={{ marginBottom: 32 }}>
          <h2 className="portfolio-section-title">Official Factory Tour</h2>
          <div style={{ maxWidth: 640, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--p-border)' }}>
            <YouTubePlayer
              videoUrl={seller.factoryVideo}
              title={`${seller.name || 'Factory'} Tour Video`}
            />
          </div>
        </div>
      )}

      {/* ─── Multi-Unit Production Facilities ──────────────────────────────────── */}
      {factories.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Production Units & Workshop Facilities</h2>
          <div className="portfolio-units-grid">
            {factories.map((unit, idx) => (
              <div key={idx} className="portfolio-unit-card">
                {unit.factoryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={unit.factoryImage} alt={unit.name || 'Factory Unit'} className="portfolio-unit-img" />
                ) : (
                  <div style={{ height: 120, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontWeight: 700 }}>
                    🏭 {unit.name || `Unit ${idx + 1}`}
                  </div>
                )}
                <div className="portfolio-unit-body">
                  <div className="portfolio-unit-name">{unit.name || `Plant Unit ${idx + 1}`}</div>
                  {unit.category && <div className="portfolio-unit-cat">Specialization: {unit.category}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── Factory Photos Gallery ────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Plant & Workshop Photos</h2>
          <div className="portfolio-gallery-grid" style={{ marginBottom: 32 }}>
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="Factory Machinery" className="portfolio-gallery-img" />
            ))}
          </div>
        </>
      )}

      {/* ─── Compliance Certifications ────────────────────────────────────────── */}
      {seller.certifications?.length > 0 && (
        <>
          <h2 className="portfolio-section-title">Certifications & Quality Seals</h2>
          <div className="portfolio-stats-grid">
            {seller.certifications.map((c) => (
              <div key={c} className="portfolio-stat-card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🛡️</span>
                <div className="portfolio-stat-label" style={{ fontWeight: 700, color: 'var(--p-text)', fontSize: 13 }}>
                  {c}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {photos.length === 0 && !seller.factoryVideo && !seller.aboutFactory && factories.length === 0 && (
        <div className="portfolio-empty-state">No factory media added yet.</div>
      )}
    </div>
  );
}
