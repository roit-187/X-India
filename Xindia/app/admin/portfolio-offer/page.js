'use client';

import { useEffect, useState } from 'react';
import { Save, Globe, AlertCircle, CheckCircle2 } from 'lucide-react';

const EMPTY_OFFER = {
  enabled: false,
  amount: '',
  currency: 'INR',
  bannerTitle: '',
  bannerSubtitle: '',
  title: '',
  description: '',
  highlights: [],
  deliverables: [],
  deliveryTimeline: '',
  pricingNote: '',
  requestButtonLabel: '',
};

export default function PortfolioOfferAdminPage() {
  const [offer, setOffer] = useState(EMPTY_OFFER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings/portfolio-design-offer')
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || 'Could not load offer settings.');
        setOffer({ ...EMPTY_OFFER, ...(data.offer || {}), amount: data.offer?.amount ?? '' });
      })
      .catch((err) => setError(err.message || 'Could not load offer settings.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (key, value) => setOffer((current) => ({ ...current, [key]: value }));
  const updateList = (key, value) => update(key, value.split('\n'));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/settings/portfolio-design-offer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: { ...offer, amount: offer.amount === '' ? null : Number(offer.amount) } }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not save offer settings.');
      setOffer({ ...EMPTY_OFFER, ...data.offer, amount: data.offer.amount ?? '' });
      setSuccess('The seller app offer was updated.');
    } catch (err) {
      setError(err.message || 'Could not save offer settings.');
    } finally {
      setSaving(false);
    }
  };

  const field = (label, key, options = {}) => (
    <label style={{ display: 'grid', gap: 6, color: '#334155', fontSize: 13, fontWeight: 650 }}>
      {label}
      {options.multiline ? (
        <textarea value={Array.isArray(offer[key]) ? offer[key].join('\n') : offer[key] || ''} onChange={(event) => options.list ? updateList(key, event.target.value) : update(key, event.target.value)} rows={options.rows || 4} style={inputStyle} />
      ) : (
        <input type={options.type || 'text'} min={options.type === 'number' ? 1 : undefined} value={offer[key] ?? ''} onChange={(event) => update(key, event.target.value)} style={inputStyle} />
      )}
      {options.help && <span style={{ color: '#64748B', fontSize: 11, fontWeight: 400 }}>{options.help}</span>}
    </label>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Globe size={24} color="#F05A24" />
        <h1 style={{ margin: 0, fontSize: 24, color: '#0F172A' }}>Custom Website Offer</h1>
      </div>
      <p style={{ marginTop: 0, marginBottom: 22, color: '#64748B', lineHeight: 1.6 }}>Manage the seller-facing banner, details page content, and fixed price. Changes are loaded by the app from backend settings.</p>

      {error && <div role="alert" style={noticeStyle('#FEF2F2', '#B91C1C')}><AlertCircle size={17} />{error}</div>}
      {success && <div role="status" style={noticeStyle('#ECFDF5', '#047857')}><CheckCircle2 size={17} />{success}</div>}

      {loading ? <p>Loading offer settings…</p> : (
        <form onSubmit={save} style={{ display: 'grid', gap: 18 }}>
          <div className="admin-card" style={{ padding: 20, display: 'grid', gap: 18 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: '#0F172A' }}>
              <input type="checkbox" checked={Boolean(offer.enabled)} onChange={(event) => update('enabled', event.target.checked)} />
              Show the offer in the seller app
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {field('Fixed price (INR)', 'amount', { type: 'number', help: 'Required before enabling the offer. This is a service request, not an in-app payment.' })}
              {field('Banner title', 'bannerTitle')}
              {field('Banner subtitle', 'bannerSubtitle')}
              {field('Details page title', 'title')}
              {field('Delivery timeline', 'deliveryTimeline')}
              {field('Request button label', 'requestButtonLabel')}
            </div>
            {field('Details page description', 'description', { multiline: true, rows: 5 })}
            {field('Business benefits (one per line)', 'highlights', { multiline: true, list: true, rows: 5 })}
            {field('Included deliverables (one per line)', 'deliverables', { multiline: true, list: true, rows: 5 })}
            {field('Pricing note', 'pricingNote', { multiline: true, rows: 2 })}
          </div>
          <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}>
            <Save size={16} />{saving ? 'Saving…' : 'Save offer'}
          </button>
        </form>
      )}
    </div>
  );
}

const inputStyle = { width: '100%', minHeight: 42, border: '1px solid #CBD5E1', borderRadius: 8, padding: '9px 11px', color: '#0F172A', font: 'inherit', resize: 'vertical' };
const noticeStyle = (background, color) => ({ display: 'flex', alignItems: 'center', gap: 8, background, color, padding: '11px 14px', borderRadius: 9, marginBottom: 14, fontSize: 13, fontWeight: 650 });
