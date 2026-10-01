import '../privacy-policy/privacy.css';
import Link from 'next/link';
import { getLegalDocument } from '@/lib/api';
import DynamicGrievanceCard from '@/components/legal/DynamicGrievanceCard';

export const revalidate = 60;

export const metadata = {
  title: 'Seller Agreement | XIndia B2B Marketplace',
  description: 'Official Seller Marketplace Agreement and Catalog Listing Rules for industrial manufacturers and suppliers on XIndia.',
  alternates: {
    canonical: 'https://xindia.live/seller-agreement',
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

export default async function SellerAgreementPage({ searchParams }) {
  const lang = searchParams?.lang === 'hi' ? 'hi' : 'en';
  const doc = await getLegalDocument('SELLER_TERMS', lang);

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
            MANUFACTURER MARKETPLACE AGREEMENT • v{version}
          </span>
          <h1>Seller Agreement</h1>
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
          <Link href="/seller-agreement" className="legal-nav-tab active">
            Seller Agreement
          </Link>
          <Link href="/dpa" className="legal-nav-tab">
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
            <h2>1. Manufacturer Eligibility &amp; Verification</h2>
            <p>
              To list as an industrial manufacturer on XIndia, you must provide valid business verification documents (GSTIN, Udyam Registration, or Incorporation Certificate) and hold all active statutory licenses required under Indian law.
            </p>
            <hr />
            <h2>2. Catalog Accuracy &amp; Ranking Transparency</h2>
            <p>
              Under Rule 5(4) of the Consumer Protection (E-Commerce) Rules 2020, catalog rankings are determined by profile completeness, buyer response speed, verified credentials, and active subscription tiers.
            </p>
          </div>
        )}

        {/* Live Dynamic Statutory Grievance Redressal Card */}
        <DynamicGrievanceCard />
      </main>

      <footer className="privacy-footer">
        <div className="privacy-container">
          <p>&copy; {new Date().getFullYear()} XIndia Technologies Private Limited. All rights reserved. Connecting verified Indian manufacturers and buyers.</p>
        </div>
      </footer>
    </div>
  );
}
