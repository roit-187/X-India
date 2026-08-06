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

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminError('');
    const res = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      router.push('/admin/dashboard');
    } else {
      setAdminError(data.message || 'Login failed');
    }
  };

  const handleSellerLogin = async (e) => {
    e.preventDefault();
    setSellerError('');
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
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Xindia Login</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
        <button
          type="button"
          onClick={() => setTab('admin')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 6,
            background: tab === 'admin' ? '#0F1B2D' : '#F1F5F9',
            color: tab === 'admin' ? '#fff' : '#64748B',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => setTab('seller')}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: 'none',
            borderRadius: 6,
            background: tab === 'seller' ? '#E8581C' : '#F1F5F9',
            color: tab === 'seller' ? '#fff' : '#64748B',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Seller
        </button>
      </div>

      {tab === 'admin' && (
        <form onSubmit={handleAdminLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Username</label>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          {adminError && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{adminError}</p>}
          <button
            type="submit"
            style={{ width: '100%', padding: '12px', background: '#0F1B2D', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Log In as Admin
          </button>
        </form>
      )}

      {tab === 'seller' && (
        <form onSubmit={handleSellerLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Seller Email</label>
            <input
              type="email"
              placeholder="seller@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={sellerPassword}
              onChange={(e) => setSellerPassword(e.target.value)}
              required
              style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          {sellerError && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{sellerError}</p>}
          <button
            type="submit"
            style={{ width: '100%', padding: '12px', background: '#E8581C', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
          >
            Log In as Seller
          </button>
        </form>
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
