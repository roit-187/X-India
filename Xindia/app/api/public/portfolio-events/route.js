import { API_URL } from '@/lib/api';

export async function POST(request) {
  try {
    const payload = await request.json();
    const response = await fetch(`${API_URL}/api/public/portfolio-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({ success: false }));
    return Response.json(result, { status: response.status });
  } catch {
    return Response.json({ success: false, message: 'Event could not be recorded.' }, { status: 502 });
  }
}
