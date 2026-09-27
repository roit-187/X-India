const BACKEND_URL = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.xindia.live';

export async function POST(request) {
  try {
    const body = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';

    const headers = { 'Content-Type': 'application/json' };
    if (clientIp) {
      headers['X-Forwarded-For'] = clientIp;
    }

    const res = await fetch(`${BACKEND_URL}/api/auth/web-deletion/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    console.error('[web-deletion confirm proxy error]:', err.message);
    return Response.json(
      { success: false, message: 'Account deletion service temporarily unavailable.' },
      { status: 502 }
    );
  }
}
