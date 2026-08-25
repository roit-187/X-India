import { notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import { Factory, Cpu, Users, Layers, Video, Image as ImageIcon, Building } from 'lucide-react';

export const metadata = { title: 'Factory Infrastructure & Capacity — XINDIA' };

export default async function FactoryPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const photos = seller.manufacturingPlants || [];
  const factories = Array.isArray(seller.factories) ? seller.factories : [];

  return (
    <div className="portfolio-container">
      <div className="portfolio-section-header">
        <div>
          <h2 className="portfolio-section-title">Factory Infrastructure & Capacity</h2>
          <p className="portfolio-section-desc">
            Industrial machinery, workshop floor area, and certified production lines.
          </p>
        </div>
      </div>

      {/* ─── Core Specs Grid ─────────────────────────────────────────────────── */}
      <div className="portfolio-stats-grid">
        {seller.factorySize && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <Factory size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.factorySize}</div>
              <div className="portfolio-stat-label">Plant Space</div>
            </div>
          </div>
        )}
        {seller.machinesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
              <Cpu size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.machinesCount}</div>
              <div className="portfolio-stat-label">Heavy Machines</div>
            </div>
          </div>
        )}
        {seller.employeesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.employeesCount}</div>
              <div className="portfolio-stat-label">Skilled Staff</div>
            </div>
          </div>
        )}
        {seller.monthlyCapacity && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <Layers size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.monthlyCapacity}</div>
              <div className="portfolio-stat-label">Monthly Production</div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Machinery Story ─────────────────────────────────────────────────── */}
      {seller.aboutFactory && (
        <div style={{ marginBottom: 36 }}>
          <h2 className="portfolio-section-title">Machinery & Process Capabilities</h2>
          <div className="portfolio-about-box">
            <p className="portfolio-prose">{seller.aboutFactory}</p>
          </div>
        </div>
      )}

      {/* ─── Factory Video Tour ──────────────────────────────────────────────── */}
      {seller.factoryVideo && (
        <div className="portfolio-cinema-card">
          <div className="portfolio-cinema-head">
            <div className="portfolio-cinema-title">
              <Video size={16} color="#FF6B2E" />
              <span>Official Factory Tour Video</span>
            </div>
            <span className="portfolio-cinema-badge">Verified Tour</span>
          </div>
          <div className="portfolio-cinema-body">
            <YouTubePlayer
              videoUrl={seller.factoryVideo}
              title={`${seller.name} Factory Tour`}
            />
          </div>
        </div>
      )}

      {/* ─── Multi-Unit Production Facilities ────────────────────────────────── */}
      {factories.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <h2 className="portfolio-section-title">Production Units & Workshops</h2>
          <div className="portfolio-units-grid">
            {factories.map((unit, idx) => (
              <div key={idx} className="portfolio-unit-card">
                {unit.factoryImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={unit.factoryImage} alt={unit.name || 'Factory Unit'} className="portfolio-unit-img" />
                ) : (
                  <div style={{ height: 140, background: '#F1F5F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B', gap: 6 }}>
                    <Building size={28} color="#94A3B8" />
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{unit.name || `Unit ${idx + 1}`}</span>
                  </div>
                )}
                <div className="portfolio-unit-body">
                  <div className="portfolio-unit-name">{unit.name || `Plant Unit ${idx + 1}`}</div>
                  {unit.category && <div className="portfolio-unit-cat">Specialization: {unit.category}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Plant & Workshop Photos Gallery ─────────────────────────────────── */}
      {photos.length > 0 && (
        <div>
          <h2 className="portfolio-section-title">Plant & Workshop Photos</h2>
          <div className="portfolio-gallery-grid">
            {photos.map((url, idx) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={idx}
                src={url}
                alt={`${seller.name} Workshop Photo ${idx + 1}`}
                className="portfolio-gallery-img"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
