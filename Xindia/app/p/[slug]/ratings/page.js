import { notFound } from 'next/navigation';
import { getSeller, getSellerReviews } from '@/lib/api';
import ReviewForm from '@/components/portfolio/ReviewForm';

export const metadata = { title: 'Ratings & Reviews' };

export default async function RatingsPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const { reviews, averageRating, totalReviews } = await getSellerReviews(params.slug);

  return (
    <div className="portfolio-container">
      <h2 className="portfolio-section-title">Ratings & Reviews</h2>

      <div className="portfolio-rating-summary">
        <div className="portfolio-rating-number portfolio-mono">{averageRating || 0}</div>
        <div>
          <div className="portfolio-rating-stars">{'★'.repeat(Math.round(averageRating || 0))}{'☆'.repeat(5 - Math.round(averageRating || 0))}</div>
          <div style={{ fontSize: 12, color: 'var(--p-text-med)' }}>{totalReviews || 0} review{totalReviews === 1 ? '' : 's'}</div>
        </div>
      </div>

      <ReviewForm slug={params.slug} />

      {(!reviews || reviews.length === 0) ? (
        <div className="portfolio-empty-state">No reviews yet. Be the first to leave one!</div>
      ) : (
        reviews.map((r) => (
          <div key={r._id} className="portfolio-review-card">
            <div className="portfolio-review-head">
              <span className="portfolio-review-name">
                {r.reviewerName}
                {r.reviewerCompany ? ` · ${r.reviewerCompany}` : ''}
              </span>
              <span style={{ color: '#F59E0B', fontSize: 12 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
            </div>
            <p className="portfolio-review-comment">{r.comment}</p>
          </div>
        ))
      )}
    </div>
  );
}
