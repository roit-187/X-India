'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, Share2, Check, Copy, X } from 'lucide-react';

export default function FloatingQuickDock({ seller, slug }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const whatsappNum = seller.whatsappNumber || seller.buyerContactPhone || seller.businessPhone;
  const showroomUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/p/${slug}`
    : `https://xindia.market/p/${slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(showroomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleScrollToRFQ = (e) => {
    e.preventDefault();
    const elem = document.getElementById('contact');
    if (elem) {
      const offsetTop = elem.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  if (!visible) return null;

  return (
    <>
      <div className="portfolio-floating-dock-container">
        <div className="portfolio-floating-dock">
          {whatsappNum && (
            <a
              href={`https://wa.me/${whatsappNum.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `Hello ${seller.name}, I am visiting your official XINDIA digital showroom and would like to inquire about your manufacturing capabilities.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="portfolio-dock-btn whatsapp"
              title="Chat directly on WhatsApp"
            >
              <MessageSquare size={16} />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            type="button"
            className="portfolio-dock-btn primary"
            onClick={handleScrollToRFQ}
          >
            <Sparkles size={15} />
            <span>Instant Quote</span>
          </button>

          <button
            type="button"
            className="portfolio-dock-btn secondary"
            onClick={() => setShareModalOpen(true)}
            title="Share Digital Showroom"
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="portfolio-modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div className="portfolio-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="portfolio-modal-head">
              <div>
                <span className="portfolio-modal-eyebrow">Digital Showroom</span>
                <h3 className="portfolio-modal-title">Share {seller.name}</h3>
              </div>
              <button
                type="button"
                className="portfolio-modal-close"
                onClick={() => setShareModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="portfolio-modal-share-body">
              <p className="portfolio-modal-share-text">
                Share this verified manufacturer profile with your sourcing team, clients, or purchasing partners.
              </p>

              <div className="portfolio-share-copy-row">
                <input
                  type="text"
                  readOnly
                  value={showroomUrl}
                  className="portfolio-form-input"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="portfolio-copy-btn"
                >
                  {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="portfolio-modal-share-actions">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out ${seller.name} — Verified Indian Manufacturer on XINDIA:\n${showroomUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portfolio-whatsapp-share-btn"
                >
                  <MessageSquare size={16} />
                  <span>Share to WhatsApp Contacts</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
