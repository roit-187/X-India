'use client';

import { useState, useEffect, useCallback } from 'react';
import { Package, MessageSquareText, MessagesSquare, Star, Coins, CalendarClock } from 'lucide-react';
import StatCard from '@/components/seller-portal/StatCard';
import InquiriesTrendChart from '@/components/seller-portal/InquiriesTrendChart';
import Badge from '@/components/admin/Badge';

export default function SellerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, trendRes] = await Promise.all([
        fetch('/api/seller/dashboard/stats'),
        fetch('/api/seller/dashboard/inquiries-trend'),
      ]);
      const data = await statsRes.json();
      const trendData = await trendRes.json();

      if (data.success) {
        setStats(data);
        setLastRefreshed(new Date());
      } else {
        setError(data.message || 'Failed to load dashboard stats');
      }

      if (trendData.success) {
        setTrend(trendData.series);
      }
    } catch (err) {
      console.error(err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    // Poll every 30 seconds for plan status updates from mobile app
    const interval = setInterval(loadStats, 30 * 1000);
    return () => clearInterval(interval);
  }, [loadStats]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: '#EF4444' }}>{error}</p>;
  if (!stats) return <p>No stats available</p>;

  const completionPct = stats.totalRequired ? Math.round((stats.completedCount / stats.totalRequired) * 100) : 0;

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Seller Dashboard</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <Badge label={`Plan: ${stats.planStatus}`} variant={stats.planStatus} />
            {stats.verified && <Badge label="Verified Factory" variant="verified" />}
            <Badge label={`Portfolio: ${stats.portfolioStatus}`} variant={stats.portfolioStatus} />
          </div>
          {lastRefreshed && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              Auto-refreshes every 30s · Last updated: {lastRefreshed.toLocaleTimeString()}
            </div>
          )}
        </div>

        {stats.planStatus !== 'active' && (
          <button className="seller-btn seller-btn-primary" onClick={() => alert('Plan renewal flow is managed via mobile app.')}>
            Renew Plan
          </button>
        )}
      </div>

      {/* Progress Bar Profile Completeness */}
      <div className="seller-card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Profile Completeness</h3>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{stats.completedCount} of {stats.totalRequired} fields ({completionPct}%)</span>
        </div>
        <div style={{ background: '#E2E8F0', height: 10, borderRadius: 5, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ background: completionPct === 100 ? '#10B981' : '#E8581C', height: '100%', width: `${completionPct}%`, transition: 'width 0.3s' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, fontSize: 13 }}>
          {stats.mandatoryFieldsComplete && Object.entries(stats.mandatoryFieldsComplete).map(([key, isDone]) => (
            <div key={key} style={{ color: isDone ? '#047857' : '#92400E' }}>
              {isDone ? '✓' : '✗'} <span style={{ textTransform: 'capitalize' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="seller-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Products Listed" value={stats.productCount ?? 0} icon={Package} iconBg="rgba(59,130,246,0.1)" iconColor="#3B82F6" />
        <StatCard label="Total Inquiries" value={stats.totalInquiries ?? 0} icon={MessageSquareText} iconBg="rgba(232,88,28,0.1)" iconColor="#E8581C" />
        <StatCard label="Conversations" value={stats.conversationCount ?? 0} icon={MessagesSquare} iconBg="rgba(16,185,129,0.1)" iconColor="#10B981" />
        <StatCard label="Rating" value={`${stats.rating?.toFixed(1) || '0.0'} ★ (${stats.reviewCount || 0})`} icon={Star} iconBg="rgba(245,158,11,0.1)" iconColor="#F59E0B" />
        <StatCard label="Credits Balance" value={stats.creditsBalance ?? 0} icon={Coins} iconBg="rgba(139,92,246,0.1)" iconColor="#8B5CF6" />
        <StatCard label="Plan Expiry" value={stats.planExpiresAt ? new Date(stats.planExpiresAt).toLocaleDateString() : '-'} icon={CalendarClock} iconBg="rgba(100,116,139,0.1)" iconColor="#64748B" />
      </div>

      {/* Inquiries Trend Chart */}
      {trend && <InquiriesTrendChart series={trend} />}
    </div>
  );
}
