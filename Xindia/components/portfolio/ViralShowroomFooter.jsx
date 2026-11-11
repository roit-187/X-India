'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function ViralShowroomFooter({ seller }) {
  return (
    <footer className="portfolio-viral-footer">
      <div className="portfolio-container">
        <div className="portfolio-footer-bottom">
          <div className="portfolio-footer-brand">
            <span className="portfolio-footer-tagline">{seller.name}&apos;s business portfolio</span>
          </div>

          <div className="portfolio-footer-trust">
            {seller.verified && <ShieldCheck size={14} color="#10B981" />}
            <span>{seller.verified ? 'XINDIA verified' : 'Seller portfolio'} · Powered by XINDIA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
