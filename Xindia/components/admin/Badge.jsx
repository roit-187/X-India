'use client';

const VARIANT_MAP = {
  active: 'admin-badge-green',
  verified: 'admin-badge-green',
  grace: 'admin-badge-yellow',
  expired: 'admin-badge-red',
  blocked: 'admin-badge-red',
  blacklisted: 'admin-badge-red',
  deactivated: 'admin-badge-red',
  inactive: 'admin-badge-red',
  none: 'admin-badge-gray',
  draft: 'admin-badge-gray',
  published: 'admin-badge-green',
};

export default function Badge({ label, variant }) {
  const cls = VARIANT_MAP[variant] || 'admin-badge-gray';
  return <span className={`admin-badge ${cls}`}>{label}</span>;
}
