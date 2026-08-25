import { notFound } from 'next/navigation';
import { getSeller, getSellerReviews } from '@/lib/api';
import ReviewForm from '@/components/portfolio/ReviewForm';
import { Star, MessageSquareCheck, ShieldCheck, User } from 'lucide-react';

export const metadata = { title: 'Verified Ratings & Reviews — XINDIA' };

export default async function RatingsPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const { reviews, averageRating, totalReviews } = await getSellerReviews(params.slug);
  const roundedRating = Math.round((averageRating || 0) * 10) / 10;

  return (
    <div className="portfolio-container">
      <div className="portfolio-section-header">
        <div>
          <h2 className="portfolio-section-title">Ratings & Buyer Reviews</h2>
          <p className="portfolio-section-desc">
            Verified ratings and feedback from brands and entrepreneurs who ordered from this manufacturer.
          </p>
        </div>
      </div>

      {/* ─── Rating Overview Banner ──────────────────────────────────────────── */}
      <div className="portfolio-rating-summary">
        <div className="portfolio-rating-number portfolio-mono">{roundedRating || 0}</div>
        <div>
          <div className="portfolio-rating-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                style={{
                  display: 'inline-block',
                  marginRight: 3,
                  fill: i < Math.round(roundedRating) ? '#F59E0B' : 'transparent',
                  color: i < Math.round(roundedRating) ? '#F59E0B' : '#CBD5E1',
                }}
              />
            ))}
          </div>
          <div style={{ fontSize: 13, color: 'var(--p-text-muted)', fontWeight: 600 }}>
            Based on {totalReviews || 0} verified buyer review{totalReviews === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <ReviewForm slug={params.slug} />
      </div>

      {(!reviews || reviews.length === 0) ? (
        <div className="portfolio-empty-state">
          <MessageSquareCheck size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
          <div>No reviews yet. Be the first brand to leave feedback!</div>
        </div>
      ) : (
        reviews.map((r) => (
          <div key={r._id} className="portfolio-review-card">
            <div className="portfolio-review-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={15} color="#64748B" />
                </div>
                <span className="portfolio-review-name">
                  {r.reviewerName}
                  {r.reviewerCompany ? <span style={{ fontWeight: 400, color: 'var(--p-text-muted)' }}> · {r.reviewerCompany}</span> : ''}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#10B981', background: '#ECFDF5', padding: '2px 7px', borderRadius: 9999, fontWeight: 700 }}>
                  <ShieldCheck size={11} /> Verified Buyer
                </span>
              </div>

              <div style={{ display: 'flex', gap: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
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
        ))
      )}
    </div>
  );
}
