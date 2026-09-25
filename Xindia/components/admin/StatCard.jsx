import Link from 'next/link';

export default function StatCard({ label, value, subtext, subtextLink, subtextColor, href }) {
  const card = (
    <div className="admin-stat-card" style={href ? { cursor: 'pointer' } : {}}>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
      {subtext && (
        <div style={{ marginTop: 6 }}>
          {subtextLink ? (
            <Link
              href={subtextLink}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: subtextColor || '#16A34A',
                textDecoration: 'none',
              }}
            >
              {subtext}
            </Link>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: subtextColor || '#64748B' }}>
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</Link>;
  }
  return card;
}
