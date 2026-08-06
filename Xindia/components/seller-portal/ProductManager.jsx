'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageOff, PackagePlus } from 'lucide-react';
import Modal from '@/components/admin/Modal';
import Toggle from '@/components/admin/Toggle';
import Badge from '@/components/admin/Badge';

export default function ProductManager({ sellerId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatINR = (price) => {
    if (price === null || price === undefined || price === '') return null;
    if (typeof price === 'string') {
      const trimmed = price.trim();
      if (trimmed.includes('₹') || trimmed.includes('-')) return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
      const num = Number(trimmed.replace(/,/g, ''));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
      }
      return trimmed.startsWith('₹') ? trimmed : `₹${trimmed}`;
    }
    const num = Number(price);
    if (isNaN(num)) return null;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num);
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('');
  const [moq, setMoq] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/seller-products?sellerId=${sellerId}&page=1&limit=50`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || data.items || []);
      } else {
        setError(data.message || 'Failed to load products');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setUnit('');
    setMoq('');
    setLocation('');
    setCategory('');
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setName(p.name || '');
    setDescription(p.description || '');
    setPrice(p.price || '');
    setUnit(p.unit || '');
    setMoq(p.moq || '');
    setLocation(p.location || '');
    setCategory(p.category || '');
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      if (price) formData.append('price', price);
      if (unit) formData.append('unit', unit);
      if (moq) formData.append('moq', moq);
      if (location) formData.append('location', location);
      if (category) formData.append('category', category);
      if (imageFile) formData.append('image', imageFile);

      const url = editingProduct
        ? `/api/seller-products/${editingProduct._id}`
        : `/api/seller-products`;
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();

      if (data.success) {
        setModalOpen(false);
        loadProducts();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/seller-products/${deleteTarget}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDeleteTarget(null);
        loadProducts();
      } else {
        alert(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  const handleToggleActive = async (p) => {
    try {
      const res = await fetch(`/api/seller-products/${p._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        loadProducts();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0 }}>Product Catalog</h2>
        <button className="seller-btn seller-btn-primary" onClick={openAddModal}>+ Add Product</button>
      </div>

      {loading ? (
        <div className="seller-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="seller-card seller-product-skeleton">
              <div className="seller-skeleton-block" style={{ height: 140, marginBottom: 12 }} />
              <div className="seller-skeleton-block" style={{ height: 14, width: '70%', marginBottom: 8 }} />
              <div className="seller-skeleton-block" style={{ height: 12, width: '90%' }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <p style={{ color: '#EF4444' }}>{error}</p>
      ) : products.length === 0 ? (
        <div className="seller-card seller-empty-state">
          <PackagePlus size={36} color="#94A3B8" />
          <p style={{ margin: '12px 0 4px 0', fontWeight: 600, color: '#334155' }}>No products listed yet</p>
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Click &quot;+ Add Product&quot; to create your first catalog listing.</p>
        </div>
      ) : (
        <div className="seller-grid">
          {products.map((p) => (
            <div key={p._id} className="seller-card seller-product-card">
              <div className="seller-product-thumb">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <ImageOff size={28} color="#CBD5E1" />
                )}
                <div className="seller-product-thumb-toggle">
                  <Toggle checked={p.isActive !== false} onChange={() => handleToggleActive(p)} />
                </div>
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 15 }}>{p.name}</h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px 0', minHeight: 36 }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                    {formatINR(p.price) ? `${formatINR(p.price)} ${p.unit ? '/ ' + p.unit : ''}` : 'Price on request'}
                  </div>
                  <Badge label={p.isActive !== false ? 'Active' : 'Hidden'} variant={p.isActive !== false ? 'active' : 'expired'} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', marginTop: 12, paddingTop: 12 }}>
                  <button className="seller-btn seller-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditModal(p)}>Edit</button>
                  <button className="seller-btn seller-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDeleteTarget(p._id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Product Name</label>
            <input className="seller-input" style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description</label>
            <textarea className="seller-input" style={{ width: '100%', minHeight: 60 }} value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Price (₹)</label>
              <input type="number" className="seller-input" style={{ width: '100%' }} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Unit</label>
              <input className="seller-input" style={{ width: '100%' }} placeholder="piece, kg, meter" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Min Order Qty (MOQ)</label>
              <input className="seller-input" style={{ width: '100%' }} placeholder="100 units" value={moq} onChange={(e) => setMoq(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Category</label>
              <input className="seller-input" style={{ width: '100%' }} placeholder="Textiles, Packaging..." value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Product Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="seller-btn seller-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="seller-btn seller-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product">
        <p style={{ marginBottom: 16 }}>Are you sure you want to permanently delete this product from your catalog?</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="seller-btn seller-btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
          <button className="seller-btn seller-btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
