'use client';

import Link from 'next/link';
import Badge from './Badge';

export default function BuyerCard({ buyer, onOpenBlockModal, onUnblock }) {
  const isBlocked = buyer.blockedUntil && new Date(buyer.blockedUntil) > new Date();

  // Determine active/passive: active if lastActiveAt within last 30 days
  const isActiveBuyer = buyer.lastActiveAt
    ? (Date.now() - new Date(buyer.lastActiveAt).getTime()) < 30 * 24 * 60 * 60 * 1000
    : false;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="admin-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Link href={`/admin/buyers/${buyer._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <h3 style={{ margin: 0 }}>{buyer.firstName} {buyer.lastName}</h3>
        </Link>
        <div>
          {buyer.isBlacklisted || isBlocked ? (
            <button className="admin-btn admin-btn-secondary" onClick={() => onUnblock(buyer._id)}>Unblock</button>
          ) : (
            <button className="admin-btn admin-btn-danger" onClick={() => onOpenBlockModal(buyer)}>Block</button>
          )}
        </div>
      </div>

      {/* Status badges */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {buyer.isBlacklisted && <Badge label="Blacklisted" variant="blacklisted" />}
        {isBlocked && !buyer.isBlacklisted && (
          <Badge label={`Blocked until ${formatDate(buyer.blockedUntil)}`} variant="blocked" />
        )}
        {!buyer.isBlacklisted && !isBlocked && (
          <Badge label={isActiveBuyer ? 'Active' : 'Passive'} variant={isActiveBuyer ? 'active' : 'none'} />
        )}
      </div>

      {/* Contact info */}
      <div style={{ marginTop: 8, fontSize: 13, color: 'var(--adm-text-med)' }}>
        {buyer.email} &middot; {buyer.phone}
      </div>
      <div style={{ fontSize: 13, color: 'var(--adm-text-light)', marginTop: 2 }}>
        {buyer.location || 'No location'}
      </div>

      {/* Join date + last active */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'var(--adm-text-light)' }}>
        <span>Joined: <strong style={{ color: 'var(--adm-text-med)' }}>{formatDate(buyer.createdAt)}</strong></span>
        {buyer.lastActiveAt && (
          <span>Last active: <strong style={{ color: 'var(--adm-text-med)' }}>{formatDate(buyer.lastActiveAt)}</strong></span>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: 'var(--adm-text-med)', borderTop: '1px solid var(--adm-border)', paddingTop: 10 }}>
        <span>Inquiries: <strong>{buyer.inquiryCount || 0}</strong></span>
        <span>Conversations: <strong>{buyer.conversationCount || 0}</strong></span>
      </div>
    </div>
  );
}
