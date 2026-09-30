'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const formatPrice = (amount) =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

const calcDiscount = (real, crossed) => {
  if (!real || !crossed || crossed <= real) return null;
  return Math.round(((crossed - real) / crossed) * 100);
};

// Dynamically load Razorpay SDK
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PlanCard({ plan, billing, onSelectPlan, isAuthenticated }) {
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

      {/* CTA Button */}
      {isAuthenticated ? (
        <button
          type="button"
          onClick={() => onSelectPlan(plan)}
          style={{
            display: 'block', width: '100%', textAlign: 'center', padding: '13px 20px',
            borderRadius: 12, border: 'none', cursor: 'pointer',
            background: plan.isMostPopular ? plan.color : '#0F172A',
            color: '#FFFFFF',
            fontWeight: 800, fontSize: 14, marginBottom: 24,
            transition: 'opacity 0.2s',
          }}
        >
          Upgrade with GST Invoice →
        </button>
      ) : (
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
      )}

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
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialPlan = searchParams.get('selected') || '';
  const initialCycle = searchParams.get('cycle') === 'monthly' ? 'monthly' : 'yearly';
  const hasAuthSuccess = searchParams.get('auth') === 'success';

  const [billing, setBilling] = useState(initialCycle);
  const [isAuthenticated, setIsAuthenticated] = useState(hasAuthSuccess);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState(null);
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Check if seller session is active via seller portfolio endpoint
    fetch('/api/seller/portfolio/status')
      .then((res) => {
        if (res.ok) setIsAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // If arriving from magic login with a selected plan, open checkout automatically
    if (initialPlan && (hasAuthSuccess || isAuthenticated)) {
      const match = plans.find((p) => p.key === initialPlan);
      if (match) {
        setActiveCheckoutPlan(match);
      }
    }
  }, [initialPlan, hasAuthSuccess, isAuthenticated, plans]);

  const handleStartCheckout = async () => {
    if (!activeCheckoutPlan) return;
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Payment gateway SDK could not be loaded. Please check your internet connection.');
      }

      const res = await fetch('/api/seller/plan/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey: activeCheckoutPlan.key,
          billingCycle: billing,
          gstin: gstin.trim() || undefined,
          businessName: businessName.trim() || undefined,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to initiate order. Please try again.');
      }

      if (orderData.isFree) {
        router.push('/payment-success');
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'XIndia Marketplace',
        description: `${activeCheckoutPlan.name} (${billing})`,
        order_id: orderData.orderId,
        prefill: {
          name: businessName || undefined,
        },
        theme: {
          color: '#FF5500',
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/seller/plan/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                planKey: activeCheckoutPlan.key,
                billingCycle: billing,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              window.location.href = `/payment-success?order_id=${encodeURIComponent(response.razorpay_order_id)}&payment_id=${encodeURIComponent(response.razorpay_payment_id)}`;
            } else {
              setErrorMsg(verifyData.message || 'Payment verification failed.');
            }
          } catch (vErr) {
            setErrorMsg(vErr.message || 'Verification failed. Please contact support.');
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setErrorMsg(err.message || 'Unable to start checkout.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>

      {/* Magic Link Login Banner */}
      {hasAuthSuccess && (
        <div style={{
          marginTop: 24,
          padding: '16px 20px',
          backgroundColor: '#ECFDF5',
          border: '1.5px solid #10B981',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: '#065F46',
        }}>
          <span style={{ fontSize: 20 }}>✅</span>
          <div>
            <strong style={{ display: 'block', fontSize: 14 }}>Authenticated via Secure Magic Link</strong>
            <span style={{ fontSize: 12, color: '#047857' }}>
              Your seller session is verified. Select your corporate membership below to generate your statutory 18% GST Tax Invoice.
            </span>
          </div>
        </div>
      )}

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
          <PlanCard
            key={plan.key}
            plan={plan}
            billing={billing}
            onSelectPlan={(p) => setActiveCheckoutPlan(p)}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {/* B2B GST Corporate Checkout Modal */}
      {activeCheckoutPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 9999,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: 32,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative',
          }}>
            <button
              onClick={() => setActiveCheckoutPlan(null)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B',
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
              Confirm Corporate Upgrade
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              Statutory GST B2B Invoice (SAC 998439) with 18% Input Tax Credit will be issued upon payment.
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              border: '1px solid #E2E8F0',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                <span style={{ color: '#64748B' }}>Plan:</span>
                <strong style={{ color: '#0F172A' }}>{activeCheckoutPlan.name} ({billing})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Total Amount:</span>
                <strong style={{ color: '#FF5500', fontSize: 18 }}>
                  {formatPrice(billing === 'yearly' ? activeCheckoutPlan.yearlyPrice : activeCheckoutPlan.monthlyPrice)}
                </strong>
              </div>
            </div>

            {/* GSTIN Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Business GSTIN (Optional — for 18% ITC Tax Credit):
              </label>
              <input
                type="text"
                placeholder="e.g. 29AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Business Name Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Company / Legal Entity Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Manufacturing Pvt Ltd"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2', color: '#DC2626',
                padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 16,
              }}>
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleStartCheckout}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: isProcessing ? '#94A3B8' : '#FF5500',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: 15,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {isProcessing ? 'Processing Order...' : `Pay ${formatPrice(billing === 'yearly' ? activeCheckoutPlan.yearlyPrice : activeCheckoutPlan.monthlyPrice)} via Razorpay`}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Trust Row */}
      <div style={{
        textAlign: 'center', paddingBottom: 60,
        color: '#64748B', fontSize: 13,
      }}>
        <p>All plans include statutory GST B2B invoices and a 7-day grace period. Cancel anytime.</p>
      </div>
    </div>
  );
}
