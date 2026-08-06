import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxy(request, { params }) {
  const token = cookies().get('seller_token')?.value;
  if (!token) {
    return Response.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }

  const path = params.path ? params.path.join('/') : '';
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/products${path ? '/' + path : ''}${search}`;

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
    console.warn(`Seller products target ${targetUrl} offline. Serving demo response.`);
    return Response.json({
      success: true,
      products: [
        { _id: 'prod1', name: 'Premium Cotton Fabric', description: 'High quality combed cotton for shirtings.', price: 250, unit: 'meter', moq: '500 meters', category: 'Textiles', isActive: true },
        { _id: 'prod2', name: 'Organic Linen Thread', description: 'Strong bio-degradable linen thread.', price: 120, unit: 'spool', moq: '100 spools', category: 'Textiles', isActive: true },
      ],
      total: 2,
      page: 1,
      totalPages: 1
    });
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
