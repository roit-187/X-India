'use client';

import { useState, useEffect, useCallback } from 'react';

export default function QuickEditManufacturerModal({
  open,
  onClose,
  manufacturer,
  onSaved,
}) {
  const [formData, setFormData] = useState({
    companyName: '',
    companyOwner: '',
    companyEmail: '',
    buyerContactPhone: '',
    whatsappNumber: '',
    businessPhone: '',
    alternatePhone: '',
    website: '',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    manufacturingCategories: [],
    manufacturingDetails: '',
  });

  const [availableCategories, setAvailableCategories] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pre-seed form data when manufacturer changes or modal opens
  const initializeForm = useCallback(() => {
    if (!manufacturer) return;

    const initialCats = Array.isArray(manufacturer.categories)
      ? manufacturer.categories.map((c) => (typeof c === 'object' && c ? (c.slug || c._id) : c))
      : [];

    setFormData({
      companyName: manufacturer.name || '',
      companyOwner: manufacturer.companyOwner || '',
      companyEmail: manufacturer.companyEmail || manufacturer.contact?.email || '',
      buyerContactPhone: manufacturer.buyerContactPhone || manufacturer.contact?.phone || '',
      whatsappNumber: manufacturer.whatsappNumber || manufacturer.contact?.whatsapp || '',
      businessPhone: manufacturer.businessPhone || manufacturer.contact?.phone || '',
      alternatePhone: manufacturer.alternatePhone || manufacturer.contact?.alternatePhone || '',
      website: manufacturer.website || manufacturer.contact?.website || '',
      fullAddress: manufacturer.address || '',
      city: '',
      state: '',
      pincode: '',
      manufacturingCategories: initialCats,
      manufacturingDetails: manufacturer.description || '',
    });
    setErrorMessage('');
    setSuccessMessage('');
  }, [manufacturer]);

  // Load detailed seller data & available categories
  useEffect(() => {
    if (!open || !manufacturer?._id) return;

    initializeForm();
    let isMounted = true;

    async function loadData() {
      setLoadingDetails(true);
      try {
        // Fetch categories and manufacturer details in parallel
        const [catRes, detailRes] = await Promise.allSettled([
          fetch('/api/admin/categories'),
          fetch(`/api/admin/manufacturers/${manufacturer._id}`),
        ]);

        if (!isMounted) return;

        if (catRes.status === 'fulfilled') {
          const catData = await catRes.value.json();
          if (catData.success && Array.isArray(catData.categories)) {
            setAvailableCategories(catData.categories);
          }
        }

        if (detailRes.status === 'fulfilled') {
          const detailData = await detailRes.value.json();
          if (detailData.success && detailData.manufacturer) {
            const m = detailData.manufacturer;
            const seller = detailData.sellerUser || {};

            const resolvedCats = Array.isArray(m.categories)
              ? m.categories.map((c) => (typeof c === 'object' && c ? (c.slug || c._id) : c))
              : [];

            setFormData((prev) => ({
              ...prev,
              companyName: seller.companyName || m.name || prev.companyName,
              companyOwner: seller.companyOwner || m.companyOwner || prev.companyOwner,
              companyEmail: seller.companyEmail || m.companyEmail || m.contact?.email || prev.companyEmail,
              buyerContactPhone: seller.buyerContactPhone || m.buyerContactPhone || m.contact?.phone || prev.buyerContactPhone,
              whatsappNumber: seller.whatsappNumber || m.whatsappNumber || m.contact?.whatsapp || prev.whatsappNumber,
              businessPhone: seller.businessPhone || m.businessPhone || prev.businessPhone,
              alternatePhone: seller.alternatePhone || m.alternatePhone || m.contact?.alternatePhone || prev.alternatePhone,
              website: seller.website || m.contact?.website || prev.website,
              fullAddress: seller.fullAddress || m.address || prev.fullAddress,
              city: seller.location || '',
              state: seller.state || '',
              pincode: seller.pincode || '',
              manufacturingCategories: resolvedCats.length > 0 ? resolvedCats : prev.manufacturingCategories,
              manufacturingDetails: seller.manufacturingDetails || m.description || prev.manufacturingDetails,
            }));
          } else {
            setErrorMessage('Could not load complete profile details. Please retry.');
          }
        } else {
          setErrorMessage('Could not load complete profile details. Please check connection.');
        }
      } catch (err) {
        console.error('[QuickEditManufacturerModal] Error fetching details:', err);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [open, manufacturer?._id, initializeForm]);

  if (!open || !manufacturer) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleCategoryToggle = (targetCat) => {
    const slug = typeof targetCat === 'object' && targetCat ? (targetCat.slug || targetCat._id) : targetCat;
    const catId = typeof targetCat === 'object' && targetCat ? targetCat._id : null;
    setFormData((prev) => {
      const exists = prev.manufacturingCategories.some((s) => s === slug || (catId && s === catId));
      const updated = exists
        ? prev.manufacturingCategories.filter((s) => s !== slug && (!catId || s !== catId))
        : [...prev.manufacturingCategories, slug];
      return { ...prev, manufacturingCategories: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loadingDetails) return;
    if (!formData.companyName.trim()) {
      setErrorMessage('Company Name is required.');
      return;
    }

    if (formData.companyEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.companyEmail.trim())) {
        setErrorMessage('Please enter a valid official email address.');
        return;
      }
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Scoped operational fields only — strictly avoids banking/GSTIN/financial turnover
      const payload = {
        companyName: formData.companyName.trim(),
        companyOwner: formData.companyOwner.trim(),
        companyEmail: formData.companyEmail.trim(),
        buyerContactPhone: formData.buyerContactPhone.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        businessPhone: formData.businessPhone.trim(),
        alternatePhone: formData.alternatePhone.trim(),
        website: formData.website.trim(),
        fullAddress: formData.fullAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        manufacturingCategories: formData.manufacturingCategories,
        manufacturingDetails: formData.manufacturingDetails.trim(),
      };

      const res = await fetch(`/api/admin/manufacturers/${manufacturer._id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to update manufacturer profile.');
      }

      setSuccessMessage('Manufacturer profile updated successfully!');
      if (onSaved) {
        onSaved(resData.manufacturer || { ...manufacturer, ...payload, name: payload.companyName });
      }

      // Close modal smoothly after brief feedback
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('[QuickEditManufacturerModal] Save error:', err);
      setErrorMessage(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="admin-modal-overlay"
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="admin-modal"
        style={{
          width: '680px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
              Quick Edit Manufacturer
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
              Updating profile for <strong style={{ color: '#2563EB' }}>{manufacturer.name}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              lineHeight: 1,
              cursor: 'pointer',
              color: '#94A3B8',
              padding: '4px 8px',
              borderRadius: 6,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px 24px',
            flex: 1,
            gap: 16,
          }}
        >
          {/* Status Banners */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #86EFAC',
                color: '#166534',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          {loadingDetails && (
            <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔄 Loading complete directory profile...</span>
            </div>
          )}

          {/* Section 1: Business Identity */}
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Business Identity
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Company Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder="e.g. Acme Precision Tools Pvt Ltd"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Owner / CEO / Director Name
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.companyOwner}
                  onChange={(e) => handleChange('companyOwner', e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Company Website / URL
                </label>
                <input
                  type="url"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="e.g. https://www.acmeprecision.com"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact Numbers & Email */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact Channels
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Buyer Contact Phone (Primary)
                </label>
                <input
                  type="tel"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.buyerContactPhone}
                  onChange={(e) => handleChange('buyerContactPhone', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  WhatsApp Business Number
                </label>
                <input
                  type="tel"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.whatsappNumber}
                  onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Official Company Email
                </label>
                <input
                  type="email"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.companyEmail}
                  onChange={(e) => handleChange('companyEmail', e.target.value)}
                  placeholder="e.g. sales@acmeprecision.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Landline / Office Phone
                </label>
                <input
                  type="tel"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.businessPhone}
                  onChange={(e) => handleChange('businessPhone', e.target.value)}
                  placeholder="e.g. 022-28475900"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Alternate Phone / Secondary Contact
                </label>
                <input
                  type="tel"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.alternatePhone}
                  onChange={(e) => handleChange('alternatePhone', e.target.value)}
                  placeholder="e.g. +91 98220 12345"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Factory Address & Location */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Factory Location
            </h4>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                Factory / Plant Address
              </label>
              <input
                type="text"
                className="admin-input"
                style={{ width: '100%' }}
                value={formData.fullAddress}
                onChange={(e) => handleChange('fullAddress', e.target.value)}
                placeholder="Plot No. 42, MIDC Industrial Area, Phase II"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  City
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  State
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  Pincode
                </label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="e.g. 411018"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Industry Categories */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Manufacturing Categories
            </h4>
            {availableCategories.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxHeight: 130, overflowY: 'auto', padding: 4 }}>
                {availableCategories.map((cat) => {
                  const isSelected = formData.manufacturingCategories.includes(cat.slug) || formData.manufacturingCategories.includes(cat._id);
                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 16,
                        fontSize: 12,
                        fontWeight: 500,
                        border: isSelected ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                        color: isSelected ? '#1D4ED8' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}{cat.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Categories loading...</p>
            )}
          </div>

          {/* Section 5: Tagline & Factory Overview */}
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Factory Description & Capabilities
            </h4>
            <textarea
              className="admin-input"
              style={{ width: '100%', minHeight: 70, resize: 'vertical' }}
              value={formData.manufacturingDetails}
              onChange={(e) => handleChange('manufacturingDetails', e.target.value)}
              placeholder="Brief summary of manufacturing capabilities, specialized machinery, or core product lines..."
            />
          </div>

          {/* Security Notice */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>🔒</span>
            <span>
              <strong>Sensitive Data Guard:</strong> Bank account credentials, GSTIN/PAN legal status, and annual turnover metrics are isolated to the Super Admin 360° detail page for governance and fraud prevention.
            </span>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              paddingTop: 12,
              borderTop: '1px solid #E2E8F0',
              marginTop: 6,
            }}
          >
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onClose}
              disabled={saving}
              style={{ padding: '8px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={saving || loadingDetails}
              style={{ padding: '8px 20px', minWidth: 120 }}
            >
              {saving ? 'Saving Changes...' : (loadingDetails ? 'Loading Details...' : 'Save Profile')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
