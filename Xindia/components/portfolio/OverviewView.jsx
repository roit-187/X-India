'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Factory,
  Globe2,
  Star,
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
  Video,
  ArrowRight,
  Package,
} from 'lucide-react';
import YouTubePlayer from '@/components/common/YouTubePlayer';
import { resolveImageUrl } from '@/lib/image';
import ProductDetailModal from './ProductDetailModal';
import PortfolioImage from './PortfolioImage';

const CAPABILITY_CONFIG = {
  'Custom Logo Printing': {
    icon: Palette,
    bg: '#EFF6FF',
    color: '#3B82F6',
  },
  'Custom Mould Tooling': {
    icon: Boxes,
    bg: '#FEF3C7',
    color: '#D97706',
  },
  'Private Label Packaging': {
    icon: Tag,
    bg: '#FCE7F3',
    color: '#DB2777',
  },
  'Rapid Sample Dispatch': {
    icon: Zap,
    bg: '#ECFDF5',
    color: '#059669',
  },
  'Quality Assurance': {
    icon: ShieldCheck,
    bg: '#F3E8FF',
    color: '#7C3AED',
  },
  'Global Export Delivery': {
    icon: Plane,
    bg: '#E0F2FE',
    color: '#0284C7',
  },
  'OEM / ODM Production': {
    icon: Cpu,
    bg: '#FEE2E2',
    color: '#DC2626',
  },
  'Small Batch Sourcing': {
    icon: Layers,
    bg: '#F1F5F9',
    color: '#475569',
  },
};

export default function OverviewView({ seller, topProducts, slug }) {
  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const capabilities = Array.isArray(seller.capabilities) ? seller.capabilities.filter(Boolean) : [];

  // Clean formatted metrics
  const cleanExport = seller.exportPercentage ? seller.exportPercentage.replace(/%+$/, '') + '%' : null;

  return (
    <motion.div
      className="portfolio-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── 1. Stats & Metrics Grid ────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="portfolio-stats-grid">
        {seller.yearOfEstablishment && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
              <Calendar size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.yearOfEstablishment}</div>
              <div className="portfolio-stat-label">Established · seller-provided</div>
            </div>
          </div>
        )}

        {seller.employeesCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
              <Users size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.employeesCount}+</div>
              <div className="portfolio-stat-label">Employees · seller-provided</div>
            </div>
          </div>
        )}

        {seller.factorySize && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <Factory size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.factorySize}</div>
              <div className="portfolio-stat-label">Factory size · seller-provided</div>
            </div>
          </div>
        )}

        {cleanExport && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <Globe2 size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{cleanExport}</div>
              <div className="portfolio-stat-label">Export Share</div>
            </div>
          </div>
        )}

        {seller.reviewCount > 0 && (
          <div className="portfolio-stat-card">
            <div className="portfolio-stat-icon-wrap" style={{ background: '#FEF9C3', color: '#CA8A04' }}>
              <Star size={20} />
            </div>
            <div>
              <div className="portfolio-stat-value portfolio-mono">{seller.rating}★</div>
              <div className="portfolio-stat-label">{seller.reviewCount} Buyer Reviews</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ─── 2. About the Manufacturer ───────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <h2 className="portfolio-section-title">About the Manufacturer</h2>
        <div className="portfolio-about-box">
          <p className="portfolio-prose">
            {seller.portfolioAbout || seller.description || 'This seller has not added a description yet.'}
          </p>

          {Array.isArray(seller.primaryProducts) && seller.primaryProducts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--p-text)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Core Manufacturing Lines
              </div>
              <div className="portfolio-tag-cloud">
                {seller.primaryProducts.map((p) => (
                  <span key={p} className="portfolio-tag-chip">
                    <CheckCircle2 size={13} color="#2563EB" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── 3. Video Pitch / Factory Tour ──────────────────────────────────── */}
      {(seller.introVideo || seller.factoryVideo) && (
        <motion.div variants={itemVariants} className="portfolio-cinema-card">
          <div className="portfolio-cinema-head">
            <div className="portfolio-cinema-title">
              <Video size={16} color="#FF6B2E" />
              <span>Executive Introduction & Factory Pitch</span>
            </div>
            <span className="portfolio-cinema-badge">Official Video</span>
          </div>
          <div className="portfolio-cinema-body">
            <YouTubePlayer
              videoUrl={seller.introVideo || seller.factoryVideo}
              title={`${seller.name} Executive Video`}
            />
          </div>
        </motion.div>
      )}

      {/* ─── 4. OEM & Sourcing Capabilities ─────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="portfolio-section-header">
          <div>
            <h2 className="portfolio-section-title">Seller-listed capabilities</h2>
            <p className="portfolio-section-desc">
              Capabilities listed by this seller.
            </p>
          </div>
        </div>

        <div className="portfolio-capabilities-grid">
          {capabilities.map((capName) => {
            const conf = CAPABILITY_CONFIG[capName] || {
              icon: Sparkles,
              bg: '#F8FAFC',
              color: '#64748B',
            };
            const Icon = conf.icon;
            return (
              <div key={capName} className="portfolio-capability-card">
                <div className="portfolio-capability-icon-wrap" style={{ background: conf.bg, color: conf.color }}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="portfolio-capability-name">{capName}</h3>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── 5. Featured Products ───────────────────────────────────────────── */}
      {topProducts.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="portfolio-section-header">
            <div>
              <h2 className="portfolio-section-title">Featured Products</h2>
              <p className="portfolio-section-desc">
                Selected products from this seller’s catalogue.
              </p>
            </div>
            <Link href={`/p/${slug}/products`} className="portfolio-view-all-btn">
              <span>View all products</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="portfolio-product-grid">
            {topProducts.map((p) => {
              const custOpts = p.customizationOptions || {};
              const hasLogo = custOpts.logoCustomization || custOpts.customLogo;
              const hasPkg = custOpts.packagingCustomization || custOpts.customPackaging;

              const resolvedImg = resolveImageUrl(p.imageUrl || p.images?.[0]);
              return (
                <div
                  key={p._id}
                  className="portfolio-product-card clickable"
                  onClick={() => setSelectedProduct(p)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="portfolio-product-image-frame">
                    <PortfolioImage
                      src={resolvedImg}
                      alt={p.name}
                      className="portfolio-product-image"
                      placeholderLabel="Product image not provided"
                      loading="lazy"
                    />
                    {p.deliveryTime && (
                      <div className="portfolio-product-dispatch-pill">
                        <Zap size={11} />
                        <span>{p.deliveryTime}</span>
                      </div>
                    )}
                  </div>
                  <div className="portfolio-product-body">
                    <h3 className="portfolio-product-name">{p.name}</h3>
                    <div className="portfolio-product-price-row">
                      <div className="portfolio-product-price">
                        {p.price} {p.unit ? <span style={{ fontSize: 13, color: 'var(--p-text-muted)', fontWeight: 500 }}>/ {p.unit}</span> : ''}
                      </div>
                      <span className="portfolio-product-moq">MOQ: {p.moq}</span>
                    </div>

                    {(hasLogo || hasPkg) && (
                      <div className="portfolio-product-custom-tags">
                        {hasLogo && <span className="portfolio-custom-tag"><Tag size={11} /> Custom Logo</span>}
                        {hasPkg && <span className="portfolio-custom-tag"><Package size={11} /> Custom Box</span>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <ProductDetailModal
        product={selectedProduct}
        seller={seller}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </motion.div>
  );
}
