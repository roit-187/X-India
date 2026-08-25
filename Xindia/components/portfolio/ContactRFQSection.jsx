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
  Clock,
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
  const [submitted, setSubmitted] = useState(false);

  const websiteUrl = seller.contact?.website || (seller.website ? seller.website : null);
  const formattedWebsite = websiteUrl && !websiteUrl.startsWith('http') ? `https://${websiteUrl}` : websiteUrl;
  const phone = seller.buyerContactPhone || seller.businessPhone || seller.contact?.phone;
  const whatsapp = seller.whatsappNumber || seller.contact?.whatsapp;
  const email = seller.contactMail || seller.companyEmail || seller.contact?.email;

  const handleSendRFQ = (e) => {
    e.preventDefault();
    if (!buyerName.trim() || !productReq.trim()) return;

    const whatsappTarget = whatsapp || phone;
    const msg = encodeURIComponent(
      `🔔 *NEW FACTORY RFQ FROM XINDIA SHOWROOM*\n\n` +
      `• *Buyer Name:* ${buyerName.trim()}\n` +
      `• *Company / Brand:* ${buyerCompany.trim() || 'N/A'}\n` +
      `• *Contact Phone:* ${buyerPhone.trim() || 'N/A'}\n` +
      `• *Email:* ${buyerEmail.trim() || 'N/A'}\n` +
      `• *Product / Requirement:* ${productReq.trim()}\n` +
      `• *Target Quantity:* ${orderQty.trim() || 'Standard MOQ'}\n` +
      `• *Delivery Timeline:* ${timeline}\n\n` +
      `Please provide formal quotation and commercial catalog.`
    );

    if (whatsappTarget) {
      window.open(`https://wa.me/${whatsappTarget.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setBuyerName('');
      setBuyerCompany('');
      setBuyerPhone('');
      setBuyerEmail('');
      setProductReq('');
      setOrderQty('');
    }, 4000);
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

            <form onSubmit={handleSendRFQ} className="portfolio-rfq-form">
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
                    WhatsApp / Phone
                  </label>
                  <input
                    className="portfolio-form-input"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+91 98765 43210"
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

              {submitted ? (
                <div className="portfolio-form-alert success">
                  <CheckCircle2 size={16} /> Opening WhatsApp to dispatch your RFQ to {seller.name}...
                </div>
              ) : (
                <button type="submit" className="portfolio-rfq-submit-btn">
                  <Send size={15} />
                  <span>Send Instant RFQ via WhatsApp</span>
                </button>
              )}

              <div className="portfolio-rfq-guarantee">
                <Lock size={12} color="#10B981" />
                <span>Zero spam guarantee. Direct connection with verified factory commercial desk.</span>
              </div>
            </form>
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
              {phone && (
                <a href={`tel:${phone}`} className="portfolio-channel-card">
                  <div className="portfolio-channel-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                    <PhoneCall size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Direct Buyer Desk</div>
                    <div className="portfolio-channel-val portfolio-mono">{phone}</div>
                  </div>
                  <span className="portfolio-channel-btn-text">Call Desk</span>
                </a>
              )}

              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-channel-card whatsapp"
                >
                  <div className="portfolio-channel-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <div className="portfolio-channel-label">Official WhatsApp Channel</div>
                    <div className="portfolio-channel-val portfolio-mono">{whatsapp}</div>
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

              {formattedWebsite && (
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
