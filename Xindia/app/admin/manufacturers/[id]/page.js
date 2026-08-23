'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit3, Building2, Phone, MapPin, Factory, Landmark, ShieldCheck, Check, X, FileText } from 'lucide-react';
import Badge from '@/components/admin/Badge';
import Toggle from '@/components/admin/Toggle';
import Modal from '@/components/admin/Modal';

export default function ManufacturerDetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [pendingDeactivate, setPendingDeactivate] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockMode, setBlockMode] = useState('temporary');
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');

  // Profile Editor Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTab, setEditTab] = useState('identity'); // 'identity' | 'contact' | 'factory' | 'bank'
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    companyName: '',
    companyOwner: '',
    businessType: 'Manufacturer',
    legalStatus: '',
    yearOfEstablishment: '',
    gstNumber: '',
    industry: '',
    manufacturingDetails: '',
    companyEmail: '',
    buyerContactPhone: '',
    businessPhone: '',
    whatsappNumber: '',
    fullAddress: '',
    city: '',
    state: '',
    pincode: '',
    aboutFactory: '',
    factorySize: '',
    machinesCount: '',
    employeesCount: '',
    monthlyCapacity: '',
    annualTurnover: '',
    exportPercentage: '',
    marketCovered: '',
    factoryVideo: '',
    introVideo: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
    },
  });

  // Document Reject Modal State
  const [rejectDocModal, setRejectDocModal] = useState(null); // { docType, label, rejectionReason: '' }

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [mfrRes, reviewsRes] = await Promise.all([
        fetch(`/api/admin/manufacturers/${id}`),
        fetch(`/api/admin/reviews?targetId=${id}`),
      ]);
      const result = await mfrRes.json();
      const reviewsResult = await reviewsRes.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.message || 'Failed to load manufacturer detail');
      }

      if (reviewsResult.success) {
        setReviews(reviewsResult.reviews || []);
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleVerified = async (nextVal) => {
    await fetch(`/api/admin/manufacturers/${id}/verified`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: nextVal }),
    });
    loadData();
  };

  const handleToggleActive = async (nextVal) => {
    if (!nextVal) {
      setPendingDeactivate(true);
      return;
    }
    await fetch(`/api/admin/manufacturers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true, reason: '' }),
    });
    loadData();
  };

  const applyDeactivation = async () => {
    await fetch(`/api/admin/manufacturers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false, reason: deactivateReason }),
    });
    setPendingDeactivate(false);
    setDeactivateReason('');
    loadData();
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockReason.trim()) return;
    const payload = blockMode === 'temporary'
      ? { mode: 'temporary', days: Number(blockDays), reason: blockReason }
      : { mode: 'blacklist', reason: blockReason };
    const res = await fetch(`/api/admin/manufacturers/${id}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to block seller');
    } else {
      setShowBlockModal(false);
      setBlockReason('');
      loadData();
    }
  };

  const handleUnblock = async () => {
    const res = await fetch(`/api/admin/manufacturers/${id}/unblock`, { method: 'PATCH' });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to unblock seller');
    } else {
      loadData();
    }
  };

  const handleToggleProductVisibility = async (productId, currentIsActive) => {
    const res = await fetch(`/api/admin/manufacturers/${id}/products/${productId}/visibility`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentIsActive }),
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to toggle product visibility');
    } else {
      loadData();
    }
  };

  const handleOpenEditModal = () => {
    const m = data?.manufacturer || {};
    const seller = data?.sellerUser || {};
    setEditForm({
      companyName: seller.companyName || m.name || '',
      companyOwner: seller.companyOwner || m.companyOwner || '',
      businessType: seller.businessType || m.businessType || 'Manufacturer',
      legalStatus: seller.legalStatus || m.legalStatus || '',
      yearOfEstablishment: seller.yearOfEstablishment ? String(seller.yearOfEstablishment) : (m.yearOfEstablishment ? String(m.yearOfEstablishment) : ''),
      gstNumber: seller.gstNumber || m.gstNumber || '',
      industry: seller.industry || m.industry || '',
      manufacturingDetails: seller.manufacturingDetails || m.description || '',
      
      companyEmail: seller.companyEmail || m.contact?.email || seller.email || '',
      buyerContactPhone: seller.buyerContactPhone || m.buyerContactPhone || m.contact?.phone || '',
      businessPhone: seller.businessPhone || m.businessPhone || seller.phone || '',
      whatsappNumber: seller.whatsappNumber || m.whatsappNumber || '',
      
      fullAddress: seller.fullAddress || m.address || '',
      city: seller.location || '',
      state: seller.state || '',
      pincode: seller.pincode || '',
      
      aboutFactory: seller.aboutFactory || m.aboutFactory || '',
      factorySize: seller.factorySize || m.factorySize || '',
      machinesCount: seller.machinesCount !== undefined ? String(seller.machinesCount) : (m.machinesCount !== undefined ? String(m.machinesCount) : ''),
      employeesCount: seller.employeesCount !== undefined ? String(seller.employeesCount) : (m.employeesCount !== undefined ? String(m.employeesCount) : ''),
      monthlyCapacity: seller.monthlyCapacity || m.monthlyCapacity || '',
      annualTurnover: seller.annualTurnover || m.annualTurnover || '',
      exportPercentage: seller.exportPercentage || m.exportPercentage || '',
      marketCovered: seller.marketCovered || m.marketCovered || '',
      factoryVideo: seller.factoryVideo || m.factoryVideo || '',
      introVideo: seller.introVideo || m.introVideo || '',
      
      bankDetails: {
        accountName: seller.bankDetails?.accountName || '',
        accountNumber: seller.bankDetails?.accountNumber || '',
        ifscCode: seller.bankDetails?.ifscCode || '',
        bankName: seller.bankDetails?.bankName || '',
        branchName: seller.bankDetails?.branchName || '',
      },
    });
    setEditTab('identity');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/manufacturers/${id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const resData = await res.json();
      if (resData.success) {
        setShowEditModal(false);
        alert(resData.message || 'Seller profile updated successfully!');
        loadData();
      } else {
        alert(resData.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving profile');
    } finally {
      setEditSaving(false);
    }
  };

  const handleApproveDocument = async (docType) => {
    const res = await fetch(`/api/admin/manufacturers/${id}/documents/${docType}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve' }),
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to approve document');
    } else {
      loadData();
    }
  };

  const handleConfirmRejectDocument = async (e) => {
    e.preventDefault();
    if (!rejectDocModal) return;
    const res = await fetch(`/api/admin/manufacturers/${id}/documents/${rejectDocModal.docType}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', rejectionReason: rejectDocModal.rejectionReason }),
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to reject document');
    } else {
      setRejectDocModal(null);
      loadData();
    }
  };

  const handleToggleReviewStatus = async (reviewId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'inactive' : 'approved';
    const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to update review status');
    } else {
      loadData();
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to delete review');
    } else {
      loadData();
    }
  };

  const handleBlacklistReviewer = async (userId) => {
    if (!confirm('Blacklist this user? This will hide all their reviews and revoke their access.')) return;
    const res = await fetch(`/api/admin/users/${userId}/blacklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Spam or malicious review' }),
    });
    const resData = await res.json();
    if (!resData.success) {
      alert(resData.message || 'Failed to blacklist user');
    } else {
      loadData();
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    const res = await fetch(`/api/admin/manufacturers/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: noteText }),
    });
    const resData = await res.json();
    if (resData.success) {
      setNoteText('');
      loadData();
    } else {
      alert(resData.message || 'Failed to add note');
    }
  };

  const formatINR = (amount) => {
    if (amount == null || isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  if (loading) return <p>Loading manufacturer details...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data || !data.manufacturer) return <p>Manufacturer not found</p>;

  const m = data.manufacturer;
  const products = data.products || [];
  const stats = data.stats || {};
  const planHistory = data.planHistory || [];
  const creditHistory = data.creditHistory || [];
  const seller = data.sellerUser;

  // Compute total lifetime spend
  const planTotal = planHistory.reduce((sum, ph) => sum + (Number(ph.amount) || 0), 0);
  const creditTotal = creditHistory.reduce((sum, ch) => sum + (Number(ch.amount) || 0), 0);
  const totalSpend = planTotal + creditTotal;

  return (
    <div style={{ maxWidth: 1100 }}>
      <Link
        href="/admin/manufacturers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#475569', textDecoration: 'none' }}
      >
        <ArrowLeft size={16} />
        Back to Manufacturers
      </Link>

      {/* Cover Image Banner */}
      {m.coverImage && (
        <div style={{ width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <img src={m.coverImage} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Header Profile Banner */}
      <div className="admin-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {m.logo ? (
              <img src={m.logo} alt={m.name} style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 8, background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, color: '#64748B' }}>
                {m.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 style={{ margin: 0, fontSize: 24 }}>{m.name}</h1>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{m.address}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Active Account:</span>
              <Toggle checked={m.isActive} onChange={handleToggleActive} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Verified Badge:</span>
              <Toggle checked={m.verified} onChange={handleToggleVerified} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="admin-btn admin-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                onClick={handleOpenEditModal}
              >
                <Edit3 size={14} />
                Edit Profile
              </button>
              {seller && (seller.isBlacklisted || (seller.blockedUntil && new Date(seller.blockedUntil) > new Date())) ? (
                <button className="admin-btn admin-btn-secondary" onClick={handleUnblock}>Unblock Seller</button>
              ) : (
                <button className="admin-btn admin-btn-danger" onClick={() => setShowBlockModal(true)}>Block Seller</button>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {seller?.isBlacklisted && <Badge label="Blacklisted" variant="blacklisted" />}
          {seller?.blockedUntil && !seller.isBlacklisted && new Date(seller.blockedUntil) > new Date() && (
            <Badge label={`Blocked until ${new Date(seller.blockedUntil).toLocaleDateString()}`} variant="blocked" />
          )}
          <Badge label={`Plan: ${m.planStatus}`} variant={m.planStatus} />
          {m.verified && <Badge label="Verified" variant="verified" />}
          <Badge label={`Portfolio: ${m.portfolioStatus}`} variant={m.portfolioStatus} />
          {m.planKey && <Badge label={`Tier: ${m.planKey}`} variant="none" />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left main content column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Business Details */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Business Details</h3>
              <button
                className="admin-btn admin-btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 10px' }}
                onClick={handleOpenEditModal}
              >
                <Edit3 size={13} />
                Edit Profile
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
              <div><strong>Business Type:</strong> {m.businessType || '-'}</div>
              <div><strong>Legal Status:</strong> {m.legalStatus || '-'}</div>
              <div><strong>Year Established:</strong> {m.yearOfEstablishment || '-'}</div>
              <div><strong>Factory Size:</strong> {m.factorySize || '-'}</div>
              <div><strong>Employees:</strong> {m.employeesCount || '-'}</div>
              <div><strong>Machines Count:</strong> {m.machinesCount || '-'}</div>
              <div><strong>Monthly Capacity:</strong> {m.monthlyCapacity || '-'}</div>
              <div><strong>Export Percentage:</strong> {m.exportPercentage || '-'}</div>
            </div>

            <h4 style={{ marginTop: 20, marginBottom: 8 }}>Contact Info</h4>
            <div style={{ fontSize: 14 }}>
              <div>Phone: {m.contact?.phone || '-'} | Buyer Phone: {m.buyerContactPhone || '-'}</div>
              <div>Email: {m.contact?.email || '-'}</div>
            </div>

            {m.portfolioAbout && (
              <>
                <h4 style={{ marginTop: 20, marginBottom: 8 }}>About Business</h4>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{m.portfolioAbout}</p>
              </>
            )}

            {/* Certifications */}
            {m.certifications && m.certifications.length > 0 && (
              <>
                <h4 style={{ marginTop: 20, marginBottom: 8 }}>Certifications</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {m.certifications.map((cert, idx) => (
                    <span key={idx} style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      {cert}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Seller Account Details */}
          {seller && (
            <div className="admin-card">
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Seller Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 20 }}>
                <div><strong>Full Name:</strong> {seller.firstName} {seller.lastName || ''}</div>
                <div><strong>Account Email:</strong> {seller.email || '-'}</div>
                <div><strong>Account Phone:</strong> {seller.phone || '-'}</div>
                <div><strong>Business Phone:</strong> {seller.businessPhone || '-'}</div>
                <div><strong>Buyer Contact Phone:</strong> {seller.buyerContactPhone || '-'}</div>
                <div><strong>WhatsApp Number:</strong> {seller.whatsappNumber || '-'}</div>
                <div><strong>Registered Location:</strong> {seller.location || '-'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Full Address:</strong> {seller.fullAddress || '-'}</div>
                <div><strong>State:</strong> {seller.state || '-'}</div>
                <div><strong>Pincode:</strong> {seller.pincode || '-'}</div>
              </div>

              <h4 style={{ marginTop: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                GST Details
                <Badge label={seller.gstVerified ? 'Verified' : 'Unverified'} variant={seller.gstVerified ? 'verified' : 'expired'} />
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14, marginBottom: 20 }}>
                <div><strong>GSTIN:</strong> {seller.gstNumber || '-'}</div>
                <div><strong>Registration Date:</strong> {seller.gstRegistrationDate || '-'}</div>
                <div><strong>Legal Name:</strong> {seller.gstLegalName || '-'}</div>
                <div><strong>Trade Name:</strong> {seller.gstTradeName || '-'}</div>
                <div><strong>Business Type:</strong> {seller.gstBusinessType || '-'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>GST Address:</strong> {seller.gstAddress || '-'}</div>
              </div>

              {/* Uploaded Business Documents Hub */}
              <h4 style={{ marginTop: 24, marginBottom: 12, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                Uploaded Business Documents
              </h4>
              {seller.businessDocuments && Object.keys(seller.businessDocuments).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(seller.businessDocuments).map(([docType, doc]) => (
                    <div
                      key={docType}
                      style={{
                        background: '#F8FAFC', borderRadius: 10, padding: '12px 16px',
                        border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ textTransform: 'uppercase', fontSize: 13 }}>{docType} Document</strong>
                          <Badge
                            label={doc.status || 'pending'}
                            variant={doc.status === 'verified' ? 'verified' : doc.status === 'rejected' ? 'blacklisted' : 'expired'}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                          {doc.documentNumber && <span>Doc No: {doc.documentNumber} | </span>}
                          {doc.documentName && <span>Name: {doc.documentName} | </span>}
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', fontWeight: 600 }}>
                              View File ↗
                            </a>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {doc.status !== 'verified' && (
                          <button
                            onClick={() => handleApproveDocument(docType)}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none',
                              background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                        )}
                        {doc.status !== 'rejected' && (
                          <button
                            onClick={() => setRejectDocModal({ docType, label: `${docType.toUpperCase()} Certificate`, rejectionReason: '' })}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none',
                              background: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>No business documents uploaded yet</p>
              )}
            </div>
          )}

          {/* Factory Photos Gallery */}
          {m.manufacturingPlants && m.manufacturingPlants.length > 0 && (
            <div className="admin-card">
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Factory Photos ({m.manufacturingPlants.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {m.manufacturingPlants.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={url}
                      alt={`Factory photo ${idx + 1}`}
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8, cursor: 'pointer', transition: 'opacity 0.15s' }}
                      onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
                      onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Products ({products.length})</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Visible</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.category}</td>
                    <td><Badge label={p.status || 'active'} variant={p.isActive ? 'active' : 'expired'} /></td>
                    <td>
                      <Toggle checked={p.isActive} onChange={() => handleToggleProductVisibility(p._id, p.isActive)} />
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8' }}>No products created</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Seller Reviews & Feedback Moderation Hub */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Reviews & Buyer Feedback ({reviews.length})</h3>
              <div style={{ fontSize: 13, color: '#64748B' }}>
                Average: <strong>{m.rating || 0} ★</strong> ({m.reviewCount || 0} reviews)
              </div>
            </div>

            {reviews.length === 0 ? (
              <p style={{ fontSize: 13, color: '#94A3B8' }}>No reviews recorded for this seller</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reviews.map((r) => {
                  const isAppr = r.status === 'approved';
                  return (
                    <div
                      key={r._id}
                      style={{
                        background: '#F8FAFC', borderRadius: 12, padding: 14,
                        border: `1px solid ${isAppr ? '#E2E8F0' : '#FEE2E2'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <strong>{r.reviewerName}</strong>
                          {r.reviewerEmail && <span style={{ fontSize: 12, color: '#64748B' }}> ({r.reviewerEmail})</span>}
                          <span style={{ fontSize: 12, color: '#F59E0B', marginLeft: 8 }}>{'★'.repeat(r.rating)}</span>
                        </div>
                        <Badge label={isAppr ? 'Approved' : 'Inactive (Hidden)'} variant={isAppr ? 'verified' : 'expired'} />
                      </div>
                      <p style={{ fontSize: 13, color: '#334155', margin: '4px 0 10px' }}>"{r.comment}"</p>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleToggleReviewStatus(r._id, r.status)}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #CBD5E1',
                            background: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            color: isAppr ? '#B45309' : '#15803D',
                          }}
                        >
                          {isAppr ? 'Hide (Make Inactive)' : 'Approve'}
                        </button>
                        {r.reviewerId && !r.reviewerId.isBlacklisted && (
                          <button
                            onClick={() => handleBlacklistReviewer(r.reviewerId._id || r.reviewerId)}
                            style={{
                              padding: '4px 10px', borderRadius: 6, border: '1px solid #FEE2E2',
                              background: '#FFF5F5', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#EF4444',
                            }}
                          >
                            Blacklist User
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReview(r._id)}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid #E2E8F0',
                            background: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#64748B',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Verification Evidence */}
          {data.latestVerification && (
            <div className="admin-card">
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>Verification Record</h3>
              <div style={{ fontSize: 14, marginBottom: 8 }}>
                <strong>Status:</strong> <Badge label={data.latestVerification.status} variant={data.latestVerification.status === 'verified' ? 'verified' : 'expired'} />
              </div>
              {data.latestVerification.assignedVerifier?.name && (
                <div style={{ fontSize: 14, marginBottom: 8 }}>
                  <strong>Assigned Verifier:</strong> {data.latestVerification.assignedVerifier.name}
                </div>
              )}
              {data.latestVerification.verifierNotes && (
                <div style={{ fontSize: 14, marginBottom: 12 }}>
                  <strong>Notes:</strong> {data.latestVerification.verifierNotes}
                </div>
              )}
              {data.latestVerification.evidence && data.latestVerification.evidence.length > 0 && (
                <div>
                  <strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>Evidence Photos:</strong>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.latestVerification.evidence.map((ev, idx) => (
                      <img key={idx} src={ev.photoUrl} alt="Evidence" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Plan History */}
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Plan History</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Billing</th>
                  <th>Amount</th>
                  <th>Started</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                {planHistory.map((ph, idx) => (
                  <tr key={idx}>
                    <td><strong>{ph.planKey}</strong></td>
                    <td>{ph.billingCycle}</td>
                    <td>{formatINR(ph.amount)}</td>
                    <td>{new Date(ph.startedAt).toLocaleDateString()}</td>
                    <td>{new Date(ph.expiresAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {planHistory.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8' }}>No plan history</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Credit History */}
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Credit Purchase History</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Credits</th>
                  <th>Amount Paid</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {creditHistory.map((ch, idx) => (
                  <tr key={idx}>
                    <td>{ch.type || ch.packageName || 'Credit Pack'}</td>
                    <td>{ch.credits ?? ch.creditsAdded ?? '-'}</td>
                    <td>{formatINR(ch.amount)}</td>
                    <td>{ch.createdAt ? new Date(ch.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {creditHistory.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8' }}>No credit purchases</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Admin Notes */}
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Admin Notes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              {(m.adminNotes || []).map((note, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 14, color: '#0F172A', marginBottom: 4 }}>{note.text}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(note.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {(!m.adminNotes || m.adminNotes.length === 0) && (
                <p style={{ fontSize: 13, color: '#64748B' }}>No notes recorded yet</p>
              )}
            </div>

            <form onSubmit={handleAddNote} style={{ display: 'flex', gap: 8 }}>
              <input
                className="admin-input"
                style={{ flex: 1 }}
                placeholder="Add a private note about this seller..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <button type="submit" className="admin-btn admin-btn-primary">Add Note</button>
            </form>
          </div>
        </div>

        {/* Right Sidebar Stats Column */}
        <div>
          <div className="admin-card" style={{ position: 'sticky', top: 24 }}>
            {/* Total Spend Summary */}
            <div style={{ background: '#1E293B', borderRadius: 8, padding: '16px', marginBottom: 20, color: '#fff' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4, letterSpacing: '0.05em' }}>TOTAL LIFETIME SPEND</div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{formatINR(totalSpend)}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                <span>Plans: {formatINR(planTotal)}</span>
                <span>Credits: {formatINR(creditTotal)}</span>
              </div>
            </div>

            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Analytics & Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div>Inquiries Received: <strong>{stats.inquiriesReceived ?? 0}</strong></div>
              <div>Conversations: <strong>{stats.conversationCount ?? 0}</strong></div>
              <div>Moderation Cases: <strong>{stats.moderationCaseCount ?? 0}</strong></div>
              <div>Member Since: <strong>{stats.accountAge ? new Date(stats.accountAge).toLocaleDateString() : '-'}</strong></div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />

            <h4 style={{ marginTop: 0, marginBottom: 12 }}>Profile Completeness</h4>
            {stats.profileCompleteness && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div>{stats.profileCompleteness.about ? '✅' : '❌'} About Section</div>
                <div>{stats.profileCompleteness.factoryPhotos ? '✅' : '❌'} Factory Photos</div>
                <div>{stats.profileCompleteness.logo ? '✅' : '❌'} Company Logo</div>
                <div>{stats.profileCompleteness.buyerContactPhone ? '✅' : '❌'} Buyer Contact Phone</div>
                <div>{stats.profileCompleteness.address ? '✅' : '❌'} Factory Address</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={pendingDeactivate} onClose={() => setPendingDeactivate(false)} title="Deactivate Seller">
        <p style={{ marginBottom: 12 }}>Specify a reason for deactivating this seller account.</p>
        <textarea
          className="admin-input"
          style={{ width: '100%', minHeight: 80 }}
          placeholder="Reason for deactivation..."
          value={deactivateReason}
          onChange={(e) => setDeactivateReason(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-secondary" onClick={() => setPendingDeactivate(false)}>Cancel</button>
          <button className="admin-btn admin-btn-danger" onClick={applyDeactivation}>Deactivate</button>
        </div>
      </Modal>

      <Modal open={showBlockModal} onClose={() => setShowBlockModal(false)} title="Block Seller">
        <form onSubmit={handleBlockSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Block Type</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ fontSize: 14 }}>
                <input type="radio" name="blockMode" value="temporary" checked={blockMode === 'temporary'} onChange={() => setBlockMode('temporary')} /> Block temporarily
              </label>
              <label style={{ fontSize: 14 }}>
                <input type="radio" name="blockMode" value="blacklist" checked={blockMode === 'blacklist'} onChange={() => setBlockMode('blacklist')} /> Blacklist permanently
              </label>
            </div>
          </div>
          {blockMode === 'blacklist' && (
            <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 13, color: '#92400E' }}>
              This will permanently ban the seller, unpublish their portfolio, and block their phone number for 90 days (India SIM renewal period).
            </div>
          )}
          {blockMode === 'temporary' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Duration (days)</label>
              <input type="number" min="1" max="365" className="admin-input" value={blockDays} onChange={(e) => setBlockDays(e.target.value)} required />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Reason</label>
            <textarea className="admin-input" style={{ width: '100%', minHeight: 80 }} placeholder="Reason for blocking (required)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowBlockModal(false)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-danger" disabled={!blockReason.trim()}>
              {blockMode === 'temporary' ? 'Block Seller' : 'Blacklist Seller'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Document Rejection Modal */}
      <Modal open={!!rejectDocModal} onClose={() => setRejectDocModal(null)} title={`Reject ${rejectDocModal?.label || 'Document'}`}>
        <form onSubmit={handleConfirmRejectDocument}>
          <p style={{ fontSize: 13.5, color: '#475569', marginBottom: 12 }}>
            Please state the reason for rejecting this document. The seller will be notified to re-upload.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Rejection Reason</label>
            <textarea
              className="admin-input"
              style={{ width: '100%', minHeight: 80 }}
              placeholder="e.g., Image is blurry, name mismatch with GST, expired certificate..."
              value={rejectDocModal?.rejectionReason || ''}
              onChange={(e) => setRejectDocModal((prev) => ({ ...prev, rejectionReason: e.target.value }))}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRejectDocModal(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-danger" disabled={!rejectDocModal?.rejectionReason?.trim()}>
              Confirm Reject
            </button>
          </div>
        </form>
      </Modal>

      {/* Comprehensive Edit Manufacturer Profile Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Manufacturer Profile">
        <form onSubmit={handleEditSubmit} style={{ maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
          {/* Tab Selection */}
          <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid #E2E8F0', paddingBottom: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { key: 'identity', label: 'Company & Legal', icon: Building2 },
              { key: 'contact', label: 'Contact & Address', icon: Phone },
              { key: 'factory', label: 'Factory & Specs', icon: Factory },
              { key: 'bank', label: 'Bank & Financials', icon: Landmark },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setEditTab(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: editTab === key ? '#1E293B' : '#F1F5F9',
                  color: editTab === key ? '#FFFFFF' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Tab 1: Identity & Business */}
            {editTab === 'identity' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Company Name *</label>
                    <input
                      className="admin-input"
                      value={editForm.companyName}
                      onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Company Owner / Authorized Person</label>
                    <input
                      className="admin-input"
                      value={editForm.companyOwner}
                      onChange={(e) => setEditForm({ ...editForm, companyOwner: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Business Type</label>
                    <select
                      className="admin-select"
                      value={editForm.businessType}
                      onChange={(e) => setEditForm({ ...editForm, businessType: e.target.value })}
                    >
                      <option value="Manufacturer">Manufacturer</option>
                      <option value="Exporter">Exporter</option>
                      <option value="OEM / ODM Supplier">OEM / ODM Supplier</option>
                      <option value="Wholesaler">Wholesaler</option>
                      <option value="Trader">Trader</option>
                      <option value="Distributor">Distributor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Legal Status</label>
                    <select
                      className="admin-select"
                      value={editForm.legalStatus}
                      onChange={(e) => setEditForm({ ...editForm, legalStatus: e.target.value })}
                    >
                      <option value="">Select legal status</option>
                      <option value="Private Limited (Pvt Ltd)">Private Limited (Pvt Ltd)</option>
                      <option value="Public Limited">Public Limited</option>
                      <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                      <option value="Partnership Firm">Partnership Firm</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Year of Establishment</label>
                    <input
                      type="number"
                      className="admin-input"
                      placeholder="e.g., 2012"
                      value={editForm.yearOfEstablishment}
                      onChange={(e) => setEditForm({ ...editForm, yearOfEstablishment: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>GST Number (GSTIN)</label>
                    <input
                      className="admin-input"
                      placeholder="e.g., 07AAAAA0000A1Z5"
                      value={editForm.gstNumber}
                      onChange={(e) => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Primary Industry / Sector</label>
                  <input
                    className="admin-input"
                    placeholder="e.g., Apparel & Textiles, CNC Machinery, Packaging..."
                    value={editForm.industry}
                    onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Detailed Company / Manufacturing Description</label>
                  <textarea
                    className="admin-input"
                    rows={4}
                    placeholder="Describe manufacturing expertise, history, certifications, special capabilities..."
                    value={editForm.manufacturingDetails}
                    onChange={(e) => setEditForm({ ...editForm, manufacturingDetails: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* Tab 2: Contact & Address */}
            {editTab === 'contact' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Company Email</label>
                    <input
                      type="email"
                      className="admin-input"
                      value={editForm.companyEmail}
                      onChange={(e) => setEditForm({ ...editForm, companyEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Buyer Contact Phone (Public)</label>
                    <input
                      className="admin-input"
                      placeholder="+91..."
                      value={editForm.buyerContactPhone}
                      onChange={(e) => setEditForm({ ...editForm, buyerContactPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Business Direct Phone</label>
                    <input
                      className="admin-input"
                      placeholder="+91..."
                      value={editForm.businessPhone}
                      onChange={(e) => setEditForm({ ...editForm, businessPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>WhatsApp Business Number</label>
                    <input
                      className="admin-input"
                      placeholder="+91..."
                      value={editForm.whatsappNumber}
                      onChange={(e) => setEditForm({ ...editForm, whatsappNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Full Factory / Registered Address</label>
                  <textarea
                    className="admin-input"
                    rows={2}
                    placeholder="Street address, Plot / Shed No, Industrial Area..."
                    value={editForm.fullAddress}
                    onChange={(e) => setEditForm({ ...editForm, fullAddress: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>City / Location</label>
                    <input
                      className="admin-input"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>State</label>
                    <input
                      className="admin-input"
                      value={editForm.state}
                      onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Pincode</label>
                    <input
                      className="admin-input"
                      value={editForm.pincode}
                      onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Tab 3: Factory & Specs */}
            {editTab === 'factory' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Factory Floor Size</label>
                    <input
                      className="admin-input"
                      placeholder="e.g., 25,000 sq. ft."
                      value={editForm.factorySize}
                      onChange={(e) => setEditForm({ ...editForm, factorySize: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Monthly Capacity</label>
                    <input
                      className="admin-input"
                      placeholder="e.g., 50,000 units / month"
                      value={editForm.monthlyCapacity}
                      onChange={(e) => setEditForm({ ...editForm, monthlyCapacity: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Number of Machines</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={editForm.machinesCount}
                      onChange={(e) => setEditForm({ ...editForm, machinesCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Employees Count</label>
                    <input
                      type="number"
                      className="admin-input"
                      value={editForm.employeesCount}
                      onChange={(e) => setEditForm({ ...editForm, employeesCount: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Annual Turnover</label>
                    <input
                      className="admin-input"
                      placeholder="e.g., 10 Cr - 25 Cr"
                      value={editForm.annualTurnover}
                      onChange={(e) => setEditForm({ ...editForm, annualTurnover: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Export Percentage</label>
                    <input
                      className="admin-input"
                      placeholder="e.g., 35%"
                      value={editForm.exportPercentage}
                      onChange={(e) => setEditForm({ ...editForm, exportPercentage: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Markets Covered</label>
                  <input
                    className="admin-input"
                    placeholder="e.g., Pan-India, North America, Middle East..."
                    value={editForm.marketCovered}
                    onChange={(e) => setEditForm({ ...editForm, marketCovered: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>About Factory & Infrastructure Details</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    placeholder="Describe manufacturing lines, automated setups, QC labs..."
                    value={editForm.aboutFactory}
                    onChange={(e) => setEditForm({ ...editForm, aboutFactory: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Factory Tour Video URL</label>
                    <input
                      className="admin-input"
                      placeholder="YouTube URL"
                      value={editForm.factoryVideo}
                      onChange={(e) => setEditForm({ ...editForm, factoryVideo: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Company Overview Video URL</label>
                    <input
                      className="admin-input"
                      placeholder="YouTube URL"
                      value={editForm.introVideo}
                      onChange={(e) => setEditForm({ ...editForm, introVideo: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Tab 4: Bank Details */}
            {editTab === 'bank' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Account Beneficiary Name</label>
                    <input
                      className="admin-input"
                      value={editForm.bankDetails?.accountName || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        bankDetails: { ...editForm.bankDetails, accountName: e.target.value },
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Account Number</label>
                    <input
                      className="admin-input"
                      value={editForm.bankDetails?.accountNumber || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        bankDetails: { ...editForm.bankDetails, accountNumber: e.target.value },
                      })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>IFSC Code</label>
                    <input
                      className="admin-input"
                      value={editForm.bankDetails?.ifscCode || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        bankDetails: { ...editForm.bankDetails, ifscCode: e.target.value.toUpperCase() },
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Bank Name</label>
                    <input
                      className="admin-input"
                      value={editForm.bankDetails?.bankName || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        bankDetails: { ...editForm.bankDetails, bankName: e.target.value },
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#334155' }}>Branch Name</label>
                    <input
                      className="admin-input"
                      value={editForm.bankDetails?.branchName || ''}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        bankDetails: { ...editForm.bankDetails, branchName: e.target.value },
                      })}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #E2E8F0', paddingTop: 14, marginTop: 16 }}>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setShowEditModal(false)}
              disabled={editSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={editSaving}
            >
              {editSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
