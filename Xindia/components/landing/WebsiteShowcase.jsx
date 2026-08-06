'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Check, ArrowRight, Globe, Search as SearchIcon, Share2, MessageSquare, RefreshCcw } from 'lucide-react';

const WebsiteShowcase = () => {
  const [ref, inView] = useInView({ threshold: 0.15, triggerOnce: true });

  const features = [
    { icon: <Globe size={14} />, text: 'Professional website generated automatically from your profile' },
    { icon: <RefreshCcw size={14} />, text: 'Updates instantly when you update your profile' },
    { icon: <SearchIcon size={14} />, text: 'Gets found on Google for your product keywords' },
    { icon: <Share2 size={14} />, text: 'Shareable link for WhatsApp, LinkedIn, and business cards' },
    { icon: <MessageSquare size={14} />, text: 'Inquiry form feeds directly to your XINDIA dashboard' }
  ];

  return (
    <section className="website-section section" ref={ref}>
      <div className="container">
        <div className="website-grid">
          {/* Browser Preview */}
          <motion.div
            className="website-preview"
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="website-preview-header">
              <div className="browser-dot red" />
              <div className="browser-dot yellow" />
              <div className="browser-dot green" />
              <div className="browser-url">xindia.com/balaji-metal-industries</div>
            </div>
            <div className="website-preview-content">
              <div className="website-brand-preview">
                <div className="brand-name">
                  🏭 Balaji Metal Industries
                </div>
                <div className="brand-tagline">Premium Metal Products.</div>
                <div className="brand-subtitle">Built for Performance.</div>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '16px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>✓ GST Verified</span>
                  <span style={{
                    background: 'rgba(255,255,255,0.1)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>✓ Factory Verified</span>
                </div>
                <div className="preview-products">
                  <motion.div
                    className="preview-product"
                    whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    🔩
                  </motion.div>
                  <motion.div
                    className="preview-product"
                    whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    ⚙️
                  </motion.div>
                  <motion.div
                    className="preview-product"
                    whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    🔧
                  </motion.div>
                  <motion.div
                    className="preview-product"
                    whileHover={{ scale: 1.08, borderColor: 'rgba(255,255,255,0.3)' }}
                  >
                    🏗️
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="website-content"
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="website-price">
              <span className="old-price">₹30,000</span>
              <span className="new-price">Free</span>
            </div>
            <h2>
              Replace your ₹30,000 website with something better.
            </h2>
            <p className="subtitle">Free. Auto-generated. Always up to date.</p>

            <ul className="feature-checklist">
              {features.map((feature, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="feature-check">
                    <Check size={14} />
                  </span>
                  {feature.text}
                </motion.li>
              ))}
            </ul>

            <motion.a
              href="#website"
              className="btn-website-cta"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Your Free Business Website <ArrowRight size={16} />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WebsiteShowcase;
