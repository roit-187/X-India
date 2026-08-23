'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageOff, PackagePlus, ShieldCheck, Sparkles, Layers } from 'lucide-react';
import Modal from '@/components/admin/Modal';
import Toggle from '@/components/admin/Toggle';
import Badge from '@/components/admin/Badge';

const B2B_UNITS = ['Piece', 'Pair', 'Kg', 'Ton', 'Meter', 'Litre', 'Box', 'Carton', 'Roll', 'Sq.Ft', 'Set'];
const GST_RATES = [0, 5, 12, 18, 28];

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
  const [activeTab, setActiveTab] = useState('basics'); // basics, wholesale, compliance
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Piece');
  const [moq, setMoq] = useState('100');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('3–5 Days');
  const [sampleAvailable, setSampleAvailable] = useState(false);
  const [samplePrice, setSamplePrice] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [gstRate, setGstRate] = useState(18);
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
    setActiveTab('basics');
    setName('');
    setDescription('');
    setPrice('');
    setUnit('Piece');
    setMoq('100');
    setLocation('');
    setCategory('');
    setDeliveryTime('3–5 Days');
    setSampleAvailable(false);
    setSamplePrice('');
    setHsnCode('');
    setGstRate(18);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setActiveTab('basics');
    setName(p.name || '');
    setDescription(p.description || '');
    setPrice(p.price || '');
    setUnit(p.unit || 'Piece');
    setMoq(p.moq || '100');
    setLocation(p.location || '');
    setCategory(p.category || p.categoryId?.name || '');
    setDeliveryTime(p.deliveryTime || '3–5 Days');
    setSampleAvailable(p.samplePolicy?.available || false);
    setSamplePrice(p.samplePolicy?.price ? String(p.samplePolicy.price) : '');
    setHsnCode(p.hsnCode || '');
    setGstRate(p.gstRate !== undefined ? p.gstRate : 18);
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
      if (category) formData.append('categoryId', category);
      if (deliveryTime) formData.append('deliveryTime', deliveryTime);
      if (hsnCode) formData.append('hsnCode', hsnCode);
      formData.append('gstRate', String(gstRate));
      formData.append(
        'samplePolicy',
        JSON.stringify({
          available: sampleAvailable,
          price: Number(samplePrice) || 0,
          leadTimeDays: deliveryTime,
        })
      );
      if (imageFile) formData.append('images', imageFile);

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
        <div>
          <h2 style={{ margin: 0, fontSize: 20 }}>B2B Product Catalog</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Manage wholesale listings, volume tiers, and technical specifications
          </p>
        </div>
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
          {products.map((p) => {
            const score = p.listingHealthScore || 50;
            const healthTier = score >= 90 ? 'Gold' : score >= 70 ? 'Silver' : 'Bronze';
            const healthColor = score >= 90 ? '#16A34A' : score >= 70 ? '#2563EB' : '#F59E0B';

            return (
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
                  <div style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(15,23,42,0.8)', padding: '2px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles size={12} color={healthColor} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF' }}>{healthTier} {score}%</span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: 15 }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px 0', minHeight: 36 }} numberOfLines={2}>{p.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {formatINR(p.price) ? `${formatINR(p.price)} / ${p.unit || 'Piece'}` : 'Price on request'}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>MOQ: {p.moq || 1} {p.unit || 'pc'}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                    <Badge label={p.isActive !== false ? 'Active' : 'Hidden'} variant={p.isActive !== false ? 'active' : 'expired'} />
                    {p.hsnCode ? <span style={{ fontSize: 11, color: '#475569', backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>HSN: {p.hsnCode}</span> : null}
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', marginTop: 12, paddingTop: 12 }}>
                    <button className="seller-btn seller-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => openEditModal(p)}>Edit</button>
                    <button className="seller-btn seller-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setDeleteTarget(p._id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal (Tabbed Progressive) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit B2B Product' : 'Add B2B Product'}>
        {/* Tab Header */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E2E8F0', marginBottom: 16, paddingBottom: 8 }}>
          <button
            type="button"
            style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'basics' ? '#0B1F3A' : '#F1F5F9', color: activeTab === 'basics' ? '#FFFFFF' : '#475569' }}
            onClick={() => setActiveTab('basics')}
          >
            1. Core Details
          </button>
          <button
            type="button"
            style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'wholesale' ? '#0B1F3A' : '#F1F5F9', color: activeTab === 'wholesale' ? '#FFFFFF' : '#475569' }}
            onClick={() => setActiveTab('wholesale')}
          >
            2. Wholesale & Samples
          </button>
          <button
            type="button"
            style={{ padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: activeTab === 'compliance' ? '#0B1F3A' : '#F1F5F9', color: activeTab === 'compliance' ? '#FFFFFF' : '#475569' }}
            onClick={() => setActiveTab('compliance')}
          >
            3. Tax & Compliance
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basics' && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Product Title *</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="e.g. Industrial SS304 Ball Valve" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Category *</label>
                  <input className="seller-input" style={{ width: '100%' }} placeholder="Apparel, Machinery, Packaging..." value={category} onChange={(e) => setCategory(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Primary Unit *</label>
                  <select className="seller-input" style={{ width: '100%' }} value={unit} onChange={(e) => setUnit(e.target.value)}>
                    {B2B_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Base Price (₹) *</label>
                  <input type="number" className="seller-input" style={{ width: '100%' }} placeholder="350" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Min Order (MOQ) *</label>
                  <input className="seller-input" style={{ width: '100%' }} placeholder="100" value={moq} onChange={(e) => setMoq(e.target.value)} required />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Location (City, State) *</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="e.g. Surat, Gujarat" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Description *</label>
                <textarea className="seller-input" style={{ width: '100%', minHeight: 60 }} placeholder="Technical features, material grade, and applications..." value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Product Image *</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          {activeTab === 'wholesale' && (
            <div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Standard Production Lead Time</label>
                <input className="seller-input" style={{ width: '100%' }} placeholder="e.g. 3–5 Days" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 14, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Offer Paid Sample to Buyers?</label>
                  <Toggle checked={sampleAvailable} onChange={() => setSampleAvailable(!sampleAvailable)} />
                </div>
                {sampleAvailable && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Sample Unit Price (₹)</label>
                    <input type="number" className="seller-input" style={{ width: '100%' }} placeholder="e.g. 450" value={samplePrice} onChange={(e) => setSamplePrice(e.target.value)} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>HSN Code (India)</label>
                  <input className="seller-input" style={{ width: '100%' }} placeholder="e.g. 6109 or 8481" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>GST Rate (%)</label>
                  <select className="seller-input" style={{ width: '100%' }} value={gstRate} onChange={(e) => setGstRate(Number(e.target.value))}>
                    {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
            <button type="button" className="seller-btn seller-btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="seller-btn seller-btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Publish Product'}
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
