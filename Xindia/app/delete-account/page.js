'use client';

import './delete-account.css';

import { useState, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const STEPS = {
  INFO: 'info',
  PHONE: 'phone',
  OTP: 'otp',
  CONFIRM: 'confirm',
  SUCCESS: 'success',
};

export default function DeleteAccountPage() {
  const [step, setStep] = useState(STEPS.INFO);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    setError('');
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/web-deletion/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits }),
      });
      const data = await res.json();

      if (data.alreadyDeleted) {
        setSuccessMessage('This account has already been deleted. No further action is needed.');
        setStep(STEPS.SUCCESS);
      } else {
        setStep(STEPS.OTP);
        setCountdown(60);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyAndDelete = async () => {
    setError('');
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setStep(STEPS.CONFIRM);
  };

  const handleFinalConfirm = async () => {
    setError('');
    setLoading(true);
    try {
      const cleanDigits = phone.replace(/\D/g, '').slice(-10);
      const res = await fetch(`${API_URL}/api/auth/web-deletion/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanDigits, otp: otp.join('') }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Verification failed. Please try again.');
        setStep(STEPS.OTP);
        return;
      }

      setSuccessMessage(data.message);
      setStep(STEPS.SUCCESS);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setStep(STEPS.OTP);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-page">
      <nav className="delete-nav">
        <div className="delete-nav-inner">
          <div className="delete-brand">
            <span className="delete-brand-x">X</span>
            <span className="delete-brand-india">India</span>
          </div>
        </div>
      </nav>

      <main className="delete-main">
        <div className="delete-container">
          {/* Header */}
          <div className="delete-header">
            <div className="delete-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M15 9l-6 6"/>
                <path d="M9 9l6 6"/>
              </svg>
            </div>
            <h1>Account &amp; Data Deletion</h1>
            <p className="delete-subtitle">
              Request permanent deletion of your XIndia account and associated data
            </p>
          </div>

          {/* Step: Information */}
          {step === STEPS.INFO && (
            <div className="delete-card fade-in">
              <section className="delete-section">
                <h2>
                  <span className="section-icon">📱</span>
                  Delete from the App
                </h2>
                <p>
                  Active users can delete their account instantly from the XIndia mobile app:
                </p>
                <div className="delete-steps-list">
                  <div className="delete-step-item">
                    <span className="step-num">1</span>
                    <span>Open XIndia app → Go to <strong>Profile</strong></span>
                  </div>
                  <div className="delete-step-item">
                    <span className="step-num">2</span>
                    <span>Tap <strong>Delete Account</strong></span>
                  </div>
                  <div className="delete-step-item">
                    <span className="step-num">3</span>
                    <span>Confirm deletion → Account enters 15-day cooling-off period</span>
                  </div>
                </div>
              </section>

              <div className="delete-divider" />

              <section className="delete-section">
                <h2>
                  <span className="section-icon">🗑️</span>
                  What Gets Deleted
                </h2>
                <div className="data-grid">
                  <div className="data-card deleted">
                    <h3>Data Permanently Removed</h3>
                    <ul>
                      <li>Profile information (name, phone, email, business name)</li>
                      <li>Company logos and product images</li>
                      <li>Product listings and catalogue data</li>
                      <li>Buyer requirement quotes (RFQs)</li>
                      <li>Chat messages and conversation history</li>
                      <li>Search preferences and saved items</li>
                      <li>Push notification tokens and active sessions</li>
                    </ul>
                  </div>
                  <div className="data-card retained">
                    <h3>Data Retained (Legal Obligation)</h3>
                    <ul>
                      <li>
                        <strong>Tax invoices</strong> — Retained for 8 years under Section 36 of the
                        Central Goods and Services Tax Act, 2017 (Indian CGST Act)
                      </li>
                      <li>
                        <strong>Consent audit logs</strong> — Required under the Digital Personal Data
                        Protection Act, 2023 (DPDP Act) for compliance records
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <div className="delete-divider" />

              <section className="delete-section">
                <h2>
                  <span className="section-icon">⏳</span>
                  Cooling-Off Period
                </h2>
                <div className="info-banner">
                  <p>
                    After requesting deletion, your account enters a <strong>15-day cooling-off period</strong>.
                    During this time, you can cancel the deletion by simply logging back into the app.
                    After 15 days, all deletable data is permanently and irreversibly purged.
                  </p>
                </div>
              </section>

              <div className="delete-divider" />

              <section className="delete-section">
                <h2>
                  <span className="section-icon">🌐</span>
                  Uninstalled the App?
                </h2>
                <p>
                  If you've already uninstalled XIndia, you can request account deletion right here
                  by verifying your registered mobile number.
                </p>
                <button className="delete-btn primary" onClick={() => setStep(STEPS.PHONE)}>
                  Request Account Deletion Online
                </button>
              </section>
            </div>
          )}

          {/* Step: Phone Entry */}
          {step === STEPS.PHONE && (
            <div className="delete-card fade-in">
              <section className="delete-section centered">
                <h2>Verify Your Identity</h2>
                <p>Enter the mobile number registered with your XIndia account.</p>

                <div className="phone-input-group">
                  <span className="phone-prefix">+91</span>
                  <input
                    type="tel"
                    id="phone-input"
                    className="phone-input"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    maxLength={10}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="btn-group">
                  <button className="delete-btn secondary" onClick={() => { setStep(STEPS.INFO); setError(''); }}>
                    ← Back
                  </button>
                  <button
                    className="delete-btn primary"
                    onClick={handleSendOtp}
                    disabled={loading || phone.length < 10}
                  >
                    {loading ? 'Sending...' : 'Send Verification Code'}
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Step: OTP Entry */}
          {step === STEPS.OTP && (
            <div className="delete-card fade-in">
              <section className="delete-section centered">
                <h2>Enter Verification Code</h2>
                <p>
                  A 6-digit code has been sent to <strong>+91 {phone.slice(0, 2)}••••{phone.slice(-3)}</strong>
                </p>

                <div className="otp-input-group" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      className="otp-digit"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      maxLength={1}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && <p className="error-text">{error}</p>}

                <div className="resend-row">
                  {countdown > 0 ? (
                    <span className="resend-timer">Resend code in {countdown}s</span>
                  ) : (
                    <button className="resend-btn" onClick={handleSendOtp} disabled={loading}>
                      Resend Code
                    </button>
                  )}
                </div>

                <div className="btn-group">
                  <button className="delete-btn secondary" onClick={() => { setStep(STEPS.PHONE); setError(''); setOtp(['', '', '', '', '', '']); }}>
                    ← Back
                  </button>
                  <button
                    className="delete-btn danger"
                    onClick={handleVerifyAndDelete}
                    disabled={loading || otp.join('').length !== 6}
                  >
                    Verify &amp; Delete Account
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Step: Final Confirmation */}
          {step === STEPS.CONFIRM && (
            <div className="delete-card fade-in">
              <section className="delete-section centered">
                <div className="warning-icon-wrap">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h2>Are you absolutely sure?</h2>
                <p>
                  This will permanently delete your XIndia account associated with
                  <strong> +91 {phone}</strong>. Your profile, product listings, chats, and all
                  business data will be purged after a 15-day cooling-off period.
                </p>
                <p className="cancel-note">
                  You can cancel within 15 days by logging back into the XIndia app.
                </p>

                {error && <p className="error-text">{error}</p>}

                <div className="btn-group">
                  <button className="delete-btn secondary" onClick={() => { setStep(STEPS.OTP); setError(''); }}>
                    ← Go Back
                  </button>
                  <button
                    className="delete-btn danger"
                    onClick={handleFinalConfirm}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Yes, Delete My Account'}
                  </button>
                </div>
              </section>
            </div>
          )}

          {/* Step: Success */}
          {step === STEPS.SUCCESS && (
            <div className="delete-card fade-in">
              <section className="delete-section centered">
                <div className="success-icon-wrap">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <h2>Request Submitted</h2>
                <p className="success-msg">{successMessage}</p>
                <a href="/" className="delete-btn secondary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
                  Return to Home
                </a>
              </section>
            </div>
          )}

          {/* Footer */}
          <footer className="delete-footer">
            <p>
              For questions, contact us at{' '}
              <a href="mailto:support@x-india.com">support@x-india.com</a>
            </p>
            <p className="delete-legal">
              © {new Date().getFullYear()} XIndia. All rights reserved.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
