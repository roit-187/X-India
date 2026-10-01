import '../privacy-policy/privacy.css';
import Link from 'next/link';
import { getLegalDocument } from '@/lib/api';

export const revalidate = 60;

export const metadata = {
  title: 'Data Processing Agreement (DPA) | XIndia B2B Marketplace',
  description: 'Official Data Processing Agreement and Buyer Confidentiality Covenants under Section 8 of the DPDP Act 2023 for XIndia sellers.',
  alternates: {
    canonical: 'https://xindia.live/dpa',
  },
};

function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<form\b[^>]*>/gi, '')
    .replace(/<(?:base|meta|link)\b[^>]*>/gi, '');
}

export default async function DPAPage({ searchParams }) {
  const lang = searchParams?.lang === 'hi' ? 'hi' : 'en';
  const doc = await getLegalDocument('SELLER_DPA', lang);

  const version = doc?.version || '2.1.0';
  const effectiveDate = doc?.effectiveDate
    ? new Date(doc.effectiveDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'October 1, 2026';

  return (
    <div className="privacy-page">
      <header className="privacy-header">
        <div className="privacy-container header-inner">
          <Link href="/" className="privacy-logo">
            <span>X</span>INDIA
          </Link>
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="privacy-container privacy-content">
        <div className="privacy-hero">
          <span className="privacy-badge">
            DPDP ACT 2023 DATA COVENANT • v{version}
          </span>
          <h1>Data Processing Agreement</h1>
          <p className="privacy-effective">
            Last Updated &amp; Effective Date: {effectiveDate} | Version: {version}
          </p>
        </div>

        {/* Legal Navigation Tabs */}
        <nav className="legal-nav-tabs" aria-label="Legal documents">
          <Link href="/privacy-policy" className="legal-nav-tab">
            Privacy Policy
          </Link>
          <Link href="/terms" className="legal-nav-tab">
            Terms &amp; Conditions
          </Link>
          <Link href="/seller-agreement" className="legal-nav-tab">
            Seller Agreement
          </Link>
          <Link href="/dpa" className="legal-nav-tab active">
            Data Processing Agreement
          </Link>
        </nav>

        {/* Dynamic Content from MongoDB */}
        {doc?.content ? (
          <article
            className="privacy-card privacy-dynamic-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(doc.content) }}
          />
        ) : (
          <div className="privacy-card privacy-dynamic-content">
            <h2>1. Purpose &amp; Legal Relationship</h2>
            <p>
              This Agreement governs the processing of buyer personal data and proprietary technical documents by registered sellers on XIndia.
              Upon receiving inquiry details, sellers act as Independent Data Fiduciaries bound by Section 8 of the DPDP Act 2023.
            </p>
            <hr />
            <h2>2. Processing Restrictions &amp; 24-Hour Breach Notification</h2>
            <p>
              Sellers are strictly prohibited from reselling or distributing buyer data to third-party telemarketing networks, and must notify XIndia within 24 hours of any suspected data breach.
            </p>
          </div>
        )}
      </main>

      <footer className="privacy-footer">
        <div className="privacy-container">
          <p>&copy; {new Date().getFullYear()} XIndia Technologies Private Limited. All rights reserved. Connecting verified Indian manufacturers and buyers.</p>
        </div>
      </footer>
    </div>
  );
}
