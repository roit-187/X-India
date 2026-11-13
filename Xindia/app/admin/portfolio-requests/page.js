'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Phone, RefreshCw, Save } from 'lucide-react';

const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];

export default function PortfolioRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [notes, setNotes] = useState({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [assignment, setAssignment] = useState('all');
  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25', assignment });
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);
      const response = await fetch(`/api/admin/portfolio-design-requests?${params}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not load requests.');
      setRequests(Array.isArray(result.data) ? result.data : []);
      setTotal(Number(result.total) || 0);
      setTotalPages(Number(result.totalPages) || 1);
    } catch (err) {
      setError(err.message || 'Could not load requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, assignment, search]);

  useEffect(() => { const timer = setTimeout(load, search ? 250 : 0); return () => clearTimeout(timer); }, [load, search]);

  const saveRequest = async (request, status, assignmentChange) => {
    setSavingId(String(request._id));
    setError('');
    try {
      const response = await fetch(`/api/admin/portfolio-design-requests/${request._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, updatedAt: request.updatedAt, assignment: assignmentChange, resolutionNote: notes[request._id] ?? request.resolutionNote ?? '' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not update request.');
      await load();
    } catch (err) {
      setError(err.message || 'Could not update request.');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, color: '#0F172A' }}>Portfolio Requests</h1>
          <p style={{ margin: '6px 0 0', color: '#64748B', fontSize: 13 }}>Contact sellers about custom website requests, record follow-up notes, and update request status.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select className="admin-select" aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
          </select>
          <select className="admin-select" aria-label="Filter by assignment" value={assignment} onChange={(event) => { setAssignment(event.target.value); setPage(1); }}>
            <option value="all">All staff</option><option value="mine">Assigned to me</option><option value="unassigned">Unassigned</option>
          </select>
          <button className="admin-btn admin-btn-secondary" onClick={load} disabled={loading} aria-label="Refresh requests"><RefreshCw size={15} /></button>
        </div>
      </div>

      <input className="admin-input" style={{ marginBottom: 16, maxWidth: 380 }} aria-label="Search portfolio requests" placeholder="Search seller or request" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
      <p style={{ fontSize: 13, color: '#64748B' }}>{total} requests · Page {page} of {totalPages}</p>

      {error && <p role="alert" style={{ color: '#B91C1C', background: '#FEF2F2', borderRadius: 8, padding: 12 }}>{error}</p>}
      {loading ? <p>Loading portfolio requests…</p> : requests.length === 0 ? (
        <div className="admin-card" style={{ padding: 28, color: '#64748B', textAlign: 'center' }}>No requests match this status.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {requests.map((request) => {
            const metadata = request.metadata || {};
            const phone = String(metadata.sellerPhone || '').replace(/[^0-9+]/g, '');
            return (
              <article className="admin-card" key={request._id} style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 16, color: '#0F172A' }}>{metadata.sellerName || request.title}</h2>
                    <p style={{ margin: '5px 0', color: '#64748B', fontSize: 12 }}>{new Date(request.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · {request.status.replace('_', ' ')}</p>
                    <p style={{ margin: '8px 0 0', color: '#334155', fontSize: 13 }}>{request.body}</p>
                    {metadata.offerAmount != null && <p style={{ margin: '8px 0 0', color: '#0F172A', fontWeight: 750 }}>Displayed price: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: metadata.offerCurrency || 'INR', maximumFractionDigits: 0 }).format(Number(metadata.offerAmount))}</p>}
                  </div>
                  {request.relatedEntityId && <a className="admin-btn admin-btn-secondary" href={`/admin/manufacturers/${request.relatedEntityId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start', textDecoration: 'none' }}>Seller profile <ExternalLink size={14} /></a>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                  {phone && <a className="admin-btn admin-btn-secondary" href={`tel:${phone}`}><Phone size={14} /> Call seller</a>}
                  {phone && <a className="admin-btn admin-btn-secondary" href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
                  {metadata.sellerEmail && <a className="admin-btn admin-btn-secondary" href={`mailto:${metadata.sellerEmail}`}>Email seller</a>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13 }}>
                  <span>Assigned to: <strong>{request.assignedTo?.username || 'Unassigned'}</strong></span>
                  <button className="admin-btn admin-btn-secondary" disabled={Boolean(savingId)} onClick={() => saveRequest(request, request.status, 'me')}>Assign to me</button>
                  {request.assignedTo && <button className="admin-btn admin-btn-secondary" disabled={Boolean(savingId)} onClick={() => saveRequest(request, request.status, 'unassigned')}>Unassign</button>}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'end', marginTop: 14 }}>
                  <label style={{ display: 'grid', gap: 5, color: '#475569', fontSize: 12, fontWeight: 650 }}>
                    Follow-up note
                    <input className="admin-input" maxLength={2000} value={notes[request._id] ?? request.resolutionNote ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [request._id]: event.target.value }))} placeholder="Record the call, quote, or next step" />
                  </label>
                  <select className="admin-select" aria-label="Request status" value={statuses[request._id] ?? request.status} onChange={(event) => setStatuses((current) => ({ ...current, [request._id]: event.target.value }))}>{STATUSES.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}</select>
                  <button className="admin-btn admin-btn-primary" disabled={Boolean(savingId)} onClick={() => saveRequest(request, statuses[request._id] ?? request.status)}><Save size={14} /> {savingId === String(request._id) ? 'Saving…' : 'Save follow-up'}</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="admin-btn admin-btn-secondary" disabled={loading || page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <button className="admin-btn admin-btn-secondary" disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>
    </div>
  );
}
