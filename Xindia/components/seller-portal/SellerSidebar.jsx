'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, FileText, Package, Rocket, Users, LogOut } from 'lucide-react';

const LINKS = [
  { href: '/seller-portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/seller-portal/profile', label: 'My Profile', icon: Building2 },
  { href: '/seller-portal/portfolio', label: 'Portfolio', icon: FileText },
  { href: '/seller-portal/products', label: 'Products', icon: Package },
  { href: '/seller-portal/opportunities', label: 'Opportunities', icon: Rocket },
  { href: '/seller-portal/buyer-activity', label: 'Buyer Activity', icon: Users },
];

export default function SellerSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('seller_user_id');
      window.location.href = '/login?tab=seller';
    }
  };

  return (
    <aside className="seller-sidebar">
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 24, padding: '0 12px' }}>Seller Portal</div>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`seller-sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="seller-sidebar-link"
        style={{ width: '100%', background: 'none', border: 'none', marginTop: 24, cursor: 'pointer' }}
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
