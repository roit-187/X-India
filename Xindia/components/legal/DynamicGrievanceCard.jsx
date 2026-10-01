import React from 'react';
import Link from 'next/link';
import { getSystemConfig } from '@/lib/api';

export default async function DynamicGrievanceCard() {
  const config = await getSystemConfig();

  const officerName = config?.grievanceOfficerName || 'Abhishek Raj';
  const grievanceEmail = config?.grievanceEmail || 'support@xindia.live';
  const supportEmail = config?.supportEmail || 'support@xindia.live';
  const supportPhone = config?.supportPhone || '';
  const officeAddress = config?.registeredOfficeAddress || 'New Delhi, India';

  return (
    <section className="privacy-card highlight-section" style={{ marginTop: '36px' }} id="grievance-redressal">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.6px',
            color: '#FF8533',
            background: 'rgba(255,102,0,0.12)',
            border: '1px solid rgba(255,102,0,0.3)',
            padding: '4px 12px',
            borderRadius: '9999px',
            display: 'inline-block',
          }}
        >
          RULE 3(2) IT RULES &amp; DPDP ACT 2023
        </span>
      </div>

      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 8px 0' }}>
        Statutory Grievance Redressal Officer &amp; Legal Notice
      </h2>
      <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
        In compliance with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 (as amended) and Section 8(9) of the Digital Personal Data Protection (DPDP) Act, 2023, the details of the designated Grievance Officer and corporate nodal channels for XIndia are published below:
      </p>

      {/* Grid of live statutory contact info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '20px',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
            Operating Entity
          </span>
          <p style={{ margin: '4px 0 0 0', color: '#F1F5F9', fontWeight: 600, fontSize: '15px' }}>
            XIndia Technologies Private Limited
          </p>
        </div>

        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
            Designated Grievance Officer
          </span>
          <p style={{ margin: '4px 0 0 0', color: '#FF8533', fontWeight: 700, fontSize: '15px' }}>
            {officerName}
          </p>
        </div>

        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
            Grievance Redressal Email
          </span>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px' }}>
            <a href={`mailto:${grievanceEmail}`} style={{ color: '#F1F5F9', textDecoration: 'underline' }}>
              {grievanceEmail}
            </a>
          </p>
        </div>

        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
            General Customer Support
          </span>
          <p style={{ margin: '4px 0 0 0', fontSize: '15px' }}>
            <a href={`mailto:${supportEmail}`} style={{ color: '#F1F5F9', textDecoration: 'underline' }}>
              {supportEmail}
            </a>
          </p>
        </div>

        {supportPhone ? (
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
              Support Helpline
            </span>
            <p style={{ margin: '4px 0 0 0', color: '#F1F5F9', fontWeight: 600, fontSize: '15px' }}>
              {supportPhone}
            </p>
          </div>
        ) : null}

        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, letterSpacing: '0.5px' }}>
            Registered Corporate Office
          </span>
          <p style={{ margin: '4px 0 0 0', color: '#F1F5F9', fontWeight: 500, fontSize: '14px' }}>
            {officeAddress}
          </p>
        </div>
      </div>

      {/* Statutory Resolution Timelines & Appellate Rights */}
      <div
        style={{
          background: 'rgba(255, 102, 0, 0.05)',
          borderLeft: '4px solid #FF6600',
          borderRadius: '0 10px 10px 0',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <p style={{ margin: '0 0 8px 0', color: '#F8FAFC', fontWeight: 700, fontSize: '14px' }}>
          Statutory Resolution Timelines:
        </p>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#94A3B8', fontSize: '13px', lineHeight: 1.7 }}>
          <li>
            <strong style={{ color: '#F1F5F9' }}>Acknowledgment:</strong> All privacy grievances, content notices, and support inquiries are acknowledged within <strong style={{ color: '#FF8533' }}>24 hours</strong> of receipt.
          </li>
          <li>
            <strong style={{ color: '#F1F5F9' }}>Resolution:</strong> All grievances are formally investigated and resolved within <strong style={{ color: '#FF8533' }}>15 days</strong> of receipt (or <strong style={{ color: '#FF8533' }}>72 hours</strong> for specific unlawful content removal notices under Rule 3(1)(b)).
          </li>
          <li>
            <strong style={{ color: '#F1F5F9' }}>Appellate Escalation:</strong> If you are dissatisfied with our Grievance Officer’s order or if your grievance is unresolved within the timeline, you may appeal to the central <strong style={{ color: '#F1F5F9' }}>Grievance Appellate Committee (GAC)</strong> at <a href="https://gac.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: '#FF8533' }}>https://gac.gov.in</a> or submit a complaint to the <strong style={{ color: '#F1F5F9' }}>Data Protection Board of India (DPBI)</strong> under Section 18 of the DPDP Act 2023.
          </li>
        </ul>
      </div>

      {/* Helpful Links */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link
          href="/contact"
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#0B0F17',
            background: '#FF6600',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          Open Support &amp; Grievance Desk →
        </Link>
        <Link
          href="/delete-account"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#FF8533',
            background: 'transparent',
            border: '1px solid rgba(255,102,0,0.3)',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
          }}
        >
          DPDP Account &amp; Data Deletion Portal →
        </Link>
      </div>
    </section>
  );
}
