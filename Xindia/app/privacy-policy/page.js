import './privacy.css';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | XIndia B2B Marketplace',
  description: 'DPDP Act 2023 and Google Play Store compliant Privacy Policy for XIndia marketplace buyers, suppliers, and manufacturers.',
};

export default function PrivacyPolicyPage() {
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
          <span className="privacy-badge">DPDP ACT 2023 & GOOGLE PLAY STORE COMPLIANT</span>
          <h1>Privacy Policy</h1>
          <p className="privacy-effective">Last Updated: September 10, 2026 | Effective Date: Immediate</p>
        </div>

        <section className="privacy-card">
          <h2>1. Overview & Data Fiduciary Details</h2>
          <p>
            This Privacy Policy governs the collection, processing, storage, transfer, and deletion of personal and commercial data by <strong>XIndia</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;), operating as a B2B marketplace and manufacturer launchpad connecting businesses across India.
          </p>
          <p>
            Under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> and Google Play Developer Policies, XIndia acts as the <em>Data Fiduciary</em> for personal data processed through our mobile applications (Android/iOS) and web portal (<a href="https://x-india.vercel.app">https://x-india.vercel.app</a>).
          </p>
        </section>

        <section className="privacy-card">
          <h2>2. Personal & Business Data We Collect</h2>
          <ul>
            <li><strong>Identity & Account Data:</strong> Full name, verified mobile phone number, business email address, company name, corporate role, and hashed passwords.</li>
            <li><strong>KYC & Enterprise Verification:</strong> GSTIN (Goods and Services Tax Identification Number), Udyam Registration, PAN, factory address, and industrial premises verification photos.</li>
            <li><strong>Commercial Communications:</strong> Buyer RFQ requirements, quotation messages, technical specifications, and industrial enquiries.</li>
            <li><strong>Financial & Transaction Records:</strong> Razorpay transaction IDs, Proforma Invoice numbers (SAC 998439), payment timestamps, and billing addresses. We do not store credit card numbers or UPI PINs.</li>
            <li><strong>Device & Diagnostic Data:</strong> Device model, OS version, Firebase Cloud Messaging (FCM) push tokens, and IP address for session security.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>3. Purpose of Processing & Legal Basis</h2>
          <p>We process your data strictly for legitimate commercial marketplace functions:</p>
          <ul>
            <li>Enabling verified buyers to discover and communicate with verified industrial manufacturers.</li>
            <li>Routing Request for Quotation (RFQ) inquiries and buyer lead notifications.</li>
            <li>Issuing statutory B2B GST tax invoices and managing manufacturer catalog subscriptions.</li>
            <li>Preventing commercial fraud, fake listings, and identity impersonation.</li>
            <li>Delivering real-time critical system and transactional alerts via native FCM push notifications.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>4. Data Sharing & Third-Party Processors</h2>
          <p>We do not sell personal data to third-party data brokers. Data is shared strictly with secure technical infrastructure providers necessary to operate the service:</p>
          <ul>
            <li><strong>Google Firebase:</strong> Secure authentication tokens and native push notification delivery.</li>
            <li><strong>Razorpay:</strong> RBI-licensed payment gateway for processing subscription invoices, UPI intent, and netbanking.</li>
            <li><strong>Brevo (Sendinblue):</strong> Transactional email dispatch for GST Proforma Invoices and system alerts.</li>
            <li><strong>Cloudflare R2 & AWS S3:</strong> Secure cloud storage for product catalog media and documents.</li>
          </ul>
        </section>

        <section className="privacy-card highlight-section" id="account-deletion">
          <h2>5. User Rights, Data Retention & Account Deletion</h2>
          <p>
            In accordance with <strong>Section 12 of the DPDP Act 2023</strong> and <strong>Google Play Store Data Safety Policies</strong>, all users have the right to review, correct, download, or permanently erase their personal data and account.
          </p>

          <div className="deletion-box">
            <h3>How to Delete Your Account:</h3>
            <ol>
              <li><strong>In-App Self-Service:</strong> Open the XIndia mobile app &rarr; Navigate to <strong>Profile &rarr; Settings &rarr; Privacy &rarr; Delete Account</strong>. Follow the confirmation steps to initiate delisting.</li>
              <li>
                <strong>Public Web Deletion Portal (No Login Required):</strong> If you have uninstalled the application or cannot log in, you can verify your registered phone number via OTP and execute account deletion directly using our{' '}
                <Link href="/delete-account" className="portal-link">
                  Public Account Deletion Portal &rarr;
                </Link>
              </li>
            </ol>
          </div>

          <h3>Data Purged vs. Statutorily Retained:</h3>
          <ul>
            <li><strong>Immediately Purged (T=0 to T=15):</strong> Personal profile, bio, avatars, chat messages, active sessions, push notification tokens, and product listings are immediately taken offline and permanently purged.</li>
            <li><strong>Statutorily Retained Records:</strong> Completed GST tax invoices and accounting ledger entries are retained in an isolated, read-only compliance vault for <strong>8 years</strong> to comply with Section 36 of the Central Goods and Services Tax (CGST) Act, 2017. Immutable DPDP consent withdrawal audit logs are retained for regulatory compliance.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>6. Data Security & Storage</h2>
          <p>
            All data in transit is encrypted using <strong>TLS 1.3</strong> with strict HTTPS enforcement. All database records and file storage are encrypted at rest using industry-standard <strong>AES-256</strong>. Multi-factor authentication is enforced for all administrative system access.
          </p>
        </section>

        <section className="privacy-card">
          <h2>7. Grievance Officer & Support Contact</h2>
          <p>
            For privacy inquiries, data subject access requests, or regulatory queries, contact our designated Grievance Officer:
          </p>
          <div className="contact-details">
            <p><strong>Platform:</strong> XIndia B2B Marketplace</p>
            <p><strong>Grievance & Support Email:</strong> <a href="mailto:Xindia369@gmail.com">Xindia369@gmail.com</a></p>
            <p><strong>Direct Helpline / WhatsApp:</strong> <a href="tel:+918860260878">+91 8860260878</a></p>
            <p><strong>Office:</strong> Industrial Plaza, New Delhi, India</p>
            <p><strong>Support Page:</strong> <Link href="/contact">https://x-india.vercel.app/contact</Link></p>
          </div>
        </section>
      </main>

      <footer className="privacy-footer">
        <div className="privacy-container">
          <p>&copy; {new Date().getFullYear()} XINDIA. All rights reserved. Connecting verified Indian manufacturers and buyers.</p>
        </div>
      </footer>
    </div>
  );
}
