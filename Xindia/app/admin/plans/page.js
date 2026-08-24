'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import PlanModal from '@/components/admin/PlanModal';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const calcDiscount = (real, crossed) => {
  if (!real || !crossed || crossed <= real) return null;
  return Math.round(((crossed - real) / crossed) * 100);
};

function PlanCard({ plan, billing, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const crossedPrice = billing === 'monthly' ? plan.crossedMonthlyPrice : plan.crossedYearlyPrice;
  const showCrossed = billing === 'monthly' ? plan.showMonthlyCrossedPrice : plan.showYearlyCrossedPrice;
  const discount = showCrossed ? calcDiscount(price, crossedPrice) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 20,
        border: `2px solid ${hovered ? plan.color : '#E2E8F0'}`,
        padding: 24,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `0 8px 32px ${plan.color}22` : '0 2px 8px rgba(0,0,0,0.06)',
        opacity: plan.isActive === false ? 0.5 : 1,
      }}
    >
      {/* Hover action overlay */}
      {hovered && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', gap: 6, zIndex: 10,
        }}>
          <button
            onClick={() => onEdit(plan)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
              color: '#0F172A', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => onDelete(plan)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 8, border: '1px solid #FEE2E2', background: '#FFF5F5',
              color: '#EF4444', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}

      {/* Badge */}
      {plan.badge && (
        <div style={{
          display: 'inline-block', background: plan.color, color: '#fff',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
          borderRadius: 6, padding: '3px 10px', marginBottom: 10,
        }}>
          {plan.badge}
        </div>
      )}

      {/* Plan name & tagline */}
      <div style={{ marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{plan.name}</h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>{plan.tagline}</p>
      </div>

      {/* Price display */}
      <div style={{ marginBottom: 16 }}>
        {showCrossed && crossedPrice && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ textDecoration: 'line-through', color: '#94A3B8', fontSize: 14 }}>
              {formatPrice(crossedPrice)}/{billing === 'monthly' ? 'mo' : 'yr'}
            </span>
            {discount && (
              <span style={{
                background: '#DCFCE7', color: '#16A34A', fontSize: 11,
                fontWeight: 800, borderRadius: 6, padding: '2px 8px',
              }}>
                {discount}% OFF
              </span>
            )}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: plan.color }}>
            {formatPrice(price)}
          </span>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            /{billing === 'monthly' ? 'month' : 'year'}
          </span>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {(plan.features || []).map((feat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={14} color={plan.color} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#475569' }}>{feat}</span>
          </div>
        ))}
      </div>

      {/* Inactive tag */}
      {plan.isActive === false && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          display: 'flex', alignItems: 'center', gap: 4,
          background: '#FEF2F2', color: '#EF4444', fontSize: 11,
          fontWeight: 700, borderRadius: 6, padding: '3px 10px',
        }}>
          <XCircle size={11} /> Inactive
        </div>
      )}
    </div>
  );
}

export default function AdminPlansPage() {
  const { canManagePlans, loaded } = useAdminPermissions();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState('monthly');
  const [modalState, setModalState] = useState({ open: false, plan: null, isNew: false });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/plans', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPlans(data.plans);
      else setError(data.message || 'Failed to load plans');
    } catch (err) {
      setError('Network error loading plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  if (loaded && !canManagePlans) {
    return (
      <div style={{ maxWidth: 600, margin: '60px auto', textAlign: 'center', padding: 32 }} className="admin-card">
        <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>Access Restricted</h2>
        <p style={{ color: '#64748B', fontSize: 14, margin: '0 0 20px' }}>
          Plans and pricing management is strictly restricted to Super Administrators.
        </p>
        <Link href="/admin/dashboard" className="admin-btn admin-btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const openAdd = () => setModalState({ open: true, plan: null, isNew: true });
  const openEdit = (plan) => setModalState({ open: true, plan, isNew: false });
  const closeModal = () => setModalState({ open: false, plan: null, isNew: false });

  const handleSave = (savedPlan) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.key === savedPlan.key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedPlan;
        return next;
      }
      return [...prev, savedPlan];
    });
    closeModal();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${deleteTarget.key}`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Delete failed');
      setPlans((prev) => prev.map((p) => p.key === deleteTarget.key ? { ...p, isActive: false } : p));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A' }}>Plans & Pricing</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
            Manage subscription plans, prices, strikethrough pricing, and plan benefits.
          </p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            borderRadius: 12, border: 'none', background: '#0F172A', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
          }}
        >
          <Plus size={16} /> Add New Plan
        </button>
      </div>

      {/* Billing Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#F1F5F9', borderRadius: 12, width: 'fit-content', padding: 4 }}>
        {['monthly', 'yearly'].map((cycle) => (
          <button
            key={cycle}
            onClick={() => setBilling(cycle)}
            style={{
              padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: billing === cycle ? '#0F172A' : 'transparent',
              color: billing === cycle ? '#fff' : '#64748B',
              fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
            }}
          >
            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FEF2F2', color: '#EF4444', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Plans Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Loading plans...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              billing={billing}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalState.open && (
        <PlanModal
          plan={modalState.plan}
          isNew={modalState.isNew}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirm Dialog */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Deactivate Plan?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              <strong>{deleteTarget.name}</strong> will be marked as inactive. Existing sellers on this plan will not be affected.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)} style={{
                padding: '9px 18px', borderRadius: 10, border: '1px solid #E2E8F0',
                background: '#F8FAFC', color: '#475569', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} disabled={saving} style={{
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: '#EF4444', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
              }}>
                {saving ? 'Deactivating...' : 'Yes, Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
