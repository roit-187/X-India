/**
 * Utility functions for parsing, validating, and formatting YouTube URLs.
 */

// Whitelisted YouTube hostnames (owned and operated by YouTube / Google)
const ALLOWED_YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Extracts YouTube Video ID safely from validated YouTube URLs or raw IDs.
 * Strictly prevents phishing links, substring domain spoofing, and pseudo-schemes (javascript:, data:).
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID (Official YouTube share link)
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - Raw 11-character video ID
 *
 * @param {string} url - YouTube URL or ID
 * @returns {string|null} - 11-character YouTube video ID or null if invalid
 */
export function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Raw 11-character alphanumeric/dash/underscore ID
  if (!trimmed.includes('.') && !trimmed.includes('/') && YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  // 2. Parse via standard URL parser
  let urlObj;
  try {
    urlObj = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  // Enforce HTTP / HTTPS schemes only (blocks javascript:, data:, file:)
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return null;
  }

  const host = urlObj.hostname.toLowerCase();
  if (!ALLOWED_YOUTUBE_HOSTS.has(host)) {
    return null;
  }

  // Handle youtu.be/<id>
  if (host === 'youtu.be') {
    const id = urlObj.pathname.slice(1).split('/')[0]?.split('?')[0];
    return id && YOUTUBE_ID_REGEX.test(id) ? id : null;
  }

  // Handle youtube.com/watch?v=<id>
  if (urlObj.pathname === '/watch') {
    const v = urlObj.searchParams.get('v');
    return v && YOUTUBE_ID_REGEX.test(v) ? v : null;
  }

  // Handle /embed/<id>, /shorts/<id>, /v/<id>, /live/<id>
  const pathMatch = urlObj.pathname.match(/^\/(?:embed|shorts|v|live)\/([a-zA-Z0-9_-]{11})(?:\/|$)/);
  if (pathMatch && YOUTUBE_ID_REGEX.test(pathMatch[1])) {
    return pathMatch[1];
  }

  return null;
}

/**
 * Checks if a given string is a valid YouTube URL or ID.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  return Boolean(extractYouTubeId(url));
}

/**
 * Converts any valid YouTube link or ID into a canonical, safe YouTube watch URL.
 * Strips all tracking query parameters, redirects, or extraneous fragments.
 *
 * @param {string} url
 * @returns {string|null} - Canonical URL: "https://www.youtube.com/watch?v=VIDEO_ID" or null
 */
export function canonicalizeYouTubeUrl(url) {
  const videoId = extractYouTubeId(url);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

/**
 * Generates an optimized YouTube embed URL.
 *
 * @param {string} videoIdOrUrl
 * @param {object} options
 * @param {boolean} [options.autoplay=false]
 * @param {boolean} [options.rel=false] - Show related videos from same channel only
 * @param {boolean} [options.modestbranding=true]
 * @returns {string|null}
 */
export function getYouTubeEmbedUrl(videoIdOrUrl, { autoplay = false, rel = false, modestbranding = true } = {}) {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return null;

  const params = new URLSearchParams({
    rel: rel ? '1' : '0',
    modestbranding: modestbranding ? '1' : '0',
    playsinline: '1',
    enablejsapi: '1',
  });

  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Generates the URL for the YouTube video thumbnail.
 *
 * @param {string} videoIdOrUrl
 * @param {'maxresdefault'|'hqdefault'|'mqdefault'|'default'} [quality='hqdefault']
 * @returns {string|null}
 */
export function getYouTubeThumbnailUrl(videoIdOrUrl, quality = 'hqdefault') {
  const videoId = extractYouTubeId(videoIdOrUrl);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Checks if a given URL is a direct video file (e.g. .mp4, Cloudinary).
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isDirectVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('.mp4') ||
    lower.includes('.webm') ||
    lower.includes('.ogg') ||
    lower.includes('.mov') ||
    lower.includes('res.cloudinary.com')
  );
}
