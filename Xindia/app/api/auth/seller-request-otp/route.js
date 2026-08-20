import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  try {
    const body = await request.json();

    let res;
    let data;
    try {
      res = await fetch(`${API_URL}/api/seller/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      data = await res.json();
    } catch (netErr) {
      console.error(`[seller-request-otp] Backend at ${API_URL} unreachable:`, netErr.message);
      return Response.json({ success: false, message: 'Authentication service unavailable. Please try again shortly.' }, { status: 502 });
    }

    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ success: false, message: 'OTP request failed' }, { status: 500 });
  }
}
