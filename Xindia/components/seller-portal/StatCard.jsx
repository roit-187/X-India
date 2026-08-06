export default function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="seller-stat-card">
      {Icon && (
        <div
          className="seller-stat-icon"
          style={{
            '--sp-icon-bg': iconBg || 'rgba(232, 88, 28, 0.1)',
            '--sp-icon-color': iconColor || '#E8581C',
          }}
        >
          <Icon size={20} />
        </div>
      )}
      <div>
        <div className="seller-stat-value">{value}</div>
        <div className="seller-stat-label">{label}</div>
      </div>
    </div>
  );
}
