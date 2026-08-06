'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';

const DEFAULT_COLORS = [
  '#10B981', '#2563EB', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#0F172A',
];

export default function PlanModal({ plan, isNew, onClose, onSave }) {
  const [form, setForm] = useState({
    key: '',
    name: '',
    tagline: '',
    badge: '',
    color: '#2563EB',
    icon: 'shield-checkmark-outline',
    isMostPopular: false,
    order: 99,
    // Monthly
    monthlyPrice: '',
    crossedMonthlyPrice: '',
    showMonthlyCrossedPrice: false,
    // Yearly
    yearlyPrice: '',
    crossedYearlyPrice: '',
    showYearlyCrossedPrice: false,
    // Features
    features: [],
  });

  const [newFeature, setNewFeature] = useState('');
  const [editingFeatureIdx, setEditingFeatureIdx] = useState(null);
  const [editingFeatureText, setEditingFeatureText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (plan) {
      setForm({
        key: plan.key || '',
        name: plan.name || '',
        tagline: plan.tagline || '',
        badge: plan.badge || '',
        color: plan.color || '#2563EB',
        icon: plan.icon || 'shield-checkmark-outline',
        isMostPopular: plan.isMostPopular || false,
        order: plan.order ?? 99,
        monthlyPrice: plan.monthlyPrice ?? '',
        crossedMonthlyPrice: plan.crossedMonthlyPrice ?? '',
        showMonthlyCrossedPrice: plan.showMonthlyCrossedPrice || false,
        yearlyPrice: plan.yearlyPrice ?? '',
        crossedYearlyPrice: plan.crossedYearlyPrice ?? '',
        showYearlyCrossedPrice: plan.showYearlyCrossedPrice || false,
        features: Array.isArray(plan.features) ? [...plan.features] : [],
      });
    }
  }, [plan]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addFeature = () => {
    const text = newFeature.trim();
    if (!text) return;
    setForm((f) => ({ ...f, features: [...f.features, text] }));
    setNewFeature('');
  };

  const deleteFeature = (idx) => {
    setForm((f) => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
  };

  const startEditFeature = (idx) => {
    setEditingFeatureIdx(idx);
    setEditingFeatureText(form.features[idx]);
  };

  const saveEditFeature = (idx) => {
    const updated = [...form.features];
    updated[idx] = editingFeatureText.trim() || updated[idx];
    setForm((f) => ({ ...f, features: updated }));
    setEditingFeatureIdx(null);
    setEditingFeatureText('');
  };

  const calcDiscount = (real, crossed) => {
    const r = parseFloat(real);
    const c = parseFloat(crossed);
    if (!r || !c || c <= r) return null;
    return Math.round(((c - r) / c) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Plan name is required.');
    if (!form.key.trim()) return setError('Plan key is required.');
    if (!form.monthlyPrice || !form.yearlyPrice) return setError('Both monthly and yearly prices are required.');

    setSaving(true);
    try {
      const body = {
        ...form,
        monthlyPrice: parseFloat(form.monthlyPrice),
        yearlyPrice: parseFloat(form.yearlyPrice),
        crossedMonthlyPrice: form.crossedMonthlyPrice !== '' ? parseFloat(form.crossedMonthlyPrice) : null,
        crossedYearlyPrice: form.crossedYearlyPrice !== '' ? parseFloat(form.crossedYearlyPrice) : null,
        order: parseInt(form.order) || 99,
      };

      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/admin/plans' : `/api/admin/plans/${form.key}`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save plan');
      onSave(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const monthlyDiscount = calcDiscount(form.monthlyPrice, form.crossedMonthlyPrice);
  const yearlyDiscount = calcDiscount(form.yearlyPrice, form.crossedYearlyPrice);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              {isNew ? '+ Add New Plan' : `Edit Plan — ${plan?.name}`}
            </h2>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
              {isNew ? 'Create a new subscription plan' : 'Update pricing, crossed prices, and benefits'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ─── Plan Metadata ─── */}
          <section>
            <SectionLabel>Plan Details</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Plan Name *">
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Growth" style={inputStyle} required />
              </FormField>
              <FormField label={`Key (slug) ${!isNew ? '— locked' : '*'}`}>
                <input
                  value={form.key}
                  onChange={(e) => isNew && set('key', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. growth"
                  style={{ ...inputStyle, background: !isNew ? '#F8FAFC' : '#fff', color: !isNew ? '#64748B' : '#0F172A' }}
                  readOnly={!isNew}
                  required
                />
              </FormField>
              <FormField label="Tagline">
                <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. For growing businesses" style={inputStyle} />
              </FormField>
              <FormField label="Badge Text">
                <input value={form.badge} onChange={(e) => set('badge', e.target.value)} placeholder="e.g. MOST POPULAR" style={inputStyle} />
              </FormField>
              <FormField label="Display Order">
                <input type="number" value={form.order} onChange={(e) => set('order', e.target.value)} style={inputStyle} min={1} />
              </FormField>
              <FormField label="Accent Color">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {DEFAULT_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => set('color', c)} style={{
                      width: 24, height: 24, borderRadius: '50%', background: c, border: form.color === c ? '3px solid #0F172A' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                    }} />
                  ))}
                  <input type="color" value={form.color} onChange={(e) => set('color', e.target.value)} style={{ width: 28, height: 28, border: 'none', padding: 0, borderRadius: 4, cursor: 'pointer' }} />
                </div>
              </FormField>
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Toggle checked={form.isMostPopular} onChange={(v) => set('isMostPopular', v)} />
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Mark as Most Popular</span>
            </div>
          </section>

          {/* ─── Monthly Pricing ─── */}
          <section>
            <SectionLabel>📅 Monthly Pricing</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Monthly Real Price (₹) *">
                <input type="number" value={form.monthlyPrice} onChange={(e) => set('monthlyPrice', e.target.value)} placeholder="e.g. 1999" style={inputStyle} min={0} required />
              </FormField>
              <FormField label={`Monthly Crossed Price (₹)${monthlyDiscount ? ` — ${monthlyDiscount}% OFF` : ''}`}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={form.crossedMonthlyPrice} onChange={(e) => set('crossedMonthlyPrice', e.target.value)} placeholder="e.g. 3999" style={{ ...inputStyle, flex: 1 }} min={0} />
                  <Toggle checked={form.showMonthlyCrossedPrice} onChange={(v) => set('showMonthlyCrossedPrice', v)} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>Toggle to show/hide strikethrough price</p>
              </FormField>
            </div>
          </section>

          {/* ─── Yearly Pricing ─── */}
          <section>
            <SectionLabel>🗓️ Yearly Pricing</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Yearly Real Price (₹) *">
                <input type="number" value={form.yearlyPrice} onChange={(e) => set('yearlyPrice', e.target.value)} placeholder="e.g. 11994" style={inputStyle} min={0} required />
              </FormField>
              <FormField label={`Yearly Crossed Price (₹)${yearlyDiscount ? ` — ${yearlyDiscount}% OFF` : ''}`}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="number" value={form.crossedYearlyPrice} onChange={(e) => set('crossedYearlyPrice', e.target.value)} placeholder="e.g. 23994" style={{ ...inputStyle, flex: 1 }} min={0} />
                  <Toggle checked={form.showYearlyCrossedPrice} onChange={(v) => set('showYearlyCrossedPrice', v)} />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>Toggle to show/hide strikethrough price</p>
              </FormField>
            </div>
          </section>

          {/* ─── Benefits / Features ─── */}
          <section>
            <SectionLabel>✅ Plan Benefits</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {form.features.length === 0 && (
                <p style={{ color: '#CBD5E1', fontSize: 13, margin: 0 }}>No benefits added yet. Add some below.</p>
              )}
              {form.features.map((feat, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC',
                  borderRadius: 10, padding: '8px 12px', border: '1px solid #E2E8F0',
                }}>
                  <GripVertical size={14} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  {editingFeatureIdx === idx ? (
                    <input
                      autoFocus
                      value={editingFeatureText}
                      onChange={(e) => setEditingFeatureText(e.target.value)}
                      onBlur={() => saveEditFeature(idx)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEditFeature(idx); }}
                      style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: 13 }}
                    />
                  ) : (
                    <span
                      onClick={() => startEditFeature(idx)}
                      style={{ flex: 1, fontSize: 13, color: '#334155', cursor: 'text' }}
                      title="Click to edit"
                    >
                      {feat}
                    </span>
                  )}
                  <button type="button" onClick={() => deleteFeature(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                placeholder="Type a benefit and press Enter or click Add"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button type="button" onClick={addFeature} style={{
                background: '#0F172A', color: '#fff', border: 'none', borderRadius: 10,
                padding: '0 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 13, fontWeight: 700,
              }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </section>

          {/* ─── Error & Submit ─── */}
          {error && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
            <button type="button" onClick={onClose} style={{
              padding: '10px 20px', borderRadius: 10, border: '1px solid #E2E8F0',
              background: '#F8FAFC', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{
              padding: '10px 24px', borderRadius: 10, border: 'none',
              background: saving ? '#CBD5E1' : '#0F172A', color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14,
            }}>
              {saving ? 'Saving...' : isNew ? 'Create Plan' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function SectionLabel({ children }) {
  return <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{children}</p>;
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
      background: checked ? '#10B981' : '#CBD5E1', position: 'relative', transition: 'background 0.2s',
    }}>
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #E2E8F0',
  fontSize: 13, color: '#0F172A', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', background: '#fff',
};
