'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function CreditPackageModal({ pkg, isNew, onClose, onSave }) {
  const [formData, setFormData] = useState({
    key: pkg?.key || '',
    name: pkg?.name || '',
    description: pkg?.description || '',
    credits: pkg?.credits || 10,
    priceInr: pkg?.priceInr || 399,
    crossedPriceInr: pkg?.crossedPriceInr || '',
    showCrossedPrice: pkg?.showCrossedPrice || false,
    badge: pkg?.badge || '',
    isActive: pkg?.isActive !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Package name is required');
      return;
    }
    if (isNew && !formData.key.trim()) {
      setError('Package key is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        credits: Number(formData.credits),
        priceInr: Number(formData.priceInr),
        crossedPriceInr: formData.crossedPriceInr ? Number(formData.crossedPriceInr) : null,
      };
      await onSave(payload, isNew);
    } catch (err) {
      setError(err.message || 'Failed to save package');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              {isNew ? 'Create Credit Top-up Pack' : `Edit: ${pkg.name}`}
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
              Configure SmartCredit bundle pricing and credit amounts.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 6,
            borderRadius: 8, color: '#64748B', display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', color: '#EF4444', padding: '10px 14px',
              borderRadius: 10, fontSize: 13, marginBottom: 16, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {isNew && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Unique Key Identifier <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                name="key"
                value={formData.key}
                onChange={handleChange}
                placeholder="e.g. bundle50, starter_pack"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Display Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. 50 Credits Booster"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Credits Granted <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                min="1"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Selling Price (₹ INR) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="number"
                name="priceInr"
                value={formData.priceInr}
                onChange={handleChange}
                min="0"
                required
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 14, outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Strikethrough Price (₹ Optional)
              </label>
              <input
                type="number"
                name="crossedPriceInr"
                value={formData.crossedPriceInr}
                onChange={handleChange}
                placeholder="e.g. 599"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Badge Tag (Optional)
            </label>
            <input
              type="text"
              name="badge"
              value={formData.badge}
              onChange={handleChange}
              placeholder="e.g. BEST VALUE, MOST POPULAR"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1px solid #CBD5E1', fontSize: 14, outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="showCrossedPrice"
                checked={formData.showCrossedPrice}
                onChange={handleChange}
              />
              Show % Discount & Strikethrough
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              Active in Mobile App
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px', borderRadius: 10, border: '1px solid #CBD5E1',
                background: '#F8FAFC', color: '#475569', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 22px', borderRadius: 10, border: 'none',
                background: '#0F172A', color: '#fff', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
              }}
            >
              {saving ? 'Saving...' : isNew ? 'Create Package' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
