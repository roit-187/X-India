'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  PhoneCall,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
  FileCheck,
  ShieldCheck,
  Send,
  Building2,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

function maskGST(gst) {
  if (!gst || typeof gst !== 'string') return '';
  const clean = gst.trim();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 5)}•••••${clean.slice(-3)}`;
}

export default function ContactRFQSection({ seller }) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [productReq, setProductReq] = useState('');
  const [orderQty, setOrderQty] = useState('');
  const [timeline, setTimeline] = useState('Within 1-2 Weeks');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [honeypot, setHoneypot] = useState('');
  const [fanOut, setFanOut] = useState(false);

  const websiteUrl = seller.contact?.website || (seller.website ? seller.website : null);
  const formattedWebsite = websiteUrl && !websiteUrl.startsWith('http') ? `https://${websiteUrl}` : websiteUrl;
  // [Finding 13] Allowlist check: only render the link if the URL uses http/https
  // with a valid hostname. Blocks javascript: URIs and other dangerous schemes.
  const isSafeWebsite = formattedWebsite &&
    /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.[a-zA-Z]{2,}/.test(formattedWebsite);
  const rawPhone = seller.buyerContactPhone || seller.businessPhone || seller.contact?.phone;
  const cleanDigits = rawPhone ? String(rawPhone).replace(/\D/g, '') : '';
  const standardDigits = cleanDigits.length === 12 && cleanDigits.startsWith('91')
    ? cleanDigits.slice(2)
    : (cleanDigits.length === 11 && cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits);
  const displayPhone = standardDigits.length === 10
    ? `+91 ${standardDigits.slice(0, 5)} ${standardDigits.slice(5)}`
    : (rawPhone ? String(rawPhone).trim() : null);
  const dialPhone = standardDigits.length === 10 ? `+91${standardDigits}` : (cleanDigits ? `+${cleanDigits}` : null);

  const rawWhatsapp = seller.whatsappNumber || seller.contact?.whatsapp;
  const cleanWa = rawWhatsapp ? String(rawWhatsapp).replace(/\D/g, '') : '';
  const standardWa = cleanWa.length === 12 && cleanWa.startsWith('91')
    ? cleanWa.slice(2)
    : (cleanWa.length === 11 && cleanWa.startsWith('0') ? cleanWa.slice(1) : cleanWa);
  const displayWhatsapp = standardWa.length === 10
    ? `+91 ${standardWa.slice(0, 5)} ${standardWa.slice(5)}`
    : (rawWhatsapp ? String(rawWhatsapp).trim() : null);
  const dialWhatsapp = standardWa.length === 10 ? `91${standardWa}` : cleanWa;

  const rawEmail = seller.contactMail || seller.companyEmail || seller.contact?.email;
  const isSafeEmail = rawEmail && typeof rawEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim());
  const email = isSafeEmail ? rawEmail.trim() : null;

  const handleSendRFQ = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!buyerName.trim() || !productReq.trim()) {
      setErrorMessage('Please fill in your name and product requirement.');
      return;
    }

    const cleanInputPhone = buyerPhone.replace(/\D/g, '');
    const validDigits = cleanInputPhone.length === 12 && cleanInputPhone.startsWith('91')
      ? cleanInputPhone.slice(2)
      : (cleanInputPhone.length === 11 && cleanInputPhone.startsWith('0') ? cleanInputPhone.slice(1) : cleanInputPhone);

    if (validDigits.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number so the factory can reach you.');
      return;
    }

    setSubmitting(true);

    const targetWhatsapp = dialWhatsapp || (standardDigits.length === 10 ? `91${standardDigits}` : cleanDigits);
    const msg = encodeURIComponent(
      `🔔 *NEW FACTORY RFQ FROM XINDIA SHOWROOM*\n\n` +
      `• *Buyer Name:* ${buyerName.trim()}\n` +
      `• *Company / Brand:* ${buyerCompany.trim() || 'N/A'}\n` +
      `• *Contact Phone:* +91 ${validDigits}\n` +
      `• *Email:* ${buyerEmail.trim() || 'N/A'}\n` +
      `• *Product / Requirement:* ${productReq.trim()}\n` +
      `• *Target Quantity:* ${orderQty.trim() || 'Standard MOQ'}\n` +
      `• *Delivery Timeline:* ${timeline}\n\n` +
      `Please provide formal quotation and commercial catalog.`
    );

    try {
      const res = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerName: buyerName.trim(),
          buyerPhone: `+91${validDigits}`,
          buyerEmail: buyerEmail.trim() || undefined,
          buyerCompany: buyerCompany.trim() || undefined,
          productRequirement: productReq.trim(),
          orderQty: orderQty.trim() || undefined,
          timeline,
          slug: seller.slug,
          company_fax: honeypot || undefined,
          fanOut,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit inquiry to manufacturer.');
      }

      setConfirmation({
        referenceNumber: data.referenceNumber,
        targetWhatsapp,
        whatsappMsg: msg,
        fanOut,
      });

      setFanOut(false);

      setBuyerName('');
      setBuyerCompany('');
      setBuyerPhone('');
      setBuyerEmail('');
      setProductReq('');
      setOrderQty('');
    } catch (err) {
      setErrorMessage(err.message || 'Network error submitting RFQ. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="contact" className="portfolio-section">
      <div className="portfolio-container">
        {/* Section Header */}
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <PhoneCall size={13} />
              <span>Direct Commercial Desk</span>
            </div>
            <h2 className="portfolio-section-title">Request Quotation & Contact Factory</h2>
            <p className="portfolio-section-desc">
              Direct channels to factory executive management, sales desk, and instant wholesale RFQs.
            </p>
          </div>
        </div>

        {/* ─── Main 2-Column Contact & RFQ Grid ───────────────────────────────── */}
        <motion.div
          className="portfolio-contact-split-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          {/* Left Column: Direct B2B RFQ Form */}
          <div className="portfolio-rfq-card">
            <div className="portfolio-rfq-head">
              <div className="portfolio-rfq-head-icon">
                <Sparkles size={18} color="var(--p-primary)" />
              </div>
              <div>
                <h3 className="portfolio-rfq-title">Send Direct Factory RFQ</h3>
                <p className="portfolio-rfq-desc">Fill in your specifications to receive a formal wholesale quote directly from {seller.name}.</p>
              </div>
            </div>

            {confirmation ? (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 18, padding: 28, textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', padding: 12, background: '#DCFCE7', borderRadius: '50%', color: '#16A34A', marginBottom: 14 }}>
                  <CheckCircle2 size={36} />
                </div>
                <h4 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#14532D' }}>
                  RFQ Dispatched to Manufacturer Desk!
                </h4>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#166534', lineHeight: 1.5 }}>
                  Your requirement has been securely registered and forwarded to {seller.name}&apos;s commercial desk.
                  {confirmation.fanOut && ' We have also matched this request with up to 3 other verified factories in this category for competitive quotes.'} The factory team will follow up directly on your phone/WhatsApp.
                </p>
                <div style={{ display: 'inline-block', background: '#fff', border: '1px solid #86EFAC', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 800, color: '#15803D', marginBottom: 18 }}>
                  Reference: {confirmation.referenceNumber}
                </div>
                {confirmation.targetWhatsapp && (
                  <div style={{ marginTop: 6, marginBottom: 14 }}>
                    <a
                      href={`https://wa.me/${confirmation.targetWhatsapp}?text=${confirmation.whatsappMsg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portfolio-rfq-submit-btn"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        textDecoration: 'none',
                        background: '#25D366',
                        color: '#fff',
                        padding: '13px 24px',
                        borderRadius: 12,
                        fontWeight: 800,
                        fontSize: 14,
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                      }}
                    >
                      <MessageSquare size={16} />
                      <span>Chat Directly on WhatsApp (Optional)</span>
                    </a>
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => setConfirmation(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#4B5563',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      marginTop: 8,
                    }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendRFQ} className="portfolio-rfq-form">
                {/* Honeypot field for bot protection */}
                <input
                  type="text"
                  name="company_fax"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex="-1"
                  autoComplete="off"
                />

                {errorMessage && (
                  <div className="portfolio-form-alert error" style={{ marginBottom: 14 }}>
                    <AlertCircle size={16} /> {errorMessage}
                  </div>
                )}

                <div className="portfolio-rfq-row-2">
                  <div className="portfolio-form-group">
                    <label className="portfolio-form-label">
                      <User size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Your Name <span className="portfolio-required">*</span>
                    </label>
                    <input
                      className="portfolio-form-input"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      required
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-form-label">
                      <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Company / Brand
                    </label>
                    <input
                      className="portfolio-form-input"
                      value={buyerCompany}
                      onChange={(e) => setBuyerCompany(e.target.value)}
                      placeholder="e.g. Apex Lifestyle Brands"
                    />
                  </div>
                </div>

                <div className="portfolio-rfq-row-2">
                  <div className="portfolio-form-group">
                    <label className="portfolio-form-label">
                      <PhoneCall size={12} style={{ display: 'inline', marginRight: 4 }} />
                      WhatsApp / Phone <span className="portfolio-required">*</span>
                    </label>
                    <input
                      className="portfolio-form-input"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-form-label">
                      <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                      Email Address
                    </label>
                    <input
                      className="portfolio-form-input"
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="buyer@company.com"
                    />
                  </div>
                </div>

                <div className="portfolio-form-group">
                  <label className="portfolio-form-label">
                    Product Requirement / Specifications <span className="portfolio-required">*</span>
                  </label>
                  <textarea
                    className="portfolio-form-textarea"
                    rows={3}
                    value={productReq}
                    onChange={(e) => setProductReq(e.target.value)}
                    placeholder="Describe your target product, custom dimensions, color preferences, material grades, or logo branding..."
                    required
                  />
                </div>

                <div className="portfolio-rfq-row-2">
                  <div className="portfolio-form-group">
                    <label className="portfolio-form-label">Target Quantity / Units</label>
                    <input
                      className="portfolio-form-input"
                      value={orderQty}
                      onChange={(e) => setOrderQty(e.target.value)}
                      placeholder="e.g. 500 pcs, 1000 units"
                    />
                  </div>

                  <div className="portfolio-form-group">
                    <label className="portfolio-form-label">Required Delivery Timeline</label>
                    <select
                      className="portfolio-form-input"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                    >
                      <option value="Urgent (Within 7 Days)">Urgent (Within 7 Days)</option>
                      <option value="Within 1-2 Weeks">Within 1-2 Weeks</option>
                      <option value="Within 1 Month">Within 1 Month</option>
                      <option value="Long Term Annual Contract">Long Term Annual Contract</option>
                    </select>
                  </div>
                </div>

                <label
                  className="portfolio-rfq-fanout-label"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    cursor: 'pointer',
                    margin: '8px 0 16px',
                    fontSize: 13,
                    color: '#334155',
                    lineHeight: 1.4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={fanOut}
                    onChange={(e) => setFanOut(e.target.checked)}
                    style={{ marginTop: 2, accentColor: '#059669', cursor: 'pointer' }}
                  />
                  <span>Also receive competitive quotes from up to 3 other verified factories in this category</span>
                </label>

                <button type="submit" disabled={submitting} className="portfolio-rfq-submit-btn">
                  <Send size={15} />
                  <span>{submitting ? 'Dispatching to Factory Desk...' : 'Send Formal RFQ to Factory'}</span>
                </button>

                <div className="portfolio-rfq-guarantee">
                  <Lock size={12} color="#10B981" />
                  <span>Zero spam guarantee. Direct connection with verified factory commercial desk.</span>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Executive Contact Desk & Credentials */}
          <div className="portfolio-desk-column">
            {seller.companyOwner && (
              <div className="portfolio-executive-desk-card">
                <div className="portfolio-exec-avatar">
                  <User size={20} color="var(--p-primary)" />
                </div>
                <div>
                  <div className="portfolio-exec-badge">Executive Management Desk</div>
                  <div className="portfolio-exec-name">{seller.companyOwner}</div>
                  <div className="portfolio-exec-role">Director / Commercial Sales Head</div>
                </div>
              </div>
            )}

            <div className="portfolio-channels-list">
              {displayPhone && dialPhone && (
                <a href={`tel:${dialPhone}`} className="portfolio-channel-card">
                  <div className="portfolio-channel-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Direct Buyer Desk</div>
                    <div className="portfolio-channel-val portfolio-mono">{displayPhone}</div>
                  </div>
                  <span className="portfolio-channel-btn-text">Call Desk</span>
                </a>
              )}

              {displayWhatsapp && dialWhatsapp && (
                <a
                  href={`https://wa.me/${dialWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-channel-card whatsapp"
                >
                  <div className="portfolio-channel-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Official WhatsApp Channel</div>
                    <div className="portfolio-channel-val portfolio-mono">{displayWhatsapp}</div>
                  </div>
                  <span className="portfolio-channel-btn-text">Chat Now</span>
                </a>
              )}

              {email && (
                <a href={`mailto:${email}`} className="portfolio-channel-card">
                  <div className="portfolio-channel-icon" style={{ background: '#FCE7F3', color: '#DB2777' }}>
                    <Mail size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Corporate Email</div>
                    <div className="portfolio-channel-val">{email}</div>
                  </div>
                  <span className="portfolio-channel-btn-text">Send Mail</span>
                </a>
              )}

              {isSafeWebsite && (
                <a
                  href={formattedWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-channel-card"
                >
                  <div className="portfolio-channel-icon" style={{ background: '#F1F5F9', color: '#475569' }}>
                    <Globe size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Official Website</div>
                    <div className="portfolio-channel-val">{websiteUrl}</div>
                  </div>
                  <span className="portfolio-channel-btn-text">Visit Web</span>
                </a>
              )}


              {seller.address && (
                <div className="portfolio-channel-card non-clickable">
                  <div className="portfolio-channel-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Manufacturing Plant Address</div>
                    <div className="portfolio-channel-val" style={{ fontWeight: 500, fontSize: 13 }}>
                      {seller.address}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* GSTIN & Compliance Verification Badge Box */}
            {seller.gstin && (
              <div className="portfolio-gst-trust-card">
                <FileCheck size={20} color="#10B981" />
                <div>
                  <div className="portfolio-gst-title">GSTIN Verified Manufacturer</div>
                  <div className="portfolio-gst-num portfolio-mono">{maskGST(seller.gstin)}</div>
                </div>
                <span className="portfolio-verified-badge" style={{ marginLeft: 'auto' }}>
                  <ShieldCheck size={12} /> Active
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
