import { notFound, redirect } from 'next/navigation';
import {
  getSeller,
  getSellerProducts,
  getSellerReviews,
  getSellerOpportunities,
} from '@/lib/api';

import PortfolioStickyNav from '@/components/portfolio/PortfolioStickyNav';
import PortfolioHero from '@/components/portfolio/PortfolioHero';
import OverviewSection from '@/components/portfolio/OverviewSection';
import FactorySection from '@/components/portfolio/FactorySection';
import PortfolioTrustSection from '@/components/portfolio/PortfolioTrustSection';
import ProductCatalogSection from '@/components/portfolio/ProductCatalogSection';
import RatingsSection from '@/components/portfolio/RatingsSection';
import OpportunitiesSection from '@/components/portfolio/OpportunitiesSection';
import ContactRFQSection from '@/components/portfolio/ContactRFQSection';
import FloatingQuickDock from '@/components/portfolio/FloatingQuickDock';
import ViralShowroomFooter from '@/components/portfolio/ViralShowroomFooter';
import PortfolioViewTracker from '@/components/portfolio/PortfolioViewTracker';
import PortfolioInitialScroll from '@/components/portfolio/PortfolioInitialScroll';
import PortfolioRouteMotion from '@/components/portfolio/PortfolioMotionProvider';

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function SellerDigitalShowroomPage({ params, searchParams }) {
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  // Canonical redirection if accessed via MongoDB ObjectId instead of slug
  if (seller.slug && params.slug !== seller.slug && /^[0-9a-fA-F]{24}$/.test(params.slug)) {
    const source = typeof searchParams?.src === 'string' && ['qr', 'direct_share', 'app', 'search'].includes(searchParams.src)
      ? `?src=${encodeURIComponent(searchParams.src)}`
      : '';
    redirect(`/p/${encodeURIComponent(seller.slug)}${source}#products`);
  }

  // Parallel data fetching for blazing fast performance
  const [productsData, reviewsData, opportunities] = await Promise.all([
    getSellerProducts(params.slug, { page: 1, limit: 20 }),
    getSellerReviews(params.slug, { page: 1 }),
    getSellerOpportunities(params.slug),
  ]);

  const products = productsData?.products || [];
  const reviews = reviewsData?.reviews || [];
  const averageRating = reviewsData?.averageRating ?? 0;
  const totalReviews = reviewsData?.totalReviews ?? 0;
  const hasReviews = reviews.length > 0 || totalReviews > 0;
  const customization = seller.portfolioCustomization || {};
  const allSections = {
    overview: <OverviewSection seller={seller} />,
    products: (
      <ProductCatalogSection
        products={products}
        totalProducts={productsData?.total ?? products.length}
        categories={productsData?.categories || []}
        seller={seller}
      />
    ),
    ratings: hasReviews ? (
      <RatingsSection
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={totalReviews}
        slug={params.slug}
      />
    ) : null,
    opportunities: opportunities.length > 0 ? (
      <OpportunitiesSection opportunities={opportunities} seller={seller} />
    ) : null,
    factory: <FactorySection seller={seller} />,
    contact: <ContactRFQSection seller={seller} />,
  };
  const defaultSectionOrder = ['overview', 'products', 'opportunities', 'ratings', 'factory', 'contact'];
  const hiddenSections = new Set(customization.hiddenSections || []);
  const savedSectionOrder = Array.isArray(customization.sectionOrder)
    ? customization.sectionOrder.filter((id) => defaultSectionOrder.includes(id))
    : [];
  const sectionOrder = savedSectionOrder.length
    ? [...savedSectionOrder, ...defaultSectionOrder.filter((id) => !savedSectionOrder.includes(id))]
    : defaultSectionOrder;

  return (
    <PortfolioRouteMotion pageKey="catalog">
      <main className="portfolio-showroom-wrapper" data-theme={customization.theme || 'industrial'}>
      <PortfolioViewTracker slug={seller.slug || params.slug} />
      <PortfolioInitialScroll />
      <PortfolioStickyNav
        seller={seller}
        slug={params.slug}
        currentPage="catalog"
        totalProducts={productsData?.total ?? products.length}
        totalReviews={totalReviews}
        totalOpportunities={opportunities.length}
      />

      <div id="home">
        <PortfolioHero seller={seller} slug={params.slug} />
      </div>

      {sectionOrder.map((id) => {
        if ((id !== 'products' && hiddenSections.has(id)) || !allSections[id]) return null;
        return <div key={id} style={{ display: 'contents' }}>{allSections[id]}</div>;
      })}

      <PortfolioTrustSection seller={seller} />

      {/* 9. Floating Bottom Quick Action Dock */}
      <FloatingQuickDock seller={seller} slug={params.slug} />

      {/* 10. Viral Growth Magnet Footer */}
      <ViralShowroomFooter seller={seller} />
      </main>
    </PortfolioRouteMotion>
  );
}
