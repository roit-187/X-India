'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Factory,
  Star,
  Briefcase,
  PhoneCall,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'factory', label: 'Factory & Specs', icon: Factory },
  { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'contact', label: 'Contact & RFQ', icon: PhoneCall },
];

export default function PortfolioStickyNav({ seller, totalProducts = 0, totalReviews = 0, totalOpportunities = 0 }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 280);

      // Scroll Spy detection
      const scrollPosition = scrollY + 200;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const sec = document.getElementById(SECTIONS[i].id);
        if (sec && sec.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter nav tabs: hide Opportunities tab when there are none
  const visibleSections = SECTIONS.filter(
    (sec) => sec.id !== 'opportunities' || totalOpportunities > 0
  );

  const handleNavClick = (e, id) => {
    e.preventDefault();
    const elem = document.getElementById(id);
    if (elem) {
      const offsetTop = elem.getBoundingClientRect().top + window.scrollY - 85;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
      setActiveSection(id);
    }
  };

  return (
    <nav className={`portfolio-sticky-dock ${isScrolled ? 'scrolled' : ''}`}>
      <div className="portfolio-dock-container">
        {/* Left mini brand presence (visible when scrolled) */}
        <div className={`portfolio-dock-brand ${isScrolled ? 'visible' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={seller.logo || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=60&auto=format&fit=crop'}
            alt=""
            className="portfolio-dock-logo"
          />
          <div className="portfolio-dock-brand-text">
            <span className="portfolio-dock-brand-name">{seller.name}</span>
            <span className="portfolio-dock-brand-badge">
              <ShieldCheck size={11} color="#10B981" /> Verified
            </span>
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
              <a
                key={sec.id}
                href={`#${sec.id}`}
                onClick={(e) => handleNavClick(e, sec.id)}
                className={`portfolio-dock-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={14} className="portfolio-dock-tab-icon" />
                <span>{sec.label}</span>
                {count !== null && (
                  <span className={`portfolio-dock-tab-count ${isActive ? 'active' : ''}`}>
                    {count}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        {/* Right CTA */}
        <div className="portfolio-dock-cta-wrap">
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, 'contact')}
            className="portfolio-dock-rfq-btn"
          >
            <Sparkles size={13} />
            <span>Request Quote</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
