import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Protected pages must never be served from the browser's back/forward cache
// after logout — otherwise pressing "back" shows the stale authenticated page
// instead of re-running this middleware.
function noStore(response) {
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
}

// Must match the backend's JWT_SECRET exactly — these tokens are issued by
// the Express API (AdminAuthService / signToken) and verified here.
const JWT_SECRET = process.env.JWT_SECRET;
const encodedSecret = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

if (!JWT_SECRET) {
  console.error(
    '[middleware] JWT_SECRET is not set — admin/seller-portal routes will treat every request as unauthenticated.'
  );
}

// Verifies signature + expiry and confirms this is actually an admin-issued
// token (type: 'ADMIN'), not a seller/buyer token reused against /admin.
async function verifyAdminToken(token) {
  if (!encodedSecret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (payload.type !== 'ADMIN') return null;
    return payload;
  } catch {
    return null;
  }
}

// Seller/buyer tokens carry no role claim (see requireAuth.middleware.js
// signToken) — this only proves the token is validly signed and unexpired.
// It is a UX-layer gate, not the security boundary: every backend route
// under /api/seller/* re-verifies the token AND checks role === 'seller'
// authoritatively (requireAuth + requireSeller), so a buyer token still
// can't do anything here even though it passes this check.
async function verifySellerToken(token) {
  if (!encodedSecret || !token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (payload.type === 'ADMIN') return null; // reject admin tokens explicitly
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request) {
  // ── CSRF protection: reject cross-origin state-changing requests ──
  const method = request.method;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin) {
      const originUrl = new URL(origin);
      const allowedOrigins = [host, 'localhost:3000', 'localhost:3001'];
      if (!allowedOrigins.some(h => originUrl.host === h)) {
        return new NextResponse(JSON.stringify({ error: 'CSRF validation failed' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const { pathname } = request.nextUrl;
  const adminTokenRaw = request.cookies.get('admin_token')?.value;
  const sellerTokenRaw = request.cookies.get('seller_token')?.value;

  if (pathname.startsWith('/admin')) {
    const payload = await verifyAdminToken(adminTokenRaw);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login?tab=admin', request.url));
      res.cookies.delete('admin_token');
      return noStore(res);
    }
    // Restrict STAFF accounts from sensitive system, staff, plan, and credit administration pages
    const ADMIN_ONLY_PATHS = ['/admin/staff', '/admin/settings', '/admin/plans', '/admin/credits'];
    if (payload.role === 'STAFF' && ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return noStore(NextResponse.next());
  }

  if (pathname.startsWith('/seller-portal')) {
    const payload = await verifySellerToken(sellerTokenRaw);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login?tab=seller', request.url));
      res.cookies.delete('seller_token');
      return noStore(res);
    }
    return noStore(NextResponse.next());
  }

  // Already logged in: sending a user back to the landing page or the login
  // form should drop them straight into their portal instead of re-prompting.
  if (pathname === '/' || pathname === '/login') {
    const [adminPayload, sellerPayload] = await Promise.all([
      verifyAdminToken(adminTokenRaw),
      verifySellerToken(sellerTokenRaw),
    ]);
    if (adminPayload) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (sellerPayload) {
      return NextResponse.redirect(new URL('/seller-portal/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/seller-portal/:path*', '/', '/login'],
};
