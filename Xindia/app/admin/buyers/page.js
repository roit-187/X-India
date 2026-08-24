'use client';

import { useEffect, useState, useCallback } from 'react';
import BuyerCard from '@/components/admin/BuyerCard';
import Modal from '@/components/admin/Modal';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function BuyersPage() {
  const { isSuperAdmin, hasPermission } = useAdminPermissions();
  const [buyers, setBuyers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: '', active: '', joinedFrom: '', joinedTo: '' });
  const [loading, setLoading] = useState(true);

  // Block Modal state
  const [targetBuyer, setTargetBuyer] = useState(null);
  const [blockMode, setBlockMode] = useState('temporary'); // 'temporary' | 'blacklist'
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.search)     params.set('search', filters.search);
    if (filters.active)     params.set('active', filters.active);
    if (filters.joinedFrom) params.set('joinedFrom', filters.joinedFrom);
    if (filters.joinedTo)   params.set('joinedTo', filters.joinedTo);

    const res = await fetch(`/api/admin/buyers?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      setBuyers(data.buyers || []);
      setTotalPages(data.totalPages || 1);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleOpenBlockModal = (buyer) => {
    if (!hasPermission('buyers.block')) return;
    setTargetBuyer(buyer);
    setBlockMode('temporary');
    setDays(30);
    setReason('');
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!hasPermission('buyers.block') || !targetBuyer || !reason.trim()) return;

    // Staff cannot blacklist
    const effectiveMode = isSuperAdmin ? blockMode : 'temporary';

    const payload = effectiveMode === 'temporary'
      ? { mode: 'temporary', days: Number(days), reason }
      : { mode: 'blacklist', reason };

    const res = await fetch(`/api/admin/buyers/${targetBuyer._id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Failed to block buyer');
    } else {
      setTargetBuyer(null);
      load();
    }
  };

  const handleUnblock = async (id) => {
    if (!isSuperAdmin) return;
    const res = await fetch(`/api/admin/buyers/${id}/unblock`, {
      method: 'PATCH',
    });
    const data = await res.json();
    if (!data.success) {
      alert(data.message || 'Failed to unblock buyer');
    } else {
      load();
    }
  };

  return (
    <div>
      <h1>Buyers</h1>

      <div style={{ display: 'flex', gap: 10, margin: '16px 0', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <input
          className="admin-input"
          style={{ flex: '1 1 180px' }}
          placeholder="Search name, email, phone..."
          value={filters.search}
          onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, search: e.target.value })); }}
        />
        <select
          className="admin-select"
          value={filters.active}
          onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, active: e.target.value })); }}
        >
          <option value="">All activity</option>
          <option value="true">Active (last 30 days)</option>
          <option value="false">Inactive</option>
        </select>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 3 }}>Joined From</label>
          <input
            type="date"
            className="admin-input"
            value={filters.joinedFrom}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, joinedFrom: e.target.value })); }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748B', marginBottom: 3 }}>Joined To</label>
          <input
            type="date"
            className="admin-input"
            value={filters.joinedTo}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, joinedTo: e.target.value })); }}
          />
        </div>
        {(filters.joinedFrom || filters.joinedTo) && (
          <button
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: 12 }}
            onClick={() => { setPage(1); setFilters((f) => ({ ...f, joinedFrom: '', joinedTo: '' })); }}
          >
            Clear dates
          </button>
        )}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="admin-grid">
          {buyers.map((b) => (
            <BuyerCard
              key={b._id}
              buyer={b}
              canBlock={hasPermission('buyers.block')}
              canUnblock={isSuperAdmin}
              onOpenBlockModal={handleOpenBlockModal}
              onUnblock={handleUnblock}
            />
          ))}
          {buyers.length === 0 && (
            <p style={{ gridColumn: '1 / -1', color: '#64748B' }}>No buyers found</p>
          )}
        </div>
      )}

      <div className="admin-pagination">
        <button className="admin-btn admin-btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button className="admin-btn admin-btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>

      {/* Block Modal */}
      <Modal open={!!targetBuyer} onClose={() => setTargetBuyer(null)} title="Block Buyer">
        <form onSubmit={handleBlockSubmit}>
          {isSuperAdmin && (
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
          )}

          {!isSuperAdmin && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 13, color: '#1E40AF' }}>
              Staff accounts can temporarily suspend buyer accounts. Please provide a clear justification reason.
            </div>
          )}

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
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setTargetBuyer(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-danger" disabled={!reason.trim()}>
              {blockMode === 'temporary' ? 'Block Buyer' : 'Blacklist Buyer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
