import { API_URL } from './api';

/**
 * Safely resolves image paths to complete, loadable URLs.
 * Handles:
 * - Objects with .url, .secure_url, .path
 * - Full http:// or https:// URLs (including Cloudinary, Unsplash, etc.)
 * - Insecure http://res.cloudinary.com URLs upgraded to https://
 * - Local server relative paths (/uploads/...) prepended with API_URL
 * - Windows-style backslashes
 * - Empty values when no seller-provided image exists
 */
export function resolveImageUrl(path, fallback = '') {
  if (!path) return fallback;

  // Extract from nested object if applicable
  if (typeof path === 'object' && path !== null) {
    path = path.url || path.secure_url || path.path || path.src || '';
    if (!path) return fallback;
  }

  const str = String(path).trim();
  if (!str) return fallback;

  // Data URLs and Blobs
  if (str.startsWith('data:') || str.startsWith('blob:')) {
    return str;
  }

  // Ensure Cloudinary uses secure HTTPS
  if (str.startsWith('http://res.cloudinary.com')) {
    return str.replace('http://', 'https://');
  }

  // Absolute URLs
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return str;
  }

  // Server relative paths (e.g. /uploads/... or uploads/...)
  const cleanPath = str.replace(/\\/g, '/');
  const base = (API_URL || 'http://localhost:5000').replace(/\/+$/, '');
  const rel = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${base}${rel}`;
}
