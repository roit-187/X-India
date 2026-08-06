import Link from 'next/link';

export default function SellerNotFound() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Seller Not Found</h1>
      <p style={{ fontSize: 14, color: '#64748B', marginBottom: 20 }}>
        This portfolio doesn&apos;t exist, or the seller hasn&apos;t published it yet.
      </p>
      <Link href="/" style={{ color: '#1B6BFF', fontWeight: 700, fontSize: 14 }}>← Back to XINDIA</Link>
    </div>
  );
}
