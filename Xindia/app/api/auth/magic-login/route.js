import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const plan = searchParams.get('plan') || 'growth';
    const cycle = searchParams.get('cycle') || 'yearly';

    if (!token) {
      return Response.redirect(new URL('/login?error=missing_token', request.url), 302);
    }

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (clientIp) headers['X-Forwarded-For'] = clientIp;

    let res;
    let data;
    try {
      res = await fetch(`${API_URL}/api/seller/auth/verify-magic-token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ token }),
      });
      data = await res.json();
    } catch (netErr) {
      console.error(`[magic-login] Backend at ${API_URL} unreachable:`, netErr.message);
      return Response.redirect(new URL('/login?error=service_unavailable', request.url), 302);
    }

    if (data.success && data.token) {
      cookies().set('seller_token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60,
      });

      const targetPlan = data.planKey || plan;
      const targetCycle = data.billingCycle || cycle;
      const redirectUrl = new URL(`/pricing?selected=${encodeURIComponent(targetPlan)}&cycle=${encodeURIComponent(targetCycle)}&auth=success`, request.url);
      return Response.redirect(redirectUrl, 302);
    }

    return Response.redirect(new URL(`/login?error=${encodeURIComponent(data.message || 'invalid_link')}`, request.url), 302);
  } catch (err) {
    console.error('[magic-login handler error]', err);
    return Response.redirect(new URL('/login?error=server_error', request.url), 302);
  }
}
