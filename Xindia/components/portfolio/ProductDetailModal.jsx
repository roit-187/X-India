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
  Truck,
  Layers,
  FileText,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Boxes,
  Palette,
  Info,
} from 'lucide-react';
import { resolveImageUrl, FALLBACK_PRODUCT_IMAGE } from '@/lib/image';

export default function ProductDetailModal({ product, seller, isOpen, onClose, initialRequestSample = false }) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sampleRequested, setSampleRequested] = useState(false);

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
    const resolved = list.map((img) => resolveImageUrl(img, FALLBACK_PRODUCT_IMAGE)).filter(Boolean);
    return resolved.length > 0 ? resolved : [FALLBACK_PRODUCT_IMAGE];
  }, [product]);

  // Reset states when opening a new product
  useEffect(() => {
    if (isOpen) {
      setActiveImgIndex(0);
      setLightboxOpen(false);
      setCopiedLink(false);
      setSampleRequested(false);
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
      } else if (e.key === 'ArrowRight') {
        setActiveImgIndex((prev) => (prev + 1) % allImages.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxOpen, allImages.length, onClose]);

  if (!isOpen || !product) return null;

  const currentImg = allImages[activeImgIndex] || FALLBACK_PRODUCT_IMAGE;

  const handlePrevImg = (e) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImg = (e) => {
    e?.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % allImages.length);
  };

  const sellerName = seller?.name || seller?.companyName || 'Verified Manufacturer';
  const whatsappNum = seller?.whatsappNumber || seller?.businessPhone || seller?.buyerContactPhone || '';

  // WhatsApp Inquiry Handler
  const handleWhatsAppInquiry = (isSample = false) => {
    const rawNumber = whatsappNum.replace(/[^0-9]/g, '');
    const cleanOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://xindia.live';
    const pageUrl = `${cleanOrigin}/p/${seller?.slug || ''}#products`;

    let msg = '';
    if (isSample) {
      msg = `Hello ${sellerName},\nI would like to request a sample of "${product.name}".\n\n• Unit Price: ₹${product.price} / ${product.unit || 'Piece'}\n• Minimum Order: ${product.moq || 1} ${product.unit || 'Units'}\n• Dispatch Days: ${product.deliveryTime || '3-5 Days'}\n\nPlease share sample pricing and dispatch details.\n\nProduct Link: ${pageUrl}`;
    } else {
      msg = `Hello ${sellerName},\nI am interested in sourcing "${product.name}" from your direct factory catalog.\n\n• Quoted Price: ₹${product.price} / ${product.unit || 'Piece'}\n• Required Quantity (MOQ): ${product.moq || 1} ${product.unit || 'Units'}\n• Lead Time: ${product.deliveryTime || '3-5 Days'}\n\nPlease share commercial quotation, tiered rates, and delivery timeline.\n\nProduct Link: ${pageUrl}`;
    }

    if (rawNumber) {
      window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      window.location.href = '#contact';
      onClose();
    }
    setSampleRequested(true);
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImg}
                  alt={product.name}
                  className="product-modal-main-image"
                  onClick={() => setLightboxOpen(true)}
                />

                {/* Click to Expand Lightbox Badge */}
                <button
                  type="button"
                  className="product-modal-zoom-badge"
                  onClick={() => setLightboxOpen(true)}
                  title="Click to view full-size photo"
                >
                  <Maximize2 size={13} />
                  <span>Tap for full photo</span>
                </button>

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
                {product.deliveryTime && (
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt="" className="product-modal-thumb-img" />
                    </button>
                  ))}
                </div>
              )}

              {/* Verified Factory Guarantee Card */}
              <div className="product-modal-trust-card">
                <div className="product-modal-trust-item">
                  <ShieldCheck size={18} color="#10B981" />
                  <div>
                    <div className="trust-item-title">Verified Manufacturer Supply</div>
                    <div className="trust-item-sub">Direct factory contract, zero intermediary markup.</div>
                  </div>
                </div>
                <div className="product-modal-trust-item">
                  <Truck size={18} color="#3B82F6" />
                  <div>
                    <div className="trust-item-title">Pan-India / Global Freight</div>
                    <div className="trust-item-sub">{product.pricingTerms || 'EXW'} & Doorstep delivery options.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: Specifications & Commercial Details ────── */}
            <div className="product-modal-info-col">
              {/* Category & Brand Eyebrow */}
              <div className="product-modal-eyebrow-row">
                <span className="product-modal-cat-pill">
                  {product.category?.name || product.customCategoryLabel || product.category || 'Direct Industrial Supply'}
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
                    {product.priceDisplayMode === 'range' && product.priceRange
                      ? product.priceRange
                      : `₹${product.price}`}
                    <span className="product-modal-price-unit"> / {product.unit || 'Piece'}</span>
                  </div>
                  <div className="product-modal-tax-note">
                    {product.isGstInclusive ? 'GST Inclusive' : '+ 18% GST as applicable'}
                  </div>
                </div>

                <div className="product-modal-moq-block">
                  <div className="product-modal-moq-label">Minimum Order Qty</div>
                  <div className="product-modal-moq-val">
                    {product.moq || '100'} <span style={{ fontSize: 13, fontWeight: 500 }}>{product.unit || 'Units'}</span>
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
                        Sample Price: <strong>₹{product.samplePolicy.price || product.price}</strong> • Dispatch in{' '}
                        <strong>{product.samplePolicy.leadTimeDays || '3-5'} days</strong>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="product-modal-sample-btn"
                    onClick={() => handleWhatsAppInquiry(true)}
                  >
                    Request Sample
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
                  onClick={() => handleWhatsAppInquiry(false)}
                >
                  <MessageSquare size={16} />
                  <span>Inquire via WhatsApp</span>
                </button>

                <a
                  href="#contact"
                  className="product-modal-rfq-btn"
                  onClick={onClose}
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

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentImg} alt={product.name} className="product-lightbox-img" />

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
