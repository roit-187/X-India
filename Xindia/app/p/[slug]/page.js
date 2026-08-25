import { notFound } from 'next/navigation';
import {
  getSeller,
  getSellerProducts,
  getSellerReviews,
  getSellerOpportunities,
} from '@/lib/api';

import PortfolioHero from '@/components/portfolio/PortfolioHero';
import PortfolioStickyNav from '@/components/portfolio/PortfolioStickyNav';
import OverviewSection from '@/components/portfolio/OverviewSection';
import ProductCatalogSection from '@/components/portfolio/ProductCatalogSection';
import FactorySection from '@/components/portfolio/FactorySection';
import RatingsSection from '@/components/portfolio/RatingsSection';
import OpportunitiesSection from '@/components/portfolio/OpportunitiesSection';
import ContactRFQSection from '@/components/portfolio/ContactRFQSection';
import FloatingQuickDock from '@/components/portfolio/FloatingQuickDock';
import ViralShowroomFooter from '@/components/portfolio/ViralShowroomFooter';

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function SellerDigitalShowroomPage({ params }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  // Parallel data fetching for blazing fast performance
  const [productsData, reviewsData, opportunities] = await Promise.all([
    getSellerProducts(params.slug, { page: 1 }),
    getSellerReviews(params.slug, { page: 1 }),
    getSellerOpportunities(params.slug),
  ]);

  const products = productsData?.products || [];
  const reviews = reviewsData?.reviews || [];
  const averageRating = reviewsData?.averageRating || seller.rating || 5.0;
  const totalReviews = reviewsData?.totalReviews || seller.reviewCount || 0;

  return (
    <main className="portfolio-showroom-wrapper">
      {/* 1. Hero & Digital Showroom Header */}
      <PortfolioHero seller={seller} slug={params.slug} />

      {/* 2. Sticky Glassmorphic Navigation (Scroll-Spy) */}
      <PortfolioStickyNav
        seller={seller}
        totalProducts={products.length}
        totalReviews={totalReviews}
        totalOpportunities={opportunities.length}
      />

      {/* 3. Section 1: Overview & Compact Split Video Tour */}
      <OverviewSection seller={seller} />

      {/* 4. Section 2: Products & Catalog Showroom */}
      <ProductCatalogSection products={products} seller={seller} />

      {/* 5. Section 3: Factory Infrastructure & Machinery */}
      <FactorySection seller={seller} />

      {/* 6. Section 4: Verified Ratings & Buyer Reviews */}
      <RatingsSection
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={totalReviews}
        slug={params.slug}
      />

      {/* 7. Section 5: Contract Manufacturing Opportunities */}
      <OpportunitiesSection
        opportunities={opportunities}
        seller={seller}
      />

      {/* 8. Section 6: Direct Factory RFQ & Commercial Desk */}
      <ContactRFQSection seller={seller} />

      {/* 9. Floating Bottom Quick Action Dock */}
      <FloatingQuickDock seller={seller} slug={params.slug} />

      {/* 10. Viral Growth Magnet Footer */}
      <ViralShowroomFooter seller={seller} />
    </main>
  );
}
