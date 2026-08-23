'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Factory, Users, Package, CreditCard, Coins, Star, Settings, LogOut, ShieldCheck, UserCog } from 'lucide-react';
import SearchBar from './SearchBar';

// All possible links — each has an optional `adminOnly` flag meaning STAFF cannot see it.
const ALL_LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/admin/manufacturers', label: 'Manufacturers', icon: Factory, adminOnly: false },
  { href: '/admin/buyers', label: 'Buyers', icon: Users, adminOnly: false },
  { href: '/admin/products', label: 'Products', icon: Package, adminOnly: false },
  { href: '/admin/reviews', label: 'Reviews & Moderation', icon: Star, adminOnly: false },
  { href: '/admin/plans', label: 'Plans & Pricing', icon: CreditCard, adminOnly: true },
  { href: '/admin/credits', label: 'Credits & Policy', icon: Coins, adminOnly: true },
  { href: '/admin/settings', label: 'System & Server', icon: Settings, adminOnly: true },
];

const ADMIN_ROLES = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'DEVOPS_ENGINEER', 'SECURITY_ADMIN', 'AUDITOR', 'COMPLIANCE_OFFICER'];

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  PLATFORM_ADMIN: 'Platform Admin',
  OPERATIONS_ADMIN: 'Operations Admin',
  STAFF: 'Staff',
  SUPPORT_AGENT: 'Support Agent',
  MODERATOR: 'Moderator',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  FINANCE_ADMIN: 'Finance Admin',
  DEVOPS_ENGINEER: 'DevOps Engineer',
  SECURITY_ADMIN: 'Security Admin',
  AUDITOR: 'Auditor',
};

const ROLE_COLORS = {
  SUPER_ADMIN: '#E8581C',
  PLATFORM_ADMIN: '#2563EB',
  STAFF: '#059669',
};

function getRoleColor(role) {
  return ROLE_COLORS[role] || '#64748B';
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_profile');
      if (stored) setProfile(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  const role = profile?.role || null;
  const isAdmin = !role || ADMIN_ROLES.includes(role);

  // Filter links based on role
  const links = ALL_LINKS.filter((link) => isAdmin || !link.adminOnly);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('admin_profile');
    window.location.href = '/login?tab=admin';
  };

  return (
    <aside className="admin-sidebar">
      <div style={{ marginBottom: 4, padding: '0 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Xindia Admin</div>
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: getRoleColor(role),
              color: '#fff',
              letterSpacing: '0.03em',
            }}>
              {ROLE_LABELS[role] || role}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.username}
            </span>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20, marginTop: 16, padding: '0 4px' }}>
        <SearchBar />
      </div>

      {links.map(({ href, label, icon: Icon }) => {
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
