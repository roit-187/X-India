'use client';

import { useState, useEffect, useCallback } from 'react';
import StatCard from '@/components/admin/StatCard';
import Modal from '@/components/admin/Modal';
import Badge from '@/components/admin/Badge';

export default function AdminDashboardPage() {
  const [range, setRange] = useState('month');
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [topSellers, setTopSellers] = useState([]);
  const [topMetric, setTopMetric] = useState('inquiries');
  const [moderation, setModeration] = useState(null);

  // Verification queue state
  const [verificationQueue, setVerificationQueue] = useState([]);
  const [verifPage, setVerifPage] = useState(1);
  const [verifTotalPages, setVerifTotalPages] = useState(1);
  const [verifStatus, setVerifStatus] = useState('scheduled');

  // Verification Modals
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [verifierName, setVerifierName] = useState('');
  
  const [decisionTarget, setDecisionTarget] = useState(null);
  const [decisionType, setDecisionType] = useState('verified');
  const [verifierNotes, setVerifierNotes] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const [sumRes, revRes, funRes, modRes] = await Promise.all([
        fetch(`/api/admin/dashboard/summary?range=${range}`),
        fetch(`/api/admin/dashboard/revenue?range=${range}`),
        fetch('/api/admin/dashboard/funnel'),
        fetch('/api/admin/dashboard/moderation-count'),
      ]);

      const sumData = await sumRes.json();
      const revData = await revRes.json();
      const funData = await funRes.json();
      const modData = await modRes.json();

      if (sumData.success) setSummary(sumData);
      if (revData.success) setRevenue(revData);
      if (funData.success) setFunnel(funData);
      if (modData.success) setModeration(modData);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    }
  }, [range]);

  const loadTopSellers = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/dashboard/top-sellers?metric=${topMetric}&limit=10`);
      const data = await res.json();
      if (data.success) setTopSellers(data.sellers || []);
    } catch (err) {
      console.error('Error loading top sellers:', err);
    }
  }, [topMetric]);

  const loadVerificationQueue = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/verification/queue?status=${verifStatus}&page=${verifPage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setVerificationQueue(data.requests || []);
        setVerifTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error loading verification queue:', err);
    }
  }, [verifStatus, verifPage]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadTopSellers(); }, [loadTopSellers]);
  useEffect(() => { loadVerificationQueue(); }, [loadVerificationQueue]);

  const handleAcceptSubmit = async (e) => {
    e.preventDefault();
    if (!acceptTarget) return;
    await fetch(`/api/admin/verification/${acceptTarget}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verifierName }),
    });
    setAcceptTarget(null);
    setVerifierName('');
    loadVerificationQueue();
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionTarget) return;
    await fetch(`/api/admin/verification/${decisionTarget}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: decisionType,
        verifierNotes,
        evidencePhotos: [],
      }),
    });
    setDecisionTarget(null);
    setVerifierNotes('');
    loadVerificationQueue();
  };

  const formatCurrency = (amount) => {
    if (amount == null) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['week', 'month', 'year'].map((r) => (
            <button
              key={r}
              className={`admin-btn ${range === r ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setRange(r)}
              style={{ textTransform: 'capitalize' }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-grid" style={{ marginBottom: 32 }}>
        <StatCard label="New Buyers" value={summary?.newBuyers ?? '-'} />
        <StatCard label="New Sellers" value={summary?.newSellers ?? '-'} />
        <StatCard label="Total Inquiries" value={summary?.totalInquiries ?? '-'} />
        <StatCard label="Active Sellers" value={summary?.activeSellers ?? '-'} />
        <StatCard label="Expired Sellers" value={summary?.expiredSellers ?? '-'} />
        <StatCard label="Plan Revenue" value={formatCurrency(revenue?.planRevenue)} />
        <StatCard label="Credit Revenue" value={formatCurrency(revenue?.creditRevenue)} />
        <StatCard label="Open Moderation Cases" value={moderation?.count ?? '-'} />
        {summary?.totalInquiryValue != null && (
          <StatCard label="Total Inquiry Value" value={formatCurrency(summary.totalInquiryValue)} />
        )}
      </div>

      {/* Seller Funnel & Top Sellers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Seller Funnel */}
        <div className="admin-card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}>Seller Conversion Funnel</h3>
          {funnel ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Signed Up', val: funnel.signedUp },
                { label: 'Selected Plan', val: funnel.selectedPlan },
                { label: 'Published Portfolio', val: funnel.publishedPortfolio },
                { label: 'Created Product', val: funnel.createdProduct },
                { label: 'Received Inquiry', val: funnel.receivedInquiry },
              ].map((step) => {
                const pct = funnel.signedUp ? Math.round((step.val / funnel.signedUp) * 100) : 0;
                return (
                  <div key={step.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{step.label}</span>
                      <strong>{step.val} ({pct}%)</strong>
                    </div>
                    <div style={{ background: '#E2E8F0', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--adm-primary)', height: '100%', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>Loading funnel...</p>
          )}
        </div>

        {/* Top Sellers */}
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Top Sellers</h3>
            <select
              className="admin-select"
              value={topMetric}
              onChange={(e) => setTopMetric(e.target.value)}
            >
              <option value="inquiries">By Inquiries</option>
              <option value="rating">By Rating</option>
              <option value="products">By Products</option>
            </select>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Seller</th>
                <th>Rating</th>
                <th>Products</th>
                <th>Inquiries</th>
              </tr>
            </thead>
            <tbody>
              {topSellers.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.rating?.toFixed(1) || '0.0'} ★</td>
                  <td>{s.productCount}</td>
                  <td>{s.inquiriesReceived}</td>
                </tr>
              ))}
              {topSellers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8' }}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Queue Section */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Verification Queue</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['scheduled', 'accepted', 'rejected'].map((st) => (
              <button
                key={st}
                className={`admin-btn ${verifStatus === st ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
                onClick={() => { setVerifStatus(st); setVerifPage(1); }}
                style={{ textTransform: 'capitalize', padding: '4px 12px', fontSize: 13 }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Seller Contact</th>
              <th>Company</th>
              <th>Location</th>
              <th>Requested Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {verificationQueue.map((req) => (
              <tr key={req._id}>
                <td>
                  <div><strong>{req.userId?.firstName || 'Seller'} {req.userId?.lastName || ''}</strong></div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{req.userId?.email || '-'}</div>
                  {req.userId?.phone && <div style={{ fontSize: 11, color: '#94A3B8' }}>{req.userId.phone}</div>}
                </td>
                <td>
                  {req.manufacturerId ? (
                    <a
                      href={`/admin/manufacturers/${req.manufacturerId._id}`}
                      style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {req.manufacturerId.name} ↗
                    </a>
                  ) : (
                    <strong>{req.userId?.companyName || 'Unlinked Factory'}</strong>
                  )}
                </td>
                <td>{req.requestedLocation?.address || req.userId?.location || '-'}</td>
                <td>
                  {req.scheduledVisit?.date ? (
                    <div>
                      <strong>{req.scheduledVisit.date}</strong>
                      <div style={{ fontSize: 12, color: '#EA580C', fontWeight: 600 }}>{req.scheduledVisit.slot}</div>
                    </div>
                  ) : (
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  )}
                </td>
                <td>
                  <Badge
                    label={req.status}
                    variant={req.status === 'verified' ? 'verified' : req.status === 'rejected' ? 'expired' : 'active'}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {req.status === 'scheduled' && (
                      <button
                        className="admin-btn admin-btn-primary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setAcceptTarget(req._id)}
                      >
                        Accept Visit
                      </button>
                    )}
                    {(req.status === 'accepted' || req.status === 'scheduled') && (
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => setDecisionTarget(req._id)}
                      >
                        Record Decision
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {verificationQueue.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8' }}>No verification requests in queue</td>
              </tr>
            )}
          </tbody>
        </table>

        {verifTotalPages > 1 && (
          <div className="admin-pagination">
            <button className="admin-btn admin-btn-secondary" disabled={verifPage <= 1} onClick={() => setVerifPage((p) => p - 1)}>Prev</button>
            <span>Page {verifPage} of {verifTotalPages}</span>
            <button className="admin-btn admin-btn-secondary" disabled={verifPage >= verifTotalPages} onClick={() => setVerifPage((p) => p + 1)}>Next</button>
          </div>
        )}
      </div>

      {/* Modal Accept Verification */}
      <Modal open={!!acceptTarget} onClose={() => setAcceptTarget(null)} title="Accept Verification Request">
        <form onSubmit={handleAcceptSubmit}>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 12 }}>Assign a field verifier for this factory audit.</p>
          <input
            className="admin-input"
            style={{ width: '100%', marginBottom: 16 }}
            placeholder="Verifier Name (e.g. Agent Sharma)"
            value={verifierName}
            onChange={(e) => setVerifierName(e.target.value)}
            required
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setAcceptTarget(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Assign & Accept</button>
          </div>
        </form>
      </Modal>

      {/* Modal Decision Verification */}
      <Modal open={!!decisionTarget} onClose={() => setDecisionTarget(null)} title="Record Verification Decision">
        <form onSubmit={handleDecisionSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Decision</label>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ fontSize: 14 }}>
                <input type="radio" name="decision" value="verified" checked={decisionType === 'verified'} onChange={() => setDecisionType('verified')} /> Verified
              </label>
              <label style={{ fontSize: 14 }}>
                <input type="radio" name="decision" value="rejected" checked={decisionType === 'rejected'} onChange={() => setDecisionType('rejected')} /> Rejected
              </label>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Verifier Notes</label>
            <textarea
              className="admin-input"
              style={{ width: '100%', minHeight: 80 }}
              placeholder="Notes on factory condition, machinery, etc."
              value={verifierNotes}
              onChange={(e) => setVerifierNotes(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setDecisionTarget(null)}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">Submit Decision</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
