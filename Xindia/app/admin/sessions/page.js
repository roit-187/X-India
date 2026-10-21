'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Shield,
  ShieldAlert,
  RefreshCw,
  LogOut,
  Clock,
  Globe,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

function formatRelativeTime(dateString) {
  if (!dateString) return 'Unknown';
  const diffSec = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 5) return 'Active just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getDeviceIcon(deviceType = '') {
  const lower = String(deviceType).toLowerCase();
  if (lower.includes('mobile') || lower.includes('phone')) return <Smartphone size={18} color="#2563EB" />;
  if (lower.includes('tablet') || lower.includes('ipad')) return <Tablet size={18} color="#7C3AED" />;
  return <Laptop size={18} color="#059669" />;
}

export default function AdminSessionsPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/sessions');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load administrative sessions');
      }
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (err) {
      setError(err.message || 'Error fetching active sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 30000);
    return () => clearInterval(interval);
  }, [loadSessions]);

  const handleRevokeSingle = async (sessionId) => {
    if (!confirm('Are you sure you want to terminate this administrative session? The device will be logged out immediately.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to revoke session');
      }
      setSuccessMsg('Session successfully revoked.');
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to revoke session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeOthers = async () => {
    if (!confirm('Are you sure you want to revoke all other active sessions? All other logged-in devices will be disconnected.')) {
      return;
    }
    setActionLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/sessions/other', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to revoke other sessions');
      }
      setSuccessMsg(data.message || 'All other active sessions have been terminated.');
      await loadSessions();
    } catch (err) {
      setError(err.message || 'Failed to revoke other sessions');
    } finally {
      setActionLoading(false);
    }
  };

  const currentSession = sessions.find((s) => s.isCurrent);
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#EFF6FF', padding: 8, borderRadius: 8, color: '#2563EB', display: 'flex' }}>
              <Shield size={22} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--adm-text, #0F172A)' }}>
              Active Administrative Sessions
            </h1>
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--adm-text-med, #64748B)', fontSize: 14 }}>
            Monitor active devices, IP addresses, and live heartbeats. Revoke compromised or stale credentials immediately.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={loadSessions}
            disabled={loading || actionLoading}
            className="admin-btn admin-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          {otherSessions.length > 0 && (
            <button
              onClick={handleRevokeOthers}
              disabled={actionLoading}
              className="admin-btn admin-btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
            >
              <LogOut size={14} />
              <span>Revoke Other Devices ({otherSessions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '12px 16px', borderRadius: 8, color: '#B91C1C', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '12px 16px', borderRadius: 8, color: '#047857', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="admin-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-card admin-stat-card">
          <div className="admin-stat-value">{sessions.length}</div>
          <div className="admin-stat-label">Total Active Sessions</div>
        </div>

        <div className="admin-card admin-stat-card">
          <div className="admin-stat-value" style={{ fontSize: 18, fontWeight: 600, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            {currentSession?.deviceInfo?.browser || 'Browser'} on {currentSession?.deviceInfo?.os || 'System'}
          </div>
          <div className="admin-stat-label">This Device (Current Session)</div>
        </div>

        <div className="admin-card admin-stat-card">
          <div className="admin-stat-value" style={{ fontSize: 18, fontWeight: 600, color: '#2563EB' }}>
            {currentSession?.ipAddress || 'Loopback / Gateway'}
          </div>
          <div className="admin-stat-label">Current Client IP</div>
        </div>
      </div>

      {/* Sessions Table Card */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#0F172A' }}>
            Registered Devices & Access Heartbeats
          </div>
          <span style={{ fontSize: 13, color: '#64748B' }}>
            Auto-refreshes every 30s
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Device & Browser</th>
                <th>IP Address</th>
                <th>Admin Account</th>
                <th>Last Active Heartbeat</th>
                <th>Session Started</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                    <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                    <div>Loading active administrative sessions...</div>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                    No active sessions found.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const browser = s.deviceInfo?.browser || 'Unknown';
                  const os = s.deviceInfo?.os || 'Unknown OS';
                  const device = s.deviceInfo?.device || 'Desktop';

                  return (
                    <tr
                      key={s.sessionId}
                      style={{
                        background: s.isCurrent ? '#F8FAFC' : 'transparent',
                        borderLeft: s.isCurrent ? '3px solid #2563EB' : '3px solid transparent',
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ background: '#F1F5F9', padding: 8, borderRadius: 6, display: 'flex' }}>
                            {getDeviceIcon(device)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>
                              {browser} on {os}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              {device} &middot; ID: {s.sessionId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Globe size={13} color="#64748B" />
                          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#334155' }}>
                            {s.ipAddress || '::1 (Local)'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span style={{ fontWeight: 500, fontSize: 13, color: '#0F172A' }}>
                          {s.adminUsername}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
                          <Clock size={13} color="#64748B" />
                          <span>{formatRelativeTime(s.lastActiveAt)}</span>
                        </div>
                      </td>

                      <td style={{ fontSize: 12, color: '#64748B' }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>

                      <td>
                        {s.isCurrent ? (
                          <span className="admin-badge admin-badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }}></span>
                            This Device
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-gray">
                            Active
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {s.isCurrent ? (
                          <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                            Current
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRevokeSingle(s.sessionId)}
                            disabled={actionLoading}
                            className="admin-btn admin-btn-danger"
                            style={{
                              padding: '4px 10px',
                              fontSize: 12,
                              borderRadius: 4,
                              cursor: 'pointer',
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
