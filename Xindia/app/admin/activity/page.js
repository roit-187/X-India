'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

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
  PLAN_ASSIGN: '#D97706',
  CREDIT_ASSIGN: '#D97706',
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
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    staffId: '',
    dateFrom: '',
    dateTo: '',
  });
  const [staffList, setStaffList] = useState([]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filters.search)   params.set('search', filters.search);
      if (filters.action)   params.set('action', filters.action);
      if (filters.staffId)  params.set('adminId', filters.staffId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo)   params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/admin/audit-logs?${params}`);
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
  }, [page, filters]);

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

  const setFilter = (key, val) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: val }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ search: '', action: '', staffId: '', dateFrom: '', dateTo: '' });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Monitor Activity</h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
            Live audit log of all admin &amp; staff actions across the portal.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeFilterCount > 0 && (
            <button className="admin-btn admin-btn-secondary" onClick={clearFilters} style={{ fontSize: 12 }}>
              Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
            </button>
          )}
          <div style={{
            fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
            background: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0',
          }}>
            ● Live
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>🔍</span>
          <input
            className="admin-input"
            style={{ width: '100%', paddingLeft: 30, height: 36 }}
            placeholder="Search by staff name, action, resource, or IP..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
        <select className="admin-select" style={{ minWidth: 160 }} value={filters.staffId} onChange={(e) => setFilter('staffId', e.target.value)}>
          <option value="">All Staff</option>
          {staffList.map((s) => (
            <option key={s._id} value={s._id}>
              {s.fullName || s.username} {s.employeeId ? `(${s.employeeId})` : ''}
            </option>
          ))}
        </select>
        <select className="admin-select" style={{ minWidth: 160 }} value={filters.action} onChange={(e) => setFilter('action', e.target.value)}>
          <option value="">All Actions</option>
          {['VERIFY', 'DECLINE', 'PRODUCT_HIDE', 'PRODUCT_SHOW', 'MANUFACTURER_DEACTIVATE', 'MANUFACTURER_ACTIVATE', 'MANUFACTURER_BLOCK', 'STAFF_ONBOARD_SELLER', 'LOGIN', 'PLAN_ASSIGN', 'CREDIT_ASSIGN'].map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input type="date" className="admin-input" style={{ width: 140 }} value={filters.dateFrom} onChange={(e) => setFilter('dateFrom', e.target.value)} />
        <input type="date" className="admin-input" style={{ width: 140 }} value={filters.dateTo} onChange={(e) => setFilter('dateTo', e.target.value)} />
      </div>

      {/* Count line */}
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
        Showing {logs.length} of {total} audit entries
      </div>

      {/* Log table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#94A3B8' }}>Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="admin-card" style={{ textAlign: 'center', padding: 48, color: '#64748B' }}>
          No audit log entries match your filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 150 }}>Timestamp</th>
                <th>Operator</th>
                <th style={{ width: 130 }}>Employee ID</th>
                <th style={{ width: 120 }}>Role</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Target ID</th>
                <th style={{ width: 130 }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const color = getActionColor(log.action);
                return (
                  <tr key={log._id}>
                    <td style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt || log.timestamp).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {log.adminFullName || log.adminUsername || 'Unknown'}
                      </div>
                      {log.adminUsername && log.adminFullName && (
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{log.adminUsername}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>
                      {log.employeeId || '—'}
                    </td>
                    <td style={{ fontSize: 11, color: '#64748B' }}>
                      {log.adminRole || '—'}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                        fontSize: 11, fontWeight: 700,
                        background: color + '20', color: color,
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{log.resource || '—'}</td>
                    <td style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                      {log.targetId ? String(log.targetId).slice(-8) + '…' : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                      {log.ipAddress || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-pagination" style={{ marginTop: 16 }}>
        <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
