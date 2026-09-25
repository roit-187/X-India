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
  AlertTriangle,
  FileCheck,
  Check,
  X,
  FileSearch,
} from 'lucide-react';
import Badge from '@/components/admin/Badge';
import SellerDetailModal from '@/components/admin/SellerDetailModal';

export default function VerificationQueuePage() {
  const [activeTab, setActiveTab] = useState('pending'); // pending | reverification | documents | verified | declined
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, verified: 0, declined: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');

  // Business Documents Verification State
  const [pendingDocs, setPendingDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docRejectTarget, setDocRejectTarget] = useState(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  // Selected items for bulk operations
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // 360-degree Inspection Modal State
  const [inspectManufacturerId, setInspectManufacturerId] = useState(null);

  // Attribution & Decision Modals State
  const [adminProfile, setAdminProfile] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [decisionModal, setDecisionModal] = useState(null); // { type: 'verified' | 'rejected', item: ... }
  const [declineReasonCategory, setDeclineReasonCategory] = useState('GST_INVALID');
  const [declineSellerMessage, setDeclineSellerMessage] = useState('');
  const [adminInternalNotes, setAdminInternalNotes] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState('');

  // Load operator profile from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_profile');
      if (stored) {
        setAdminProfile(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse admin profile:', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        status: activeTab === 'reverification' ? 'pending' : activeTab,
        sort,
      });
      if (search.trim()) params.set('search', search.trim());
      if (category.trim()) params.set('category', category.trim());

      const res = await fetch(`/api/admin/verification/queue?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        let reqs = data.requests || [];
        if (activeTab === 'reverification') {
          reqs = reqs.filter(
            (r) => r.verificationType === 'reverification' || r.reverificationPending
          );
        }
        setRequests(reqs);
        setTotalPages(data.totalPages || 1);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error('Error loading verification queue:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, category, sort]);

  const loadPendingDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch('/api/admin/documents/pending');
      const data = await res.json();
      if (data.success) {
        setPendingDocs(data.documents || []);
      }
    } catch (err) {
      console.error('Error loading pending documents:', err);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      loadPendingDocuments();
    } else {
      loadData();
    }
    // Also periodically prefetch document count
    fetch('/api/admin/documents/pending')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.documents)) {
          setPendingDocs(d.documents);
        }
      })
      .catch(() => {});

    setSelectedIds(new Set());
  }, [activeTab, loadData, loadPendingDocuments]);

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
          verifierNotes:
            decision === 'verified'
              ? `Approved in bulk by ${adminProfile?.fullName || adminProfile?.username || 'Admin'}`
              : `Declined in bulk by ${adminProfile?.fullName || adminProfile?.username || 'Admin'}`,
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

  // Open modal with attribution
  const openApproveModal = (request) => {
    setDecisionModal({ type: 'verified', item: request });
    setApprovalNotes('');
    setEvidencePhotos('');
  };

  const openDeclineModal = (request) => {
    setDecisionModal({ type: 'rejected', item: request });
    setDeclineReasonCategory('GST_INVALID');
    setDeclineSellerMessage('');
    setAdminInternalNotes('');
  };

  // Submit single decision with strict audit attribution & click-lock
  const submitDecision = async () => {
    if (!decisionModal?.item?._id) return;
    const { type, item } = decisionModal;

    if (type === 'rejected' && !declineSellerMessage.trim()) {
      alert('Please provide a message explaining to the seller why verification was declined.');
      return;
    }

    setActionInProgressId(item._id);
    try {
      const payload = {
        decision: type,
        reason:
          type === 'verified'
            ? 'Factory & Compliance Audit Passed'
            : declineReasonCategory,
        verifierNotes:
          type === 'verified'
            ? approvalNotes.trim() || 'Verified by Admin Compliance Team'
            : declineSellerMessage.trim(),
        internalNotes: adminInternalNotes.trim(),
        evidencePhotos: evidencePhotos
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        adminAttribution: {
          name: adminProfile?.fullName || adminProfile?.username || 'Compliance Officer',
          employeeId: adminProfile?.employeeId || 'STAFF',
          phone: adminProfile?.phone || '',
        },
      };

      const res = await fetch(`/api/admin/verification/${item._id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setDecisionModal(null);
        loadData();
      } else {
        alert(data.message || 'Decision failed');
      }
    } catch (e) {
      alert('Error recording decision: ' + e.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Document Verification handlers
  const handleReviewDoc = async (doc, action, reason = '') => {
    const targetMfrId = doc.manufacturerId || doc.userId;
    if (!targetMfrId) {
      alert('Could not locate manufacturer or seller ID for this document.');
      return;
    }

    setActionInProgressId(`${doc.userId}-${doc.docType}`);
    try {
      const res = await fetch(
        `/api/admin/manufacturers/${targetMfrId}/documents/${doc.docType}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            rejectionReason: reason,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setDocRejectTarget(null);
        setDocRejectReason('');
        loadPendingDocuments();
      } else {
        alert(data.message || 'Failed to update document status');
      }
    } catch (e) {
      alert('Error updating document: ' + e.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleBatchApproveDocs = async (manufacturerId) => {
    if (!confirm('Approve all uploaded business documents for this seller?')) return;
    setActionInProgressId(`batch-${manufacturerId}`);
    try {
      const res = await fetch(
        `/api/admin/manufacturers/${manufacturerId}/documents/batch-approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(`Successfully verified ${data.approvedCount || 'all'} documents!`);
        loadPendingDocuments();
      } else {
        alert(data.message || 'Batch approval failed');
      }
    } catch (e) {
      alert('Error during batch approval: ' + e.message);
    } finally {
      setActionInProgressId(null);
    }
  };

  // Safe resolver for inspect modal
  const handleInspect = (r) => {
    const id = r.manufacturerId?._id || r.manufacturerId || r.userId?._id || r.userId;
    if (id) {
      setInspectManufacturerId(id);
    } else {
      alert('No linked manufacturer record found for this request.');
    }
  };

  const reverificationCount = requests.filter(
    (r) => r.verificationType === 'reverification' || r.reverificationPending
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <ShieldCheck size={28} color="#2563EB" /> Verification & Trust Hub
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Review physical factory audit requests, verify legal documents, and govern verified badges with strict operator attribution.
          </p>
        </div>

        {/* Current Operator Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {adminProfile && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <User size={14} color="#2563EB" />
              <span>
                Auditor: <strong>{adminProfile.fullName || adminProfile.username}</strong>{' '}
                <span style={{ color: '#64748B' }}>({adminProfile.employeeId || 'STAFF'})</span>
              </span>
            </div>
          )}

          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => (activeTab === 'documents' ? loadPendingDocuments() : loadData())}
            disabled={loading || docsLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={loading || docsLoading ? 'spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Counter Navigation Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
        }}
      >
        {/* Pending Queue */}
        <div
          onClick={() => {
            setActiveTab('pending');
            setPage(1);
          }}
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Factory Audits</span>
            <Clock size={18} color="#F59E0B" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {counts.pending}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Awaiting factory audit</div>
        </div>

        {/* Business Documents Queue */}
        <div
          onClick={() => {
            setActiveTab('documents');
            setPage(1);
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            border: activeTab === 'documents' ? '2px solid #8B5CF6' : '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Business Documents</span>
            <FileCheck size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {pendingDocs.length}
          </div>
          <div style={{ fontSize: 12, color: '#8B5CF6', marginTop: 4 }}>Pending certificate review</div>
        </div>

        {/* Re-Verifications */}
        <div
          onClick={() => {
            setActiveTab('reverification');
            setPage(1);
          }}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            border: activeTab === 'reverification' ? '2px solid #EA580C' : '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: '0.2s',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Re-Verifications</span>
            <AlertTriangle size={18} color="#EA580C" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {reverificationCount}
          </div>
          <div style={{ fontSize: 12, color: '#EA580C', marginTop: 4 }}>Profile update reviews</div>
        </div>

        {/* Verified Manufacturers */}
        <div
          onClick={() => {
            setActiveTab('verified');
            setPage(1);
          }}
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
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {counts.verified}
          </div>
          <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>Trust badge active</div>
        </div>

        {/* Declined Archive */}
        <div
          onClick={() => {
            setActiveTab('declined');
            setPage(1);
          }}
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
          <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>
            {counts.declined}
          </div>
          <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>With decline reasons</div>
        </div>
      </div>

      {/* Filter & Search Bar (for factory queue) */}
      {activeTab !== 'documents' && (
        <div className="admin-card" style={{ padding: 16 }}>
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: 260 }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                }}
              />
              <input
                className="admin-input"
                style={{ width: '100%', paddingLeft: 36, height: 38 }}
                placeholder="Search by seller name, company, or GSTIN..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                className="admin-input"
                style={{ height: 38, minWidth: 160 }}
                placeholder="Filter by Category..."
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
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
                  style={{
                    backgroundColor: '#16A34A',
                    borderColor: '#15803D',
                    padding: '5px 14px',
                    fontSize: 12,
                  }}
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
      )}

      {/* Main Table: Factory / Re-verification / Archive Queue */}
      {activeTab !== 'documents' && (
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
                <th>
                  {activeTab === 'verified' || activeTab === 'declined'
                    ? 'Decision & Audit'
                    : 'Submitted'}
                </th>
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
                  const isReverification =
                    r.verificationType === 'reverification' || r.reverificationPending;
                  const isBusy = actionInProgressId === r._id;

                  // Audit info
                  const lastAudit = r.history && r.history.length > 0 ? r.history[r.history.length - 1] : null;

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong
                            style={{ color: '#2563EB', cursor: 'pointer', fontSize: 14 }}
                            onClick={() => handleInspect(r)}
                          >
                            {mfr?.name || user?.companyName || 'Seller Profile'} ↗
                          </strong>
                          {isReverification && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                              }}
                            >
                              ⚠️ Profile Re-Verification
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          Owner: {user?.firstName} {user?.lastName || ''} &middot;{' '}
                          {mfr?.category || mfr?.industry || 'Manufacturing'}
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
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#0F172A',
                                letterSpacing: 0.5,
                              }}
                            >
                              {user.gstNumber}
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                alignItems: 'center',
                                marginTop: 4,
                              }}
                            >
                              {user.gstVerified && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: 4,
                                    background: '#DCFCE7',
                                    color: '#15803D',
                                  }}
                                >
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
                            <strong style={{ fontSize: 13, color: '#0F172A' }}>
                              {r.scheduledVisit.date}
                            </strong>
                            <div style={{ fontSize: 12, color: '#EA580C', fontWeight: 600 }}>
                              {r.scheduledVisit.slot}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748B' }}>Document-only review</span>
                        )}
                        <div style={{ marginTop: 4 }}>
                          <Badge
                            label={r.status}
                            variant={
                              r.status === 'verified'
                                ? 'verified'
                                : r.status === 'rejected'
                                ? 'expired'
                                : 'active'
                            }
                          />
                        </div>
                      </td>

                      <td>
                        {activeTab === 'verified' || activeTab === 'declined' ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                              {lastAudit?.adminName || 'Admin Officer'}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>
                              ID: {lastAudit?.employeeId || 'STAFF'} &middot;{' '}
                              {new Date(r.decidedAt || r.updatedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </div>
                            {r.verifierNotes && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: r.status === 'rejected' ? '#DC2626' : '#16A34A',
                                  marginTop: 2,
                                  fontStyle: 'italic',
                                  maxWidth: 180,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={r.verifierNotes}
                              >
                                &ldquo;{r.verifierNotes}&rdquo;
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: '#64748B' }}>
                            {new Date(r.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => handleInspect(r)}
                          >
                            <Eye size={12} /> Inspect 360°
                          </button>

                          {r.status !== 'verified' && (
                            <button
                              className="admin-btn admin-btn-primary"
                              disabled={isBusy}
                              style={{
                                backgroundColor: '#16A34A',
                                borderColor: '#15803D',
                                padding: '4px 8px',
                                fontSize: 11,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              onClick={() => openApproveModal(r)}
                            >
                              {isBusy ? <RefreshCw size={10} className="spin" /> : null}
                              Verify
                            </button>
                          )}

                          {r.status !== 'rejected' && (
                            <button
                              className="admin-btn admin-btn-danger"
                              disabled={isBusy}
                              style={{
                                padding: '4px 8px',
                                fontSize: 11,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              onClick={() => openDeclineModal(r)}
                            >
                              {isBusy ? <RefreshCw size={10} className="spin" /> : null}
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
      )}

      {/* Main Table: Business Documents Queue (Issue #22) */}
      {activeTab === 'documents' && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <strong style={{ fontSize: 14, color: '#0F172A' }}>
                Pending Business Certificates & Documents
              </strong>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Approve or reject individual compliance documents without revoking the entire business profile.
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#8B5CF6',
                background: '#F5F3FF',
                padding: '4px 10px',
                borderRadius: 12,
                border: '1px solid #DDD6FE',
              }}
            >
              {pendingDocs.length} Pending Documents
            </span>
          </div>

          <table className="admin-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th>Manufacturer / Seller</th>
                <th>Document Type</th>
                <th>File Preview</th>
                <th>Uploaded</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docsLoading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                    Loading pending documents...
                  </td>
                </tr>
              )}

              {!docsLoading && pendingDocs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}>
                    🎉 No pending business documents! All uploaded certificates have been reviewed.
                  </td>
                </tr>
              )}

              {!docsLoading &&
                pendingDocs.map((doc, idx) => {
                  const isBusy =
                    actionInProgressId === `${doc.userId}-${doc.docType}` ||
                    actionInProgressId === `batch-${doc.manufacturerId}`;

                  return (
                    <tr key={`${doc.userId}-${doc.docType}-${idx}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong
                            style={{ color: '#2563EB', cursor: 'pointer', fontSize: 14 }}
                            onClick={() => {
                              if (doc.manufacturerId) setInspectManufacturerId(doc.manufacturerId);
                              else if (doc.userId) setInspectManufacturerId(doc.userId);
                            }}
                          >
                            {doc.manufacturerName} ↗
                          </strong>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                          {doc.sellerEmail}
                        </div>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: '#EDE9FE',
                            color: '#6D28D9',
                          }}
                        >
                          {doc.label}
                        </span>
                      </td>

                      <td>
                        {doc.fileUrl ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 12,
                              color: '#2563EB',
                              textDecoration: 'none',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <FileSearch size={14} /> Open Document ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>No link available</span>
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            className="admin-btn admin-btn-primary"
                            disabled={isBusy}
                            style={{
                              backgroundColor: '#16A34A',
                              borderColor: '#15803D',
                              padding: '4px 8px',
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => handleReviewDoc(doc, 'approve')}
                          >
                            {isBusy ? <RefreshCw size={10} className="spin" /> : <Check size={12} />}
                            Verify Doc
                          </button>

                          <button
                            className="admin-btn admin-btn-danger"
                            disabled={isBusy}
                            style={{
                              padding: '4px 8px',
                              fontSize: 11,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            onClick={() => {
                              setDocRejectTarget(doc);
                              setDocRejectReason('');
                            }}
                          >
                            <X size={12} /> Decline
                          </button>

                          {doc.manufacturerId && (
                            <button
                              className="admin-btn admin-btn-secondary"
                              disabled={isBusy}
                              style={{
                                padding: '4px 8px',
                                fontSize: 11,
                                color: '#4F46E5',
                                borderColor: '#C7D2FE',
                              }}
                              onClick={() => handleBatchApproveDocs(doc.manufacturerId)}
                            >
                              Verify All Docs
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* 360-Degree Seller Detail Inspection Pop-up Modal */}
      <SellerDetailModal
        open={!!inspectManufacturerId}
        onClose={() => setInspectManufacturerId(null)}
        manufacturerId={inspectManufacturerId}
        onStatusChanged={() => {
          if (activeTab === 'documents') loadPendingDocuments();
          else loadData();
        }}
      />

      {/* Attributed Approval Modal (Issue #16 & #20) */}
      {decisionModal && decisionModal.type === 'verified' && (
        <div className="admin-modal-overlay" onClick={() => setDecisionModal(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={20} color="#16A34A" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>
                  Grant Official Verified Trust Badge
                </h3>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {decisionModal.item?.manufacturerId?.name ||
                    decisionModal.item?.userId?.companyName ||
                    'Seller'}
                </div>
              </div>
            </div>

            {/* Operator Attribution Banner */}
            <div
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                border: '1px solid #CBD5E1',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Auditor Attribution
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                Approving as: {adminProfile?.fullName || adminProfile?.username || 'Admin Officer'}{' '}
                <span style={{ color: '#2563EB', fontWeight: 600 }}>
                  (ID: {adminProfile?.employeeId || 'STAFF'})
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                This approval and badge issuance will be recorded permanently in the seller&apos;s audit trail.
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Audit / Visit Summary Notes (Optional)
              </label>
              <textarea
                className="admin-input"
                rows={3}
                style={{ width: '100%' }}
                placeholder="e.g. Completed physical inspection of plant. Machinery and workforce capacity validated."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Evidence / Verification Photos (One URL per line)
              </label>
              <textarea
                className="admin-input"
                rows={2}
                style={{ width: '100%', fontSize: 12 }}
                placeholder="https://cloudinary.com/.../factory_gate.jpg"
                value={evidencePhotos}
                onChange={(e) => setEvidencePhotos(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={actionInProgressId !== null}
                onClick={() => setDecisionModal(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                disabled={actionInProgressId !== null}
                style={{
                  backgroundColor: '#16A34A',
                  borderColor: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={submitDecision}
              >
                {actionInProgressId !== null && <RefreshCw size={14} className="spin" />}
                Confirm & Grant Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attributed Decline Modal (Issue #16 & #20) */}
      {decisionModal && decisionModal.type === 'rejected' && (
        <div className="admin-modal-overlay" onClick={() => setDecisionModal(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={20} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, color: '#0F172A' }}>
                  Decline Verification Request
                </h3>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {decisionModal.item?.manufacturerId?.name ||
                    decisionModal.item?.userId?.companyName ||
                    'Seller'}
                </div>
              </div>
            </div>

            {/* Operator Attribution Banner */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                border: '1px solid #FECACA',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>
                Auditor Attribution
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                Declining as: {adminProfile?.fullName || adminProfile?.username || 'Admin Officer'}{' '}
                <span style={{ color: '#DC2626', fontWeight: 600 }}>
                  (ID: {adminProfile?.employeeId || 'STAFF'})
                </span>
              </div>
            </div>

            {/* Reason Category */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Reason Category *
              </label>
              <select
                className="admin-input"
                style={{ width: '100%', height: 38 }}
                value={declineReasonCategory}
                onChange={(e) => setDeclineReasonCategory(e.target.value)}
              >
                <option value="GST_INVALID">GST Invalid / Non-Matching Details</option>
                <option value="FACTORY_NON_EXISTENT">Factory Address Non-Existent / Inaccessible</option>
                <option value="SELLER_UNREACHABLE">Seller Unreachable / Missed Audit</option>
                <option value="INCOMPLETE_INFRASTRUCTURE">Incomplete Infrastructure / Not an Active Facility</option>
                <option value="FRAUDULENT_DOCS">Fraudulent or Manipulated Documents</option>
                <option value="OTHER">Other Compliance / Policy Violation</option>
              </select>
            </div>

            {/* Message to Seller */}
            <div style={{ marginBottom: 14 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Message to Seller * (Visible on Seller Dashboard & Push Notification)
              </label>
              <textarea
                className="admin-input"
                rows={3}
                style={{ width: '100%' }}
                placeholder="Explain clearly why verification was declined and what specific documents or address details they must rectify before re-applying..."
                value={declineSellerMessage}
                onChange={(e) => setDeclineSellerMessage(e.target.value)}
              />
            </div>

            {/* Internal Audit Notes */}
            <div style={{ marginBottom: 18 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Private Internal Audit Notes (Visible only to Admin & Staff)
              </label>
              <textarea
                className="admin-input"
                rows={2}
                style={{ width: '100%' }}
                placeholder="Internal notes regarding inspector findings, fraud flags, or phone conversation log..."
                value={adminInternalNotes}
                onChange={(e) => setAdminInternalNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={actionInProgressId !== null}
                onClick={() => setDecisionModal(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                disabled={actionInProgressId !== null}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={submitDecision}
              >
                {actionInProgressId !== null && <RefreshCw size={14} className="spin" />}
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Decline Reason Modal (Issue #22) */}
      {docRejectTarget && (
        <div className="admin-modal-overlay" onClick={() => setDocRejectTarget(null)}>
          <div
            className="admin-modal"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <XCircle size={18} color="#DC2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A' }}>
                  Decline {docRejectTarget.label}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {docRejectTarget.manufacturerName}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Rejection Reason * (Sent to Seller)
              </label>
              <textarea
                className="admin-input"
                rows={3}
                style={{ width: '100%' }}
                placeholder="e.g. Document image is blurry and illegible. Please re-upload a clean, high-resolution PDF or scan."
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={actionInProgressId !== null}
                onClick={() => setDocRejectTarget(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                disabled={actionInProgressId !== null || !docRejectReason.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() =>
                  handleReviewDoc(docRejectTarget, 'reject', docRejectReason.trim())
                }
              >
                {actionInProgressId !== null && <RefreshCw size={14} className="spin" />}
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
