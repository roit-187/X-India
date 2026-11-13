import { CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Pricing Plans — XINDIA',
  description:
    'Choose the right plan to grow your manufacturing business on XINDIA. Transparent pricing with configurable membership validity.',
};

const SERVER_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.xindia.live';

async function fetchPlans() {
  try {
    const res = await fetch(`${SERVER_URL}/api/public/plans`, { next: { revalidate: 60 } });
    const data = await res.json();
    if (data.success && Array.isArray(data.plans) && data.plans.length > 0) return data.plans;
  } catch (_) {}
  return [];
}

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const calcDiscount = (real, crossed) => {
  if (!real || !crossed || crossed <= real) return null;
  return Math.round(((crossed - real) / crossed) * 100);
};

export default async function PricingPage() {
  const plans = await fetchPlans();
  const displayPlans = plans;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', background: 'rgba(232,88,28,0.15)', color: '#E8581C',
          fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', padding: '6px 16px',
          borderRadius: 20, marginBottom: 20, border: '1px solid rgba(232,88,28,0.3)',
        }}>
          TRANSPARENT PRICING
        </div>
        <h1 style={{ color: '#FFFFFF', fontSize: 44, fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
          Plans & Pricing
        </h1>
        <p style={{ color: '#94A3B8', fontSize: 16, margin: '0 auto', maxWidth: 500 }}>
          Choose the plan and validity that fit your business. Paid upcoming plans start after your current membership.
        </p>

        {/* Billing Toggle (client-driven via URL query not needed — rendering both via SSR) */}
        <PricingToggleSection plans={displayPlans} />
      </div>
    </div>
  );
}

import { Suspense } from 'react';
import PricingClientSection from './PricingClientSection';

// Re-export with client section inside Suspense boundary (required for useSearchParams in Next 14)
function PricingToggleSection({ plans }) {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px 0', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
        Loading plans...
      </div>
    }>
      <PricingClientSection plans={plans} />
    </Suspense>
  );
}
