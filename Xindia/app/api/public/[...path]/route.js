import { isSafePathSegments } from '@/lib/safePathSegments';

const API_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.xindia.live';

async function proxy(request, { params }) {
  if (!isSafePathSegments(params.path)) {
    return Response.json({ success: false, message: 'Invalid path' }, { status: 400 });
  }

  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/public/${path}${search}`;

  const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
  const headers = {};
  if (clientIp) headers['X-Forwarded-For'] = clientIp;

  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const init = {
    method: request.method,
    headers,
  };

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      init.body = await request.text();
    } catch (_) {}
  }

  try {
    const res = await fetch(targetUrl, init);
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error(`[public proxy] Error proxying ${request.method} /api/public/${path}:`, err.message);
    return Response.json({ success: false, message: 'Service unavailable' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
