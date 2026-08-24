'use client';

import { useEffect, useState, useCallback } from 'react';
import ManufacturerCard from '@/components/admin/ManufacturerCard';
import Modal from '@/components/admin/Modal';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function ManufacturersPage() {
  const { isSuperAdmin } = useAdminPermissions();
  const [manufacturers, setManufacturers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    planStatus: '',
    search: '',
    category: '',
    verified: '',
    isActive: '',
    state: '',
    city: '',
  });
  const [loading, setLoading] = useState(true);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const [reason, setReason] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const [targetBlock, setTargetBlock] = useState(null);
  const [blockMode, setBlockMode] = useState('temporary');
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.planStatus) params.set('planStatus', filters.planStatus);
    if (filters.search)     params.set('search', filters.search);
    if (filters.category)   params.set('category', filters.category);
    if (filters.verified)   params.set('verified', filters.verified);
    if (filters.isActive)   params.set('isActive', filters.isActive);
    if (filters.state)      params.set('stateId', filters.state);
    if (filters.city)       params.set('cityId', filters.city);

    const res = await fetch(`/api/admin/manufacturers?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setManufacturers(data.manufacturers || []);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ planStatus: '', search: '', category: '', verified: '', isActive: '', state: '', city: '' });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const handleToggleActive = (id, next) => {
    if (!isSuperAdmin) return;
    if (next === false) {
      setPendingDeactivate(id);
      return;
    }
    applyStatusChange(id, true, '');
  };

  const applyStatusChange = async (id, isActive, statusReason) => {
    if (!isSuperAdmin) return;
    await fetch(`/api/admin/manufacturers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive, reason: statusReason }),
    });
    setPendingDeactivate(null);
    setReason('');
    load();
  };

  const handleOpenBlockModal = (mfr) => {
    if (!isSuperAdmin) return;
    setTargetBlock(mfr);
    setBlockMode('temporary');
    setBlockDays(30);
    setBlockReason('');
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin || !targetBlock || !blockReason.trim()) return;
    const payload = blockMode === 'temporary'
      ? { mode: 'temporary', days: Number(blockDays), reason: blockReason }
      : { mode: 'blacklist', reason: blockReason };
    const res = await fetch(`/api/admin/manufacturers/${targetBlock._id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Failed to block seller');
    } else {
      setTargetBlock(null);
      load();
    }
  };

  const handleUnblock = async (id) => {
    if (!isSuperAdmin) return;
    const res = await fetch(`/api/admin/manufacturers/${id}/unblock`, { method: 'PATCH' });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Failed to unblock seller');
    } else {
      load();
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Manufacturers</h1>
        {activeFilterCount > 0 && (
          <button className="admin-btn admin-btn-secondary" onClick={clearFilters} style={{ fontSize: 13 }}>
            Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          className="admin-input"
          style={{ flex: '1 1 180px' }}
          placeholder="Search by name..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
        <select className="admin-select" value={filters.planStatus} onChange={(e) => setFilter('planStatus', e.target.value)}>
          <option value="">All plan statuses</option>
          <option value="active">Active</option>
          <option value="grace">Grace Period</option>
          <option value="expired">Expired</option>
          <option value="none">No Plan</option>
        </select>
        <select className="admin-select" value={filters.isActive} onChange={(e) => setFilter('isActive', e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Active accounts</option>
          <option value="false">Deactivated</option>
        </select>
        <select className="admin-select" value={filters.verified} onChange={(e) => setFilter('verified', e.target.value)}>
          <option value="">All verification</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
        <button
          className={`admin-btn ${filtersExpanded ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
          onClick={() => setFiltersExpanded((v) => !v)}
          style={{ fontSize: 13 }}
        >
          {filtersExpanded ? 'Hide' : 'More'} Filters
        </button>
      </div>

      {filtersExpanded && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px' }}>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>Category</label>
            <input className="admin-input" style={{ width: '100%' }} placeholder="e.g. Textiles, Packaging" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>State</label>
            <input className="admin-input" style={{ width: '100%' }} placeholder="e.g. Maharashtra" value={filters.state} onChange={(e) => setFilter('state', e.target.value)} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>City</label>
            <input className="admin-input" style={{ width: '100%' }} placeholder="e.g. Mumbai" value={filters.city} onChange={(e) => setFilter('city', e.target.value)} />
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-grid">
          {manufacturers.map((m) => (
            <ManufacturerCard
              key={m._id}
              manufacturer={m}
              canManageSellers={isSuperAdmin}
              onToggleActive={handleToggleActive}
              onOpenBlockModal={handleOpenBlockModal}
              onUnblock={handleUnblock}
            />
          ))}
          {manufacturers.length === 0 && (
            <p style={{ gridColumn: '1 / -1', color: '#64748B' }}>No manufacturers found</p>
          )}
        </div>
      )}

      <div className="admin-pagination">
        <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {isSuperAdmin && (
        <>
          <Modal open={!!pendingDeactivate} onClose={() => setPendingDeactivate(null)} title="Deactivate Seller">
            <p style={{ marginBottom: 12 }}>This will hide all their products and business opportunities from the public site until reactivated.</p>
            <textarea className="admin-input" style={{ width: '100%', minHeight: 80 }} placeholder="Reason (e.g. non-payment after grace period)" value={reason} onChange={(e) => setReason(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setPendingDeactivate(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={() => applyStatusChange(pendingDeactivate, false, reason)}>Deactivate</button>
            </div>
          </Modal>

          <Modal open={!!targetBlock} onClose={() => setTargetBlock(null)} title="Block Seller">
            <form onSubmit={handleBlockSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Block Type</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ fontSize: 14 }}>
                    <input type="radio" name="blockMode" value="temporary" checked={blockMode === 'temporary'} onChange={() => setBlockMode('temporary')} /> Block temporarily
                  </label>
                  <label style={{ fontSize: 14 }}>
                    <input type="radio" name="blockMode" value="blacklist" checked={blockMode === 'blacklist'} onChange={() => setBlockMode('blacklist')} /> Blacklist permanently
                  </label>
                </div>
              </div>
              {blockMode === 'temporary' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Duration (days)</label>
                  <input type="number" min="1" max="365" className="admin-input" value={blockDays} onChange={(e) => setBlockDays(e.target.value)} required />
                </div>
              )}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Reason</label>
                <textarea className="admin-input" style={{ width: '100%', minHeight: 80 }} placeholder="Reason for blocking (required)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setTargetBlock(null)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-danger" disabled={!blockReason.trim()}>
                  {blockMode === 'temporary' ? 'Block Seller' : 'Blacklist Seller'}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}

