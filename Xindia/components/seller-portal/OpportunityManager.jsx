'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/admin/Modal';

const emptyForm = {
  title: '',
  description: '',
  categoryId: '',
  investment: '',
  profitRange: '',
  monthlyRevenue: '',
  launchDays: '',
  moq: '',
  tags: '',
  itemsOffered: '',
  highlights: '',
};

export default function OpportunityManager() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formatINR = (amount) => {
    if (amount == null || isNaN(amount)) return null;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/opportunities');
      const data = await res.json();
      if (data.success) {
        setOpportunities(data.opportunities || []);
      } else {
        setError(data.message || 'Failed to load opportunities');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (op) => {
    setEditingId(op._id);
    setForm({
      title: op.title || '',
      description: op.description || '',
      categoryId: op.categoryId || '',
      investment: op.investment ?? '',
      profitRange: op.profitRange || '',
      monthlyRevenue: op.monthlyRevenue ?? '',
      launchDays: op.launchDays ?? '',
      moq: op.moq ?? '',
      tags: (op.tags || []).join(', '),
      itemsOffered: (op.itemsOffered || []).join(', '),
      highlights: (op.highlights || []).join(', '),
    });
    setImageFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const toListField = (str) => JSON.stringify(str.split(',').map((s) => s.trim()).filter(Boolean));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('categoryId', form.categoryId || 'general');
      formData.append('investment', form.investment);
      formData.append('profitRange', form.profitRange);
      if (form.monthlyRevenue) formData.append('monthlyRevenue', form.monthlyRevenue);
      formData.append('launchDays', form.launchDays);
      formData.append('moq', form.moq);
      formData.append('tags', toListField(form.tags));
      formData.append('itemsOffered', toListField(form.itemsOffered));
      formData.append('highlights', toListField(form.highlights));
      if (imageFile) formData.append('image', imageFile);

      const url = editingId ? `/api/seller/opportunities/${editingId}` : '/api/seller/opportunities';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        loadOpportunities();
      } else {
        setFormError(data.message || 'Failed to save opportunity');
      }
    } catch (err) {
      console.error(err);
      setFormError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/seller/opportunities/${deleteTarget}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        loadOpportunities();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Business Opportunities</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            Posted here appear on your public portfolio&apos;s Opportunities tab, exactly as buyers see them.
          </p>
        </div>
        <button className="seller-btn seller-btn-primary" onClick={openAddModal}>+ Add Opportunity</button>
      </div>

      {loading ? (
        <p>Loading opportunities...</p>
      ) : error ? (
        <p style={{ color: '#EF4444' }}>{error}</p>
      ) : opportunities.length === 0 ? (
        <div className="seller-card" style={{ textAlign: 'center', color: '#64748B' }}>
          You haven&apos;t posted any business opportunities yet. Click &quot;+ Add Opportunity&quot; to create your first one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {opportunities.map((op) => (
            <div key={op._id} className="seller-card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={op.imageUrl}
                alt={op.title}
                style={{ width: 160, height: 120, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>{op.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px 0' }}>{op.description}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: 11 }}>Investment</div>
                    <div style={{ fontWeight: 600 }}>{formatINR(op.investment) || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: 11 }}>Profit Range</div>
                    <div style={{ fontWeight: 600 }}>{op.profitRange || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: 11 }}>MOQ</div>
                    <div style={{ fontWeight: 600 }}>{op.moq ?? '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#94A3B8', fontSize: 11 }}>Launch In</div>
                    <div style={{ fontWeight: 600 }}>{op.launchDays ?? '-'} days</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                <button className="seller-btn seller-btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openEditModal(op)}>Edit</button>
                <button className="seller-btn seller-btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setDeleteTarget(op._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Opportunity' : 'Add Business Opportunity'}>
        <form onSubmit={handleSubmit}>
          {formError && (
            <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: 10, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
              {formError}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Title</label>
            <input className="seller-input" style={{ width: '100%' }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</label>
            <textarea className="seller-input" style={{ width: '100%', minHeight: 70 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Investment (₹)</label>
              <input type="number" className="seller-input" style={{ width: '100%' }} value={form.investment} onChange={(e) => setForm({ ...form, investment: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Profit Range</label>
              <input className="seller-input" style={{ width: '100%' }} placeholder="₹15k - ₹40k / month" value={form.profitRange} onChange={(e) => setForm({ ...form, profitRange: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Monthly Revenue (₹)</label>
              <input type="number" className="seller-input" style={{ width: '100%' }} value={form.monthlyRevenue} onChange={(e) => setForm({ ...form, monthlyRevenue: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Launch In (days)</label>
              <input type="number" className="seller-input" style={{ width: '100%' }} value={form.launchDays} onChange={(e) => setForm({ ...form, launchDays: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>MOQ</label>
              <input type="number" className="seller-input" style={{ width: '100%' }} value={form.moq} onChange={(e) => setForm({ ...form, moq: e.target.value })} required />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Category</label>
            <input className="seller-input" style={{ width: '100%' }} placeholder="e.g. textiles, packaging" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Items Offered (comma separated)</label>
            <input className="seller-input" style={{ width: '100%' }} placeholder="Cotton bags, Jute bags, Printed pouches" value={form.itemsOffered} onChange={(e) => setForm({ ...form, itemsOffered: e.target.value })} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Highlights (comma separated)</label>
            <input className="seller-input" style={{ width: '100%' }} placeholder="No royalty, Pan-India delivery, Buyback guarantee" value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Tags (comma separated)</label>
            <input className="seller-input" style={{ width: '100%' }} placeholder="franchise, low-investment" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Opportunity Image</label>
            {editingId && !imageFile && (
              <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 6px 0' }}>Leave empty to keep the current image.</p>
            )}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} required={!editingId} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="seller-btn seller-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="seller-btn seller-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Opportunity' : 'Create Opportunity'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Opportunity">
        <p style={{ marginBottom: 16 }}>Are you sure you want to permanently delete this business opportunity?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="seller-btn seller-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="seller-btn seller-btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
