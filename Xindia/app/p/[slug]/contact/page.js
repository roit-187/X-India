import { notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';

export const metadata = { title: 'Contact Us' };

export default async function ContactPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Contact {seller.name}</h2>

      <div className="portfolio-contact-grid">
        {seller.buyerContactPhone && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Phone</div>
            <div className="portfolio-contact-value portfolio-mono">{seller.buyerContactPhone}</div>
            <a href={`tel:${seller.buyerContactPhone}`} className="portfolio-contact-link">Call Now</a>
          </div>
        )}
        {seller.contact?.whatsapp && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">WhatsApp</div>
            <div className="portfolio-contact-value portfolio-mono">{seller.contact.whatsapp}</div>
            <a href={`https://wa.me/${seller.contact.whatsapp.replace(/[^0-9]/g, '')}`} className="portfolio-contact-link" target="_blank" rel="noopener noreferrer">
              Message on WhatsApp
            </a>
          </div>
        )}
        {seller.contact?.email && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Email</div>
            <div className="portfolio-contact-value">{seller.contact.email}</div>
            <a href={`mailto:${seller.contact.email}`} className="portfolio-contact-link">Send Email</a>
          </div>
        )}
        {seller.address && (
          <div className="portfolio-contact-card">
            <div className="portfolio-contact-label">Factory Address</div>
            <div className="portfolio-contact-value" style={{ fontSize: 13 }}>{seller.address}</div>
          </div>
        )}
      </div>
    </div>
  );
}
