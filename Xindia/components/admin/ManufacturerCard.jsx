'use client';

import Link from 'next/link';
import Badge from './Badge';
import Toggle from './Toggle';

export default function ManufacturerCard({
  manufacturer,
  canManageSellers = false,
  onToggleActive,
  onOpenBlockModal,
  onUnblock,
}) {
  const planVariant = manufacturer.planStatus === 'active' ? 'active'
    : manufacturer.planStatus === 'grace' ? 'grace'
    : manufacturer.planStatus === 'expired' ? 'expired'
    : 'none';

  const isBlocked = manufacturer.blockedUntil && new Date(manufacturer.blockedUntil) > new Date();
  const isDeactivated = manufacturer.isActive === false;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="admin-card" style={isDeactivated ? { borderLeft: '4px solid #EF4444' } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href={`/admin/manufacturers/${manufacturer._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ margin: 0 }}>{manufacturer.name}</h3>
        </Link>
        {canManageSellers && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {manufacturer.isBlacklisted || isBlocked ? (
              <button className="admin-btn admin-btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onUnblock(manufacturer._id)}>Unblock</button>
            ) : (
              <button className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => onOpenBlockModal(manufacturer)}>Block</button>
            )}
            <Toggle checked={manufacturer.isActive} onChange={(next) => onToggleActive(manufacturer._id, next)} />
          </div>
        )}
      </div>

      {/* Complete status indicators visible to both staff and admins */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {isDeactivated && <Badge label="Deactivated" variant="deactivated" />}
        {manufacturer.isBlacklisted && <Badge label="Blacklisted" variant="blacklisted" />}
        {isBlocked && !manufacturer.isBlacklisted && (
          <Badge label={`Blocked until ${formatDate(manufacturer.blockedUntil)}`} variant="blocked" />
        )}
        {!isDeactivated && !manufacturer.isBlacklisted && !isBlocked && (
          <Badge label="Active" variant="active" />
        )}
        <Badge label={manufacturer.planStatus} variant={planVariant} />
        {manufacturer.verified && <Badge label="Verified" variant="verified" />}
        <Badge label={manufacturer.portfolioStatus} variant={manufacturer.portfolioStatus} />
      </div>

      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--adm-text-med)' }}>
        {manufacturer.productCount} products &middot; {manufacturer.rating?.toFixed(1) || '0.0'} ★ ({manufacturer.reviewCount || 0})
      </div>
      <div style={{ fontSize: 13, color: 'var(--adm-text-light)', marginTop: 4 }}>{manufacturer.address}</div>
    </div>
  );
}
