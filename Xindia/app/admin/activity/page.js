'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { Activity, Search, RefreshCw, X, ShieldAlert, Sparkles, Filter, Calendar, Eye, User, FileText, ChevronRight } from 'lucide-react';

const ACTION_COLORS = {
  VERIFY: '#16A34A',
  DECLINE: '#DC2626',
  PRODUCT_HIDE: '#DC2626',
  PRODUCT_SHOW: '#16A34A',
  MANUFACTURER_DEACTIVATE: '#DC2626',
  MANUFACTURER_ACTIVATE: '#16A34A',
  MANUFACTURER_BLOCK: '#991B1B',
  STAFF_ONBOARD_SELLER: '#7C3AED',
  LOGIN: '#2563EB',
  LOGOUT: '#64748B',
  PLAN_ASSIGN: '#D97706',
  CREDIT_ASSIGN: '#D97706',
  PROMOTION: '#E8581C',
  SPOTLIGHT: '#E8581C',
  REFUND: '#9333EA',
  SECURITY: '#DC2626',
  DEFAULT: '#64748B',
};

function getActionColor(action = '') {
  const upper = action.toUpperCase();
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (upper.includes(key)) return color;
  }
  return ACTION_COLORS.DEFAULT;
}

export default function AdminActivityMonitorPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [search, setSearch] = useState('');
  const [categoryChip, setCategoryChip] = useState('ALL');
  const [actionChip, setActionChip] = useState('ALL');
  const [dateChip, setDateChip] = useState('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Selected Log Drawer / Modal
  const [inspectLog, setInspectLog] = useState(null);
  const [staffList, setStaffList] = useState([]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      if (categoryChip !== 'ALL') params.set('category', categoryChip);
      if (selectedStaffId) params.set('adminId', selectedStaffId);

      // Handle Action Chips
      if (actionChip !== 'ALL') {
        params.set('action', actionChip);
      }

      // Handle Date Preset Chips
      const now = new Date();
      if (dateChip === 'TODAY') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.set('dateFrom', start.toISOString().split('T')[0]);
      } else if (dateChip === 'YESTERDAY') {
        const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        params.set('dateFrom', yest.toISOString().split('T')[0]);
        params.set('dateTo', yest.toISOString().split('T')[0]);
      } else if (dateChip === 'LAST_7_DAYS') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        params.set('dateFrom', sevenDaysAgo.toISOString().split('T')[0]);
      } else if (dateChip === 'LAST_30_DAYS') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        params.set('dateFrom', thirtyDaysAgo.toISOString().split('T')[0]);
      } else if (dateChip === 'CUSTOM') {
        if (customDateFrom) params.set('dateFrom', customDateFrom);
        if (customDateTo) params.set('dateTo', customDateTo);
      }

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error('Error loading audit logs:', e);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryChip, actionChip, dateChip, selectedStaffId, customDateFrom, customDateTo]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/staff?limit=100');
      const data = await res.json();
      if (data.success) setStaffList(data.staff || data.admins || []);
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (loaded && isSuperAdmin) {
      loadLogs();
      loadStaff();
    }
  }, [loaded, isSuperAdmin, loadLogs, loadStaff]);

  const clearAllFilters = () => {
    setPage(1);
    setSearch('');
    setCategoryChip('ALL');
    setActionChip('ALL');
    setDateChip('ALL');
    setSelectedStaffId('');
    setCustomDateFrom('');
    setCustomDateTo('');
  };

  const isFiltered = search || categoryChip !== 'ALL' || actionChip !== 'ALL' || dateChip !== 'ALL' || selectedStaffId;

  if (!loaded) return null;
  if (!isSuperAdmin) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2>Access Restricted</h2>
        <p style={{ color: '#64748B' }}>Activity Monitor is only accessible to Super Admin.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={24} color="#E8581C" />
            Platform Activity Monitor
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            Live cryptographic audit trail of all staff, operational, and spotlight actions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {isFiltered && (
            <button className="admin-btn admin-btn-secondary" onClick={clearAllFilters} style={{ fontSize: 12 }}>
              Reset Filters
            </button>
          )}

          <button onClick={loadLogs} className="admin-btn admin-btn-secondary" style={{ fontSize: 12 }}>
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
            Refresh
          </button>

          <div style={{
            fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
            background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16A34A' }} />
            Live Audit Stream
          </div>
        </div>
      </div>

      {/* Prominent Search Bar */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          className="admin-input"
          style={{ width: '100%', paddingLeft: 40, paddingRight: search ? 36 : 14, height: 42, fontSize: 14, borderRadius: 10 }}
          placeholder="Search by operator, username, action, resource, target ID, or IP..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── FILTER CHIPS ROW 1: EVENT CATEGORIES ─────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Event Category
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'SPOTLIGHT', label: '⚡ Spotlights & Pins' },
            { id: 'STAFF_AUTH', label: '👤 Staff & Logins' },
            { id: 'MANUFACTURERS', label: '🏭 Suppliers & Docs' },
            { id: 'PRODUCTS', label: '📦 Products' },
            { id: 'BILLING', label: '💳 Billing & Plans' },
            { id: 'MODERATION', label: '🛡️ Moderation' },
            { id: 'SECURITY', label: '🔒 Security Blocks' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategoryChip(c.id); setPage(1); }}
              style={{
                border: categoryChip === c.id ? '1px solid #0F172A' : '1px solid #E2E8F0',
                background: categoryChip === c.id ? '#0F172A' : '#FFFFFF',
                color: categoryChip === c.id ? '#FFFFFF' : '#475569',
                fontSize: 12, fontWeight: categoryChip === c.id ? 700 : 500,
                padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTER CHIPS ROW 2: ACTION / MUTATION TYPES ───────────────────── */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Action Type
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Types' },
            { id: 'LOGIN', label: '🔑 Logins & Sessions' },
            { id: 'VERIFY', label: '🟢 Verifications' },
            { id: 'DECLINE', label: '🔴 Rejections' },
            { id: 'PRODUCT_HIDE', label: '📦 Product Hides' },
            { id: 'PRODUCT_SHOW', label: '📦 Product Shows' },
            { id: 'MANUFACTURER_DEACTIVATE', label: '⚠️ Deactivations' },
            { id: 'MANUFACTURER_BLOCK', label: '🚫 Blocks & Blacklists' },
            { id: 'PLAN_ASSIGN', label: '💳 Plan Assigns' },
            { id: 'CREDIT_ASSIGN', label: '🪙 Credit Top-ups' },
            { id: 'PROMOTION', label: '⚡ Spotlight Edits' },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => { setActionChip(a.id); setPage(1); }}
              style={{
                border: actionChip === a.id ? '1px solid #E8581C' : '1px solid #E2E8F0',
                background: actionChip === a.id ? '#FFF7ED' : '#FAFAFA',
                color: actionChip === a.id ? '#C2410C' : '#64748B',
                fontSize: 11, fontWeight: actionChip === a.id ? 700 : 500,
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── FILTER CHIPS ROW 3: DATE HORIZONS & STAFF ────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginRight: 4 }}>Date:</span>
          {[
            { id: 'ALL', label: 'All Time' },
            { id: 'TODAY', label: 'Today' },
            { id: 'YESTERDAY', label: 'Yesterday' },
            { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
            { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
            { id: 'CUSTOM', label: 'Custom Range...' },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => { setDateChip(d.id); setPage(1); }}
              style={{
                border: dateChip === d.id ? '1px solid #2563EB' : '1px solid #E2E8F0',
                background: dateChip === d.id ? '#EFF6FF' : '#FFFFFF',
                color: dateChip === d.id ? '#1D4ED8' : '#64748B',
                fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4, cursor: 'pointer',
              }}
            >
              {d.label}
            </button>
          ))}

          {dateChip === 'CUSTOM' && (
            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', marginLeft: 6 }}>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => { setCustomDateFrom(e.target.value); setPage(1); }}
                className="admin-input"
                style={{ height: 28, fontSize: 11, padding: '0 6px' }}
              />
              <span style={{ fontSize: 11, color: '#94A3B8' }}>to</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => { setCustomDateTo(e.target.value); setPage(1); }}
                className="admin-input"
                style={{ height: 28, fontSize: 11, padding: '0 6px' }}
              />
            </div>
          )}
        </div>

        {/* Staff selector */}
        <select
          value={selectedStaffId}
          onChange={(e) => { setSelectedStaffId(e.target.value); setPage(1); }}
          className="admin-select"
          style={{ height: 32, fontSize: 12, minWidth: 160 }}
        >
          <option value="">All Staff Members</option>
          {staffList.map((s) => (
            <option key={s._id} value={s._id}>
              {s.fullName || s.username} {s.employeeId ? `(${s.employeeId})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Count Line */}
      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {logs.length} of {total} recorded actions</span>
        <span>Click any row to inspect full cryptographic audit payload</span>
      </div>

      {/* Log Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading activity logs...</div>
      ) : logs.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 60, color: '#64748B' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <h3 style={{ margin: 0, fontWeight: 700, color: '#0F172A' }}>No Audit Entries Match</h3>
          <p style={{ margin: '6px 0 14px', fontSize: 13, color: '#64748B' }}>
            No actions recorded matching the selected filter criteria.
          </p>
          <button onClick={clearAllFilters} className="admin-btn admin-btn-secondary" style={{ fontSize: 12 }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Timestamp</th>
                <th>Operator</th>
                <th style={{ width: 110 }}>Employee ID</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Target ID</th>
                <th style={{ width: 110 }}>IP Address</th>
                <th style={{ width: 50, textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const color = getActionColor(log.action);
                return (
                  <tr
                    key={log._id}
                    onClick={() => setInspectLog(log)}
                    style={{ cursor: 'pointer' }}
                    className="hover-row"
                  >
                    <td style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt || log.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#0F172A' }}>
                        {log.adminFullName || log.adminUsername || 'System'}
                      </div>
                      {log.adminUsername && log.adminFullName && (
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>@{log.adminUsername}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
                      {log.employeeId || '—'}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                        background: color + '15', color: color,
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{log.resource || '—'}</td>
                    <td style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                      {log.targetId ? String(log.targetId).slice(-8) + '…' : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                      {log.ipAddress || '—'}
                    </td>
                    <td style={{ textAlign: 'center', color: '#CBD5E1' }}>
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-pagination" style={{ marginTop: 16 }}>
          <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {/* ── INSPECT AUDIT LOG MODAL ─────────────────────────────────────── */}
      {inspectLog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 580,
            maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Audit Log Inspection</h3>
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>ID: {inspectLog._id}</div>
              </div>
              <button onClick={() => setInspectLog(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Action Performed</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: getActionColor(inspectLog.action) }}>
                    {inspectLog.action}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Timestamp</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    {new Date(inspectLog.createdAt || inspectLog.timestamp).toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Operator</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                    {inspectLog.adminFullName || inspectLog.adminUsername} ({inspectLog.adminRole || 'Admin'})
                  </div>
                </div>

                <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: '#64748B' }}>IP Address / Device</div>
                  <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#0F172A' }}>
                    {inspectLog.ipAddress || 'Local'}
                  </div>
                </div>
              </div>

              {/* Resource & Target */}
              <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: '#64748B' }}>Resource &amp; Target ID</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                  {inspectLog.resource} → <span style={{ fontFamily: 'monospace', color: '#2563EB' }}>{inspectLog.targetId || 'N/A'}</span>
                </div>
              </div>

              {/* Changes Payload Diff */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Mutated Data / Changes Payload
                </div>
                <pre style={{
                  background: '#0F172A', color: '#38BDF8', padding: 14, borderRadius: 8,
                  fontSize: 12, overflowX: 'auto', maxHeight: 220, fontFamily: 'monospace', margin: 0,
                }}>
                  {JSON.stringify(inspectLog.changes || {}, null, 2)}
                </pre>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              {inspectLog.hash && (
                <div style={{ background: '#F1F5F9', padding: '8px 12px', borderRadius: 6, fontSize: 11, color: '#475569' }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>SHA-256 Cryptographic Audit Hash</div>
                  <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: 10, color: '#64748B' }}>
                    {inspectLog.hash}
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setInspectLog(null)} className="admin-btn admin-btn-secondary" style={{ fontSize: 12 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
