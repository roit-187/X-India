import { notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';
import { PhoneCall, MessageSquare, Mail, Globe, MapPin, FileCheck, ShieldCheck } from 'lucide-react';

export const metadata = { title: 'Contact & Channels — XINDIA' };

function maskGST(gst) {
  if (!gst || typeof gst !== 'string') return '';
  const clean = gst.trim();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 5)}•••••${clean.slice(-3)}`;
}

export default async function ContactPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const websiteUrl = seller.contact?.website || (seller.website ? seller.website : null);
  const formattedWebsite = websiteUrl && !websiteUrl.startsWith('http') ? `https://${websiteUrl}` : websiteUrl;

  const phone = seller.buyerContactPhone || seller.businessPhone || seller.contact?.phone;
  const whatsapp = seller.whatsappNumber || seller.contact?.whatsapp;
  const email = seller.contactMail || seller.companyEmail || seller.contact?.email;

  return (
    <div className="portfolio-container">
      <div className="portfolio-section-header">
        <div>
          <h2 className="portfolio-section-title">Verified Contact & Inquiries</h2>
          <p className="portfolio-section-desc">
            Direct channels to factory executive management and sales desks.
          </p>
        </div>
      </div>

      {seller.companyOwner && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#1E40AF' }}>
          <ShieldCheck size={18} color="#2563EB" />
          <span>
            Executive Desk: <strong>{seller.companyOwner}</strong> (Management & Commercial Sales)
          </span>
        </div>
      )}

      <div className="portfolio-contact-grid">
        {phone && (
          <div className="portfolio-contact-card">
            <div>
              <div className="portfolio-contact-label">Buyer Direct Desk</div>
              <div className="portfolio-contact-value portfolio-mono">{phone}</div>
            </div>
            <a href={`tel:${phone}`} className="portfolio-contact-link">
              <PhoneCall size={14} />
              <span>Call Direct Desk</span>
            </a>
          </div>
        )}

        {whatsapp && (
          <div className="portfolio-contact-card">
            <div>
              <div className="portfolio-contact-label">Official WhatsApp Channel</div>
              <div className="portfolio-contact-value portfolio-mono">{whatsapp}</div>
            </div>
            <a
              href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
              className="portfolio-contact-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#059669' }}
            >
              <MessageSquare size={14} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        )}

        {email && (
          <div className="portfolio-contact-card">
            <div>
              <div className="portfolio-contact-label">Corporate Email</div>
              <div className="portfolio-contact-value" style={{ wordBreak: 'break-all', fontSize: 14 }}>
                {email}
              </div>
            </div>
            <a href={`mailto:${email}`} className="portfolio-contact-link">
              <Mail size={14} />
              <span>Send Official Email</span>
            </a>
          </div>
        )}

        {formattedWebsite && (
          <div className="portfolio-contact-card">
            <div>
              <div className="portfolio-contact-label">Official Website</div>
              <div className="portfolio-contact-value" style={{ fontSize: 13.5, wordBreak: 'break-all' }}>
                {websiteUrl}
              </div>
            </div>
            <a
              href={formattedWebsite}
              className="portfolio-contact-link"
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: '#2563EB' }}
            >
              <Globe size={14} />
              <span>Visit Website ↗</span>
            </a>
          </div>
        )}

        {seller.address && (
          <div className="portfolio-contact-card">
            <div>
              <div className="portfolio-contact-label">Registered Plant Address</div>
              <div className="portfolio-contact-value" style={{ fontSize: 13, lineHeight: 1.5 }}>
                {seller.address}
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--p-text-muted)', fontWeight: 600 }}>
              <MapPin size={13} color="#64748B" />
              <span>Factory Verified Location</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── GSTIN Compliance Card ────────────────────────────────────────── */}
      {(seller.gstNumber || seller.gstVerified) && (
        <div className="portfolio-gst-card">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileCheck size={14} />
              Government Tax & GST Registration
            </div>
            <div className="portfolio-gst-num">
              {seller.gstNumber ? maskGST(seller.gstNumber) : 'GST Registered Entity'}
            </div>
          </div>
          <span className="portfolio-trust-badge" style={{ background: '#059669', color: '#FFFFFF', border: 'none' }}>
            ✓ Active & Verified
          </span>
        </div>
      )}
    </div>
  );
}
