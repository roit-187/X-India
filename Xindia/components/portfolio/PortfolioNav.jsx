'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Factory, Star, Briefcase, PhoneCall } from 'lucide-react';

const TABS = [
  { href: '', label: 'Overview', icon: LayoutGrid },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/factory', label: 'Factory & Machinery', icon: Factory },
  { href: '/ratings', label: 'Ratings', icon: Star },
  { href: '/opportunities', label: 'Business Opportunities', icon: Briefcase },
  { href: '/contact', label: 'Contact Us', icon: PhoneCall },
];

export default function PortfolioNav({ slug }) {
  const pathname = usePathname();
  const base = `/p/${slug}`;

  return (
    <nav className="portfolio-nav">
      <div className="portfolio-nav-inner">
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={href}
              className={`portfolio-nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
