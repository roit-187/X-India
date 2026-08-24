import { notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';

export const metadata = { title: 'Contact Us — XINDIA' };

function maskGST(gst) {
  if (!gst || typeof gst !== 'string') return '';
  const clean = gst.trim();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 5)}•••••${clean.slice(-3)}`;
}

export default async function ContactPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const websiteUrl = seller.contact?.website || (seller.contact?.email ? null : null);
  const formattedWebsite = websiteUrl && !websiteUrl.startsWith('http') ? `https://${websiteUrl}` : websiteUrl;

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Contact & Verified Channels</h2>
      {seller.companyOwner && (
        <p style={{ fontSize: 13, color: 'var(--p-text-med)', marginTop: -6, marginBottom: 16 }}>
          Direct Desk: <strong style={{ color: 'var(--p-text)' }}>{seller.companyOwner}</strong> (Management & Sales)
        </p>
      )}

      <div className="portfolio-contact-grid">
        {seller.buyerContactPhone && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Buyer Direct Desk</div>
            <div className="portfolio-contact-value portfolio-mono">{seller.buyerContactPhone}</div>
            <a href={`tel:${seller.buyerContactPhone}`} className="portfolio-contact-link">Call Now</a>
          </div>
        )}
        {seller.contact?.whatsapp && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Official WhatsApp Desk</div>
            <div className="portfolio-contact-value portfolio-mono">{seller.contact.whatsapp}</div>
            <a href={`https://wa.me/${seller.contact.whatsapp.replace(/[^0-9]/g, '')}`} className="portfolio-contact-link" target="_blank" rel="noopener noreferrer">
              Message on WhatsApp
            </a>
          </div>
        )}
        {seller.contact?.email && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Corporate Email</div>
            <div className="portfolio-contact-value" style={{ wordBreak: 'break-all', fontSize: 14 }}>{seller.contact.email}</div>
            <a href={`mailto:${seller.contact.email}`} className="portfolio-contact-link">Send Email</a>
          </div>
        )}
        {formattedWebsite && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Official Corporate Website</div>
            <div className="portfolio-contact-value" style={{ fontSize: 13.5, wordBreak: 'break-all' }}>{seller.contact?.website}</div>
            <a href={formattedWebsite} className="portfolio-contact-link" target="_blank" rel="noopener noreferrer" style={{ background: 'var(--p-blue)' }}>
              Visit Website ↗
            </a>
          </div>
        )}
        {seller.address && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Registered Factory Address</div>
            <div className="portfolio-contact-value" style={{ fontSize: 13, lineHeight: 1.5 }}>{seller.address}</div>
          </div>
        )}
      </div>

      {/* ─── GSTIN Compliance Card ────────────────────────────────────────────── */}
      {(seller.gstNumber || seller.gstVerified) && (
        <div className="portfolio-gst-card">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--p-text-med)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Government Tax & GST Registration
            </div>
            <div className="portfolio-gst-num">
              {seller.gstNumber ? maskGST(seller.gstNumber) : 'GST Registered Entity'}
            </div>
          </div>
          <span className="portfolio-trust-badge">
            ✓ Active & Verified
          </span>
        </div>
      )}
    </div>
  );
}
