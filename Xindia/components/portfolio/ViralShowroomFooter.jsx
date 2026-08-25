'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, ArrowRight, Building2, ExternalLink } from 'lucide-react';

export default function ViralShowroomFooter({ seller }) {
  return (
    <footer className="portfolio-viral-footer">
      <div className="portfolio-container">
        {/* ─── Viral Growth Magnet Card ─────────────────────────────────────── */}
        <div className="portfolio-viral-magnet-card">
          <div className="portfolio-viral-magnet-glow" />
          <div className="portfolio-viral-magnet-content">
            <div className="portfolio-viral-badge">
              <Sparkles size={13} />
              <span>Free Manufacturer Benefit</span>
            </div>
            <h3 className="portfolio-viral-title">
              Are you an Indian Manufacturer? Launch Your Free Digital Showroom
            </h3>
            <p className="portfolio-viral-desc">
              Get an agency-grade verified website, digital product showroom, and direct WhatsApp RFQs like <strong>{seller.name}</strong> — 100% free during our launch phase.
            </p>
            <div className="portfolio-viral-actions">
              <Link href="/login?tab=seller" className="portfolio-viral-btn">
                <span>Claim Your Free Digital Showroom</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Bottom Sub-footer ────────────────────────────────────────────── */}
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
