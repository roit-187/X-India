'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ProfileEditForm from '@/components/seller-portal/ProfileEditForm';
import Badge from '@/components/admin/Badge';
import { Globe, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function SellerProfilePage() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seller/portfolio');
      const data = await res.json();

      if (data.success) {
        setPortfolio(data.manufacturer);
      } else {
        setError(data.message || 'Failed to load profile details');
      }
    } catch (err) {
      console.error(err);
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ maxWidth: 900, padding: '40px 0' }}>
        <p style={{ color: 'var(--sp-text-med)' }}>Loading your business profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, padding: '40px 0' }}>
        <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', color: '#B91C1C', padding: 16, borderRadius: 8 }}>
          {error}
        </div>
      </div>
    );
  }

  const isPublished = portfolio?.portfolioStatus === 'published';

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Top Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--sp-text)' }}>My Business Profile</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--sp-text-med)' }}>
            Manage your official onboarding information, plant infrastructure, contact desk, and certifications.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
            <Badge label={isPublished ? 'Live on Marketplace' : 'Draft Mode'} variant={isPublished ? 'published' : 'draft'} />
            {portfolio?.verified && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                <ShieldCheck size={14} /> Verified Manufacturer
              </span>
            )}
          </div>
        </div>

        {/* Quick Link to Storefront Management */}
        <Link
          href="/seller-portal/portfolio"
          className="seller-btn seller-btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: 13.5 }}
        >
          <Globe size={16} color="var(--sp-primary)" />
          Storefront & Publishing
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Profile Editor Form Card */}
      <div className="seller-card">
        <ProfileEditForm
          initialData={portfolio}
          onUpdateSuccess={() => loadData()}
        />
      </div>
    </div>
  );
}
