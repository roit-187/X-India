import { NextResponse } from 'next/server';

// Protected pages must never be served from the browser's back/forward cache
// after logout — otherwise pressing "back" shows the stale authenticated page
// instead of re-running this middleware.
function noStore(response) {
  response.headers.set('Cache-Control', 'no-store, must-revalidate');
  return response;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get('admin_token')?.value;
  const sellerToken = request.cookies.get('seller_token')?.value;

  if (pathname.startsWith('/admin')) {
    if (!adminToken) {
      return noStore(NextResponse.redirect(new URL('/login?tab=admin', request.url)));
    }
    return noStore(NextResponse.next());
  }

  if (pathname.startsWith('/seller-portal')) {
    if (!sellerToken) {
      return noStore(NextResponse.redirect(new URL('/login?tab=seller', request.url)));
    }
    return noStore(NextResponse.next());
  }

  // Already logged in: sending a user back to the landing page or the login
  // form should drop them straight into their portal instead of re-prompting.
  if (pathname === '/' || pathname === '/login') {
    if (adminToken) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (sellerToken) {
      return NextResponse.redirect(new URL('/seller-portal/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/seller-portal/:path*', '/', '/login'],
};
