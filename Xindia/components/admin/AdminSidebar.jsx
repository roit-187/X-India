'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Factory, Users, Package, CreditCard, Coins, Star, Settings, LogOut, UserCog, Shield, Bell } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

// Navigation links with individual permission guards.
// adminOnly  → requires isSuperAdmin
// plansOnly  → requires canManagePlans
// creditsOnly → requires canManageCredits
const ALL_LINKS = [
  { href: '/admin/dashboard',     label: 'Dashboard',            icon: LayoutDashboard, flag: 'always' },
  { href: '/admin/manufacturers', label: 'Manufacturers',         icon: Factory,         flag: 'always' },
  { href: '/admin/buyers',        label: 'Buyers',                icon: Users,           flag: 'always' },
  { href: '/admin/products',      label: 'Products',              icon: Package,         flag: 'always' },
  { href: '/admin/reviews',       label: 'Reviews & Moderation',  icon: Star,            flag: 'always' },
  { href: '/admin/staff',         label: 'Staff & Team',          icon: UserCog,         flag: 'staff' },
  { href: '/admin/plans',         label: 'Plans & Pricing',       icon: CreditCard,      flag: 'plans' },
  { href: '/admin/credits',       label: 'Credits & Policy',      icon: Coins,           flag: 'credits' },
  { href: '/admin/legal',         label: 'Legal & Compliance',    icon: Shield,          flag: 'super' },
  { href: '/admin/alerts',        label: 'Critical Alerts',       icon: Bell,            flag: 'super' },
  { href: '/admin/settings',      label: 'System & Server',       icon: Settings,        flag: 'super' },
];

const ROLE_LABELS = {
  SUPER_ADMIN:        'Super Admin',
  PLATFORM_ADMIN:     'Platform Admin',
  OPERATIONS_ADMIN:   'Operations Admin',
  STAFF:              'Staff',
  SUPPORT_AGENT:      'Support Agent',
  MODERATOR:          'Moderator',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  FINANCE_ADMIN:      'Finance Admin',
  DEVOPS_ENGINEER:    'DevOps Engineer',
  SECURITY_ADMIN:     'Security Admin',
  AUDITOR:            'Auditor',
  // MASTER_ADMIN is intentionally omitted — it should never display a role label.
};

const ROLE_COLORS = {
  SUPER_ADMIN:      '#E8581C',
  PLATFORM_ADMIN:   '#2563EB',
  OPERATIONS_ADMIN: '#7C3AED',
  STAFF:            '#059669',
  SUPPORT_AGENT:    '#0891B2',
  MODERATOR:        '#D97706',
  COMPLIANCE_OFFICER: '#4F46E5',
};

function getRoleColor(role) {
  return ROLE_COLORS[role] || '#64748B';
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const {
    profile, role, isSuperAdmin,
    canManageStaff, canManagePlans, canManageCredits,
    loaded,
  } = useAdminPermissions();

  // Resolve which links to show based on delegated capabilities.
  const links = ALL_LINKS.filter(({ flag }) => {
    if (flag === 'always')  return true;
    if (flag === 'staff')   return canManageStaff;
    if (flag === 'plans')   return canManagePlans;
    if (flag === 'credits') return canManageCredits;
    if (flag === 'super')   return isSuperAdmin;
    return false;
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('admin_profile');
    window.location.href = '/login?tab=admin';
  };

  // Role display: MASTER_ADMIN shows no role badge (invisible role).
  const showRoleBadge = role && role !== 'MASTER_ADMIN';

  return (
    <aside className="admin-sidebar">
      <div style={{ marginBottom: 4, padding: '0 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Xindia Admin</div>
        {profile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            {showRoleBadge && (
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
            )}
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
