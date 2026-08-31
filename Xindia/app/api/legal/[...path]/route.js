const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function proxy(request, { params }) {
  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const targetUrl = `${API_URL}/api/v1/legal/${path}${search}`;

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (netErr) {
    console.error(`[legal proxy] Backend at ${targetUrl} unreachable:`, netErr.message);
    return Response.json({ success: false, message: 'Legal service unavailable. Please try again shortly.' }, { status: 502 });
  }
}

export { proxy as GET };
