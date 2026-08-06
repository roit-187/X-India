import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function POST() {
  const adminToken = cookies().get('admin_token')?.value;

  if (adminToken) {
    // Best-effort server-side session revocation — invalidates this token
    // (and any other still-live token for the same admin) immediately,
    // instead of leaving it valid for up to 8h if it were ever copied/leaked.
    try {
      await fetch(`${API_URL}/api/v1/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    } catch (err) {
      console.error('[logout] Failed to revoke admin session server-side:', err.message);
    }
  }

  cookies().delete('admin_token');
  cookies().delete('seller_token');
  return Response.json({ success: true });
}
