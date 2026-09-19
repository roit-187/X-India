'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Eye,
  Building2,
  FileText,
  User,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import Badge from '@/components/admin/Badge';
import SellerDetailModal from '@/components/admin/SellerDetailModal';

export default function VerificationQueuePage() {
  const [activeTab, setActiveTab] = useState('pending'); // pending | verified | declined
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, verified: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  // Selected items for bulk operations
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // 360-degree Inspection Modal State
  const [inspectManufacturerId, setInspectManufacturerId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: activeTab,
        sort,
      });
      if (search.trim()) params.set('search', search.trim());
      if (category.trim()) params.set('category', category.trim());

      const res = await fetch(`/api/admin/verification/queue?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
        setTotalPages(data.totalPages || 1);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Error loading verification queue:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, category, sort]);

  useEffect(() => {
    loadData();
    setSelectedIds(new Set());
  }, [loadData]);

  // Bulk selection helpers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === requests.length && requests.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(requests.map((r) => r._id)));
    }
  };

  const handleToggleRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkDecision = async (decision) => {
    if (selectedIds.size === 0) return;
    const confirmMsg =
      decision === 'verified'
        ? `Are you sure you want to verify and grant verified badges to ${selectedIds.size} selected seller(s)?`
        : `Are you sure you want to decline ${selectedIds.size} selected verification request(s)? They will be moved to the Declined archive.`;

    if (!confirm(confirmMsg)) return;

    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/verification/bulk-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          decision,
          verifierNotes: decision === 'verified' ? 'Approved in bulk via Admin Hub' : 'Declined in bulk via Admin Hub',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedIds(new Set());
        loadData();
      } else {
        alert(data.message || 'Bulk decision failed');
      }
    } catch (e) {
      alert('Error during bulk operation: ' + e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const handleSingleDecision = async (id, decision) => {
    try {
      const res = await fetch(`/api/admin/verification/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          verifierNotes: decision === 'verified' ? 'Approved via Admin Hub' : 'Declined via Admin Hub',
          evidencePhotos: [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.message || 'Decision failed');
      }
    } catch (e) {
      alert('Error: ' + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={28} color="#2563EB" /> Verification & Trust Hub
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Review physical audit requests, inspect seller GST credentials, and manage trust badges.
          </p>
        </div>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => loadData()}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Counter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div
          onClick={() => { setActiveTab('pending'); setPage(1); }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            border: activeTab === 'pending' ? '2px solid #2563EB' : '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Pending Queue</span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {counts.pending}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Awaiting audit or review</div>
        </div>

        <div
          onClick={() => { setActiveTab('verified'); setPage(1); }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            border: activeTab === 'verified' ? '2px solid #16A34A' : '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Verified Manufacturers</span>
            <CheckCircle2 size={18} color="#16A34A" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {counts.verified}
          </div>
          <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>Trust badge awarded</div>
        </div>

        <div
          onClick={() => { setActiveTab('declined'); setPage(1); }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            border: activeTab === 'declined' ? '2px solid #DC2626' : '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Declined Archive</span>
            <XCircle size={18} color="#DC2626" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {counts.declined}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Archived; can re-verify anytime</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              className="admin-input"
              style={{ width: '100%', paddingLeft: 36, height: 38 }}
              placeholder="Search by seller name, company, or GSTIN..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="admin-input"
              style={{ height: 38, minWidth: 160 }}
              placeholder="Filter by Category..."
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            />

            <select
              className="admin-input"
              style={{ height: 38 }}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedIds.size > 0 && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 16px',
              backgroundColor: '#EFF6FF',
              borderRadius: 8,
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
              {selectedIds.size} seller{selectedIds.size > 1 ? 's' : ''} selected
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="admin-btn admin-btn-primary"
                disabled={bulkLoading}
                onClick={() => handleBulkDecision('verified')}
                style={{ backgroundColor: '#16A34A', borderColor: '#15803D', padding: '5px 14px', fontSize: 12 }}
              >
                Verify All Selected ({selectedIds.size})
              </button>
              <button
                className="admin-btn admin-btn-danger"
                disabled={bulkLoading}
                onClick={() => handleBulkDecision('rejected')}
                style={{ padding: '5px 14px', fontSize: 12 }}
              >
                Decline All Selected ({selectedIds.size})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === requests.length && requests.length > 0}
                  onChange={handleToggleSelectAll}
                  disabled={requests.length === 0}
                />
              </th>
              <th>Seller & Company</th>
              <th>Contact Details</th>
              <th>GSTIN / Certificate</th>
              <th>Audit Slot / Status</th>
              <th>Submitted</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                  Loading verification queue...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>
                  No verification requests found in this section.
                </td>
              </tr>
            )}

            {!loading &&
              requests.map((r) => {
                const isSelected = selectedIds.has(r._id);
                const user = r.userId;
                const mfr = r.manufacturerId;
                const gstCertUrl = user?.businessDocuments?.gst?.fileUrl;

                return (
                  <tr key={r._id} style={isSelected ? { backgroundColor: '#F0FDF4' } : {}}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(r._id)}
                      />
                    </td>
                    <td>
                      <div>
                        <strong
                          style={{ color: '#2563EB', cursor: 'pointer', fontSize: 14 }}
                          onClick={() => {
                            if (mfr?._id) setInspectManufacturerId(mfr._id);
                          }}
                        >
                          {mfr?.name || user?.companyName || 'Seller Profile'} ↗
                        </strong>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Owner: {user?.firstName} {user?.lastName || ''} &middot; {mfr?.category || mfr?.industry || 'Manufacturing'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>
                        {r.requestedLocation?.address || mfr?.address || user?.location || '-'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: 13, color: '#0F172A' }}>{user?.email || '-'}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{user?.phone || '-'}</div>
                    </td>

                    <td>
                      {user?.gstNumber ? (
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: 0.5 }}>
                            {user.gstNumber}
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                            {user.gstVerified && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: '#DCFCE7', color: '#15803D' }}>
                                Valid Checksum
                              </span>
                            )}
                            {gstCertUrl && (
                              <a
                                href={gstCertUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  fontSize: 11,
                                  color: '#2563EB',
                                  textDecoration: 'none',
                                  fontWeight: 600,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2,
                                }}
                              >
                                View Doc <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: 12 }}>Skipped / No GST</span>
                      )}
                    </td>

                    <td>
                      {r.scheduledVisit?.date ? (
                        <div>
                          <strong style={{ fontSize: 13, color: '#0F172A' }}>{r.scheduledVisit.date}</strong>
                          <div style={{ fontSize: 12, color: '#EA580C', fontWeight: 600 }}>{r.scheduledVisit.slot}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748B' }}>Document-only review</span>
                      )}
                      <div style={{ marginTop: 4 }}>
                        <Badge
                          label={r.status}
                          variant={r.status === 'verified' ? 'verified' : r.status === 'rejected' ? 'expired' : 'active'}
                        />
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '4px 8px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          onClick={() => {
                            if (mfr?._id) setInspectManufacturerId(mfr._id);
                          }}
                        >
                          <Eye size={12} /> Inspect 360°
                        </button>

                        {r.status !== 'verified' && (
                          <button
                            className="admin-btn admin-btn-primary"
                            style={{ backgroundColor: '#16A34A', borderColor: '#15803D', padding: '4px 8px', fontSize: 11 }}
                            onClick={() => handleSingleDecision(r._id, 'verified')}
                          >
                            Verify
                          </button>
                        )}

                        {r.status !== 'rejected' && (
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            onClick={() => handleSingleDecision(r._id, 'rejected')}
                          >
                            Decline
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="admin-pagination" style={{ padding: 16 }}>
            <button
              className="admin-btn admin-btn-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span style={{ fontSize: 13, color: '#64748B' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="admin-btn admin-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* 360-Degree Seller Detail Inspection Pop-up Modal */}
      <SellerDetailModal
        open={!!inspectManufacturerId}
        onClose={() => setInspectManufacturerId(null)}
        manufacturerId={inspectManufacturerId}
        onStatusChanged={loadData}
      />
    </div>
  );
}
