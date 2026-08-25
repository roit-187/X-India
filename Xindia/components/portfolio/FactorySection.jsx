'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Factory,
  Cpu,
  Users,
  Layers,
  Building,
  Maximize2,
  X,
  Video,
} from 'lucide-react';
import YouTubePlayer from '@/components/common/YouTubePlayer';

export default function FactorySection({ seller }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const photos = Array.isArray(seller.manufacturingPlants) ? seller.manufacturingPlants : [];
  const factories = Array.isArray(seller.factories) ? seller.factories : [];

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="factory" className="portfolio-section">
      <div className="portfolio-container">
        {/* Section Header */}
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <Factory size={13} />
              <span>Plant & Infrastructure</span>
            </div>
            <h2 className="portfolio-section-title">Factory Infrastructure & Machinery</h2>
            <p className="portfolio-section-desc">
              Precision machinery, workshop floor area, and certified production line capacities.
            </p>
          </div>
        </div>

        {/* ─── 1. Plant Metrics Grid ────────────────────────────────────────── */}
        <motion.div
          className="portfolio-stats-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={{
            visible: { transition: { staggerChildren: 0.08 } }
          }}
        >
          {seller.factorySize && (
            <motion.div variants={itemVariants} className="portfolio-stat-card">
              <div className="portfolio-stat-icon-wrap" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
                <Factory size={20} />
              </div>
              <div>
                <div className="portfolio-stat-value portfolio-mono">{seller.factorySize}</div>
                <div className="portfolio-stat-label">Plant Space</div>
              </div>
            </motion.div>
          )}

          {seller.machinesCount > 0 && (
            <motion.div variants={itemVariants} className="portfolio-stat-card">
              <div className="portfolio-stat-icon-wrap" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <Cpu size={20} />
              </div>
              <div>
                <div className="portfolio-stat-value portfolio-mono">{seller.machinesCount}</div>
                <div className="portfolio-stat-label">Industrial Machines</div>
              </div>
            </motion.div>
          )}

          {seller.employeesCount > 0 && (
            <motion.div variants={itemVariants} className="portfolio-stat-card">
              <div className="portfolio-stat-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <Users size={20} />
              </div>
              <div>
                <div className="portfolio-stat-value portfolio-mono">{seller.employeesCount}</div>
                <div className="portfolio-stat-label">Skilled Operators</div>
              </div>
            </motion.div>
          )}

          {seller.monthlyCapacity && (
            <motion.div variants={itemVariants} className="portfolio-stat-card">
              <div className="portfolio-stat-icon-wrap" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                <Layers size={20} />
              </div>
              <div>
                <div className="portfolio-stat-value portfolio-mono">{seller.monthlyCapacity}</div>
                <div className="portfolio-stat-label">Monthly Output</div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* ─── 2. Factory Tour Video ────────────────────────────────────────── */}
        {seller.factoryVideo && (
          <motion.div
            className="portfolio-factory-video-card"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={itemVariants}
          >
            <div className="portfolio-compact-video-header">
              <Video size={15} color="var(--p-primary)" />
              <span>Official Factory Tour</span>
              <span className="portfolio-video-verified-badge">Verified</span>
            </div>
            <div className="portfolio-compact-player-body">
              <YouTubePlayer videoUrl={seller.factoryVideo} title="Factory Tour" showThumbnailFirst />
            </div>
          </motion.div>
        )}

        {/* ─── 3. Machinery Story & Process Capabilities ─────────────────────── */}
        {seller.aboutFactory && (
          <motion.div
            className="portfolio-about-container"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={itemVariants}
          >
            <div className="portfolio-about-card">
              <h3 className="portfolio-card-heading">Manufacturing Line & Process Overview</h3>
              <p className="portfolio-prose">{seller.aboutFactory}</p>
            </div>
          </motion.div>
        )}

        {/* ─── 3. Multiple Plant Units Breakdown (if present) ───────────────── */}
        {factories.length > 0 && (
          <div className="portfolio-factories-grid">
            {factories.map((fac, idx) => (
              <div key={idx} className="portfolio-factory-unit-card">
                <div className="portfolio-factory-unit-header">
                  <Building size={18} color="var(--p-primary)" />
                  <div>
                    <h4 className="portfolio-factory-unit-name">{fac.name || `Plant Unit ${idx + 1}`}</h4>
                    {fac.location && <div className="portfolio-factory-unit-loc">{fac.location}</div>}
                  </div>
                </div>
                {fac.size && <div className="portfolio-factory-unit-detail">Floor Space: {fac.size}</div>}
                {fac.capacity && <div className="portfolio-factory-unit-detail">Production Capacity: {fac.capacity}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ─── 4. Factory Floor & Machinery Photo Gallery ────────────────────── */}
        {photos.length > 0 && (
          <div className="portfolio-gallery-section">
            <h3 className="portfolio-card-heading" style={{ marginBottom: 14 }}>
              Factory Floor & Inspection Gallery
            </h3>
            <div className="portfolio-gallery-grid">
              {photos.map((photo, i) => (
                <div
                  key={i}
                  className="portfolio-gallery-item"
                  onClick={() => setSelectedImage(photo)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt="" className="portfolio-gallery-img" />
                  <div className="portfolio-gallery-overlay">
                    <Maximize2 size={20} color="#FFFFFF" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedImage && (
          <div className="portfolio-modal-backdrop" onClick={() => setSelectedImage(null)}>
            <div className="portfolio-lightbox-card" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="portfolio-lightbox-close"
                onClick={() => setSelectedImage(null)}
              >
                <X size={20} />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage} alt="Factory floor high-res" className="portfolio-lightbox-img" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
