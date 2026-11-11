'use client';

import React from 'react';
import { ShieldCheck, MapPin, Building2, ExternalLink, PhoneCall } from 'lucide-react';
import { motion } from 'framer-motion';
import PortfolioImage from './PortfolioImage';
import { getPortfolioVerificationSignals } from '@/lib/portfolioTrust';

export default function PortfolioHeader({ seller }) {
  const verificationSignals = getPortfolioVerificationSignals(seller);

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
        <PortfolioImage src={seller.coverImage} alt="" className="portfolio-cover" placeholderLabel="Cover image unavailable" />
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
          <PortfolioImage
            src={seller.logo}
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
