const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET() {
  try {
    let res = await fetch(`${API_URL}/api/v1/admin/system/config`, {
      next: { revalidate: 30 }, // cache for 30s
    });
    if (!res.ok) {
      res = await fetch(`${API_URL}/api/system/config`, {
        next: { revalidate: 30 },
      });
    }
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
      serverApiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://ascend-ds0q.onrender.com',
      websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://xindia.live',
      isMaintenanceMode: false,
      socialLinks: [],
      appVersionPolicy: {
        minSupportedVersion: '1.0.0',
        latestVersion: '1.0.0',
        forceUpdateTitle: 'Update Required',
        forceUpdateMessage: 'A critical update is required to continue using XINDIA. Please update from the Google Play Store.',
        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.xindia.marketplace',
      },
    },
  });
}
