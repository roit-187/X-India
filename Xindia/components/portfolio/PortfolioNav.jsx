'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '', label: 'Overview' },
  { href: '/products', label: 'Products' },
  { href: '/factory', label: 'Factory & Machinery' },
  { href: '/ratings', label: 'Ratings' },
  { href: '/opportunities', label: 'Business Opportunities' },
  { href: '/contact', label: 'Contact Us' },
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
          return (
            <Link key={tab.href} href={href} className={`portfolio-nav-link ${isActive ? 'active' : ''}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
