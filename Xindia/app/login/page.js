'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') === 'seller' ? 'seller' : 'admin');

  // Admin form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  // Seller form state
  const [email, setEmail] = useState('');
  const [sellerPassword, setSellerPassword] = useState('');
  const [sellerError, setSellerError] = useState('');
  const [sellerMode, setSellerMode] = useState('password'); // 'password' | 'otp'
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        // Persist role/permissions so sidebar and pages can do role-based rendering
        // without decoding the HttpOnly cookie.
        if (data.admin) {
          localStorage.setItem('admin_profile', JSON.stringify({
            id: data.admin.id,
            username: data.admin.username,
            email: data.admin.email,
            role: data.admin.role,
            permissions: data.admin.permissions || [],
          }));
        }
        router.push('/admin/dashboard');
      } else {
        setAdminError(data.message || 'Login failed');
      }
    } catch (err) {
      setAdminError('Network error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleSellerLogin = async (e) => {
    e.preventDefault();
    setSellerError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/seller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: sellerPassword }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user && data.user.id) {
          localStorage.setItem('seller_user_id', data.user.id);
        }
        router.push('/seller-portal/dashboard');
      } else {
        setSellerError(data.message || 'Invalid email or password');
      }
    } catch (err) {
      setSellerError('Network error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setSellerError('Please enter your registered email address');
      return;
    }
    setSellerError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/seller-request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setOtpMessage(`6-digit login code sent to ${email}`);
      } else {
        setSellerError(data.message || 'Failed to send OTP code');
      }
    } catch (err) {
      setSellerError('Network error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setSellerError('Please enter the 6-digit code received on your email');
      return;
    }
    setSellerError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/seller-verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user && data.user.id) {
          localStorage.setItem('seller_user_id', data.user.id);
        }
        router.push('/seller-portal/dashboard');
      } else {
        setSellerError(data.message || 'Invalid or expired OTP code');
      }
    } catch (err) {
      setSellerError('Network error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '80px auto', padding: 28, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700 }}>Xindia Login</h2>
        <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Access your administrative or seller portal</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
        <button
          type="button"
          onClick={() => { setTab('admin'); setSellerError(''); setAdminError(''); }}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: tab === 'admin' ? '#0F1B2D' : '#F1F5F9',
            color: tab === 'admin' ? '#fff' : '#64748B',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Admin / Staff
        </button>
        <button
          type="button"
          onClick={() => { setTab('seller'); setSellerError(''); setAdminError(''); }}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 8,
            background: tab === 'seller' ? '#E8581C' : '#F1F5F9',
            color: tab === 'seller' ? '#fff' : '#64748B',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Seller
        </button>
      </div>

      {tab === 'admin' && (
        <form onSubmit={handleAdminLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Username</label>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          {adminError && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 14, background: '#FEE2E2', padding: '8px 12px', borderRadius: 6 }}>{adminError}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#0F1B2D', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Log In as Admin'}
          </button>
        </form>
      )}

      {tab === 'seller' && (
        <div>
          {/* Seller Auth Mode Switcher */}
          <div style={{ display: 'flex', gap: 6, background: '#F8FAFC', padding: 4, borderRadius: 8, marginBottom: 18, border: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={() => { setSellerMode('password'); setSellerError(''); }}
              style={{
                flex: 1, padding: '7px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: sellerMode === 'password' ? '#fff' : 'transparent',
                color: sellerMode === 'password' ? '#0F1B2D' : '#64748B',
                boxShadow: sellerMode === 'password' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setSellerMode('otp'); setSellerError(''); }}
              style={{
                flex: 1, padding: '7px 12px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: sellerMode === 'otp' ? '#fff' : 'transparent',
                color: sellerMode === 'otp' ? '#0F1B2D' : '#64748B',
                boxShadow: sellerMode === 'otp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Email OTP
            </button>
          </div>

          {sellerMode === 'password' ? (
            <form onSubmit={handleSellerLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Registered Email</label>
                <input
                  type="email"
                  placeholder="seller@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  value={sellerPassword}
                  onChange={(e) => setSellerPassword(e.target.value)}
                  required
                  style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              {sellerError && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 14, background: '#FEE2E2', padding: '8px 12px', borderRadius: 6 }}>{sellerError}</p>}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '13px', background: '#E8581C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Signing in...' : 'Log In as Seller'}
              </button>
            </form>
          ) : (
            <div>
              {!otpSent ? (
                <form onSubmit={handleRequestOtp}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Registered Email</label>
                    <input
                      type="email"
                      placeholder="seller@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                  </div>
                  {sellerError && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 14, background: '#FEE2E2', padding: '8px 12px', borderRadius: 6 }}>{sellerError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '13px', background: '#E8581C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Sending OTP...' : 'Send Login Code'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp}>
                  {otpMessage && <p style={{ color: '#15803D', fontSize: 13, marginBottom: 14, background: '#DCFCE7', padding: '8px 12px', borderRadius: 6 }}>{otpMessage}</p>}
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Enter 6-Digit Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      style={{ display: 'block', width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 18, letterSpacing: 4, textAlign: 'center', fontWeight: 700, boxSizing: 'border-box' }}
                    />
                  </div>
                  {sellerError && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 14, background: '#FEE2E2', padding: '8px 12px', borderRadius: 6 }}>{sellerError}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ width: '100%', padding: '13px', background: '#E8581C', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Enter Portal'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Change email or resend code
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: 80 }}>Loading login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
