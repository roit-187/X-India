'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  MessageSquare,
} from 'lucide-react';

export default function OpportunitiesSection({ opportunities = [], seller }) {
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

  const handleInquireOpportunity = (op) => {
    const whatsappNum = seller.whatsappNumber || seller.businessPhone;
    const msg = encodeURIComponent(
      `Hello ${seller.name},\nI am interested in the contract manufacturing opportunity: "${op.title}".\n\n• Estimated Investment: ₹${op.investment?.toLocaleString('en-IN') || '0'}\n• Minimum Batch (MOQ): ${op.moq || '100 Units'}\n\nPlease share contract manufacturing terms and onboarding process.\n\nSourced via XINDIA Showroom.`
    );
    if (whatsappNum) {
      window.open(`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
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
              <span>Contract Manufacturing</span>
            </div>
            <h2 className="portfolio-section-title">Business & Contract Opportunities</h2>
            <p className="portfolio-section-desc">
              Direct production lines open for new brand launches, high-margin partnerships, and distribution agreements.
            </p>
          </div>
        </div>

        {/* ─── Opportunities Grid ───────────────────────────────────────────── */}
        {opportunities.length === 0 ? (
          <div className="portfolio-empty-state">
            <Briefcase size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
            <div>This seller has not posted any active open contract lines today. You can still send a custom RFQ below!</div>
          </div>
        ) : (
          <motion.div
            className="portfolio-opportunities-list"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={{
              visible: { transition: { staggerChildren: 0.08 } }
            }}
          >
            {opportunities.map((op) => (
              <motion.div key={op._id} className="portfolio-opportunity-card" variants={itemVariants}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={op.imageUrl || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=500&auto=format&fit=crop'}
                  alt={op.title}
                  className="portfolio-opportunity-image"
                />
                <div className="portfolio-opportunity-body">
                  <div className="portfolio-opportunity-head-row">
                    <h3 className="portfolio-opportunity-title">{op.title}</h3>
                    <button
                      type="button"
                      className="portfolio-opportunity-inquire-btn"
                      onClick={() => handleInquireOpportunity(op)}
                    >
                      <MessageSquare size={13} />
                      <span>Inquire Line</span>
                    </button>
                  </div>
                  <p className="portfolio-opportunity-desc">{op.description}</p>
                  
                  <div className="portfolio-opportunity-figures">
                    <div>
                      <div className="portfolio-opportunity-figure-label">Estimated Capital</div>
                      <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: 'var(--p-primary)' }}>
                        ₹{op.investment?.toLocaleString('en-IN') || '0'}
                      </div>
                    </div>
                    <div>
                      <div className="portfolio-opportunity-figure-label">Profit Potential</div>
                      <div className="portfolio-opportunity-figure-value" style={{ color: '#059669' }}>
                        {op.profitRange || '30% – 50%'}
                      </div>
                    </div>
                    <div>
                      <div className="portfolio-opportunity-figure-label">Minimum Batch (MOQ)</div>
                      <div className="portfolio-opportunity-figure-value portfolio-mono">
                        {op.moq || '100 Units'}
                      </div>
                    </div>
                    <div>
                      <div className="portfolio-opportunity-figure-label">Turnaround</div>
                      <div className="portfolio-opportunity-figure-value portfolio-mono" style={{ color: '#2563EB' }}>
                        {op.launchDays ? `${op.launchDays} days` : '7-10 days'}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
