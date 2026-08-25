'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { QrCode } from 'lucide-react';

const DownloadCTA = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section className="download-section" id="download" ref={ref}>
      <div className="grid-pattern" />
      <div className="container">
        <div className="download-grid">
          <motion.div
            className="download-content"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2>
              Download XINDIA.<br />
              Start building today.
            </h2>
            <p className="subtitle">
              Free to download. Free to explore. Pay only when you connect.
            </p>

            <div className="download-buttons">
              <motion.a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="download-store-btn"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <svg className="download-store-btn-icon" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.3 2.3-8.636-8.632z"/>
                </svg>
                <div className="download-store-btn-text">
                  <small>GET IT ON</small>
                  <span>Google Play</span>
                </div>
              </motion.a>
            </div>


            <p className="download-note">
              Available on iOS &amp; Android. No hidden charges.
            </p>
          </motion.div>

          <motion.div
            className="download-visual"
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="download-phone">
              <div className="download-phone-notch" />
              <div className="download-phone-screen">
                <div className="app-logo-big">
                  <span className="x-accent">X</span>INDIA
                </div>
                <p className="app-tagline">
                  India's Business<br />Launchpad
                </p>
                <motion.div
                  style={{
                    background: '#E8581C',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started →
                </motion.div>
              </div>
            </div>

            {/* QR Code */}
            <motion.div
              className="qr-code"
              style={{
                position: 'absolute',
                bottom: '-10px',
                right: '20px'
              }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(9, 1fr)',
                gridTemplateRows: 'repeat(9, 1fr)',
                gap: '2px',
                padding: '4px'
              }}>
                {/* Simplified QR pattern */}
                {Array.from({ length: 81 }, (_, i) => {
                  const row = Math.floor(i / 9);
                  const col = i % 9;
                  const isCorner = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
                  const isCenter = row === 4 && col === 4;
                  const isRandom = [5, 12, 18, 23, 31, 37, 42, 49, 56, 63, 68, 74].includes(i);
                  const filled = isCorner || isCenter || isRandom;
                  return (
                    <div
                      key={i}
                      style={{
                        background: filled ? '#0F1B2D' : '#F8FAFC',
                        borderRadius: '1px'
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>
            <p className="qr-label" style={{ marginTop: '24px' }}>Scan to Download App</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DownloadCTA;
