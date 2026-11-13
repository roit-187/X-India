'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManufacturerPortfolioPanel({ manufacturer, canEdit, onSaved }) {
  const state = manufacturer.customPortfolio || {};
  const [url, setUrl] = useState(manufacturer.customPortfolioUrl || '');
  const [preview, setPreview] = useState(state.previewUrl || '');
  const [notes, setNotes] = useState(state.deploymentNotes || '');
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setUrl(manufacturer.customPortfolioUrl || '');
    setPreview(manufacturer.customPortfolio?.previewUrl || '');
    setNotes(manufacturer.customPortfolio?.deploymentNotes || '');
  }, [manufacturer]);

  const update = async (action) => {
    setBusy(action);
    setMessage('');
    setFailed(false);
    try {
      const response = await fetch(`/api/admin/manufacturers/${manufacturer._id}/portfolio-link`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, revision: state.revision || 0, customPortfolioUrl: url, previewUrl: preview, deploymentNotes: notes }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not update this portfolio.');
      onSaved(result.manufacturer);
      setMessage(result.manufacturer?.customPortfolio?.health === 'unhealthy' ? result.message
        : action === 'activate' || action === 'rollback' ? 'Custom website activated. The permanent QR now redirects there.'
        : action === 'disable' ? 'Standard portfolio restored. The QR address stays the same.'
          : action === 'check' ? 'Website check passed. Ready for staff review and activation.' : 'Draft saved. Saving a new URL does not publish it.');
    } catch (err) { setFailed(true); setMessage(err.message); }
    finally { setBusy(''); }
  };

  const safeLink = (value) => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : '#'; } catch (_) { return '#'; } };
  return (
    <section className="admin-card" style={{ marginBottom: 24, padding: 20 }} aria-label="Seller portfolio deployment">
      <h3 style={{ margin: '0 0 8px' }}>Portfolio</h3>
      <p style={{ color: '#475569', fontSize: 13 }}>The app and all QR codes keep this permanent address. An activated, available custom website takes priority; otherwise the standard portfolio opens.</p>
      <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>
        Permanent standard link
        <input className="admin-input" value={`/p/${manufacturer.slug}`} readOnly />
      </label>
      <p style={{ fontSize: 13, color: '#475569' }}>
        Destination: <strong>{manufacturer.portfolioLinkMode === 'custom' ? 'Custom website' : 'Standard portfolio'}</strong>
        {' · '}Status: <strong>{state.status || 'draft'}</strong>{' · '}Health: <strong>{state.health || 'pending'}</strong>
        {state.checkedAt && <> · Checked {new Date(state.checkedAt).toLocaleString()}</>}
      </p>
      {!!state.lastError && <p style={{ color: '#B91C1C', fontSize: 13 }}>{state.lastError} Visitors use the standard portfolio until a successful check.</p>}
      <p style={{ color: '#64748B', fontSize: 13 }}>Seller request: {state.optedInAt ? `Recorded ${new Date(state.optedInAt).toLocaleDateString()}` : 'Required before activation (existing requests are checked automatically).'} <Link href="/admin/portfolio-requests">View requests</Link></p>
      <form onSubmit={(event) => { event.preventDefault(); update('save'); }}>
        <fieldset disabled={!canEdit || Boolean(busy)} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Deployed custom website URL<input className="admin-input" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://seller.xindia.live" /></label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Preview URL (optional)<input className="admin-input" type="url" value={preview} onChange={(event) => setPreview(event.target.value)} /></label>
          <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }}>Deployment and handover notes<textarea className="admin-input" rows={3} maxLength={4000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Hosting project, seller account, DNS, tested contact links and entitlement integration. Never paste credentials." /></label>
          {canEdit && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className="admin-btn admin-btn-secondary" type="submit">Save draft</button>
            <button className="admin-btn admin-btn-secondary" type="button" disabled={!url} onClick={() => update('check')}>Check website</button>
            <button className="admin-btn admin-btn-primary" type="button" disabled={!url} onClick={() => update('activate')}>Check & activate</button>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => update('disable')}>Use standard portfolio</button>
            {!!state.previousUrl && <button className="admin-btn admin-btn-secondary" type="button" onClick={() => update('rollback')}>Restore previous custom website</button>}
          </div>}
        </fieldset>
      </form>
      {busy && <p role="status">{busy === 'save' || busy === 'disable' ? 'Saving…' : 'Checking website…'}</p>}
      {message && <p role={failed ? 'alert' : 'status'} style={{ color: failed ? '#B91C1C' : '#047857', fontSize: 13 }}>{message}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12, fontSize: 13 }}>
        <Link href={`/p/${manufacturer.slug}?standard=1#products`} target="_blank">Preview standard portfolio ↗</Link>
        {!!url && <a href={safeLink(url)} target="_blank" rel="noopener noreferrer">Open custom website ↗</a>}
        {!!preview && <a href={safeLink(preview)} target="_blank" rel="noopener noreferrer">Open preview ↗</a>}
      </div>
    </section>
  );
}
