'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Maximize2,
  FileText,
} from 'lucide-react';
import { resolveImageUrl } from '@/lib/image';
import ProductDetailModal from './ProductDetailModal';
import PortfolioImage from './PortfolioImage';
import { getPortfolioVerificationSignals } from '@/lib/portfolioTrust';
import { openProductInApp, trackPortfolioEvent } from '@/lib/portfolioAnalytics';

export default function ProductCatalogSection({ products = [], totalProducts = products.length, categories: initialCategories = [], seller }) {
  const [catalogProducts, setCatalogProducts] = useState(products);
  const [categories, setCategories] = useState(initialCategories);
  const [totalProductCount, setTotalProductCount] = useState(totalProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(totalProducts > products.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
  const [sampleModalProduct, setSampleModalProduct] = useState(null);
  const [sampleQty, setSampleQty] = useState('1 Sample Unit');
  const [customSampleQty, setCustomSampleQty] = useState('');
  const [sampleNotes, setSampleNotes] = useState('');
  const firstFilterEffect = useRef(true);

  useEffect(() => {
    setCatalogProducts(products);
    setCategories(initialCategories);
    setTotalProductCount(totalProducts);
    setCurrentPage(1);
    setHasMoreProducts(totalProducts > products.length);
  }, [products, totalProducts, initialCategories]);

  useEffect(() => {
    if (firstFilterEffect.current) {
      firstFilterEffect.current = false;
      return undefined;
    }
    if (!seller?.slug) return undefined;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingCatalog(true);
      setLoadMoreError('');
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      try {
        const response = await fetch(`/api/public/sellers/${encodeURIComponent(seller.slug)}/products?${params}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || 'Could not search products.');
        setCatalogProducts(Array.isArray(data.products) ? data.products : []);
        setCategories(Array.isArray(data.categories) ? data.categories : initialCategories);
        setTotalProductCount(Number(data.total) || 0);
        setCurrentPage(Number(data.page) || 1);
        setHasMoreProducts((Number(data.page) || 1) < (Number(data.totalPages) || 1));
      } catch (error) {
        if (error.name !== 'AbortError') setLoadMoreError(error.message || 'Could not search products.');
      } finally {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      }
    }, searchQuery.trim() ? 250 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [selectedCategory, searchQuery, seller?.slug, initialCategories]);

  const loadMoreProducts = async () => {
    if (loadingMore || !hasMoreProducts || !seller?.slug) return;
    setLoadingMore(true);
    setLoadMoreError('');
    try {
      const nextPage = currentPage + 1;
      const params = new URLSearchParams({ page: String(nextPage), limit: '20' });
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      const response = await fetch(`/api/public/sellers/${encodeURIComponent(seller.slug)}/products?${params}`, {
        cache: 'no-store',
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Could not load more products.');
      setTotalProductCount(Number(data.total) || 0);
      if (Array.isArray(data.categories)) setCategories(data.categories);
      const nextProducts = Array.isArray(data.products) ? data.products : [];
      setCatalogProducts((current) => {
        const currentIds = new Set(current.map((product) => String(product._id)));
        return [...current, ...nextProducts.filter((product) => !currentIds.has(String(product._id)))];
      });
      setCurrentPage(Number(data.page) || nextPage);
      setHasMoreProducts((Number(data.page) || nextPage) < (Number(data.totalPages) || 1));
    } catch (error) {
      console.error('[portfolio] Failed to load more products:', error.message);
      setLoadMoreError('Could not load more products. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  // Catalogue link (opens PDF or Image brochure in a new tab)
  const catalogueUrl = useMemo(() => {
    if (!seller) return null;
    const cat = seller.catalogue;
    const sellerId = seller._id || seller.id || seller.slug;
    if ((cat?.pdfUrl || cat?.storageUrl) && sellerId) {
      return resolveImageUrl(`/api/manufacturer/catalogue-pdf/${sellerId}`);
    }
    return null;
  }, [seller]);

  const filteredProducts = catalogProducts;

  const handleOpenSampleModal = (product) => {
    setSampleModalProduct(product);
    setSampleQty('1 Sample Unit');
    setCustomSampleQty('');
    setSampleNotes('');
  };

  const handleSendSampleRequest = (e) => {
    e.preventDefault();
    const requirement = [
      `Sample request for ${sampleModalProduct.name}`,
      `Requested quantity: ${sampleQty === 'Custom Quantity' ? customSampleQty.trim() || 'To be confirmed' : sampleQty}`,
      sampleNotes.trim() ? `Requirements: ${sampleNotes.trim()}` : '',
    ].filter(Boolean).join('\n');
    window.dispatchEvent(new CustomEvent('xindia:portfolio-rfq-prefill', {
      detail: { requirement },
    }));
    setSampleModalProduct(null);
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
              <span>Seller catalogue</span>
            </div>
            <h2 className="portfolio-section-title">Products from {seller?.name || 'this seller'}</h2>
            <div className="portfolio-product-seller-trust">
              {getPortfolioVerificationSignals(seller).map(({ id, title, icon: Icon }) => (
                <span key={id}><Icon size={13} /> {title}</span>
              ))}
            </div>
            <p className="portfolio-section-desc">
              Product information and order details provided by this seller.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {catalogueUrl && (
              <a
                href={catalogueUrl}
                onClick={() => trackPortfolioEvent(seller?.slug, 'catalogue_open')}
                target="_blank"
                rel="noopener noreferrer"
                className="portfolio-catalogue-badge-link"
                title="View Full Product Catalogue"
              >
                <FileText size={13} />
                <span>View Catalogue ↗</span>
              </a>
            )}
            <a href="#contact" className="portfolio-rfq-badge-link">
              <Sparkles size={13} />
              <span>Custom Batch RFQ</span>
            </a>
          </div>
        </div>

        {/* ─── Search & Category Filters Bar ──────────────────────────────────── */}
        <div className="portfolio-catalog-toolbar">
          <div className="portfolio-search-box">
            <Search size={16} className="portfolio-search-icon" />
            <input
              type="text"
              aria-label="Search products by name or description"
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

          {categories.length > 0 && (
            <div className="portfolio-category-tabs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`portfolio-category-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`portfolio-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Product Cards Grid ────────────────────────────────────────────── */}
        {(!filteredProducts || filteredProducts.length === 0) ? (
          <div className="portfolio-empty-state">
            <Package size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
            <div>
              {loadingCatalog
                ? 'Searching products…'
                : searchQuery.trim() || selectedCategory !== 'ALL'
                  ? 'No products found matching your search or category.'
                : `${seller?.name || 'This seller'} has not added products yet.`}
            </div>
            {catalogProducts.length === 0 && !hasMoreProducts && (
              <a href="#contact" className="portfolio-rfq-badge-link" style={{ marginTop: 14 }}>
                Contact seller
              </a>
            )}
            {hasMoreProducts && (
              <button type="button" className="portfolio-rfq-badge-link" style={{ marginTop: 14 }} onClick={loadMoreProducts} disabled={loadingMore}>
                {loadingMore ? 'Loading products…' : 'Load more products'}
              </button>
            )}
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
              const resolvedImg = resolveImageUrl(p.imageUrl || p.images?.[0]);

              return (
                <motion.article
                  key={p._id}
                  className="portfolio-product-card"
                  variants={itemVariants}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.14 }}
                >
                  <div className="portfolio-product-image-frame">
                    <button
                      type="button"
                      className="portfolio-product-image-open"
                      onClick={() => openProductInApp(p._id, seller?.slug)}
                      aria-label={`Open ${p.name} in XINDIA`}
                    >
                      <PortfolioImage
                        src={resolvedImg}
                        alt=""
                        className="portfolio-product-image"
                        placeholderLabel="Product image not provided"
                        loading="lazy"
                      />
                      <span className="portfolio-product-view-badge">
                        <Maximize2 size={12} />
                        <span>Open product</span>
                      </span>
                    </button>

                    {p.deliveryTimeConfirmed && p.deliveryTime && (
                      <div className="portfolio-product-dispatch-pill">
                        <Zap size={11} />
                        <span>{p.deliveryTime}</span>
                      </div>
                    )}

                    {p.samplePolicy?.available && (
                      <button
                        type="button"
                        className="portfolio-sample-overlay-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenSampleModal(p);
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Request Sample</span>
                      </button>
                    )}
                  </div>

                  <div className="portfolio-product-body">
                    <h3 className="portfolio-product-name" title={p.name}>
                      <button
                        type="button"
                        className="portfolio-product-name-btn"
                        onClick={() => openProductInApp(p._id, seller?.slug)}
                        aria-label={`Open ${p.name} in XINDIA`}
                      >
                        {p.name}
                      </button>
                    </h3>

                    <div className="portfolio-product-price-row">
                      <div className="portfolio-product-price">
                        {p.priceDisplayMode === 'on_request'
                          ? 'Price on request'
                          : p.priceDisplayMode === 'range' && p.priceRange
                            ? p.priceRange
                            : p.price ?? p.minPrice
                              ? `₹${p.price ?? p.minPrice}`
                              : 'Price on request'}{' '}
                        {p.unit ? <span className="portfolio-product-unit">/ {p.unit}</span> : ''}
                      </div>
                      <span className="portfolio-product-moq">
                        {p.moq ? `MOQ: ${p.moq}` : 'MOQ not specified'}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailProduct(p);
                        }}
                      >
                        Details & RFQ
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}

        {loadingCatalog && filteredProducts.length > 0 && <p role="status" className="portfolio-catalog-status">Updating products…</p>}
        {hasMoreProducts && filteredProducts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <button type="button" className="portfolio-rfq-badge-link" onClick={loadMoreProducts} disabled={loadingMore}>
              {loadingMore ? 'Loading products…' : `Load more products (${Math.max(0, totalProductCount - catalogProducts.length)} remaining)`}
            </button>
          </div>
        )}
        {loadMoreError && <p role="status" style={{ textAlign: 'center', color: '#B91C1C', marginTop: 12 }}>{loadMoreError}</p>}
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
                <div>
                  <div className="portfolio-modal-price">
                    {sampleModalProduct.samplePolicy?.price > 0
                      ? `Sample price: ₹${sampleModalProduct.samplePolicy.price}`
                      : 'Ask seller for sample pricing'}
                  </div>
                  <div className="portfolio-modal-moq">{sampleModalProduct.moq ? `Minimum order: ${sampleModalProduct.moq}` : 'Contact the seller to confirm minimum order.'}</div>
                  {sampleModalProduct.samplePolicy?.leadTimeDays && (
                    <div className="portfolio-modal-delivery">Seller-provided sample dispatch estimate: {sampleModalProduct.samplePolicy.leadTimeDays} days</div>
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

              {sampleQty === 'Custom Quantity' && (
                <div className="portfolio-form-group">
                  <label className="portfolio-form-label" htmlFor="portfolio-custom-sample-quantity">Preferred quantity</label>
                  <input
                    id="portfolio-custom-sample-quantity"
                    className="portfolio-form-input"
                    value={customSampleQty}
                    onChange={(event) => setCustomSampleQty(event.target.value)}
                    maxLength={50}
                    placeholder="Enter your preferred quantity"
                  />
                </div>
              )}

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

              <div className="portfolio-modal-actions">
                <button type="submit" className="portfolio-modal-submit-btn">
                  <MessageSquare size={16} />
                  <span>Continue to RFQ form</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Comprehensive Product Card & Carousel Modal ────────────── */}
      <ProductDetailModal
        product={selectedDetailProduct}
        seller={seller}
        isOpen={Boolean(selectedDetailProduct)}
        onClose={() => setSelectedDetailProduct(null)}
      />
    </section>
  );
}
