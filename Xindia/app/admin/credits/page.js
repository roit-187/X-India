'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Coins, Plus, Pencil, Trash2, ShieldCheck, Zap, Sliders, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import CreditPackageModal from '@/components/admin/CreditPackageModal';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const formatPrice = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

export default function AdminCreditsPage() {
  const { isSuperAdmin, loaded } = useAdminPermissions();
  const [settings, setSettings] = useState({
    dailyFreeCredits: 3,
    maxWeeklyCreditCap: 20,
    maxMonthlyCreditCap: 50,
    highIntentLeadCost: 3,
    standardInquiryCost: 1,
    creditExpiryDays: 90,
  });
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const [modalState, setModalState] = useState({ open: false, isNew: false, pkg: null });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Load Settings & Packages from API
  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsRes, packagesRes] = await Promise.all([
        fetch('/api/admin/settings/credits'),
        fetch('/api/admin/credit-packages'),
      ]);

      const settingsData = await settingsRes.json();
      const packagesData = await packagesRes.json();

      if (settingsData.success && settingsData.settings) {
        setSettings(settingsData.settings);
      }
      if (packagesData.success && packagesData.packages) {
        setPackages(packagesData.packages);
      }
    } catch (err) {
      console.error('Error loading credit data:', err);
      setStatusMsg({ type: 'error', text: 'Failed to load credit settings from server' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loaded && !isSuperAdmin) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 32 }} className="admin-card">
        <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>Access Restricted</h2>
        <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>
          Credits and policy configuration is strictly restricted to Super Administrators.
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

  // Save / Create Package
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

  // Delete / Deactivate Package
  const handleDeletePackage = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/admin/credit-packages/${deleteTarget.key}`, { method: 'DELETE' });
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Coins size={28} color="#F59E0B" /> Credits & Platform Policy
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Configure seller free daily credits, weekly/monthly rollover caps, dynamic lead costs, and purchase bundles.
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

      {/* ── Section 1: Global Policy & Accumulation Caps ── */}
      <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0',
        padding: 28, marginBottom: 32, boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Sliders size={20} color="#0F172A" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
            Free Credit Limits & Lead Pricing Rules
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

      {/* ── Section 2: Top-Up Credit Packages (Single & Bundle Packs) ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
              Top-up Credit Packages
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>
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
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading packages...</div>
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

      {/* Package Modal */}
      {modalState.open && (
        <CreditPackageModal
          pkg={modalState.pkg}
          isNew={modalState.isNew}
          onClose={() => setModalState({ open: false, isNew: false, pkg: null })}
          onSave={handleSavePackage}
        />
      )}

      {/* Delete / Deactivate Dialog */}
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
    </div>
  );
}
