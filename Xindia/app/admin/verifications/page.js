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
  UploadCloud,
  Trash2,
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
  const [docFilterStatus, setDocFilterStatus] = useState('pending'); // 'pending' | 'verified' | 'rejected' | 'all'
  const [sellersList, setSellersList] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docLoadError, setDocLoadError] = useState(null);
  const [highlightSellerId, setHighlightSellerId] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [toast, setToast] = useState(null);
  const [docApproveTarget, setDocApproveTarget] = useState(null);
  const [docApproveReason, setDocApproveReason] = useState('');
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
  const [evidenceFiles, setEvidenceFiles] = useState([]); // [{ url, name, size, type }]
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  // Toast feedback helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  }, []);

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
      showToast('Network error loading verification queue', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, search, category, sort, showToast]);

  const loadDocuments = useCallback(async (statusOverride) => {
    setDocsLoading(true);
    setDocLoadError(null);
    try {
      const targetStatus = statusOverride !== undefined ? statusOverride : docFilterStatus;
      const res = await fetch(`/api/admin/documents?status=${targetStatus}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) {
        setPendingDocs(data.documents || []);
        setSellersList(data.sellers || []);
      } else {
        setDocLoadError(data.message || 'Failed to load business documents');
        showToast(data.message || 'Failed to load business documents', 'error');
      }
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocLoadError(err.message || 'Network error loading documents');
      showToast('Network error loading documents', 'error');
    } finally {
      setDocsLoading(false);
    }
  }, [docFilterStatus, showToast]);

  // Cross-tab auto-scroll and highlight animation
  useEffect(() => {
    if (highlightSellerId && activeTab === 'documents' && sellersList.length > 0) {
      const matchedSeller = sellersList.find(
        (s) =>
          String(s.userId) === String(highlightSellerId) ||
          String(s.manufacturerId) === String(highlightSellerId)
      );
      const targetEl =
        document.getElementById(`seller-docs-${highlightSellerId}`) ||
        (matchedSeller && document.getElementById(`seller-docs-${matchedSeller.userId}`));
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setFlashId(String(matchedSeller?.userId || highlightSellerId));
        const timer = setTimeout(() => {
          setFlashId(null);
          setHighlightSellerId(null);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightSellerId, activeTab, sellersList]);

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    } else {
      loadData();
      // Prefetch pending docs in background for indicator badges
      fetch('/api/admin/documents?status=pending', { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.documents)) {
            setPendingDocs(d.documents);
          }
        })
        .catch(() => {});
    }
    setSelectedIds(new Set());
  }, [activeTab, docFilterStatus, loadData, loadDocuments]);

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
        showToast(
          decision === 'verified'
            ? 'Selected sellers verified successfully.'
            : 'Selected requests declined.',
          'success'
        );
        loadData();
      } else {
        showToast(data.message || 'Bulk decision failed', 'error');
      }
    } catch (e) {
      showToast('Error during bulk operation: ' + e.message, 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  // Open modal with attribution
  const openApproveModal = (request) => {
    setDecisionModal({ type: 'verified', item: request });
    setApprovalNotes('');
    setEvidenceFiles([]);
  };

  const openDeclineModal = (request) => {
    setDecisionModal({ type: 'rejected', item: request });
    setDeclineReasonCategory('GST_INVALID');
    setDeclineSellerMessage('');
    setAdminInternalNotes('');
  };

  // Upload verification audit evidence documents & photos (max 20, PDFs and Images only)
  const handleEvidenceFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (evidenceFiles.length + selectedFiles.length > 20) {
      alert(`Limit exceeded. You can only attach up to 20 evidence files in total (Currently ${evidenceFiles.length}).`);
      e.target.value = '';
      return;
    }

    const allowedMimes = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif',
      'application/pdf',
    ]);
    const allowedExts = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf']);

    for (const f of selectedFiles) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!allowedMimes.has(f.type) && !allowedExts.has(ext)) {
        alert(`File "${f.name}" is not permitted. Only PDF documents and image files (JPG, PNG, WEBP, HEIC) are accepted for security.`);
        e.target.value = '';
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        alert(`File "${f.name}" exceeds the 10MB size limit.`);
        e.target.value = '';
        return;
      }
    }

    setIsUploadingEvidence(true);
    try {
      const formData = new FormData();
      for (const f of selectedFiles) {
        formData.append('files', f);
      }
      const res = await fetch('/api/admin/verification/upload-evidence', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        setEvidenceFiles((prev) => [...prev, ...data.files].slice(0, 20));
      } else {
        alert(data.message || 'Failed to upload evidence files');
      }
    } catch (err) {
      alert('Error uploading evidence: ' + err.message);
    } finally {
      setIsUploadingEvidence(false);
      e.target.value = '';
    }
  };

  const handleRemoveEvidenceFile = (index) => {
    setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit single decision with strict audit attribution & click-lock
  const submitDecision = async () => {
    if (!decisionModal?.item?._id) return;
    const { type, item } = decisionModal;

    if (type === 'rejected' && !declineSellerMessage.trim()) {
      showToast('Please provide a message explaining to the seller why verification was declined.', 'error');
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
        evidencePhotos: evidenceFiles.map((f) => f.url),
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
        setEvidenceFiles([]);
        showToast(
          type === 'verified'
            ? 'Manufacturer verified and trust badge granted!'
            : 'Verification request declined and seller notified.',
          'success'
        );
        loadData();
      } else {
        showToast(data.message || 'Decision failed', 'error');
      }
    } catch (e) {
      showToast('Error recording decision: ' + e.message, 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Document Verification handlers
  const handleReviewDoc = async (doc, action, reason = '') => {
    const targetMfrId = doc.manufacturerId || doc.userId;
    if (!targetMfrId) {
      showToast('Could not locate manufacturer or seller ID for this document.', 'error');
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      showToast(`Please enter a valid reason to ${action === 'approve' ? 'verify' : 'decline'} this document.`, 'error');
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
            reason: trimmedReason,
            rejectionReason: trimmedReason,
            approvalReason: trimmedReason,
          }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setDocApproveTarget(null);
        setDocApproveReason('');
        setDocRejectTarget(null);
        setDocRejectReason('');
        showToast(
          `${doc.label || 'Document'} successfully ${action === 'approve' ? 'verified' : 'declined'}!`,
          'success'
        );

        // Optimistically update pendingDocs & sellersList
        const nextStatus = action === 'approve' ? 'verified' : 'rejected';
        setPendingDocs((prev) =>
          docFilterStatus === 'pending'
            ? prev.filter((d) => !(String(d.userId) === String(doc.userId) && d.docType === doc.docType))
            : prev.map((d) =>
                String(d.userId) === String(doc.userId) && d.docType === doc.docType
                  ? { ...d, status: nextStatus, reason: trimmedReason }
                  : d
              )
        );

        setSellersList((prev) =>
          prev
            .map((s) => {
              if (String(s.userId) !== String(doc.userId)) return s;
              const updatedDocs = s.documents.map((d) => {
                if (d.docType !== doc.docType) return d;
                return {
                  ...d,
                  status: nextStatus,
                  rejectionReason: action === 'reject' ? trimmedReason : '',
                  reason: trimmedReason,
                };
              });

              const filteredDocs =
                docFilterStatus === 'pending'
                  ? updatedDocs.filter((d) => d.status === 'pending')
                  : docFilterStatus === 'verified'
                  ? updatedDocs.filter((d) => d.status === 'verified')
                  : docFilterStatus === 'rejected'
                  ? updatedDocs.filter((d) => d.status === 'rejected')
                  : updatedDocs;

              return {
                ...s,
                documents: filteredDocs,
                pendingCount: Math.max(
                  0,
                  (s.pendingCount || 0) - (doc.status === 'pending' ? 1 : 0)
                ),
                verifiedCount:
                  action === 'approve' ? (s.verifiedCount || 0) + 1 : (s.verifiedCount || 0),
                rejectedCount:
                  action === 'reject' ? (s.rejectedCount || 0) + 1 : (s.rejectedCount || 0),
              };
            })
            .filter((s) => docFilterStatus === 'all' || s.documents.length > 0)
        );

        // Background sync to ensure consistent server state
        loadDocuments();
      } else {
        showToast(data.message || 'Failed to update document status', 'error');
      }
    } catch (e) {
      showToast('Error updating document: ' + e.message, 'error');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleBatchApproveDocs = async (targetId) => {
    if (!confirm('Approve all uploaded business documents for this seller?')) return;
    setActionInProgressId(`batch-${targetId}`);
    try {
      const res = await fetch(
        `/api/admin/manufacturers/${targetId}/documents/batch-approve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json();
      if (data.success) {
        showToast(`Successfully verified ${data.approvedCount || 'all'} documents!`, 'success');
        loadDocuments();
      } else {
        showToast(data.message || 'Batch approval failed', 'error');
      }
    } catch (e) {
      showToast('Error during batch approval: ' + e.message, 'error');
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
            onClick={() => (activeTab === 'documents' ? loadDocuments() : loadData())}
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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

                        {/* Indication if seller has uploaded documents with cross-tab link */}
                        {(() => {
                          const userDocs = user?.businessDocuments;
                          let docCount = 0;
                          let pendingCount = 0;
                          if (userDocs && typeof userDocs === 'object') {
                            Object.values(userDocs).forEach((entry) => {
                              if (entry && entry.status && entry.status !== 'not_uploaded') {
                                docCount++;
                                if (entry.status === 'pending') pendingCount++;
                              }
                            });
                          }
                          // Also check against pendingDocs loaded in memory
                          const inMemPending = pendingDocs.filter(
                            (d) =>
                              (user?._id && String(d.userId) === String(user._id)) ||
                              (mfr?._id && String(d.manufacturerId) === String(mfr._id))
                          ).length;
                          const effectivePending = Math.max(pendingCount, inMemPending);
                          if (docCount === 0 && effectivePending === 0) return null;

                          return (
                            <div style={{ marginTop: 6 }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetId = user?._id || mfr?._id;
                                  if (targetId) {
                                    setHighlightSellerId(String(targetId));
                                  }
                                  setDocFilterStatus(effectivePending > 0 ? 'pending' : 'all');
                                  setActiveTab('documents');
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  backgroundColor: effectivePending > 0 ? '#F5F3FF' : '#F1F5F9',
                                  color: effectivePending > 0 ? '#7C3AED' : '#475569',
                                  border: effectivePending > 0 ? '1px solid #DDD6FE' : '1px solid #CBD5E1',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Click to view and review business certificates for this seller"
                              >
                                <FileText size={12} color={effectivePending > 0 ? '#7C3AED' : '#64748B'} />
                                <span>
                                  {effectivePending > 0
                                    ? `📄 ${effectivePending} Pending Doc${effectivePending > 1 ? 's' : ''} ↗`
                                    : `📄 ${docCount} Docs Uploaded ↗`}
                                </span>
                              </button>
                            </div>
                          );
                        })()}
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

      {/* Main Section: Business Documents Queue by Company */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header Card & Filter Bar */}
          <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <strong style={{ fontSize: 16, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileCheck size={20} color="#8B5CF6" /> Business Certificates & Compliance Documents
                </strong>
                <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 4 }}>
                  Verify GSTIN, MSME, ISO, pollution licenses, and legal compliance filings grouped by company.
                </div>
              </div>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => loadDocuments()}
                disabled={docsLoading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}
              >
                <RefreshCw size={13} className={docsLoading ? 'spin' : ''} /> Refresh Documents
              </button>
            </div>

            {/* Document Queue Status Filters */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginRight: 6 }}>
                Filter Status:
              </span>
              {[
                { key: 'pending', label: 'Pending Review', icon: Clock, color: '#D97706', bg: '#FEF3C7' },
                { key: 'verified', label: 'Verified Certificates', icon: CheckCircle2, color: '#16A34A', bg: '#DCFCE7' },
                { key: 'rejected', label: 'Declined Archive', icon: XCircle, color: '#DC2626', bg: '#FEE2E2' },
                { key: 'all', label: 'All Documents', icon: FileText, color: '#64748B', bg: '#F1F5F9' },
              ].map((tab) => {
                const isActive = docFilterStatus === tab.key;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDocFilterStatus(tab.key)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 999,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      border: isActive ? `2px solid ${tab.color}` : '1px solid #CBD5E1',
                      backgroundColor: isActive ? tab.bg : '#FFFFFF',
                      color: isActive ? tab.color : '#475569',
                    }}
                  >
                    <TabIcon size={14} color={isActive ? tab.color : '#64748B'} />
                    {tab.label}
                    {tab.key === 'pending' && pendingDocs.length > 0 && (
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: 11,
                          padding: '1px 6px',
                          borderRadius: 10,
                          backgroundColor: isActive ? '#FFFFFF' : '#FEF3C7',
                          color: '#B45309',
                          fontWeight: 800,
                        }}
                      >
                        {pendingDocs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {docLoadError && (
            <div
              style={{
                padding: '14px 18px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={18} color="#DC2626" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{docLoadError}</span>
              </div>
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => loadDocuments()}
                style={{ fontSize: 12, padding: '4px 12px' }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {docsLoading && (
            <div
              className="admin-card"
              style={{ textAlign: 'center', padding: '50px 0', color: '#94A3B8' }}
            >
              <RefreshCw size={24} className="spin" style={{ margin: '0 auto 12px auto' }} />
              <div>Loading documents for review...</div>
            </div>
          )}

          {/* Empty State */}
          {!docsLoading && sellersList.length === 0 && (
            <div
              className="admin-card"
              style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <FileSearch size={28} color="#94A3B8" />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: 16, color: '#0F172A' }}>
                {docFilterStatus === 'pending'
                  ? '🎉 No Pending Business Documents!'
                  : docFilterStatus === 'verified'
                  ? 'No Verified Documents'
                  : docFilterStatus === 'rejected'
                  ? 'No Declined Documents'
                  : 'No Business Documents Found'}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: '#94A3B8' }}>
                {docFilterStatus === 'pending'
                  ? 'All uploaded compliance certificates have been reviewed.'
                  : 'There are currently no document submissions matching this status filter.'}
              </p>
            </div>
          )}

          {/* Company-Centric Document Cards */}
          {!docsLoading &&
            sellersList.map((seller) => {
              const isHighlighted =
                flashId === String(seller.userId) ||
                flashId === String(seller.manufacturerId) ||
                (highlightSellerId && (String(seller.userId) === String(highlightSellerId) || String(seller.manufacturerId) === String(highlightSellerId)));

              return (
                <div
                  key={String(seller.userId || seller.manufacturerId)}
                  id={`seller-docs-${seller.userId}`}
                  className={`admin-card ${isHighlighted ? 'doc-pulse-highlight' : ''}`}
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    border: isHighlighted ? '2px solid #8B5CF6' : '1px solid #E2E8F0',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  {/* Company Card Header */}
                  <div
                    style={{
                      padding: '14px 18px',
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: '#EFF6FF',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Building2 size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong
                            style={{
                              fontSize: 15,
                              color: '#0F172A',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              if (seller.manufacturerId) setInspectManufacturerId(seller.manufacturerId);
                              else if (seller.userId) setInspectManufacturerId(seller.userId);
                            }}
                          >
                            {seller.companyName} ↗
                          </strong>
                          {seller.pendingCount > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                backgroundColor: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A',
                              }}
                            >
                              {seller.pendingCount} Pending
                            </span>
                          )}
                          {seller.verifiedCount > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                border: '1px solid #BBF7D0',
                              }}
                            >
                              {seller.verifiedCount} Verified
                            </span>
                          )}
                          {seller.rejectedCount > 0 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 999,
                                backgroundColor: '#FEE2E2',
                                color: '#B91C1C',
                                border: '1px solid #FECACA',
                              }}
                            >
                              {seller.rejectedCount} Declined
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#64748B',
                            marginTop: 2,
                            display: 'flex',
                            gap: 14,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span>Email: {seller.sellerEmail || '-'}</span>
                          {seller.gstNumber && (
                            <span>
                              GSTIN: <strong style={{ fontFamily: 'monospace' }}>{seller.gstNumber}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        onClick={() => {
                          if (seller.manufacturerId) setInspectManufacturerId(seller.manufacturerId);
                          else if (seller.userId) setInspectManufacturerId(seller.userId);
                        }}
                      >
                        <Eye size={13} /> View 360° Profile
                      </button>
                      {seller.pendingCount > 0 && (
                        <button
                          className="admin-btn admin-btn-primary"
                          disabled={actionInProgressId === `batch-${seller.manufacturerId || seller.userId}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: 12,
                            backgroundColor: '#16A34A',
                            borderColor: '#15803D',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                          onClick={() => handleBatchApproveDocs(seller.manufacturerId || seller.userId)}
                        >
                          {actionInProgressId === `batch-${seller.manufacturerId || seller.userId}` ? (
                            <RefreshCw size={12} className="spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          Approve All {seller.pendingCount} Pending Docs
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Documents Table for this company */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '22%' }}>Document Type</th>
                          <th style={{ width: '22%' }}>Preview / Identifier</th>
                          <th style={{ width: '15%' }}>Status</th>
                          <th style={{ width: '20%' }}>Audit Notes / Reason</th>
                          <th style={{ width: '11%' }}>Uploaded</th>
                          <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seller.documents.map((doc, docIdx) => {
                          const isBusy = actionInProgressId === `${doc.userId}-${doc.docType}`;
                          const docStatus = doc.status || 'pending';

                          return (
                            <tr key={`${doc.docType}-${docIdx}`}>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <FileCheck size={16} color="#8B5CF6" />
                                  <strong style={{ fontSize: 13, color: '#0F172A' }}>{doc.label}</strong>
                                </div>
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
                                ) : doc.gstNumber ? (
                                  <div style={{ fontSize: 12 }}>
                                    <span
                                      style={{
                                        fontWeight: 600,
                                        color: '#1E293B',
                                        fontFamily: 'monospace',
                                      }}
                                    >
                                      {doc.gstNumber}
                                    </span>
                                    {doc.tradeName || doc.legalName ? (
                                      <div style={{ color: '#64748B', fontSize: 11 }}>
                                        {doc.tradeName || doc.legalName}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#94A3B8' }}>No link available</span>
                                )}
                              </td>
                              <td>
                                {docStatus === 'verified' ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      backgroundColor: '#DCFCE7',
                                      color: '#15803D',
                                    }}
                                  >
                                    <Check size={11} /> Verified
                                  </span>
                                ) : docStatus === 'rejected' ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      backgroundColor: '#FEE2E2',
                                      color: '#DC2626',
                                    }}
                                  >
                                    <X size={11} /> Declined
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: 999,
                                      backgroundColor: '#FEF3C7',
                                      color: '#B45309',
                                    }}
                                  >
                                    <Clock size={11} /> Pending Review
                                  </span>
                                )}
                              </td>
                              <td>
                                {doc.rejectionReason || doc.reason ? (
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: docStatus === 'rejected' ? '#DC2626' : '#15803D',
                                      fontStyle: 'italic',
                                      maxWidth: 220,
                                    }}
                                  >
                                    &ldquo;{doc.rejectionReason || doc.reason}&rdquo;
                                  </div>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#94A3B8' }}>-</span>
                                )}
                                {doc.verifierName && (
                                  <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>
                                    By: {doc.verifierName}
                                  </div>
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
                                  {docStatus !== 'verified' && (
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
                                      onClick={() => {
                                        setDocApproveTarget({
                                          ...doc,
                                          manufacturerName: seller.companyName,
                                        });
                                        setDocApproveReason('');
                                      }}
                                    >
                                      {isBusy ? <RefreshCw size={10} className="spin" /> : <Check size={12} />}
                                      Verify
                                    </button>
                                  )}
                                  {docStatus !== 'rejected' && (
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
                                        setDocRejectTarget({
                                          ...doc,
                                          manufacturerName: seller.companyName,
                                        });
                                        setDocRejectReason('');
                                      }}
                                    >
                                      <X size={12} /> Decline
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
                </div>
              );
            })}
        </div>
      )}

      {/* 360-Degree Seller Detail Inspection Pop-up Modal */}
      <SellerDetailModal
        open={!!inspectManufacturerId}
        onClose={() => setInspectManufacturerId(null)}
        manufacturerId={inspectManufacturerId}
        onStatusChanged={() => {
          if (activeTab === 'documents') loadDocuments();
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                  Verification Evidence Documents & Photos (Max 20)
                </label>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    backgroundColor: evidenceFiles.length >= 20 ? '#FEE2E2' : '#F1F5F9',
                    color: evidenceFiles.length >= 20 ? '#DC2626' : '#475569',
                  }}
                >
                  {evidenceFiles.length} / 20 uploaded
                </span>
              </div>

              {/* Upload Dropzone / File input */}
              <div
                style={{
                  border: '1.5px dashed #CBD5E1',
                  borderRadius: 10,
                  padding: '12px 16px',
                  backgroundColor: '#F8FAFC',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                <input
                  type="file"
                  id="evidence-file-input"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,application/pdf,image/*"
                  disabled={evidenceFiles.length >= 20 || isUploadingEvidence}
                  style={{ display: 'none' }}
                  onChange={handleEvidenceFileUpload}
                />
                <label
                  htmlFor="evidence-file-input"
                  style={{
                    cursor: evidenceFiles.length >= 20 || isUploadingEvidence ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  {isUploadingEvidence ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#2563EB', fontSize: 12, fontWeight: 600 }}>
                      <RefreshCw size={15} className="spin" />
                      Uploading & verifying files...
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <UploadCloud size={16} color="#2563EB" />
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B' }}>
                        {evidenceFiles.length >= 20 ? 'Maximum 20 files reached' : 'Click to Upload Verification Evidence'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        PDF documents & images only (JPG, PNG, WEBP, HEIC) • Up to 10MB each
                      </div>
                    </>
                  )}
                </label>
              </div>

              {/* List of attached evidence files */}
              {evidenceFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', paddingRight: 2 }}>
                  {evidenceFiles.map((file, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 10px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: 4,
                            backgroundColor: file.type?.includes('pdf') || file.url?.endsWith('.pdf') ? '#FEE2E2' : '#EFF6FF',
                            color: file.type?.includes('pdf') || file.url?.endsWith('.pdf') ? '#DC2626' : '#2563EB',
                          }}
                        >
                          {file.type?.includes('pdf') || file.url?.endsWith('.pdf') ? 'PDF' : 'IMG'}
                        </span>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: '#0F172A',
                            textDecoration: 'none',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {file.name || `Document ${idx + 1}`}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidenceFile(idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                          color: '#94A3B8',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Remove file"
                      >
                        <Trash2 size={13} color="#EF4444" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Document Approval Reason Modal */}
      {docApproveTarget && (
        <div className="admin-modal-overlay" onClick={() => setDocApproveTarget(null)}>
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
                  background: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={18} color="#16A34A" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A' }}>
                  Verify & Approve {docApproveTarget.label}
                </h3>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {docApproveTarget.manufacturerName}
                </div>
              </div>
            </div>

            {/* Auditor Attribution Banner */}
            <div
              style={{
                backgroundColor: '#F1F5F9',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 14,
                border: '1px solid #CBD5E1',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Auditor Attribution
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                Approving as: {adminProfile?.fullName || adminProfile?.username || 'Compliance Officer'}{' '}
                <span style={{ color: '#2563EB', fontWeight: 600 }}>
                  (ID: {adminProfile?.employeeId || 'STAFF'})
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Your staff identity and verification reason will be saved in platform audit logs.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Verification Reason / Compliance Notes * (Mandatory)
              </label>
              <textarea
                className="admin-input"
                rows={3}
                style={{ width: '100%' }}
                placeholder="e.g. Verified official certificate against government registry / active company filing."
                value={docApproveReason}
                onChange={(e) => setDocApproveReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={actionInProgressId !== null}
                onClick={() => setDocApproveTarget(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                disabled={actionInProgressId !== null || !docApproveReason.trim()}
                style={{
                  backgroundColor: '#16A34A',
                  borderColor: '#15803D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={() =>
                  handleReviewDoc(docApproveTarget, 'approve', docApproveReason.trim())
                }
              >
                {actionInProgressId !== null && <RefreshCw size={14} className="spin" />}
                Confirm & Verify Doc
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

            {/* Auditor Attribution Banner */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 14,
                border: '1px solid #FECACA',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>
                Auditor Attribution
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                Declining as: {adminProfile?.fullName || adminProfile?.username || 'Compliance Officer'}{' '}
                <span style={{ color: '#DC2626', fontWeight: 600 }}>
                  (ID: {adminProfile?.employeeId || 'STAFF'})
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>
                Your staff identity and rejection reason will be saved in platform audit logs.
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}
              >
                Rejection Reason * (Sent to Seller & Logged)
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

      {/* Global Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor:
              toast.type === 'error'
                ? '#DC2626'
                : toast.type === 'success'
                ? '#16A34A'
                : '#2563EB',
            color: '#FFFFFF',
            padding: '12px 18px',
            borderRadius: 8,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {toast.type === 'error' ? (
            <XCircle size={18} color="#FFFFFF" />
          ) : toast.type === 'success' ? (
            <CheckCircle2 size={18} color="#FFFFFF" />
          ) : (
            <AlertTriangle size={18} color="#FFFFFF" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 0,
              marginLeft: 8,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
