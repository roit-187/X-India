const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/system/config`, {
      next: { revalidate: 30 }, // cache for 30s
    });
    if (res.ok) {
      const data = await res.json();
      return Response.json(data);
    }
  } catch (err) {
    console.error('[system config route error]', err.message);
  }

  // Fallback defaults if backend is restarting
  return Response.json({
    success: true,
    config: {
      serverApiUrl: 'https://ascend-ds0q.onrender.com',
      websiteUrl: 'https://x-india.vercel.app',
      isMaintenanceMode: false,
    },
  });
}
