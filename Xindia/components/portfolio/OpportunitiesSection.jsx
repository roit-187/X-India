'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Clock,
  Package,
  Layers,
  CheckCircle2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  DollarSign,
  BarChart3,
  ShieldCheck,
  Tag,
  Quote,
} from 'lucide-react';
import { resolveImageUrl, FALLBACK_FACTORY_IMAGE } from '@/lib/image';
import YouTubePlayer from '@/components/common/YouTubePlayer';

export default function OpportunitiesSection({ opportunities = [], seller }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [lightboxList, setLightboxList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Hide entire section if no opportunities have been added
  if (!opportunities || opportunities.length === 0) return null;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const openLightbox = (imgUrl, allImages = []) => {
    const list = allImages.length > 0 ? allImages : [imgUrl];
    const idx = Math.max(0, list.indexOf(imgUrl));
    setLightboxList(list);
    setLightboxIndex(idx);
    setSelectedImage(imgUrl);
  };

  const handlePrevImg = (e) => {
    e?.stopPropagation();
    if (lightboxList.length <= 1) return;
    const nextIdx = (lightboxIndex - 1 + lightboxList.length) % lightboxList.length;
    setLightboxIndex(nextIdx);
    setSelectedImage(lightboxList[nextIdx]);
  };

  const handleNextImg = (e) => {
    e?.stopPropagation();
    if (lightboxList.length <= 1) return;
    const nextIdx = (lightboxIndex + 1) % lightboxList.length;
    setLightboxIndex(nextIdx);
    setSelectedImage(lightboxList[nextIdx]);
  };

  const handleInquireOpportunity = (op) => {
    const whatsappNum = seller.whatsappNumber || seller.businessPhone || seller.buyerContactPhone;
    const sellerName = seller.name || seller.companyName || 'Verified Manufacturer';
    const cleanOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://xindia.live';
    const oppUrl = `${cleanOrigin}/p/${seller.slug || ''}#opportunities`;

    const msg = encodeURIComponent(
      `Hello ${sellerName},\nI am interested in partnering on the contract manufacturing opportunity: "${op.title}".\n\n• Estimated Capital: ₹${op.investment?.toLocaleString('en-IN') || '0'}\n• Profit Margin: ${op.profitRange || op.profitMargin || '30% – 50%'}\n• Minimum Batch (MOQ): ${op.moq || '100 Units'}\n• Launch Timeline: ${op.launchDays ? `${op.launchDays} days` : '7-10 days'}\n\nPlease share the contract terms, sample availability, and onboarding kit.\n\nSourced via XINDIA Showroom:\n${oppUrl}`
    );
    if (whatsappNum) {
      window.open(`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
    } else {
      window.location.href = '#contact';
    }
  };

  return (
    <section id="opportunities" className="portfolio-section">
      <div className="portfolio-container">
        {/* Section Header */}
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <Briefcase size={13} />
              <span>Contract Manufacturing & Distribution</span>
            </div>
            <h2 className="portfolio-section-title">Business & Contract Opportunities</h2>
            <p className="portfolio-section-desc">
              Turnkey production lines open for private-label brands, regional distributors, and strategic manufacturing partnerships.
            </p>
          </div>
        </div>

        {/* ─── Opportunities Grid ───────────────────────────────────────────── */}
        <motion.div
          className="portfolio-opportunities-list"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {opportunities.map((op) => {
            const mainImg = resolveImageUrl(op.imageUrl, FALLBACK_FACTORY_IMAGE);
            const productPhotos = Array.isArray(op.productPhotos)
              ? op.productPhotos.map((p) => resolveImageUrl(p, FALLBACK_FACTORY_IMAGE)).filter(Boolean)
              : [];
            const allOpportunityPhotos = [mainImg, ...productPhotos];
            const itemsOffered = Array.isArray(op.itemsOffered) ? op.itemsOffered : [];
            const highlights = Array.isArray(op.highlights) ? op.highlights : [];

            return (
              <motion.div key={op._id} className="portfolio-opportunity-card enhanced" variants={itemVariants}>
                {/* ─── Top Media & Header Banner ────────────────────────────── */}
                <div className="portfolio-opportunity-media-banner">
                  <div
                    className="portfolio-opportunity-image-wrap"
                    onClick={() => openLightbox(mainImg, allOpportunityPhotos)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mainImg}
                      alt={op.title}
                      className="portfolio-opportunity-image"
                      loading="lazy"
                    />
                    <div className="portfolio-opportunity-zoom-badge">
                      <Maximize2 size={12} />
                      <span>Expand image</span>
                    </div>
                  </div>

                  <div className="portfolio-opportunity-meta-panel">
                    <div className="portfolio-opportunity-head-row">
                      <div>
                        <div className="portfolio-opportunity-status-pill">
                          <Sparkles size={11} />
                          <span>Active Turnkey Production Line</span>
                        </div>
                        <h3 className="portfolio-opportunity-title">{op.title}</h3>
                      </div>

                      <button
                        type="button"
                        className="portfolio-opportunity-inquire-btn"
                        onClick={() => handleInquireOpportunity(op)}
                      >
                        <MessageSquare size={14} />
                        <span>Inquire Line via WhatsApp</span>
                      </button>
                    </div>

                    <p className="portfolio-opportunity-desc">{op.description}</p>

                    {/* Key Commercial Figure Cards */}
                    <div className="portfolio-opportunity-figures">
                      <div className="figure-card">
                        <div className="portfolio-opportunity-figure-label">Estimated Capital</div>
                        <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: 'var(--p-primary)' }}>
                          ₹{op.investment?.toLocaleString('en-IN') || '0'}
                        </div>
                      </div>

                      {op.monthlyRevenue && (
                        <div className="figure-card">
                          <div className="portfolio-opportunity-figure-label">Expected Monthly Rev</div>
                          <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: '#059669' }}>
                            ₹{op.monthlyRevenue?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}

                      <div className="figure-card">
                        <div className="portfolio-opportunity-figure-label">Profit Margin</div>
                        <div className="portfolio-opportunity-figure-value" style={{ color: '#059669' }}>
                          {op.profitRange || op.profitMargin || '30% – 50%'}
                        </div>
                      </div>

                      <div className="figure-card">
                        <div className="portfolio-opportunity-figure-label">Minimum Batch (MOQ)</div>
                        <div className="portfolio-opportunity-figure-value portfolio-mono">
                          {op.moq || '100'} Units
                        </div>
                      </div>

                      <div className="figure-card">
                        <div className="portfolio-opportunity-figure-label">Launch Turnaround</div>
                        <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: '#2563EB' }}>
                          {op.launchDays ? `${op.launchDays} days` : '7-10 days'}
                        </div>
                      </div>

                      {op.breakEvenTime && (
                        <div className="figure-card">
                          <div className="portfolio-opportunity-figure-label">Break-Even Time</div>
                          <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: '#7C3AED' }}>
                            {op.breakEvenTime}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ─── Distinct Product Photos Gallery (Clickable into Lightbox) ── */}
                {productPhotos.length > 0 && (
                  <div className="portfolio-opp-products-gallery">
                    <div className="portfolio-opp-subheading">
                      <Package size={13} color="var(--p-primary)" />
                      <span>Product Samples & Pack Variants in this Line ({productPhotos.length} photos)</span>
                      <span className="subheading-hint">Tap any photo to open full resolution</span>
                    </div>

                    <div className="portfolio-opp-photos-strip">
                      {productPhotos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          className="portfolio-opp-thumb-card"
                          onClick={() => openLightbox(photoUrl, allOpportunityPhotos)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoUrl}
                            alt={`Product sample ${pIdx + 1}`}
                            className="portfolio-opp-thumb-img"
                            loading="lazy"
                          />
                          <div className="portfolio-opp-thumb-overlay">
                            <Maximize2 size={13} color="#FFFFFF" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Items Offered & Deliverables Included ───────────────── */}
                {itemsOffered.length > 0 && (
                  <div className="portfolio-opp-deliverables-row">
                    <div className="portfolio-opp-subheading">
                      <Layers size={13} color="var(--p-primary)" />
                      <span>Production Scope & Deliverables Included:</span>
                    </div>
                    <div className="portfolio-opp-chips-wrap">
                      {itemsOffered.map((item, iIdx) => (
                        <span key={iIdx} className="portfolio-opp-chip">
                          <CheckCircle2 size={11} color="#10B981" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Market & Financial Insights (if available in DB) ─────── */}
                {(op.landedCost || op.sellingPrice || op.marketSizeVal || op.marketCagr || highlights.length > 0) && (
                  <div className="portfolio-opp-analysis-grid">
                    {/* Financial Economics Box */}
                    {(op.landedCost || op.sellingPrice || op.founderEarnings) && (
                      <div className="opp-analysis-card">
                        <div className="opp-analysis-title">
                          <DollarSign size={14} color="#10B981" />
                          <span>Unit Economics</span>
                        </div>
                        <div className="opp-economics-rows">
                          {op.landedCost && (
                            <div className="opp-econ-row">
                              <span>Estimated Unit Landed Cost:</span>
                              <strong>₹{op.landedCost}</strong>
                            </div>
                          )}
                          {op.sellingPrice && (
                            <div className="opp-econ-row">
                              <span>Target Market Selling Price:</span>
                              <strong>₹{op.sellingPrice}</strong>
                            </div>
                          )}
                          {op.founderEarnings && (
                            <div className="opp-econ-row highlight">
                              <span>Projected Net Earnings:</span>
                              <strong>{op.founderEarnings}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Market Opportunity & Demand */}
                    {(op.marketSizeVal || op.marketCagr || op.peakSeason) && (
                      <div className="opp-analysis-card">
                        <div className="opp-analysis-title">
                          <BarChart3 size={14} color="#3B82F6" />
                          <span>Market Landscape</span>
                        </div>
                        <div className="opp-economics-rows">
                          {op.marketSizeVal && (
                            <div className="opp-econ-row">
                              <span>Total Addressable Market:</span>
                              <strong>{op.marketSizeVal}</strong>
                            </div>
                          )}
                          {op.marketCagr && (
                            <div className="opp-econ-row">
                              <span>Demand Growth Rate:</span>
                              <strong>{op.marketCagr} CAGR</strong>
                            </div>
                          )}
                          {op.peakSeason && (
                            <div className="opp-econ-row">
                              <span>Peak Sales Season:</span>
                              <strong>{op.peakSeason}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Highlights Bullets */}
                    {highlights.length > 0 && (
                      <div className="opp-analysis-card full-width">
                        <div className="opp-analysis-title">
                          <CheckCircle2 size={14} color="var(--p-primary)" />
                          <span>Strategic Manufacturing Highlights</span>
                        </div>
                        <ul className="opp-highlights-list">
                          {highlights.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Founder Note / Quote ──────────────────────────────────── */}
                {op.founderQuote && (
                  <div className="portfolio-opp-founder-card">
                    <Quote size={20} color="var(--p-primary)" className="founder-quote-icon" />
                    <div>
                      <p className="founder-quote-text">“{op.founderQuote}”</p>
                      <div className="founder-quote-author">
                        <strong>{op.founderName || seller.companyOwner || seller.name}</strong>
                        {op.founderRole && <span> — {op.founderRole}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Video Tour ────────────────────────────────────────────── */}
                {op.videoUrl && (
                  <div className="portfolio-opp-video-card">
                    <div className="portfolio-opp-subheading" style={{ marginBottom: 10 }}>
                      <Video size={14} color="var(--p-primary)" />
                      <span>Production Line Video Demonstration</span>
                    </div>
                    <YouTubePlayer videoUrl={op.videoUrl} title={op.title} showThumbnailFirst />
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* ─── Fullscreen Photo Lightbox ──────────────────────────────────────── */}
      {selectedImage && (
        <div className="product-lightbox-backdrop" onClick={() => setSelectedImage(null)}>
          <div className="product-lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="product-lightbox-close"
              onClick={() => setSelectedImage(null)}
              aria-label="Close image"
            >
              <X size={24} />
            </button>

            {lightboxList.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-lightbox-nav prev"
                  onClick={handlePrevImg}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  className="product-lightbox-nav next"
                  onClick={handleNextImg}
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt="Contract opportunity media" className="product-lightbox-img" />

            {lightboxList.length > 1 && (
              <div className="product-lightbox-footer">
                <span>Contract Line Gallery</span>
                <span>Photo {lightboxIndex + 1} of {lightboxList.length}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
