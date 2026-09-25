'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, AlertTriangle, CheckCircle, Clock, User, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const ALERT_TYPES = [
  { key: '', label: 'All Types' },
  { key: 'MEETING_REQUEST', label: 'Meeting Requests' },
  { key: 'ACCOUNT_DELETED', label: 'Account Deleted' },
  { key: 'CONSENT_WITHDRAWN', label: 'Consent Withdrawn' },
  { key: 'VERIFICATION_REQUEST', label: 'Verification Request' },
  { key: 'COMPLAINT', label: 'Complaint' },
  { key: 'DELETE_REVIEW_REQUEST', label: 'Delete Review Requests' },
  { key: 'FLAG', label: 'Flag' },
  { key: 'SUSPICIOUS_ACTIVITY', label: 'Suspicious Activity' },
  { key: 'PAYMENT_DISPUTE', label: 'Payment Dispute' },
];

// Issue #19: Operational filter chips replacing the cluttered 10-item dropdown
const FILTER_CHIPS = [
  { key: '', label: 'All Alerts', icon: '📋', types: [] },
  { key: 'COMPLAINT', label: 'Complaints', icon: '⚠️', types: ['COMPLAINT'] },
  { key: 'FLAG', label: 'Reports', icon: '🚩', types: ['FLAG', 'SUSPICIOUS_ACTIVITY'] },
  { key: 'MEETING_REQUEST', label: 'Visit Requests', icon: '🤝', types: ['MEETING_REQUEST'] },
  { key: 'SYSTEM', label: 'System & Legal', icon: '⋯', types: ['ACCOUNT_DELETED', 'CONSENT_WITHDRAWN', 'VERIFICATION_REQUEST', 'DELETE_REVIEW_REQUEST', 'PAYMENT_DISPUTE'] },
];

const STATUSES = [
  { key: '', label: 'All' },
  { key: 'OPEN', label: 'Open' },
  { key: 'IN_REVIEW', label: 'In Review' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
];

const SEVERITY_CONFIG = {
  CRITICAL: { color: '#DC2626', bg: '#FEF2F2', label: 'Critical' },
  HIGH:     { color: '#EA580C', bg: '#FFF7ED', label: 'High' },
  MEDIUM:   { color: '#D97706', bg: '#FFFBEB', label: 'Medium' },
  LOW:      { color: '#64748B', bg: '#F8FAFC', label: 'Low' },
};

const TYPE_ICONS = {
  MEETING_REQUEST:        '🤝',
  ACCOUNT_DELETED:        '🗑',
  CONSENT_WITHDRAWN:      '📋',
  VERIFICATION_REQUEST:   '🔍',
  COMPLAINT:              '⚠️',
  DELETE_REVIEW_REQUEST:  '🗑️',
  FLAG:                   '🚩',
  SUSPICIOUS_ACTIVITY:    '🔐',
  PAYMENT_DISPUTE:        '💳',
};

const STATUS_COLORS = {
  OPEN:       { bg: '#FEE2E2', color: '#991B1B' },
  IN_REVIEW:  { bg: '#FEF9C3', color: '#854D0E' },
  RESOLVED:   { bg: '#DCFCE7', color: '#166534' },
  DISMISSED:  { bg: '#F1F5F9', color: '#64748B' },
};

function AlertDetail({ alert, onClose, onStatusChange }) {
  const [newStatus, setNewStatus] = useState(alert.status);
  const [note, setNote] = useState(alert.resolutionNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/alerts/${alert._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resolutionNote: note }),
      });
      const data = await res.json();
      if (data.success) {
        onStatusChange(alert._id, newStatus, note);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  // Issue #19: 1-click acknowledgement push
  const [ackSent, setAckSent] = useState(false);
  const [ackSending, setAckSending] = useState(false);
  const handleAcknowledge = async () => {
    setAckSending(true);
    try {
      const res = await fetch(`/api/admin/alerts/${alert._id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) setAckSent(true);
      else alert('Failed: ' + (data.message || 'Unknown error'));
    } catch (e) {
      console.error('Acknowledge error:', e);
    } finally {
      setAckSending(false);
    }
  };

  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.MEDIUM;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 20 }}>{TYPE_ICONS[alert.type] || '⚠️'}</span>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>{alert.title}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sev.bg, color: sev.color }}>{sev.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: STATUS_COLORS[alert.status]?.bg, color: STATUS_COLORS[alert.status]?.color }}>{alert.status}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: '0 0 16px' }}>{alert.body}</p>

          {alert.relatedUserEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              <User size={14} color="#64748B" />
              <span style={{ color: '#64748B' }}>User:</span>
              <span style={{ fontWeight: 600 }}>{alert.relatedUserEmail}</span>
            </div>
          )}

          <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 20 }}>
            Created: {new Date(alert.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>

          {alert.type === 'DELETE_REVIEW_REQUEST' && (
            <div style={{ marginBottom: 18 }}>
              <a
                href="/admin/reviews?deletionRequestStatus=PENDING"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#FFF7ED', border: '1px solid #FDBA74', color: '#C2410C',
                  padding: '9px 15px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Go to Review Moderation Hub →
              </a>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Update Status</label>
            <select
              className="admin-select"
              style={{ width: '100%' }}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              {STATUSES.filter((s) => s.key).map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 6 }}>Resolution Note</label>
            <textarea
              className="admin-input"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Add a note about how this was resolved or why it was dismissed..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Issue #19: Quick Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button
              className="admin-btn admin-btn-secondary"
              disabled={ackSent || ackSending}
              onClick={handleAcknowledge}
              style={{ flex: 1, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              {ackSent ? '✅ Acknowledged' : ackSending ? 'Sending...' : '📨 1-Click Acknowledge'}
            </button>
            <a
              href="/admin/support"
              className="admin-btn admin-btn-primary"
              style={{ flex: 1, fontSize: 13, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              💬 Open Support Desk
            </a>
          </div>

          <button
            className="admin-btn"
            onClick={handleSave}
            disabled={saving}
            style={{ width: '100%' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminAlertsPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAlerts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams({ page, limit: 25 });
      if (typeFilter) {
        const chip = FILTER_CHIPS.find((c) => c.key === typeFilter);
        const typesToSend = chip?.types?.length ? chip.types.join(',') : typeFilter;
        params.set('type', typesToSend);
      }
      if (statusFilter) params.set('status', statusFilter);
      if (severityFilter) params.set('severity', severityFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/alerts?${params}`);
      const data = await res.json();
      if (data.success) {
        setAlerts(data.alerts || []);
        setTotal(data.total || 0);
        setOpenCount(data.openCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, typeFilter, statusFilter, severityFilter, searchQuery]);

  useEffect(() => {
    if (loaded && isSuperAdmin) loadAlerts();
  }, [loaded, isSuperAdmin, loadAlerts]);

  const handleStatusChange = (id, newStatus, note) => {
    setAlerts((prev) => prev.map((a) => a._id === id ? { ...a, status: newStatus, resolutionNote: note } : a));
  };

  if (!loaded) return null;
  if (!isSuperAdmin) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#DC2626" style={{ margin: '0 auto 16px' }} />
        <h2>Access Restricted</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Bell size={22} color="#DC2626" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0F172A' }}>Critical Alerts</h1>
            {openCount > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#FEE2E2', color: '#DC2626' }}>
                {openCount} OPEN
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            Account deletions, consent events, complaints, and platform flags requiring review.
          </p>
        </div>
        <button
          onClick={() => loadAlerts(true)}
          disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#374151' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Issue #19: Operational Filter Chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTER_CHIPS.map((chip) => {
          const isActive = typeFilter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => { setTypeFilter(chip.key); setPage(1); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: isActive ? '2px solid #E8581C' : '1px solid #E2E8F0',
                background: isActive ? '#FFF7ED' : '#fff',
                color: isActive ? '#C2410C' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{chip.icon}</span>
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 220 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>🔍</span>
          <input
            className="admin-input"
            style={{ width: '100%', paddingLeft: 32, height: 36 }}
            placeholder="Search by Business Name, Business ID (ObjectId), or Ticket #..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setPage(1); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 14 }}
            >
              ✕
            </button>
          )}
        </div>
        <select className="admin-select" style={{ minWidth: 140 }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="admin-select" style={{ minWidth: 130 }} value={severityFilter} onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}>
          <option value="">All Severity</option>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 13, color: '#94A3B8', alignSelf: 'center', marginLeft: 'auto' }}>
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <CheckCircle size={48} color="#059669" style={{ margin: '0 auto 12px' }} />
          <p style={{ color: '#64748B', fontSize: 14 }}>No alerts match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((alert) => {
            const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.MEDIUM;
            const sts = STATUS_COLORS[alert.status] || STATUS_COLORS.OPEN;
            return (
              <div
                key={alert._id}
                onClick={() => setSelected(alert)}
                style={{
                  background: '#fff',
                  border: '1px solid #E2E8F0',
                  borderLeft: `4px solid ${sev.color}`,
                  borderRadius: 10,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>{TYPE_ICONS[alert.type] || '⚠️'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{alert.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: sev.bg, color: sev.color }}>{sev.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: sts.bg, color: sts.color }}>{alert.status}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.body}</p>
                  <div style={{ fontSize: 11, color: '#94A3B8', display: 'flex', gap: 12 }}>
                    <span>{new Date(alert.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {alert.relatedUserEmail && <span>👤 {alert.relatedUserEmail}</span>}
                  </div>
                </div>
                <ChevronDown size={16} color="#94A3B8" style={{ flexShrink: 0, marginTop: 4 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="admin-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{ padding: '7px 14px' }}>← Prev</button>
          <span style={{ alignSelf: 'center', fontSize: 13, color: '#64748B' }}>Page {page} of {totalPages}</span>
          <button className="admin-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{ padding: '7px 14px' }}>Next →</button>
        </div>
      )}

      {/* Alert detail modal */}
      {selected && (
        <AlertDetail
          alert={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
