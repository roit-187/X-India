'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  FileCheck2,
  MapPin,
  Building2,
  Copy,
  Check,
  MessageSquare,
  Sparkles,
  Calendar,
  Users,
  Factory,
  Globe2,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PortfolioHero({ seller, slug }) {
  const [copied, setCopied] = useState(false);
  const verifiedDocs = seller.verifiedDocuments ? Object.keys(seller.verifiedDocuments) : [];
  const hasGst = seller.gstVerified || verifiedDocs.includes('gst');
  const hasIso = verifiedDocs.includes('iso') || (seller.certifications && seller.certifications.some(c => c.toLowerCase().includes('iso')));
  const hasMsme = verifiedDocs.includes('msme');

  const showroomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${slug}`
    : `https://xindia.market/p/${slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(showroomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappShareText = encodeURIComponent(
    `Check out our official digital showroom on XINDIA: ${seller.name} — Verified Indian Manufacturer:\n${showroomUrl}`
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const cleanExport = seller.exportPercentage ? seller.exportPercentage.replace(/%+$/, '') + '%' : null;

  return (
    <div className="portfolio-hero-wrapper">
      {/* ─── 1. Viral Seller Storefront URL & Share Bar ─────────────────────── */}
      <div className="portfolio-share-banner">
        <div className="portfolio-share-banner-inner">
          <div className="portfolio-share-url-pill">
            <span className="portfolio-share-badge">Official Showroom</span>
            <span className="portfolio-share-url-text">{showroomUrl}</span>
          </div>

          <div className="portfolio-share-actions">
            <button
              type="button"
              className="portfolio-share-btn"
              onClick={handleCopyLink}
              title="Copy showroom link to clipboard"
            >
              {copied ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <a
              href={`https://wa.me/?text=${whatsappShareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-share-btn whatsapp"
              title="Share showroom on WhatsApp"
            >
              <MessageSquare size={13} />
              <span>Share on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* ─── 2. Main Executive Digital Showroom Header ───────────────────────── */}
      <div className="portfolio-header">
        <div className="portfolio-hero-mesh" />
        <div className="portfolio-grid-overlay" />

        {seller.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seller.coverImage} alt="" className="portfolio-cover" />
        ) : (
          <div className="portfolio-cover-placeholder" />
        )}

        <motion.div
          className="portfolio-header-inner"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Logo Frame */}
          <motion.div variants={itemVariants} className="portfolio-logo-frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={seller.logo || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop'}
              alt={seller.name}
              className="portfolio-logo"
            />
            {seller.verified && (
              <div className="portfolio-logo-badge" title="Verified Manufacturer">
                <ShieldCheck size={14} />
              </div>
            )}
          </motion.div>

          {/* Content info */}
          <div className="portfolio-header-content">
            <motion.div variants={itemVariants} className="portfolio-name-row">
              <h1 className="portfolio-name">{seller.name}</h1>
              
              {seller.verified && (
                <span className="portfolio-verified-badge">
                  <Sparkles size={13} />
                  Verified Manufacturer
                </span>
              )}
              {hasGst && (
                <span className="portfolio-trust-badge">
                  <FileCheck2 size={12} color="#10B981" />
                  GSTIN Verified
                </span>
              )}
              {hasIso && (
                <span className="portfolio-trust-badge">
                  <Award size={12} color="#F59E0B" />
                  ISO Certified
                </span>
              )}
              {hasMsme && (
                <span className="portfolio-trust-badge">
                  <ShieldCheck size={12} color="#60A5FA" />
                  MSME Registered
                </span>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="portfolio-header-tags">
              {seller.businessType && (
                <span className="portfolio-badge-pill">
                  <Building2 size={12} style={{ marginRight: 4 }} />
                  {seller.businessType}
                </span>
              )}
              {seller.legalStatus && (
                <span className="portfolio-badge-pill">{seller.legalStatus}</span>
              )}
              {seller.address && (
                <span className="portfolio-badge-pill">
                  <MapPin size={12} style={{ marginRight: 4 }} />
                  {seller.address}
                </span>
              )}
            </motion.div>

            {/* Quick Slogan / Tagline */}
            {seller.tagline && (
              <motion.p variants={itemVariants} className="portfolio-tagline">
                &ldquo;{seller.tagline}&rdquo;
              </motion.p>
            )}

            {/* CTAs */}
            <motion.div variants={itemVariants} className="portfolio-header-actions">
              <a href="#contact" className="portfolio-primary-btn">
                <Sparkles size={15} />
                <span>Request Instant Quote</span>
              </a>

              {seller.whatsappNumber && (
                <a
                  href={`https://wa.me/${seller.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-whatsapp-btn"
                >
                  <MessageSquare size={15} />
                  <span>WhatsApp Factory</span>
                </a>
              )}

              <a href="#products" className="portfolio-ghost-btn">
                <span>View Catalog</span>
              </a>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ─── 3. High-Impact Executive Metrics Bar ────────────────────────────── */}
      <div className="portfolio-metrics-strip">
        <div className="portfolio-metrics-grid">
          {seller.yearOfEstablishment && (
            <div className="portfolio-metric-item">
              <div className="portfolio-metric-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Calendar size={18} />
              </div>
              <div>
                <div className="portfolio-metric-value">{seller.yearOfEstablishment}</div>
                <div className="portfolio-metric-label">Year Established</div>
              </div>
            </div>
          )}

          {seller.employeesCount > 0 && (
            <div className="portfolio-metric-item">
              <div className="portfolio-metric-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <Users size={18} />
              </div>
              <div>
                <div className="portfolio-metric-value">{seller.employeesCount}+</div>
                <div className="portfolio-metric-label">Skilled Workforce</div>
              </div>
            </div>
          )}

          {seller.factorySize && (
            <div className="portfolio-metric-item">
              <div className="portfolio-metric-icon-wrap" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                <Factory size={18} />
              </div>
              <div>
                <div className="portfolio-metric-value">{seller.factorySize}</div>
                <div className="portfolio-metric-label">Plant Floor Area</div>
              </div>
            </div>
          )}

          {cleanExport && (
            <div className="portfolio-metric-item">
              <div className="portfolio-metric-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <Globe2 size={18} />
              </div>
              <div>
                <div className="portfolio-metric-value">{cleanExport}</div>
                <div className="portfolio-metric-label">Export Markets</div>
              </div>
            </div>
          )}

          {seller.reviewCount > 0 ? (
            <div className="portfolio-metric-item">
              <div className="portfolio-metric-icon-wrap" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
                <Star size={18} />
              </div>
              <div>
                <div className="portfolio-metric-value">{seller.rating}★</div>
                <div className="portfolio-metric-label">{seller.reviewCount} Verified Reviews</div>
              </div>
            </div>
          ) : (
            <div className="portfolio-metric-item">
              <div className="portfolio-metric-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="portfolio-metric-value">100%</div>
                <div className="portfolio-metric-label">Direct Factory Supply</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
