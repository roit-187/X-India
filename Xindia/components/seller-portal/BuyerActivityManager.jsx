'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Briefcase, ChevronLeft, ChevronRight, History } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InquiryCard({ item }) {
  const buyer = item.buyer || {};
  return (
    <div className="seller-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>{item.name}</h3>
          <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px 0' }}>{item.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, fontSize: 13, marginBottom: 10 }}>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Budget</div>
            <div style={{ fontWeight: 600 }}>{item.budget || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Location</div>
            <div style={{ fontWeight: 600 }}>{item.location || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Category</div>
            <div style={{ fontWeight: 600 }}>{item.categoryId || '-'}</div>
          </div>
        </div>
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
          <strong>Buyer:</strong> {buyer.firstName} {buyer.lastName || ''}
          {buyer.phone && <span style={{ marginLeft: 12, color: '#64748B' }}>{buyer.phone}</span>}
          {buyer.email && <span style={{ marginLeft: 12, color: '#64748B' }}>{buyer.email}</span>}
          {buyer.location && <span style={{ marginLeft: 12, color: '#94A3B8' }}>{buyer.location}</span>}
        </div>
      </div>
    </div>
  );
}

function LeadCard({ item }) {
  const tierColors = {
    urgent: { bg: '#FEE2E2', color: '#B91C1C', label: 'Urgent' },
    priority: { bg: '#FEF3C7', color: '#92400E', label: 'Priority' },
    none: null,
  };
  const tier = tierColors[item.boostTier] || null;

  return (
    <div className="seller-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>{item.name}</h3>
            {tier && (
              <span style={{ background: tier.bg, color: tier.color, padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                {tier.label}
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 10px 0' }}>{item.description}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, fontSize: 13 }}>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Budget</div>
            <div style={{ fontWeight: 600 }}>{item.budget || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Location</div>
            <div style={{ fontWeight: 600 }}>{item.location || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Category</div>
            <div style={{ fontWeight: 600 }}>{item.categoryId || '-'}</div>
          </div>
          <div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Posted by</div>
            <div style={{ fontWeight: 600 }}>{item.ownerName || '-'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
      <button className="seller-btn seller-btn-secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)} style={{ padding: '6px 10px' }}>
        <ChevronLeft size={16} />
      </button>
      <span style={{ fontSize: 13, color: '#64748B' }}>Page {page} of {totalPages}</span>
      <button className="seller-btn seller-btn-secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} style={{ padding: '6px 10px' }}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function DateFilter({ dateFrom, dateTo, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 3 }}>From</label>
        <input type="date" className="seller-input" value={dateFrom} onChange={(e) => onChange('dateFrom', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 3 }}>To</label>
        <input type="date" className="seller-input" value={dateTo} onChange={(e) => onChange('dateTo', e.target.value)} />
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, endpoint }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPast, setShowPast] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isInquiries = endpoint.includes('inquiries');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (showPast) params.set('showPast', 'true');
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);

    try {
      const res = await fetch(`/api/seller/${endpoint}?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setItems(isInquiries ? (data.inquiries || []) : (data.leads || []));
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        setError(data.message || 'Failed to load');
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, showPast, dateFrom, dateTo, endpoint, isInquiries]);

  useEffect(() => { load(); }, [load]);

  const handleDateChange = (key, value) => {
    setPage(1);
    if (key === 'dateFrom') setDateFrom(value);
    else setDateTo(value);
  };

  const togglePast = () => {
    setPage(1);
    setShowPast((v) => !v);
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon size={20} color="#E8581C" />
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>({total})</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <DateFilter dateFrom={dateFrom} dateTo={dateTo} onChange={handleDateChange} />
          <button
            className={`seller-btn ${showPast ? 'seller-btn-primary' : 'seller-btn-secondary'}`}
            onClick={togglePast}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px' }}
          >
            <History size={14} />
            {showPast ? 'Recent 3 Days' : 'Past Activity'}
          </button>
        </div>
      </div>

      {!showPast && !dateFrom && !dateTo && (
        <p style={{ fontSize: 12, color: '#94A3B8', margin: '-8px 0 12px 0' }}>
          Showing last 3 days. Click &ldquo;Past Activity&rdquo; to see older entries.
        </p>
      )}

      {loading ? (
        <p style={{ color: '#64748B' }}>Loading...</p>
      ) : error ? (
        <p style={{ color: '#EF4444' }}>{error}</p>
      ) : items.length === 0 ? (
        <div className="seller-card" style={{ textAlign: 'center', color: '#64748B', padding: 32 }}>
          {showPast
            ? 'No entries found for the selected period.'
            : `No ${isInquiries ? 'inquiries' : 'leads'} in the last 3 days.`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item) =>
            isInquiries
              ? <InquiryCard key={item._id} item={item} />
              : <LeadCard key={item._id} item={item} />
          )}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

export default function BuyerActivityManager() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Buyer Activity</h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Track your buyer inquiries and explore new leads matching your business.
        </p>
      </div>

      <Section
        title="Buyer Inquiries"
        icon={Users}
        endpoint="buyer-activity/inquiries"
      />

      <Section
        title="Leads"
        icon={Briefcase}
        endpoint="buyer-activity/leads"
      />
    </div>
  );
}
