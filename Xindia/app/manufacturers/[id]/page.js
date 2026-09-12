import { redirect, notFound } from 'next/navigation';
import { getSeller } from '@/lib/api';

export default async function ManufacturerRedirectPage({ params }) {
  const { id } = params;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  try {
    // 1. First check if id is actually already a slug
    const directSeller = await getSeller(id);
    if (directSeller?.slug) {
      redirect(`/p/${directSeller.slug}`);
    }

    // 2. Otherwise look up by MongoDB ID
    const res = await fetch(`${API_URL}/api/v1/manufacturers/${id}`, {
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
    // If redirect was called, next.js throws a NEXT_REDIRECT error which must be rethrown
    if (err.message === 'NEXT_REDIRECT') throw err;
  }

  // Fallback if not found
  redirect('/');
}
