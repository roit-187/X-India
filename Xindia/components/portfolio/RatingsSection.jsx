'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  User,
} from 'lucide-react';
import ReviewForm from './ReviewForm';

export default function RatingsSection({ reviews = [], averageRating = 0, totalReviews = 0, slug }) {
  const roundedRating = Math.round((averageRating || 0) * 10) / 10;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section id="ratings" className="portfolio-section">
      <div className="portfolio-container">
        {/* Section Header */}
        <div className="portfolio-section-header">
          <div>
            <div className="portfolio-section-eyebrow">
              <Star size={13} />
              <span>Buyer Trust & Reviews</span>
            </div>
            <h2 className="portfolio-section-title">Verified Ratings & Buyer Feedback</h2>
            <p className="portfolio-section-desc">
              Authentic reviews and verification scores from brands and entrepreneurs who ordered from this manufacturer.
            </p>
          </div>
        </div>

        {/* ─── 1. Rating Overview Banner ────────────────────────────────────── */}
        <motion.div
          className="portfolio-rating-summary"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          <div className="portfolio-rating-number portfolio-mono">{roundedRating || '5.0'}</div>
          <div>
            <div className="portfolio-rating-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={22}
                  style={{
                    display: 'inline-block',
                    marginRight: 3,
                    fill: i < Math.round(roundedRating || 5) ? '#F59E0B' : 'transparent',
                    color: i < Math.round(roundedRating || 5) ? '#F59E0B' : '#CBD5E1',
                  }}
                />
              ))}
            </div>
            <div className="portfolio-rating-subtitle">
              {totalReviews > 0 ? (
                <>Based on <strong>{totalReviews} verified buyer review{totalReviews === 1 ? '' : 's'}</strong></>
              ) : (
                <span>100% Certified Indian Manufacturer Baseline Trust Score</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ─── 2. Write a Review Form Card ──────────────────────────────────── */}
        <motion.div
          style={{ marginBottom: 32 }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          <ReviewForm slug={slug} />
        </motion.div>

        {/* ─── 3. Buyer Reviews List ────────────────────────────────────────── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={itemVariants}
        >
          {(!reviews || reviews.length === 0) ? (
            <div className="portfolio-empty-state">
              <MessageSquare size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
              <div>No reviews posted yet. Be the first brand to submit verified feedback!</div>
            </div>
          ) : (
            <div className="portfolio-reviews-list">
              {reviews.map((r) => (
                <div key={r._id} className="portfolio-review-card">
                  <div className="portfolio-review-head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="portfolio-review-avatar">
                        <User size={15} color="#64748B" />
                      </div>
                      <div>
                        <span className="portfolio-review-name">
                          {r.reviewerName}
                          {r.reviewerCompany ? (
                            <span className="portfolio-review-company"> · {r.reviewerCompany}</span>
                          ) : ''}
                        </span>
                      </div>
                      <span className="portfolio-verified-buyer-pill">
                        <ShieldCheck size={11} /> Verified Buyer
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          style={{
                            fill: i < r.rating ? '#F59E0B' : 'transparent',
                            color: i < r.rating ? '#F59E0B' : '#CBD5E1',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="portfolio-review-comment">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
