import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function adminFetch(path, options = {}) {
  const token = cookies().get('admin_token')?.value;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
    cache: 'no-store',
  });
  return res.json();
}
