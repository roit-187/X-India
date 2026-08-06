'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Badge from '@/components/admin/Badge';
import Toggle from '@/components/admin/Toggle';
import Modal from '@/components/admin/Modal';

export default function ManufacturerDetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [noteText, setNoteText] = useState('');
  const [pendingDeactivate, setPendingDeactivate] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockMode, setBlockMode] = useState('temporary');
  const [blockDays, setBlockDays] = useState(30);
  const [blockReason, setBlockReason] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/manufacturers/${id}`);
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        setError(result.message || 'Failed to load manufacturer detail');
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
            {seller && (seller.isBlacklisted || (seller.blockedUntil && new Date(seller.blockedUntil) > new Date())) ? (
              <button className="admin-btn admin-btn-secondary" onClick={handleUnblock}>Unblock Seller</button>
            ) : (
              <button className="admin-btn admin-btn-danger" onClick={() => setShowBlockModal(true)}>Block Seller</button>
            )}
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
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Business Details</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                <div><strong>GSTIN:</strong> {seller.gstNumber || '-'}</div>
                <div><strong>Registration Date:</strong> {seller.gstRegistrationDate || '-'}</div>
                <div><strong>Legal Name:</strong> {seller.gstLegalName || '-'}</div>
                <div><strong>Trade Name:</strong> {seller.gstTradeName || '-'}</div>
                <div><strong>Business Type:</strong> {seller.gstBusinessType || '-'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>GST Address:</strong> {seller.gstAddress || '-'}</div>
              </div>
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
    </div>
  );
}
