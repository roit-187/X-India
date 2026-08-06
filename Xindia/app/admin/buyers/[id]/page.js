'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Badge from '@/components/admin/Badge';
import Modal from '@/components/admin/Modal';

export default function BuyerDetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Block Modal state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockMode, setBlockMode] = useState('temporary');
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/buyers/${id}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.message || 'Failed to load buyer details');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const payload = blockMode === 'temporary'
      ? { mode: 'temporary', days: Number(days), reason }
      : { mode: 'blacklist', reason };

    const res = await fetch(`/api/admin/buyers/${id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to block buyer');
    } else {
      setShowBlockModal(false);
      loadData();
    }
  };

  const handleUnblock = async () => {
    const res = await fetch(`/api/admin/buyers/${id}/unblock`, {
      method: 'PATCH',
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to unblock buyer');
    } else {
      loadData();
    }
  };

  if (loading) return <p>Loading buyer details...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data || !data.buyer) return <p>Buyer not found</p>;

  const b = data.buyer;
  const inquiries = data.inquiries || [];
  const categories = data.categoriesOfInterest || [];
  const isBlocked = b.blockedUntil && new Date(b.blockedUntil) > new Date();

  // Active if lastActiveAt within last 30 days
  const isActiveBuyer = b.lastActiveAt
    ? (Date.now() - new Date(b.lastActiveAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  // Aggregate budget from inquiries (parse numeric prefix where possible)
  const totalInquiryValue = inquiries.reduce((sum, inq) => {
    const raw = String(inq.budget || '').replace(/[^0-9.]/g, '');
    const num = parseFloat(raw);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ maxWidth: 1000 }}>
      <Link
        href="/admin/buyers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}
      >
        <ArrowLeft size={16} />
        Back to Buyers
      </Link>

      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24 }}>{b.firstName} {b.lastName}</h1>
            <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{b.email} &middot; {b.phone}</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{b.location || 'No location set'}</div>
          </div>
          <div>
            {b.isBlacklisted || isBlocked ? (
              <button className="admin-btn admin-btn-secondary" onClick={handleUnblock}>Unblock Buyer</button>
            ) : (
              <button className="admin-btn admin-btn-danger" onClick={() => setShowBlockModal(true)}>Block Buyer</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {b.isBlacklisted && <Badge label="Blacklisted" variant="blacklisted" />}
          {isBlocked && !b.isBlacklisted && (
            <Badge label={`Blocked until ${new Date(b.blockedUntil).toLocaleDateString()}`} variant="blocked" />
          )}
          {!b.isBlacklisted && !isBlocked && (
            <Badge label={isActiveBuyer ? 'Active Buyer' : 'Passive Buyer'} variant={isActiveBuyer ? 'active' : 'none'} />
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Submitted Inquiries */}
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Submitted Inquiries ({inquiries.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {inquiries.map((inq) => (
                <div key={inq._id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h4 style={{ margin: 0 }}>{inq.name}</h4>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{new Date(inq.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#334155', margin: '4px 0 12px 0' }}>{inq.description}</p>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#475569' }}>
                    <span>Budget: <strong>{inq.budget || 'Not specified'}</strong></span>
                    <span>Location: <strong>{inq.location || '-'}</strong></span>
                    <span>Category: <strong>{inq.categoryId || '-'}</strong></span>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && (
                <p style={{ color: '#64748B', fontSize: 14 }}>No inquiries submitted by this buyer</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Buyer Info</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div>Date Joined: <strong>{new Date(b.createdAt).toLocaleDateString()}</strong></div>
              <div>Last Active: <strong>{b.lastActiveAt ? new Date(b.lastActiveAt).toLocaleString() : '-'}</strong></div>
              <div>Status: <strong>{isActiveBuyer ? '🟢 Active' : '⚪ Passive'}</strong></div>
              <div>Conversations: <strong>{data.conversationCount ?? 0}</strong></div>
            </div>

            {totalInquiryValue > 0 && (
              <>
                <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />
                <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 4 }}>TOTAL INQUIRY VALUE</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#15803D' }}>{formatINR(totalInquiryValue)}</div>
                  <div style={{ fontSize: 11, color: '#166534', marginTop: 2 }}>Across {inquiries.length} inquiries</div>
                </div>
              </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />

            <h4 style={{ marginTop: 0, marginBottom: 8 }}>Categories of Interest</h4>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {categories.map((cat, idx) => (
                <span key={idx} style={{ background: '#F1F5F9', padding: '4px 8px', borderRadius: 4, fontSize: 12, color: '#475569' }}>
                  {cat}
                </span>
              ))}
              {categories.length === 0 && <span style={{ fontSize: 13, color: '#94A3B8' }}>None listed</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Block Modal */}
      <Modal open={showBlockModal} onClose={() => setShowBlockModal(false)} title="Block Buyer">
        <form onSubmit={handleBlockSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Block Type</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ fontSize: 14 }}>
                <input
                  type="radio"
                  name="blockMode"
                  value="temporary"
                  checked={blockMode === 'temporary'}
                  onChange={() => setBlockMode('temporary')}
                /> Block temporarily
              </label>
              <label style={{ fontSize: 14 }}>
                <input
                  type="radio"
                  name="blockMode"
                  value="blacklist"
                  checked={blockMode === 'blacklist'}
                  onChange={() => setBlockMode('blacklist')}
                /> Blacklist permanently
              </label>
            </div>
          </div>

          {blockMode === 'temporary' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Duration (days)</label>
              <input
                type="number"
                min="1"
                max="365"
                className="admin-input"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Reason</label>
            <textarea
              className="admin-input"
              style={{ width: '100%', minHeight: 80 }}
              placeholder="Reason for blocking (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowBlockModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-danger" disabled={!reason.trim()}>
              {blockMode === 'temporary' ? 'Block Buyer' : 'Blacklist Buyer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
