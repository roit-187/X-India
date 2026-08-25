import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.error(
    '[admin-login] NEXT_PUBLIC_API_URL is not set — falling back to http://localhost:5000. ' +
    'Set this explicitly in production; requests will simply fail (not silently authenticate) if the backend is unreachable.'
  );
}

export async function POST(request) {
  try {
    const body = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (clientIp) headers['X-Forwarded-For'] = clientIp;

    let res;
    let data;
    try {
      res = await fetch(`${API_URL}/api/v1/admin/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      data = await res.json();
    } catch (netErr) {
      console.error(`[admin-login] Backend at ${API_URL} unreachable or returned a non-JSON response:`, netErr.message);
      return Response.json({ success: false, message: 'Authentication service unavailable. Please try again shortly.' }, { status: 502 });
    }

    if (data.success && data.token) {
      cookies().set('admin_token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 8 * 60 * 60, // 8 hours
      });
    }

    // Strip the raw JWT from the client response — it's stored HttpOnly.
    // Return the admin profile (role, username, permissions) so the frontend
    // can persist it for role-based UI without decoding the cookie.
    const { token: _token, ...rest } = data;
    return Response.json(rest, { status: res.status });
  } catch (err) {
    return Response.json({ success: false, message: 'Authentication request failed' }, { status: 500 });
  }
}
