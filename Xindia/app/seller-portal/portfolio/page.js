'use client';

import { useState, useEffect, useCallback } from 'react';
import PortfolioEditForm from '@/components/seller-portal/PortfolioEditForm';
import Badge from '@/components/admin/Badge';
import Modal from '@/components/admin/Modal';
import QRCode from 'qrcode';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://xindia.com');

export default function SellerPortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Publish / Unpublish states
  const [publishing, setPublishing] = useState(false);
  const [unpublishModal, setUnpublishModal] = useState(false);
  const [publishSuccessUrl, setPublishSuccessUrl] = useState('');
  const [publishError, setPublishError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [portRes, statRes] = await Promise.all([
        fetch('/api/seller/portfolio'),
        fetch('/api/seller/dashboard/stats'),
      ]);

      const portData = await portRes.json();
      const statData = await statRes.json();

      if (portData.success) {
        setPortfolio(portData.manufacturer);
      } else {
        setError(portData.message || 'Failed to load portfolio');
      }

      if (statData.success) {
        setStats(statData);
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Re-generate QR if portfolio is already published and has a slug
  useEffect(() => {
    if (portfolio?.portfolioStatus === 'published' && portfolio?.slug && !qrDataUrl) {
      const url = portfolio.url || `${SITE_URL}/p/${portfolio.slug}`;
      QRCode.toDataURL(url, { width: 200, margin: 1 })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch(console.error);
    }
  }, [portfolio, qrDataUrl]);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    setPublishSuccessUrl('');
    setQrDataUrl('');

    try {
      const res = await fetch('/api/seller/portfolio/publish', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const liveUrl = data.url || `${SITE_URL}/p/${data.slug}`;
        setPublishSuccessUrl(liveUrl);

        // Generate QR code from the published URL
        try {
          const dataUrl = await QRCode.toDataURL(liveUrl, { width: 200, margin: 1 });
          setQrDataUrl(dataUrl);
        } catch (qrErr) {
          console.error('QR generation failed:', qrErr);
        }

        loadData();
      } else {
        if (data.missingFields) {
          setPublishError(`Missing required fields: ${data.missingFields.join(', ')}`);
        } else if (data.code === 'PLAN_REQUIRED') {
          setPublishError(data.message || 'Plan required to publish portfolio.');
        } else {
          setPublishError(data.message || 'Failed to publish portfolio');
        }
      }
    } catch (err) {
      console.error(err);
      setPublishError('Publish failed due to network error');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      const res = await fetch('/api/seller/portfolio/unpublish', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setUnpublishModal(false);
        setQrDataUrl('');
        loadData();
      } else {
        alert(data.message || 'Failed to unpublish');
      }
    } catch (err) {
      console.error(err);
      alert('Unpublish failed');
    }
  };

  if (loading) return <p>Loading portfolio...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;

  const canPublish = stats ? stats.completedCount >= stats.totalRequired : false;
  const isPublished = portfolio?.portfolioStatus === 'published';

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Business Portfolio</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <Badge label={isPublished ? 'Published' : 'Draft'} variant={isPublished ? 'published' : 'draft'} />
            {portfolio?.slug && (
              <span style={{ fontSize: 13, color: '#64748B' }}>
                Slug: <strong>{portfolio.slug}</strong>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {isPublished ? (
            <button className="seller-btn seller-btn-danger" onClick={() => setUnpublishModal(true)}>
              Unpublish Portfolio
            </button>
          ) : (
            <button
              className="seller-btn seller-btn-primary"
              onClick={handlePublish}
              disabled={!canPublish || publishing}
            >
              {publishing ? 'Publishing...' : 'Publish Portfolio'}
            </button>
          )}
        </div>
      </div>

      {publishError && (
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {publishError}
        </div>
      )}

      {/* Publish Success Banner with QR Code */}
      {publishSuccessUrl && (
        <div style={{ background: '#D1FAE5', border: '1px solid #10B981', color: '#047857', padding: 20, borderRadius: 12, marginBottom: 16, fontSize: 14 }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🎉 Your portfolio is live!</div>
              <div style={{ marginBottom: 12 }}>
                Share this link with buyers:{' '}
                <a href={publishSuccessUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#047857', fontWeight: 700, wordBreak: 'break-all' }}>
                  {publishSuccessUrl}
                </a>
              </div>
            </div>
            {qrDataUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img src={qrDataUrl} alt="Portfolio QR Code" style={{ width: 160, height: 160, borderRadius: 8, border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <a
                  href={qrDataUrl}
                  download="portfolio-qr.png"
                  style={{ background: '#047857', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
                >
                  ⬇ Download QR Code
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code for already-published portfolio */}
      {isPublished && qrDataUrl && !publishSuccessUrl && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: '#15803D', marginBottom: 4 }}>Portfolio QR Code</div>
            <div style={{ fontSize: 13, color: '#166534' }}>Share or print this QR code to let buyers discover your portfolio instantly.</div>
            <a
              href={portfolio.url || `${SITE_URL}/p/${portfolio.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 8, fontSize: 12, color: '#047857', fontWeight: 600, wordBreak: 'break-all' }}
            >
              {(portfolio.url || `${SITE_URL}/p/${portfolio.slug}`).replace(/^https?:\/\//, '')}
            </a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <img src={qrDataUrl} alt="Portfolio QR Code" style={{ width: 130, height: 130, borderRadius: 8 }} />
            <a
              href={qrDataUrl}
              download="portfolio-qr.png"
              style={{ background: '#15803D', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
            >
              ⬇ Download QR
            </a>
          </div>
        </div>
      )}

      {!canPublish && !isPublished && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
          Complete all mandatory sections (About, Buyer Phone, Address, Logo, 5+ Factory Photos) to enable publishing.
        </div>
      )}

      <div className="seller-card">
        <PortfolioEditForm
          initialData={portfolio}
          mandatoryStatus={stats?.mandatoryFieldsComplete}
          onUpdateSuccess={() => loadData()}
        />
      </div>

      {/* Unpublish Modal */}
      <Modal open={unpublishModal} onClose={() => setUnpublishModal(false)} title="Unpublish Portfolio">
        <p style={{ marginBottom: 16 }}>This will take your portfolio offline and hide it from potential buyers until republished.</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="seller-btn seller-btn-secondary" onClick={() => setUnpublishModal(false)}>Cancel</button>
          <button className="seller-btn seller-btn-danger" onClick={handleUnpublish}>Unpublish</button>
        </div>
      </Modal>
    </div>
  );
}
