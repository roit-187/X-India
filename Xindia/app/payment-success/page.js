'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('razorpay_payment_id') || searchParams.get('payment_id') || searchParams.get('link_id') || '';
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    // Attempt to open the XIndia mobile app via custom URL scheme
    try {
      const appDeepLink = `xindia://payment-success?payment_id=${encodeURIComponent(paymentId)}`;
      window.location.href = appDeepLink;
    } catch (_) {}
  }, [paymentId]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0F172A',
      color: '#FFFFFF',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Animated Green Badge */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '2px solid #10B981',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)',
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Payment Successful!
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.5', marginBottom: '28px' }}>
          Thank you for choosing XIndia. Your transaction has been securely confirmed and your services are activated.
        </p>

        {paymentId && (
          <div style={{
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '28px',
            textAlign: 'left',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Reference ID {isMock ? '(Sandbox)' : ''}
            </div>
            <div style={{ fontSize: '14px', color: '#F1F5F9', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {paymentId}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <a
            href={`xindia://payment-success?payment_id=${encodeURIComponent(paymentId)}`}
            style={{
              display: 'block',
              backgroundColor: '#E8581C',
              color: '#FFFFFF',
              fontWeight: '700',
              fontSize: '15px',
              padding: '14px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            Return to XIndia App
          </a>

          <Link
            href="/"
            style={{
              display: 'block',
              backgroundColor: 'transparent',
              color: '#94A3B8',
              fontWeight: '600',
              fontSize: '14px',
              padding: '12px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            Visit Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A', color: '#FFF' }}>
        Loading confirmation...
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
