'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function OverviewSection({ seller }) {
  const about = seller.portfolioAbout || seller.description || '';
  const primaryProducts = Array.isArray(seller.primaryProducts) ? seller.primaryProducts.filter(Boolean) : [];
  const capabilities = Array.isArray(seller.capabilities)
    ? seller.capabilities.filter((capability) => typeof capability === 'string' && capability.trim())
    : [];

  if (!about && primaryProducts.length === 0 && capabilities.length === 0) return null;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="overview" className="portfolio-section">
      <div className="portfolio-container">
        {/* Section Title */}
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <Sparkles size={13} />
              <span>Manufacturer Profile</span>
            </div>
            <h2 className="portfolio-section-title">Company Overview</h2>
            <p className="portfolio-section-desc">
              Company details and capabilities provided by this seller.
            </p>
          </div>
        </div>

        {about || primaryProducts.length > 0 ? (
          <motion.div
            className="portfolio-about-container"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={itemVariants}
          >
            <div className="portfolio-about-card">
              <h3 className="portfolio-card-heading">About the Company</h3>
              {about && <p className="portfolio-prose">{about}</p>}

              {primaryProducts.length > 0 && (
                <div className="portfolio-primary-lines-box">
                  <div className="portfolio-primary-lines-label">Core Products</div>
                  <div className="portfolio-tag-cloud">
                    {primaryProducts.map((product) => (
                      <span key={product} className="portfolio-tag-chip">
                        <CheckCircle2 size={13} color="var(--p-primary)" />
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : null}

        {/* ─── 3. OEM / ODM Customization Matrix ──────────────────────────────── */}
        {capabilities.length > 0 && <motion.div
          className="portfolio-capabilities-wrapper"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          <div className="portfolio-card-header-row">
            <div>
              <h3 className="portfolio-card-heading">Customization & Contract Capabilities</h3>
              <p className="portfolio-card-subheading">Capabilities listed by this seller.</p>
            </div>
          </div>

          <div className="portfolio-capabilities-grid">
            {capabilities.map((capability) => (
              <div key={capability} className="portfolio-capability-card">
                <div className="portfolio-capability-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                  <CheckCircle2 size={20} />
                </div>
                <div className="portfolio-capability-title">{capability}</div>
              </div>
            ))}
          </div>
        </motion.div>}
      </div>
    </section>
  );
}
