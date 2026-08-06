import { cookies } from 'next/headers';

export async function POST() {
  cookies().delete('admin_token');
  cookies().delete('seller_token');
  return Response.json({ success: true });
}
