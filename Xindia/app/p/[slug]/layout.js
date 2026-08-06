import { notFound } from 'next/navigation';
import '../../portfolio.css';
import { getSeller } from '@/lib/api';
import PortfolioHeader from '@/components/portfolio/PortfolioHeader';
import PortfolioNav from '@/components/portfolio/PortfolioNav';

export async function generateMetadata({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) return { title: 'Seller Not Found — XINDIA' };
  return {
    title: `${seller.name} — XINDIA`,
    description: (seller.portfolioAbout || seller.description || `${seller.name} on XINDIA — India's Business Launchpad.`).slice(0, 160),
  };
}

export default async function SellerPortfolioLayout({ children, params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: seller.name,
    image: seller.logo,
    description: seller.portfolioAbout || seller.description,
    address: seller.address,
    aggregateRating: seller.reviewCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: seller.rating,
      reviewCount: seller.reviewCount,
    } : undefined,
  };

  return (
    <div className="portfolio-page">
      <PortfolioHeader seller={seller} />
      <PortfolioNav slug={params.slug} />
      {children}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
