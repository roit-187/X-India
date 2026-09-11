'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Zap, Check, Flame, Award, Rocket, Star, Sparkles, Send } from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Orange', value: '#FF6600' },
  { label: 'Purple', value: '#8B5CF6' },
  { label: 'Emerald', value: '#059669' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Rose', value: '#E11D48' },
  { label: 'Amber', value: '#D97706' },
];

const PRESET_ICONS = [
  { key: 'flash', label: 'Flash' },
  { key: 'ribbon', label: 'Ribbon' },
  { key: 'zap', label: 'Zap' },
  { key: 'star', label: 'Star' },
  { key: 'rocket', label: 'Rocket' },
  { key: 'paper-plane', label: 'Plane' },
];

export default function LeadBoostPlanModal({ plan, isNew, onClose, onSave }) {
  const [formData, setFormData] = useState({
    key: plan?.key || '',
    name: plan?.name || '',
    description: plan?.description || '',
    priceInr: plan?.priceInr !== undefined ? plan.priceInr : 29,
    crossedPriceInr: plan?.crossedPriceInr || '',
    showCrossedPrice: plan?.showCrossedPrice || false,
    durationHours: plan?.durationHours || 48,
    badge: plan?.badge || '',
    accentColor: plan?.accentColor || '#FF6600',
    icon: plan?.icon || 'flash',
    bullets: plan?.bullets && plan.bullets.length > 0 ? [...plan.bullets] : ['Top visibility to verified suppliers', 'Priority badge on listing', 'Get 3x faster responses'],
    fanOutCap: plan?.fanOutCap || 15,
    respondBySlaHours: plan?.respondBySlaHours || 24,
    order: plan?.order !== undefined ? plan.order : 0,
    isActive: plan?.isActive !== false,
  });

  const [newBulletText, setNewBulletText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddBullet = () => {
    if (!newBulletText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      bullets: [...prev.bullets, newBulletText.trim()],
    }));
    setNewBulletText('');
  };

  const handleRemoveBullet = (index) => {
    setFormData((prev) => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index),
    }));
  };

  const handleBulletChange = (index, text) => {
    setFormData((prev) => {
      const updated = [...prev.bullets];
      updated[index] = text;
      return { ...prev, bullets: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Plan name is required');
      return;
    }
    if (isNew && !formData.key.trim()) {
      setError('Plan slug key is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        priceInr: Number(formData.priceInr),
        crossedPriceInr: formData.crossedPriceInr ? Number(formData.crossedPriceInr) : null,
        durationHours: Number(formData.durationHours),
        fanOutCap: Number(formData.fanOutCap),
        respondBySlaHours: Number(formData.respondBySlaHours),
        order: Number(formData.order),
      };
      await onSave(payload, isNew);
    } catch (err) {
      setError(err.message || 'Failed to save lead boost plan');
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '92vh',
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={20} color={formData.accentColor} />
              {isNew ? 'Create New Lead Boost Plan' : `Edit Lead Boost Plan: ${formData.name || formData.key}`}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
              Configure buyer RFQ visibility boosts, duration, feature bullets, and pricing.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 6, borderRadius: 8 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626',
              borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 18,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Left Column: Form Fields */}
            <div>
              {/* Key / Slug */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Plan Key / Slug {isNew && <span style={{ color: '#EF4444' }}>*</span>}
                </label>
                <input
                  type="text"
                  name="key"
                  value={formData.key}
                  onChange={handleChange}
                  disabled={!isNew}
                  placeholder="e.g. priority, urgent, spotlight"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, outline: 'none',
                    background: !isNew ? '#F1F5F9' : '#fff', color: !isNew ? '#64748B' : '#0F172A',
                    fontFamily: 'monospace', fontWeight: 700,
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginTop: 3 }}>
                  Unique lowercase identifier used by checkout API & mobile app.
                </span>
              </div>

              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Plan Display Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Priority Match, Urgent Match"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 700, outline: 'none',
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Short Pitch / Subtitle
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g. Rapid supplier outreach with dedicated SLA monitoring"
                  style={{
                    width: '100%', padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, outline: 'none',
                  }}
                />
              </div>

              {/* Price & Crossed Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Selling Price (₹) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="priceInr"
                    value={formData.priceInr}
                    onChange={handleChange}
                    min="0"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 15, fontWeight: 800, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Crossed Price (₹)
                  </label>
                  <input
                    type="number"
                    name="crossedPriceInr"
                    value={formData.crossedPriceInr}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g. 49"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 15, outline: 'none', color: '#64748B',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  id="showCrossedPrice"
                  name="showCrossedPrice"
                  checked={formData.showCrossedPrice}
                  onChange={handleChange}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                <label htmlFor="showCrossedPrice" style={{ fontSize: 12, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                  Show strikethrough discount price on mobile app
                </label>
              </div>

              {/* Duration & Badge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Duration (Hours) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="durationHours"
                    value={formData.durationHours}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g. 24, 48, 72"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 700, outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    name="badge"
                    value={formData.badge}
                    onChange={handleChange}
                    placeholder="e.g. Most Popular"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Accent Color Presets */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, accentColor: c.value })}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c.value,
                        border: formData.accentColor === c.value ? '3px solid #0F172A' : '2px solid #fff',
                        cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      }}
                      title={c.label}
                    />
                  ))}
                  <input
                    type="color"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer', padding: 0 }}
                  />
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748B' }}>
                    {formData.accentColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Features, Bullets & Live Preview */}
            <div>
              {/* SLA & Fan-out */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Fan-out Cap
                  </label>
                  <input
                    type="number"
                    name="fanOutCap"
                    value={formData.fanOutCap}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g. 15, 30"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13, outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748B', display: 'block', marginTop: 2 }}>
                    Max verified suppliers notified
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Response SLA (Hours)
                  </label>
                  <input
                    type="number"
                    name="respondBySlaHours"
                    value={formData.respondBySlaHours}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g. 4, 24"
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13, outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 10.5, color: '#64748B', display: 'block', marginTop: 2 }}>
                    Target turnaround guarantee
                  </span>
                </div>
              </div>

              {/* Feature Bullets */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Feature Bullet Points
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  {formData.bullets.map((b, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="text"
                        value={b}
                        onChange={(e) => handleBulletChange(i, e.target.value)}
                        style={{
                          flex: 1, padding: '7px 10px', borderRadius: 6,
                          border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(i)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                        title="Delete bullet"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newBulletText}
                    onChange={(e) => setNewBulletText(e.target.value)}
                    placeholder="Add new feature bullet..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBullet(); } }}
                    style={{
                      flex: 1, padding: '8px 12px', borderRadius: 6,
                      border: '1px solid #CBD5E1', fontSize: 12, outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddBullet}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px',
                      borderRadius: 6, border: 'none', background: '#0F172A', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>

              {/* Status & Display Order */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Plan Status</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Enable or disable visibility on user app</div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    style={{ width: 18, height: 18 }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: formData.isActive ? '#059669' : '#94A3B8' }}>
                    {formData.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </label>
              </div>

              {/* Live Preview Card */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: 0.5, marginBottom: 8 }}>
                  Live Mobile App Card Preview
                </label>
                <div style={{
                  background: formData.accentColor + '0A',
                  border: `2px solid ${formData.accentColor}`,
                  borderRadius: 14,
                  padding: 16,
                  position: 'relative',
                }}>
                  {formData.badge && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      background: formData.accentColor + '20', color: formData.accentColor,
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                      border: `1px solid ${formData.accentColor}40`,
                    }}>
                      {formData.badge}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: formData.accentColor + '25', color: formData.accentColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={15} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: formData.accentColor }}>
                        {formData.name || 'Plan Title'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {formData.durationHours} Hours Boost
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0' }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>
                      ₹{formData.priceInr}
                    </span>
                    {formData.showCrossedPrice && formData.crossedPriceInr && (
                      <span style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'line-through' }}>
                        ₹{formData.crossedPriceInr}
                      </span>
                    )}
                  </div>

                  {formData.bullets.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                      {formData.bullets.slice(0, 3).map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#334155' }}>
                          <Check size={12} color={formData.accentColor} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid #CBD5E1',
                background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 24px', borderRadius: 8, border: 'none',
                background: '#0F172A', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
              }}
            >
              {saving ? 'Saving...' : isNew ? 'Create Boost Plan' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
