'use client';

import './contact.css';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [config, setConfig] = useState({
    supportEmail: 'Xindia369@gmail.com',
    supportPhone: '+91 8860260878',
  });
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  useEffect(() => {
    async function loadConfig() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ascend-ds0q.onrender.com';
        const res = await fetch(`${apiUrl}/api/v1/admin/system/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.config) {
            setConfig({
              supportEmail: data.config.supportEmail || 'Xindia369@gmail.com',
              supportPhone: data.config.supportPhone || '+91 8860260878',
            });
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic system config, using fallback:', err.message);
      }
    }
    loadConfig();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const cleanPhone = config.supportPhone.replace(/[^\d+]/g, '');

  return (
    <div className="contact-page">
      <header className="contact-header">
        <div className="contact-container header-inner">
          <Link href="/" className="contact-logo">
            <span>X</span>INDIA
          </Link>
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="contact-container contact-content">
        <div className="contact-hero">
          <span className="contact-badge">OFFICIAL CUSTOMER & BUSINESS SUPPORT</span>
          <h1>Contact XIndia</h1>
          <p className="contact-subtitle">
            Need assistance with verified manufacturing, buyer inquiries, or account verification? Our support team is here to help.
          </p>
        </div>

        <div className="contact-grid">
          {/* Support Channels Card */}
          <div className="contact-info-card">
            <h2>Get in Touch</h2>
            <p className="info-desc">
              Reach out directly to our dedicated business operations and merchant support desk:
            </p>

            <div className="channel-item">
              <div className="channel-icon">✉️</div>
              <div className="channel-text">
                <span className="channel-label">Official Support Email</span>
                <a href={`mailto:${config.supportEmail}`} className="channel-val">
                  {config.supportEmail}
                </a>
                <span className="channel-sub">Response typically within 4 business hours</span>
              </div>
            </div>

            <div className="channel-item">
              <div className="channel-icon">📞</div>
              <div className="channel-text">
                <span className="channel-label">Helpline & WhatsApp Support</span>
                <a href={`tel:${cleanPhone}`} className="channel-val">
                  {config.supportPhone}
                </a>
                <span className="channel-sub">Monday – Saturday: 9:00 AM – 7:00 PM IST</span>
              </div>
            </div>

            <div className="channel-item">
              <div className="channel-icon">🏢</div>
              <div className="channel-text">
                <span className="channel-label">Headquarters</span>
                <span className="channel-val static-val">XIndia B2B Industrial Technologies</span>
                <span className="channel-sub">Industrial Plaza, Okhla Phase III, New Delhi 110020, India</span>
              </div>
            </div>

            <div className="whatsapp-cta">
              <a
                href={`https://wa.me/${cleanPhone.replace('+', '')}?text=Hello%20XIndia%20Support,%20I%20need%20assistance.`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn"
              >
                <span>💬</span> Chat on WhatsApp Direct
              </a>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="submitted-view">
                <div className="success-icon">✓</div>
                <h3>Message Received!</h3>
                <p>Thank you for reaching out. A dedicated support executive will contact you at <strong>{form.email}</strong> shortly.</p>
                <button type="button" onClick={() => setSubmitted(false)} className="btn-secondary">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2>Send Us a Message</h2>
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    id="name"
                    required
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Business Email</label>
                    <input
                      id="email"
                      required
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject / Inquiry Type</label>
                  <select
                    id="subject"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    <option value="">Select an inquiry type</option>
                    <option value="seller_verification">Seller / Factory Verification</option>
                    <option value="buyer_rfq">Buyer RFQ & Requirement Support</option>
                    <option value="billing">GST Invoice & Payment Query</option>
                    <option value="technical">Mobile App or Account Help</option>
                    <option value="other">Other Commercial Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    placeholder="Describe your inquiry or assistance required..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Submit Inquiry &rarr;
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="contact-footer">
        <div className="contact-container">
          <p>&copy; {new Date().getFullYear()} XINDIA. All rights reserved. Registered Indian B2B Marketplace.</p>
        </div>
      </footer>
    </div>
  );
}
