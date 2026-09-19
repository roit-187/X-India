'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  AlertCircle,
  Ban,
  ExternalLink,
  Package,
  Briefcase,
  Video,
  Eye,
  Calendar,
  Lock,
  Unlock,
  IndianRupee,
} from 'lucide-react';
import Badge from './Badge';
import YouTubePlayer from '@/components/common/YouTubePlayer';

export default function SellerDetailModal({
  open,
  onClose,
  manufacturerId,
  onStatusChanged,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | gst | factory | products | controls
  const [error, setError] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockMode, setBlockMode] = useState('blacklist'); // blacklist | temporary
  const [blockDays, setBlockDays] = useState(30);

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  useEffect(() => {
    if (!open || !manufacturerId) {
      setData(null);
      return;
    }
    let isMounted = true;
    setLoading(true);
    setError('');

    fetch(`/api/admin/manufacturers/${manufacturerId}`)
      .then((res) => res.json())
      .then((res) => {
        if (!isMounted) return;
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || 'Failed to load seller details');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Network error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [open, manufacturerId]);

  if (!open) return null;

  const mfr = data?.manufacturer;
  const seller = data?.sellerUser;
  const products = data?.products || [];
  const opportunities = data?.opportunities || [];
  const stats = data?.stats || {};
  const isDeactivated = mfr?.isActive === false;
  const isBlocked = mfr?.isBlacklisted || (mfr?.blockedUntil && new Date(mfr.blockedUntil) > new Date());

  const handleToggleActive = async (newActiveState) => {
    if (!mfr?._id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/manufacturers/${mfr._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActiveState, reason: deactivateReason }),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowDeactivateConfirm(false);
        setDeactivateReason('');
        // Reload details
        const refreshed = await fetch(`/api/admin/manufacturers/${mfr._id}`).then((r) => r.json());
        if (refreshed.success) setData(refreshed);
        if (onStatusChanged) onStatusChanged();
      } else {
        alert(resData.message || 'Action failed');
      }
    } catch (e) {
      alert('Error updating status: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockAccount = async () => {
    if (!mfr?._id) return;
    setActionLoading(true);
    try {
      const payload =
        blockMode === 'temporary'
          ? { mode: 'temporary', days: Number(blockDays), reason: blockReason }
          : { mode: 'blacklist', reason: blockReason };

      const res = await fetch(`/api/admin/manufacturers/${mfr._id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowBlockConfirm(false);
        setBlockReason('');
        const refreshed = await fetch(`/api/admin/manufacturers/${mfr._id}`).then((r) => r.json());
        if (refreshed.success) setData(refreshed);
        if (onStatusChanged) onStatusChanged();
      } else {
        alert(resData.message || 'Block failed');
      }
    } catch (e) {
      alert('Error blocking account: ' + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockAccount = async () => {
    if (!mfr?._id) return;
    if (!confirm('Are you sure you want to unblock this account?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/manufacturers/${mfr._id}/unblock`, {
        method: 'POST',
      });
      const resData = await res.json();
      if (resData.success) {
        const refreshed = await fetch(`/api/admin/manufacturers/${mfr._id}`).then((r) => r.json());
        if (refreshed.success) setData(refreshed);
        if (onStatusChanged) onStatusChanged();
      } else {
        alert(resData.message || 'Unblock failed');
      }
    } catch (e) {
      alert('Error unblocking: ' + e.message);
    } finally {
      setActionLoading(false);
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
          width: '960px',
          maxWidth: '96vw',
          maxHeight: '92vh',
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
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: 18,
                border: '1px solid #DBEAFE',
              }}
            >
              {mfr?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mfr.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
              ) : (
                <Building2 size={22} />
              )}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0F172A' }}>
                  {mfr?.name || 'Seller Details'}
                </h2>
                {mfr?.verified && <Badge label="Physically Verified" variant="verified" />}
                {(seller?.gstVerified || mfr?.gstVerified) && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: '#DCFCE7',
                      color: '#15803D',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={12} /> GST Verified
                  </span>
                )}
                {isDeactivated && <Badge label="Deactivated" variant="deactivated" />}
                {isBlocked && <Badge label="Blocked / Suspended" variant="blacklisted" />}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {seller?.email || mfr?.contactEmail || 'No email'} &middot; {seller?.phone || mfr?.contactPhone || 'No phone'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            padding: '0 24px',
            gap: 24,
          }}
        >
          {[
            { id: 'overview', label: 'Overview & Contact', icon: Building2 },
            { id: 'gst', label: 'GST & Business Docs', icon: FileText },
            { id: 'factory', label: 'Factory & Media', icon: Video },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'opportunities', label: `Posts (${opportunities.length})`, icon: Briefcase },
            { id: 'controls', label: 'Account Security & Actions', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
                  padding: '12px 0',
                  color: active ? '#2563EB' : '#64748B',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#F8FAFC' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Loading comprehensive seller profile...</div>
            </div>
          )}

          {error && (
            <div style={{ padding: 16, backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: 8, fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {/* TAB 1: Overview & Contact */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {/* Basic Company Info */}
                    <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={16} color="#2563EB" /> Company Information
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div><span style={{ color: '#64748B' }}>Company Name:</span> <strong>{mfr?.name || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Company Owner:</span> <strong>{mfr?.companyOwner || seller?.firstName + ' ' + (seller?.lastName || '') || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Business Type:</span> <strong>{mfr?.businessType || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Legal Status:</span> <strong>{mfr?.legalStatus || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Industry / Category:</span> <strong>{mfr?.industry || mfr?.category || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Year Established:</span> <strong>{mfr?.yearOfEstablishment || '-'}</strong></div>
                      </div>
                    </div>

                    {/* Direct Contact Info */}
                    <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={16} color="#16A34A" /> Direct Contact Details
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div><span style={{ color: '#64748B' }}>Registered Email:</span> <strong>{seller?.email || mfr?.contactEmail || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Primary Phone:</span> <strong>{seller?.phone || mfr?.contactPhone || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Business Phone:</span> <strong>{seller?.businessPhone || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>WhatsApp:</span> <strong>{seller?.whatsappNumber || mfr?.whatsappNumber || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Buyer Contact Phone:</span> <strong>{seller?.buyerContactPhone || '-'}</strong></div>
                      </div>
                    </div>

                    {/* Location & Address */}
                    <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <MapPin size={16} color="#DC2626" /> Registered Address
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                        <div><span style={{ color: '#64748B' }}>Address:</span> <strong>{mfr?.address || seller?.fullAddress || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>City / State:</span> <strong>{mfr?.city || seller?.location || '-'}, {mfr?.state || seller?.state || '-'}</strong></div>
                        <div><span style={{ color: '#64748B' }}>Pincode:</span> <strong>{mfr?.pincode || seller?.pincode || '-'}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Descriptions */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>About the Company</h4>
                    <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                      {mfr?.description || mfr?.portfolioAbout || 'No description entered by seller yet.'}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: GST & Business Documents */}
              {activeTab === 'gst' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* GSTIN Card */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileText size={20} color="#2563EB" />
                        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                          GSTIN Tax Identification
                        </h4>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 12,
                          background: seller?.gstVerified ? '#DCFCE7' : '#FEF3C7',
                          color: seller?.gstVerified ? '#15803D' : '#B45309',
                        }}
                      >
                        {seller?.gstVerified ? 'GST ALGORITHM VERIFIED' : 'UNVERIFIED / SKIPPED'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 13 }}>
                      <div>
                        <span style={{ color: '#64748B' }}>GST Number (Full):</span>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: 1, marginTop: 2 }}>
                          {seller?.gstNumber || mfr?.gstNumber || 'Not provided'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Legal Name:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{seller?.gstLegalName || '-'}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Trade Name:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{seller?.gstTradeName || '-'}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B' }}>Business Entity Type:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{seller?.gstBusinessType || '-'}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ color: '#64748B' }}>Taxpayer Registered Address:</span>
                        <div style={{ fontWeight: 600, color: '#0F172A', marginTop: 2 }}>{seller?.gstAddress || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Business Documents Showcase */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      Uploaded Business Documents & Certificates
                    </h4>

                    {(!seller?.businessDocuments || Object.keys(seller.businessDocuments).length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#94A3B8', fontSize: 13 }}>
                        No business documents uploaded yet.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                        {Object.entries(seller.businessDocuments).map(([docKey, docData]) => {
                          if (!docData || !docData.fileUrl) return null;
                          return (
                            <div
                              key={docKey}
                              style={{
                                border: '1px solid #CBD5E1',
                                borderRadius: 10,
                                padding: 14,
                                backgroundColor: '#F8FAFC',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: 10,
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#1E293B' }}>
                                    {docKey === 'gst' ? 'GST Registration (REG-06)' : docKey.toUpperCase()}
                                  </span>
                                  <Badge
                                    label={docData.status || 'pending'}
                                    variant={docData.status === 'verified' ? 'verified' : docData.status === 'rejected' ? 'expired' : 'active'}
                                  />
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                                  Uploaded: {docData.uploadedAt ? new Date(docData.uploadedAt).toLocaleDateString('en-IN') : '-'}
                                </div>
                              </div>

                              <a
                                href={docData.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="admin-btn admin-btn-secondary"
                                style={{
                                  fontSize: 12,
                                  textDecoration: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '6px 12px',
                                }}
                              >
                                <ExternalLink size={14} /> Open / Download Document
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Factory & Media */}
              {activeTab === 'factory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* YouTube Factory Tour Video */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Video size={18} color="#DC2626" /> Factory Tour Video
                    </h4>
                    {mfr?.factoryVideo ? (
                      <div>
                        <div style={{ maxWidth: 540, marginBottom: 10 }}>
                          <YouTubePlayer videoUrl={mfr.factoryVideo} title={`${mfr?.name} Factory Tour`} />
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          Source URL: <a href={mfr.factoryVideo} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{mfr.factoryVideo}</a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#94A3B8', fontSize: 13, padding: '16px 0' }}>No factory tour video provided.</div>
                    )}
                  </div>

                  {/* Factory Specs */}
                  <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      Factory Specifications & Capacity
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
                      <div><span style={{ color: '#64748B' }}>Factory Size:</span> <strong>{mfr?.factorySize || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Machines Count:</span> <strong>{mfr?.machinesCount || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Employees:</span> <strong>{mfr?.employeesCount || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Monthly Capacity:</span> <strong>{mfr?.monthlyCapacity || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Annual Turnover:</span> <strong>{mfr?.annualTurnover || '-'}</strong></div>
                      <div><span style={{ color: '#64748B' }}>Export %:</span> <strong>{mfr?.exportPercentage ? `${mfr.exportPercentage}%` : '-'}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Products */}
              {activeTab === 'products' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      Uploaded Products ({products.length})
                    </h4>
                  </div>
                  {products.length === 0 ? (
                    <div style={{ backgroundColor: '#FFFFFF', padding: 40, textAlign: 'center', color: '#94A3B8', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      No products uploaded by this seller yet.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                      {products.map((p) => (
                        <div
                          key={p._id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div style={{ height: 140, backgroundColor: '#F1F5F9', position: 'relative' }}>
                            {p.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8' }}>
                                <Package size={32} />
                              </div>
                            )}
                          </div>
                          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <strong style={{ fontSize: 14, color: '#0F172A' }}>{p.name}</strong>
                            <div style={{ fontSize: 12, color: '#64748B' }}>Category: {p.category || '-'}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', marginTop: 4 }}>
                              ₹{p.price || 0} {p.moq ? `(MOQ: ${p.moq})` : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Opportunities / Posts */}
              {activeTab === 'opportunities' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                    Created Opportunities & Requirements ({opportunities.length})
                  </h4>
                  {opportunities.length === 0 ? (
                    <div style={{ backgroundColor: '#FFFFFF', padding: 40, textAlign: 'center', color: '#94A3B8', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                      No opportunities or posts created by this seller.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {opportunities.map((opp) => (
                        <div
                          key={opp._id}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 12,
                            padding: 16,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: 14, color: '#0F172A' }}>{opp.title}</strong>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                              {opp.category || 'General'} &middot; Budget: ₹{opp.budget || 0} &middot; {opp.location || 'India'}
                            </div>
                          </div>
                          <Badge label={opp.status || 'open'} variant={opp.status === 'completed' ? 'verified' : 'active'} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: Account Security & Actions */}
              {activeTab === 'controls' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <h4 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                      Account Status & Enforcement Controls
                    </h4>
                    <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      Deactivating or blocking an account cuts off access to the mobile app and web features.
                      Whenever a blocked or deactivated user attempts to use the app, a pop-up appears notifying them
                      to contact customer support.
                    </p>

                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {/* Deactivate / Reactivate */}
                      {isDeactivated ? (
                        <button
                          className="admin-btn admin-btn-primary"
                          disabled={actionLoading}
                          onClick={() => handleToggleActive(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Unlock size={16} /> Reactivate Account
                        </button>
                      ) : (
                        <button
                          className="admin-btn admin-btn-secondary"
                          disabled={actionLoading}
                          onClick={() => setShowDeactivateConfirm(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#DC2626', borderColor: '#FCA5A5' }}
                        >
                          <Lock size={16} /> Deactivate Account
                        </button>
                      )}

                      {/* Block / Unblock */}
                      {isBlocked ? (
                        <button
                          className="admin-btn admin-btn-primary"
                          disabled={actionLoading}
                          onClick={handleUnblockAccount}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <CheckCircle2 size={16} /> Unblock Account
                        </button>
                      ) : (
                        <button
                          className="admin-btn admin-btn-danger"
                          disabled={actionLoading}
                          onClick={() => setShowBlockConfirm(true)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Ban size={16} /> Block Account Completely
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Deactivate Reason Box */}
                  {showDeactivateConfirm && (
                    <div style={{ backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, border: '1px solid #FDE68A' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: '#92400E' }}>
                        Confirm Account Deactivation
                      </h5>
                      <p style={{ margin: '0 0 10px 0', fontSize: 13, color: '#78350F' }}>
                        This user will be logged out and cannot access marketplace features until manually reactivated.
                      </p>
                      <input
                        className="admin-input"
                        placeholder="Reason for deactivation (internal audit)..."
                        value={deactivateReason}
                        onChange={(e) => setDeactivateReason(e.target.value)}
                        style={{ width: '100%', marginBottom: 12 }}
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeactivateConfirm(false)}>
                          Cancel
                        </button>
                        <button className="admin-btn admin-btn-danger" onClick={() => handleToggleActive(false)}>
                          Confirm Deactivate
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Block Reason Box */}
                  {showBlockConfirm && (
                    <div style={{ backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, border: '1px solid #FECACA' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: '#991B1B' }}>
                        Confirm Account Block / Blacklist
                      </h5>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="radio"
                            name="blockMode"
                            checked={blockMode === 'blacklist'}
                            onChange={() => setBlockMode('blacklist')}
                          />
                          Permanent Blacklist
                        </label>
                        <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="radio"
                            name="blockMode"
                            checked={blockMode === 'temporary'}
                            onChange={() => setBlockMode('temporary')}
                          />
                          Temporary Block (Days)
                        </label>
                      </div>

                      {blockMode === 'temporary' && (
                        <div style={{ marginBottom: 10 }}>
                          <input
                            type="number"
                            className="admin-input"
                            value={blockDays}
                            onChange={(e) => setBlockDays(e.target.value)}
                            min={1}
                            max={365}
                            style={{ width: 120 }}
                          />
                          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>days</span>
                        </div>
                      )}

                      <input
                        className="admin-input"
                        placeholder="Mandatory reason for blocking..."
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        style={{ width: '100%', marginBottom: 12 }}
                        required
                      />
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button className="admin-btn admin-btn-secondary" onClick={() => setShowBlockConfirm(false)}>
                          Cancel
                        </button>
                        <button
                          className="admin-btn admin-btn-danger"
                          disabled={!blockReason.trim()}
                          onClick={handleBlockAccount}
                        >
                          Confirm Block
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#FFFFFF',
          }}
        >
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
