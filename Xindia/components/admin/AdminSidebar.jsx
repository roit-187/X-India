'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Factory, Users, Package, CreditCard, Coins, Star, LogOut } from 'lucide-react';
import SearchBar from './SearchBar';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/manufacturers', label: 'Manufacturers', icon: Factory },
  { href: '/admin/buyers', label: 'Buyers', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/plans', label: 'Plans & Pricing', icon: CreditCard },
  { href: '/admin/credits', label: 'Credits & Policy', icon: Coins },
  { href: '/admin/reviews', label: 'Reviews & Moderation', icon: Star },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login?tab=admin';
  };

  return (
    <aside className="admin-sidebar">
      <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20, padding: '0 12px' }}>Xindia Admin</div>
      <div style={{ marginBottom: 20, padding: '0 4px' }}>
        <SearchBar />
      </div>
      {LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link key={href} href={href} className={`admin-sidebar-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
      <button
        onClick={handleLogout}
        className="admin-sidebar-link"
        style={{ width: '100%', background: 'none', border: 'none', marginTop: 24, cursor: 'pointer' }}
      >
        <LogOut size={18} />
        Logout
      </button>
    </aside>
  );
}
