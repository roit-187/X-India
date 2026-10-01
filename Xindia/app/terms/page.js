import '../privacy-policy/privacy.css';
import Link from 'next/link';
import { getLegalDocument } from '@/lib/api';
import DynamicGrievanceCard from '@/components/legal/DynamicGrievanceCard';

export const revalidate = 60;

export const metadata = {
  title: 'Terms & Conditions | XIndia B2B Marketplace',
  description: 'Official Master Terms of Service and User Agreement for XIndia marketplace buyers, suppliers, and industrial manufacturers.',
  alternates: {
    canonical: 'https://xindia.live/terms',
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

export default async function TermsPage({ searchParams }) {
  const lang = searchParams?.lang === 'hi' ? 'hi' : 'en';
  const doc = await getLegalDocument('BUYER_TERMS', lang);

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
            OFFICIAL B2B USER AGREEMENT • v{version}
          </span>
          <h1>Terms &amp; Conditions</h1>
          <p className="privacy-effective">
            Last Updated &amp; Effective Date: {effectiveDate} | Version: {version}
          </p>
        </div>

        {/* Legal Navigation Tabs */}
        <nav className="legal-nav-tabs" aria-label="Legal documents">
          <Link href="/privacy-policy" className="legal-nav-tab">
            Privacy Policy
          </Link>
          <Link href="/terms" className="legal-nav-tab active">
            Terms &amp; Conditions
          </Link>
          <Link href="/seller-agreement" className="legal-nav-tab">
            Seller Agreement
          </Link>
          <Link href="/dpa" className="legal-nav-tab">
            Data Processing Agreement
          </Link>
        </nav>

        {/* Language selector if available */}
        {doc?.availableLanguages && doc.availableLanguages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', alignSelf: 'center' }}>Language:</span>
            <Link
              href="/terms?lang=en"
              style={{
                fontSize: '12px',
                fontWeight: lang === 'en' ? 700 : 500,
                color: lang === 'en' ? '#FF8533' : '#94A3B8',
                padding: '4px 10px',
                borderRadius: '6px',
                background: lang === 'en' ? 'rgba(255,102,0,0.1)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              English
            </Link>
            <Link
              href="/terms?lang=hi"
              style={{
                fontSize: '12px',
                fontWeight: lang === 'hi' ? 700 : 500,
                color: lang === 'hi' ? '#FF8533' : '#94A3B8',
                padding: '4px 10px',
                borderRadius: '6px',
                background: lang === 'hi' ? 'rgba(255,102,0,0.1)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              हिन्दी (Hindi)
            </Link>
          </div>
        )}

        {/* Dynamic Content from MongoDB */}
        {doc?.content ? (
          <article
            className="privacy-card privacy-dynamic-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(doc.content) }}
          />
        ) : (
          /* Resilient Fallback Section */
          <div className="privacy-card privacy-dynamic-content">
            <h2>1. Introduction &amp; Acceptance of Terms</h2>
            <p>
              Welcome to <strong>XIndia</strong>, operated by <strong>XIndia Technologies Private Limited</strong>.
              By accessing the platform or submitting Requests for Quotations (RFQs), you enter into a binding electronic agreement under Section 10A of the Information Technology Act, 2000.
            </p>
            <hr />
            <h2>2. Intermediary Status &amp; Commercial Disclaimers</h2>
            <p>
              XIndia operates as a technology discovery intermediary under Section 79 of the IT Act, 2000. XIndia is not a party to bilateral purchase orders, manufacturing contracts, or logistics agreements concluded between users.
            </p>
            <hr />
            <h2>3. Limitation of Liability &amp; Indemnity</h2>
            <p>
              In no event shall XIndia’s total aggregate liability exceed the fees paid by you to XIndia in the preceding three (3) months or INR ₹5,000. Users agree to indemnify XIndia against any third-party claims arising from uploaded listings, defective deliveries, or intellectual property violations.
            </p>
            <hr />
            <h2>4. Dispute Resolution &amp; Mandatory Arbitration</h2>
            <p>
              Any dispute arising out of or in connection with these Terms shall be referred to and finally resolved by binding arbitration under the Arbitration and Conciliation Act, 1996 by a Sole Arbitrator in New Delhi, India.
            </p>
            <hr />
            <h2>5. Grievance Redressal Mechanism</h2>
            <div className="contact-details">
              <p><strong>Platform:</strong> XIndia Technologies Private Limited</p>
              <p><strong>Grievance Officer:</strong> Compliance &amp; Grievance Redressal Officer</p>
              <p><strong>Address:</strong> Connaught Place, New Delhi 110001, India</p>
              <p><strong>Email:</strong> <a href="mailto:grievance@xindia.live">grievance@xindia.live</a></p>
              <p><strong>Support Portal:</strong> <Link href="/contact">https://xindia.live/contact</Link></p>
            </div>
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
