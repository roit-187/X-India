import { notFound, redirect } from 'next/navigation';
import {
  getSeller,
  getSellerProducts,
  getSellerReviews,
  getSellerOpportunities,
  getSellerDestination,
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

// Subscription validity and custom destinations must be checked for every request.
export const dynamic = 'force-dynamic';

export default async function SellerDigitalShowroomPage({ params, searchParams }) {
  const resolved = await getSellerDestination(params.slug);
  if (!resolved) notFound();
  if (resolved.destination && searchParams?.standard !== '1') {
    const destination = new URL(resolved.destination);
    if (typeof searchParams?.src === 'string' && ['qr', 'direct_share', 'app', 'search'].includes(searchParams.src)) {
      destination.searchParams.set('src', searchParams.src);
    }
    redirect(destination.href);
  }
  const seller = await getSeller(params.slug);
  if (!seller) notFound();

  // Canonical redirection if accessed via MongoDB ObjectId instead of slug
  if (seller.slug && params.slug !== seller.slug && /^[0-9a-fA-F]{24}$/.test(params.slug)) {
    const source = typeof searchParams?.src === 'string' && ['qr', 'direct_share', 'app', 'search'].includes(searchParams.src)
      ? `?src=${encodeURIComponent(searchParams.src)}`
      : '';
    redirect(`/p/${encodeURIComponent(seller.slug)}${source}`);
  }

  // Parallel data fetching for blazing fast performance
  const [productsData, reviewsData, opportunityData] = await Promise.all([
    getSellerProducts(params.slug, { page: 1, limit: 20 }),
    getSellerReviews(params.slug, { page: 1 }),
    getSellerOpportunities(params.slug),
  ]);
  const opportunities = opportunityData.opportunities || [];

  const products = productsData?.products || [];
  const reviews = reviewsData?.reviews || [];
  const averageRating = reviewsData?.averageRating ?? 0;
  const totalReviews = reviewsData?.totalReviews ?? 0;
  const hasReviews = reviews.length > 0 || totalReviews > 0;
  const totalProducts = productsData?.total ?? products.length;
  const hasCataloguePdf = Boolean(seller?.catalogue?.pdfUrl || seller?.catalogue?.storageUrl);
  const hasProductsSection = products.length > 0 || totalProducts > 0 || hasCataloguePdf;
  const customization = seller.portfolioCustomization || {};
  const allSections = {
    overview: <OverviewSection seller={seller} />,
    products: hasProductsSection ? (
      <ProductCatalogSection
        products={products}
        totalProducts={totalProducts}
        categories={productsData?.categories || []}
        seller={seller}
      />
    ) : null,
    ratings: hasReviews ? (
      <RatingsSection
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={totalReviews}
        slug={params.slug}
      />
    ) : null,
    opportunities: opportunities.length > 0 ? (
      <OpportunitiesSection opportunities={opportunities} totalPages={opportunityData.totalPages} seller={seller} />
    ) : null,
    factory: <FactorySection seller={seller} />,
    contact: <ContactRFQSection seller={seller} />,
  };
  const defaultSectionOrder = ['products', 'opportunities', 'overview', 'factory', 'ratings', 'contact'];
  const hiddenSections = new Set(customization.hiddenSections || []);
  const savedSectionOrder = Array.isArray(customization.sectionOrder)
    ? customization.sectionOrder.filter((id) => defaultSectionOrder.includes(id))
    : [];
  const requestedOrder = savedSectionOrder.length
    ? [...savedSectionOrder, ...defaultSectionOrder.filter((id) => !savedSectionOrder.includes(id))]
    : defaultSectionOrder;
  const sectionOrder = ['products', 'opportunities', 'overview', ...requestedOrder.filter((id) => !['products', 'opportunities', 'overview'].includes(id))];

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
        totalOpportunities={opportunityData.total || opportunities.length}
      />

      <div id="home">
        <PortfolioHero seller={seller} slug={params.slug} hasProductsSection={hasProductsSection} />
      </div>

      {sectionOrder.map((id) => {
        if ((!['products', 'opportunities', 'overview'].includes(id) && hiddenSections.has(id)) || !allSections[id]) return null;
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
