import { CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Pricing Plans — XINDIA',
  description:
    'Choose the right plan to grow your manufacturing business on XINDIA. Transparent pricing with monthly and yearly billing options.',
};

const SERVER_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ascend-ds0q.onrender.com';

async function fetchPlans() {
  try {
    const res = await fetch(`${SERVER_URL}/api/public/plans`, { next: { revalidate: 60 } });
    const data = await res.json();
    if (data.success && Array.isArray(data.plans) && data.plans.length > 0) return data.plans;
  } catch (_) {}
  return [];
}

const FALLBACK_PLANS = [
  {
    key: 'basic', name: 'Basic', tagline: 'Best for getting started as a supplier',
    monthlyPrice: 999, yearlyPrice: 5994,
    crossedMonthlyPrice: 1999, crossedYearlyPrice: 11994,
    showMonthlyCrossedPrice: true, showYearlyCrossedPrice: true,
    badge: '', color: '#10B981', isMostPopular: false,
    features: ['Verified Seller Profile', 'Receive Buyer Enquiries', 'Basic Search Listing', 'Community Access'],
  },
  {
    key: 'growth', name: 'Growth', tagline: 'For growing manufacturers seeking high volume',
    monthlyPrice: 1999, yearlyPrice: 11994,
    crossedMonthlyPrice: 3999, crossedYearlyPrice: 23994,
    showMonthlyCrossedPrice: true, showYearlyCrossedPrice: true,
    badge: 'MOST POPULAR', color: '#2563EB', isMostPopular: true,
    features: ['Verified Manufacturer Badge', 'Higher Search Visibility', 'RFQ & Enquiry Alerts', 'Manufacturing Map Listing', 'Business Profile Insights'],
  },
  {
    key: 'pro', name: 'Pro', tagline: 'For scaling enterprises requiring priority placement',
    monthlyPrice: 4499, yearlyPrice: 26994,
    crossedMonthlyPrice: 8999, crossedYearlyPrice: 53994,
    showMonthlyCrossedPrice: true, showYearlyCrossedPrice: true,
    badge: 'BEST VALUE', color: '#8B5CF6', isMostPopular: false,
    features: ['All Growth Features', 'Top Placement in Search', 'Lead Analytics Dashboard', 'Featured Manufacturer Banner', 'Priority 24/7 Support', 'Market Insights Reports'],
  },
];

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const calcDiscount = (real, crossed) => {
  if (!real || !crossed || crossed <= real) return null;
  return Math.round(((crossed - real) / crossed) * 100);
};

export default async function PricingPage() {
  const plans = await fetchPlans();
  const displayPlans = plans.length > 0 ? plans : FALLBACK_PLANS;

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
          Choose the plan that fits your business. Upgrade, downgrade, or cancel anytime.
        </p>

        {/* Billing Toggle (client-driven via URL query not needed — rendering both via SSR) */}
        <PricingToggleSection plans={displayPlans} />
      </div>
    </div>
  );
}

/* We use a client component for the billing toggle + cards */
import PricingClientSection from './PricingClientSection';

// Re-export with client section
function PricingToggleSection({ plans }) {
  return <PricingClientSection plans={plans} />;
}
