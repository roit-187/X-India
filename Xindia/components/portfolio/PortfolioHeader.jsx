'use client';

import React from 'react';
import { ShieldCheck, Award, FileCheck2, MapPin, Building2, ExternalLink, PhoneCall, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PortfolioHeader({ seller }) {
  const verifiedDocs = seller.verifiedDocuments ? Object.keys(seller.verifiedDocuments) : [];
  const hasGst = seller.gstVerified || verifiedDocs.includes('gst');
  const hasIso = verifiedDocs.includes('iso') || (seller.certifications && seller.certifications.some(c => c.toLowerCase().includes('iso')));
  const hasMsme = verifiedDocs.includes('msme');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
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

        <div className="portfolio-header-content">
          <motion.div variants={itemVariants} className="portfolio-name-row">
            <h1 className="portfolio-name">{seller.name}</h1>
            
            {seller.verified && (
              <span className="portfolio-verified-badge">
                <Sparkles size={13} />
                Verified Supplier
              </span>
            )}
            {hasGst && (
              <span className="portfolio-trust-badge">
                <FileCheck2 size={12} color="#10B981" />
                GST Verified
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
            {Array.isArray(seller.categories) && seller.categories.map((cat) => (
              <span key={cat._id || cat.slug || cat} className="portfolio-cat-pill">
                {cat.name || cat}
              </span>
            ))}
          </motion.div>

          {seller.address && (
            <motion.div variants={itemVariants} className="portfolio-location">
              <MapPin size={14} color="#94A3B8" />
              <span>{seller.address}</span>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
