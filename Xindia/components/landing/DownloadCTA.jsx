'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';
import { usePlayStoreUrl } from '@/lib/usePlayStoreUrl';

const DownloadCTA = () => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const playStoreUrl = usePlayStoreUrl();
  const [qrImage, setQrImage] = useState(null);

  useEffect(() => {
    let mounted = true;
    QRCode.toDataURL(playStoreUrl, { width: 220, margin: 4 })
      .then((image) => { if (mounted) setQrImage({ url: playStoreUrl, image }); })
      .catch(() => { if (mounted) setQrImage(null); });
    return () => { mounted = false; };
  }, [playStoreUrl]);

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
                href={playStoreUrl}
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
                <motion.a
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#E8581C',
                    color: 'white',
                    padding: '10px 24px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Get Started →
                </motion.a>
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
              <a href={playStoreUrl} target="_blank" rel="noopener noreferrer" aria-label="Get XINDIA on Google Play">
                {qrImage?.url === playStoreUrl ? (
                  <Image src={qrImage.image} alt="Scan to download XINDIA" width={220} height={220} unoptimized style={{ width: '100%', height: '100%', display: 'block' }} />
                ) : <QrCode aria-hidden="true" />}
              </a>
            </motion.div>
            <p className="qr-label" style={{ marginTop: '24px' }}>Scan to Download App</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DownloadCTA;
