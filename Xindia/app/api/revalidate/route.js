import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

// [SEC-LOW-02] In-memory rate limiter — 20 requests/minute per IP.
const rlStore = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 20;
  const entry = rlStore.get(ip);
  if (!entry || entry.expiresAt <= now) {
    rlStore.set(ip, { count: 1, expiresAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > limit;
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// [SEC-LOW-02] Validate slug is a simple URL-safe path segment.
// Prevents path-traversal payloads like "../../admin" from reaching revalidatePath.
const SAFE_SLUG_RE = /^[\w-]{1,200}$/;

// Pinged by the backend's POST /api/seller/portfolio/publish and /unpublish
// so an edited seller page reflects faster than the hourly ISR window.
export async function POST(request) {
  // Rate limit by IP (X-Forwarded-For set by Vercel / reverse proxy)
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: 'Rate limit exceeded. Retry after 60 seconds.' },
      { status: 429 }
    );
  }

  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || !secret || !safeEqual(secret, process.env.REVALIDATE_SECRET)) {
    return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { slug } = body;
  if (!slug) {
    return NextResponse.json({ success: false, message: 'slug is required' }, { status: 400 });
  }

  // [SEC-LOW-02] Reject slugs that contain slashes, dots, or other traversal chars
  if (!SAFE_SLUG_RE.test(slug)) {
    return NextResponse.json(
      { success: false, message: 'Invalid slug format' },
      { status: 400 }
    );
  }

  revalidatePath(`/p/${slug}`, 'layout');
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ success: true, revalidated: true, slug });
}
