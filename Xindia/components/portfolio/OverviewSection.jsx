'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Sparkles,
  Palette,
  Boxes,
  Tag,
  Zap,
  ShieldCheck,
  Plane,
  Cpu,
  Layers,
  CheckCircle2,
  Building2,
  Coins,
  BadgeCheck,
} from 'lucide-react';
import YouTubePlayer from '@/components/common/YouTubePlayer';

const CAPABILITY_CONFIG = {
  'Custom Logo Printing': {
    icon: Palette,
    desc: 'Screen, Pad, Laser Engraving & Heat Transfer',
    bg: '#EFF6FF',
    color: '#3B82F6',
  },
  'Custom Mould Tooling': {
    icon: Boxes,
    desc: 'In-house CAD 3D Design & CNC Tooling',
    bg: '#FEF3C7',
    color: '#D97706',
  },
  'Private Label Packaging': {
    icon: Tag,
    desc: 'Custom Retail Boxes, Barcoding & Polybags',
    bg: '#FCE7F3',
    color: '#DB2777',
  },
  'Rapid Sample Dispatch': {
    icon: Zap,
    desc: 'Prototypes ready and dispatched in 3-5 days',
    bg: '#ECFDF5',
    color: '#059669',
  },
  'Quality Assurance': {
    icon: ShieldCheck,
    desc: '100% Pre-Dispatch Batch Inspection Protocol',
    bg: '#F3E8FF',
    color: '#7C3AED',
  },
  'Global Export Delivery': {
    icon: Plane,
    desc: 'FOB, CIF & Pan-India Express Logistics',
    bg: '#E0F2FE',
    color: '#0284C7',
  },
  'OEM / ODM Production': {
    icon: Cpu,
    desc: 'Full Custom Concept-to-Production Lifecycle',
    bg: '#FEE2E2',
    color: '#DC2626',
  },
  'Small Batch Sourcing': {
    icon: Layers,
    desc: 'Low MOQ trial runs supported for DTC startups',
    bg: '#F1F5F9',
    color: '#475569',
  },
};

export default function OverviewSection({ seller }) {
  const hasVideo = Boolean(seller.introVideo || seller.factoryVideo);
  const videoUrl = seller.introVideo || seller.factoryVideo;

  const capabilities = Array.isArray(seller.capabilities) && seller.capabilities.length > 0
    ? seller.capabilities
    : [
        'Custom Logo Printing',
        'Custom Mould Tooling',
        'Private Label Packaging',
        'Rapid Sample Dispatch',
        'Quality Assurance',
        'Global Export Delivery',
      ];

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
            <h2 className="portfolio-section-title">Overview & Factory Capabilities</h2>
            <p className="portfolio-section-desc">
              Verified credentials, production strengths, and direct contract manufacturing highlights.
            </p>
          </div>
        </div>

        {/* ─── 1. Compact 50/50 Split Showcase (Video Tour + Key Strengths) ────── */}
        <motion.div
          className="portfolio-split-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          {/* Left: Compact Video Player or Visual Factory Card */}
          <div className="portfolio-compact-media-card">
            {hasVideo ? (
              <div className="portfolio-compact-video-wrap">
                <div className="portfolio-compact-video-header">
                  <div className="portfolio-compact-video-title">
                    <Video size={15} color="var(--p-primary)" />
                    <span>Executive Factory Tour Video</span>
                  </div>
                  <span className="portfolio-verified-tour-pill">Verified Tour</span>
                </div>
                <div className="portfolio-compact-player-body">
                  <YouTubePlayer
                    videoUrl={videoUrl}
                    title={`${seller.name} Factory Pitch`}
                  />
                </div>
              </div>
            ) : (
              <div className="portfolio-factory-hero-card">
                <div className="portfolio-factory-hero-icon">
                  <Building2 size={28} color="var(--p-primary)" />
                </div>
                <h3 className="portfolio-factory-hero-title">Direct Manufacturing Hub</h3>
                <p className="portfolio-factory-hero-text">
                  {seller.aboutFactory || seller.portfolioAbout || seller.description || 'Verified Indian manufacturer specializing in high-precision contract production and custom OEM orders.'}
                </p>
                <div className="portfolio-factory-hero-footer">
                  <span className="portfolio-badge-pill">
                    <ShieldCheck size={12} color="#10B981" /> Verified Plant
                  </span>
                  {seller.factorySize && (
                    <span className="portfolio-badge-pill">
                      {seller.factorySize} Floor Space
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Key Sourcing Strengths Matrix */}
          <div className="portfolio-strengths-card">
            <h3 className="portfolio-strengths-title">
              <BadgeCheck size={18} color="var(--p-primary)" />
              <span>Why Source From {seller.name}</span>
            </h3>

            <div className="portfolio-strengths-list">
              <div className="portfolio-strength-item">
                <div className="portfolio-strength-icon" style={{ background: '#ECFDF5', color: '#059669' }}>
                  <Coins size={16} />
                </div>
                <div>
                  <div className="portfolio-strength-heading">Direct Factory Pricing</div>
                  <div className="portfolio-strength-text">Direct from workshop floor with zero intermediary markups.</div>
                </div>
              </div>

              <div className="portfolio-strength-item">
                <div className="portfolio-strength-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                  <Zap size={16} />
                </div>
                <div>
                  <div className="portfolio-strength-heading">Rapid Sample Turnaround</div>
                  <div className="portfolio-strength-text">Quick prototyping and sample dispatch within 3 to 5 business days.</div>
                </div>
              </div>

              <div className="portfolio-strength-item">
                <div className="portfolio-strength-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="portfolio-strength-heading">Rigorous Batch QA Inspection</div>
                  <div className="portfolio-strength-text">Comprehensive pre-dispatch quality verification on every consignment.</div>
                </div>
              </div>

              <div className="portfolio-strength-item">
                <div className="portfolio-strength-icon" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                  <Plane size={16} />
                </div>
                <div>
                  <div className="portfolio-strength-heading">Pan-India & Global Logistics</div>
                  <div className="portfolio-strength-text">Door-to-door express delivery with insured transit across domestic & export routes.</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── 2. About Company Story ─────────────────────────────────────────── */}
        <motion.div
          className="portfolio-about-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          <div className="portfolio-about-card">
            <h3 className="portfolio-card-heading">About the Company</h3>
            <p className="portfolio-prose">
              {seller.portfolioAbout || seller.description || 'This seller has not added an executive description yet.'}
            </p>

            {Array.isArray(seller.primaryProducts) && seller.primaryProducts.length > 0 && (
              <div className="portfolio-primary-lines-box">
                <div className="portfolio-primary-lines-label">
                  Core Manufacturing Lines
                </div>
                <div className="portfolio-tag-cloud">
                  {seller.primaryProducts.map((p) => (
                    <span key={p} className="portfolio-tag-chip">
                      <CheckCircle2 size={13} color="var(--p-primary)" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* ─── 3. OEM / ODM Customization Matrix ──────────────────────────────── */}
        <motion.div
          className="portfolio-capabilities-wrapper"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          <div className="portfolio-card-header-row">
            <div>
              <h3 className="portfolio-card-heading">Customization & Contract Capabilities</h3>
              <p className="portfolio-card-subheading">Flexible OEM/ODM engineering capabilities available for custom brand orders.</p>
            </div>
          </div>

          <div className="portfolio-capabilities-grid">
            {capabilities.map((cap) => {
              const config = CAPABILITY_CONFIG[cap] || {
                icon: CheckCircle2,
                desc: 'Full factory capability and custom order support',
                bg: '#EFF6FF',
                color: '#3B82F6',
              };
              const Icon = config.icon;

              return (
                <div key={cap} className="portfolio-capability-card">
                  <div className="portfolio-capability-icon-wrap" style={{ background: config.bg, color: config.color }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="portfolio-capability-title">{cap}</div>
                    <div className="portfolio-capability-desc">{config.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
