'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Zap,
  Tag,
  Search,
  Sparkles,
  X,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';

export default function ProductCatalogSection({ products = [], seller }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sampleModalProduct, setSampleModalProduct] = useState(null);
  const [sampleQty, setSampleQty] = useState('1 Sample Unit');
  const [sampleNotes, setSampleNotes] = useState('');
  const [sampleSuccess, setSampleSuccess] = useState(false);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || (
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleOpenSampleModal = (product) => {
    setSampleModalProduct(product);
    setSampleQty('1 Sample Unit');
    setSampleNotes('');
    setSampleSuccess(false);
  };

  const handleSendSampleRequest = (e) => {
    e.preventDefault();
    const whatsappNum = seller.whatsappNumber || seller.businessPhone;
    const msg = encodeURIComponent(
      `Hello ${seller.name},\nI would like to request a sample of "${sampleModalProduct.name}".\n\n• Quantity: ${sampleQty}\n• Notes: ${sampleNotes || 'Standard specification'}\n\nPlease share the dispatch timeline and sample pricing.\n\nSourced via XINDIA Showroom.`
    );

    if (whatsappNum) {
      window.open(`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    }

    setSampleSuccess(true);
    setTimeout(() => {
      setSampleSuccess(false);
      setSampleModalProduct(null);
    }, 3000);
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="products" className="portfolio-section">
      <div className="portfolio-container">
        {/* Section Header */}
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <Package size={13} />
              <span>Direct Factory Supply</span>
            </div>
            <h2 className="portfolio-section-title">Products & Catalog Showroom</h2>
            <p className="portfolio-section-desc">
              Direct factory-priced products available for OEM manufacturing, private labeling, and bulk orders.
            </p>
          </div>

          <a href="#contact" className="portfolio-rfq-badge-link">
            <Sparkles size={13} />
            <span>Custom Batch RFQ</span>
          </a>
        </div>

        {/* ─── Search & Category Filters Bar ──────────────────────────────────── */}
        <div className="portfolio-catalog-toolbar">
          <div className="portfolio-search-box">
            <Search size={16} className="portfolio-search-icon" />
            <input
              type="text"
              placeholder="Search products by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="portfolio-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="portfolio-search-clear"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {categories.length > 1 && (
            <div className="portfolio-category-tabs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`portfolio-category-pill ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat === 'ALL' ? 'All Products' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product Cards Grid ────────────────────────────────────────────── */}
        {(!filteredProducts || filteredProducts.length === 0) ? (
          <div className="portfolio-empty-state">
            <Package size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
            <div>No products found matching your filter.</div>
          </div>
        ) : (
          <motion.div
            className="portfolio-product-grid"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              visible: { transition: { staggerChildren: 0.06 } }
            }}
          >
            {filteredProducts.map((p) => {
              const custOpts = p.customizationOptions || {};
              const hasLogo = custOpts.logoCustomization || custOpts.customLogo;
              const hasPkg = custOpts.packagingCustomization || custOpts.customPackaging;

              return (
                <motion.div
                  key={p._id}
                  className="portfolio-product-card"
                  variants={itemVariants}
                >
                  <div className="portfolio-product-image-frame">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=500&auto=format&fit=crop'}
                      alt={p.name}
                      className="portfolio-product-image"
                    />

                    {p.deliveryTime && (
                      <div className="portfolio-product-dispatch-pill">
                        <Zap size={11} />
                        <span>{p.deliveryTime}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      className="portfolio-sample-overlay-btn"
                      onClick={() => handleOpenSampleModal(p)}
                    >
                      <Sparkles size={12} />
                      <span>Request Sample</span>
                    </button>
                  </div>

                  <div className="portfolio-product-body">
                    <h3 className="portfolio-product-name" title={p.name}>
                      {p.name}
                    </h3>

                    <div className="portfolio-product-price-row">
                      <div className="portfolio-product-price">
                        {p.price} {p.unit ? <span className="portfolio-product-unit">/ {p.unit}</span> : ''}
                      </div>
                      <span className="portfolio-product-moq">
                        MOQ: {p.moq || '100 pcs'}
                      </span>
                    </div>

                    <div className="portfolio-product-card-footer">
                      <div className="portfolio-product-custom-tags">
                        {hasLogo && (
                          <span className="portfolio-custom-tag">
                            <Tag size={10} /> Logo
                          </span>
                        )}
                        {hasPkg && (
                          <span className="portfolio-custom-tag">
                            <Package size={10} /> Custom Pkg
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="portfolio-product-quick-rfq-btn"
                        onClick={() => handleOpenSampleModal(p)}
                      >
                        Sample / RFQ
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ─── Sample Request Modal ───────────────────────────────────────────── */}
      {sampleModalProduct && (
        <div className="portfolio-modal-backdrop" onClick={() => setSampleModalProduct(null)}>
          <div className="portfolio-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portfolio-modal-head">
              <div>
                <span className="portfolio-modal-eyebrow">Sample Request</span>
                <h3 className="portfolio-modal-title">{sampleModalProduct.name}</h3>
              </div>
              <button
                type="button"
                className="portfolio-modal-close"
                onClick={() => setSampleModalProduct(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendSampleRequest} className="portfolio-modal-form">
              <div className="portfolio-modal-product-summary">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleModalProduct.imageUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=150&auto=format&fit=crop'}
                  alt=""
                  className="portfolio-modal-thumb"
                />
                <div>
                  <div className="portfolio-modal-price">{sampleModalProduct.price}</div>
                  <div className="portfolio-modal-moq">Standard Bulk MOQ: {sampleModalProduct.moq || '100 pcs'}</div>
                  {sampleModalProduct.deliveryTime && (
                    <div className="portfolio-modal-delivery">Estimated Dispatch: {sampleModalProduct.deliveryTime}</div>
                  )}
                </div>
              </div>

              <div className="portfolio-form-group">
                <label className="portfolio-form-label">Sample Quantity Required</label>
                <select
                  className="portfolio-form-input"
                  value={sampleQty}
                  onChange={(e) => setSampleQty(e.target.value)}
                >
                  <option value="1 Sample Unit">1 Sample Unit (Prototype Check)</option>
                  <option value="2-3 Sample Units">2-3 Sample Units (Multi-variant test)</option>
                  <option value="Trial Batch (5-10 units)">Trial Batch (5-10 units)</option>
                  <option value="Custom Quantity">Custom Quantity</option>
                </select>
              </div>

              <div className="portfolio-form-group">
                <label className="portfolio-form-label">Customization / Requirements Note</label>
                <textarea
                  className="portfolio-form-textarea"
                  rows={3}
                  value={sampleNotes}
                  onChange={(e) => setSampleNotes(e.target.value)}
                  placeholder="e.g. Need logo printed on sample, specific color code, custom packaging test..."
                />
              </div>

              {sampleSuccess ? (
                <div className="portfolio-form-alert success">
                  <CheckCircle2 size={16} /> Opening WhatsApp chat with factory dispatch desk...
                </div>
              ) : (
                <div className="portfolio-modal-actions">
                  <button type="submit" className="portfolio-modal-submit-btn">
                    <MessageSquare size={16} />
                    <span>Send Sample Request via WhatsApp</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
