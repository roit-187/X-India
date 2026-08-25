'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ViralShowroomFooter({ seller }) {
  return (
    <footer className="portfolio-viral-footer">
      <div className="portfolio-container">
        <div className="portfolio-footer-bottom">
          <div className="portfolio-footer-brand">
            <span className="portfolio-footer-logo-text">XINDIA</span>
            <span className="portfolio-footer-dot">•</span>
            <span className="portfolio-footer-tagline">India&apos;s Business Launchpad</span>
          </div>

          <div className="portfolio-footer-trust">
            <ShieldCheck size={14} color="#10B981" />
            <span>Verified Manufacturer Showroom for <strong>{seller.name}</strong></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
