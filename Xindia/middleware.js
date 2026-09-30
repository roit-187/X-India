import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Protected pages must never be served from the browser's back/forward cache
// after logout — otherwise pressing "back" shows the stale authenticated page
// instead of re-running this middleware.
function noStore(response, isSecuredAdmin = false) {
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  if (isSecuredAdmin) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
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
  const host = request.headers.get('host') || '';
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const source = origin || referer;
    if (source) {
      try {
        const sourceUrl = new URL(source);
        const allowedHosts = [
          host,
          'localhost:3000',
          'localhost:3001',
          'xindia.live',
          'www.xindia.live',
          'api.xindia.live',
          'admin.xindia.live',
        ];
        if (!allowedHosts.some(h => sourceUrl.host === h)) {
          console.warn(`[CSRF BLOCKED] Host mismatch: source=${sourceUrl.host}, expected=${host}`);
          return new NextResponse(JSON.stringify({ error: 'CSRF validation failed' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (_) {
        return new NextResponse(JSON.stringify({ error: 'Invalid request source' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  const { pathname } = request.nextUrl;
  const adminTokenRaw = request.cookies.get('admin_token')?.value;
  const sellerTokenRaw = request.cookies.get('seller_token')?.value;
  const isSubdomainAdmin = host.startsWith('admin.');

  // If accessing via admin subdomain directly at root or login, forward to admin dashboard or admin login
  if (isSubdomainAdmin && (pathname === '/' || pathname === '/login')) {
    const adminPayload = await verifyAdminToken(adminTokenRaw);
    if (adminPayload) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  // ── Admin Area Routing & Security Isolation ──
  if (pathname.startsWith('/admin')) {
    // Exempt /admin/login from the token requirement so admins can sign in
    if (pathname === '/admin/login') {
      const payload = await verifyAdminToken(adminTokenRaw);
      if (payload) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return noStore(NextResponse.next(), true);
    }

    const payload = await verifyAdminToken(adminTokenRaw);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('admin_token');
      return noStore(res, true);
    }

    // Restrict STAFF accounts from sensitive system, staff, plan, and credit administration pages
    // [SEC-FIX H-4] STAFF is blocked from these sensitive paths at the middleware
    // layer. The backend also enforces this via requireSuperAdmin(), but blocking
    // here prevents STAFF from even seeing sensitive UI data (e.g. support tickets).
    const ADMIN_ONLY_PATHS = [
      '/admin/staff',
      '/admin/settings',
      '/admin/plans',
      '/admin/credits',
      '/admin/payments',
      '/admin/legal',
      '/admin/alerts',
      '/admin/broadcast',
      '/admin/support',  // Support desk contains user PII — super admin only
    ];
    if (payload.role === 'STAFF' && ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    return noStore(NextResponse.next(), true);
  }

  // ── Staff Area Routing & Security Isolation ──
  if (pathname.startsWith('/staff')) {
    const payload = await verifyAdminToken(adminTokenRaw);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/admin/login', request.url));
      res.cookies.delete('admin_token');
      return noStore(res, true);
    }
    return noStore(NextResponse.next(), true);
  }

  // ── Seller Portal Routing ──
  if (pathname.startsWith('/seller-portal')) {
    const payload = await verifySellerToken(sellerTokenRaw);
    if (!payload) {
      const res = NextResponse.redirect(new URL('/login', request.url));
      res.cookies.delete('seller_token');
      return noStore(res);
    }
    return noStore(NextResponse.next());
  }

  // ── Already Logged In Redirection ──
  if (pathname === '/' || pathname === '/login') {
    const [adminPayload, sellerPayload] = await Promise.all([
      verifyAdminToken(adminTokenRaw),
      verifySellerToken(sellerTokenRaw),
    ]);
    if (adminPayload && pathname === '/login') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (sellerPayload && pathname === '/login') {
      return NextResponse.redirect(new URL('/seller-portal/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Guard admin, staff, seller portal, Next.js API route handlers, root, and login
  matcher: ['/admin/:path*', '/staff/:path*', '/seller-portal/:path*', '/api/:path*', '/', '/login'],
};
