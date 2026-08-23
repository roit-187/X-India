'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, TrendingUp, Users, Factory, Search, Package, Shirt, Utensils, Sparkles } from 'lucide-react';

const Hero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const phoneVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.5 }
    }
  };

  return (
    <section className="hero" id="hero">
      <div className="grid-pattern" />
      <div className="container">
        <motion.div
          className="hero-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="hero-badge">
            <span className="hero-badge-dot" />
            Trusted by 25,000+ Entrepreneurs
          </motion.div>

          <motion.h1 variants={itemVariants}>
            India's{' '}
            <span className="highlight">Business<br />Launchpad</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-subtitle">
            Start your brand with verified manufacturers.
            Find qualified buyers for your factory.
            All on one trusted platform.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-audience-text">
            <a href="#manufacturers" className="hero-audience-link">
              For Manufacturers
            </a>
            <span className="hero-audience-dot">•</span>
            <a href="#entrepreneurs" className="hero-audience-link">
              For Entrepreneurs
            </a>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">25,000<span className="accent">+</span></div>
              <div className="hero-stat-label">Entrepreneurs</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">500<span className="accent">+</span></div>
              <div className="hero-stat-label">Verified Manufacturers</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">₹12 Crore<span className="accent">+</span></div>
              <div className="hero-stat-label">Business Created</div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-store-buttons">
            <a href="#" className="store-btn">
              <svg className="store-btn-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.99 2.97 12.5 4.7 9.56C5.55 8.09 7.13 7.17 8.82 7.15C10.1 7.13 11.32 8.02 12.11 8.02C12.89 8.02 14.37 6.94 15.92 7.11C16.57 7.14 18.39 7.38 19.56 9.04C19.47 9.1 17.09 10.47 17.12 13.34C17.15 16.78 20.13 17.93 20.17 17.94C20.14 18.03 19.65 19.66 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              <div className="store-btn-text">
                <small>Download on the</small>
                <span>App Store</span>
              </div>
            </a>
            <a href="#" className="store-btn">
              <svg className="store-btn-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/>
              </svg>
              <div className="store-btn-text">
                <small>GET IT ON</small>
                <span>Google Play</span>
              </div>
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-visual"
          variants={phoneVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="phone-mockup-container">
            {/* Floating cards */}
            <motion.div
              className="hero-float hero-float-1"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="hero-float-icon">
                <TrendingUp size={18} />
              </div>
              <div>
                <div className="hero-float-text">Revenue Growing</div>
                <div className="hero-float-subtext">+43% this month</div>
              </div>
            </motion.div>

            <motion.div
              className="hero-float hero-float-2"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            >
              <div className="hero-float-icon orange">
                <Users size={18} />
              </div>
              <div>
                <div className="hero-float-text">New Leads</div>
                <div className="hero-float-subtext">12 qualified buyers</div>
              </div>
            </motion.div>

            {/* Phone mockup */}
            <div className="phone-mockup">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="phone-app-header">
                  <div className="phone-app-logo">
                    <span className="x-mark">X</span>INDIA
                  </div>
                  <Search size={16} color="#94A3B8" />
                </div>

                <div className="phone-search-bar">
                  🔍 Search businesses, products...
                </div>

                <div className="phone-section-title">▸ START A BUSINESS</div>
                <div className="phone-card">
                  <div className="phone-card-title">Browse Opportunities</div>
                  <div className="phone-card-subtitle">Find your next business idea with verified manufacturers</div>
                  <div className="phone-action-btn">Explore →</div>
                </div>

                <div className="phone-section-title" style={{ marginTop: '12px' }}>▸ GROW MY FACTORY</div>
                <div className="phone-card">
                  <div className="phone-card-title">Get Buyer Leads</div>
                  <div className="phone-card-subtitle">Connect with entrepreneurs looking for your products</div>
                  <div className="phone-action-btn" style={{ background: '#3B82F6' }}>List Free →</div>
                </div>

                <div className="phone-section-title" style={{ marginTop: '12px' }}>Popular Categories</div>
                <div className="phone-categories">
                  <div className="phone-category">
                    <div className="phone-category-icon">📦</div>
                    <div className="phone-category-label">Packaging</div>
                  </div>
                  <div className="phone-category">
                    <div className="phone-category-icon">👕</div>
                    <div className="phone-category-label">Textile</div>
                  </div>
                  <div className="phone-category">
                    <div className="phone-category-icon">🍽️</div>
                    <div className="phone-category-label">Machinery</div>
                  </div>
                  <div className="phone-category">
                    <div className="phone-category-icon">💄</div>
                    <div className="phone-category-label">Cosmetics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;