'use client';

import { useEffect, useState } from 'react';

const DEFAULT_ORDER = ['products', 'opportunities', 'ratings', 'contact', 'overview', 'factory'];
const SECTION_LABELS = {
  products: 'Products · QR landing page',
  opportunities: 'Business opportunities · Products page',
  ratings: 'Reviews · Products page',
  contact: 'Contact & RFQ · Products page',
  overview: 'Company overview · Home page',
  factory: 'Factory details · Home page',
};
const OPTIONAL_SECTIONS = [
  ['factory', 'Factory and capabilities'],
  ['ratings', 'Reviews'],
  ['opportunities', 'Business opportunities'],
];
const THEMES = [
  ['industrial', 'Industrial navy'],
  ['forest', 'Forest green'],
  ['ocean', 'Ocean blue'],
  ['clay', 'Clay orange'],
];

export default function PortfolioCustomizationEditor({ customization, portfolio, onSaved }) {
  const [theme, setTheme] = useState(customization?.theme || 'industrial');
  const [order, setOrder] = useState(() => {
    const current = customization?.sectionOrder || [];
    return [...current.filter((id) => DEFAULT_ORDER.includes(id)), ...DEFAULT_ORDER.filter((id) => !current.includes(id))];
  });
  const [hidden, setHidden] = useState(customization?.hiddenSections || []);
  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState((customization?.featuredProductIds || []).map(String));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/seller/portfolio/products?limit=100')
      .then((response) => response.json())
      .then((data) => { if (active && data.success) setProducts(data.products || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setTheme(customization?.theme || 'industrial');
    const current = customization?.sectionOrder || [];
    setOrder([...current.filter((id) => DEFAULT_ORDER.includes(id)), ...DEFAULT_ORDER.filter((id) => !current.includes(id))]);
    setHidden(customization?.hiddenSections || []);
    setFeatured((customization?.featuredProductIds || []).map(String));
  }, [customization]);

  const moveWithinPage = (id, direction, pageSections) => {
    setOrder((current) => {
      const pageOrder = current.filter((sectionId) => pageSections.includes(sectionId));
      const index = pageOrder.indexOf(id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= pageOrder.length) return current;
      [pageOrder[index], pageOrder[target]] = [pageOrder[target], pageOrder[index]];
      let nextIndex = 0;
      return current.map((sectionId) => pageSections.includes(sectionId) ? pageOrder[nextIndex++] : sectionId);
    });
  };

  const toggleHidden = (id) => {
    setHidden((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleFeatured = (id) => {
    setFeatured((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 4 ? [...current, id] : current);
  };

  const themeColors = {
    industrial: '#0F172A',
    forest: '#047857',
    ocean: '#1D4ED8',
    clay: '#C2410C',
  };
  const previewProducts = products.filter((product) => featured.includes(String(product._id)));
  const previewName = portfolio?.name || portfolio?.companyName || 'Your business name';

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('portfolioCustomization', JSON.stringify({ theme, sectionOrder: order, hiddenSections: hidden, featuredProductIds: featured }));
      const response = await fetch('/api/seller/portfolio', { method: 'PATCH', body: formData });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not save your storefront settings.');
      setMessage('Your storefront settings are saved.');
      onSaved?.();
    } catch (error) {
      setMessage(error.message || 'Could not save your storefront settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="seller-card" style={{ marginBottom: 24 }}>
      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'var(--sp-text)' }}>Customize your storefront</h3>
      <p style={{ margin: '0 0 18px', fontSize: 13, color: 'var(--sp-text-med)' }}>
        Choose a visual style, arrange sections across the Products and Home pages, and hide optional sections. Home, Products, and Contact stay available. QR scans open Products.
      </p>
      <label style={{ display: 'grid', gap: 6, maxWidth: 360, fontSize: 13, fontWeight: 650 }}>
        Theme
        <select className="seller-input" value={theme} onChange={(event) => setTheme(event.target.value)}>
          {THEMES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <h4 style={{ margin: '20px 0 8px', fontSize: 13 }}>Section order</h4>
      {[
        ['Products page', ['products', 'opportunities', 'ratings', 'contact']],
        ['Home page details', ['overview', 'factory']],
      ].map(([groupLabel, pageSections]) => {
        const groupOrder = order.filter((id) => pageSections.includes(id));
        return (
          <div key={groupLabel} style={{ marginBottom: 12 }}>
            <h5 style={{ margin: '10px 0 4px', fontSize: 12, color: 'var(--sp-text-med)' }}>{groupLabel}</h5>
            <ol style={{ margin: 0, paddingLeft: 22 }}>
              {groupOrder.map((id, index) => (
                <li key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '6px 0' }}>
                  <span>{SECTION_LABELS[id] || id[0].toUpperCase() + id.slice(1)}</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="seller-btn seller-btn-secondary" disabled={index === 0} onClick={() => moveWithinPage(id, -1, pageSections)} aria-label={`Move ${id} up`}>↑</button>
                    <button type="button" className="seller-btn seller-btn-secondary" disabled={index === groupOrder.length - 1} onClick={() => moveWithinPage(id, 1, pageSections)} aria-label={`Move ${id} down`}>↓</button>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        );
      })}
      <h4 style={{ margin: '20px 0 8px', fontSize: 13 }}>Optional sections</h4>
      <div style={{ display: 'grid', gap: 8 }}>
        {OPTIONAL_SECTIONS.map(([id, label]) => (
          <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={!hidden.includes(id)} onChange={() => toggleHidden(id)} />
            Show {label}
          </label>
        ))}
      </div>
      <h4 style={{ margin: '20px 0 8px', fontSize: 13 }}>Featured products (up to 4)</h4>
      {products.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--sp-text-med)' }}>Add an active product to feature it here.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {products.map((product) => {
            const id = String(product._id);
            return (
              <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <input type="checkbox" checked={featured.includes(id)} disabled={!featured.includes(id) && featured.length >= 4} onChange={() => toggleFeatured(id)} />
                <span>{product.name}</span>
              </label>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
        <button type="button" className="seller-btn seller-btn-primary" disabled={saving} onClick={save}>
          {saving ? 'Saving…' : 'Save storefront settings'}
        </button>
        {message && <span role="status" style={{ fontSize: 13, color: message.includes('saved') ? '#047857' : '#B91C1C' }}>{message}</span>}
      </div>
      <div style={{ marginTop: 24, padding: 16, border: '1px solid #E2E8F0', borderRadius: 14, background: '#F8FAFC' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13 }}>Buyer preview</h4>
        <div style={{ overflow: 'hidden', border: '1px solid #E2E8F0', borderRadius: 12, background: '#FFFFFF' }}>
          <div style={{ minHeight: 72, padding: 16, background: themeColors[theme], color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 12 }}>
            {portfolio?.logo ? <img src={portfolio.logo} alt="" style={{ width: 44, height: 44, borderRadius: 9, objectFit: 'cover', background: '#FFFFFF' }} /> : null}
            <div>
              <strong>{previewName}</strong>
              {portfolio?.address ? <div style={{ marginTop: 3, fontSize: 12, opacity: .86 }}>{portfolio.address}</div> : null}
            </div>
            {portfolio?.gstVerified ? <span style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: 99, background: '#ECFDF5', color: '#047857', fontSize: 11, fontWeight: 700 }}>GST Verified</span> : null}
          </div>
          <div style={{ padding: 14 }}>
            <strong style={{ fontSize: 13 }}>Products</strong>
            {previewProducts.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
                {previewProducts.map((product) => (
                  <div key={product._id} style={{ padding: 10, border: '1px solid #E2E8F0', borderRadius: 9 }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{product.name}</div>
                    <div style={{ marginTop: 4, color: '#64748B', fontSize: 11 }}>
                      {product.priceDisplayMode === 'on_request' || !product.price ? 'Price on request' : `₹${product.price}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p style={{ margin: '8px 0 0', color: '#64748B', fontSize: 12 }}>Choose active products above to see them in this preview.</p>}
            <div style={{ marginTop: 12, color: themeColors[theme], fontSize: 12, fontWeight: 700 }}>Home · Contact · Send RFQ</div>
          </div>
        </div>
      </div>
    </section>
  );
}
