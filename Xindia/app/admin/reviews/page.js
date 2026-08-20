'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  ShieldAlert,
  Eye,
  EyeOff,
  Trash2,
  UserX,
  UserCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  // Blacklist modal state
  const [blacklistModal, setBlacklistModal] = useState({ open: false, user: null, reason: '' });
  const [processingId, setProcessingId] = useState(null);
  const [actionAlert, setActionAlert] = useState({ type: '', text: '' });

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (targetTypeFilter) params.set('targetType', targetTypeFilter);
      params.set('limit', '50');

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, targetTypeFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Toggle Review Status (Approved vs Inactive Soft-delete)
  const handleToggleStatus = async (reviewId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'inactive' : 'approved';
    try {
      setProcessingId(reviewId);
      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          reason: nextStatus === 'inactive' ? 'Hidden by moderator' : 'Approved by moderator',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionAlert({
          type: 'success',
          text: `Review marked as ${nextStatus === 'inactive' ? 'Inactive (Hidden)' : 'Approved (Visible)'}`,
        });
        setTimeout(() => setActionAlert({ type: '', text: '' }), 3500);
        loadReviews();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Permanently Delete Review
  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      setProcessingId(reviewId);
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setActionAlert({ type: 'success', text: 'Review permanently removed' });
        setTimeout(() => setActionAlert({ type: '', text: '' }), 3500);
        loadReviews();
      }
    } catch (err) {
      console.error('Delete review error:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // Confirm Blacklist User
  const handleBlacklistUser = async (e) => {
    e.preventDefault();
    if (!blacklistModal.user) return;
    try {
      const res = await fetch(`/api/admin/users/${blacklistModal.user._id}/blacklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blacklistModal.reason || 'Spam and abusive reviews' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionAlert({
          type: 'success',
          text: `User ${blacklistModal.user.email || blacklistModal.user.phone || 'Reviewer'} has been blacklisted and their reviews set to inactive.`,
        });
        setBlacklistModal({ open: false, user: null, reason: '' });
        loadReviews();
      }
    } catch (err) {
      console.error('Blacklist error:', err);
    }
  };

  // Filtered reviews by local search
  const filteredReviews = reviews.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const reviewer = (r.reviewerName || '').toLowerCase();
    const email = (r.reviewerEmail || r.reviewerId?.email || '').toLowerCase();
    const phone = (r.reviewerPhone || r.reviewerId?.phone || '').toLowerCase();
    const comment = (r.comment || '').toLowerCase();
    return reviewer.includes(term) || email.includes(term) || phone.includes(term) || comment.includes(term);
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={28} color="#F59E0B" fill="#F59E0B" /> Review Moderation & User Blacklist Hub
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Moderate feedback across sellers, products, and opportunities. 1-click soft-delete reviews or blacklist abusive users.
          </p>
        </div>
      </div>

      {actionAlert.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: actionAlert.type === 'success' ? '#DCFCE7' : '#FEF2F2',
          color: actionAlert.type === 'success' ? '#15803D' : '#DC2626',
          borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontSize: 14, fontWeight: 700,
        }}>
          <CheckCircle2 size={18} /> {actionAlert.text}
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
        padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', padding: '8px 14px', borderRadius: 10, border: '1px solid #CBD5E1', flex: '1 1 240px' }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search by reviewer name, phone, email, or comment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: 13 }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, background: '#fff', outline: 'none' }}
        >
          <option value="">All Statuses ({totalCount})</option>
          <option value="approved">Approved / Visible</option>
          <option value="inactive">Inactive / Hidden (Soft Deleted)</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Target Type */}
        <select
          value={targetTypeFilter}
          onChange={(e) => setTargetTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600, background: '#fff', outline: 'none' }}
        >
          <option value="">All Entities</option>
          <option value="manufacturer">Sellers / Manufacturers</option>
          <option value="product">Catalog Products</option>
          <option value="opportunity">Business Opportunities</option>
        </select>
      </div>

      {/* Reviews Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading reviews...</div>
      ) : filteredReviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', color: '#64748B' }}>
          No reviews match your filters.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredReviews.map((review) => {
            const isApproved = review.status === 'approved';
            const reviewer = review.reviewerId || {};
            const isUserBlacklisted = reviewer.isBlacklisted;

            return (
              <div
                key={review._id}
                style={{
                  background: '#fff', borderRadius: 16, border: `1px solid ${isApproved ? '#E2E8F0' : '#FEE2E2'}`,
                  padding: 20, boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  opacity: isApproved ? 1 : 0.75,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  {/* Left: Reviewer & Target info */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A' }}>
                        {review.reviewerName}
                      </span>
                      {review.reviewerCompany && (
                        <span style={{ fontSize: 12, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>
                          {review.reviewerCompany}
                        </span>
                      )}
                      {isUserBlacklisted && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#FEE2E2', color: '#B91C1C', fontSize: 11,
                          fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                        }}>
                          <ShieldAlert size={12} /> Blacklisted User
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 12 }}>
                      {reviewer.email && <span>📧 {reviewer.email}</span>}
                      {reviewer.phone && <span>📱 {reviewer.phone}</span>}
                      <span>📅 {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span style={{ textTransform: 'capitalize', fontWeight: 700, color: '#3B82F6' }}>
                        🎯 {review.targetType || 'Seller Profile'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Status badge */}
                  <div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 800,
                      background: isApproved ? '#DCFCE7' : '#FEE2E2',
                      color: isApproved ? '#15803D' : '#B91C1C',
                    }}>
                      {isApproved ? 'Approved / Live' : 'Inactive (Hidden)'}
                    </span>
                  </div>
                </div>

                {/* Rating & Comment */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      color={star <= review.rating ? '#F59E0B' : '#CBD5E1'}
                      fill={star <= review.rating ? '#F59E0B' : 'transparent'}
                    />
                  ))}
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', marginLeft: 4 }}>
                    {review.rating}.0 / 5.0
                  </span>
                </div>

                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#334155', lineHeight: 1.5, background: '#F8FAFC', padding: 12, borderRadius: 10 }}>
                  "{review.comment}"
                </p>

                {/* Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  {/* Toggle Active / Inactive */}
                  <button
                    onClick={() => handleToggleStatus(review._id, review.status)}
                    disabled={processingId === review._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                      borderRadius: 8, border: '1px solid #CBD5E1', background: isApproved ? '#FFFBEB' : '#F0FDF4',
                      color: isApproved ? '#B45309' : '#15803D', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {isApproved ? <EyeOff size={14} /> : <Eye size={14} />}
                    {isApproved ? 'Hide (Make Inactive)' : 'Approve & Publish'}
                  </button>

                  {/* Blacklist Reviewer */}
                  {review.reviewerId && !isUserBlacklisted && (
                    <button
                      onClick={() => setBlacklistModal({ open: true, user: review.reviewerId, reason: 'Spam/Abusive reviews' })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                        borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5',
                        color: '#EF4444', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      <UserX size={14} /> Blacklist User
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteReview(review._id)}
                    disabled={processingId === review._id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                      borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
                      color: '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blacklist Confirm Modal */}
      {blacklistModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EF4444', marginBottom: 12 }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                Blacklist & Ban User
              </h3>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B' }}>
              Are you sure you want to blacklist <strong>{blacklistModal.user?.email || blacklistModal.user?.phone || 'this reviewer'}</strong>?
              This will automatically hide all their reviews and revoke their ability to post feedback or inquiries.
            </p>

            <form onSubmit={handleBlacklistUser}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Blacklist Reason
                </label>
                <input
                  type="text"
                  value={blacklistModal.reason}
                  onChange={(e) => setBlacklistModal({ ...blacklistModal, reason: e.target.value })}
                  placeholder="e.g. Fraudulent reviews / competitor harassment"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1px solid #CBD5E1', fontSize: 13, outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setBlacklistModal({ open: false, user: null, reason: '' })}
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#F8FAFC', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: 'none',
                    background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 800,
                  }}
                >
                  Yes, Blacklist User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
