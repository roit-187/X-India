'use client';

import { useState } from 'react';

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const calcDiscount = (real, crossed) => {
  if (!real || !crossed || crossed <= real) return null;
  return Math.round(((crossed - real) / crossed) * 100);
};

function PlanCard({ plan, billing }) {
  const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const crossedPrice = billing === 'monthly' ? plan.crossedMonthlyPrice : plan.crossedYearlyPrice;
  const showCrossed = billing === 'monthly' ? plan.showMonthlyCrossedPrice : plan.showYearlyCrossedPrice;
  const discount = showCrossed ? calcDiscount(price, crossedPrice) : null;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: 24,
      border: `2px solid ${plan.isMostPopular ? plan.color : '#E2E8F0'}`,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: plan.isMostPopular ? `0 8px 32px ${plan.color}22` : '0 2px 12px rgba(0,0,0,0.06)',
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>

      {plan.badge && (
        <div style={{
          display: 'inline-block', background: plan.color, color: '#fff',
          fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
          borderRadius: 8, padding: '4px 12px', marginBottom: 14,
          alignSelf: 'flex-start',
        }}>
          {plan.badge}
        </div>
      )}

      <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900, color: '#0F172A' }}>{plan.name}</h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{plan.tagline}</p>

      {/* Price */}
      <div style={{ marginBottom: 24 }}>
        {showCrossed && crossedPrice && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ textDecoration: 'line-through', color: '#CBD5E1', fontSize: 15 }}>
              {formatPrice(crossedPrice)}/{billing === 'monthly' ? 'mo' : 'yr'}
            </span>
            {discount && (
              <span style={{
                background: '#DCFCE7', color: '#16A34A',
                fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '3px 10px',
              }}>
                {discount}% OFF
              </span>
            )}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: plan.color }}>{formatPrice(price)}</span>
          <span style={{ fontSize: 14, color: '#94A3B8' }}>/{billing === 'monthly' ? 'month' : 'year'}</span>
        </div>
        {billing === 'yearly' && (
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748B' }}>
            Billed annually — {formatPrice(Math.round(price / 12))}/month
          </p>
        )}
      </div>

      {/* CTA */}
      <a
        href="/login"
        style={{
          display: 'block', textAlign: 'center', padding: '13px 20px',
          borderRadius: 12, textDecoration: 'none',
          background: plan.isMostPopular ? plan.color : '#F1F5F9',
          color: plan.isMostPopular ? '#fff' : '#0F172A',
          fontWeight: 800, fontSize: 14, marginBottom: 24,
          transition: 'opacity 0.2s',
        }}
      >
        Get Started with {plan.name}
      </a>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(plan.features || []).map((feat, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
              <circle cx="8" cy="8" r="8" fill={plan.color} fillOpacity="0.15" />
              <path d="M5 8.5L7 10.5L11 6" stroke={plan.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PricingClientSection({ plans }) {
  const [billing, setBilling] = useState('yearly');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, marginBottom: 48 }}>
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 14,
          padding: 4, gap: 0, border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {['monthly', 'yearly'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBilling(cycle)}
              style={{
                padding: '10px 28px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: billing === cycle ? '#fff' : 'transparent',
                color: billing === cycle ? '#0F172A' : '#94A3B8',
                fontWeight: 800, fontSize: 14, transition: 'all 0.2s',
                boxShadow: billing === cycle ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span style={{
                  marginLeft: 6, background: '#DCFCE7', color: '#16A34A',
                  fontSize: 10, fontWeight: 800, borderRadius: 6, padding: '2px 7px',
                }}>
                  Save more
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 24,
        paddingBottom: 80,
      }}>
        {plans.map((plan) => (
          <PlanCard key={plan.key} plan={plan} billing={billing} />
        ))}
      </div>

      {/* Bottom Trust Row */}
      <div style={{
        textAlign: 'center', paddingBottom: 60,
        color: '#64748B', fontSize: 13,
      }}>
        <p>All plans include a 7-day grace period. No hidden charges. Cancel anytime.</p>
      </div>
    </div>
  );
}
