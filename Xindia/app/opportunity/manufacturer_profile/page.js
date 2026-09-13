import { redirect } from 'next/navigation';
import { getSeller } from '@/lib/api';

export default async function OpportunityManufacturerRedirect({ searchParams }) {
  const sellerId = searchParams?.sellerId;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  if (sellerId) {
    try {
      // 1. Check public seller lookup first (supports slug, ObjectId, userId)
      const seller = await getSeller(sellerId);
      if (seller?.slug) {
        redirect(`/p/${seller.slug}`);
      }

      // 2. Fallback to map discovery endpoint
      const res = await fetch(`${API_URL}/api/v1/manufacturers/${sellerId}`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = await res.json();
        const m = data?.data?.manufacturer || data?.data;
        if (m?.slug) {
          redirect(`/p/${m.slug}`);
        }
      }
    } catch (err) {
      if (err.message === 'NEXT_REDIRECT') throw err;
    }
  }

  redirect('/');
}
