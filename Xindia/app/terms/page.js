import '../privacy-policy/privacy.css';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | XIndia B2B Marketplace',
  description: 'Official Terms of Service and User Agreement for XIndia marketplace buyers, suppliers, and industrial manufacturers.',
};

export default function TermsPage() {
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
          <span className="privacy-badge">OFFICIAL B2B USER AGREEMENT</span>
          <h1>Terms &amp; Conditions</h1>
          <p className="privacy-effective">Last Updated: September 15, 2026 | Effective Date: Immediate</p>
        </div>

        <section className="privacy-card">
          <h2>1. Introduction &amp; Acceptance of Terms</h2>
          <p>
            Welcome to <strong>XIndia</strong> (&ldquo;the Platform&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), operated as an industrial B2B marketplace and manufacturer launchpad accessible via web (<a href="https://xindia.live">https://xindia.live</a>) and mobile applications.
          </p>
          <p>
            By creating an account, browsing listings, submitting Requests for Quotations (RFQs), or listing manufacturing capabilities, you agree to be bound by these Terms &amp; Conditions, our <Link href="/privacy-policy">Privacy Policy</Link>, and applicable Indian laws including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023.
          </p>
        </section>

        <section className="privacy-card">
          <h2>2. Account Registration &amp; Verification</h2>
          <ul>
            <li><strong>Eligibility:</strong> You must represent a legally recognized business entity, sole proprietorship, partnership, or enterprise authorized to conduct commercial transactions.</li>
            <li><strong>KYC Verification:</strong> Sellers and manufacturers listing capabilities agree to provide valid GSTIN, Udyam registration, or statutory credentials for administrative verification. Providing fraudulent or misleading identity documents will result in immediate suspension.</li>
            <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials and one-time passwords (OTPs). Any activity conducted through your account is deemed your legal responsibility.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>3. Marketplace Role &amp; Commercial Disclaimers</h2>
          <p>
            XIndia operates as a technology intermediary facilitating discovery, matchmaking, and direct communication between verified Indian manufacturers and commercial buyers:
          </p>
          <ul>
            <li><strong>Intermediary Status:</strong> Unless explicitly stated in a dedicated contract, XIndia is not a party to bilateral trade agreements, supply contracts, purchase orders, or shipping arrangements concluded between buyers and sellers.</li>
            <li><strong>Independent Due Diligence:</strong> While XIndia performs administrative and document checks on verified sellers, buyers remain responsible for inspecting sample batches, validating technical specifications, and agreeing on delivery terms (e.g. EXW, FOB).</li>
            <li><strong>Pricing &amp; Quotations:</strong> All catalog prices, minimum order quantities (MOQs), and batch lead times displayed by sellers are indicative quotations subject to final commercial agreement.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>4. Subscription Plans &amp; SmartCredits</h2>
          <ul>
            <li><strong>Paid Subscriptions:</strong> Seller visibility plans (e.g. Pro, Growth) and SmartCredit purchases are processed securely via authorized payment gateways (Razorpay) with statutory GST tax invoices (SAC 998439).</li>
            <li><strong>Credits &amp; Unlocks:</strong> SmartCredits utilized to unlock verified buyer leads or priority RFQ matching are non-transferable and consumed upon delivery of the contact details.</li>
            <li><strong>Refund Policy:</strong> Subscription fees and credit purchases are non-refundable once activated or consumed, except in cases of duplicate billing or verifiable service unavailability verified by our finance team.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>5. Prohibited Activities &amp; Content Guidelines</h2>
          <p>Users shall not:</p>
          <ul>
            <li>Upload counterfeit products, prohibited substances, hazardous industrial waste, or goods violating intellectual property rights.</li>
            <li>Misrepresent factory capacity, machinery counts, certifications (e.g. ISO certificates), or commercial turnover.</li>
            <li>Transmit spam inquiries, unsolicited automated messages, or reverse-engineer platform APIs.</li>
            <li>Attempt to circumvent platform security controls, authentication mechanisms, or rate limits.</li>
          </ul>
        </section>

        <section className="privacy-card">
          <h2>6. Account Termination &amp; Data Deletion</h2>
          <p>
            Users may initiate account deactivation or deletion at any time directly through the mobile app settings or via our dedicated web portal (<Link href="/delete-account">https://xindia.live/delete-account</Link>). Under our DPDP-compliant policy, a 15-day cooling-off period applies during which you can cancel deletion before data is permanently purged.
          </p>
        </section>

        <section className="privacy-card">
          <h2>7. Dispute Resolution &amp; Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. In the event of any dispute arising out of or in connection with these Terms or use of the Platform, the competent courts in New Delhi, India shall have exclusive jurisdiction.
          </p>
        </section>

        <section className="privacy-card">
          <h2>8. Grievance Redressal &amp; Support</h2>
          <p>
            In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, if you have any questions or grievances regarding these Terms, contact our Grievance Officer:
          </p>
          <div className="contact-details">
            <p><strong>Platform:</strong> XIndia B2B Marketplace</p>
            <p><strong>Support &amp; Grievance Email:</strong> <a href="mailto:support@xindia.live">support@xindia.live</a></p>
            <p><strong>Official Domain:</strong> <a href="https://xindia.live">https://xindia.live</a></p>
            <p><strong>Support Portal:</strong> <Link href="/contact">https://xindia.live/contact</Link></p>
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
