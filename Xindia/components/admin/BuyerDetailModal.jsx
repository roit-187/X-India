'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Lock,
  Unlock,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import Badge from './Badge';

export default function BuyerDetailModal({ open, onClose, buyerId, onStatusChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockMode, setBlockMode] = useState('blacklist');
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  useEffect(() => {
    if (!open || !buyerId) {
      setData(null);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError('');

    fetch(`/api/admin/buyers/${buyerId}`)
      .then((res) => res.json())
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || 'Failed to load buyer details');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Network error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, buyerId]);

  if (!open) return null;

  const buyer = data?.buyer;
  const inquiries = data?.inquiries || [];
  const isDeactivated = buyer?.isActive === false;
  const isBlocked = buyer?.isBlacklisted || (buyer?.blockedUntil && new Date(buyer.blockedUntil) > new Date());

  const handleToggleActive = async (newActiveState) => {
    if (!buyer?._id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/buyers/${buyer._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActiveState, reason: deactivateReason }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowDeactivateConfirm(false);
        setDeactivateReason('');
        const refreshed = await fetch(`/api/admin/buyers/${buyer._id}`).then((r) => r.json());
        if (refreshed.success) setData(refreshed);
        if (onStatusChanged) onStatusChanged();
      } else {
        alert(resData.message || 'Status update failed');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockAccount = async () => {
    if (!buyer?._id) return;
    setActionLoading(true);
    try {
      const payload =
        blockMode === 'temporary'
          ? { mode: 'temporary', days: Number(blockDays), reason: blockReason }
          : { mode: 'blacklist', reason: blockReason };

      const res = await fetch(`/api/admin/buyers/${buyer._id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowBlockConfirm(false);
        setBlockReason('');
        const refreshed = await fetch(`/api/admin/buyers/${buyer._id}`).then((r) => r.json());
        if (refreshed.success) setData(refreshed);
        if (onStatusChanged) onStatusChanged();
      } else {
        alert(resData.message || 'Block failed');
      }
    } catch (e) {
      alert('Error blocking account: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockAccount = async () => {
    if (!buyer?._id) return;
    if (!confirm('Are you sure you want to unblock this buyer?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/buyers/${buyer._id}/unblock`, {
        method: 'PATCH',
      });
      const resData = await res.json();
      if (resData.success) {
        const refreshed = await fetch(`/api/admin/buyers/${buyer._id}`).then((r) => r.json());
        if (refreshed.success) setData(refreshed);
        if (onStatusChanged) onStatusChanged();
      } else {
        alert(resData.message || 'Unblock failed');
      }
    } catch (e) {
      alert('Error unblocking: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="admin-modal-overlay"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="admin-modal"
        style={{
          width: '760px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: 18,
                border: '1px solid #DBEAFE',
              }}
            >
              <User size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                  {buyer?.firstName} {buyer?.lastName || ''}
                </h2>
                {isDeactivated && <Badge label="Deactivated" variant="deactivated" />}
                {isBlocked && <Badge label="Blocked" variant="blacklisted" />}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', marginTop: 2 }}>
                Buyer ID: {buyer?._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '50px 0', color: '#64748B' }}>
              Loading buyer profile...
            </div>
          )}

          {error && (
            <div style={{ padding: 16, backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && buyer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Contact Information */}
              <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  Contact Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: 13 }}>
                  <div><span style={{ color: '#64748B' }}>Email:</span> <strong>{buyer.email || '-'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Phone:</span> <strong>{buyer.phone || '-'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Location:</span> <strong>{buyer.location || '-'}</strong></div>
                  <div><span style={{ color: '#64748B' }}>Joined:</span> <strong>{new Date(buyer.createdAt).toLocaleDateString('en-IN')}</strong></div>
                </div>
              </div>

              {/* Requirements & Inquiries */}
              <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  Requirements & Inquiries ({inquiries.length})
                </h4>
                {inquiries.length === 0 ? (
                  <div style={{ color: '#94A3B8', fontSize: 13, padding: '12px 0' }}>No inquiries submitted yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {inquiries.slice(0, 10).map((inq) => (
                      <div key={inq._id} style={{ borderBottom: '1px solid #F1F5F9', paddingBottom: 8, fontSize: 13 }}>
                        <strong>{inq.title}</strong>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          Budget: ₹{inq.budget || 0} &middot; Status: {inq.status || 'open'} &middot; {new Date(inq.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Security & Enforcement */}
              <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  Account Security & Enforcement Controls
                </h4>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {isDeactivated ? (
                    <button
                      className="admin-btn admin-btn-primary"
                      disabled={actionLoading}
                      onClick={() => handleToggleActive(true)}
                    >
                      <Unlock size={16} /> Reactivate Account
                    </button>
                  ) : (
                    <button
                      className="admin-btn admin-btn-secondary"
                      disabled={actionLoading}
                      onClick={() => setShowDeactivateConfirm(true)}
                      style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                    >
                      <Lock size={16} /> Deactivate Account
                    </button>
                  )}

                  {isBlocked ? (
                    <button
                      className="admin-btn admin-btn-primary"
                      disabled={actionLoading}
                      onClick={handleUnblockAccount}
                    >
                      <CheckCircle2 size={16} /> Unblock Account
                    </button>
                  ) : (
                    <button
                      className="admin-btn admin-btn-danger"
                      disabled={actionLoading}
                      onClick={() => setShowBlockConfirm(true)}
                    >
                      <Ban size={16} /> Block Account Completely
                    </button>
                  )}
                </div>

                {showDeactivateConfirm && (
                  <div style={{ backgroundColor: '#FFFBEB', padding: 14, borderRadius: 10, border: '1px solid #FDE68A', marginTop: 12 }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: 13, color: '#92400E' }}>Confirm Deactivation</h5>
                    <input
                      className="admin-input"
                      placeholder="Reason for deactivation..."
                      value={deactivateReason}
                      onChange={(e) => setDeactivateReason(e.target.value)}
                      style={{ width: '100%', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeactivateConfirm(false)}>Cancel</button>
                      <button className="admin-btn admin-btn-danger" onClick={() => handleToggleActive(false)}>Confirm Deactivate</button>
                    </div>
                  </div>
                )}

                {showBlockConfirm && (
                  <div style={{ backgroundColor: '#FEF2F2', padding: 14, borderRadius: 10, border: '1px solid #FECACA', marginTop: 12 }}>
                    <h5 style={{ margin: '0 0 6px 0', fontSize: 13, color: '#991B1B' }}>Confirm Block / Blacklist</h5>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="radio" checked={blockMode === 'blacklist'} onChange={() => setBlockMode('blacklist')} /> Permanent
                      </label>
                      <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="radio" checked={blockMode === 'temporary'} onChange={() => setBlockMode('temporary')} /> Temporary
                      </label>
                    </div>
                    {blockMode === 'temporary' && (
                      <div style={{ marginBottom: 8 }}>
                        <input
                          type="number"
                          className="admin-input"
                          value={blockDays}
                          onChange={(e) => setBlockDays(e.target.value)}
                          style={{ width: 100 }}
                        /> days
                      </div>
                    )}
                    <input
                      className="admin-input"
                      placeholder="Mandatory reason for blocking..."
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      style={{ width: '100%', marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="admin-btn admin-btn-secondary" onClick={() => setShowBlockConfirm(false)}>Cancel</button>
                      <button className="admin-btn admin-btn-danger" disabled={!blockReason.trim()} onClick={handleBlockAccount}>Confirm Block</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
