'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { openSellerInApp } from '@/lib/portfolioAnalytics';
import PortfolioImage from './PortfolioImage';
import {
  Home,
  Package,
  Factory,
  Star,
  Briefcase,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

const SECTIONS = [
  { id: 'home', label: 'Home', icon: Home, page: 'catalog' },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'factory', label: 'Factory & Specs', icon: Factory, page: 'catalog' },
  { id: 'ratings', label: 'Ratings & Reviews', icon: Star, page: 'catalog' },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase, page: 'catalog' },
  { id: 'contact', label: 'Contact & RFQ', icon: PhoneCall, page: 'catalog' },
];

export default function PortfolioStickyNav({ seller, slug, currentPage = 'catalog', totalProducts = 0, totalReviews = 0, totalOpportunities = 0 }) {
  const hasProductsSection = totalProducts > 0 || Boolean(seller?.catalogue?.pdfUrl || seller?.catalogue?.storageUrl);
  const [activeSection, setActiveSection] = useState(currentPage === 'home' ? 'home' : (hasProductsSection ? 'products' : 'home'));
  const [isScrolled, setIsScrolled] = useState(false);
  const portfolioPath = `/p/${encodeURIComponent(seller?.slug || slug || '')}`;
  const factoryPhotos = Array.isArray(seller?.manufacturingPlants) && seller.manufacturingPlants.length > 0
    ? seller.manufacturingPlants
    : (Array.isArray(seller?.factoryPhotos) && seller.factoryPhotos.length > 0
      ? seller.factoryPhotos
      : (Array.isArray(seller?.gallery) ? seller.gallery : []));
  const hasFactoryContent = Boolean(
    seller?.factorySize || seller?.machinesCount > 0 || seller?.employeesCount > 0 ||
    seller?.monthlyCapacity || seller?.exportPercentage || seller?.factoryVideo ||
    seller?.aboutFactory || (Array.isArray(seller?.factories) && seller.factories.length > 0) || factoryPhotos.length > 0
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 280);

      // Scroll Spy detection
      const scrollPosition = scrollY + 200;
      const nearest = SECTIONS.map(({ id }) => ({ id, element: document.getElementById(id) }))
        .filter(({ element }) => element && element.getBoundingClientRect().top + scrollY <= scrollPosition)
        .sort((a, b) => b.element.getBoundingClientRect().top - a.element.getBoundingClientRect().top)[0];
      if (nearest) setActiveSection(nearest.id);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  // Home and Products stay first and available regardless of seller customization.
  const optionalOrder = seller?.portfolioCustomization?.sectionOrder || [];
  const hiddenSections = new Set(seller?.portfolioCustomization?.hiddenSections || []);
  const fixedSections = SECTIONS.filter((section) => ['home', 'products'].includes(section.id));
  const orderedOptionalSections = [
    ...optionalOrder
      .filter((id) => !['home', 'products'].includes(id))
      .map((id) => SECTIONS.find((section) => section.id === id)),
    ...SECTIONS.filter((section) => !['home', 'products'].includes(section.id)),
  ].filter((section, index, all) => section && all.findIndex((item) => item?.id === section.id) === index);
  const hasCataloguePdf = Boolean(seller?.catalogue?.pdfUrl || seller?.catalogue?.storageUrl);
  const visibleSections = [
    ...fixedSections,
    ...orderedOptionalSections.filter((section) => section.id === 'opportunities'),
    ...orderedOptionalSections.filter((section) => section.id !== 'opportunities' && !hiddenSections.has(section.id)),
  ].filter((section) => {
    if (section.id === 'products') return totalProducts > 0 || hasCataloguePdf;
    if (section.id === 'factory') return hasFactoryContent;
    if (section.id === 'opportunities') return totalOpportunities > 0;
    if (section.id === 'ratings') return totalReviews > 0;
    return true;
  });

  const getHref = (section) => {
    if (section.id === 'home') return currentPage === 'catalog' ? '#home' : `${portfolioPath}#home`;
    if (section.id === 'products') return currentPage === 'catalog' ? '#products' : `${portfolioPath}#products`;
    if (section.page === currentPage) return `#${section.id}`;
    return section.page === 'home'
      ? `${portfolioPath}/home#${section.id}`
      : `${portfolioPath}#${section.id}`;
  };

  const handleNavClick = (e, section) => {
    const localPage = section.id === 'home'
      ? currentPage === 'home' || currentPage === 'catalog'
      : section.id === 'products'
        ? currentPage === 'catalog'
        : section.page === currentPage;
    const elem = localPage ? document.getElementById(section.id) : null;
    if (elem) {
      e.preventDefault();
      const navHeight = document.querySelector('.portfolio-sticky-dock')?.getBoundingClientRect().height || 85;
      const offsetTop = elem.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      window.scrollTo({
        top: offsetTop,
        behavior,
      });
      setActiveSection(section.id);
    }
  };

  return (
    <nav className={`portfolio-sticky-dock ${isScrolled ? 'scrolled' : ''}`}>
      <div className="portfolio-dock-container">
        {/* Left mini brand presence (visible when scrolled) */}
        <div className={`portfolio-dock-brand ${isScrolled ? 'visible' : ''}`}>
          {seller.logo && <PortfolioImage src={seller.logo} alt="" className="portfolio-dock-logo" placeholderLabel="Seller logo unavailable" showPlaceholderText={false} />}
          <div className="portfolio-dock-brand-text">
            <span className="portfolio-dock-brand-name">{seller.name}</span>
            {seller.verified && <span className="portfolio-dock-brand-badge">XINDIA verified</span>}
          </div>
        </div>

        {/* Center navigation tabs */}
        <div className="portfolio-dock-tabs">
          {visibleSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;

            let count = null;
            if (sec.id === 'products' && totalProducts > 0) count = totalProducts;
            if (sec.id === 'ratings' && totalReviews > 0) count = totalReviews;
            if (sec.id === 'opportunities' && totalOpportunities > 0) count = totalOpportunities;

            return (
              <motion.a
                key={sec.id}
                href={getHref(sec)}
                onClick={(e) => handleNavClick(e, sec)}
                className={`portfolio-dock-tab ${['home', 'products'].includes(sec.id) ? 'portfolio-dock-tab-core' : 'portfolio-dock-tab-optional'} ${isActive ? 'active' : ''}`}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.16 }}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={14} className="portfolio-dock-tab-icon" />
                <span>{sec.label}</span>
                {count !== null && (
                  <span className={`portfolio-dock-tab-count ${isActive ? 'active' : ''}`}>
                    {count}
                  </span>
                )}
              </motion.a>
            );
          })}
        </div>

        {/* Right CTA */}
        <div className="portfolio-dock-cta-wrap">
          <a
            href={getHref(SECTIONS.find((section) => section.id === 'contact'))}
            onClick={(e) => {
              if (openSellerInApp(seller?._id || seller?.id, seller?.slug || slug)) {
                e.preventDefault();
                return;
              }
              handleNavClick(e, SECTIONS.find((section) => section.id === 'contact'));
            }}
            className="portfolio-dock-rfq-btn"
            aria-label="Request a quote"
          >
            <Sparkles size={13} />
            <span>Request Quote</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
