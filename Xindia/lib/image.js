import { API_URL } from './api';

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop';
export const FALLBACK_FACTORY_IMAGE =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop';
export const FALLBACK_LOGO_IMAGE =
  'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=200&auto=format&fit=crop';

/**
 * Safely resolves image paths to complete, loadable URLs.
 * Handles:
 * - Objects with .url, .secure_url, .path
 * - Full http:// or https:// URLs (including Cloudinary, Unsplash, etc.)
 * - Insecure http://res.cloudinary.com URLs upgraded to https://
 * - Local server relative paths (/uploads/...) prepended with API_URL
 * - Windows-style backslashes
 * - Fallbacks for empty/broken values
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
