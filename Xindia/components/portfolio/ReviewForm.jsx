'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitSellerReview } from '@/lib/api';
import { Star, Send, User, Building2, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

export default function ReviewForm({ slug }) {
  const router = useRouter();
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerCompany, setReviewerCompany] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reviewerName.trim()) return setError('Please enter your name.');
    if (rating === 0) return setError('Please select a star rating.');
    if (!comment.trim()) return setError('Please write a review comment.');

    setSubmitting(true);
    try {
      await submitSellerReview(slug, {
        reviewerName: reviewerName.trim(),
        reviewerCompany: reviewerCompany.trim(),
        rating,
        comment: comment.trim(),
      });
      setReviewerName('');
      setReviewerCompany('');
      setRating(0);
      setHoverRating(0);
      setComment('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="portfolio-review-form-card">
      <div className="portfolio-review-form-header">
        <div className="portfolio-review-form-header-icon">
          <MessageSquare size={18} color="var(--p-primary)" />
        </div>
        <div>
          <h3 className="portfolio-review-form-title">Write a Verified Review</h3>
          <p className="portfolio-review-form-desc">Share your experience to help other verified buyers make informed sourcing decisions.</p>
        </div>
      </div>

      <form className="portfolio-review-form" onSubmit={handleSubmit}>
        <div className="portfolio-review-form-grid">
          <div className="portfolio-form-group">
            <label className="portfolio-form-label" htmlFor="reviewerName">
              <User size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: '-1px' }} />
              Your Name <span className="portfolio-required">*</span>
            </label>
            <input
              id="reviewerName"
              className="portfolio-form-input"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Amit Kumar"
              required
            />
          </div>

          <div className="portfolio-form-group">
            <label className="portfolio-form-label" htmlFor="reviewerCompany">
              <Building2 size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: '-1px' }} />
              Company / Brand (optional)
            </label>
            <input
              id="reviewerCompany"
              className="portfolio-form-input"
              value={reviewerCompany}
              onChange={(e) => setReviewerCompany(e.target.value)}
              placeholder="e.g. Acme Retailers Ltd."
            />
          </div>
        </div>

        <div className="portfolio-form-group">
          <label className="portfolio-form-label">
            <Star size={13} style={{ display: 'inline', marginRight: 5, verticalAlign: '-1px' }} />
            Your Rating <span className="portfolio-required">*</span>
          </label>
          <div className="portfolio-star-picker-wrapper">
            <div className="portfolio-star-picker" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className={`portfolio-star-btn ${star <= activeRating ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  aria-label={`${star} star`}
                >
                  <Star
                    size={22}
                    className="portfolio-star-icon"
                    style={{
                      fill: star <= activeRating ? '#F59E0B' : 'transparent',
                      color: star <= activeRating ? '#F59E0B' : '#CBD5E1',
                    }}
                  />
                </button>
              ))}
            </div>
            <span className="portfolio-rating-label">
              {activeRating > 0 ? (
                <strong>{activeRating} / 5 — {RATING_LABELS[activeRating]}</strong>
              ) : (
                'Select a rating'
              )}
            </span>
          </div>
        </div>

        <div className="portfolio-form-group">
          <label className="portfolio-form-label" htmlFor="comment">
            Review & Experience <span className="portfolio-required">*</span>
          </label>
          <textarea
            id="comment"
            className="portfolio-form-textarea"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about communication, product quality, dispatch timeline, packaging..."
            required
          />
        </div>

        {error && (
          <div className="portfolio-form-alert error">
            {error}
          </div>
        )}

        {success && (
          <div className="portfolio-form-alert success">
            <CheckCircle2 size={16} /> Thank you! Your review has been submitted successfully.
          </div>
        )}

        <div className="portfolio-form-footer">
          <button type="submit" className="portfolio-submit-btn" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} className="portfolio-spinner" /> Submitting...
              </>
            ) : (
              <>
                <Send size={15} /> Submit Review
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
