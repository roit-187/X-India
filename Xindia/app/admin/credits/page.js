'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coins,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Send,
  Check,
  Flame,
  Award,
} from 'lucide-react';
import CreditPackageModal from '@/components/admin/CreditPackageModal';
import LeadBoostPlanModal from '@/components/admin/LeadBoostPlanModal';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const formatPrice = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

export default function AdminCreditsPage() {
  const { canManageCredits, loaded } = useAdminPermissions();
  const [settings, setSettings] = useState({
    dailyFreeCredits: 3,
    maxWeeklyCreditCap: 20,
    maxMonthlyCreditCap: 50,
    highIntentLeadCost: 3,
    standardInquiryCost: 1,
    creditExpiryDays: 90,
  });
  const [packages, setPackages] = useState([]);
  const [boostPlans, setBoostPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  // Modals for Top-up Credit Packages
  const [modalState, setModalState] = useState({ open: false, isNew: false, pkg: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Modals for Lead Boost Plans
  const [boostModalState, setBoostModalState] = useState({ open: false, isNew: false, plan: null });
  const [boostDeleteTarget, setBoostDeleteTarget] = useState(null);

  // Load Settings, Credit Packages, and Lead Boost Plans
  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, packagesRes, boostPlansRes] = await Promise.all([
        fetch('/api/admin/settings/credits'),
        fetch('/api/admin/credit-packages'),
        fetch('/api/admin/boost-plans'),
      ]);

      const settingsData = await settingsRes.json();
      const packagesData = await packagesRes.json();
      const boostPlansData = await boostPlansRes.json();

      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings);
      }
      if (packagesData.success && packagesData.packages) {
        setPackages(packagesData.packages);
      }
      if (boostPlansData.success && boostPlansData.plans) {
        setBoostPlans(boostPlansData.plans);
      }
    } catch (err) {
      console.error('Error loading credit/boost data:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load credit & boost settings from server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loaded && !canManageCredits) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 32 }} className="admin-card">
        <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>Access Restricted</h2>
        <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>
          Credits, boosts, and pricing configuration is strictly restricted to Super Administrators.
        </p>
        <Link href="/admin/dashboard" className="admin-btn admin-btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Save System Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/settings/credits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: 'Credit policy & limits updated successfully!' });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      } else {
        setStatusMsg({ type: 'error', text: data.message || 'Failed to update settings' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network error saving settings' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Save / Create Credit Package
  const handleSavePackage = async (payload, isNew) => {
    const url = isNew
      ? '/api/admin/credit-packages'
      : `/api/admin/credit-packages/${payload.key}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to save package');
    }
    setModalState({ open: false, isNew: false, pkg: null });
    loadData();
  };

  // Delete / Deactivate Credit Package
  const handleDeletePackage = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/credit-packages/${deleteTarget.key}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Delete package error:', err);
    }
  };

  // Save / Create Lead Boost Plan
  const handleSaveBoostPlan = async (payload, isNew) => {
    const url = isNew
      ? '/api/admin/boost-plans'
      : `/api/admin/boost-plans/${payload.key}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Failed to save lead boost plan');
    }
    setBoostModalState({ open: false, isNew: false, plan: null });
    setStatusMsg({ type: 'success', text: `Lead boost plan "${payload.name}" saved successfully!` });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    loadData();
  };

  // Toggle / Deactivate Lead Boost Plan
  const handleToggleBoostPlan = async () => {
    if (!boostDeleteTarget) return;
    try {
      const res = await fetch(`/api/admin/boost-plans/${boostDeleteTarget.key}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: `Lead boost plan "${boostDeleteTarget.name}" status updated.` });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
      }
      setBoostDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Boost plan delete error:', err);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1160, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Coins size={28} color="#F59E0B" /> Credits &amp; Boosts Pricing
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Configure seller free daily credits, rollover caps, top-up packs, and buyer lead boost tiers.
          </p>
        </div>
      </div>

      {statusMsg.text && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: statusMsg.type === 'success' ? '#DCFCE7' : '#FEF2F2',
          color: statusMsg.type === 'success' ? '#15803D' : '#DC2626',
          borderRadius: 12, padding: '14px 18px', marginBottom: 24, fontSize: 14, fontWeight: 700,
        }}>
          {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {statusMsg.text}
        </div>
      )}

      {/* ── Section 1: Dynamic Lead Boost Plans ── */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0',
        padding: 28, marginBottom: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={22} color="#FF6600" />
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
                Buyer Lead Boost Plans (RFQ Priority Listing)
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              Dynamic buyer requirements boosting tiers shown in the mobile app. Edit prices, durations, feature bullets, and add new plans.
            </p>
          </div>
          <button
            onClick={() => setBoostModalState({ open: true, isNew: true, plan: null })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              borderRadius: 12, border: 'none', background: '#FF6600', color: '#fff',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,102,0,0.25)',
            }}
          >
            <Plus size={16} /> Add Lead Boost Plan
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>Loading lead boost plans...</div>
        ) : boostPlans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>No lead boost plans found. Click Add to create one.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {boostPlans.map((plan) => (
              <div
                key={plan.key}
                style={{
                  background: '#fff',
                  borderRadius: 18,
                  border: `2px solid ${plan.isActive !== false ? (plan.accentColor || '#E2E8F0') : '#E2E8F0'}`,
                  padding: 22,
                  position: 'relative',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  opacity: plan.isActive === false ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Badge Tag */}
                {plan.badge && (
                  <span style={{
                    position: 'absolute', top: 16, right: 16,
                    background: (plan.accentColor || '#FF6600') + '20',
                    color: plan.accentColor || '#FF6600',
                    fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 6,
                    border: `1px solid ${(plan.accentColor || '#FF6600')}40`,
                  }}>
                    {plan.badge}
                  </span>
                )}

                {/* Slug key */}
                <div style={{
                  fontSize: 11, fontWeight: 800, color: '#64748B',
                  textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6,
                }}>
                  Key: {plan.key}
                </div>

                {/* Title */}
                <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {plan.name}
                </h3>

                {plan.description ? (
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
                    {plan.description}
                  </p>
                ) : <div style={{ height: 12 }} />}

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#0F172A' }}>
                    {formatPrice(plan.priceInr)}
                  </span>
                  {plan.showCrossedPrice && plan.crossedPriceInr && (
                    <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through' }}>
                      {formatPrice(plan.crossedPriceInr)}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    / {plan.durationHours} Hours
                  </span>
                </div>

                {/* SLA & Fan-out pills */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, background: '#F1F5F9',
                    padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#475569',
                  }}>
                    <Send size={12} color="#64748B" /> {plan.fanOutCap || 15} Suppliers Notified
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, background: '#F1F5F9',
                    padding: '4px 9px', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#475569',
                  }}>
                    <Clock size={12} color="#64748B" /> {plan.respondBySlaHours || 24}h Turnaround SLA
                  </div>
                </div>

                {/* Bullets */}
                {plan.bullets && plan.bullets.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18, flex: 1 }}>
                    {plan.bullets.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#334155' }}>
                        <Check size={13} color={plan.accentColor || '#FF6600'} />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 14, borderTop: '1px solid #F1F5F9', marginTop: 'auto',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    color: plan.isActive !== false ? '#059669' : '#94A3B8',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: plan.isActive !== false ? '#059669' : '#94A3B8',
                    }} />
                    {plan.isActive !== false ? 'ACTIVE ON APP' : 'INACTIVE'}
                  </span>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setBoostModalState({ open: true, isNew: false, plan })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                        borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC',
                        fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer',
                      }}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setBoostDeleteTarget(plan)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                        borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5',
                        fontSize: 12, fontWeight: 700, color: '#EF4444', cursor: 'pointer',
                      }}
                    >
                      {plan.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Top-Up Credit Packages (Single & Bundle Packs) ── */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0',
        padding: 28, marginBottom: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Coins size={22} color="#F59E0B" />
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
                Seller Top-up Credit Packages
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              Configure single packs and bundle packs shown in the seller mobile app Buy Credits screen.
            </p>
          </div>
          <button
            onClick={() => setModalState({ open: true, isNew: true, pkg: null })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              borderRadius: 12, border: 'none', background: '#0F172A', color: '#fff',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
            }}
          >
            <Plus size={16} /> Add Top-up Pack
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#94A3B8' }}>Loading packages...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {packages.map((pkg) => (
              <div
                key={pkg.key}
                style={{
                  background: '#fff', borderRadius: 18, border: '2px solid #E2E8F0',
                  padding: 22, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  opacity: pkg.isActive === false ? 0.6 : 1,
                }}
              >
                {pkg.badge && (
                  <span style={{
                    position: 'absolute', top: 16, right: 16,
                    background: '#F59E0B', color: '#fff', fontSize: 10,
                    fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                  }}>
                    {pkg.badge}
                  </span>
                )}

                <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                  {pkg.key}
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {pkg.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#0F172A' }}>
                    {formatPrice(pkg.priceInr)}
                  </span>
                  {pkg.showCrossedPrice && pkg.crossedPriceInr && (
                    <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through' }}>
                      {formatPrice(pkg.crossedPriceInr)}
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9',
                  padding: '8px 12px', borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: 700, color: '#334155',
                }}>
                  <Zap size={16} color="#F59E0B" /> {pkg.credits} SmartCredits
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setModalState({ open: true, isNew: false, pkg })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC',
                      fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer',
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(pkg)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5',
                      fontSize: 12, fontWeight: 700, color: '#EF4444', cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} /> Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section 3: Global Policy & Accumulation Caps ── */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0',
        padding: 28, marginBottom: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Sliders size={20} color="#0F172A" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
            Free Credit Limits &amp; Lead Pricing Rules
          </h2>
        </div>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
            {/* Daily Free Credits */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                Daily Free Grant
              </label>
              <input
                type="number"
                value={settings.dailyFreeCredits ?? 3}
                onChange={(e) => setSettings({ ...settings, dailyFreeCredits: Number(e.target.value) })}
                min="0"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 16, fontWeight: 700, outline: 'none',
                }}
              />
              <span style={{ display: 'block', fontSize: 11, color: '#64748B', marginTop: 6 }}>
                Credits added to active sellers per day.
              </span>
            </div>

            {/* Monthly Rollover Cap */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                Monthly Max Cap (Unused)
              </label>
              <input
                type="number"
                value={settings.maxMonthlyCreditCap ?? 50}
                onChange={(e) => setSettings({ ...settings, maxMonthlyCreditCap: Number(e.target.value) })}
                min="1"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 16, fontWeight: 700, outline: 'none',
                }}
              />
              <span style={{ display: 'block', fontSize: 11, color: '#64748B', marginTop: 6 }}>
                Max free credits accumulated (e.g. 50 max cap).
              </span>
            </div>

            {/* High Intent Lead Unlock Cost */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                High-Intent Lead Cost
              </label>
              <select
                value={settings.highIntentLeadCost ?? 3}
                onChange={(e) => setSettings({ ...settings, highIntentLeadCost: Number(e.target.value) })}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 15, fontWeight: 700, outline: 'none', background: '#fff',
                }}
              >
                <option value="1">1 Credit</option>
                <option value="2">2 Credits</option>
                <option value="3">3 Credits (Default)</option>
                <option value="4">4 Credits</option>
                <option value="5">5 Credits</option>
              </select>
              <span style={{ display: 'block', fontSize: 11, color: '#64748B', marginTop: 6 }}>
                Cost to unlock urgent/high-intent requirements.
              </span>
            </div>

            {/* Standard Inquiry Cost */}
            <div style={{ background: '#F8FAFC', padding: 18, borderRadius: 14, border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                Standard Lead Cost
              </label>
              <input
                type="number"
                value={settings.standardInquiryCost ?? 1}
                onChange={(e) => setSettings({ ...settings, standardInquiryCost: Number(e.target.value) })}
                min="0"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1px solid #CBD5E1', fontSize: 16, fontWeight: 700, outline: 'none',
                }}
              />
              <span style={{ display: 'block', fontSize: 11, color: '#64748B', marginTop: 6 }}>
                Cost to unlock standard catalog inquiries.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingSettings}
              style={{
                padding: '12px 28px', borderRadius: 12, border: 'none',
                background: '#0F172A', color: '#fff', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,23,42,0.25)',
              }}
            >
              {savingSettings ? 'Saving Policy...' : 'Save Credit Policy & Limits'}
            </button>
          </div>
        </form>
      </div>

      {/* Credit Package Modal */}
      {modalState.open && (
        <CreditPackageModal
          pkg={modalState.pkg}
          isNew={modalState.isNew}
          onClose={() => setModalState({ open: false, isNew: false, pkg: null })}
          onSave={handleSavePackage}
        />
      )}

      {/* Lead Boost Plan Modal */}
      {boostModalState.open && (
        <LeadBoostPlanModal
          plan={boostModalState.plan}
          isNew={boostModalState.isNew}
          onClose={() => setBoostModalState({ open: false, isNew: false, plan: null })}
          onSave={handleSaveBoostPlan}
        />
      )}

      {/* Delete / Deactivate Credit Package Dialog */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Deactivate Pack?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              <strong>{deleteTarget.name}</strong> will be hidden from the mobile app.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeletePackage} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle / Deactivate Lead Boost Plan Dialog */}
      {boostDeleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
              {boostDeleteTarget.isActive !== false ? 'Deactivate Boost Plan?' : 'Reactivate Boost Plan?'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              <strong>{boostDeleteTarget.name}</strong> ({boostDeleteTarget.key}) will be{' '}
              {boostDeleteTarget.isActive !== false ? 'hidden from buyer app' : 'restored to buyer app'}.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setBoostDeleteTarget(null)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #CBD5E1', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleToggleBoostPlan}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: boostDeleteTarget.isActive !== false ? '#EF4444' : '#059669',
                  color: '#fff', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {boostDeleteTarget.isActive !== false ? 'Deactivate' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
