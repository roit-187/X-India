'use strict';
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wand2,
  Search,
  RefreshCw,
  X,
  Package,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Edit3,
} from 'lucide-react';

const STATUS_BADGE_STYLES = {
  pending: { bg: '#FEF3C7', color: '#B45309', label: 'Pending Review' },
  in_progress: { bg: '#E0E7FF', color: '#3730A3', label: 'In Progress' },
  completed: { bg: '#DCFCE7', color: '#166534', label: 'Enhanced' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rejected' },
};

export default function ProductEnhancementsPage() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    brandName: '',
    modelNumber: '',
    price: '',
    unit: 'Piece',
    moq: '1',
    deliveryTime: '',
    tags: '',
    imageUrl: '',
    enhancementStatus: 'pending',
    enhancementNotes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 20);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/product-enhancements?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        alert(data.message || 'Failed to load enhancement requests');
      }
    } catch (err) {
      console.error('[Product Enhancements] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setEditForm({
      name: p.name || '',
      description: p.description || '',
      brandName: p.brandName || '',
      modelNumber: p.modelNumber || '',
      price: p.price || '',
      unit: p.unit || 'Piece',
      moq: p.moq || '1',
      deliveryTime: p.deliveryTime || '',
      tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
      imageUrl: p.imageUrl || '',
      enhancementStatus: p.enhancementStatus || 'pending',
      enhancementNotes: p.enhancementNotes || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaving(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        brandName: editForm.brandName.trim(),
        modelNumber: editForm.modelNumber.trim(),
        price: editForm.price.trim(),
        unit: editForm.unit.trim(),
        moq: editForm.moq.trim(),
        deliveryTime: editForm.deliveryTime.trim(),
        tags: editForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        imageUrl: editForm.imageUrl.trim(),
        enhancementStatus: editForm.enhancementStatus,
        enhancementNotes: editForm.enhancementNotes.trim(),
      };

      const res = await fetch(`/api/admin/product-enhancements/${selectedProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        alert('Product enhancement saved successfully!');
        setSelectedProduct(null);
        loadData();
      } else {
        alert(data.message || 'Failed to update product');
      }
    } catch (err) {
      console.error('[Product Enhancements] Save error:', err);
      alert('Network error saving product enhancement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page" style={{ padding: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ background: '#FFEDD5', color: '#EA580C', padding: 8, borderRadius: 10, display: 'flex' }}>
              <Wand2 size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Product Enhancement Requests
              </h1>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B' }}>
                Optimize product listings requested by sellers to boost marketplace reach (2–5 day turnaround).
              </p>
            </div>
          </div>
        </div>
        <button
          className="admin-btn admin-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={() => loadData()}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-card" style={{ padding: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'completed', label: 'Enhanced' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: statusFilter === tab.id ? '#0F172A' : '#F1F5F9',
                color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: '#94A3B8' }} />
          <input
            className="admin-input"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder="Search by title, brand, or seller..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left', fontSize: 12, color: '#64748B' }}>
              <th style={{ padding: '12px 16px' }}>Product</th>
              <th style={{ padding: '12px 16px' }}>Seller</th>
              <th style={{ padding: '12px 16px' }}>Pricing & MOQ</th>
              <th style={{ padding: '12px 16px' }}>Requested At</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                  Loading enhancement requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 50, color: '#94A3B8' }}>
                  <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <div>No product enhancement requests found.</div>
                </td>
              </tr>
            ) : (
              requests.map((p) => {
                const badge = STATUS_BADGE_STYLES[p.enhancementStatus] || STATUS_BADGE_STYLES.pending;
                return (
                  <tr key={p._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #E2E8F0' }}
                          />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: 6, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Package size={20} color="#94A3B8" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: '#0F172A' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>
                            {p.brandName || 'Unbranded'} {p.categoryId?.name ? `• ${p.categoryId.name}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <div style={{ fontWeight: 500, color: '#1E293B' }}>{p.manufacturerId?.name || p.sellerName || 'Seller'}</div>
                      <div style={{ fontSize: 11.5, color: '#94A3B8' }}>ID: {String(p.sellerId?._id || p.sellerId || '').slice(-6)}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>
                      <div><strong>₹{p.price}</strong> / {p.unit || 'Piece'}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>MOQ: {p.moq || '1'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748B' }}>
                      {p.enhancementRequestedAt ? new Date(p.enhancementRequestedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 10px',
                          borderRadius: 12,
                          fontSize: 11.5,
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        className="admin-btn admin-btn-primary"
                        style={{ fontSize: 12, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit3 size={13} />
                        Review & Enhance
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #E2E8F0', fontSize: 13 }}>
            <span style={{ color: '#64748B' }}>Total: {total} requests</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review & Edit Modal */}
      {selectedProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="admin-card"
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              borderRadius: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                  Enhance Product Listing
                </h2>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Requested by {selectedProduct.manufacturerId?.name || selectedProduct.sellerName}
                </div>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                    Optimized Product Title *
                  </label>
                  <input
                    className="admin-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>

                {/* Brand & Model */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Brand Name
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.brandName}
                      onChange={(e) => setEditForm({ ...editForm, brandName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Model Number
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.modelNumber}
                      onChange={(e) => setEditForm({ ...editForm, modelNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* Price, Unit, MOQ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Price (₹)
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Unit
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.unit}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      MOQ
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.moq}
                      onChange={(e) => setEditForm({ ...editForm, moq: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                    Enhanced Description & Bullet Points *
                  </label>
                  <textarea
                    className="admin-input"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    required
                  />
                </div>

                {/* Image URL & Delivery Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Primary Image URL
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.imageUrl}
                      onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Delivery Lead Time
                    </label>
                    <input
                      className="admin-input"
                      value={editForm.deliveryTime}
                      onChange={(e) => setEditForm({ ...editForm, deliveryTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* SEO Tags */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                    Keywords & Search Tags (comma-separated)
                  </label>
                  <input
                    className="admin-input"
                    placeholder="e.g., steel coil, industrial pipe, heavy fabrication"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                  />
                </div>

                {/* Status & Notes */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Enhancement Status
                    </label>
                    <select
                      className="admin-input"
                      value={editForm.enhancementStatus}
                      onChange={(e) => setEditForm({ ...editForm, enhancementStatus: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed / Enhanced</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>
                      Internal Enhancement Notes
                    </label>
                    <input
                      className="admin-input"
                      placeholder="Notes on optimizations made (visible to admins)..."
                      value={editForm.enhancementNotes}
                      onChange={(e) => setEditForm({ ...editForm, enhancementNotes: e.target.value })}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setSelectedProduct(null)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save & Update Post'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
