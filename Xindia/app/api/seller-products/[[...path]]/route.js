import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { isSafePathSegments } from '@/lib/safePathSegments';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET;
const encodedSecret = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    '[seller-products proxy] NEXT_PUBLIC_API_URL is not set — falling back to http://localhost:5000. ' +
    'Set this explicitly in production; requests will simply fail (not silently succeed) if the backend is unreachable.'
  );
}
if (!JWT_SECRET) {
  console.error('[seller-products proxy] JWT_SECRET is not set — every request will be rejected as unauthenticated.');
}

async function proxy(request, { params }) {
  const token = cookies().get('seller_token')?.value;
  if (!token || !encodedSecret) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  let sellerId;
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    sellerId = payload.id;
    if (!sellerId) throw new Error('Token has no id claim');
  } catch (err) {
    return Response.json({ success: false, message: 'Invalid or expired session' }, { status: 401 });
  }

  if (params.path && !isSafePathSegments(params.path)) {
    return Response.json({ success: false, message: 'Invalid path' }, { status: 400 });
  }
  const path = params.path ? params.path.join('/') : '';

  // GET /api/products is a public, unauthenticated endpoint that trusts
  // whatever ?sellerId= it's given — it's used elsewhere (public manufacturer
  // profile pages) to show one seller's live catalog to any visitor. This
  // portal's product list is meant to show only the logged-in seller their
  // OWN full catalog (including drafts), so sellerId is derived here from the
  // verified token rather than trusted from the client — the page previously
  // sourced it from localStorage, which any seller could edit to browse a
  // competitor's unpublished products through this proxy.
  const search = new URLSearchParams(request.nextUrl.search);
  if (request.method === 'GET' && !path) {
    search.set('sellerId', sellerId);
  }
  const searchString = search.toString();
  const targetUrl = `${API_URL}/api/products${path ? '/' + path : ''}${searchString ? '?' + searchString : ''}`;

  const init = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}` },
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      init.body = await request.formData();
    } else {
      init.headers['Content-Type'] = 'application/json';
      init.body = await request.text();
    }
  }

  try {
    const res = await fetch(targetUrl, init);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (netErr) {
    console.error(`[seller-products proxy] Backend at ${targetUrl} unreachable or returned a non-JSON response:`, netErr.message);
    return Response.json({ success: false, message: 'Product service unavailable. Please try again shortly.' }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
