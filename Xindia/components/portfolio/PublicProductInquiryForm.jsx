'use client';

import { useState } from 'react';
import { trackPortfolioEvent } from '@/lib/portfolioAnalytics';

export default function PublicProductInquiryForm({ product, sellerSlug }) {
  const [form, setForm] = useState({ buyerName: '', buyerPhone: '', buyerCompany: '', buyerEmail: '', orderQty: '', timeline: 'Within 1-2 Weeks' });
  const [status, setStatus] = useState({ busy: false, error: '', reference: '' });

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ busy: true, error: '', reference: '' });
    const productRequirement = `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}`;
    try {
      trackPortfolioEvent(sellerSlug, 'rfq_start', { productId: product._id });
      const response = await fetch('/api/public/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          buyerPhone: form.buyerPhone.trim(),
          productRequirement,
          orderQty: form.orderQty.trim() || undefined,
          slug: sellerSlug,
          fanOut: false,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'Could not send your inquiry.');
      setStatus({ busy: false, error: '', reference: result.referenceNumber || '' });
    } catch (error) {
      setStatus({ busy: false, error: error.message || 'Could not send your inquiry.', reference: '' });
    }
  };

  if (status.reference) {
    return <p className="public-product-success" role="status">Inquiry sent. Reference: {status.reference}</p>;
  }

  return (
    <form className="public-product-inquiry" onSubmit={submit}>
      <h2>Ask about this product</h2>
      <label>Your name<input name="buyerName" value={form.buyerName} onChange={update} required maxLength={50} autoComplete="name" /></label>
      <label>Mobile number<input name="buyerPhone" value={form.buyerPhone} onChange={update} required inputMode="tel" autoComplete="tel" maxLength={20} /></label>
      <label>Company (optional)<input name="buyerCompany" value={form.buyerCompany} onChange={update} maxLength={100} autoComplete="organization" /></label>
      <label>Email (optional)<input name="buyerEmail" type="email" value={form.buyerEmail} onChange={update} maxLength={100} autoComplete="email" /></label>
      <label>Required quantity (optional)<input name="orderQty" value={form.orderQty} onChange={update} maxLength={50} /></label>
      <label>When do you need it?
        <select name="timeline" value={form.timeline} onChange={update}>
          <option>Within 1-2 Weeks</option>
          <option>Within 1 Month</option>
          <option>Within 3 Months</option>
          <option>Planning / researching</option>
        </select>
      </label>
      {status.error && <p className="public-product-error" role="alert">{status.error}</p>}
      <button type="submit" disabled={status.busy}>{status.busy ? 'Sending…' : 'Send inquiry to seller'}</button>
    </form>
  );
}
