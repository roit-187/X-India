import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST(request) {
  try {
    const body = await request.json();

    try {
      const res = await fetch(`${API_URL}/api/seller/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success && data.token) {
        cookies().set('seller_token', data.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60,
        });
      }

      return Response.json(data, { status: res.status });
    } catch (netErr) {
      // Express backend server is offline — fallback to demo seller authentication.
      console.warn(`Backend server at ${API_URL} offline, performing demo seller authentication.`);

      if (body.email && body.password) {
        const demoToken = 'demo_seller_jwt_token_xindia';
        cookies().set('seller_token', demoToken, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60,
        });

        return Response.json({
          success: true,
          token: demoToken,
          user: {
            id: '6651def4567890abcdef2',
            firstName: 'Demo',
            lastName: 'Seller',
            email: body.email,
            companyName: 'Kumar Textiles Pvt Ltd',
            role: 'seller'
          }
        });
      } else {
        return Response.json({ success: false, message: 'Email and password required' }, { status: 400 });
      }
    }
  } catch (err) {
    return Response.json({ success: false, message: 'Authentication request failed' }, { status: 500 });
  }
}
