'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { getPortfolioVerificationSignals } from '@/lib/portfolioTrust';

export default function PortfolioTrustSection({ seller }) {
  const checks = getPortfolioVerificationSignals(seller);

  return (
    <motion.section
      id="trust"
      className="portfolio-section"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="portfolio-container">
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <ShieldCheck size={13} />
              <span>Trust & verification</span>
            </div>
            <h2 className="portfolio-section-title">Know what has been verified</h2>
            <p className="portfolio-section-desc">
              Badges appear only when a matching verification status is recorded in XINDIA. Product, factory, and commercial details are provided by the seller; confirm current specifications and terms before ordering.
            </p>
          </div>
        </div>

        <div className="portfolio-strengths-card">
          {checks.length > 0 ? (
            <div className="portfolio-strengths-list">
              {checks.map(({ id, title, description, icon: Icon }) => (
                <div className="portfolio-strength-item" key={id}>
                  <div className="portfolio-strength-icon" style={{ background: '#ECFDF5', color: '#047857' }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div className="portfolio-strength-heading">{title}</div>
                    <div className="portfolio-strength-text">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="portfolio-prose">
              No seller or document verification badges are currently recorded for this portfolio.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
