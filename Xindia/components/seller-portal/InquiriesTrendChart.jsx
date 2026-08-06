'use client';

export default function InquiriesTrendChart({ series }) {
  const width = 640;
  const height = 180;
  const padX = 12;
  const padY = 16;

  if (!series || series.length === 0) {
    return <p style={{ color: '#94A3B8', fontSize: 13 }}>No inquiry activity yet.</p>;
  }

  const values = series.map((p) => p.count);
  const max = Math.max(1, ...values);
  const stepX = (width - padX * 2) / Math.max(1, series.length - 1);

  const points = series.map((p, i) => {
    const x = padX + i * stepX;
    const y = height - padY - (p.count / max) * (height - padY * 2);
    return { x, y, ...p };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padY} L ${points[0].x.toFixed(1)} ${height - padY} Z`;

  const totalInquiries = values.reduce((a, b) => a + b, 0);
  const firstHalf = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b, 0);
  const secondHalf = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b, 0);
  const trendingUp = secondHalf >= firstHalf;

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div className="seller-chart-card">
      <div className="seller-chart-header">
        <div>
          <h3 className="seller-chart-title">Inquiries Trend</h3>
          <span className="seller-chart-subtitle">Last {series.length} days · {totalInquiries} total</span>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            background: trendingUp ? '#D1FAE5' : '#FEE2E2',
            color: trendingUp ? '#047857' : '#B91C1C',
          }}
        >
          {trendingUp ? '▲ Trending up' : '▼ Trending down'}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="inquiriesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8581C" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#E8581C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padY + f * (height - padY * 2)}
            y2={padY + f * (height - padY * 2)}
            stroke="#E2E8F0"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#inquiriesFill)" />
        <path d={linePath} fill="none" stroke="#E8581C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5} fill="#E8581C" />
        ))}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
        <span>{formatDate(series[0].date)}</span>
        <span>{formatDate(series[series.length - 1].date)}</span>
      </div>
    </div>
  );
}
