import { cookies } from 'next/headers';
import { isSafePathSegments } from '@/lib/safePathSegments';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    '[admin proxy] NEXT_PUBLIC_API_URL is not set — falling back to http://localhost:5000. ' +
    'Set this explicitly in production; requests will simply fail (not silently succeed) if the backend is unreachable.'
  );
}

async function proxy(request, { params }) {
  const token = cookies().get('admin_token')?.value;
  if (!token) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  // [SEC-LOW-03] CSRF: verify the request originates from the same host on mutating methods.
  // The Origin (or fallback Referer) header is checked dynamically against the incoming request's host.
  // Browsers always set at least one of them for same-site + cross-site fetch/form requests.
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    const source = originHeader || refererHeader;
    if (source) {
      try {
        const sourceHost = new URL(source).host;
        const currentHost =
          request.headers.get('x-forwarded-host') ||
          request.headers.get('host') ||
          request.nextUrl?.host;

        if (currentHost && sourceHost !== currentHost) {
          console.warn(`[admin proxy] CSRF: blocked request from ${sourceHost} (expected ${currentHost})`);
          return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }
      } catch {
        return Response.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }
    // No Origin/Referer from a browser means it's a server-side call — allow.
  }

  if (!isSafePathSegments(params.path)) {
    return Response.json({ success: false, message: 'Invalid path' }, { status: 400 });
  }
  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/v1/admin/${path}${search}`;

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
    console.error(`[admin proxy] Backend at ${targetUrl} unreachable or returned a non-JSON response:`, netErr.message);
    return Response.json({ success: false, message: 'Admin service unavailable. Please try again shortly.' }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
