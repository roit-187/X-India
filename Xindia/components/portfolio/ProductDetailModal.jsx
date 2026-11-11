'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Package,
  Zap,
  Tag,
  ShieldCheck,
  Layers,
  FileText,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Boxes,
  Palette,
  Info,
} from 'lucide-react';
import { resolveImageUrl } from '@/lib/image';
import { openProductInApp } from '@/lib/portfolioAnalytics';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import PortfolioImage from './PortfolioImage';

export default function ProductDetailModal({ product, seller, isOpen, onClose, initialRequestSample = false }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Collect and deduplicate all images
  const allImages = useMemo(() => {
    if (!product) return [];
    const list = [];
    if (product.imageUrl) list.push(product.imageUrl);
    if (Array.isArray(product.images)) {
      product.images.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    return [...new Set(list.map((img) => resolveImageUrl(img)).filter(Boolean))];
  }, [product]);

  // Reset states when opening a new product
  useEffect(() => {
    if (isOpen) {
      setActiveImgIndex(0);
      setLightboxOpen(false);
      setCopiedLink(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      } else if (e.key === 'ArrowRight' && allImages.length > 0) {
        setActiveImgIndex((prev) => (prev + 1) % allImages.length);
      } else if (e.key === 'ArrowLeft' && allImages.length > 0) {
        setActiveImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxOpen, allImages.length, onClose]);

  if (!isOpen || !product) return null;

  const currentImg = allImages[activeImgIndex] || '';

  const handlePrevImg = (e) => {
    e?.stopPropagation();
    if (allImages.length > 0) setActiveImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImg = (e) => {
    e?.stopPropagation();
    if (allImages.length > 0) setActiveImgIndex((prev) => (prev + 1) % allImages.length);
  };

  const sellerName = seller?.name || seller?.companyName || 'Seller';
  const handleOpenProduct = () => {
    openProductInApp(product._id || product.id, seller?.slug);
  };

  const handleStartRFQ = () => {
    const productLabel = `${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}`;
    window.dispatchEvent(new CustomEvent('xindia:portfolio-rfq-prefill', {
      detail: { requirement: productLabel },
    }));
    onClose();
  };

  const handleCopyProductLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const cleanOrigin = window.location.origin;
      const productLink = `${cleanOrigin}/p/${seller?.slug || ''}#products`;
      navigator.clipboard.writeText(productLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const custCaps = product.customizationCapabilities || {};
  const hasCustomization =
    custCaps.hasLogoPrinting ||
    custCaps.hasCustomPackaging ||
    custCaps.hasCustomDesign ||
    product.customization === 'YES';

  const specsList = Array.isArray(product.specifications) ? product.specifications : [];
  const dynamicAttrs = product.dynamicAttributes ? Object.entries(product.dynamicAttributes) : [];

  return (
    <>
      <div className="product-modal-backdrop" onClick={onClose}>
        <div
          className="product-modal-container"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-product-title"
        >
          {/* Close Button */}
          <button
            type="button"
            className="product-modal-close-btn"
            onClick={onClose}
            aria-label="Close product details"
          >
            <X size={20} />
          </button>

          <div className="product-modal-content-grid">
            {/* ─── LEFT COLUMN: Visual Media Showcase & Carousel ───────── */}
            <div className="product-modal-media-col">
              <div className="product-modal-main-image-wrap">
                <PortfolioImage
                  src={currentImg}
                  alt={product.name}
                  className="product-modal-main-image"
                  placeholderLabel="Product image not provided"
                  onClick={currentImg ? () => setLightboxOpen(true) : undefined}
                />

                {/* Click to Expand Lightbox Badge */}
                {currentImg && <button
                  type="button"
                  className="product-modal-zoom-badge"
                  onClick={() => setLightboxOpen(true)}
                  title="Click to view full-size photo"
                >
                  <Maximize2 size={13} />
                  <span>Tap for full photo</span>
                </button>}

                {/* Carousel Arrow Controls */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="product-modal-arrow-btn left"
                      onClick={handlePrevImg}
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      type="button"
                      className="product-modal-arrow-btn right"
                      onClick={handleNextImg}
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Counter pill */}
                    <div className="product-modal-counter-pill">
                      {activeImgIndex + 1} / {allImages.length}
                    </div>
                  </>
                )}

                {/* Dispatch pill overlay */}
                {product.deliveryTimeConfirmed && product.deliveryTime && (
                  <div className="product-modal-dispatch-badge">
                    <Zap size={12} />
                    <span>Dispatch: {product.deliveryTime}</span>
                  </div>
                )}
              </div>

              {/* Thumbnails Row */}
              {allImages.length > 1 && (
                <div className="product-modal-thumbs-row">
                  {allImages.map((thumb, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`product-modal-thumb-btn ${idx === activeImgIndex ? 'active' : ''}`}
                      onClick={() => setActiveImgIndex(idx)}
                    >
                      <PortfolioImage src={thumb} alt="" className="product-modal-thumb-img" placeholderLabel="Product image not provided" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Video Tour */}
              {product.videoUrl && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#EF4444' }}></span>
                    Product Demonstration / Video Tour
                  </div>
                  <YouTubePlayer videoUrl={product.videoUrl} title={`${product.name} Video Tour`} showThumbnailFirst={true} />
                </div>
              )}

              {(seller?.verified || product.pricingTerms) && (
                <div className="product-modal-trust-card">
                  {seller?.verified && (
                    <div className="product-modal-trust-item">
                      <ShieldCheck size={18} color="#10B981" />
                      <div>
                        <div className="trust-item-title">XINDIA-verified manufacturer</div>
                        <div className="trust-item-sub">Verification status is provided by XINDIA.</div>
                      </div>
                    </div>
                  )}
                  {product.pricingTerms && (
                    <div className="product-modal-trust-item">
                      <FileText size={18} color="#3B82F6" />
                      <div>
                        <div className="trust-item-title">Commercial terms</div>
                        <div className="trust-item-sub">{product.pricingTerms}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ─── RIGHT COLUMN: Specifications & Commercial Details ────── */}
            <div className="product-modal-info-col">
              {/* Category & Brand Eyebrow */}
              <div className="product-modal-eyebrow-row">
                <span className="product-modal-cat-pill">
                  {product.category?.name || product.customCategoryLabel || product.category || 'Category not specified'}
                </span>
                {product.brandName && product.brandName !== 'Unbranded / OEM' && (
                  <span className="product-modal-brand-pill">
                    Brand: <strong>{product.brandName}</strong>
                  </span>
                )}
                {product.condition && (
                  <span className="product-modal-condition-pill">{product.condition}</span>
                )}
              </div>

              {/* Title */}
              <h2 id="modal-product-title" className="product-modal-title">
                {product.name}
              </h2>

              {/* Price & MOQ Headline Row */}
              <div className="product-modal-price-card">
                <div className="product-modal-price-block">
                  <div className="product-modal-price-label">Factory Wholesale Price</div>
                  <div className="product-modal-price-val">
                    {product.priceDisplayMode === 'on_request'
                      ? 'Price on request'
                      : product.priceDisplayMode === 'range' && product.priceRange
                        ? product.priceRange
                        : product.price !== null && product.price !== undefined
                          ? `₹${product.price}`
                          : 'Contact seller for price'}
                    {product.unit && product.priceDisplayMode !== 'on_request' ? <span className="product-modal-price-unit"> / {product.unit}</span> : null}
                  </div>
                  <div className="product-modal-tax-note">
                    {product.isGstInclusive === true ? 'GST inclusive' : product.isGstInclusive === false ? 'GST not included' : 'GST details not provided'}
                  </div>
                </div>

                <div className="product-modal-moq-block">
                  <div className="product-modal-moq-label">Minimum Order Qty</div>
                  <div className="product-modal-moq-val">
                    {product.moq
                      ? <>{product.moq} {product.unit || ''}</>
                      : 'Not specified'}
                  </div>
                  {product.countryOfOrigin && (
                    <div className="product-modal-origin-note">Made in {product.countryOfOrigin}</div>
                  )}
                </div>
              </div>

              {/* Volume Discount Tiers (if configured) */}
              {Array.isArray(product.tieredPrices) && product.tieredPrices.length > 0 && (
                <div className="product-modal-section">
                  <div className="product-modal-section-heading">
                    <Layers size={14} color="var(--p-primary)" />
                    <span>Volume Batch Pricing</span>
                  </div>
                  <div className="product-modal-tier-table">
                    <div className="product-modal-tier-header">
                      <span>Order Quantity</span>
                      <span>Unit Price</span>
                    </div>
                    {product.tieredPrices.map((tier, idx) => (
                      <div key={idx} className="product-modal-tier-row">
                        <span className="tier-qty">≥ {tier.minQty} {product.unit || 'Units'}</span>
                        <span className="tier-price">₹{tier.price} / {product.unit || 'Unit'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Policy */}
              {product.samplePolicy?.available && (
                <div className="product-modal-sample-banner">
                  <div className="sample-banner-left">
                    <Sparkles size={16} color="#D97706" />
                    <div>
                      <div className="sample-banner-title">Sample Units Available</div>
                      <div className="sample-banner-sub">
                        {product.samplePolicy.price !== undefined && product.samplePolicy.price !== null
                          ? <>Sample price: <strong>₹{product.samplePolicy.price}</strong></>
                          : null}
                        {product.samplePolicy.price !== undefined && product.samplePolicy.price !== null && product.samplePolicy.leadTimeDays
                          ? ' • '
                          : null}
                        {product.samplePolicy.leadTimeDays
                          ? <>Dispatch in <strong>{product.samplePolicy.leadTimeDays} days</strong></>
                          : null}
                        {!product.samplePolicy.price && !product.samplePolicy.leadTimeDays
                          ? 'Contact the seller for sample pricing and timing.'
                          : null}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="product-modal-sample-btn"
                    onClick={handleOpenProduct}
                  >
                    Ask about sample in XINDIA
                  </button>
                </div>
              )}

              {/* Customization & OEM Capabilities */}
              {hasCustomization && (
                <div className="product-modal-section">
                  <div className="product-modal-section-heading">
                    <Palette size={14} color="var(--p-primary)" />
                    <span>OEM / Customization Options</span>
                  </div>
                  <div className="product-modal-cust-chips">
                    {custCaps.hasLogoPrinting && (
                      <div className="cust-chip">
                        <Tag size={12} color="#2563EB" />
                        <span>Logo Printing {custCaps.logoMinOrderQty ? `(MOQ: ${custCaps.logoMinOrderQty})` : ''}</span>
                      </div>
                    )}
                    {custCaps.hasCustomPackaging && (
                      <div className="cust-chip">
                        <Package size={12} color="#059669" />
                        <span>Custom Retail Packaging {custCaps.packagingMinOrderQty ? `(MOQ: ${custCaps.packagingMinOrderQty})` : ''}</span>
                      </div>
                    )}
                    {custCaps.hasCustomDesign && (
                      <div className="cust-chip">
                        <Boxes size={12} color="#7C3AED" />
                        <span>Full Custom Mould / Design (OEM)</span>
                      </div>
                    )}
                    {!custCaps.hasLogoPrinting && !custCaps.hasCustomPackaging && !custCaps.hasCustomDesign && (
                      <div className="cust-chip">
                        <CheckCircle2 size={12} color="#059669" />
                        <span>OEM & Custom Specifications Accepted</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Technical Specifications */}
              {(specsList.length > 0 || dynamicAttrs.length > 0) && (
                <div className="product-modal-section">
                  <div className="product-modal-section-heading">
                    <FileText size={14} color="var(--p-primary)" />
                    <span>Technical Specifications</span>
                  </div>
                  <div className="product-modal-specs-grid">
                    {specsList.map((spec, idx) => (
                      <div key={`spec-${idx}`} className="spec-row">
                        <span className="spec-label">{spec.name || spec.key}</span>
                        <span className="spec-value">{spec.value}</span>
                      </div>
                    ))}
                    {dynamicAttrs.map(([key, val], idx) => (
                      <div key={`dyn-${idx}`} className="spec-row">
                        <span className="spec-label">{key}</span>
                        <span className="spec-value">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="product-modal-section">
                  <div className="product-modal-section-heading">
                    <Info size={14} color="var(--p-primary)" />
                    <span>Product Overview</span>
                  </div>
                  <p className="product-modal-desc">{product.description}</p>
                </div>
              )}

              {/* Packaging & Logistics Details */}
              {product.packagingDetails && (product.packagingDetails.unitsPerMasterCarton || product.packagingDetails.cartonDimensions) && (
                <div className="product-modal-section">
                  <div className="product-modal-section-heading">
                    <Boxes size={14} color="var(--p-primary)" />
                    <span>Packaging & Master Carton Specs</span>
                  </div>
                  <div className="product-modal-specs-grid">
                    {product.packagingDetails.packagingType && (
                      <div className="spec-row">
                        <span className="spec-label">Packaging Type</span>
                        <span className="spec-value">{product.packagingDetails.packagingType}</span>
                      </div>
                    )}
                    {product.packagingDetails.unitsPerMasterCarton > 0 && (
                      <div className="spec-row">
                        <span className="spec-label">Units Per Carton</span>
                        <span className="spec-value">{product.packagingDetails.unitsPerMasterCarton} {product.unit}s</span>
                      </div>
                    )}
                    {product.packagingDetails.cartonDimensions && (
                      <div className="spec-row">
                        <span className="spec-label">Dimensions</span>
                        <span className="spec-value">{product.packagingDetails.cartonDimensions}</span>
                      </div>
                    )}
                    {product.packagingDetails.grossWeightKg > 0 && (
                      <div className="spec-row">
                        <span className="spec-label">Gross Weight</span>
                        <span className="spec-value">{product.packagingDetails.grossWeightKg} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons Bar */}
              <div className="product-modal-actions-bar">
                <button
                  type="button"
                  className="product-modal-primary-inquire-btn"
                  onClick={handleOpenProduct}
                >
                  <ExternalLink size={16} />
                  <span>Open product in XINDIA</span>
                </button>

                <a
                  href="#contact"
                  className="product-modal-rfq-btn"
                  onClick={handleStartRFQ}
                >
                  <Sparkles size={15} />
                  <span>Send Formal RFQ</span>
                </a>

                <button
                  type="button"
                  className="product-modal-share-btn"
                  onClick={handleCopyProductLink}
                  title="Copy link to product"
                >
                  {copiedLink ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FULLSCREEN LIGHTBOX ────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="product-lightbox-backdrop" onClick={() => setLightboxOpen(false)}>
          <div className="product-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="product-lightbox-close"
              onClick={() => setLightboxOpen(false)}
              aria-label="Close fullscreen view"
            >
              <X size={24} />
            </button>

            {/* Lightbox arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-lightbox-nav prev"
                  onClick={handlePrevImg}
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="product-lightbox-nav next"
                  onClick={handleNextImg}
                  aria-label="Next photo"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <PortfolioImage src={currentImg} alt={product.name} className="product-lightbox-img" placeholderLabel="Product image not provided" />

            <div className="product-lightbox-footer">
              <span>{product.name}</span>
              {allImages.length > 1 && (
                <span>Photo {activeImgIndex + 1} of {allImages.length}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
