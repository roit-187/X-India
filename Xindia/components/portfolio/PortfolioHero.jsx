'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  Building2,
  Copy,
  Check,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { resolveImageUrl } from '@/lib/image';
import PortfolioImage from './PortfolioImage';
import { getPortfolioVerificationSignals } from '@/lib/portfolioTrust';

export default function PortfolioHero({ seller, slug, hasProductsSection = true }) {
  const [copied, setCopied] = useState(false);
  const verificationSignals = getPortfolioVerificationSignals(seller);

  const cleanSlug = seller.slug || slug;
  const portfolioPath = `/p/${encodeURIComponent(cleanSlug)}`;
  const showroomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${cleanSlug}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live'}/p/${cleanSlug}`;

  const coverImg = resolveImageUrl(seller.coverImage);
  const logoImg = resolveImageUrl(seller.logo);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(showroomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappShareText = encodeURIComponent(
    `Check out ${seller.name}'s business portfolio on XINDIA${seller.verified ? ' — XINDIA verified' : ''}:\n${showroomUrl}`
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

        {coverImg ? (
          <PortfolioImage src={coverImg} alt="" className="portfolio-cover" placeholderLabel="Cover image unavailable" />
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
            <PortfolioImage
              src={logoImg}
              alt={seller.name}
              className="portfolio-logo"
              placeholderLabel="Seller logo not provided"
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
              
              {verificationSignals.map(({ id, title, icon: Icon }) => (
                <span className="portfolio-trust-badge" key={id}>
                  <Icon size={12} />
                  {title}
                </span>
              ))}
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
              {seller.yearOfEstablishment && (
                <span className="portfolio-badge-pill">
                  <Calendar size={12} style={{ marginRight: 4 }} />
                  Established {seller.yearOfEstablishment} · seller-provided
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
            {hasProductsSection && (
              <motion.div variants={itemVariants} className="portfolio-header-actions">
                <a href={`${portfolioPath}#products`} className="portfolio-ghost-btn">
                  <span>View Catalog</span>
                </a>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

    </div>
  );
}
