import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Pinged by the backend's POST /api/seller/portfolio/publish and /unpublish
// so an edited seller page reflects faster than the hourly ISR window.
export async function POST(request) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || !secret || !safeEqual(secret, process.env.REVALIDATE_SECRET)) {
    return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { slug } = body;
  if (!slug) {
    return NextResponse.json({ success: false, message: 'slug is required' }, { status: 400 });
  }

  revalidatePath(`/p/${slug}`, 'layout');
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ success: true, revalidated: true, slug });
}
