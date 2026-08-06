'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitSellerReview } from '@/lib/api';

export default function ReviewForm({ slug }) {
  const router = useRouter();
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerCompany, setReviewerCompany] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reviewerName.trim()) return setError('Please enter your name.');
    if (rating === 0) return setError('Please select a star rating.');
    if (!comment.trim()) return setError('Please write a comment.');

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
      setComment('');
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="portfolio-review-form" onSubmit={handleSubmit}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Write a Review</h3>

      <div className="portfolio-form-row">
        <label htmlFor="reviewerName">Your Name</label>
        <input id="reviewerName" value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="e.g. Amit K." />
      </div>

      <div className="portfolio-form-row">
        <label htmlFor="reviewerCompany">Company (optional)</label>
        <input id="reviewerCompany" value={reviewerCompany} onChange={(e) => setReviewerCompany(e.target.value)} placeholder="e.g. Acme Traders" />
      </div>

      <div className="portfolio-form-row">
        <label>Rating</label>
        <div className="portfolio-star-picker">
          {[1, 2, 3, 4, 5].map((star) => (
            <button type="button" key={star} className={star <= rating ? 'filled' : ''} onClick={() => setRating(star)} aria-label={`${star} star`}>
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="portfolio-form-row">
        <label htmlFor="comment">Comment</label>
        <textarea id="comment" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience with this supplier..." />
      </div>

      {error && <p style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{error}</p>}

      <button type="submit" className="portfolio-submit-btn" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
