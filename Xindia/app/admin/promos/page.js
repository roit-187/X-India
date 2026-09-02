'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Eye,
  EyeOff,
  Users,
  Copy,
  Check,
  Percent,
  Coins,
  CreditCard,
  X,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminPromosPage() {
  const { canManagePlans, loaded } = useAdminPermissions();

  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    maxDiscountAmount: '',
    minOrderAmount: 0,
    appliesTo: 'ALL',
    visibility: 'HIDDEN',
    targetAudience: 'ALL',
    allowedUserIds: [],
    usageLimitPerUser: 1,
    totalUsageLimit: '',
    expiryDate: '',
    isActive: true,
  });

  // User Selector State
  const [cohortFilter, setCohortFilter] = useState('newest'); // top_paying | newest | oldest
  const [cohortLimit, setCohortLimit] = useState(25);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userCandidates, setUserCandidates] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch Promo Codes
  const fetchPromos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promos');
      const data = await res.json();
      if (data.success && Array.isArray(data.promos)) {
        setPromos(data.promos);
      }
    } catch (err) {
      console.error('Failed to load promos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  // Fetch Candidates for Audience Selector
  const fetchCohortUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        filter: cohortFilter,
        limit: String(cohortLimit || 25),
        search: userSearchTerm.trim(),
      });
      const res = await fetch(`/api/admin/promos/users-filter?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUserCandidates(data.users);
      }
    } catch (err) {
      console.error('Failed to load users for audience selection:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [cohortFilter, cohortLimit, userSearchTerm]);

  useEffect(() => {
    if (isModalOpen && formData.targetAudience === 'SELECTED_USERS') {
      fetchCohortUsers();
    }
  }, [isModalOpen, formData.targetAudience, cohortFilter, cohortLimit, userSearchTerm, fetchCohortUsers]);

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: '',
      title: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      maxDiscountAmount: '',
      minOrderAmount: 0,
      appliesTo: 'ALL',
      visibility: 'HIDDEN',
      targetAudience: 'ALL',
      allowedUserIds: [],
      usageLimitPerUser: 1,
      totalUsageLimit: '',
      expiryDate: '',
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      title: promo.title || '',
      description: promo.description || '',
      discountType: promo.discountType || 'PERCENTAGE',
      discountValue: promo.discountValue || 0,
      maxDiscountAmount: promo.maxDiscountAmount != null ? promo.maxDiscountAmount : '',
      minOrderAmount: promo.minOrderAmount || 0,
      appliesTo: promo.appliesTo || 'ALL',
      visibility: promo.visibility || 'HIDDEN',
      targetAudience: promo.targetAudience || 'ALL',
      allowedUserIds: promo.allowedUserIds || [],
      usageLimitPerUser: promo.usageLimitPerUser || 1,
      totalUsageLimit: promo.totalUsageLimit != null ? promo.totalUsageLimit : '',
      expiryDate: promo.expiryDate ? promo.expiryDate.split('T')[0] : '',
      isActive: promo.isActive !== false,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setFormError('Please enter a promo code string.');
      return;
    }
    if (Number(formData.discountValue) <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }
    if (formData.targetAudience === 'SELECTED_USERS' && (!formData.allowedUserIds || formData.allowedUserIds.length === 0)) {
      setFormError('Please select at least one user when choosing "Selected Users".');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const url = editingPromo
        ? `/api/admin/promos/${editingPromo._id}`
        : '/api/admin/promos';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchPromos();
      } else {
        setFormError(data.message || 'Failed to save promo code');
      }
    } catch (err) {
      setFormError(err.message || 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Are you sure you want to delete promo code "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPromos((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert(data.message || 'Failed to delete promo code');
      }
    } catch (err) {
      alert(err.message || 'Error deleting promo');
    }
  };

  const handleToggleActive = async (promo) => {
    try {
      const res = await fetch(`/api/admin/promos/${promo._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setPromos((prev) =>
          prev.map((p) => (p._id === promo._id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (err) {
      console.error('Error toggling promo:', err);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleUserSelection = (userId) => {
    setFormData((prev) => {
      const current = prev.allowedUserIds || [];
      const exists = current.includes(userId);
      return {
        ...prev,
        allowedUserIds: exists
          ? current.filter((id) => id !== userId)
          : [...current, userId],
      };
    });
  };

  const selectAllCandidates = () => {
    const candidateIds = userCandidates.map((u) => u._id);
    setFormData((prev) => ({
      ...prev,
      allowedUserIds: Array.from(new Set([...(prev.allowedUserIds || []), ...candidateIds])),
    }));
  };

  const clearSelectedUsers = () => {
    setFormData((prev) => ({ ...prev, allowedUserIds: [] }));
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={20} color="#FF5E13" />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>Promo Codes & Campaigns</h1>
          </div>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 6, margin: 0 }}>
            Configure discounts for subscription plans and SmartCredits, target new or selected user cohorts, and grant private favors to relatives or VIPs.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: '#FF5E13',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 10,
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(255,94,19,0.25)',
          }}
        >
          <Plus size={18} />
          Create Promo Code
        </button>
      </div>

      {/* Promos Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#9CA3AF' }}>Loading promo codes...</div>
        ) : promos.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Tag size={40} color="#D1D5DB" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>No promo codes created yet</h3>
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
              Click "Create Promo Code" to add your first discount code or relative favor code.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontWeight: 600 }}>
                <th style={{ padding: '14px 20px' }}>CODE & TITLE</th>
                <th style={{ padding: '14px 16px' }}>DISCOUNT</th>
                <th style={{ padding: '14px 16px' }}>SCOPE</th>
                <th style={{ padding: '14px 16px' }}>VISIBILITY</th>
                <th style={{ padding: '14px 16px' }}>AUDIENCE</th>
                <th style={{ padding: '14px 16px' }}>USAGE</th>
                <th style={{ padding: '14px 16px' }}>STATUS</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => {
                const isExpired = promo.expiryDate && new Date(promo.expiryDate) < new Date();
                return (
                  <tr key={promo._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {/* Code & Title */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#111827', background: '#F3F4F6', padding: '3px 8px', borderRadius: 6, letterSpacing: 0.5 }}>
                          {promo.code}
                        </span>
                        <button
                          onClick={() => copyCode(promo.code)}
                          title="Copy code"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2 }}
                        >
                          {copiedCode === promo.code ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                        </button>
                      </div>
                      {promo.title && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{promo.title}</div>}
                    </td>

                    {/* Discount */}
                    <td style={{ padding: '16px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#FF5E13' }}>
                        {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                      </span>
                      {promo.maxDiscountAmount && (
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                          Cap: ₹{promo.maxDiscountAmount}
                        </div>
                      )}
                    </td>

                    {/* Scope */}
                    <td style={{ padding: '16px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: promo.appliesTo === 'ALL' ? '#EFF6FF' : promo.appliesTo === 'SUBSCRIPTION' ? '#F5F3FF' : '#FFFBEB',
                        color: promo.appliesTo === 'ALL' ? '#1D4ED8' : promo.appliesTo === 'SUBSCRIPTION' ? '#6D28D9' : '#B45309',
                      }}>
                        {promo.appliesTo === 'SUBSCRIPTION' && <CreditCard size={12} />}
                        {promo.appliesTo === 'CREDITS' && <Coins size={12} />}
                        {promo.appliesTo === 'ALL' && <Tag size={12} />}
                        {promo.appliesTo}
                      </span>
                    </td>

                    {/* Visibility */}
                    <td style={{ padding: '16px 16px' }}>
                      {promo.visibility === 'PUBLIC' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#059669', fontSize: 12, fontWeight: 600 }}>
                          <Eye size={14} /> Public
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6B7280', fontSize: 12, fontWeight: 600 }}>
                          <EyeOff size={14} /> Hidden (Secret)
                        </span>
                      )}
                    </td>

                    {/* Audience */}
                    <td style={{ padding: '16px 16px' }}>
                      {promo.targetAudience === 'ALL' && (
                        <span style={{ color: '#374151', fontWeight: 500 }}>All Users</span>
                      )}
                      {promo.targetAudience === 'NEW_USERS' && (
                        <span style={{ color: '#2563EB', fontWeight: 600 }}>First-Time Buyers</span>
                      )}
                      {promo.targetAudience === 'SELECTED_USERS' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#7C3AED', fontWeight: 600 }}>
                          <Users size={13} /> {promo.allowedUserIds?.length || 0} Whitelisted
                        </span>
                      )}
                    </td>

                    {/* Usage */}
                    <td style={{ padding: '16px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>
                        {promo.totalUsedCount || 0} {promo.totalUsageLimit ? `/ ${promo.totalUsageLimit}` : 'used'}
                      </div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        Limit: {promo.usageLimitPerUser} per user
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 16px' }}>
                      {isExpired ? (
                        <span style={{ color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: 4, fontSize: 11.5, fontWeight: 600 }}>
                          Expired
                        </span>
                      ) : promo.isActive ? (
                        <button
                          onClick={() => handleToggleActive(promo)}
                          style={{ border: 'none', background: '#DCFCE7', color: '#15803D', padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Active
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(promo)}
                          style={{ border: 'none', background: '#F3F4F6', color: '#6B7280', padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Disabled
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEdit(promo)}
                          title="Edit Promo"
                          style={{ border: '1px solid #E5E7EB', background: '#fff', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#374151' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(promo._id, promo.code)}
                          title="Delete Promo"
                          style={{ border: '1px solid #FEE2E2', background: '#FEF2F2', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#DC2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT PROMO MODAL */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, width: '100%', maxWidth: 740,
            maxHeight: '90vh', overflowY: 'auto', padding: 28, position: 'relative',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
              {editingPromo ? `Edit Promo Code: ${editingPromo.code}` : 'Create New Promo Code'}
            </h2>
            <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 20 }}>
              Configure discount mechanics, audience restrictions, and secret/favor visibility.
            </p>

            {formError && (
              <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} />
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePromo}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    PROMO CODE STRING *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIPFAVOR50"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().trim() })}
                    disabled={!!editingPromo}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: 1 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    INTERNAL TITLE / MEMO
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Favor for Uncle Raj"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13.5 }}
                  />
                </div>
              </div>

              {/* Discount Mechanics */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
                  DISCOUNT SETTINGS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                      DISCOUNT TYPE
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, background: '#fff' }}
                    >
                      <option value="PERCENTAGE">% Percentage Off</option>
                      <option value="FLAT">Flat ₹ INR Off</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                      DISCOUNT VALUE *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g. 50 (for 50%)' : 'e.g. 500'}
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                      MAX CAP (₹) {formData.discountType === 'PERCENTAGE' ? '(Optional)' : '(N/A)'}
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 2000"
                      disabled={formData.discountType === 'FLAT'}
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                    />
                  </div>
                </div>
              </div>

              {/* Scope & Visibility */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    APPLIES TO
                  </label>
                  <select
                    value={formData.appliesTo}
                    onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                  >
                    <option value="ALL">All (Plans & SmartCredits)</option>
                    <option value="SUBSCRIPTION">Subscriptions Only</option>
                    <option value="CREDITS">SmartCredits Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    VISIBILITY (PUBLIC VS HIDDEN FAVOR)
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13.5, background: '#fff' }}
                  >
                    <option value="HIDDEN">🔒 Hidden (Only applied when typed manually — for Relatives / VIPs)</option>
                    <option value="PUBLIC">🌐 Public (Surfaced in mobile app offers carousel)</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  AUDIENCE TARGETING
                </label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  {[
                    { key: 'ALL', label: 'All Users' },
                    { key: 'NEW_USERS', label: 'New Users Only (0 Orders)' },
                    { key: 'SELECTED_USERS', label: 'Selected Users (Cohort Whitelist)' },
                  ].map((aud) => (
                    <button
                      type="button"
                      key={aud.key}
                      onClick={() => setFormData({ ...formData, targetAudience: aud.key })}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: formData.targetAudience === aud.key ? '2px solid #FF5E13' : '1px solid #D1D5DB',
                        background: formData.targetAudience === aud.key ? '#FFF5F0' : '#fff',
                        color: formData.targetAudience === aud.key ? '#FF5E13' : '#4B5563',
                      }}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>

                {/* Cohort Batch & Search Drawer if SELECTED_USERS */}
                {formData.targetAudience === 'SELECTED_USERS' && (
                  <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10, padding: 14, marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>
                        Whitelisted: <span style={{ color: '#FF5E13' }}>{formData.allowedUserIds?.length || 0} users selected</span>
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={selectAllCandidates}
                          style={{ fontSize: 11.5, padding: '4px 8px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', cursor: 'pointer' }}
                        >
                          Select All ({userCandidates.length})
                        </button>
                        <button
                          type="button"
                          onClick={clearSelectedUsers}
                          style={{ fontSize: 11.5, padding: '4px 8px', borderRadius: 6, background: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'pointer' }}
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>

                    {/* Batch Cohort Filter Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 100px 1fr', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #D1D5DB' }}>
                        {[
                          { key: 'top_paying', label: 'Top Paying' },
                          { key: 'newest', label: 'Newest' },
                          { key: 'oldest', label: 'Oldest' },
                        ].map((tab) => (
                          <button
                            type="button"
                            key={tab.key}
                            onClick={() => setCohortFilter(tab.key)}
                            style={{
                              padding: '6px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                              border: 'none',
                              background: cohortFilter === tab.key ? '#FF5E13' : '#fff',
                              color: cohortFilter === tab.key ? '#fff' : '#4B5563',
                              cursor: 'pointer',
                            }}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        min="1"
                        max="200"
                        title="Quantity limit for batch selector"
                        value={cohortLimit}
                        onChange={(e) => setCohortLimit(Number(e.target.value) || 25)}
                        style={{ padding: '6px 8px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, textAlign: 'center' }}
                      />

                      <div style={{ position: 'relative' }}>
                        <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: 9 }} />
                        <input
                          type="text"
                          placeholder="Search user by name, email, phone..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px 6px 30px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12 }}
                        />
                      </div>
                    </div>

                    {/* Candidates Checkbox List */}
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #F3F4F6', borderRadius: 8 }}>
                      {loadingUsers ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>Querying user cohorts...</div>
                      ) : userCandidates.length === 0 ? (
                        <div style={{ padding: 20, textAlign: 'center', color: '#9CA3AF', fontSize: 12 }}>No matching users found.</div>
                      ) : (
                        userCandidates.map((user) => {
                          const isSelected = (formData.allowedUserIds || []).includes(user._id);
                          return (
                            <label
                              key={user._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderBottom: '1px solid #F9FAFB',
                                background: isSelected ? '#FFF8F5' : '#fff',
                                cursor: 'pointer',
                                fontSize: 12,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleUserSelection(user._id)}
                                />
                                <div>
                                  <span style={{ fontWeight: 600, color: '#111827' }}>
                                    {user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'User'}
                                  </span>
                                  <span style={{ color: '#6B7280', marginLeft: 8 }}>
                                    {user.email || user.phone}
                                  </span>
                                </div>
                              </div>
                              {user.totalSpent ? (
                                <span style={{ color: '#059669', fontWeight: 600 }}>
                                  ₹{user.totalSpent.toLocaleString('en-IN')} spent
                                </span>
                              ) : (
                                <span style={{ color: '#9CA3AF', fontSize: 11 }}>
                                  {user.role}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Limits & Expiry */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                    PER-USER LIMIT
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: Number(e.target.value) || 1 })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                    TOTAL REDEMPTION CAP
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={formData.totalUsageLimit}
                    onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#4B5563', marginBottom: 4 }}>
                    EXPIRY DATE
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13 }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: '#4B5563' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#FF5E13',
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Saving...' : editingPromo ? 'Update Promo Code' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
