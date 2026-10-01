import './privacy.css';
import Link from 'next/link';
import { getLegalDocument } from '@/lib/api';
import DynamicGrievanceCard from '@/components/legal/DynamicGrievanceCard';

export const revalidate = 60;

export const metadata = {
  title: 'Privacy Policy | XIndia B2B Marketplace',
  description: 'Digital Personal Data Protection (DPDP) Act 2023 and Google Play Store compliant Privacy Policy for XIndia marketplace buyers, suppliers, and industrial manufacturers.',
  alternates: {
    canonical: 'https://xindia.live/privacy-policy',
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

export default async function PrivacyPolicyPage({ searchParams }) {
  const lang = searchParams?.lang === 'hi' ? 'hi' : 'en';
  const doc = await getLegalDocument('BUYER_PRIVACY', lang);

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
            DPDP ACT 2023 & GOOGLE PLAY STORE COMPLIANT • v{version}
          </span>
          <h1>Privacy Policy</h1>
          <p className="privacy-effective">
            Last Updated &amp; Effective Date: {effectiveDate} | Version: {version}
          </p>
        </div>

        {/* Legal Navigation Tabs */}
        <nav className="legal-nav-tabs" aria-label="Legal documents">
          <Link href="/privacy-policy" className="legal-nav-tab active">
            Privacy Policy
          </Link>
          <Link href="/terms" className="legal-nav-tab">
            Terms &amp; Conditions
          </Link>
          <Link href="/seller-agreement" className="legal-nav-tab">
            Seller Agreement
          </Link>
          <Link href="/dpa" className="legal-nav-tab">
            Data Processing Agreement
          </Link>
        </nav>

        {/* Language selector for Section 5(3) DPDP compliance */}
        {doc?.availableLanguages && doc.availableLanguages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#64748B', alignSelf: 'center' }}>Language:</span>
            <Link
              href="/privacy-policy?lang=en"
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
              href="/privacy-policy?lang=hi"
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
            <h2>1. Overview &amp; Data Fiduciary Details</h2>
            <p>
              This Privacy Policy governs the collection, processing, storage, transfer, and erasure of personal data by <strong>XIndia Technologies Private Limited</strong> (“XIndia”, “we”, “us”, or “our”) when you use our web portal (https://xindia.live) and mobile applications.
            </p>
            <p>
              Under Section 2(i) of the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, XIndia acts as the <em>Data Fiduciary</em> responsible for determining the purpose and means of processing personal data on the Platform.
            </p>
            <hr />
            <h2>2. Personal &amp; Commercial Data We Collect</h2>
            <ul>
              <li><strong>Identity &amp; Contact Data:</strong> Legal name, verified mobile phone number (OTP verified), corporate email address, enterprise designation, and hashed authentication credentials.</li>
              <li><strong>KYC &amp; Enterprise Verification Data:</strong> GSTIN, PAN, Udyam Registration, factory addresses, and industrial premises verification media.</li>
              <li><strong>Commercial &amp; Transaction Data:</strong> Sourcing requirements, RFQs, quotation messages, and Razorpay/Google Play transaction IDs. We never collect or store card numbers or UPI PINs.</li>
              <li><strong>Technical &amp; Telemetry Data:</strong> IP address, device model, OS version, approximate city location, and Firebase Cloud Messaging (FCM) tokens.</li>
            </ul>
            <hr />
            <h2>3. Data Principal Rights &amp; DPBI Redressal</h2>
            <p>
              In accordance with Chapter III of the DPDP Act 2023, you have the right to access (Sec 11), correct and erase (Sec 12), register grievances (Sec 13), and <strong>nominate</strong> an individual in the event of death or incapacity (Sec 14).
            </p>
            <p>
              Under Section 18, you also have the statutory right to file a formal complaint with the <strong>Data Protection Board of India</strong> if any grievance remains unresolved.
            </p>
            <hr />
            <h2>4. Grievance Officer &amp; Support Contact</h2>
            <div className="contact-details">
              <p><strong>Platform:</strong> XIndia Technologies Private Limited</p>
              <p><strong>Grievance Officer:</strong> Compliance &amp; Grievance Redressal Officer</p>
              <p><strong>Physical Address:</strong> Connaught Place, New Delhi 110001, India</p>
              <p><strong>Grievance Email:</strong> <a href="mailto:grievance@xindia.live">grievance@xindia.live</a></p>
              <p><strong>Support Email:</strong> <a href="mailto:support@xindia.live">support@xindia.live</a></p>
              <p><strong>Public Deletion Portal:</strong> <Link href="/delete-account">https://xindia.live/delete-account</Link></p>
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748B' }}>
                <em>Statutory Timeline: Acknowledged within 24 hours, resolved within 15 days (Rule 3(2), IT Rules 2021 as amended).</em>
              </p>
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
